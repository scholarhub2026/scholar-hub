import {Router } from 'express'
import { cancelBookingController, createBookingController, deleteBookingController, generatePaymentLink, getBookingsForAdmin, getMentorEarningsController, updateBookingController } from '../controllers/Booking';
import { approveBookingController, getDuePaymentsController, recordPaymentController, rejectBookingController } from '../controllers/BookingPayments';
import { quoteBookingController } from '../controllers/Pricing';
import {
  closeBookingController,
  completeBookingController,
  getMentorRequestsController,
  teacherAcceptController,
  teacherDeclineController,
} from '../controllers/BookingLifecycle';
import crypto from 'crypto';
import Booking from '../models/Booking';
import { rewardReferralOnBooking } from '../utils/referral';
import { log } from 'console';
import { requireAuth, requireRole } from '../middleware/auth';


export const BookingRouter = Router();


BookingRouter.post('/', requireAuth, requireRole('STUDENT'), createBookingController);
// Server-side pricing preview for the booking wizard (SRD billing engine).
BookingRouter.post('/quote', requireAuth, requireRole('STUDENT'), quoteBookingController);
BookingRouter.get('/mentor/:mentorId/earnings', requireAuth, requireRole('TUTOR','ADMIN'), getMentorEarningsController);
// Manual payment collection (admin). NOTE: '/payments/due' MUST stay above the
// 'GET /:studentId' catch-all or it would be swallowed as a studentId.
BookingRouter.get('/payments/due', requireAuth, requireRole('ADMIN'), getDuePaymentsController);
// Teacher accept/decline queue. NOTE: static path — must also stay above the
// 'GET /:studentId' catch-all.
BookingRouter.get('/mentor/requests', requireAuth, requireRole('TUTOR'), getMentorRequestsController);
BookingRouter.patch('/:bookingId/approve', requireAuth, requireRole('ADMIN'), approveBookingController);
BookingRouter.patch('/:bookingId/reject', requireAuth, requireRole('ADMIN'), rejectBookingController);
BookingRouter.patch('/:bookingId/teacher-accept', requireAuth, requireRole('TUTOR'), teacherAcceptController);
BookingRouter.patch('/:bookingId/teacher-decline', requireAuth, requireRole('TUTOR'), teacherDeclineController);
BookingRouter.patch('/:bookingId/complete', requireAuth, requireRole('ADMIN'), completeBookingController);
BookingRouter.patch('/:bookingId/close', requireAuth, requireRole('ADMIN'), closeBookingController);
BookingRouter.post('/:bookingId/payments', requireAuth, requireRole('ADMIN'), recordPaymentController);
BookingRouter.get('/:studentId', requireAuth, getBookingsForAdmin); // controller role-filters
BookingRouter.put('/:bookingId', requireAuth, updateBookingController);
BookingRouter.patch('/:bookingId/cancel', requireAuth, cancelBookingController); // owner or admin (checked in controller)
BookingRouter.delete('/:bookingId', requireAuth, requireRole('ADMIN'), deleteBookingController);
BookingRouter.post('/create-payment-link', requireAuth, requireRole('STUDENT'), generatePaymentLink);


BookingRouter.post('/razorpay/webhook',async(req,res)=>{
    log('Received webhook event');
    try {
         const secret = "6P.MqK78H!eN.xe";
    const signature = req.headers["x-razorpay-signature"];
    const body = req.body.toString(); // important!

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    if (expectedSignature !== signature) {
        return res.status(400).json({ message: 'Invalid signature' });
    }

    // Handle the webhook event
    const event = JSON.parse(body);
    switch (event.event) {
        case 'payment.captured':
            // Handle payment capture
            console.log('Payment captured event received');

            const paidBooking = await Booking.findByIdAndUpdate(
                event.payload.payment.entity.notes.bookingId,
                {
                    paymentStatus: 'completed',
                    transactionId: event.payload.payment.entity.id,
                },
                { new: true }
            )
            // First completed booking pays out the referrer (idempotent).
            await rewardReferralOnBooking(paidBooking?.studentId?.toString())
            break;
        case 'payment.failed':
            // Handle payment failure
            console.log('Payment failed event received');

            // Free any held seats (null claimKey) so the slot re-opens.
            await Booking.findByIdAndUpdate(event.payload.payment.entity.notes.bookingId, {
                $set: {
                    paymentStatus: 'failed',
                    transactionId: event.payload.payment.entity.id,
                    'reservedSlots.$[].claimKey': null,
                },
            })
            break;
        default:
            return res.status(400).json({ message: 'Unknown event type' });
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
} catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message })
}

});