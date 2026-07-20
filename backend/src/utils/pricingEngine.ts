/**
 * Server-side billing engine (SRD §2 — Class Type Billing Architecture).
 * Pure functions, no I/O — controllers/jobs load the docs and pass plain data.
 *
 * Billing rules:
 *   full        — fixed rate per class: total = #sessions × perClassFee
 *   individual  — hourly:               total = completed hours × hourly rate
 *   multiple    — aggregated hourly:    total = Σ (subject hours × subject rate)
 *
 * Rate resolution (SRD "Pricing Overrides"): if the tutor has
 * `custom_fee_enabled`, their own selected_class rates win; otherwise the
 * global catalog (Classes) fees apply. The resolved card is snapshotted onto
 * the booking at teacher-accept so later fee edits never reprice active
 * bookings.
 */

export type BillableBookingType = 'full' | 'individual' | 'multiple'

export type SubjectRate = {
  subjectId: string | null
  name: string
  hourlyRate: number
}

export type RateCard = {
  source: 'custom' | 'default'
  perClassFee: number | null // set for 'full'
  subjectRates: SubjectRate[] // set for 'individual' / 'multiple'
}

export type LineItem = {
  description: string
  subjectId: string | null
  sessionIds: string[]
  quantity: number // #sessions or hours (2dp)
  unit: 'session' | 'hour'
  rate: number
  amount: number
}

/** Typed error so controllers can 400/422 instead of 500. */
export class PricingError extends Error {
  code:
    | 'BAD_BASE_PRICE'
    | 'MISSING_SUBJECT_RATE'
    | 'MISSING_RATE_CARD'
    | 'UNBILLABLE_SESSION'
  constructor(code: PricingError['code'], message: string) {
    super(message)
    this.name = 'PricingError'
    this.code = code
  }
}

/** Round to 2 decimals (paise) without float drift. */
export const roundMoney = (n: number): number => Math.round(n * 100) / 100

/**
 * Parse a fee that may be stored as a string (Classes.basePrice is a String
 * in the schema). Rejects NaN / negative / empty.
 */
export const parseFee = (raw: string | number | null | undefined): number => {
  const n = typeof raw === 'string' ? parseFloat(raw.replace(/[₹,\s]/g, '')) : raw
  if (n === null || n === undefined || Number.isNaN(n) || n < 0) {
    throw new PricingError('BAD_BASE_PRICE', `Unparseable fee value: "${raw}"`)
  }
  return n
}

export type ResolveRateCardInput = {
  bookingType: BillableBookingType
  customFeeEnabled: boolean
  /** The mentor's own rates for the booked class (Auth.selected_class entry). */
  mentorSelectedClass?: {
    price: number
    subject: { subject_id: string; subject_price: number }[]
  } | null
  /** Global catalog fees for the booked class (Classes doc). */
  catalogClass: {
    basePrice: string | number
    subjects: { subjectId: string; price: number }[]
  }
  /** Subject ids the student picked (1 for individual, ≥1 for multiple). */
  selectedSubjectIds: string[]
  /** Optional id → display-name map for nicer line items / receipts. */
  subjectNames?: Record<string, string>
}

export const resolveRateCard = (input: ResolveRateCardInput): RateCard => {
  const {
    bookingType,
    customFeeEnabled,
    mentorSelectedClass,
    catalogClass,
    selectedSubjectIds,
    subjectNames = {},
  } = input

  const useCustom = customFeeEnabled && !!mentorSelectedClass
  const source: RateCard['source'] = useCustom ? 'custom' : 'default'

  if (bookingType === 'full') {
    const perClassFee = useCustom
      ? parseFee(mentorSelectedClass!.price)
      : parseFee(catalogClass.basePrice)
    return { source, perClassFee, subjectRates: [] }
  }

  // individual / multiple — one hourly rate per selected subject.
  const subjectRates: SubjectRate[] = selectedSubjectIds.map((id) => {
    const raw = useCustom
      ? mentorSelectedClass!.subject.find(
          (s) => String(s.subject_id) === String(id)
        )?.subject_price
      : catalogClass.subjects.find((s) => String(s.subjectId) === String(id))
          ?.price
    if (raw === undefined || raw === null) {
      throw new PricingError(
        'MISSING_SUBJECT_RATE',
        `No ${source} rate configured for subject ${subjectNames[id] ?? id}`
      )
    }
    return {
      subjectId: String(id),
      name: subjectNames[id] ?? '',
      hourlyRate: parseFee(raw),
    }
  })

  if (!subjectRates.length) {
    throw new PricingError(
      'MISSING_SUBJECT_RATE',
      'No subjects selected for an hourly-billed booking'
    )
  }
  return { source, perClassFee: null, subjectRates }
}

export type BillableSession = {
  _id: string
  durationMinutes: number
  subjectId?: string | null
}

export type ComputeInvoiceInput = {
  bookingType: BillableBookingType
  rateCard: RateCard
  sessions: BillableSession[]
}

/** Hours with 2dp for display; money is computed from minutes to avoid drift. */
const hoursOf = (minutes: number): number => Math.round((minutes / 60) * 100) / 100

export const computeInvoice = (
  input: ComputeInvoiceInput
): { lineItems: LineItem[]; total: number } => {
  const { bookingType, rateCard, sessions } = input

  if (bookingType === 'full') {
    if (rateCard.perClassFee === null || rateCard.perClassFee === undefined) {
      throw new PricingError('MISSING_RATE_CARD', 'Rate card has no per-class fee')
    }
    const quantity = sessions.length
    const amount = roundMoney(quantity * rateCard.perClassFee)
    const lineItems: LineItem[] = quantity
      ? [
          {
            description: `Classes conducted (${quantity} × ₹${rateCard.perClassFee})`,
            subjectId: null,
            sessionIds: sessions.map((s) => String(s._id)),
            quantity,
            unit: 'session',
            rate: rateCard.perClassFee,
            amount,
          },
        ]
      : []
    return { lineItems, total: amount }
  }

  // individual / multiple — group sessions by subject, one line item each.
  // For 'individual' every session bills at the single selected subject's rate.
  const groups = new Map<string, BillableSession[]>()
  for (const s of sessions) {
    const key =
      bookingType === 'individual'
        ? rateCard.subjectRates[0]?.subjectId ?? 'unknown'
        : String(s.subjectId ?? '')
    if (bookingType === 'multiple' && !s.subjectId) {
      throw new PricingError(
        'UNBILLABLE_SESSION',
        `Session ${s._id} has no subject — required for multiple-subject billing`
      )
    }
    const list = groups.get(key) ?? []
    list.push(s)
    groups.set(key, list)
  }

  const lineItems: LineItem[] = []
  for (const [subjectId, group] of groups) {
    const rate = rateCard.subjectRates.find(
      (r) => String(r.subjectId) === String(subjectId)
    )
    if (!rate) {
      throw new PricingError(
        'MISSING_SUBJECT_RATE',
        `No rate on the booking's rate card for subject ${subjectId}`
      )
    }
    const minutes = group.reduce((sum, s) => sum + s.durationMinutes, 0)
    const amount = roundMoney((rate.hourlyRate * minutes) / 60)
    lineItems.push({
      description: rate.name
        ? `${rate.name} — ${hoursOf(minutes)} hr × ₹${rate.hourlyRate}/hr`
        : `${hoursOf(minutes)} hr × ₹${rate.hourlyRate}/hr`,
      subjectId: rate.subjectId,
      sessionIds: group.map((s) => String(s._id)),
      quantity: hoursOf(minutes),
      unit: 'hour',
      rate: rate.hourlyRate,
      amount,
    })
  }

  const total = roundMoney(lineItems.reduce((sum, li) => sum + li.amount, 0))
  return { lineItems, total }
}

/**
 * Advisory number stored on Booking.totalAmount for metered bookings (shown
 * as "estimated"): the per-class fee for 'full', or the summed hourly rates
 * for hourly types. Real charges always come from computeInvoice.
 */
export const estimateBaseAmount = (
  bookingType: BillableBookingType,
  rateCard: RateCard
): number => {
  if (bookingType === 'full') return roundMoney(rateCard.perClassFee ?? 0)
  return roundMoney(
    rateCard.subjectRates.reduce((sum, r) => sum + r.hourlyRate, 0)
  )
}
