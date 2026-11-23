import type { Meta, StoryObj } from '@storybook/react-vite'

import { ToolCall, ToolCallGroup } from './chat-tool-call'
import { Trace } from './trace'

/** AI が道具を使った記録。押すと渡した物と返ってきた物が開く。 */
const meta = {
	title: 'Components/AI のチャット/ToolCall（道具の記録）',
} satisfies Meta

export default meta
type Story = StoryObj

export const 状態の一覧: Story = {
	render: () => (
		<Trace className='w-[32rem]'>
			<ToolCall name='取引先を探す' status='pending' />
			<ToolCall
				input={{ query: 'サンプル商事' }}
				name='取引先を探す'
				status='running'
			/>
			<ToolCall
				defaultOpen
				description='0.8 秒'
				input={{ query: 'サンプル商事', limit: 5 }}
				name='取引先を探す'
				output={[
					{ id: 'C-0012', name: '株式会社サンプル商事' },
					{ id: 'C-0187', name: 'サンプル商事（大阪）' },
				]}
				status='done'
			/>
			<ToolCall
				error='銀行との連携が切れています。設定から連携し直してください。'
				input={{ account: '普通 1234567' }}
				name='銀行の明細を取る'
				status='error'
			/>
		</Trace>
	),
}

export const まとめて折りたたむ: Story = {
	render: () => (
		<Trace className='w-[32rem]'>
			<ToolCallGroup count={3} failed={1}>
				<ToolCall
					description='0.4 秒'
					input='2026年10月'
					name='売上伝票を読む'
					output='1,284 件'
					status='done'
				/>
				<ToolCall
					description='0.2 秒'
					name='店ごとに足す'
					output={{ 渋谷店: 4120000, 新宿店: 3890000, 池袋店: 2510000 }}
					status='done'
				/>
				<ToolCall
					error='時間切れになりました。'
					name='天気の記録を読む'
					status='error'
				/>
			</ToolCallGroup>
			<ToolCallGroup count={2} running title='調べています'>
				<ToolCall name='客数を数える' status='done' />
				<ToolCall name='客単価を出す' status='running' />
			</ToolCallGroup>
		</Trace>
	),
}
