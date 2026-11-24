import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import {
	type ApprovalChange,
	ApprovalRequest,
	type ApprovalStatus,
} from './chat-approval'

/** AI が何かを変える前に「この操作をしてよいか」を聞く枠。 */
const meta = {
	title: 'AI チャット/ApprovalRequest',
} satisfies Meta

export default meta
type Story = StoryObj

const CHANGES: ApprovalChange[] = [
	{ label: '勘定科目', before: '雑費', after: '消耗品費' },
	{ label: '取引先', before: '（なし）', after: '株式会社サンプル商事' },
	{ label: 'メモ', after: '11月分の文具' },
	{ label: '添付', before: '古いレシート.jpg' },
]

export const 待ち: Story = {
	render: () => (
		<div className='w-[30rem]'>
			<ApprovalRequest
				changes={CHANGES}
				description='11月4日の 3,200 円の支払いを直します。'
				onApprove={() => {}}
				onApproveAlways={() => {}}
				onReject={() => {}}
				title='仕訳を 1 件直します'
				totalChanges={6}
			/>
		</div>
	),
}

export const 決めたあと: Story = {
	render: () => (
		<div className='grid w-[30rem] gap-3'>
			<ApprovalRequest
				changes={CHANGES.slice(0, 2)}
				status='approved'
				title='仕訳を 1 件直します'
			/>
			<ApprovalRequest status='rejected' title='取引先を 2 件まとめます' />
		</div>
	),
}

export const 触って試す: Story = {
	render: function Render() {
		const [status, setStatus] = React.useState<ApprovalStatus>('pending')
		const [busy, setBusy] = React.useState(false)
		const decide = (next: ApprovalStatus) => {
			setBusy(true)
			setTimeout(() => {
				setBusy(false)
				setStatus(next)
			}, 800)
		}
		return (
			<div className='grid w-[30rem] gap-2'>
				<ApprovalRequest
					busy={busy}
					changes={CHANGES}
					onApprove={() => decide('approved')}
					onReject={() => decide('rejected')}
					status={status}
					title='仕訳を 1 件直します'
				/>
				<button
					className='w-fit text-primary text-xs underline'
					onClick={() => setStatus('pending')}
					type='button'
				>
					元に戻す
				</button>
			</div>
		)
	},
}
