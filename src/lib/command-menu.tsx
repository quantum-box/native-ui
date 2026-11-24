'use client'

import * as React from 'react'

/*
 * 検索して選ぶ一覧（Command）の中身。以前は cmdk を使っていたが、cmdk は自分の中で
 * Radix の Dialog を読むので、同じ使い方のまま自前で書いた。
 *
 * cmdk と同じにしたこと:
 * - 使い方: Command（value・onValueChange・shouldFilter・filter・loop・label）、
 *   Input（value・onValueChange）、List、Empty、Group（heading・forceMount）、
 *   Item（value・keywords・onSelect・disabled・forceMount）、Separator（alwaysRender）
 * - 属性: cmdk-root・cmdk-input・cmdk-list・cmdk-item・cmdk-group・cmdk-group-heading・
 *   cmdk-group-items・cmdk-empty・cmdk-separator、項目の data-selected・data-disabled・data-value
 * - 動き: 打った文字で絞り、近い順に並べる。絞るたびに先頭を選ぶ。↑↓・Home・End・Enter、
 *   Ctrl+N/P・Ctrl+J/K。指を乗せると選ぶ。合う項目の無い Group は隠す。検索中は Separator を隠す
 * - 読み上げ: 入力欄は combobox（aria-activedescendant で選んだ項目を指す）、一覧は listbox、
 *   項目は option
 */

/** 打った文字と、項目の値・キーワードの近さ（0 なら合わない、1 がいちばん近い） */
export function commandScore(
	value: string,
	search: string,
	keywords: readonly string[] = [],
): number {
	const query = search.trim().toLowerCase()
	if (!query) return 1
	const one = (text: string) => {
		const target = text.trim().toLowerCase()
		if (!target) return 0
		if (target === query) return 1
		if (target.startsWith(query)) return 0.9
		const index = target.indexOf(query)
		if (index >= 0) {
			// 言葉の頭（空白・記号の後）で合うほうを高く、後ろで合うほど少し低く
			const wordStart = /[\s\-_./:()（）・、,]/.test(target[index - 1] ?? '')
			return (wordStart ? 0.8 : 0.7) - Math.min(index, 50) * 0.001
		}
		// 文字が順に入っていれば、離れているほど低く
		let position = -1
		let gaps = 0
		for (const char of query) {
			const next = target.indexOf(char, position + 1)
			if (next < 0) return 0
			if (position >= 0) gaps += next - position - 1
			position = next
		}
		return Math.max(0.05, 0.4 - gaps * 0.02)
	}
	let best = one(value)
	for (const keyword of keywords) best = Math.max(best, one(keyword) * 0.99)
	return best
}

type Filter = (value: string, search: string, keywords?: string[]) => number

interface ItemInfo {
	value: string
	keywords: string[]
	disabled: boolean
	forceMount: boolean
	groupId: string | undefined
	onSelect: ((value: string) => void) | undefined
	domId: string
}

interface CommandContext {
	search: string
	setSearch: (search: string) => void
	active: string | undefined
	setActive: (value: string) => void
	register: (id: string, info: ItemInfo) => () => void
	scoreOf: (id: string) => number
	groupVisible: (groupId: string) => boolean
	/** 群の中でいちばん近い項目の近さ */
	groupBest: (groupId: string) => number
	visibleCount: number
	filtering: boolean
	listId: string
	/** 使う側が CommandList・CommandInput に id を渡したら、それを使う */
	setCustomListId: (id: string | undefined) => void
	setCustomInputId: (id: string | undefined) => void
	/** label を渡したときだけ（見えないラベルがあるときだけ）、入力欄から指す */
	labelId: string | undefined
	inputId: string
	activeDomId: string | undefined
	listRef: React.MutableRefObject<HTMLDivElement | null>
}

const Context = React.createContext<CommandContext | null>(null)
/** 項目が入っている群（id と、群の forceMount） */
const GroupContext = React.createContext<
	{ id: string; forceMount: boolean } | undefined
>(undefined)

function useCommand(part: string) {
	const context = React.useContext(Context)
	if (!context) throw new Error(`${part} は Command の中で使ってください。`)
	return context
}

export interface CommandRootProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
	/** 選んでいる（↑↓で動く）項目の値 */
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	/** false なら絞らず並べ替えない（使う側が絞るとき） */
	shouldFilter?: boolean
	/** 近さの決め方。0 なら隠す。大きいほど上に並ぶ */
	filter?: Filter
	/** 端で↑↓を押すと反対の端へ回る */
	loop?: boolean
	/** Ctrl+J/K でも動く（既定 true） */
	vimBindings?: boolean
	/** 読み上げ用の名前（見えないラベル） */
	label?: string
}

const Root = React.forwardRef<HTMLDivElement, CommandRootProps>(
	(
		{
			value,
			defaultValue,
			onValueChange,
			shouldFilter = true,
			filter,
			loop = false,
			vimBindings = true,
			label,
			children,
			onKeyDown,
			...props
		},
		ref,
	) => {
		const [search, setSearchState] = React.useState('')
		const [innerActive, setInnerActive] = React.useState(defaultValue)
		const active = value ?? innerActive
		const setActive = React.useCallback(
			(next: string) => {
				setInnerActive(next)
				onValueChange?.(next)
			},
			[onValueChange],
		)
		const registry = React.useRef(new Map<string, ItemInfo>())
		const [version, setVersion] = React.useState(0)
		const register = React.useCallback((id: string, info: ItemInfo) => {
			registry.current.set(id, info)
			setVersion(v => v + 1)
			return () => {
				registry.current.delete(id)
				setVersion(v => v + 1)
			}
		}, [])

		const filtering = shouldFilter && search.trim() !== ''
		// 項目ごとの近さ（絞らないときはどれも 1）
		const scores = React.useMemo(() => {
			const map = new Map<string, number>()
			for (const [id, info] of registry.current) {
				const score = !filtering
					? 1
					: filter
						? filter(info.value, search, info.keywords)
						: commandScore(info.value, search, info.keywords)
				map.set(id, score)
			}
			return map
		}, [version, search, filtering, filter])
		const scoreOf = React.useCallback(
			(id: string) => scores.get(id) ?? 0,
			[scores],
		)
		const visibleCount = [...scores.values()].filter(score => score > 0).length
		const groupBest = React.useCallback(
			(groupId: string) => {
				let best = 0
				for (const [id, info] of registry.current)
					if (info.groupId === groupId)
						best = Math.max(best, scores.get(id) ?? 0)
				return best
			},
			[scores],
		)
		// 合う項目があるか、forceMount の項目（「続きを読む」など）があれば群を出す
		const groupVisible = React.useCallback(
			(groupId: string) => {
				if (groupBest(groupId) > 0) return true
				for (const info of registry.current.values())
					if (info.groupId === groupId && info.forceMount) return true
				return false
			},
			[groupBest],
		)

		const listRef = React.useRef<HTMLDivElement | null>(null)
		const base = React.useId()
		const [customListId, setCustomListId] = React.useState<string>()
		const [customInputId, setCustomInputId] = React.useState<string>()
		const listId = customListId ?? `${base}-list`
		const labelId = label ? `${base}-label` : undefined
		const inputId = customInputId ?? `${base}-input`

		/** 見えていて選べる項目を、画面の並び（近い順）で */
		const ordered = React.useCallback(() => {
			const list = listRef.current
			if (!list) return []
			const byDomId = new Map<string, { id: string; info: ItemInfo }>()
			for (const [id, info] of registry.current)
				byDomId.set(info.domId, { id, info })
			const items = Array.from(
				list.querySelectorAll<HTMLElement>('[cmdk-item]'),
			)
				.map(el => byDomId.get(el.id))
				.filter(
					(entry): entry is { id: string; info: ItemInfo } =>
						!!entry && !entry.info.disabled,
				)
			if (!filtering) return items
			// 画面の並び（CSS の order）と同じ決まりで並べる:
			// 1. 一覧の直下の単位（群、または群に入っていない項目）を、近さ（群なら中の
			//    いちばん近い項目の近さ）の順に。同じ近さなら書いた順
			// 2. 群の中の項目を、近さの順に。同じ近さなら書いた順
			// 近さは CSS の order と同じく 1000 倍して丸めた値で比べる
			const rank = (score: number) => Math.round(score * 1000)
			const unitOf = (entry: { id: string; info: ItemInfo }) =>
				entry.info.groupId ?? `item:${entry.id}`
			const unitScore = new Map<string, number>()
			const unitIndex = new Map<string, number>()
			items.forEach((entry, index) => {
				const unit = unitOf(entry)
				// 群の近さは、画面（CSS の order）と同じく、使えない項目も含めた
				// いちばん近い項目の近さ。使えない項目は、移る先には入れない
				unitScore.set(
					unit,
					entry.info.groupId
						? rank(groupBest(entry.info.groupId))
						: rank(scoreOf(entry.id)),
				)
				if (!unitIndex.has(unit)) unitIndex.set(unit, index)
			})
			const position = new Map(items.map((entry, index) => [entry, index]))
			return [...items].sort((a, b) => {
				const unitA = unitOf(a)
				const unitB = unitOf(b)
				if (unitA !== unitB)
					return (
						(unitScore.get(unitB) ?? 0) - (unitScore.get(unitA) ?? 0) ||
						(unitIndex.get(unitA) ?? 0) - (unitIndex.get(unitB) ?? 0)
					)
				return (
					rank(scoreOf(b.id)) - rank(scoreOf(a.id)) ||
					(position.get(a) ?? 0) - (position.get(b) ?? 0)
				)
			})
		}, [filtering, scoreOf, groupBest])

		// 打った文字が変わったら先頭を選ぶ。選んでいる項目が消えたときも先頭を選ぶ
		// はじめは「今の検索の文字」から始める（出た時は打ち変えたとみなさず、
		// 渡された選んでいる値があればそのまま使う）
		const lastSearch = React.useRef(search)
		React.useLayoutEffect(() => {
			// 値を中の文字から取る項目は、一度描いてから登録する。登録を待っている項目が
			// あるあいだは、選び直さない（渡された選んでいる値を、先頭で上書きしないため）
			const list = listRef.current
			if (list) {
				const registered = new Set(
					[...registry.current.values()].map(info => info.domId),
				)
				const pending = Array.from(
					list.querySelectorAll<HTMLElement>('[cmdk-item]'),
				).some(el => !registered.has(el.id))
				if (pending) return
			}
			const items = ordered()
			const searchChanged = lastSearch.current !== search
			lastSearch.current = search
			const stillThere = items.some(({ info }) => info.value === active)
			if (searchChanged || !stillThere) {
				const first = items[0]?.info.value
				if (first !== undefined && first !== active) setActive(first)
			}
		}, [search, scores, ordered, active, setActive])

		// 選んでいる項目が、いま描かれている（合っているか forceMount の）ときだけ指す。
		// 検索で隠れたら、読み上げが無い項目を指さないよう外す
		const activeDomId = React.useMemo(() => {
			for (const [id, info] of registry.current)
				if (
					info.value === active &&
					!info.disabled &&
					((scores.get(id) ?? 0) > 0 || info.forceMount)
				)
					return info.domId
			return undefined
		}, [active, scores])

		// 選んだ項目が見えるようにスクロールする
		React.useLayoutEffect(() => {
			if (!activeDomId) return
			const el = listRef.current?.ownerDocument.getElementById(activeDomId)
			el?.scrollIntoView?.({ block: 'nearest' })
		}, [activeDomId])

		const move = (step: 1 | -1 | 'first' | 'last') => {
			const items = ordered()
			if (!items.length) return
			const index = items.findIndex(({ info }) => info.value === active)
			let next: number
			if (step === 'first') next = 0
			else if (step === 'last') next = items.length - 1
			else if (index < 0) next = step === 1 ? 0 : items.length - 1
			else {
				next = index + step
				if (next < 0) next = loop ? items.length - 1 : 0
				if (next >= items.length) next = loop ? 0 : items.length - 1
			}
			const target = items[next]
			if (target) setActive(target.info.value)
		}

		const context: CommandContext = {
			search,
			setSearch: setSearchState,
			active,
			setActive,
			register,
			scoreOf,
			groupVisible,
			groupBest,
			visibleCount,
			filtering,
			listId,
			setCustomListId,
			setCustomInputId,
			labelId,
			inputId,
			activeDomId,
			listRef,
		}

		return (
			<div
				ref={ref}
				tabIndex={-1}
				cmdk-root=''
				{...props}
				onKeyDown={event => {
					onKeyDown?.(event)
					if (event.defaultPrevented) return
					const { key, ctrlKey } = event
					if (event.nativeEvent.isComposing || event.keyCode === 229) return
					const down =
						key === 'ArrowDown' ||
						(ctrlKey && (key === 'n' || (vimBindings && key === 'j')))
					const up =
						key === 'ArrowUp' ||
						(ctrlKey && (key === 'p' || (vimBindings && key === 'k')))
					if (down || up) {
						event.preventDefault()
						move(down ? 1 : -1)
					} else if (key === 'Home' || key === 'End') {
						event.preventDefault()
						move(key === 'Home' ? 'first' : 'last')
					} else if (key === 'Enter') {
						const target = ordered().find(({ info }) => info.value === active)
						if (!target) return
						event.preventDefault()
						target.info.onSelect?.(target.info.value)
					}
				}}
			>
				{label ? (
					<label
						cmdk-label=''
						htmlFor={inputId}
						id={labelId}
						className='sr-only'
					>
						{label}
					</label>
				) : null}
				<Context.Provider value={context}>{children}</Context.Provider>
			</div>
		)
	},
)
Root.displayName = 'Command'

export interface CommandInputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'type'> {
	value?: string
	onValueChange?: (search: string) => void
}

const Input = React.forwardRef<HTMLInputElement, CommandInputProps>(
	({ value, onValueChange, onChange, id: idProp, ...props }, ref) => {
		const command = useCommand('CommandInput')
		// 渡された id を、見えないラベルの htmlFor にも使う
		const { setCustomInputId } = command
		React.useLayoutEffect(() => {
			setCustomInputId(idProp)
			return () => setCustomInputId(undefined)
		}, [idProp, setCustomInputId])
		const { setSearch } = command
		// 外で持つ形なら、外の値を検索の文字にする
		React.useLayoutEffect(() => {
			if (value !== undefined) setSearch(value)
		}, [value, setSearch])
		return (
			<input
				ref={ref}
				cmdk-input=''
				autoComplete='off'
				autoCorrect='off'
				spellCheck={false}
				aria-autocomplete='list'
				role='combobox'
				aria-expanded
				aria-controls={command.listId}
				aria-labelledby={command.labelId}
				aria-activedescendant={command.activeDomId}
				id={idProp ?? command.inputId}
				type='text'
				{...props}
				value={value ?? command.search}
				onChange={event => {
					onChange?.(event)
					if (value === undefined) setSearch(event.target.value)
					onValueChange?.(event.target.value)
				}}
			/>
		)
	},
)
Input.displayName = 'CommandInput'

const List = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { label?: string }
>(({ children, label, id: idProp, ...props }, ref) => {
	const command = useCommand('CommandList')
	// 渡された id を、入力欄の aria-controls にも使う
	const { setCustomListId } = command
	React.useLayoutEffect(() => {
		setCustomListId(idProp)
		return () => setCustomListId(undefined)
	}, [idProp, setCustomListId])
	const { listRef } = command
	const setRefs = React.useCallback(
		(node: HTMLDivElement | null) => {
			listRef.current = node
			if (typeof ref === 'function') ref(node)
			else if (ref)
				(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
		},
		[ref, listRef],
	)
	return (
		<div
			ref={setRefs}
			cmdk-list=''
			role='listbox'
			tabIndex={-1}
			aria-label={label}
			id={idProp ?? command.listId}
			{...props}
		>
			{/* 近い順に並べる（CSS の order）ために、縦に並べる */}
			<div
				cmdk-list-sizer=''
				style={{ display: 'flex', flexDirection: 'column' }}
			>
				{children}
			</div>
		</div>
	)
})
List.displayName = 'CommandList'

const Empty = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
	const command = useCommand('CommandEmpty')
	if (command.visibleCount > 0) return null
	return <div ref={ref} cmdk-empty='' role='presentation' {...props} />
})
Empty.displayName = 'CommandEmpty'

export interface CommandGroupProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'value'> {
	heading?: React.ReactNode
	value?: string
	/** 合う項目が無くても出す */
	forceMount?: boolean
}

const Group = React.forwardRef<HTMLDivElement, CommandGroupProps>(
	({ heading, value, forceMount, children, style, ...props }, ref) => {
		const command = useCommand('CommandGroup')
		const id = React.useId()
		const headingId = `${id}-heading`
		const visible = forceMount || command.groupVisible(id)
		// 群に forceMount を付けたら、中の項目も合わなくても出す（cmdk と同じ）
		const groupContextValue = React.useMemo(
			() => ({ id, forceMount: !!forceMount }),
			[id, forceMount],
		)
		return (
			<div
				ref={ref}
				cmdk-group=''
				role='presentation'
				data-value={value}
				hidden={visible ? undefined : true}
				// 検索中は、中のいちばん近い項目ほど上に並べる
				style={{
					...style,
					order: command.filtering
						? -Math.round(command.groupBest(id) * 1000)
						: undefined,
				}}
				{...props}
			>
				{heading ? (
					<div cmdk-group-heading='' aria-hidden id={headingId}>
						{heading}
					</div>
				) : null}
				<div
					cmdk-group-items=''
					role='group'
					aria-labelledby={heading ? headingId : undefined}
					style={{ display: 'flex', flexDirection: 'column' }}
				>
					<GroupContext.Provider value={groupContextValue}>
						{children}
					</GroupContext.Provider>
				</div>
			</div>
		)
	},
)
Group.displayName = 'CommandGroup'

const Separator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { alwaysRender?: boolean }
>(({ alwaysRender, ...props }, ref) => {
	const command = useCommand('CommandSeparator')
	if (!alwaysRender && command.search.trim() !== '') return null
	return (
		// 区切りは押せない物で、フォーカスも当てない（cmdk と同じ）
		// biome-ignore lint/a11y/useFocusableInteractive: 区切りに移る必要は無い
		<div ref={ref} cmdk-separator='' role='separator' {...props} />
	)
})
Separator.displayName = 'CommandSeparator'

export interface CommandItemProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect' | 'value'> {
	/** 項目の値。省くと中の文字 */
	value?: string
	/** 値のほかに、検索で合わせる言葉 */
	keywords?: string[]
	onSelect?: (value: string) => void
	disabled?: boolean
	/** 検索で合わなくても出す */
	forceMount?: boolean
}

const Item = React.forwardRef<HTMLDivElement, CommandItemProps>(
	(
		{
			id: idProp,
			value: valueProp,
			keywords,
			onSelect,
			disabled = false,
			forceMount: forceMountProp = false,
			children,
			style,
			onPointerMove,
			onClick,
			...props
		},
		ref,
	) => {
		const command = useCommand('CommandItem')
		const group = React.useContext(GroupContext)
		const groupId = group?.id
		const forceMount = forceMountProp || !!group?.forceMount
		const id = React.useId()
		// 使う側が id を渡せば、それを描く id にも、選んだ項目を指す id にも使う
		const domId = idProp ?? `${id}-item`
		const elementRef = React.useRef<HTMLDivElement | null>(null)
		const [textValue, setTextValue] = React.useState('')
		const value = (valueProp ?? textValue).trim()
		const onSelectRef = React.useRef(onSelect)
		onSelectRef.current = onSelect
		const keywordsKey = JSON.stringify(keywords ?? [])
		const { register } = command

		// 値を省いたときは、中の文字を値にする
		React.useLayoutEffect(() => {
			// 隠れているあいだは、覚えた文字のままにする
			if (valueProp === undefined && elementRef.current)
				setTextValue(elementRef.current.textContent ?? '')
		})
		// 値が分かってから登録する（値を中の文字から取るときは、一度描いた後）
		const known = valueProp !== undefined || textValue !== ''
		React.useLayoutEffect(() => {
			if (!known) return
			return register(id, {
				value,
				keywords: keywords ?? [],
				disabled,
				forceMount,
				groupId,
				onSelect: next => onSelectRef.current?.(next),
				domId,
			})
		}, [
			known,
			register,
			id,
			value,
			keywordsKey,
			disabled,
			forceMount,
			groupId,
			domId,
		])

		const score = command.scoreOf(id)
		const selected = command.active === value && !disabled
		// 値を中の文字から取るときは、一度描かないと文字が分からないので、隠さずに描く
		if (known && !forceMount && score <= 0) return null

		const setRefs = (node: HTMLDivElement | null) => {
			elementRef.current = node
			if (typeof ref === 'function') ref(node)
			else if (ref)
				(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
		}
		return (
			// フォーカスは検索の欄に残し、aria-activedescendant でこの項目を指す（cmdk と同じ）
			// biome-ignore lint/a11y/useFocusableInteractive: 項目にはフォーカスを移さない
			<div
				ref={setRefs}
				cmdk-item=''
				role='option'
				id={domId}
				aria-disabled={disabled || undefined}
				aria-selected={selected}
				data-disabled={disabled}
				data-selected={selected}
				data-value={value}
				style={{
					...style,
					order: command.filtering ? -Math.round(score * 1000) : undefined,
				}}
				{...props}
				onPointerMove={event => {
					onPointerMove?.(event)
					if (!disabled && !selected) command.setActive(value)
				}}
				onClick={event => {
					onClick?.(event)
					if (disabled) return
					// 指を動かさずに押されたとき（指で触れる・読み上げの操作など）も、
					// 押した項目を選んでから知らせる
					if (!selected) command.setActive(value)
					onSelectRef.current?.(value)
				}}
			>
				{children}
			</div>
		)
	},
)
Item.displayName = 'CommandItem'

export const CommandMenu = Object.assign(Root, {
	Input,
	List,
	Empty,
	Group,
	Separator,
	Item,
})
