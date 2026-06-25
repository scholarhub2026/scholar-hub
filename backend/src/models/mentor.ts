import mongoose, { Schema, Types } from 'mongoose'

export interface iMentor {
  
  first_name: string
  last_name?: string
  phone_number: string
  email: string
  password: string
  experience: string
  education_qualification?: string
  available_slot?: {
    time: string
  }[]
  rating?: string
  location?: string
  selected_class?: {
    class_id: Types.ObjectId
    subject: {
      subject_id: Types.ObjectId
      subject_price: string
    }
    price: number
  }[]
  payment_details?: {
    bank_account?: string
    ifsc_code?: string
    branch?: string
    account_holder_name?: string
    upi_id?: string
  }
  id_proof?: string
  admin_approve?: boolean
  email_verified?: boolean
  isActive?: string
  createdAt?: Date
  updatedAt?: Date
  extra_details?: String
  gender: String
  profile_picture?: String
}

const mentorSchema = new Schema<iMentor>(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
    },
    phone_number: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    education_qualification: {
      type: String,
    },
    available_slot: [
      {
        time: String,
      },
    ],
    rating: {
      type: String,
    },
    location: {
      type: String,
    },
    selected_class: [
      {
        class_id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        subject: {
          subject_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
          },
          subject_price: {
            type: String,
            required: true,
          },
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    payment_details: {
      bank_accoount: {
        type: String,
      },
      ifsc_code: {
        type: String,
      },
      branch: {
        type: String,
      },
      account_holder_name: {
        type: String,
      },
      upi_id: {
        type: String,
      },
    },
    id_proof: {
      type: String,
    },
    admin_approve: {
      type: Boolean,
    },
    email_verified: {
      type: Boolean,
    },
    isActive: {
      type: String,
    },
    extra_details: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: true,
    },
    profile_picture: {
      type: String,
    },
  },

  { timestamps: true }
)

export default mongoose.model('Mentor', mentorSchema)
