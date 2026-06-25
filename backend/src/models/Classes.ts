import mongoose, { Document, model, Schema } from 'mongoose'

export interface IClass extends Document {
  class: string
  syllabus: string
  basePrice: string
  subjects: {
    subjectId: mongoose.Schema.Types.ObjectId
    price: number
  }[]
  isActive: boolean,
  sortOrder?: number
  
 
}

const classSchema = new Schema<IClass>(
  {
    class: { type: String, required: true },
    syllabus: { type: String, required: true },
    basePrice: { type: String, required: true },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SubjectModel',
          required: true,
        },
        price: { type: Number, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder:{
      type: Number,
    }
   
   
  },
  { timestamps: true }
)

export default model('ClassesModel', classSchema)
