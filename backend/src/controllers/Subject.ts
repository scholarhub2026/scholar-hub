import { catchAsync } from '../utils/catchAsync'
import {
  mongooseIdValidator,
  validateRequiredFeilds,
} from '../utils/validateFeilds'
import type { Request, Response } from 'express'
import SubjectModel from '../models/Subject'
import { paginate } from '../utils/pagination'

export const createSubject = catchAsync(async (req: Request, res: Response) => {
  const { type } = req.params;

  if (!type || (type !== 'subject' && type !== 'syllabus')) {
    return res.status(400).json({ message: 'Provide a valid type' });
  }

  const validation = validateRequiredFeilds(req.body, ['name']);
  if (validation) {
    return res.status(400).json({ message: validation });
  }

  const isExist = await SubjectModel.findOne({
    name: req.body.name.toLowerCase(),
    type,
  });

  if (isExist) {
    return res.status(409).json({ message: 'Subject already exists' });
  }

  const subject = new SubjectModel({
    name: req.body.name.toLowerCase(),
    type,
  });

  await subject.save();
  return res
    .status(201)
    .json({ message: 'Subject created successfully', data: subject });
});


export const updateSubject = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params
  const { name } = req.body

  if (!id || !mongooseIdValidator(id))
    return res.status(401).json({ message: 'Provide the id or invalid id' })
  if (!name)
    return res.status(401).json({ message: 'Provide the subject for update' })

  const isExist = await SubjectModel.findOne({ name: name.toLowerCase() })
  if (isExist)
    return res.status(401).json({ message: 'This subject is already exist' })

  const updatedSubject = await SubjectModel.findByIdAndUpdate(
    id,
    { name: name.toLowerCase() },
    { new: true }
  )
  if (!updatedSubject)
    return res
      .status(401)
      .json({ message: 'Something went wrong while update' })

  return res
    .status(201)
    .json({ message: 'Subject updated Successfully', data: updatedSubject })
})

export const getSubjects = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const id = req.params.id
    const type = req.params.type
    console.log('id', id, 'type', type)

    if (type && type != 'subject' && type != 'syllabus') {
      return res.status(400).json({ message: 'Invalid type provided' })
    }
    // If ID is present, return specific subject
    if (id) {
      if (!mongooseIdValidator(id)) {
        return res.status(400).json({ message: 'Invalid ID format' })
      }

      const subject = await SubjectModel.findById(id)
      if (!subject) {
        return res
          .status(404)
          .json({ message: 'No subject available with this ID' })
      }

      return res.status(200).json({
        message: 'Subject fetched successfully',
        data: subject,
      })
    }

    const result = await paginate(
      SubjectModel,
      { isActive: true, type: type },
      page,
      limit
    )

    return res.status(200).json({
      message: 'Subjects fetched successfully',
      ...result,
    })
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Server Error' })
  }
}

export const deleteSubject = catchAsync(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params

    if (!id || !mongooseIdValidator(id))
      return res.status(401).json({ message: 'Provide the id or invalid id' })

    const subject = await SubjectModel.findByIdAndUpdate(
      id,
      {
        isActive: false,
      },
      { new: true }
    )
    if (!subject)
      return res
        .status(401)
        .json({ message: 'Something went wrong while delete' })

    return res
      .status(200)
      .json({ message: 'Subject deleted successfully', data: subject })
  }
)
