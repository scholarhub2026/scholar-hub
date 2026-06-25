import Router from 'express'
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from '../controllers/Subject'

export const SubjectRouter = Router()

SubjectRouter.post('/:type', createSubject)

SubjectRouter.put('/:id', updateSubject);
// SubjectRouter.get('/:id', getSubjects)
SubjectRouter.get('/:type', getSubjects)
SubjectRouter.delete('/:id', deleteSubject)
