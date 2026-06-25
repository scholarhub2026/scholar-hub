import {Router } from 'express'
import { createBookingLog, getBookingLogs, updateBookingLog } from '../controllers/BookingLog';




export const BookingLogRouter=Router();

BookingLogRouter.post('/:bookingId',createBookingLog);
BookingLogRouter.get('/:bookingId',getBookingLogs);
BookingLogRouter.put('/:bookingId/:logId',updateBookingLog);