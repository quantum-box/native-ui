import type { Meta, StoryObj } from '@storybook/react-vite'
import { AlertCircle, Check, FileText, Loader2, Search } from 'lucide-react'

import {
	Trace,
	TraceCollapsible,
	TraceCollapsibleContent,
	TraceCollapsibleTrigger,
	TraceDescription,
	TraceIcon,
	TraceLine,
	TraceTitle,
} from './trace'

/** AI が裏でしたことの経過。押すと中身が開く。動いている途中は文字が光って流れる。 */
const meta = {
	title: 'AI チャット/Trace',
	component: Trace,
} satisfies Meta<typeof Trace>

export default meta
type Story = StoryObj<typeof meta>

export const 経過: Story = {
	render: () => (
		<Trace className='w-[28rem]'>
			<TraceCollapsible defaultOpen>
				<TraceCollapsibleTrigger>
					<TraceLine>
						<TraceIcon>
							<Search />
						</TraceIcon>
						<TraceTitle>取引先を調べました</TraceTitle>
						<TraceDescription>0.8 秒</TraceDescription>
					</TraceLine>
				</TraceCollapsibleTrigger>
				<TraceCollapsibleContent>
					<Trace>
						<TraceLine>
							<TraceIcon>
								<Check />
							</TraceIcon>
							<TraceTitle>「サンプル」を含む取引先 3 件</TraceTitle>
						</TraceLine>
						<TraceLine>
							<TraceIcon>
								<FileText />
							</TraceIcon>
							<TraceTitle>請求書 12 件を読みました</TraceTitle>
						</TraceLine>
					</Trace>
				</TraceCollapsibleContent>
			</TraceCollapsible>
			<TraceCollapsible>
				<TraceCollapsibleTrigger>
					<TraceLine status='error'>
						<TraceIcon>
							<AlertCircle />
						</TraceIcon>
						<TraceTitle>銀行の明細を取れませんでした</TraceTitle>
					</TraceLine>
				</TraceCollapsibleTrigger>
				<TraceCollapsibleContent>
					銀行との連携が切れています。設定から連携し直してください。
				</TraceCollapsibleContent>
			</TraceCollapsible>
			<TraceLine status='running'>
				<TraceIcon>
					<Loader2 className='animate-spin' />
				</TraceIcon>
				<TraceTitle>売上をまとめています…</TraceTitle>
			</TraceLine>
			<TraceLine status='pending'>
				<TraceIcon>
					<FileText />
				</TraceIcon>
				<TraceTitle>報告書を作る</TraceTitle>
			</TraceLine>
		</Trace>
	),
}
