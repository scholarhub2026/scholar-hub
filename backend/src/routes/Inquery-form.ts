import Router from 'express'
import {
  createInqueryForm,
  deleteInqueryForm,
  getInqueryForm,
  updateInqueryForm,
} from '../controllers/Inquery-form'
import { requireAuth, requireRole } from '../middleware/auth'

export const inqueryFormRouter = Router()

inqueryFormRouter.post('/', createInqueryForm) // public: contact/enquiry form

inqueryFormRouter.get('/:id', requireAuth, requireRole('ADMIN'), getInqueryForm)
inqueryFormRouter.get('/', requireAuth, requireRole('ADMIN'), getInqueryForm)

inqueryFormRouter.delete('/:id', requireAuth, requireRole('ADMIN'), deleteInqueryForm)

inqueryFormRouter.put('/:id', requireAuth, requireRole('ADMIN'), updateInqueryForm)
