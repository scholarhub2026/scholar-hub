import Router from 'express'
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from '../controllers/Subject'
import { requireAuth, requireRole } from '../middleware/auth'

export const SubjectRouter = Router()

SubjectRouter.get('/:type', getSubjects) // public: used by browse/booking
SubjectRouter.post('/:type', requireAuth, requireRole('ADMIN'), createSubject)
SubjectRouter.put('/:id', requireAuth, requireRole('ADMIN'), updateSubject)
SubjectRouter.delete('/:id', requireAuth, requireRole('ADMIN'), deleteSubject)
