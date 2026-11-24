/*
 * カレンダーの日付の計算。日付は `YYYY-MM-DD` の文字、月は `YYYY-MM` の文字で扱う。
 *
 * - 時刻と時間帯を持たない。計算は UTC の上でやるので、見ている人の時間帯や夏時間で
 *   日がずれない（`new Date('2026-11-24')` を現地の時刻として読み直さない）。
 * - 文字のまま大小を比べられる（`'2026-11-24' < '2026-12-01'`）。
 * - 外の物（date-fns など）は使わない。
 */

const DATE = /^(\d{4})-(\d{2})-(\d{2})$/
// 計算の途中だけ、扱える範囲の外（10000 年など）も読めるようにする
const LOOSE_DATE = /^(\d{4,})-(\d{2})-(\d{2})$/

/** 扱える最初の日と最後の日 */
export const MIN_DATE = '0001-01-01'
export const MAX_DATE = '9999-12-31'
const MONTH = /^(\d{4})-(\d{2})$/
const DAY_MS = 86_400_000

const pad = (n: number, width = 2) => {
	let text = String(n)
	while (text.length < width) text = `0${text}`
	return text
}

const utc = (year: number, month: number, day: number) => {
	// Date.UTC は 0〜99 の年を 1900 年代に読むので、年・月・日は後からまとめて入れる
	const date = new Date(0)
	date.setUTCFullYear(year, month - 1, day)
	return date
}

const fromUtc = (date: Date) =>
	`${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`

/** その月の日数 */
export function daysInMonth(year: number, month: number) {
	return utc(year, month + 1, 0).getUTCDate()
}

/** 年・月・日から `YYYY-MM-DD` を作る。無い日（2 月 30 日など）は `''` */
export function toDateString(year: number, month: number, day: number) {
	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		!Number.isInteger(day)
	)
		return ''
	if (year < 1 || year > 9999 || month < 1 || month > 12) return ''
	if (day < 1 || day > daysInMonth(year, month)) return ''
	return `${pad(year, 4)}-${pad(month)}-${pad(day)}`
}

/** `YYYY-MM-DD` で、本当にある日か */
export function isDateString(value: unknown): value is string {
	if (typeof value !== 'string') return false
	const match = DATE.exec(value)
	if (!match) return false
	return (
		toDateString(Number(match[1]), Number(match[2]), Number(match[3])) === value
	)
}

function parts(value: string) {
	const match = LOOSE_DATE.exec(value)
	if (!match) throw new Error(`日付の形が違います: ${value}`)
	return {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3]),
	}
}

/** n 日後（負なら前） */
export function addDays(value: string, amount: number) {
	const { year, month, day } = parts(value)
	return fromUtc(new Date(utc(year, month, day).getTime() + amount * DAY_MS))
}

/** n か月後（負なら前）。無い日は、その月の最後の日に寄せる（1/31 の 1 か月後は 2/28） */
export function addMonths(value: string, amount: number) {
	const { year, month, day } = parts(value)
	const index = year * 12 + (month - 1) + amount
	const nextYear = Math.floor(index / 12)
	const nextMonth = (((index % 12) + 12) % 12) + 1
	return `${pad(nextYear, 4)}-${pad(nextMonth)}-${pad(Math.min(day, daysInMonth(nextYear, nextMonth)))}`
}

/** 曜日。0 が日曜、6 が土曜 */
export function weekdayOf(value: string) {
	const { year, month, day } = parts(value)
	return utc(year, month, day).getUTCDay()
}

/** その日の月（`YYYY-MM`） */
export function monthOf(value: string) {
	return value.slice(0, 7)
}

/** `YYYY-MM` で、本当にある月か */
export function isMonthString(value: unknown): value is string {
	if (typeof value !== 'string') return false
	const match = MONTH.exec(value)
	if (!match) return false
	const month = Number(match[2])
	return Number(match[1]) >= 1 && month >= 1 && month <= 12
}

/** 月を n か月動かす */
export function addMonthsToMonth(month: string, amount: number) {
	return monthOf(addMonths(`${month}-01`, amount))
}

/** 見ている人の現地の「今日」 */
export function todayString(now: Date = new Date()) {
	return `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** min と max のあいだに収める */
export function clampDate(value: string, min?: string, max?: string) {
	// 扱える範囲（1 年〜9999 年）の外へ出たら、端の日に寄せる
	let date = value
	const inDomain: boolean = isDateString(date)
	if (!inDomain) date = date.length > 10 ? MAX_DATE : MIN_DATE
	if (min && date < min) return min
	if (max && date > max) return max
	return date
}

/**
 * 月の表に並べる日。週ごとの 6 行で、前後の月の日も入る
 * （行の数をいつも同じにして、月を動かしても高さが変わらないようにする）。
 */
export function monthGrid(month: string, weekStartsOn: 0 | 1 = 0): string[][] {
	const first = `${month}-01`
	const offset = (weekdayOf(first) - weekStartsOn + 7) % 7
	const start = addDays(first, -offset)
	const weeks: string[][] = []
	for (let week = 0; week < 6; week++) {
		const days: string[] = []
		for (let day = 0; day < 7; day++) {
			days.push(addDays(start, week * 7 + day))
		}
		weeks.push(days)
	}
	return weeks
}

/**
 * 手で打った文字を日付に直す。読めなければ `''`。
 * 受け取る形: `2026-11-24`・`2026/11/24`・`2026.11.24`・`2026年11月24日`・`20261124`、
 * 年を省いた `11/24`・`11月24日`・`1124`（年は `today` の年）。月と日の 0 は省ける。
 */
export function parseDateText(text: string, today: string = todayString()) {
	// 全角の数字と記号を半角に直す
	const normalized = text
		.trim()
		.replace(/[０-９]/g, char =>
			String.fromCharCode(char.charCodeAt(0) - 0xfee0),
		)
		.replace(/[／．－ー]/g, char =>
			char === '／' ? '/' : char === '．' ? '.' : '-',
		)
		.replace(/\s+/g, '')
	if (!normalized) return ''
	const thisYear = Number(today.slice(0, 4))

	let match = /^(\d{4})(\d{2})(\d{2})$/.exec(normalized)
	if (match)
		return toDateString(Number(match[1]), Number(match[2]), Number(match[3]))

	match = /^(\d{2})(\d{2})$/.exec(normalized)
	if (match) return toDateString(thisYear, Number(match[1]), Number(match[2]))

	match = /^(\d{1,4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/.exec(normalized)
	if (match)
		return toDateString(Number(match[1]), Number(match[2]), Number(match[3]))

	match = /^(\d{1,2})[-/.月](\d{1,2})日?$/.exec(normalized)
	if (match) return toDateString(thisYear, Number(match[1]), Number(match[2]))

	return ''
}

/** 既定の表示の形（`2026/11/24`）。DataTableDateCell と同じ */
export function formatDateSlash(value: string) {
	return value.replace(/-/g, '/')
}
