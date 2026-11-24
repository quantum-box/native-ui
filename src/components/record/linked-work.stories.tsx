import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleDot, Inbox, Layers, SquareKanban } from 'lucide-react'
import * as React from 'react'

import {
	type LinkWorkKindOption,
	LinkWorkDialog,
	type LinkWorkSelection,
	type LinkedWork,
	LinkedWorkList,
	type LinkedWorkRecord,
	defineLinkedWorkKind,
} from './linked-work'
import { RecordKindProvider, type RecordSystemDefinition } from './record'

// ---- 例（Field の戦略の画面と同じ中身の作り物） --------------------------------------

const SYSTEMS = {
	// 商標の色は使わず、native-ui の色の印から選ぶ。
	linear: { name: 'Linear', icon: SquareKanban, tone: 'violet' },
	field: { name: 'Field', icon: Inbox, tone: 'teal' },
} satisfies Record<string, RecordSystemDefinition>

const KINDS = {
	'linear.issue': defineLinkedWorkKind({
		name: 'Issue',
		system: 'linear',
		icon: CircleDot,
		openLabel: 'Linear で開く',
		missingText: '見られなくなった Issue',
	}),
	'linear.project': defineLinkedWorkKind({
		name: 'プロジェクト',
		system: 'linear',
		icon: Layers,
		openLabel: 'Linear で開く',
	}),
	'field.inquiry': defineLinkedWorkKind({
		name: '問い合わせ',
		system: 'field',
		icon: Inbox,
		openLabel: '問い合わせを開く',
	}),
}

const TEAMS = [
	{ id: 'com', label: 'アニマルコミュニティ事業（COM）' },
	{ id: 'plt', label: 'プラットフォーム（PLT）' },
	{ id: 'ops', label: '店舗運営（OPS）' },
]

const issue = (
	team: string,
	number: number,
	title: string,
	progress: LinkedWorkRecord['progress'] = 'open',
): LinkedWorkRecord => ({
	id: `${team}-${number}`,
	publicId: `${team.toUpperCase()}-${number}`,
	title,
	progress,
	url: `https://linear.app/example/issue/${team.toUpperCase()}-${number}`,
})

const ISSUES: Record<string, LinkedWorkRecord[]> = {
	com: [
		issue('com', 929, 'パナスクのレジ入れ替え先を決める'),
		issue('com', 931, '新しいレジの研修の日程を組む', 'done'),
		issue('com', 934, '店頭の案内を差し替える'),
		issue('com', 936, '入れ替え後の売上を見比べる'),
		issue('com', 940, '古いレジの引き取りを頼む'),
		issue('com', 942, '入れ替えの費用を見積もる'),
		issue('com', 945, '店長に入れ替えの手順を伝える'),
		issue('com', 947, '入れ替えの日の人員を決める', 'cancelled'),
	],
	plt: [
		issue('plt', 6259, '行動と外の仕事を結ぶ'),
		issue('plt', 6272, '発生元を記録する'),
		issue('plt', 6301, 'Linear の読み直しを速くする'),
	],
	ops: [issue('ops', 118, '週次の棚卸しを見直す')],
}

const ORIGIN = issue('com', 912, '池袋店のレジ入れ替えの相談')

const INITIAL_LINKS: LinkedWork[] = [
	{
		id: 'l1',
		kind: 'linear.issue',
		relation: 'executes',
		record: ISSUES.com[0],
	},
	{
		id: 'l2',
		kind: 'linear.issue',
		relation: 'references',
		record: ISSUES.com[1],
	},
	{
		id: 'l3',
		kind: 'linear.issue',
		relation: 'references',
		record: ISSUES.plt[0],
		read: 'stale',
	},
	{
		id: 'l9',
		kind: 'linear.issue',
		relation: 'executes',
		record: issue('com', 901, '前のレジの不具合を調べる', 'done'),
		withdrawn: { at: '2026/11/20', reason: '別の行動で進めることになったため' },
	},
]

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** 結んだ仕事と、結ぶ手順を動かす作り物（使う側が持つ部分）。 */
function useLinks(initial: LinkedWork[], kinds: readonly LinkWorkKindOption[]) {
	const [links, setLinks] = React.useState(initial)
	const [open, setOpen] = React.useState(false)
	const [selection, setSelection] = React.useState<LinkWorkSelection | null>(
		null,
	)
	const [shown, setShown] = React.useState(4)
	const [loadingMore, setLoadingMore] = React.useState(false)
	const [loading, setLoading] = React.useState(false)
	const [notice, setNotice] = React.useState<string | null>(null)
	const pool = React.useMemo(() => {
		if (!selection) return []
		if (selection.kind === 'linear.issue')
			return ISSUES[selection.source ?? 'com'] ?? []
		if (selection.kind === 'linear.project')
			return [
				{ id: 'p1', title: 'レジの入れ替え（2026 年冬）' },
				{ id: 'p2', title: '店舗の案内の刷新' },
			]
		return [
			{ id: 'q1', publicId: '問-2041', title: 'レジが動かないとの問い合わせ' },
			{ id: 'q2', publicId: '問-2050', title: '入れ替えの日程の確認' },
		]
	}, [selection])
	const onSelectionChange = React.useCallback((next: LinkWorkSelection) => {
		setSelection(next)
		setShown(4)
	}, [])
	return {
		links,
		notice,
		list: {
			links,
			onLink: () => setOpen(true),
			// つなぐ・つなぎ直すは、実際のアプリでは設定の画面へ移る。
			onConnect: () => setNotice('Linear をつなぐ設定の画面へ移ります（例）。'),
			loading,
			onReload: async () => {
				setLoading(true)
				await wait(600)
				setLinks(current =>
					current.map(work =>
						work.read === 'stale' ? { ...work, read: 'ready' } : work,
					),
				)
				setLoading(false)
			},
			onUnlink: async (work: LinkedWork, reason: string) => {
				await wait(500)
				setLinks(current =>
					current.map(item =>
						item.id === work.id
							? { ...item, withdrawn: { at: '2026/11/24', reason } }
							: item,
					),
				)
			},
		},
		dialog: {
			open,
			onOpenChange: setOpen,
			kinds,
			candidates: pool.slice(0, shown),
			hasMore: pool.length > shown,
			loadingMore,
			onLoadMore: async () => {
				setLoadingMore(true)
				await wait(500)
				setShown(value => value + 4)
				setLoadingMore(false)
			},
			onSelectionChange,
			onSubmit: async ({
				kind,
				record,
				relation,
			}: {
				kind: string
				record: LinkedWorkRecord
				relation: LinkedWork['relation']
			}) => {
				await wait(500)
				if (
					links.some(work => !work.withdrawn && work.record?.id === record.id)
				)
					throw new Error(
						'同じ仕事をすでに結んでいます。前に結んだものを外すか、別の仕事を選んでください。',
					)
				setLinks(current => [
					...current,
					{ id: `l${current.length + 1}`, kind, relation, record },
				])
			},
			formatError: (error: unknown) =>
				error instanceof Error ? error.message : '結べませんでした。',
		},
	}
}

const ISSUE_ONLY: LinkWorkKindOption[] = [
	{
		kind: 'linear.issue',
		label: 'Linear の Issue',
		sources: TEAMS,
		sourceLabel: 'チーム',
	},
]

const MANY_KINDS: LinkWorkKindOption[] = [
	...ISSUE_ONLY.map(option => ({
		...option,
		description: '会社が使うと決めたチームの Issue',
	})),
	{
		kind: 'linear.project',
		label: 'Linear のプロジェクト',
		description: 'いくつもの Issue をまとめた物',
	},
	{
		kind: 'field.inquiry',
		label: 'Field の問い合わせ',
		description: 'お客様からの問い合わせ',
	},
]

/**
 * 外のサービスの仕事（Linear の Issue など）を結ぶ所。記録の部品の上に作ってあり、結んだ仕事は
 * 記録の名前の印と要点のカード（システムの帯「Linear」、番号と題名、進み具合、「Linear で開く ↗」）で出す。
 *
 * - `defineLinkedWorkKind` で種類を、`systems` でシステムの絵と色を決める（商標の色は使わない）。
 * - `LinkedWorkList`: 結んだ仕事の一覧（進み具合・結び方の札、外す、読めない様子と次の一手、発生元、外した仕事）
 * - `LinkWorkDialog`: 結ぶ手順（何を → どこから → 探して選ぶ（続きを読む）→ 結び方 → 結ぶ）
 * - `UnlinkWorkDialog`: 外す理由を書かせる小さなダイアログ
 * - `WorkOrigin`: この行動がどの外の仕事から生まれたか
 *
 * 今の画面は Field（戦略）として、Linear の記録は別のシステムの見た目で出している。
 */
const meta = {
	title: '記録/LinkedWork',
	id: 'linked-work',
	parameters: { layout: 'padded' },
	decorators: [
		Story => (
			<RecordKindProvider kinds={KINDS} systems={SYSTEMS} currentSystem='field'>
				<Story />
			</RecordKindProvider>
		),
	],
} satisfies Meta

export default meta
type Story = StoryObj

function ActionPanel({
	initial = INITIAL_LINKS,
	kinds = ISSUE_ONLY,
	width = 'w-[420px]',
}: {
	initial?: LinkedWork[]
	kinds?: LinkWorkKindOption[]
	width?: string
}) {
	const state = useLinks(initial, kinds)
	const issueOnly = kinds.length === 1
	return (
		<aside
			className={`${width} max-w-full space-y-4 rounded-lg border border-border bg-background p-4`}
		>
			<header className='space-y-1'>
				<p className='text-muted-foreground text-xs'>行動</p>
				<h3 className='font-semibold text-base'>池袋店のレジを入れ替える</h3>
				<p className='text-muted-foreground text-sm'>
					期限 2026/12/10 · 進行中
				</p>
			</header>
			<LinkedWorkList
				title={issueOnly ? 'Linear の Issue' : '関係する仕事'}
				linkLabel={issueOnly ? 'Issue を結ぶ' : '仕事を結ぶ'}
				origin={{ kind: 'linear.issue', record: ORIGIN, receivedCount: 3 }}
				{...state.list}
			/>
			{state.notice ? (
				<p role='status' className='text-muted-foreground text-xs'>
					{state.notice}
				</p>
			) : null}
			<LinkWorkDialog
				title={issueOnly ? 'Linear の Issue を結ぶ' : '仕事を結ぶ'}
				{...state.dialog}
			/>
		</aside>
	)
}

/**
 * 行動に Linear の Issue を結ぶ（右から出る詳細の画面の幅、420px）。
 * 「Issue を結ぶ」で手順のダイアログが開く。種類は Issue だけなので種類の段は出ず、チーム → 探して選ぶ
 * （「続きを読む」で次のページ）→ 結び方 → 結ぶ、の順。すでに結んだ Issue を選ぶと理由を出して止まる。
 * 「外す」は理由を書かせてから外し、外した仕事は下に畳んで出る。「古い」の Issue は「読み直す」で直る。
 */
export const LinkIssueToAction: Story = {
	name: '行動に Linear の Issue を結ぶ',
	render: () => <ActionPanel />,
}

/**
 * 元のサービスから読めない様子。記録の「消えた・見る権限が無い」と同じ考え方で、印と理由と次の一手を出す。
 * 古い（読み直す）・一部だけ（読み直す）・消えた／見られなくなった（つなぎ直す・外す）・つないでいない（つなぐ）・
 * 見る権限が無い・今は読めない（読み直す）。
 */
export const ReadStates: Story = {
	name: '読めない状態',
	render: () => (
		<ActionPanel
			initial={[
				{
					id: 's1',
					kind: 'linear.issue',
					relation: 'executes',
					record: ISSUES.com[0],
					read: 'stale',
				},
				{
					id: 's2',
					kind: 'linear.issue',
					relation: 'references',
					record: ISSUES.com[2],
					read: 'partial',
				},
				{
					id: 's3',
					kind: 'linear.issue',
					relation: 'references',
					record: { id: 'com-800', publicId: 'COM-800' },
					read: 'revoked',
				},
				{
					id: 's4',
					kind: 'linear.project',
					relation: 'references',
					record: { id: 'p1', title: 'レジの入れ替え（2026 年冬）' },
					read: 'unconnected',
				},
				{
					id: 's5',
					kind: 'linear.issue',
					relation: 'references',
					record: { id: 'plt-7001', publicId: 'PLT-7001' },
					read: 'forbidden',
				},
				{
					id: 's6',
					kind: 'linear.issue',
					relation: 'executes',
					record: ISSUES.plt[1],
					read: 'unavailable',
				},
			]}
		/>
	),
}

/**
 * 結べる種類がいくつもある会社。手順のダイアログに「何を結ぶか」の段が出る（Issue・プロジェクト・Field の問い合わせ）。
 * Field の問い合わせは今の画面と同じシステムなので、ふつうの見た目で出る。
 */
export const ManyKinds: Story = {
	name: '種類が複数ある会社',
	render: () => <ActionPanel kinds={MANY_KINDS} />,
}

/** 空の状態。何も結んでいないときと、つないでいないため結べないとき。 */
export const Empty: Story = {
	name: '空の状態',
	render: () => (
		<div className='flex flex-wrap items-start gap-4'>
			<div className='w-[420px] max-w-full'>
				<LinkedWorkList
					title='Linear の Issue'
					links={[]}
					linkLabel='Issue を結ぶ'
					emptyText='まだ Issue を結んでいません。この行動で進める Issue や、参考にする Issue を結べます。'
					onLink={() => {}}
				/>
			</div>
			<div className='w-[420px] max-w-full'>
				<LinkedWorkList
					title='Linear の Issue'
					links={[]}
					canLink={false}
					cannotLinkReason='Linear とつないでいないため、Issue を結べません。会社の設定で Linear をつなぐと結べます。'
					connectAction={{ label: 'Linear をつなぐ', onSelect: () => {} }}
				/>
			</div>
		</div>
	),
}

/** スマホの幅（375px）。一覧も手順のダイアログも、詰め込まれずに収まる。 */
export const Mobile: Story = {
	name: 'スマホの幅',
	render: () => (
		<div className='w-[375px] border-border border-x px-2 py-2'>
			<ActionPanel width='w-full' />
		</div>
	),
}
