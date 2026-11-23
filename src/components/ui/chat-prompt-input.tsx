'use client'

import {
	AlertCircle,
	ArrowUp,
	FileText,
	Loader2,
	Paperclip,
	Square,
	X,
} from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'

/*
 * AI に問いを送る欄と、添付の小さな一覧。
 * - Enter で送り、Shift+Enter で改行する（かな漢字の変換中の Enter では送らない）。
 * - 答えが届いている途中は、送るボタンが「止める」に変わる。
 * - ファイルは、欄に置く・貼る・クリップのボタンで選ぶ、のどれでも足せる。
 *   受け取ったファイルをどう扱うか（送る・上げる）は使う側が決める。
 */

/** 添付 1 つ。 */
interface ChatAttachment {
	id: string
	name: string
	/** バイト数。 */
	size?: number
	/** MIME の種類。例 'image/png'。 */
	type?: string
	/** 画像の小さな見本の URL。 */
	previewUrl?: string
	/** 上げている途中・済み・失敗。 */
	status?: 'uploading' | 'ready' | 'error'
	/** 失敗したときの短い説明。 */
	error?: string
}

/**
 * 見本の URL を、画像として読んでも安全な形だけに絞る。
 * blob:（選んだファイル）・data:image/・http(s):・同じサイトの相対の URL だけを通し、
 * javascript: などは捨てる。
 */
function safePreviewUrl(url?: string) {
	if (!url) return undefined
	const trimmed = url.trim()
	if (/^(blob:|https?:\/\/|data:image\/)/i.test(trimmed)) return trimmed
	if (/^(\/(?!\/)|\.\.?\/)/.test(trimmed)) return trimmed
	return undefined
}

function formatSize(size?: number) {
	if (size === undefined) return ''
	if (size < 1024) return `${size} B`
	if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
	return `${(size / 1024 / 1024).toFixed(1)} MB`
}

interface AttachmentChipProps {
	attachment: ChatAttachment
	/** 渡すと × が出る。 */
	onRemove?: (id: string) => void
	/** 渡すと名前を押して中身を見られる。 */
	onOpen?: (attachment: ChatAttachment) => void
	className?: string
}

/** 添付 1 つの小さな札。画像なら見本、上げている途中ならくるくる、失敗なら赤。 */
function AttachmentChip({
	attachment,
	onRemove,
	onOpen,
	className,
}: Readonly<AttachmentChipProps>) {
	const previewUrl = safePreviewUrl(attachment.previewUrl)
	const isImage = attachment.type?.startsWith('image/') && previewUrl
	const failed = attachment.status === 'error'
	const body = (
		<>
			{attachment.status === 'uploading' ? (
				<Loader2 aria-hidden className='size-4 shrink-0 animate-spin' />
			) : failed ? (
				<AlertCircle aria-hidden className='size-4 shrink-0' />
			) : isImage ? (
				<img
					alt=''
					className='size-6 shrink-0 rounded-sm object-cover'
					src={previewUrl}
				/>
			) : (
				<FileText aria-hidden className='size-4 shrink-0' />
			)}
			<span className='grid min-w-0 text-left leading-tight'>
				<span className='truncate'>{attachment.name}</span>
				<span
					className={cn(
						'text-[10px]',
						failed ? 'text-destructive' : 'text-muted-foreground',
					)}
				>
					{failed
						? (attachment.error ?? '上げられませんでした')
						: attachment.status === 'uploading'
							? '上げています…'
							: formatSize(attachment.size)}
				</span>
			</span>
		</>
	)
	return (
		<span
			className={cn(
				'inline-flex h-9 max-w-[14rem] items-center gap-1.5 rounded-md border bg-surface pr-1 pl-2 text-xs',
				failed ? 'border-destructive/50 text-destructive' : 'border-border',
				className,
			)}
		>
			{onOpen ? (
				<button
					className='flex min-w-0 items-center gap-1.5 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
					onClick={() => onOpen(attachment)}
					type='button'
				>
					{body}
				</button>
			) : (
				<span className='flex min-w-0 items-center gap-1.5'>{body}</span>
			)}
			{onRemove ? (
				<button
					aria-label={`${attachment.name} を外す`}
					className='grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
					onClick={() => onRemove(attachment.id)}
					title='外す'
					type='button'
				>
					<X aria-hidden className='size-3.5' />
				</button>
			) : (
				<span className='w-1' />
			)}
		</span>
	)
}

/** 添付の小さな一覧。送る欄の上や、送った発言の中で使う。 */
function AttachmentList({
	attachments,
	onRemove,
	onOpen,
	className,
}: Readonly<{
	attachments: ChatAttachment[]
	onRemove?: (id: string) => void
	onOpen?: (attachment: ChatAttachment) => void
	className?: string
}>) {
	if (attachments.length === 0) return null
	return (
		<ul aria-label='添付' className={cn('flex flex-wrap gap-1.5', className)}>
			{attachments.map(attachment => (
				<li key={attachment.id}>
					<AttachmentChip
						attachment={attachment}
						onOpen={onOpen}
						onRemove={onRemove}
					/>
				</li>
			))}
		</ul>
	)
}

interface PromptInputProps {
	/** 欄の中身。渡すと外で持つ形になる。 */
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	/** 送るとき。送ったあと欄を空にするのは、外で持つ形なら使う側、そうでなければこの部品。 */
	onSubmit: (message: { text: string; attachments: ChatAttachment[] }) => void
	/** 答えを待っている・届いている途中。送れなくなり、onStop があれば「止める」が出る。 */
	busy?: boolean
	/** 渡すと、busy の間は送るボタンが「止める」になる。 */
	onStop?: () => void
	/** 添付。渡すと欄の上に一覧が出る。 */
	attachments?: ChatAttachment[]
	/** 渡すと、置く・貼る・選ぶでファイルを足せる。 */
	onAddFiles?: (files: File[]) => void
	onRemoveAttachment?: (id: string) => void
	onOpenAttachment?: (attachment: ChatAttachment) => void
	/** 選べるファイルの種類。input の accept と同じ書き方。 */
	accept?: string
	/** 添付の上限の数。これに届くとクリップのボタンが押せなくなる。 */
	maxAttachments?: number
	/** 文字数の目安。超えると赤くなり、送れなくなる。 */
	maxLength?: number
	placeholder?: string
	disabled?: boolean
	autoFocus?: boolean
	/** 左下に足す物（モデルの選択など）。 */
	toolbar?: React.ReactNode
	/** 送るボタンの読み上げの名前。 */
	submitLabel?: string
	stopLabel?: string
	/** 欄の読み上げの名前。 */
	label?: string
	className?: string
}

/** AI に問いを送る欄。 */
function PromptInput({
	value: valueProp,
	defaultValue = '',
	onValueChange,
	onSubmit,
	busy = false,
	onStop,
	attachments = [],
	onAddFiles,
	onRemoveAttachment,
	onOpenAttachment,
	accept,
	maxAttachments,
	maxLength,
	placeholder = 'AI に聞きたいことを書く（Enter で送る・Shift+Enter で改行）',
	disabled = false,
	autoFocus = false,
	toolbar,
	submitLabel = '送る',
	stopLabel = '止める',
	label = 'AI への問い',
	className,
}: Readonly<PromptInputProps>) {
	const [inner, setInner] = React.useState(defaultValue)
	const controlled = valueProp !== undefined
	const value = controlled ? valueProp : inner
	const setValue = (next: string) => {
		if (!controlled) setInner(next)
		onValueChange?.(next)
	}
	const textareaRef = React.useRef<HTMLTextAreaElement>(null)
	const fileRef = React.useRef<HTMLInputElement>(null)
	const [dragging, setDragging] = React.useState(false)
	const countId = React.useId()

	// 出たときに欄へ入れるようにする。
	// biome-ignore lint/correctness/useExhaustiveDependencies: 出たときだけ
	React.useEffect(() => {
		if (autoFocus) textareaRef.current?.focus()
	}, [])

	// 中身に合わせて高さを変える（上限を超えたら欄の中でスクロール）。
	// 欄の幅が変わったとき（出た直後や窓の大きさを変えたとき）も測り直す。
	const fitHeight = React.useCallback(() => {
		const textarea = textareaRef.current
		if (!textarea) return
		textarea.style.height = 'auto'
		textarea.style.height = `${textarea.scrollHeight}px`
	}, [])
	// biome-ignore lint/correctness/useExhaustiveDependencies: 中身が変わるたびに測り直す
	React.useLayoutEffect(fitHeight, [value, fitHeight])
	React.useEffect(() => {
		const textarea = textareaRef.current
		if (!textarea || typeof ResizeObserver === 'undefined') return
		let width = textarea.clientWidth
		const observer = new ResizeObserver(() => {
			if (textarea.clientWidth === width) return
			width = textarea.clientWidth
			fitHeight()
		})
		observer.observe(textarea)
		return () => observer.disconnect()
	}, [fitHeight])

	const tooLong = maxLength !== undefined && value.length > maxLength
	const uploading = attachments.some(a => a.status === 'uploading')
	const empty = value.trim() === '' && attachments.length === 0
	const canSubmit = !busy && !disabled && !empty && !tooLong && !uploading
	const full =
		maxAttachments !== undefined && attachments.length >= maxAttachments
	const showStop = busy && onStop

	const submit = () => {
		if (!canSubmit) return
		onSubmit({ text: value.trim(), attachments })
		if (!controlled) setInner('')
	}

	const addFiles = (files: FileList | File[] | null | undefined) => {
		if (!onAddFiles || !files) return
		let list = Array.from(files)
		if (maxAttachments !== undefined)
			list = list.slice(0, Math.max(0, maxAttachments - attachments.length))
		if (list.length) onAddFiles(list)
	}

	return (
		<form
			className={cn(
				'grid gap-2 rounded-lg border border-input bg-background p-2 shadow-sm transition-colors duration-fast focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25',
				dragging && 'border-ring border-dashed bg-selected/40',
				disabled && 'opacity-60',
				className,
			)}
			onDragLeave={event => {
				if (!event.currentTarget.contains(event.relatedTarget as Node))
					setDragging(false)
			}}
			onDragOver={event => {
				if (!onAddFiles) return
				if (Array.from(event.dataTransfer.types).indexOf('Files') === -1) return
				event.preventDefault()
				setDragging(true)
			}}
			onDrop={event => {
				if (!onAddFiles) return
				event.preventDefault()
				setDragging(false)
				addFiles(event.dataTransfer.files)
			}}
			onSubmit={event => {
				event.preventDefault()
				submit()
			}}
		>
			<AttachmentList
				attachments={attachments}
				onOpen={onOpenAttachment}
				onRemove={onRemoveAttachment}
			/>
			<textarea
				aria-describedby={maxLength !== undefined ? countId : undefined}
				aria-invalid={tooLong || undefined}
				aria-label={label}
				className='max-h-48 min-h-[2.25rem] w-full resize-none bg-transparent px-1.5 py-1 text-sm leading-relaxed placeholder:text-subtle-foreground focus-visible:outline-none'
				disabled={disabled}
				onChange={event => setValue(event.target.value)}
				onKeyDown={event => {
					// 変換を決める Enter では送らない。
					if (event.nativeEvent.isComposing || event.keyCode === 229) return
					if (event.key === 'Enter' && !event.shiftKey) {
						event.preventDefault()
						submit()
					}
				}}
				onPaste={event => {
					if (!onAddFiles || event.clipboardData.files.length === 0) return
					event.preventDefault()
					addFiles(event.clipboardData.files)
				}}
				placeholder={placeholder}
				ref={textareaRef}
				rows={1}
				value={value}
			/>
			<div className='flex items-center gap-1'>
				{onAddFiles ? (
					<>
						<input
							accept={accept}
							className='hidden'
							multiple
							onChange={event => {
								addFiles(event.target.files)
								event.target.value = ''
							}}
							ref={fileRef}
							tabIndex={-1}
							type='file'
						/>
						<Button
							aria-label='ファイルを添付'
							disabled={disabled || full}
							onClick={() => fileRef.current?.click()}
							size='icon'
							title={
								full ? `添付は ${maxAttachments} つまでです` : 'ファイルを添付'
							}
							type='button'
							variant='ghost'
						>
							<Paperclip aria-hidden />
						</Button>
					</>
				) : null}
				{toolbar}
				<span className='flex-1' />
				{maxLength !== undefined ? (
					<span
						className={cn(
							'text-xs tabular-nums',
							tooLong ? 'text-destructive' : 'text-muted-foreground',
						)}
						id={countId}
					>
						{value.length.toLocaleString('ja-JP')} /{' '}
						{maxLength.toLocaleString('ja-JP')}
						<span className='sr-only'>
							{tooLong ? ' 文字。長すぎるので送れません' : ' 文字'}
						</span>
					</span>
				) : null}
				{showStop ? (
					<Button
						aria-label={stopLabel}
						onClick={onStop}
						size='icon'
						title={stopLabel}
						type='button'
						variant='secondary'
					>
						<Square aria-hidden className='fill-current' />
					</Button>
				) : (
					<Button
						aria-label={submitLabel}
						disabled={!canSubmit}
						size='icon'
						title={submitLabel}
						type='submit'
						variant='primary'
					>
						{busy ? (
							<Loader2 aria-hidden className='animate-spin' />
						) : (
							<ArrowUp aria-hidden />
						)}
					</Button>
				)}
			</div>
			{dragging ? (
				<p className='text-center text-muted-foreground text-xs'>
					ここに置くと添付します
				</p>
			) : null}
		</form>
	)
}

export {
	type ChatAttachment,
	AttachmentChip,
	type AttachmentChipProps,
	AttachmentList,
	PromptInput,
	type PromptInputProps,
}
