import mongoose, { Document } from 'mongoose'

export interface IAd extends Document {
  title: string
  imageUrl: string
  linkUrl?: string // optional deep-link / external URL when the banner is tapped
  isActive: boolean
  order: number // ascending sort position in the carousel
  createdAt?: Date
  updatedAt?: Date
}

const AdSchema = new mongoose.Schema<IAd>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    linkUrl: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export default mongoose.model<IAd>('Ad', AdSchema)
