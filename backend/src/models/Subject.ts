import mongoose, { Document, model, Schema } from 'mongoose'


export interface ISubject extends Document {
  name: string;
  type?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


const classSchema = new Schema <ISubject>(
  {
    name: {
      type: String,
      required: true,
    },
    type:{
      type: String,
      enum: ['subject','syllabus'],
      
      
    },
    isActive: {
      type: Boolean,
      default:true
    },
  },
  { timestamps: true }
)

export default model('SubjectModel', classSchema)
