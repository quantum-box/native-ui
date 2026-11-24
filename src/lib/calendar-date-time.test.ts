import { describe, expect, it } from 'vitest'

import {
	clampMonth,
	isDateTimeString,
	isTimeString,
	minutesOf,
	parseDateText,
	parseMonthText,
	parseTimeText,
	timeOptions,
	toMonthString,
} from './calendar-date'

const today = '2026-11-24'

describe('月', () => {
	it.each([
		['2026-11', '2026-11'],
		['2026/11', '2026-11'],
		['2026/3', '2026-03'],
		['2026.3', '2026-03'],
		['2026年3月', '2026-03'],
		['202611', '2026-11'],
		['11', '2026-11'],
		['3月', '2026-03'],
		['２０２６／１１', '2026-11'],
	])('打った文字 %s → %s', (text, expected) => {
		expect(parseMonthText(text, today)).toBe(expected)
	})

	it.each(['', 'らいげつ', '2026/13', '2026/0', '13', '2026'])(
		'読めない: %s',
		text => {
			expect(parseMonthText(text, today)).toBe('')
		},
	)

	it('無い月は作らない。範囲の外は端に寄せる', () => {
		expect(toMonthString(2026, 13)).toBe('')
		expect(toMonthString(10000, 1)).toBe('')
		expect(clampMonth('10000-01')).toBe('9999-12')
		expect(clampMonth('0000-12')).toBe('0001-01')
		expect(clampMonth('2026-01', '2026-04', '2026-09')).toBe('2026-04')
		expect(clampMonth('2026-12', '2026-04', '2026-09')).toBe('2026-09')
	})
})

describe('時刻', () => {
	it.each([
		['09:30', '09:30'],
		['9:30', '09:30'],
		['9:5', '09:05'],
		['9.30', '09:30'],
		['9時30分', '09:30'],
		['9時', '09:00'],
		['9', '09:00'],
		['930', '09:30'],
		['0930', '09:30'],
		['2359', '23:59'],
		['0', '00:00'],
		['９：３０', '09:30'],
	])('打った文字 %s → %s', (text, expected) => {
		expect(parseTimeText(text)).toBe(expected)
	})

	it.each(['', 'ひる', '24:00', '9:60', '25', '12345', '9:'])(
		'読めない: %s',
		text => {
			expect(parseTimeText(text)).toBe('')
		},
	)

	it('HH:MM だけを時刻として受け取る', () => {
		expect(isTimeString('00:00')).toBe(true)
		expect(isTimeString('23:59')).toBe(true)
		expect(isTimeString('24:00')).toBe(false)
		expect(isTimeString('9:30')).toBe(false)
		expect(isTimeString('09:30:00')).toBe(false)
		expect(minutesOf('09:30')).toBe(570)
	})

	it('きざみと範囲から、選べる時刻の一覧を作る', () => {
		expect(timeOptions(30)).toHaveLength(48)
		expect(timeOptions(60, '09:00', '12:00')).toEqual([
			'09:00',
			'10:00',
			'11:00',
			'12:00',
		])
		expect(timeOptions(15, '23:30')).toEqual(['23:30', '23:45'])
		expect(timeOptions(0)).toHaveLength(48)
	})
})

describe('日時', () => {
	it('YYYY-MM-DDTHH:MM で、本当にある日時だけを受け取る', () => {
		expect(isDateTimeString('2026-11-24T09:30')).toBe(true)
		expect(isDateTimeString('2026-02-30T09:30')).toBe(false)
		expect(isDateTimeString('2026-11-24T24:00')).toBe(false)
		expect(isDateTimeString('2026-11-24 09:30')).toBe(false)
		expect(isDateTimeString('2026-11-24')).toBe(false)
	})
})

it('日付の読み方は今までどおり', () => {
	expect(parseDateText('２０２６／１１／２４', today)).toBe('2026-11-24')
	expect(parseDateText(' 11/24 ', today)).toBe('2026-11-24')
})
