import { PricingError } from '../utils/pricingEngine'
import { resolveRatesForBooking } from '../utils/rateResolution'
import { mongooseIdValidator } from '../utils/validateFeilds'

/**
 * POST /api/booking/quote (STUDENT)
 * Server-side pricing preview for the booking wizard: resolves the rate card
 * (custom vs default fees) so clients never compute money themselves.
 * Body: { mentorId, classId, bookingType, selectedSubjects: string[] }
 */
export const quoteBookingController = async (req, res) => {
  try {
    const { mentorId, classId, bookingType } = req.body ?? {}
    const selectedSubjects: string[] = Array.isArray(req.body?.selectedSubjects)
      ? req.body.selectedSubjects.map(String)
      : []

    if (!mentorId || !mongooseIdValidator(mentorId)) {
      return res.status(400).json({ message: 'Valid mentorId is required' })
    }
    if (!classId || !mongooseIdValidator(classId)) {
      return res.status(400).json({ message: 'Valid classId is required' })
    }
    if (!['full', 'individual', 'multiple'].includes(bookingType)) {
      return res
        .status(400)
        .json({ message: 'bookingType must be full, individual or multiple' })
    }
    if (bookingType === 'individual' && selectedSubjects.length !== 1) {
      return res
        .status(400)
        .json({ message: 'Select exactly one subject for an individual booking' })
    }
    if (bookingType === 'multiple' && selectedSubjects.length < 1) {
      return res
        .status(400)
        .json({ message: 'Select at least one subject for a multiple booking' })
    }

    const { rateCard, estimatedAmount, estimateUnit } =
      await resolveRatesForBooking({
        mentorId: String(mentorId),
        classId: String(classId),
        bookingType,
        selectedSubjectIds: selectedSubjects,
      })

    return res.status(200).json({
      rateCard,
      estimatedAmount,
      estimateUnit,
      billingNote:
        bookingType === 'full'
          ? 'Billed per class conducted. Invoices are raised after classes based on completed sessions.'
          : 'Billed hourly on completed, verified class hours. Invoices are raised after classes.',
    })
  } catch (error) {
    if (error instanceof PricingError) {
      return res.status(422).json({ message: error.message, code: error.code })
    }
    return res
      .status(500)
      .json({ message: 'Server Error', error: error.message })
  }
}
