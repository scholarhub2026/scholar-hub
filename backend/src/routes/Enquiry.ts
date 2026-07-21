import { Router } from 'express'
import {
  createEnquiryController,
  getEnquiriesController,
  updateEnquiryController,
} from '../controllers/Enquiry'
import { requireAuth, requireRole } from '../middleware/auth'

export const EnquiryRouter = Router()

// Public lead form — a student enquiring about a mentor's classes.
EnquiryRouter.post('/', createEnquiryController)
// Admin inbox.
EnquiryRouter.get('/', requireAuth, requireRole('ADMIN'), getEnquiriesController)
EnquiryRouter.patch('/:id', requireAuth, requireRole('ADMIN'), updateEnquiryController)
