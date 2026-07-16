import { describe, it, expect } from 'vitest'
import {
  advanceByFrequency,
  daysOverdue,
  periodLabelFor,
  todayIST,
  toUtcMidnight,
} from '../utils/paymentSchedule'

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

describe('paymentSchedule', () => {
  describe('advanceByFrequency', () => {
    it('daily adds one day (and crosses month ends)', () => {
      expect(advanceByFrequency(utc(2026, 7, 15), 'daily')).toEqual(utc(2026, 7, 16))
      expect(advanceByFrequency(utc(2026, 7, 31), 'daily')).toEqual(utc(2026, 8, 1))
    })

    it('weekly adds seven days', () => {
      expect(advanceByFrequency(utc(2026, 7, 15), 'weekly')).toEqual(utc(2026, 7, 22))
      expect(advanceByFrequency(utc(2026, 12, 28), 'weekly')).toEqual(utc(2027, 1, 4))
    })

    it('monthly keeps the day-of-month when it exists', () => {
      expect(advanceByFrequency(utc(2026, 1, 15), 'monthly')).toEqual(utc(2026, 2, 15))
      expect(advanceByFrequency(utc(2026, 12, 10), 'monthly')).toEqual(utc(2027, 1, 10))
    })

    it('monthly clamps to the last day of shorter months', () => {
      expect(advanceByFrequency(utc(2026, 1, 31), 'monthly')).toEqual(utc(2026, 2, 28))
      expect(advanceByFrequency(utc(2026, 3, 31), 'monthly')).toEqual(utc(2026, 4, 30))
    })

    it('monthly is leap-year aware', () => {
      expect(advanceByFrequency(utc(2024, 1, 31), 'monthly')).toEqual(utc(2024, 2, 29))
    })

    it('documented drift: the clamped day becomes the new anchor', () => {
      const feb = advanceByFrequency(utc(2026, 1, 31), 'monthly') // Feb 28
      expect(advanceByFrequency(feb, 'monthly')).toEqual(utc(2026, 3, 28))
    })
  })

  describe('todayIST', () => {
    it('rolls to the next IST day after 18:30 UTC', () => {
      expect(todayIST(new Date('2026-07-15T19:30:00.000Z'))).toEqual(utc(2026, 7, 16))
    })

    it('stays on the same IST day before 18:30 UTC', () => {
      expect(todayIST(new Date('2026-07-15T10:00:00.000Z'))).toEqual(utc(2026, 7, 15))
    })
  })

  describe('daysOverdue', () => {
    it('is 0 when due today or in the future', () => {
      expect(daysOverdue(utc(2026, 7, 15), utc(2026, 7, 15))).toBe(0)
      expect(daysOverdue(utc(2026, 7, 20), utc(2026, 7, 15))).toBe(0)
    })

    it('counts whole days past due', () => {
      expect(daysOverdue(utc(2026, 7, 12), utc(2026, 7, 15))).toBe(3)
    })
  })

  describe('periodLabelFor', () => {
    it('labels by frequency', () => {
      expect(periodLabelFor(utc(2026, 8, 1), 'monthly')).toBe('Aug 2026')
      expect(periodLabelFor(utc(2026, 8, 16), 'weekly')).toBe('Week of 16 Aug 2026')
      expect(periodLabelFor(utc(2026, 8, 16), 'daily')).toBe('16 Aug 2026')
    })
  })

  describe('toUtcMidnight', () => {
    it('truncates time-of-day', () => {
      expect(toUtcMidnight(new Date('2026-07-15T13:45:12.000Z'))).toEqual(utc(2026, 7, 15))
    })
  })
})
