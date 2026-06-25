import Router from 'express'
import {
  createInqueryForm,
  deleteInqueryForm,
  getInqueryForm,
  updateInqueryForm,
} from '../controllers/Inquery-form'

export const inqueryFormRouter = Router()

inqueryFormRouter.post('/', createInqueryForm)

inqueryFormRouter.get('/:id', getInqueryForm)
inqueryFormRouter.get('/', getInqueryForm)


inqueryFormRouter.delete('/:id', deleteInqueryForm)

inqueryFormRouter.put('/:id', updateInqueryForm)
