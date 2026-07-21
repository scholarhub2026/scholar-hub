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

  bookingType: 'full' | 'individual' | 'multiple' | 'demo' | 'subject-wise' | ''
  selectedSubjects: string[]
  totalAmount: number
  paymentType: 'credit-card' | 'paypal' | 'upi' | 'cash' | 'bank-transfer' | ''
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled'
  transactionId?: string
  bookingDate?: Date | null
  createdAt?: Date
  updatedAt?: Date
  otp?: string
  // Lifecycle: pending → approved (admin) → confirmed (teacher accepts) →
  // completed (classes over) → closed (all invoices settled). 'cancelled' from
  // pending/approved/confirmed. Per-cycle payment states live on Invoice.
  bookingStatus?:
    | 'pending'
    | 'approved'
    | 'confirmed'
    | 'completed'
    | 'closed'
    | 'cancelled',
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
  // Manual payment collection: fees are collected by the admin AFTER classes.
  // legacy-flat: `totalAmount` is a flat fee PER period (daily/weekly/monthly).
  // metered: invoices are computed from verified sessions (per-session/weekly/
  // monthly); `totalAmount` is only a server-computed estimate.
  paymentFrequency?: 'daily' | 'weekly' | 'monthly' | 'per-session' | '';
  classStartDate?: Date | null; // UTC-midnight calendar date
  nextDueDate?: Date | null; // UTC-midnight; legacy: next collection; metered: next invoice boundary
  approvedAt?: Date | null;
  rejectionReason?: string;
  lastReminderAt?: Date | null; // reminder dedup (real instant)
  // ---- Billing v2 (SRD rework) ----
  // Which billing path this booking uses. Existing bookings are stamped
  // 'legacy-flat' by the migration and keep the old flat-fee flow untouched.
  billingMode?: 'legacy-flat' | 'metered';
  teacherAcceptedAt?: Date | null;
  teacherDeclineReason?: string;
  // Rates frozen at teacher-accept so later fee edits never change an active
  // booking (SRD custom-fee override + snapshot requirement).
  pricingSnapshot?: {
    source: 'custom' | 'default';
    perClassFee?: number | null; // bookingType 'full'
    subjectRates?: {
      subject_id?: Types.ObjectId | null;
      name: string;
      hourlyRate: number;
    }[];
    snapshottedAt?: Date | null;
  } | null;
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
      // 'demo'/'subject-wise' are used by admin-created (legacy-flat) bookings
      // from the enquiry flow; they never hit the metered pricing engine.
      enum: ['full', 'individual', 'multiple', 'demo', 'subject-wise'],
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
      enum: ['pending', 'approved', 'confirmed', 'completed', 'closed', 'cancelled'],
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
      // 'daily' is legacy-only (rejected for new bookings); 'per-session'
      // bookings are invoiced per verified session, no calendar cycle.
      enum: ['daily', 'weekly', 'monthly', 'per-session', ''],
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

    // ---- Billing v2 (SRD rework) ----
    // 'legacy-flat' = pre-rework flat fee per period (existing bookings, old
    // recordPayment path). 'metered' = invoices computed from verified sessions.
    // NO schema default on purpose: createBooking sets 'metered' explicitly and
    // the migration stamps old docs 'legacy-flat' — a mongoose default would
    // make un-migrated legacy docs read as 'metered'.
    billingMode: {
      type: String,
      enum: ['legacy-flat', 'metered'],
    },
    teacherAcceptedAt: { type: Date, default: null },
    teacherDeclineReason: { type: String, default: '' },
    // Rates frozen at teacher-accept (see pricingEngine.resolveRateCard).
    pricingSnapshot: {
      type: new mongoose.Schema(
        {
          source: { type: String, enum: ['custom', 'default'], required: true },
          perClassFee: { type: Number, default: null },
          subjectRates: [
            {
              subject_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'SubjectModel',
                default: null,
              },
              name: { type: String, default: '' },
              hourlyRate: { type: Number, required: true },
            },
          ],
          snapshottedAt: { type: Date, default: null },
        },
        { _id: false }
      ),
      default: null,
    },

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
