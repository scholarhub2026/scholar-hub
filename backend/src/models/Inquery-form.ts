import mongoose, { Document, model, Schema } from 'mongoose'


export interface IInqueryForm extends Document {
  name: string;
  email: string;
  phoneNumber: string;
  place: string;
  subject: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const queryForm = new Schema<IInqueryForm>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    place: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
  },
  { timestamps: true }
)

export default model('InqueryFormModel', queryForm)
