import mongoose from 'mongoose'

/**
 * Atomic document-number sequences (invoice/receipt/settlement numbers).
 * `findOneAndUpdate` + `$inc` is atomic on a single doc, so this is safe
 * without transactions (this repo runs standalone Mongo — no sessions).
 * Keys are year-scoped ("invoice-2026") to keep numbers short.
 */
const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "invoice-2026"
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
)

const Counter = mongoose.model('Counter', CounterSchema)

const PREFIXES = {
  invoice: 'SH-INV',
  receipt: 'SH-RCPT',
  settlement: 'SH-STL',
} as const

export type CounterKind = keyof typeof PREFIXES

/**
 * Next formatted document number, e.g. "SH-INV-2026-000042".
 * `year` is injectable for tests; defaults to the current UTC year.
 */
export const nextNumber = async (
  kind: CounterKind,
  year: number = new Date().getUTCFullYear()
): Promise<string> => {
  const counter = await Counter.findOneAndUpdate(
    { _id: `${kind}-${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  )
  return `${PREFIXES[kind]}-${year}-${String(counter.seq).padStart(6, '0')}`
}

export default Counter
