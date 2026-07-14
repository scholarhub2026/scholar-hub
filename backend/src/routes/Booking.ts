import {Router } from 'express'
import { createBookingController, generatePaymentLink, getBookingsForAdmin, getMentorEarningsController, updateBookingController } from '../controllers/Booking';
import crypto from 'crypto';
import Booking from '../models/Booking';
import { rewardReferralOnBooking } from '../utils/referral';
import { log } from 'console';
import { requireAuth, requireRole } from '../middleware/auth';


export const BookingRouter = Router();


BookingRouter.post('/', requireAuth, requireRole('STUDENT'), createBookingController);
BookingRouter.get('/mentor/:mentorId/earnings', requireAuth, requireRole('TUTOR','ADMIN'), getMentorEarningsController);
BookingRouter.get('/:studentId', requireAuth, getBookingsForAdmin); // controller role-filters
BookingRouter.put('/:bookingId', requireAuth, updateBookingController);
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
            
            Booking.findByIdAndUpdate(event.payload.payment.entity.notes.bookingId, {
                paymentStatus: 'failed',
                transactionId: event.payload.payment.entity.id,
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