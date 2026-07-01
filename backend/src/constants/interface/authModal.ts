import mongoose, { Document} from 'mongoose'

 export interface IAuth extends Document {
  email: string
  phoneNumber?: string
  firstName?: string
  lastName?: string
  role?: string
  password: string
  isActive: boolean
  emailVerified: boolean
  emailVerificationOTP?: string
  otpExpiry?: Date

  // Mentor Additional Details
  experience?: string
  education_qualification?: string
  available_slot?: {
    time: string
  }[]
  rating?: string
  location?: string
  selected_class?: {
    class_id: {
      type:mongoose.Schema.Types.ObjectId,
      ref:'ClassesModel'
    }
    price: number
    subject: {
      subject_id: {
      type:mongoose.Schema.Types.ObjectId,
      ref:'SubjectModel'
    }
      subject_price: string
    }
  }[]

  payment_details?: {
    back_account?: string
    ifsc_code?: string
    branch?: string
    account_holder_name?: string
    upi_id?: string
  }

  id_proof?: string
  admin_approve?: boolean
  additional_details?: string
  gender?: 'male' | 'female'
  profile_pic?: string
  message?: string

  createdAt?: Date
  updatedAt?: Date
  is_first_login?: boolean
  completed_profile?: boolean
  is_available?:boolean

  // Refer & earn
  referralCode?: string
  referredBy?: mongoose.Types.ObjectId
  referralCount?: number
  rewardBalance?: number
  referralRewarded?: boolean

  // Push notifications (FCM device tokens)
  fcmTokens?: string[]
}