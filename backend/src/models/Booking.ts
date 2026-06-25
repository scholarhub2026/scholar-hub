import mongoose, { Document, Types } from 'mongoose'
import { start } from 'repl';

export interface IBooking extends Document {
  studentId: {
    _id: Types.ObjectId;  // Ref: User
    firstName: string
    email: string
    phone: string
  },
  mentorId: {
    _id: Types.ObjectId;  // Ref: User
    firstName: string
    email: string
    phone: string
  },
  studentName: string
  email: string
  phone: string
  sessionType: string
  message?: string
  agreeToTerms: boolean
  selectedSyllabus?: string
  selectedClass: {
    class_id: {
      _id: Types.ObjectId;  // Ref: Class
      class: string;
      syllabus: string;
    };
    price: number;
    subject: {
      subject_id: {
        _id: Types.ObjectId;  // Ref: Subject
        name: string;
      };
      subject_price: number;
    }[];
  };

  bookingType: 'full' | 'individual' | 'multiple' | ''
  selectedSubjects: string[]
  totalAmount: number
  paymentType: 'credit-card' | 'paypal' | 'upi' | 'cash' | 'bank-transfer' | ''
  paymentStatus: 'pending' | 'completed' | 'failed'
  transactionId?: string
  bookingDate?: Date | null
  createdAt?: Date
  updatedAt?: Date
  otp?: string
  bookingStatus?: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  bookingLogs?: {
    _id?:string;
    date: Date;
    startTime: string;
    endTime: string;
    notes?: string;
  }[],
  orderId?: string;
  remarks?: string;
  
  
}

const BookingSchema = new mongoose.Schema<IBooking>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    sessionType: {
      type: String,
    },
    message: {
      type: String,
      default: '',
    },
    agreeToTerms: {
      type: Boolean,
      default: false,
    },
    selectedSyllabus: {
      type: String,
      default: '',
    },
   selectedClass: {
      class_id: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
        class: { type: String, required: true },
        syllabus: { type: String, required: true },
      },
      price: { type: Number, default: 0 },

      // ✅ Subjects under class
      subject: [
        {
          subject_id: {
            _id: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
            name: { type: String, required: true },
          },
          subject_price: { type: Number, default: 0 },
        },
      ],
    },

    bookingType: {
      type: String,
      enum: ['full', 'individual', 'multiple'],
      default: '',
    },
    selectedSubjects: {
      type: [String], // array of subjects
      default: [],
    },

    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentType: {
      type: String,
      enum: ['credit-card', 'paypal', 'upi', 'cash', 'bank-transfer', ''],
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      default: '',
    },
   
    otp: {
      type: String,
      default: '',
    },
    bookingStatus:{
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
     orderId:{ type: String, default: '' },
     remarks:{ type: String, default: '' },
    bookingLogs:[
      {
        date: { type: Date },
        startTime: { type: String },
        endTime: { type: String },
        notes:{ type: String },
      }
    ],
   
  },
   
  {
    timestamps: true, // adds createdAt & updatedAt
  }
)

export default mongoose.model('Booking', BookingSchema)
