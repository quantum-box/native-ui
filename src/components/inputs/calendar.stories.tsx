import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { weekdayOf } from '../../lib/calendar-date'
import { Calendar, type DateRange } from './calendar'

/**
 * 月の表から日を選ぶ部品。1 日を選ぶか、期間を選ぶ。
 *
 * 日付は `YYYY-MM-DD` の文字で受け渡す。矢印で 1 日・1 週、Home・End で週の端、
 * PageUp・PageDown で前後の月（Shift を足すと前後の年）、Enter・Space で選ぶ。
 * 入力欄に付けて使うときは DatePicker・DateRangePicker を使う。
 *
 * 見本では「今日」を 2026/11/24 に固定している。
 */
const meta = {
	title: '入力/Calendar',
	id: 'calendar',
	component: Calendar,
	args: { today: '2026-11-24' },
} satisfies Meta<typeof Calendar>

export default meta
type Story = StoryObj<typeof meta>

const frame = 'rounded-lg border border-border bg-popover'

export const Default: Story = {
	render: args => {
		const [value, setValue] = React.useState('2026-11-18')
		return (
			<div className='grid justify-items-center gap-2'>
				<Calendar
					today={args.today}
					className={frame}
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>選んだ日: {value}</p>
			</div>
		)
	},
}

export const 期間を選ぶ: Story = {
	render: args => {
		const [value, setValue] = React.useState<DateRange>({
			from: '2026-11-10',
			to: '2026-11-18',
		})
		return (
			<div className='grid justify-items-center gap-2'>
				<Calendar
					mode='range'
					today={args.today}
					className={frame}
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>
					{value.from || '—'} 〜 {value.to || '—'}
				</p>
			</div>
		)
	},
}

export const 月をまたぐ期間: Story = {
	render: args => (
		<Calendar
			mode='range'
			today={args.today}
			className={frame}
			defaultValue={{ from: '2026-10-28', to: '2026-11-12' }}
			defaultMonth='2026-11'
		/>
	),
}

/** `min`・`max` の外と、`isDateDisabled` が true を返した日（ここでは土日）は選べない */
export const 選べない日: Story = {
	render: args => (
		<Calendar
			today={args.today}
			className={frame}
			defaultValue='2026-11-20'
			min='2026-11-09'
			max='2026-12-11'
			isDateDisabled={date => weekdayOf(date) === 0 || weekdayOf(date) === 6}
		/>
	),
}

export const 月曜はじまり: Story = {
	render: args => (
		<Calendar
			today={args.today}
			className={frame}
			defaultValue='2026-11-18'
			weekStartsOn={1}
		/>
	),
}

export const 選んでいない: Story = {
	render: args => <Calendar today={args.today} className={frame} />,
}
