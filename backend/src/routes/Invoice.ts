import { Router } from 'express'
import {
  generateInvoiceController,
  getInvoiceController,
  listInvoicesController,
  mentorInvoicesController,
  myInvoicesController,
  recordInvoicePaymentController,
  resendReceiptController,
  voidInvoiceController,
} from '../controllers/Invoice'
import { requireAuth, requireRole } from '../middleware/auth'

export const InvoiceRouter = Router()

// Static paths before '/:invoiceId'.
InvoiceRouter.get('/', requireAuth, requireRole('ADMIN'), listInvoicesController)
InvoiceRouter.get('/mine', requireAuth, requireRole('STUDENT'), myInvoicesController)
InvoiceRouter.get('/mentor', requireAuth, requireRole('TUTOR'), mentorInvoicesController)
InvoiceRouter.post('/generate', requireAuth, requireRole('ADMIN'), generateInvoiceController)
InvoiceRouter.get('/:invoiceId', requireAuth, getInvoiceController) // controller checks ownership
InvoiceRouter.post('/:invoiceId/void', requireAuth, requireRole('ADMIN'), voidInvoiceController)
InvoiceRouter.post('/:invoiceId/payments', requireAuth, requireRole('ADMIN'), recordInvoicePaymentController)
InvoiceRouter.post('/:invoiceId/resend-receipt', requireAuth, requireRole('ADMIN'), resendReceiptController)
