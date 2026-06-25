import Classes from '../models/Classes'
import ClassModal from '../models/Classes'
import { catchAsync } from '../utils/catchAsync'
import { paginate } from '../utils/pagination'
import { mongooseIdValidator, validateRequiredFeilds } from '../utils/validateFeilds'
import { Request, Response } from 'express'

export const createClasses = catchAsync(async (req: Request, res: Response) => {
  


  const validation = await validateRequiredFeilds(req.body, [
    'class',
    'syllabus',
    'basePrice',
    'subjects.subjectId',
    'subjects.price',
    'sortOrder'
  ])

  if (validation) {
    return res.status(400).json({
      message: 'Please provide all required fields',
      error: validation,
    })
  }
 
  const isEcistingSorder=await ClassModal.findOne({sortOrder:req.body.sortOrder})
  if(isEcistingSorder){
    return res.status(400).json({
      message: 'Sort order must be unique',
    })
  }

  const data = await Classes.create(req.body)
  if (!data) {
    return res.status(400).json({
      message: 'Failed to create class',
    })
  }
  return res.status(200).json({
    message: 'All required fields are present',
    data: req.body,
  })
})

export const getClasses = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10
  const id = req.query.id

  if (id) {
    const classData = await ClassModal.findById(id).populate("subjects.subjectId")

    if (!classData) {
      return res.status(404).json({
        message: 'Class not found',
      })
    }
    return res.status(200).json({
      message: 'Class found',
      data: classData,
    })
  }
  const result = await paginate(ClassModal, { isActive: true }, page, limit,"subjects.subjectId")
  if (!result.data || result.data.length === 0) {
  return res.status(200).json({
    message: 'No classes available',
    data: [],  // Keep data as empty array
  });
}

  return res.status(200).json({
    message: 'Classes fetched successfully',
    ...result,
  })
})


export const updateClasses = catchAsync(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params;

  // Validate ID
  if (!id || !mongooseIdValidator(id)) {
    return res.status(400).json({ message: 'Please provide a valid class ID' });
  }

  // Ensure upsert is disabled (important)
  const updatedClass = await ClassModal.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true, // Ensures Mongoose schema validation runs
    upsert: false,       // Prevents creation of a new document
  });

  if (!updatedClass) {
    return res.status(404).json({ message: 'Class not found' });
  }

  return res.status(200).json({
    message: 'Class updated successfully',
    data: updatedClass,
  });
});

export const deleteClasses = catchAsync(async (req: Request, res: Response): Promise<Response> => {
  const { id } = req.params

  if (!id || !mongooseIdValidator(id)) {
    return res.status(400).json({ message: 'Please provide the class ID' })
  }

  const deletedClass = await ClassModal.findByIdAndUpdate(id, { isActive: false }, { new: true })

  if (!deletedClass) {
    return res.status(404).json({ message: 'Class not found' })
  }

  return res.status(200).json({
    message: 'Class deleted successfully',
    data: deletedClass,
  })
})