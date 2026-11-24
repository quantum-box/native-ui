import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import {
	StreamingText,
	ThinkingBlock,
	ThinkingIndicator,
} from './chat-streaming'

/** 返事が届いている途中の見せ方。流れてくる文字・考えている印・考えた筋道。 */
const meta = {
	title: 'AI チャット/ChatStreaming',
} satisfies Meta

export default meta
type Story = StoryObj

const ANSWER =
	'先月の売上は、渋谷店が 412 万円、新宿店が 389 万円、池袋店が 251 万円でした。前の月と比べると、渋谷店が 8% 増え、池袋店は 5% 減っています。池袋店は平日の昼の客数が減っていて、近くに競合の店ができた時期と重なります。'

export const 文字が流れてくる: Story = {
	render: function Render() {
		const [length, setLength] = React.useState(0)
		React.useEffect(() => {
			if (length >= ANSWER.length) return
			const timer = setTimeout(() => setLength(length + 2), 40)
			return () => clearTimeout(timer)
		}, [length])
		return (
			<div className='grid w-[32rem] gap-3'>
				<StreamingText streaming={length < ANSWER.length}>
					{ANSWER.slice(0, length)}
				</StreamingText>
				<button
					className='w-fit text-primary text-xs underline'
					onClick={() => setLength(0)}
					type='button'
				>
					もう一度流す
				</button>
			</div>
		)
	},
}

export const 考えている印: Story = {
	render: () => (
		<div className='grid w-[24rem] gap-4'>
			<ThinkingIndicator />
			<ThinkingIndicator label='売上の表を調べています' showElapsed />
		</div>
	),
}

const THOUGHT = `問いは「先月の売上を店ごとに」なので、2026年10月の売上伝票を店で分けて足せばよい。
前の月との比べも求められているので、9月も同じように出す。
池袋店だけ減っているので、理由になりそうな物（客数・客単価）も見ておく。`

export const 考えた筋道: Story = {
	render: function Render() {
		const [thinking, setThinking] = React.useState(true)
		React.useEffect(() => {
			if (!thinking) return
			const timer = setTimeout(() => setThinking(false), 3000)
			return () => clearTimeout(timer)
		}, [thinking])
		return (
			<div className='grid w-[32rem] gap-4'>
				<ThinkingBlock durationSeconds={12} thinking={thinking}>
					{THOUGHT}
				</ThinkingBlock>
				<ThinkingBlock durationSeconds={95}>{THOUGHT}</ThinkingBlock>
				<button
					className='w-fit text-primary text-xs underline'
					onClick={() => setThinking(true)}
					type='button'
				>
					もう一度考えさせる
				</button>
			</div>
		)
	},
}
