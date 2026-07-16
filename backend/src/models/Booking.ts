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
  sessionMode?: 'online' | 'offline' | ''
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
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled'
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
  // Weekly slots this booking reserves. A recurring slot holds its weekday
  // forever; a single slot holds only its one `date`. `claimKey` is set only
  // for capacity-1 (1-on-1) slots and is the value the unique index enforces.
  scheduleCadence?: 'recurring' | 'single' | '';
  reservedSlots?: {
    slotId?: Types.ObjectId;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    cadence: 'recurring' | 'single';
    date?: Date | null;
    claimKey?: string | null;
  }[];
  // Manual payment collection: fees are collected by the admin AFTER classes,
  // on a daily/weekly/monthly cadence. `totalAmount` is the fee PER period.
  paymentFrequency?: 'daily' | 'weekly' | 'monthly' | '';
  classStartDate?: Date | null; // UTC-midnight calendar date
  nextDueDate?: Date | null; // UTC-midnight; null until admin approves
  approvedAt?: Date | null;
  rejectionReason?: string;
  lastReminderAt?: Date | null; // reminder dedup (real instant)
  payments?: {
    _id?: Types.ObjectId;
    amount: number;
    collectedAt: Date;
    note?: string;
    collectedBy?: Types.ObjectId | null;
    periodLabel?: string;
  }[];
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
    sessionMode: {
      type: String,
      enum: ['online', 'offline', ''],
      default: '',
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

    // Scheduling: which weekly slot(s) this booking reserves.
    scheduleCadence: {
      type: String,
      enum: ['recurring', 'single', ''],
      default: '',
    },
    reservedSlots: [
      {
        slotId: { type: mongoose.Schema.Types.ObjectId }, // Auth.weekly_availability._id
        dayOfWeek: { type: Number, min: 0, max: 6, required: true },
        startTime: { type: String }, // "HH:mm" snapshot (survives template edits)
        endTime: { type: String },
        cadence: { type: String, enum: ['recurring', 'single'], required: true },
        date: { type: Date, default: null }, // set only when cadence === 'single'
        claimKey: { type: String, default: null }, // set only when slot capacity === 1
      },
    ],
    // Earliest single-session date (null for recurring). Now persisted — the
    // old interface-only `bookingDate` silently never saved.
    bookingDate: { type: Date, default: null },

    // ---- Manual payment collection (no online payments) ----
    // Fee cadence chosen by the student; `totalAmount` is the fee PER period.
    // '' = legacy booking created before this feature (like sessionMode).
    paymentFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', ''],
      default: '',
    },
    classStartDate: { type: Date, default: null }, // UTC-midnight calendar date
    // Next collection date. Set on admin approval (start + 1 period — fees are
    // collected AFTER classes); advanced by one period on each recorded payment.
    nextDueDate: { type: Date, default: null },
    approvedAt: { type: Date, default: null },
    // Kept separate from `remarks` — the admin edit sheet writes remarks and
    // would otherwise clobber the rejection reason.
    rejectionReason: { type: String, default: '' },
    // When the last due-date reminder went out (dedup for the daily job).
    lastReminderAt: { type: Date, default: null },
    // Manually collected payments, appended by the admin ("mark paid").
    payments: [
      {
        amount: { type: Number, required: true },
        collectedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
        collectedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AuthModal',
          default: null,
        },
        periodLabel: { type: String, default: '' }, // e.g. "Aug 2026"
      },
    ],

  },

  {
    timestamps: true, // adds createdAt & updatedAt
  }
)

// Race-safety backstop for 1-on-1 slots: a given claimKey may exist in at most
// one booking's reservedSlots across the whole collection. Two concurrent
// bookings for the same 1-on-1 (slot, cadence, date) can't both save — the
// loser hits E11000. Group slots leave claimKey null (excluded by the filter).
BookingSchema.index(
  { 'reservedSlots.claimKey': 1 },
  { unique: true, partialFilterExpression: { 'reservedSlots.claimKey': { $type: 'string' } } }
)
// Cheap availability aggregation.
BookingSchema.index({ mentorId: 1, bookingStatus: 1, 'reservedSlots.slotId': 1 })
// Due-payments list + daily reminder job.
BookingSchema.index({ bookingStatus: 1, nextDueDate: 1 })

export default mongoose.model('Booking', BookingSchema)
