import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Field, FieldGroup } from './field'
import { MonthPicker } from './month-picker'

/**
 * 月の入力欄。手で打つことも、右のボタンで月の一覧を開いて選ぶこともできる。
 * 値は `YYYY-MM` の文字で、`<input type="month">` と同じ形。
 *
 * 見本では「今日」を 2026/11/24 に固定している。
 */
const meta = {
	title: '入力/MonthPicker',
	id: 'month-picker',
	component: MonthPicker,
	args: { today: '2026-11-24' },
} satisfies Meta<typeof MonthPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: args => {
		const [value, setValue] = React.useState('2026-10')
		return (
			<div className='grid w-48 gap-2'>
				<MonthPicker
					today={args.today}
					aria-label='対象月'
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
		<div className='h-64 w-48'>
			<MonthPicker
				today={args.today}
				aria-label='対象月'
				defaultValue='2026-10'
				defaultOpen
			/>
		</div>
	),
}

export const 空: Story = {
	render: args => (
		<div className='w-48'>
			<MonthPicker today={args.today} aria-label='対象月' />
		</div>
	),
}

/** `min`・`max` の外と、`isMonthDisabled` が true を返した月（ここでは 8 月）は選べない */
export const 選べない月: Story = {
	render: args => (
		<div className='h-64 w-48'>
			<MonthPicker
				today={args.today}
				aria-label='締める月'
				defaultValue='2026-10'
				min='2026-04'
				max='2026-11'
				isMonthDisabled={month => month === '2026-08'}
				defaultOpen
			/>
		</div>
	),
}

/** 開始月と終了月。たがいの値を `min`・`max` に渡すと、逆の順には選べない */
export const 開始月と終了月: Story = {
	render: args => {
		const [from, setFrom] = React.useState('2026-04')
		const [to, setTo] = React.useState('2026-09')
		return (
			<FieldGroup columns={2} className='w-96'>
				<Field label='開始月'>
					<MonthPicker
						today={args.today}
						value={from}
						onValueChange={setFrom}
						max={to || undefined}
					/>
				</Field>
				<Field label='終了月' description='開始月より前は選べません。'>
					<MonthPicker
						today={args.today}
						value={to}
						onValueChange={setTo}
						min={from || undefined}
					/>
				</Field>
			</FieldGroup>
		)
	},
}

export const 使えない: Story = {
	render: args => (
		<div className='grid w-48 gap-2'>
			<MonthPicker
				today={args.today}
				aria-label='使えない'
				defaultValue='2026-10'
				disabled
			/>
			<MonthPicker
				today={args.today}
				aria-label='読むだけ'
				defaultValue='2026-10'
				readOnly
			/>
		</div>
	),
}
