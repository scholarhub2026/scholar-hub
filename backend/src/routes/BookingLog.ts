import {Router } from 'express'
import { createBookingLog, getBookingLogs, updateBookingLog } from '../controllers/BookingLog';
import { requireAuth, requireRole } from '../middleware/auth';


export const BookingLogRouter=Router();

BookingLogRouter.post('/:bookingId', requireAuth, requireRole('TUTOR','ADMIN'), createBookingLog);
BookingLogRouter.get('/:bookingId', requireAuth, getBookingLogs);
BookingLogRouter.put('/:bookingId/:logId', requireAuth, requireRole('TUTOR','ADMIN'), updateBookingLog);