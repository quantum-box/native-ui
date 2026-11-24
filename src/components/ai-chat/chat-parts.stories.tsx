import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChart3, FileText, Receipt } from 'lucide-react'
import * as React from 'react'

import { type ChatSource, CitationMark, SourceList } from './chat-citations'
import { CodeBlock, TableBlock } from './chat-code-block'
import { ChatEmptyState, PromptSuggestions } from './chat-empty-state'
import { ChatError } from './chat-error'
import { MessageActions, type MessageFeedback } from './chat-message-actions'

/** 返事のまわりの小さな部品。出典・発言ごとの操作・問いの候補・コードと表・失敗。 */
const meta = {
	title: 'AI チャット/ChatParts',
} satisfies Meta

export default meta
type Story = StoryObj

const SOURCES: ChatSource[] = [
	{
		id: '1',
		title: '売上伝票（2026年10月）',
		kind: '集計',
		excerpt:
			'1,284 件。店ごとの合計は渋谷 412 万円・新宿 389 万円・池袋 251 万円。',
		href: '#sales-2026-10',
	},
	{
		id: '2',
		title: '池袋店 客数の推移',
		kind: '分析',
		excerpt: '平日 11〜14 時の客数が 9 月から 18% 減。',
		href: '#ikebukuro',
	},
	{
		id: '3',
		title: '商業施設の開業情報',
		kind: 'Web',
		href: 'https://example.com/opening',
	},
	{
		id: '4',
		title: '仕訳 JE-2026-1104',
		kind: '仕訳',
		href: '#je-1104',
		changed: true,
	},
]

export const 出典: Story = {
	render: () => (
		<div className='grid w-[34rem] gap-3 text-sm'>
			<p className='leading-relaxed'>
				先月の売上は、渋谷店が 412 万円、新宿店が 389 万円、池袋店が 251
				万円でした
				<CitationMark source={SOURCES[0]} />
				。池袋店は平日の昼の客数が減っていて
				<CitationMark source={SOURCES[1]} />
				、近くに商業施設ができた時期と重なります
				<CitationMark source={SOURCES[2]} />。
			</p>
			<SourceList sources={SOURCES} />
			<SourceList max={2} sources={SOURCES} title='操作した記録' />
		</div>
	),
}

export const 発言ごとの操作: Story = {
	render: function Render() {
		const [feedback, setFeedback] = React.useState<MessageFeedback>(null)
		return (
			<div className='grid w-[30rem] gap-4 text-sm'>
				<div className='grid gap-1'>
					<p>先月の売上は、渋谷店が 412 万円でした。</p>
					<MessageActions
						copyText='先月の売上は、渋谷店が 412 万円でした。'
						feedback={feedback}
						onFeedback={setFeedback}
						onRegenerate={() => {}}
					/>
				</div>
				<div className='grid justify-items-end gap-1'>
					<p className='rounded-xl bg-muted px-3 py-2'>先月の売上を教えて</p>
					<MessageActions copyText='先月の売上を教えて' onEdit={() => {}} />
				</div>
			</div>
		)
	},
}

const SUGGESTIONS = [
	{ label: '先月の売上を店ごとに', icon: <BarChart3 aria-hidden /> },
	{ label: '未払いの請求書を出して', icon: <Receipt aria-hidden /> },
	{
		label: 'この領収書を仕訳にして',
		prompt: '添付した領収書を読んで、仕訳の案を作ってください。',
		icon: <FileText aria-hidden />,
	},
	{
		label: 'とても長い問いの候補で、チップの幅を超えるときに省くかどうかを見る',
	},
]

export const 会話の始め: Story = {
	render: function Render() {
		const [picked, setPicked] = React.useState('')
		return (
			<div className='grid w-[34rem] gap-2 rounded-lg border border-border'>
				<ChatEmptyState
					description='売上・経費・仕訳・取引先のことを聞けます。添付した書類も読めます。'
					onSelect={setPicked}
					suggestions={SUGGESTIONS}
				/>
				{picked ? (
					<p className='px-4 pb-3 text-muted-foreground text-xs'>
						選んだ問い: {picked}
					</p>
				) : null}
			</div>
		)
	},
}

export const 問いの候補だけ: Story = {
	render: () => (
		<div className='w-[34rem]'>
			<PromptSuggestions onSelect={() => {}} suggestions={SUGGESTIONS} />
		</div>
	),
}

export const コードと表: Story = {
	render: () => (
		<div className='grid w-[34rem] gap-3'>
			<CodeBlock
				code={`SELECT store, SUM(amount) AS total
FROM sales
WHERE sold_at >= '2026-10-01' AND sold_at < '2026-11-01'
GROUP BY store
ORDER BY total DESC;`}
				language='SQL'
				title='実行した SQL'
			/>
			<TableBlock
				columns={['店', '10月', '9月', '増減']}
				numericColumns={[1, 2, 3]}
				rows={[
					['渋谷店', '4,120,000', '3,815,000', '+8.0%'],
					['新宿店', '3,890,000', '3,870,000', '+0.5%'],
					['池袋店', '2,510,000', '2,642,000', '-5.0%'],
				]}
				title='店ごとの売上'
			/>
		</div>
	),
}

export const 失敗とやり直し: Story = {
	render: function Render() {
		const [retrying, setRetrying] = React.useState(false)
		return (
			<div className='grid w-[30rem] gap-3'>
				<ChatError
					description='通信が切れた可能性があります。もう一度送ってください。'
					onRetry={() => {
						setRetrying(true)
						setTimeout(() => setRetrying(false), 1500)
					}}
					retrying={retrying}
					title='AI の返事が途中で止まりました'
				/>
				<ChatError title='添付を読めませんでした' />
			</div>
		)
	},
}
