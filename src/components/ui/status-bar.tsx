import {
	ArrowDown,
	ArrowUp,
	GripVertical,
	SlidersHorizontal,
	X,
} from 'lucide-react'
import {
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	useEffect,
	useState,
} from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from './dialog'
import {
	type StatusBarLayoutItem,
	type StatusBarSide,
	parseStatusBarLayout,
	reorderStatusBarLayout,
} from './status-bar-layout'

/** Shared look for anything rendered as a status bar item. */
export const statusBarItemClass =
	'flex h-6 min-w-0 shrink-0 items-center gap-1.5 px-2 text-[11px] leading-none hover:bg-sky-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'

export type StatusBarItemDefinition = {
	id: string
	/** Name shown in the customization dialog. */
	label: string
	render: () => ReactNode
	/** Always shown; the viewer cannot hide it. */
	required?: boolean
	/** Optional item the viewer adds from the dialog and may delete again. */
	removable?: boolean
}

export type StatusBarLabels = {
	bar: string
	customize: string
	title: string
	description: string
	dragHandle: (label: string) => string
	dragHint: string
	side: (label: string) => string
	left: string
	right: string
	moveEarlier: (label: string) => string
	moveLater: (label: string) => string
	remove: (label: string) => string
	add: string
	addPlaceholder: string
	reset: string
	done: string
}

const DEFAULT_LABELS: StatusBarLabels = {
	bar: 'ステータスバー',
	customize: 'ステータスバーをカスタマイズ',
	title: 'ステータスバーをカスタマイズ',
	description:
		'左端のハンドルをドラッグして並べ替えられます。移動先の項目と同じ左右配置になります。このブラウザに保存します。',
	dragHandle: label => `${label}をドラッグして移動`,
	dragHint: 'ドラッグで移動（キーボードでは上下矢印）',
	side: label => `${label}の配置`,
	left: '左',
	right: '右',
	moveEarlier: label => `${label}を前へ`,
	moveLater: label => `${label}を後ろへ`,
	remove: label => `${label}を削除`,
	add: 'ショートカットを追加',
	addPlaceholder: '項目を選択',
	reset: '初期設定に戻す',
	done: '完了',
}

export type StatusBarProps = {
	/** Every item that can appear now, including ones the viewer may add. */
	items: readonly StatusBarItemDefinition[]
	defaultLayout: readonly StatusBarLayoutItem[]
	/** localStorage key; the layout is reloaded when it changes. */
	storageKey: string
	labels?: Partial<StatusBarLabels>
	className?: string
	/**
	 * Called with the new layout each time the viewer changes it here, after it
	 * is written to localStorage. Lets the app keep a copy elsewhere, such as
	 * on its server so the layout follows the viewer to other devices. Not
	 * called for changes made in another tab.
	 */
	onLayoutChange?: (layout: StatusBarLayoutItem[]) => void
}

/**
 * A bottom status bar whose items the viewer can show, hide, reorder and
 * move between the left and right ends. The layout is kept per storage key.
 */
export function StatusBar(props: StatusBarProps) {
	return <StatusBarInner key={props.storageKey} {...props} />
}

function StatusBarInner({
	items: definitions,
	defaultLayout,
	storageKey,
	labels: labelOverrides,
	className,
	onLayoutChange,
}: StatusBarProps) {
	const labels = { ...DEFAULT_LABELS, ...labelOverrides }
	const requiredIds = definitions
		.filter(item => item.required)
		.map(item => item.id)
	const read = (raw: string | null) =>
		parseStatusBarLayout(raw, defaultLayout, requiredIds)
	const [layout, setLayout] = useState(() => {
		try {
			return read(localStorage.getItem(storageKey))
		} catch {
			return [...defaultLayout]
		}
	})
	const [customizing, setCustomizing] = useState(false)
	const [drag, setDrag] = useState<{
		id: string
		targetId: string
		after: boolean
	} | null>(null)
	const byId = new Map(definitions.map(item => [item.id, item]))
	const available = layout.filter(item => byId.has(item.id))
	const label = (id: string) => byId.get(id)?.label ?? id

	useEffect(() => {
		const sync = (event: StorageEvent) => {
			if (event.key === storageKey || event.key === null)
				setLayout(read(event.newValue))
		}
		window.addEventListener('storage', sync)
		return () => window.removeEventListener('storage', sync)
	}, [storageKey])

	const save = (next: StatusBarLayoutItem[]) => {
		setLayout(next)
		try {
			localStorage.setItem(storageKey, JSON.stringify(next))
		} catch {
			// Keep customization usable when browser storage is unavailable.
		}
		onLayoutChange?.(next)
	}
	const update = (id: string, patch: Partial<StatusBarLayoutItem>) =>
		save(layout.map(item => (item.id === id ? { ...item, ...patch } : item)))
	const move = (id: string, direction: number) => {
		const index = layout.findIndex(item => item.id === id)
		const siblings = available.filter(item => item.side === layout[index].side)
		const target =
			siblings[siblings.findIndex(item => item.id === id) + direction]
		if (!target) return
		const next = [...layout]
		const targetIndex = layout.findIndex(item => item.id === target.id)
		next[index] = layout[targetIndex]
		next[targetIndex] = layout[index]
		save(next)
	}
	const dropTarget = (event: ReactPointerEvent<HTMLButtonElement>) => {
		const row = document
			.elementFromPoint(event.clientX, event.clientY)
			?.closest<HTMLElement>('[data-status-bar-item]')
		if (!row?.dataset.statusBarItem) return null
		const bounds = row.getBoundingClientRect()
		return {
			targetId: row.dataset.statusBarItem,
			after: event.clientY > bounds.top + bounds.height / 2,
		}
	}
	const finishDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
		if (!drag) return
		const target = dropTarget(event)
		if (target)
			save(
				reorderStatusBarLayout(layout, drag.id, target.targetId, target.after),
			)
		setDrag(null)
	}
	const addable = definitions.filter(
		item => item.removable && !layout.some(current => current.id === item.id),
	)

	return (
		<>
			<footer
				aria-label={labels.bar}
				className={cn(
					'fixed inset-x-0 bottom-0 z-40 flex border-t border-primary/15 bg-sky-100 pb-[env(safe-area-inset-bottom)] text-sky-950',
					className,
				)}
				onContextMenu={event => {
					event.preventDefault()
					setCustomizing(true)
				}}
			>
				<div className='flex min-w-0 flex-1 overflow-x-auto'>
					{(['left', 'right'] as const).map(side => (
						<div
							key={side}
							className={cn(
								'flex shrink-0 items-center',
								side === 'right' && 'ml-auto',
							)}
						>
							{available
								.filter(item => item.visible && item.side === side)
								.map(item => (
									<div className='shrink-0' key={item.id}>
										{byId.get(item.id)?.render()}
									</div>
								))}
						</div>
					))}
				</div>
				<button
					type='button'
					className={statusBarItemClass}
					aria-label={labels.customize}
					title={labels.customize}
					onClick={() => setCustomizing(true)}
				>
					<SlidersHorizontal className='size-3' />
				</button>
			</footer>
			<Dialog
				open={customizing}
				onOpenChange={open => {
					setCustomizing(open)
					setDrag(null)
				}}
			>
				<DialogContent className='max-h-[85dvh] overflow-y-auto'>
					<DialogHeader>
						<DialogTitle>{labels.title}</DialogTitle>
						<DialogDescription>{labels.description}</DialogDescription>
					</DialogHeader>
					<div className='divide-y'>
						{available.map(item => {
							const name = label(item.id)
							const siblings = available.filter(
								sibling => sibling.side === item.side,
							)
							return (
								<div
									className={cn(
										'relative flex items-center gap-2 py-2',
										drag?.id === item.id && 'opacity-50',
									)}
									data-status-bar-item={item.id}
									key={item.id}
								>
									{drag && drag.id !== item.id && drag.targetId === item.id ? (
										<span
											aria-hidden
											className={cn(
												'pointer-events-none absolute inset-x-0 h-0.5 bg-primary',
												drag.after ? 'bottom-0' : 'top-0',
											)}
										/>
									) : null}
									<button
										type='button'
										aria-label={labels.dragHandle(name)}
										title={labels.dragHint}
										className='flex h-8 w-5 shrink-0 touch-none cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing'
										onPointerDown={event => {
											if (event.button !== 0) return
											event.currentTarget.setPointerCapture(event.pointerId)
											setDrag({ id: item.id, targetId: item.id, after: false })
										}}
										onPointerMove={event => {
											if (!drag) return
											const target = dropTarget(event)
											setDrag({
												id: drag.id,
												targetId: target?.targetId ?? drag.id,
												after: target?.after ?? false,
											})
										}}
										onPointerUp={finishDrag}
										onPointerCancel={() => setDrag(null)}
										onLostPointerCapture={() => setDrag(null)}
										onKeyDown={event => {
											if (event.key === 'Escape') setDrag(null)
											if (
												event.key === 'ArrowUp' ||
												event.key === 'ArrowDown'
											) {
												event.preventDefault()
												move(item.id, event.key === 'ArrowUp' ? -1 : 1)
											}
										}}
									>
										<GripVertical className='size-4' />
									</button>
									<label className='flex min-w-0 flex-1 items-center gap-2 text-sm'>
										<input
											type='checkbox'
											checked={item.visible}
											disabled={byId.get(item.id)?.required}
											onChange={event =>
												update(item.id, { visible: event.target.checked })
											}
										/>
										<span className='truncate'>{name}</span>
									</label>
									<select
										aria-label={labels.side(name)}
										className='h-8 rounded-md border bg-background px-1 text-xs'
										value={item.side}
										onChange={event =>
											update(item.id, {
												side: event.target.value as StatusBarSide,
											})
										}
									>
										<option value='left'>{labels.left}</option>
										<option value='right'>{labels.right}</option>
									</select>
									<Button
										size='icon'
										variant='ghost'
										aria-label={labels.moveEarlier(name)}
										disabled={siblings[0].id === item.id}
										onClick={() => move(item.id, -1)}
									>
										<ArrowUp />
									</Button>
									<Button
										size='icon'
										variant='ghost'
										aria-label={labels.moveLater(name)}
										disabled={siblings[siblings.length - 1].id === item.id}
										onClick={() => move(item.id, 1)}
									>
										<ArrowDown />
									</Button>
									{byId.get(item.id)?.removable ? (
										<Button
											size='icon'
											variant='ghost'
											aria-label={labels.remove(name)}
											onClick={() =>
												save(layout.filter(current => current.id !== item.id))
											}
										>
											<X />
										</Button>
									) : null}
								</div>
							)
						})}
					</div>
					{definitions.some(item => item.removable) ? (
						<label className='grid gap-2 text-sm'>
							{labels.add}
							<select
								className='h-9 w-full min-w-0 rounded-md border bg-background px-2'
								value=''
								onChange={event => {
									if (event.target.value)
										save([
											...layout,
											{ id: event.target.value, visible: true, side: 'left' },
										])
								}}
							>
								<option value=''>{labels.addPlaceholder}</option>
								{addable.map(item => (
									<option key={item.id} value={item.id}>
										{item.label}
									</option>
								))}
							</select>
						</label>
					) : null}
					<div className='flex justify-between gap-2'>
						<Button
							variant='secondary'
							onClick={() => save([...defaultLayout])}
						>
							{labels.reset}
						</Button>
						<Button onClick={() => setCustomizing(false)}>{labels.done}</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
