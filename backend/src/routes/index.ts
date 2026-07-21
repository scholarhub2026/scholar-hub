import { Router } from 'express'
import type { Request, Response } from 'express'
import { AuthRouter } from './Auth'
import { classRouter } from './Classes'
import { SubjectRouter } from './Subject'
import { inqueryFormRouter } from './Inquery-form'
import { mentorRouter } from './Mentor'
import { mediaRouter } from './Media'
import { BookingRouter } from './Booking'
import { BookingLogRouter } from './BookingLog'
import { SessionRouter } from './Session'
import { InvoiceRouter } from './Invoice'
import { SettlementRouter, PaymentRouter } from './Settlement'
import { AuditRouter } from './Audit'
import { EnquiryRouter } from './Enquiry'
import { ReviewRouter } from './Review'
import { ReferralRouter } from './Referral'
import { AdRouter } from './Ad'
import { UserRouter } from './User'
import upload from '../utils/multer'
import { uploadMedia } from '../controllers/Media'

const routers = Router()

routers.get('/check', (req: Request, res: Response) => {
  res.sendStatus(200)
})

routers.use('/api/auth', AuthRouter)
routers.use('/api/classes', classRouter)
routers.use('/api/subject', SubjectRouter)
routers.use('/api/inquery-form', inqueryFormRouter);
routers.use('/api/mentor',mentorRouter)
routers.use('/api/media',mediaRouter)
routers.use('/api/booking',BookingRouter);
routers.use('/api/bookingLog',BookingLogRouter);
// Billing v2 (SRD): sessions & attendance → invoices → payments → settlements.
routers.use('/api/sessions',SessionRouter);
routers.use('/api/invoices',InvoiceRouter);
routers.use('/api/settlements',SettlementRouter);
routers.use('/api/payments',PaymentRouter);
routers.use('/api/audit',AuditRouter);
// Student class enquiries (the lead front-door that replaces self-service booking).
routers.use('/api/enquiry',EnquiryRouter);
routers.use('/api/review',ReviewRouter);
routers.use('/api/referral',ReferralRouter);
routers.use('/api/ads',AdRouter);
routers.use('/api/users',UserRouter);
routers.use('/api/media',upload.single('image'),uploadMedia);

export default routers
