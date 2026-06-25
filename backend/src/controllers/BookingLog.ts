import Booking from "../models/Booking";
import { catchAsync } from "../utils/catchAsync";
import { Request, Response } from 'express'

export const createBookingLog =catchAsync(async(req:Request,res:Response)=>{

  console.log("Working");
  
  const { bookingId } = req.params;
    const { date, startTime, endTime } = req.body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Push the new log entry
    booking.bookingLogs.push({
      date,
      startTime,
      endTime,
      
    });

    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Booking log added successfully',
      booking,
    });

})


export const getBookingLogs =catchAsync(async(req:Request,res:Response)=>{
  const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).select('bookingLogs');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.status(200).json({
      success: true,
      bookingLogs: booking.bookingLogs,
    });
})


export const updateBookingLog =catchAsync(async(req:Request,res:Response)=>{

    const { bookingId, logId } = req.params;
    const { date, startTime, endTime, notes } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const log = booking.bookingLogs?.find((log) => log._id?.toString() === logId);
    if (!log) {
      return res.status(404).json({ success: false, message: "Booking log not found" });
    }

    // Update only provided fields
    if (date) log.date = date;
    if (startTime) log.startTime = startTime;
    if (endTime) log.endTime = endTime;
    if (notes !== undefined) log.notes = notes;

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking log updated successfully",
      bookingLogs: booking.bookingLogs,
    });
  
})