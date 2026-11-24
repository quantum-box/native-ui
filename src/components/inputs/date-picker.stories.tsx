import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { weekdayOf } from '../../lib/calendar-date'
import type { DateRange } from './calendar'
import { DatePicker, DateRangePicker } from './date-picker'
import { Field, FieldGroup } from './field'

/**
 * 日付の入力欄（DatePicker）と、期間の入力欄（DateRangePicker）。
 *
 * DatePicker は手で打つことも、右のボタンでカレンダーを開いて選ぶこともできる。
 * 値は `YYYY-MM-DD` の文字で、`<input type="date">` と同じ形。
 *
 * 見本では「今日」を 2026/11/24 に固定している。
 */
const meta = {
	title: '入力/DatePicker',
	id: 'date-picker',
	component: DatePicker,
	args: { today: '2026-11-24' },
} satisfies Meta<typeof DatePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: args => {
		const [value, setValue] = React.useState('2026-11-18')
		return (
			<div className='grid w-56 gap-2'>
				<DatePicker
					today={args.today}
					aria-label='納期'
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>値: {value || '（空）'}</p>
			</div>
		)
	},
}

export const 開いたところ: Story = {
	render: args => (
		<div className='h-80 w-56'>
			<DatePicker
				today={args.today}
				aria-label='納期'
				defaultValue='2026-11-18'
				defaultOpen
			/>
		</div>
	),
}

export const 空: Story = {
	render: args => (
		<div className='w-56'>
			<DatePicker today={args.today} aria-label='納期' />
		</div>
	),
}

/** Field の中に置くと、ラベル・説明・エラーがつながる */
export const 欄の中: Story = {
	render: args => (
		<FieldGroup columns={2} className='w-[32rem]'>
			<Field label='営業日' description='今日までの日を選べます。' required>
				<DatePicker
					today={args.today}
					defaultValue='2026-11-24'
					max='2026-11-24'
					required
				/>
			</Field>
			<Field label='納期' error='納期を入れてください。'>
				<DatePicker today={args.today} />
			</Field>
		</FieldGroup>
	),
}

/** 土日と、今日より前の日は選べない。手で打っても、選べない日は元の値に戻る */
export const 選べない日: Story = {
	render: args => (
		<div className='h-80 w-56'>
			<DatePicker
				today={args.today}
				aria-label='予約の日'
				defaultValue='2026-11-26'
				min='2026-11-24'
				isDateDisabled={date => weekdayOf(date) === 0 || weekdayOf(date) === 6}
				defaultOpen
			/>
		</div>
	),
}

export const 使えない: Story = {
	render: args => (
		<div className='grid w-56 gap-2'>
			<DatePicker
				today={args.today}
				aria-label='使えない'
				defaultValue='2026-11-18'
				disabled
			/>
			<DatePicker
				today={args.today}
				aria-label='読むだけ'
				defaultValue='2026-11-18'
				readOnly
			/>
		</div>
	),
}

export const 期間: Story = {
	render: args => {
		const [value, setValue] = React.useState<DateRange>({
			from: '2026-11-01',
			to: '2026-11-30',
		})
		return (
			<div className='grid w-64 gap-2'>
				<DateRangePicker
					today={args.today}
					aria-label='集計の期間'
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>
					値: {value.from || '（空）'} 〜 {value.to || '（空）'}
				</p>
			</div>
		)
	},
}

export const 期間を開いたところ: Story = {
	render: args => (
		<div className='h-80 w-64'>
			<DateRangePicker
				today={args.today}
				aria-label='集計の期間'
				defaultValue={{ from: '2026-11-10', to: '2026-11-18' }}
				defaultOpen
			/>
		</div>
	),
}

export const 期間が空: Story = {
	render: args => (
		<div className='w-64'>
			<DateRangePicker today={args.today} aria-label='集計の期間' />
		</div>
	),
}
