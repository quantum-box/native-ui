import {
	ArrowUpRight,
	ChevronDown,
	GitBranch,
	Link2,
	Plus,
	RefreshCw,
	Unlink,
} from 'lucide-react'
import {
	type ComponentType,
	type ReactNode,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import { Badge } from './badge'
import { Button } from './button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from './dialog'
import {
	RecordChip,
	type RecordKindDefinition,
	RecordMention,
	type RecordStatus,
	defineRecordKind,
	spaceLatin,
	useRecordKind,
	useRecordSystem,
} from './record'
import { RecordPicker } from './record-picker'

// ---- 形 -----------------------------------------------------------------------

/** 外のサービスの仕事 1 つ（Linear の Issue など）。結んだ仕事にも、結ぶときの候補にも使う。 */
export type LinkedWorkRecord = {
	/** 見分け（送るときだけ使い、画面には出さない）。 */
	id: string
	/** 公開の番号（例 COM-929）。無い種類もある。 */
	publicId?: string
	/** 題名。読めなかったときは無い。 */
	title?: string | null
	/** 元のサービスで開く場所。 */
	url?: string
	/** 元のサービスでの進み具合。 */
	progress?: LinkedWorkProgress | null
}

/** 元のサービスでの進み具合。 */
export type LinkedWorkProgress = 'open' | 'done' | 'cancelled'

/** 結び方。`executes` はこの行動で進める仕事、`references` は参考にするだけ。 */
export type LinkedWorkRelation = 'executes' | 'references'

/**
 * 元のサービスから読んだ様子。
 * `ready` 読めた / `partial` 一部だけ / `stale` 古い / `revoked` 消えた・見られなくなった /
 * `unconnected` つないでいない / `forbidden` 見る権限が無い / `unavailable` 今は読めない。
 */
export type LinkedWorkReadStatus =
	| 'ready'
	| 'partial'
	| 'stale'
	| 'revoked'
	| 'unconnected'
	| 'forbidden'
	| 'unavailable'

/** 結んだ仕事。 */
export type LinkedWork = {
	/** 結び付きの見分け。 */
	id: string
	/** 登録した種類の名前（例 `linear.issue`）。 */
	kind: string
	relation: LinkedWorkRelation
	/** 元のサービスの仕事（読めなかったときも、分かっている所までは入れる）。 */
	record: LinkedWorkRecord | null
	/** 元のサービスから読んだ様子。既定は `ready`。 */
	read?: LinkedWorkReadStatus
	/** 読めなかった理由の文（元のサービスが返した物など）。無ければ様子から作る。 */
	readMessage?: string
	/** 外した仕事。 */
	withdrawn?: { at: string; reason?: string | null } | null
}

/**
 * 外のサービスの仕事の種類を、記録の種類として決める（Linear の Issue など）。
 * 名前は「公開の番号 題名」で出し、触れると要点（番号・題名・進み具合）と「{システム}で開く」が出る。
 * システムの絵や色は `RecordKindProvider` の `systems` で決める（商標の色は使わず、native-ui の色の印から選ぶ）。
 */
export function defineLinkedWorkKind({
	name,
	system,
	icon,
	openLabel,
	missingText,
}: {
	/** 種類の名前（例「Issue」「プロジェクト」）。 */
	name: string
	/** システムのキー（`systems` のキー。例 `linear`）。 */
	system?: string
	icon?: ComponentType<{ className?: string }>
	/** 開く操作の文言（例「Linear で開く」）。 */
	openLabel?: string
	missingText?: string
}): RecordKindDefinition<LinkedWorkRecord> {
	return defineRecordKind<LinkedWorkRecord>({
		name,
		system,
		icon,
		openLabel,
		missingText,
		getId: work => work.id,
		getLabel: work =>
			[work.publicId, work.title].filter(Boolean).join(' ') || '名称未設定',
		getKeywords: work => (work.publicId ? [work.publicId] : []),
		getHref: work => work.url,
		renderPreview: work => (
			<div className='space-y-1.5'>
				{work.publicId ? (
					<p className='font-mono text-muted-foreground text-xs'>
						{work.publicId}
					</p>
				) : null}
				<p className='font-medium text-sm leading-snug'>
					{work.title ?? '題名を読めませんでした'}
				</p>
				{work.progress ? <ProgressBadge progress={work.progress} /> : null}
			</div>
		),
	})
}

// ---- 札 -----------------------------------------------------------------------

const PROGRESS: Record<
	LinkedWorkProgress,
	{ label: string; variant: 'accent' | 'success' | 'neutral' }
> = {
	open: { label: '進行中', variant: 'accent' },
	done: { label: '完了', variant: 'success' },
	cancelled: { label: '取消', variant: 'neutral' },
}

/** 進み具合の札（進行中・完了・取消）。 */
export function ProgressBadge({ progress }: { progress: LinkedWorkProgress }) {
	const spec = PROGRESS[progress]
	return (
		<Badge
			variant={spec.variant}
			className={cn('shrink-0', progress === 'cancelled' && 'line-through')}
		>
			{spec.label}
		</Badge>
	)
}

const RELATION: Record<LinkedWorkRelation, string> = {
	executes: '進める仕事',
	references: '参考',
}

/** 結び方の札（「進める仕事」か「参考」）。 */
export function RelationBadge({ relation }: { relation: LinkedWorkRelation }) {
	return (
		<Badge variant='outline' className='shrink-0'>
			{RELATION[relation]}
		</Badge>
	)
}

// ---- 読めない様子 ----------------------------------------------------------------

/** 読めない様子ごとの、記録の様子・理由・次に何をするか。 */
function readState(read: LinkedWorkReadStatus, system: string) {
	switch (read) {
		case 'partial':
			return {
				status: 'ready' as RecordStatus,
				tone: 'warning',
				reason: `${system} の内容を一部しか読めませんでした。`,
				next: 'reload' as const,
			}
		case 'stale':
			return {
				status: 'ready' as RecordStatus,
				tone: 'warning',
				reason: `${system} の内容が変わりました。読み直してください。`,
				next: 'reload' as const,
			}
		case 'revoked':
			return {
				status: 'missing' as RecordStatus,
				tone: 'muted',
				reason: `${system} で削除されたか、見られなくなりました。つなぎが外れたときはつなぎ直し、要らなければ外してください。`,
				next: 'reconnect' as const,
			}
		case 'unconnected':
			return {
				status: 'unavailable' as RecordStatus,
				tone: 'muted',
				reason: `${system} とつないでいないため、状態を読めません。`,
				next: 'connect' as const,
			}
		case 'forbidden':
			return {
				status: 'forbidden' as RecordStatus,
				tone: 'muted',
				reason: `あなたの権限では ${system} の内容を読めません。`,
				next: null,
			}
		case 'unavailable':
			return {
				status: 'unavailable' as RecordStatus,
				tone: 'muted',
				reason: `${system} を今は読めません。しばらくしてから読み直してください。`,
				next: 'reload' as const,
			}
		default:
			return {
				status: 'ready' as RecordStatus,
				tone: null,
				reason: null,
				next: null,
			}
	}
}

// ---- 結んだ仕事 1 つ -------------------------------------------------------------

export type LinkedWorkItemProps = {
	work: LinkedWork
	/** 「外す」で呼ばれる（理由を聞くダイアログは部品が出す）。渡さなければ「外す」を出さない。 */
	onUnlink?: (work: LinkedWork, reason: string) => Promise<void>
	/** 読めないときの「読み直す」。 */
	onReload?: () => void
	/** つないでいない・つなぎが外れたときの「{システム}をつなぐ」「つなぎ直す」。 */
	onConnect?: () => void
}

/**
 * 結んだ仕事 1 つ。記録の名前の印（触れると要点のカード）、進み具合と結び方の札、
 * 「{システム}で開く」（外へ出る印つき）と「外す」を出す。読めないときは、理由と次に何をするかを出す。
 */
export function LinkedWorkItem({
	work,
	onUnlink,
	onReload,
	onConnect,
}: LinkedWorkItemProps) {
	const { definition } = useRecordKind<LinkedWorkRecord>(work.kind)
	const system = useRecordSystem(definition)
	const systemName = system?.name ?? definition.name
	const state = readState(work.read ?? 'ready', systemName)
	const [unlinking, setUnlinking] = useState(false)
	const record = work.record
	const url = record?.url
	const openLabel = definition.openLabel ?? spaceLatin(`${systemName}で開く`)
	return (
		<li className='grid gap-1 rounded-md px-2 py-1.5 hover:bg-muted/40'>
			<div className='flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1'>
				<span className='flex min-w-0 flex-1 basis-40 items-center gap-1.5'>
					<RecordChip
						kind={work.kind}
						record={state.status === 'ready' ? record : null}
						status={state.status}
					/>
					{/* 読めないときも、分かっている番号・題名は添える（どの仕事かが分かるように）。 */}
					{state.status !== 'ready' && (record?.publicId || record?.title) ? (
						<span className='min-w-0 truncate text-muted-foreground text-xs'>
							{[record.publicId, record.title].filter(Boolean).join(' ')}
						</span>
					) : null}
				</span>
				<span className='flex shrink-0 items-center gap-1'>
					{state.status === 'ready' && record?.progress ? (
						<ProgressBadge progress={record.progress} />
					) : null}
					{work.read === 'stale' ? <Badge variant='warning'>古い</Badge> : null}
					<RelationBadge relation={work.relation} />
				</span>
			</div>
			{state.reason ? (
				<p
					className={cn(
						'text-xs',
						state.tone === 'warning' ? 'text-warning' : 'text-muted-foreground',
					)}
				>
					{work.readMessage ?? state.reason}
				</p>
			) : null}
			<div className='flex flex-wrap items-center gap-1'>
				{state.next === 'reload' && onReload ? (
					<Button type='button' size='sm' variant='ghost' onClick={onReload}>
						<RefreshCw aria-hidden />
						読み直す
					</Button>
				) : null}
				{(state.next === 'connect' || state.next === 'reconnect') &&
				onConnect ? (
					<Button
						type='button'
						size='sm'
						variant='secondary'
						onClick={onConnect}
					>
						<Link2 aria-hidden />
						{spaceLatin(
							`${systemName}を${state.next === 'connect' ? 'つなぐ' : 'つなぎ直す'}`,
						)}
					</Button>
				) : null}
				{url && state.status !== 'forbidden' ? (
					<Button asChild size='sm' variant='ghost'>
						<a href={url} target='_blank' rel='noreferrer noopener'>
							{openLabel}
							<ArrowUpRight aria-hidden />
						</a>
					</Button>
				) : null}
				{onUnlink ? (
					<Button
						type='button'
						size='sm'
						variant='ghost'
						onClick={() => setUnlinking(true)}
					>
						<Unlink aria-hidden />
						外す
					</Button>
				) : null}
			</div>
			{onUnlink ? (
				<UnlinkWorkDialog
					open={unlinking}
					onOpenChange={setUnlinking}
					work={work}
					onConfirm={reason => onUnlink(work, reason)}
				/>
			) : null}
		</li>
	)
}

// ---- 外す ---------------------------------------------------------------------

export type UnlinkWorkDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	work: LinkedWork
	/** 外す。理由は必ず書かせる。失敗したら例外を投げる（ダイアログに理由を出す）。 */
	onConfirm: (reason: string) => Promise<void>
	formatError?: (error: unknown) => string
}

/** 「外す」の小さなダイアログ。何を外すかを見せ、外す理由（必須）を書かせる。 */
export function UnlinkWorkDialog({
	open,
	onOpenChange,
	work,
	onConfirm,
	formatError = () => '外せませんでした。しばらくしてからやり直してください。',
}: UnlinkWorkDialogProps) {
	const [reason, setReason] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const reasonId = useId()
	const errorId = useId()
	useEffect(() => {
		if (open) {
			setReason('')
			setError(null)
		}
	}, [open])
	async function submit() {
		if (!reason.trim()) {
			setError('外す理由を書いてください。')
			return
		}
		setSaving(true)
		setError(null)
		try {
			await onConfirm(reason.trim())
			onOpenChange(false)
		} catch (cause) {
			setError(formatError(cause))
		} finally {
			setSaving(false)
		}
	}
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-sm'>
				<DialogHeader>
					<DialogTitle>結んだ仕事を外す</DialogTitle>
					<DialogDescription>
						外しても、元のサービスの仕事はそのまま残ります。あとから外した理由を見られます。
					</DialogDescription>
				</DialogHeader>
				<div className='rounded-md border border-border px-2 py-1.5'>
					<RecordChip
						kind={work.kind}
						record={work.record}
						interactive={false}
					/>
				</div>
				<form
					className='grid gap-1.5'
					onSubmit={event => {
						event.preventDefault()
						void submit()
					}}
				>
					<label htmlFor={reasonId} className='font-medium text-sm'>
						外す理由（必須）
					</label>
					<textarea
						id={reasonId}
						value={reason}
						onChange={event => setReason(event.target.value)}
						rows={3}
						aria-invalid={error ? true : undefined}
						aria-describedby={error ? errorId : undefined}
						placeholder='例 別の行動で進めることになったため'
						className='w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 aria-[invalid=true]:border-destructive'
					/>
					{error ? (
						<p id={errorId} role='alert' className='text-destructive text-xs'>
							{error}
						</p>
					) : null}
					<DialogFooter className='mt-2'>
						<Button
							type='button'
							variant='secondary'
							onClick={() => onOpenChange(false)}
						>
							やめる
						</Button>
						<Button type='submit' variant='destructive' disabled={saving}>
							{saving ? '外しています…' : '外す'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

// ---- 発生元 -------------------------------------------------------------------

/** この行動が、どの外の仕事から生まれたか。例「この行動は Linear の COM-929 … から生まれました（3 回受けました）」。 */
export function WorkOrigin({
	kind,
	record,
	receivedCount,
	subject = 'この行動',
	className,
}: {
	kind: string
	record: LinkedWorkRecord | null
	/** 受けた回数（同じ仕事から何度受けたか）。 */
	receivedCount?: number
	/** 何が生まれたか（例「この行動」）。 */
	subject?: string
	className?: string
}) {
	const { definition } = useRecordKind(kind)
	const system = useRecordSystem(definition)
	return (
		<p
			className={cn(
				'flex items-start gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-sm leading-relaxed',
				className,
			)}
		>
			<GitBranch
				aria-hidden
				className='mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground'
			/>
			<span>
				{subject}は {system?.name ?? definition.name} の{' '}
				<RecordMention kind={kind} record={record} /> から生まれました
				{receivedCount && receivedCount > 1 ? (
					<span className='text-muted-foreground'>
						（{receivedCount} 回受けました）
					</span>
				) : null}
				。
			</span>
		</p>
	)
}

// ---- 結んだ仕事の一覧 -------------------------------------------------------------

export type LinkedWorkListProps = {
	/** 見出し。例「Linear の Issue」「関係する仕事」。 */
	title: ReactNode
	links: readonly LinkedWork[]
	/** 発生元。 */
	origin?: {
		kind: string
		record: LinkedWorkRecord | null
		receivedCount?: number
	} | null
	/** 結べるか。false なら「結ぶ」を出さず、`cannotLinkReason` を出す。 */
	canLink?: boolean
	/** 結べない理由（例「Linear につないでいないため、結べません。」）。 */
	cannotLinkReason?: string
	/** 結べないときの次の一手（例「Linear をつなぐ」）。 */
	connectAction?: { label: string; onSelect: () => void }
	/** 「結ぶ」で呼ばれる（結ぶ手順のダイアログを開く）。 */
	onLink?: () => void
	/** 「結ぶ」の文言。既定は「結ぶ」。 */
	linkLabel?: string
	onUnlink?: LinkedWorkItemProps['onUnlink']
	onReload?: () => void
	onConnect?: () => void
	/** 何も結んでいないときの文言。 */
	emptyText?: string
	/** 読み直している最中。 */
	loading?: boolean
	className?: string
}

function summaryOf(links: readonly LinkedWork[]) {
	const count = (test: (work: LinkedWork) => boolean) =>
		links.filter(test).length
	const readable = (work: LinkedWork) =>
		(work.read ?? 'ready') === 'ready' ||
		work.read === 'partial' ||
		work.read === 'stale'
	const parts = [
		[
			count(work => readable(work) && work.record?.progress === 'open'),
			'進行中',
		],
		[count(work => readable(work) && work.record?.progress === 'done'), '完了'],
		[
			count(work => readable(work) && work.record?.progress === 'cancelled'),
			'取消',
		],
		[count(work => !readable(work)), '読めない'],
	] as const
	return parts
		.filter(([value]) => value > 0)
		.map(([value, label]) => `${label} ${value} 件`)
		.join(' · ')
}

/**
 * 行動などに結んだ外の仕事の一覧（Linear の Issue など）。右から出る詳細の画面の狭い幅でも詰め込まれないように、
 * 1 件ずつ記録の名前・札・操作を並べ、結ぶ手順はダイアログで段ごとに開く。外した仕事は畳んで出す。
 */
export function LinkedWorkList({
	title,
	links,
	origin,
	canLink = true,
	cannotLinkReason,
	connectAction,
	onLink,
	linkLabel = '結ぶ',
	onUnlink,
	onReload,
	onConnect,
	emptyText = 'まだ何も結んでいません。',
	loading = false,
	className,
}: LinkedWorkListProps) {
	const live = links.filter(work => !work.withdrawn)
	const withdrawn = links.filter(work => work.withdrawn)
	const [showWithdrawn, setShowWithdrawn] = useState(false)
	const summary = summaryOf(live)
	return (
		<section
			aria-label={typeof title === 'string' ? title : undefined}
			aria-busy={loading || undefined}
			className={cn(
				'grid gap-2 rounded-lg border border-border p-3',
				className,
			)}
		>
			<header className='flex items-center gap-2'>
				<div className='min-w-0 flex-1'>
					<h3 className='font-medium text-sm'>{title}</h3>
					{summary ? (
						<p className='text-muted-foreground text-xs tabular-nums'>
							{summary}
						</p>
					) : null}
				</div>
				{onReload ? (
					<Button
						type='button'
						size='icon'
						variant='ghost'
						aria-label='読み直す'
						disabled={loading}
						onClick={onReload}
					>
						<RefreshCw aria-hidden className={cn(loading && 'animate-spin')} />
					</Button>
				) : null}
				{canLink && onLink ? (
					<Button type='button' size='sm' variant='secondary' onClick={onLink}>
						<Plus aria-hidden />
						{linkLabel}
					</Button>
				) : null}
			</header>
			{origin ? (
				<WorkOrigin
					kind={origin.kind}
					record={origin.record}
					receivedCount={origin.receivedCount}
				/>
			) : null}
			{live.length ? (
				<ul className='-mx-2 grid'>
					{live.map(work => (
						<LinkedWorkItem
							key={work.id}
							work={work}
							onUnlink={onUnlink}
							onReload={onReload}
							onConnect={onConnect}
						/>
					))}
				</ul>
			) : (
				<div className='grid gap-2 rounded-md border border-border border-dashed px-3 py-4 text-center text-sm'>
					<p className='text-muted-foreground'>
						{canLink ? emptyText : (cannotLinkReason ?? '今は結べません。')}
					</p>
					{canLink && onLink ? (
						<div>
							<Button
								type='button'
								size='sm'
								variant='primary'
								onClick={onLink}
							>
								<Plus aria-hidden />
								{linkLabel}
							</Button>
						</div>
					) : !canLink && connectAction ? (
						<div>
							<Button
								type='button'
								size='sm'
								variant='secondary'
								onClick={connectAction.onSelect}
							>
								<Link2 aria-hidden />
								{connectAction.label}
							</Button>
						</div>
					) : null}
				</div>
			)}
			{live.length > 0 && !canLink && cannotLinkReason ? (
				<p className='text-muted-foreground text-xs'>{cannotLinkReason}</p>
			) : null}
			{withdrawn.length ? (
				<div className='grid gap-1'>
					<button
						type='button'
						aria-expanded={showWithdrawn}
						onClick={() => setShowWithdrawn(value => !value)}
						className='flex w-fit items-center gap-1 rounded-sm text-muted-foreground text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						<ChevronDown
							aria-hidden
							className={cn(
								'h-3.5 w-3.5 transition-transform duration-fast',
								!showWithdrawn && '-rotate-90',
							)}
						/>
						外した仕事 {withdrawn.length} 件
					</button>
					{showWithdrawn ? (
						<ul className='grid gap-1'>
							{withdrawn.map(work => (
								<li key={work.id} className='grid gap-0.5 px-2 py-1 text-xs'>
									<span className='flex min-w-0 opacity-70'>
										<RecordChip kind={work.kind} record={work.record} />
									</span>
									<span className='text-muted-foreground'>
										{work.withdrawn?.at} に外しました
										{work.withdrawn?.reason
											? `（理由: ${work.withdrawn.reason}）`
											: ''}
									</span>
								</li>
							))}
						</ul>
					) : null}
				</div>
			) : null}
		</section>
	)
}

// ---- 結ぶ手順 -------------------------------------------------------------------

/** 結べる種類 1 つ（Linear の Issue など）と、どこから選ぶか（チームなど）。 */
export type LinkWorkKindOption = {
	/** 登録した種類の名前。 */
	kind: string
	/** 種類を選ぶ段に出す名前（例「Linear の Issue」）。 */
	label: string
	/** 一言の説明。 */
	description?: string
	/** どこから選ぶか（例 チーム）。1 つなら段を出さない。 */
	sources?: readonly { id: string; label: string }[]
	/** どこから選ぶかの段の名前（例「チーム」）。 */
	sourceLabel?: string
}

export type LinkWorkSelection = {
	kind: string
	source: string | null
}

export type LinkWorkDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	/** 結べる種類。1 つしか無ければ、種類を選ぶ段を出さない。 */
	kinds: readonly LinkWorkKindOption[]
	/** 今の種類とどこからの候補（使う側が `onSelectionChange` を受けて読み直す）。 */
	candidates: readonly LinkedWorkRecord[]
	/** 候補に続きがあるか（「続きを読む」）。 */
	hasMore?: boolean
	loadingMore?: boolean
	onLoadMore?: () => void
	/** 種類やどこからが変わったとき（候補を読み直す）。 */
	onSelectionChange?: (selection: LinkWorkSelection) => void
	/** 結ぶ。失敗したら例外を投げる（ダイアログに理由を出す）。 */
	onSubmit: (link: {
		kind: string
		source: string | null
		record: LinkedWorkRecord
		relation: LinkedWorkRelation
	}) => Promise<void>
	formatError?: (error: unknown) => string
	/** ダイアログの見出し。既定は「仕事を結ぶ」。 */
	title?: string
}

function Step({
	number,
	title,
	children,
}: {
	number: number
	title: string
	children: ReactNode
}) {
	return (
		<fieldset className='grid gap-2'>
			<legend className='mb-1 flex items-center gap-2 font-medium text-sm'>
				<span className='grid h-5 w-5 place-items-center rounded-full bg-muted text-[11px] text-muted-foreground tabular-nums'>
					{number}
				</span>
				{title}
			</legend>
			{children}
		</fieldset>
	)
}

function ChoiceCard({
	name,
	checked,
	onChange,
	label,
	description,
}: {
	name: string
	checked: boolean
	onChange: () => void
	label: string
	description?: string
}) {
	return (
		<label
			className={cn(
				'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors duration-fast has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
				checked
					? 'border-primary bg-selected'
					: 'border-border hover:bg-muted/50',
			)}
		>
			<input
				type='radio'
				name={name}
				checked={checked}
				onChange={onChange}
				className='mt-0.5 accent-[hsl(var(--nui-primary))]'
			/>
			<span className='grid gap-0.5'>
				<span className='font-medium'>{label}</span>
				{description ? (
					<span className='text-muted-foreground text-xs'>{description}</span>
				) : null}
			</span>
		</label>
	)
}

/**
 * 外の仕事を結ぶ手順。何を結ぶか（種類）→ どこから（チームなど）→ 名前で探して選ぶ → 結び方 → 結ぶ。
 * 段は順に開き、種類やどこからが 1 つしか無いときはその段を出さない。選ぶ欄は `RecordPicker`
 * （別のシステムの帯・検索・「続きを読む」）。狭い画面でも詰め込まれないよう、ダイアログで出す。
 */
export function LinkWorkDialog({
	open,
	onOpenChange,
	kinds,
	candidates,
	hasMore,
	loadingMore,
	onLoadMore,
	onSelectionChange,
	onSubmit,
	formatError = () => '結べませんでした。しばらくしてからやり直してください。',
	title = '仕事を結ぶ',
}: LinkWorkDialogProps) {
	const name = useId()
	const [kind, setKind] = useState(kinds[0]?.kind ?? '')
	const option = kinds.find(entry => entry.kind === kind)
	const sources = option?.sources ?? []
	const [source, setSource] = useState<string | null>(sources[0]?.id ?? null)
	const [record, setRecord] = useState<LinkedWorkRecord | null>(null)
	const [relation, setRelation] = useState<LinkedWorkRelation>('executes')
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	// 開いたときだけ初めから（kinds が同じ中身の新しい配列でも、開いている間は選んだ物を消さない）。
	const wasOpen = useRef(false)
	useEffect(() => {
		if (open && !wasOpen.current) {
			const first = kinds[0]
			setKind(first?.kind ?? '')
			setSource(first?.sources?.[0]?.id ?? null)
			setRecord(null)
			setRelation('executes')
			setError(null)
		}
		wasOpen.current = open
	}, [open, kinds])
	// 開いている間に種類やどこからの中身が本当に変わったときだけ、無くなった物を選び直す。
	const kindKeys = kinds.map(entry => entry.kind).join('\n')
	const sourceKeys = sources.map(entry => entry.id).join('\n')
	useEffect(() => {
		if (!open) return
		const option = kinds.find(entry => entry.kind === kind)
		if (!option) {
			const first = kinds[0]
			setKind(first?.kind ?? '')
			setSource(first?.sources?.[0]?.id ?? null)
			setRecord(null)
			return
		}
		const list = option.sources ?? []
		if (list.length && !list.some(entry => entry.id === source)) {
			setSource(list[0].id)
			setRecord(null)
		}
		// 中身（キーの並び）が変わったときだけ見る（配列の作り直しでは動かさない）。
	}, [open, kindKeys, sourceKeys])
	// 種類・どこからが変わったら、使う側に候補を読み直してもらう。
	// 呼ぶ関数は最新の物を使い、関数が作り直されただけでは呼ばない（読み直しの繰り返しを防ぐ）。
	const selectionChange = useRef(onSelectionChange)
	selectionChange.current = onSelectionChange
	useEffect(() => {
		if (open && kind) selectionChange.current?.({ kind, source })
	}, [open, kind, source])

	const showKinds = kinds.length > 1
	const showSources = sources.length > 1
	let step = 0
	const next = () => {
		step += 1
		return step
	}

	async function submit() {
		if (!record) {
			setError('結ぶ仕事を選んでください。')
			return
		}
		setSaving(true)
		setError(null)
		try {
			await onSubmit({ kind, source, record, relation })
			onOpenChange(false)
		} catch (cause) {
			setError(formatError(cause))
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						結んだ仕事の状態は、開くたびに元のサービスから読み直します。元のサービスには書き込みません。
					</DialogDescription>
				</DialogHeader>
				<form
					className='grid gap-5'
					onSubmit={event => {
						event.preventDefault()
						void submit()
					}}
				>
					{showKinds ? (
						<Step number={next()} title='何を結ぶか'>
							<div className='grid gap-2'>
								{kinds.map(entry => (
									<ChoiceCard
										key={entry.kind}
										name={`${name}-kind`}
										checked={kind === entry.kind}
										onChange={() => {
											setKind(entry.kind)
											setSource(entry.sources?.[0]?.id ?? null)
											setRecord(null)
										}}
										label={entry.label}
										description={entry.description}
									/>
								))}
							</div>
						</Step>
					) : null}
					{showSources ? (
						<Step
							number={next()}
							title={`どの${option?.sourceLabel ?? '読み先'}から`}
						>
							<div className='flex flex-wrap gap-2'>
								{sources.map(entry => (
									<label
										key={entry.id}
										className={cn(
											'cursor-pointer rounded-md border px-2.5 py-1 text-sm transition-colors duration-fast has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
											source === entry.id
												? 'border-primary bg-selected'
												: 'border-border hover:bg-muted/50',
										)}
									>
										<input
											type='radio'
											name={`${name}-source`}
											className='sr-only'
											checked={source === entry.id}
											onChange={() => {
												setSource(entry.id)
												setRecord(null)
											}}
										/>
										{entry.label}
									</label>
								))}
							</div>
						</Step>
					) : null}
					{kind ? (
						<Step
							number={next()}
							title={spaceLatin(`${option?.label ?? '仕事'}を選ぶ`)}
						>
							<RecordPicker<LinkedWorkRecord>
								key={`${kind}-${source}`}
								kind={kind}
								value={record}
								onChange={setRecord}
								candidates={candidates}
								hasMore={hasMore}
								loadingMore={loadingMore}
								onLoadMore={onLoadMore}
								placeholder='名前か番号で探して選ぶ'
								aria-label={spaceLatin(`${option?.label ?? '仕事'}を選ぶ`)}
							/>
						</Step>
					) : null}
					{record ? (
						<Step number={next()} title='結び方'>
							<div className='grid gap-2'>
								<ChoiceCard
									name={`${name}-relation`}
									checked={relation === 'executes'}
									onChange={() => setRelation('executes')}
									label='この行動で進める仕事'
									description='行動を進めると、この仕事が進む'
								/>
								<ChoiceCard
									name={`${name}-relation`}
									checked={relation === 'references'}
									onChange={() => setRelation('references')}
									label='参考にするだけ'
									description='この行動で進める仕事ではない'
								/>
							</div>
						</Step>
					) : null}
					{error ? (
						<p role='alert' className='text-destructive text-sm'>
							{error}
						</p>
					) : null}
					<DialogFooter>
						<Button
							type='button'
							variant='secondary'
							onClick={() => onOpenChange(false)}
						>
							やめる
						</Button>
						<Button
							type='submit'
							variant='primary'
							disabled={!record || saving}
						>
							{saving ? '結んでいます…' : '結ぶ'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
