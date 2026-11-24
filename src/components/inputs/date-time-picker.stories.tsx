import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { DateTimePicker } from './date-time-picker'
import { Field, FieldGroup } from './field'

/**
 * 日時の入力欄。日付の欄と時刻の欄を横に並べて、1 つの値にする。
 * 値は `YYYY-MM-DDTHH:MM` の文字で、`<input type="datetime-local">` と同じ形。
 *
 * 日付と時刻の両方が入ったときに値が決まる（片方だけのあいだは空）。
 * 見本では「今日」を 2026/11/24 に固定している。
 */
const meta = {
	title: '入力/DateTimePicker',
	id: 'date-time-picker',
	component: DateTimePicker,
	args: { today: '2026-11-24' },
} satisfies Meta<typeof DateTimePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: args => {
		const [value, setValue] = React.useState('2026-11-24T09:30')
		return (
			<div className='grid w-72 gap-2'>
				<DateTimePicker
					today={args.today}
					aria-label='受付の日時'
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>値: {value || '（空）'}</p>
			</div>
		)
	},
}

export const 空: Story = {
	render: args => {
		const [value, setValue] = React.useState('')
		return (
			<div className='grid w-72 gap-2'>
				<DateTimePicker
					today={args.today}
					aria-label='受付の日時'
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>値: {value || '（空）'}</p>
			</div>
		)
	},
}

/** `defaultTime` を渡すと、日付を先に入れたときに、その時刻が入る */
export const はじめの時刻: Story = {
	render: args => {
		const [value, setValue] = React.useState('')
		return (
			<div className='grid w-72 gap-2'>
				<DateTimePicker
					today={args.today}
					aria-label='レジ締めの日時'
					defaultTime='18:00'
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>値: {value || '（空）'}</p>
			</div>
		)
	},
}

/** Field の中に置くと、ラベル・説明・エラーがつながる */
export const 欄の中: Story = {
	render: args => (
		<FieldGroup columns={2} className='w-[40rem]'>
			<Field label='受付の日時' description='お客様が来た日時です。' required>
				<DateTimePicker
					today={args.today}
					defaultValue='2026-11-24T09:30'
					required
				/>
			</Field>
			<Field label='有効の終わり' error='日時を入れてください。'>
				<DateTimePicker today={args.today} />
			</Field>
		</FieldGroup>
	),
}

/**
 * 11/24 10:00 〜 11/30 18:00 だけ選べる。外の日は選べず、端の日では時刻も絞る
 * （11/24 は 10:00 から、11/30 は 18:00 まで）
 */
export const 範囲: Story = {
	render: args => {
		const [value, setValue] = React.useState('2026-11-24T10:00')
		return (
			<div className='grid w-72 gap-2'>
				<DateTimePicker
					today={args.today}
					aria-label='クーポンの有効の終わり'
					min='2026-11-24T10:00'
					max='2026-11-30T18:00'
					value={value}
					onValueChange={setValue}
				/>
				<p className='text-xs text-muted-foreground'>値: {value || '（空）'}</p>
			</div>
		)
	},
}

export const 使えない: Story = {
	render: args => (
		<div className='grid w-72 gap-2'>
			<DateTimePicker
				today={args.today}
				aria-label='使えない'
				defaultValue='2026-11-24T09:30'
				disabled
			/>
			<DateTimePicker
				today={args.today}
				aria-label='読むだけ'
				defaultValue='2026-11-24T09:30'
				readOnly
			/>
		</div>
	),
}
