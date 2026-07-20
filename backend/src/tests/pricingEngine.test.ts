import { describe, it, expect } from 'vitest'
import {
  PricingError,
  computeInvoice,
  estimateBaseAmount,
  parseFee,
  resolveRateCard,
  roundMoney,
} from '../utils/pricingEngine'

const CLASS_ID = 'class1'
const MATH = 'sub-math'
const PHYS = 'sub-phys'

const catalogClass = {
  basePrice: '500',
  subjects: [
    { subjectId: MATH, price: 300 },
    { subjectId: PHYS, price: 250 },
  ],
}

const mentorSelectedClass = {
  price: 800,
  subject: [
    { subject_id: MATH, subject_price: 450 },
    { subject_id: PHYS, subject_price: 400 },
  ],
}

describe('pricingEngine', () => {
  describe('parseFee', () => {
    it('parses numeric strings (Classes.basePrice is a String)', () => {
      expect(parseFee('500')).toBe(500)
      expect(parseFee('1,200')).toBe(1200)
      expect(parseFee('₹350')).toBe(350)
      expect(parseFee(250)).toBe(250)
    })

    it('rejects unparseable / negative values', () => {
      expect(() => parseFee('abc')).toThrow(PricingError)
      expect(() => parseFee('')).toThrow(PricingError)
      expect(() => parseFee(-5)).toThrow(PricingError)
      expect(() => parseFee(null)).toThrow(PricingError)
    })
  })

  describe('resolveRateCard', () => {
    it('full + custom fee → mentor per-class price', () => {
      const card = resolveRateCard({
        bookingType: 'full',
        customFeeEnabled: true,
        mentorSelectedClass,
        catalogClass,
        selectedSubjectIds: [],
      })
      expect(card).toMatchObject({ source: 'custom', perClassFee: 800 })
    })

    it('full + default → catalog basePrice (string parsed)', () => {
      const card = resolveRateCard({
        bookingType: 'full',
        customFeeEnabled: false,
        mentorSelectedClass,
        catalogClass,
        selectedSubjectIds: [],
      })
      expect(card).toMatchObject({ source: 'default', perClassFee: 500 })
    })

    it('custom_fee_enabled without mentor rates falls back to default', () => {
      const card = resolveRateCard({
        bookingType: 'full',
        customFeeEnabled: true,
        mentorSelectedClass: null,
        catalogClass,
        selectedSubjectIds: [],
      })
      expect(card).toMatchObject({ source: 'default', perClassFee: 500 })
    })

    it('individual resolves the one selected subject rate', () => {
      const custom = resolveRateCard({
        bookingType: 'individual',
        customFeeEnabled: true,
        mentorSelectedClass,
        catalogClass,
        selectedSubjectIds: [MATH],
        subjectNames: { [MATH]: 'Maths' },
      })
      expect(custom.subjectRates).toEqual([
        { subjectId: MATH, name: 'Maths', hourlyRate: 450 },
      ])
      const fallback = resolveRateCard({
        bookingType: 'individual',
        customFeeEnabled: false,
        mentorSelectedClass,
        catalogClass,
        selectedSubjectIds: [MATH],
      })
      expect(fallback.subjectRates[0].hourlyRate).toBe(300)
    })

    it('multiple resolves every selected subject', () => {
      const card = resolveRateCard({
        bookingType: 'multiple',
        customFeeEnabled: false,
        mentorSelectedClass: null,
        catalogClass,
        selectedSubjectIds: [MATH, PHYS],
      })
      expect(card.subjectRates.map((r) => r.hourlyRate)).toEqual([300, 250])
    })

    it('throws MISSING_SUBJECT_RATE when a subject has no configured fee', () => {
      expect(() =>
        resolveRateCard({
          bookingType: 'multiple',
          customFeeEnabled: false,
          mentorSelectedClass: null,
          catalogClass,
          selectedSubjectIds: [MATH, 'sub-unknown'],
        })
      ).toThrow(PricingError)
    })

    it('throws BAD_BASE_PRICE on a garbage catalog basePrice', () => {
      expect(() =>
        resolveRateCard({
          bookingType: 'full',
          customFeeEnabled: false,
          mentorSelectedClass: null,
          catalogClass: { ...catalogClass, basePrice: 'call us' },
          selectedSubjectIds: [],
        })
      ).toThrow(PricingError)
    })
  })

  describe('computeInvoice', () => {
    it('full: #sessions × per-class fee', () => {
      const { lineItems, total } = computeInvoice({
        bookingType: 'full',
        rateCard: { source: 'default', perClassFee: 500, subjectRates: [] },
        sessions: [
          { _id: 's1', durationMinutes: 60 },
          { _id: 's2', durationMinutes: 90 },
          { _id: 's3', durationMinutes: 45 },
        ],
      })
      expect(total).toBe(1500)
      expect(lineItems).toHaveLength(1)
      expect(lineItems[0]).toMatchObject({
        quantity: 3,
        unit: 'session',
        rate: 500,
        amount: 1500,
        sessionIds: ['s1', 's2', 's3'],
      })
    })

    it('full with zero sessions → empty invoice', () => {
      const { lineItems, total } = computeInvoice({
        bookingType: 'full',
        rateCard: { source: 'default', perClassFee: 500, subjectRates: [] },
        sessions: [],
      })
      expect(total).toBe(0)
      expect(lineItems).toHaveLength(0)
    })

    it('individual: completed hours × hourly rate (minute-accurate)', () => {
      const { lineItems, total } = computeInvoice({
        bookingType: 'individual',
        rateCard: {
          source: 'custom',
          perClassFee: null,
          subjectRates: [{ subjectId: MATH, name: 'Maths', hourlyRate: 450 }],
        },
        // 90 + 45 = 135 min = 2.25 hr × 450 = 1012.50
        sessions: [
          { _id: 's1', durationMinutes: 90, subjectId: MATH },
          { _id: 's2', durationMinutes: 45, subjectId: null },
        ],
      })
      expect(total).toBe(1012.5)
      expect(lineItems[0]).toMatchObject({ quantity: 2.25, unit: 'hour' })
    })

    it('rounds money to paise (no float drift)', () => {
      const { total } = computeInvoice({
        bookingType: 'individual',
        rateCard: {
          source: 'default',
          perClassFee: null,
          subjectRates: [{ subjectId: MATH, name: '', hourlyRate: 100 }],
        },
        sessions: [{ _id: 's1', durationMinutes: 50, subjectId: MATH }], // 83.333…
      })
      expect(total).toBe(83.33)
    })

    it('multiple: aggregated per-subject line items', () => {
      const { lineItems, total } = computeInvoice({
        bookingType: 'multiple',
        rateCard: {
          source: 'default',
          perClassFee: null,
          subjectRates: [
            { subjectId: MATH, name: 'Maths', hourlyRate: 300 },
            { subjectId: PHYS, name: 'Physics', hourlyRate: 250 },
          ],
        },
        sessions: [
          { _id: 's1', durationMinutes: 60, subjectId: MATH },
          { _id: 's2', durationMinutes: 60, subjectId: MATH },
          { _id: 's3', durationMinutes: 90, subjectId: PHYS },
        ],
      })
      // Maths 2h × 300 = 600; Physics 1.5h × 250 = 375
      expect(total).toBe(975)
      expect(lineItems).toHaveLength(2)
      const maths = lineItems.find((li) => li.subjectId === MATH)
      const phys = lineItems.find((li) => li.subjectId === PHYS)
      expect(maths).toMatchObject({ quantity: 2, amount: 600 })
      expect(phys).toMatchObject({ quantity: 1.5, amount: 375 })
    })

    it('multiple: session without a subject is unbillable', () => {
      expect(() =>
        computeInvoice({
          bookingType: 'multiple',
          rateCard: {
            source: 'default',
            perClassFee: null,
            subjectRates: [{ subjectId: MATH, name: '', hourlyRate: 300 }],
          },
          sessions: [{ _id: 's1', durationMinutes: 60, subjectId: null }],
        })
      ).toThrow(PricingError)
    })

    it('multiple: session for a subject missing from the card throws', () => {
      expect(() =>
        computeInvoice({
          bookingType: 'multiple',
          rateCard: {
            source: 'default',
            perClassFee: null,
            subjectRates: [{ subjectId: MATH, name: '', hourlyRate: 300 }],
          },
          sessions: [{ _id: 's1', durationMinutes: 60, subjectId: PHYS }],
        })
      ).toThrow(PricingError)
    })
  })

  describe('estimateBaseAmount', () => {
    it('full → per-class fee; hourly → summed rates', () => {
      expect(
        estimateBaseAmount('full', {
          source: 'default',
          perClassFee: 500,
          subjectRates: [],
        })
      ).toBe(500)
      expect(
        estimateBaseAmount('multiple', {
          source: 'default',
          perClassFee: null,
          subjectRates: [
            { subjectId: MATH, name: '', hourlyRate: 300 },
            { subjectId: PHYS, name: '', hourlyRate: 250 },
          ],
        })
      ).toBe(550)
    })
  })

  describe('roundMoney', () => {
    it('rounds to 2dp', () => {
      expect(roundMoney(10.005)).toBe(10.01)
      expect(roundMoney(83.3333)).toBe(83.33)
    })
  })
})
