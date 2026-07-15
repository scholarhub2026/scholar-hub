import { catchAsync } from '../utils/catchAsync'
import { Request, Response } from 'express'
import { mongooseIdValidator, validateRequiredFeilds } from '../utils/validateFeilds'
import InqueryFormModal from '../models/Inquery-form'
import { paginate } from '../utils/pagination'
import { sendPushToRole } from '../utils/pushService'

export const createInqueryForm = catchAsync(
  async (req: Request, res: Response) => {
    const validation = await validateRequiredFeilds(req.body, [
      'name',
      'email',
      'phoneNumber',
      'message',
      'place',
      'subject',
    ])
    if (validation) {
      return res.status(400).json({
        message: 'Please provide all required fields',
        error: validation,
      })
    }
    const data = await InqueryFormModal.create(req.body)
    if (!data) {
      return res.status(400).json({
        message: 'Failed to create inquery form',
      })
    }

    // Notify all admins of the new enquiry (deep-links to the Enquiries tab).
    sendPushToRole('ADMIN', {
      title: 'New enquiry',
      body: `${req.body.name} sent an enquiry about ${req.body.subject}.`,
      data: { type: 'inquiry' },
    }).catch(err => console.error('[push] enquiry notify failed:', err.message))

    return res.status(200).json({
      message: 'Inquery form created successfully',
      data: data,
    })
  }
)

export const getInqueryForm = catchAsync(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const id = req.params.id
    console.log('id', id);
    
const idValidate= mongooseIdValidator(id)
    if (id && idValidate) {
      const inqueryData = await InqueryFormModal.findById(id)

      if (!inqueryData) {
        return res.status(404).json({
          message: 'Inquery form not found',
        })
      }
      return res.status(200).json({
        message: 'Inquery form found',
        data: inqueryData,
      })
    }

    const result = await paginate(InqueryFormModal, {}, page, limit)

    if (!result) {
      console.log(result)

      return res.status(404).json({
        message: 'No inquery forms available',
      })
    }

    return res.status(200).json({
      message: 'Inquery forms retrieved successfully',
      ...result,
    })
  }
)

export const deleteInqueryForm = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id
    const idValidate= mongooseIdValidator(id)
    if (!id||!idValidate) {
      return res.status(400).json({
        message: 'Please provide an ID to delete the inquery form',
      })
    }

    const deletedData = await InqueryFormModal.findByIdAndDelete(id)

    if (!deletedData) {
      return res.status(404).json({
        message: 'Inquery form not found',
      })
    }

    return res.status(200).json({
      message: 'Inquery form deleted successfully',
      data: deletedData,
    })
  }
)

export const updateInqueryForm = catchAsync(
  async (req: Request, res: Response) => {
    
    const id = req.params.id
    const idValidate= mongooseIdValidator(id)

    if (!id|| !idValidate) {
      return res.status(400).json({
        message: 'Please provide an ID to update the inquery form',
      })
    }

    const updatedData = await InqueryFormModal.findByIdAndUpdate(id, req.body, {
      new: true,
    })

    if (!updatedData) {
      return res.status(404).json({
        message: 'Inquery form not found',
      })
    }

    return res.status(200).json({
      message: 'Inquery form updated successfully',
      data: updatedData,
    })
  })