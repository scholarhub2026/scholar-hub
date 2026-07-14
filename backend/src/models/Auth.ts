import mongoose, { model, Schema } from 'mongoose'
import { AUTH_CONSTANTS } from '../constants/Auth'
import { IAuth } from '../constants/interface/authModal'
const { ROLES } = AUTH_CONSTANTS

const SelectedClassSchema = new mongoose.Schema(
  {
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassesModel',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    
    subject: [
      {
        subject_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SubjectModel',
          required: true,
        },
        subject_price: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { _id: false }
);


const AuthSchema = new Schema<IAuth>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      // Emails are case-insensitive in practice — normalize so signup/login/
      // approval all agree regardless of how the user typed it.
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    role: {
      type: String,

      enum: Object.values(ROLES),
    },
    password: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
    },
    otpExpiry: { type: Date },

    //mentor addtional Details

    experience: {
      type: String,
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
    selected_class: [SelectedClassSchema],
    payment_details: {
      back_account: {
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
    additional_details: {
      type: String,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    profile_pic: {
      type: String,
    },
    message: {
      type: String,
    },
    is_first_login: {
      type: Boolean,
    },
    completed_profile: {
      type: Boolean,
      default: false,
    },
    is_available:{
      type:Boolean,
      default:true
    },

    // Refer & earn
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
    },
    referralCount: {
      type: Number,
      default: 0,
    },
    rewardBalance: {
      type: Number,
      default: 0,
    },
    // True once this user's first completed booking has paid out their referrer.
    referralRewarded: {
      type: Boolean,
      default: false,
    },

    // Push notifications — one entry per device the user is logged in on.
    fcmTokens: {
      type: [String],
      default: [],
    },
  },

  { timestamps: true }
)

export default model('AuthModal', AuthSchema)
