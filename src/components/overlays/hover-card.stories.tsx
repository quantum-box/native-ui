import type { Meta, StoryObj } from '@storybook/react-vite'

import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

/**
 * 触れると出る小さな枠。補足を見せるだけで、大事な操作は置かない。
 * 触れて 0.7 秒で出て、離れて 0.3 秒で消える（Radix の HoverCard と同じ）。
 */
const meta = {
	title: '重なる物/HoverCard',
	component: HoverCard,
} satisfies Meta<typeof HoverCard>

export default meta
type Story = StoryObj<typeof meta>

function Card() {
	return (
		<div className='grid gap-1'>
			<p className='font-medium'>山田商店</p>
			<p className='text-muted-foreground text-xs'>取引先 C-0001・渋谷区</p>
			<p className='text-xs'>最後の取引: 2026-11-20（¥182,400）</p>
		</div>
	)
}

export const Default: Story = {
	render: () => (
		<p className='text-sm'>
			受注は{' '}
			<HoverCard>
				<HoverCardTrigger
					href='#customer'
					className='font-medium text-primary underline-offset-4 hover:underline'
				>
					山田商店
				</HoverCardTrigger>
				<HoverCardContent>
					<Card />
				</HoverCardContent>
			</HoverCard>{' '}
			から届いた。
		</p>
	),
}

/** 開いたままの形（ライトとダーク）。位置は side・align で変えられる */
export const 開いたところ: Story = {
	render: () => (
		<div className='grid grid-cols-2 gap-4'>
			{(['light', 'dark'] as const).map(theme => (
				<div
					key={theme}
					className={`${theme === 'dark' ? 'dark' : ''} h-48 rounded-lg border border-border bg-background p-4 text-foreground`}
				>
					<HoverCard open>
						<HoverCardTrigger asChild>
							<button type='button' className='text-primary text-sm'>
								{theme === 'dark' ? 'ダーク' : 'ライト'}の山田商店
							</button>
						</HoverCardTrigger>
						<HoverCardContent side='bottom' align='start' className='w-60'>
							<Card />
						</HoverCardContent>
					</HoverCard>
				</div>
			))}
		</div>
	),
}
