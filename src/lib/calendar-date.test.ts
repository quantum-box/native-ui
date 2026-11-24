import { describe, expect, it } from 'vitest'

import {
	addDays,
	addMonths,
	addMonthsToMonth,
	clampDate,
	isDateString,
	isMonthString,
	monthGrid,
	parseDateText,
	toDateString,
	todayString,
	weekdayOf,
} from './calendar-date'

describe('日付の計算', () => {
	it('本当にある日だけを日付として受け取る', () => {
		expect(isDateString('2026-11-24')).toBe(true)
		expect(isDateString('2028-02-29')).toBe(true)
		expect(isDateString('2026-02-29')).toBe(false)
		expect(isDateString('2026-13-01')).toBe(false)
		expect(isDateString('2026/11/24')).toBe(false)
		expect(isDateString('')).toBe(false)
		expect(isDateString(undefined)).toBe(false)
		expect(toDateString(2026, 4, 31)).toBe('')
		expect(isMonthString('2026-11')).toBe(true)
		expect(isMonthString('2026-00')).toBe(false)
	})

	it('日を足す・引く（月と年をまたぐ）', () => {
		expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
		expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
		expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
		expect(addDays('2026-03-08', 7)).toBe('2026-03-15')
	})

	it('月を足す・引く。無い日は月の最後の日に寄せる', () => {
		expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
		expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
		expect(addMonths('2026-01-15', -1)).toBe('2025-12-15')
		expect(addMonths('2028-02-29', 12)).toBe('2029-02-28')
		expect(addMonthsToMonth('2026-12', 1)).toBe('2027-01')
		expect(addMonthsToMonth('2026-01', -1)).toBe('2025-12')
	})

	it('曜日（0 が日曜）', () => {
		expect(weekdayOf('2026-11-24')).toBe(2)
		expect(weekdayOf('2026-11-01')).toBe(0)
	})

	it('min と max のあいだに収める', () => {
		expect(clampDate('2026-11-01', '2026-11-10', '2026-11-20')).toBe(
			'2026-11-10',
		)
		expect(clampDate('2026-11-30', '2026-11-10', '2026-11-20')).toBe(
			'2026-11-20',
		)
		expect(clampDate('2026-11-15')).toBe('2026-11-15')
	})

	it('現地の今日を作る（UTC に直さない）', () => {
		expect(todayString(new Date(2026, 10, 24, 0, 30))).toBe('2026-11-24')
		expect(todayString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
	})

	it('月の表は 6 週。日曜はじまりと月曜はじまり', () => {
		const sunday = monthGrid('2026-11', 0)
		expect(sunday).toHaveLength(6)
		expect(sunday[0]).toEqual([
			'2026-11-01',
			'2026-11-02',
			'2026-11-03',
			'2026-11-04',
			'2026-11-05',
			'2026-11-06',
			'2026-11-07',
		])
		expect(sunday[5][6]).toBe('2026-12-12')

		const monday = monthGrid('2026-11', 1)
		expect(monday[0][0]).toBe('2026-10-26')
		expect(monday[0][6]).toBe('2026-11-01')
		expect(monday[5][6]).toBe('2026-12-06')
	})
})

describe('手で打った文字を日付に直す', () => {
	const today = '2026-11-24'
	it.each([
		['2026-11-24', '2026-11-24'],
		['2026/11/24', '2026-11-24'],
		['2026/1/5', '2026-01-05'],
		['2026.1.5', '2026-01-05'],
		['2026年1月5日', '2026-01-05'],
		['20261124', '2026-11-24'],
		['11/24', '2026-11-24'],
		['1/5', '2026-01-05'],
		['1月5日', '2026-01-05'],
		['1124', '2026-11-24'],
		['  2026/11/24 ', '2026-11-24'],
		['２０２６／１１／２４', '2026-11-24'],
	])('%s → %s', (text, expected) => {
		expect(parseDateText(text, today)).toBe(expected)
	})

	it.each(['', 'あした', '2026/13/01', '2026/02/30', '11/31', '2026', '1'])(
		'読めない: %s',
		text => {
			expect(parseDateText(text, today)).toBe('')
		},
	)
})
