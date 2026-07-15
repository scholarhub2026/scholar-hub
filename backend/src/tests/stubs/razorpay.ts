/**
 * Test stub for the `razorpay` SDK. Avoids real network calls; returns a
 * deterministic fake payment link.
 */
class Razorpay {
  key_id?: string
  key_secret?: string
  constructor(opts: { key_id?: string; key_secret?: string } = {}) {
    this.key_id = opts.key_id
    this.key_secret = opts.key_secret
  }
  paymentLink = {
    create: async (args: any) => ({
      id: 'plink_test_123',
      short_url: 'https://rzp.test/plink_test_123',
      amount: args?.amount ?? 0,
      currency: args?.currency ?? 'INR',
      status: 'created',
    }),
  }
}

export default Razorpay
