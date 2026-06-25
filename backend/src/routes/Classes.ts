import Router from 'express'
import {
  createClasses,
  deleteClasses,
  getClasses,
  updateClasses,
} from '../controllers/Classes'

export const classRouter = Router()

classRouter.post('/', createClasses)
classRouter.get('/', getClasses)
classRouter.put('/:id', updateClasses)
classRouter.delete('/:id', deleteClasses)
