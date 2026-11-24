import { ArrowUpRight, Check, ChevronsUpDown } from 'lucide-react'
import {
	type ForwardedRef,
	type ReactElement,
	type ReactNode,
	type Ref,
	forwardRef,
	useMemo,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import {
	RecordActionButton,
	RecordChip,
	type RecordKindDefinition,
	RecordSystemBand,
	recordToneStyle,
	useRecordKind,
	useRecordSystem,
} from './record'

const noCandidates = (): { records: readonly never[]; loading?: boolean } => ({
	records: [],
})

/**
 * 記録の候補を、種類の決まりから作る（`useCandidates`、または渡した `candidates`）。
 * 今の記録が候補に無くても入れる。付け替えのセルと、記録を選ぶ欄で同じ物を使う。
 */
export function useRecordCandidates<T>(
	definition: RecordKindDefinition<T>,
	current: T | null,
	candidates?: readonly T[],
) {
	// 種類ごとに同じフックを呼ぶ。種類を途中で変えるときは key も変える。
	const fromKind = (definition.useCandidates ?? noCandidates)()
	const pool = candidates ?? (fromKind.records as readonly T[])
	const byId = useMemo(() => {
		const map = new Map<string, T>()
		for (const item of pool) map.set(definition.getId(item), item)
		if (current) map.set(definition.getId(current), current)
		return map
	}, [definition, pool, current])
	return { byId, loading: !candidates && !!fromKind.loading }
}

/** 候補を探すときの言葉（名前・補足・決まりの言葉）。 */
export function recordKeywords<T>(
	definition: RecordKindDefinition<T>,
	item: T,
) {
	return [
		definition.getLabel(item),
		...(definition.getDescription?.(item)
			? [definition.getDescription(item) as string]
			: []),
		...(definition.getKeywords?.(item) ?? []),
	]
}

/**
 * 候補の枠の見た目（別のシステムから選ぶときの帯・線・色）と、検索欄の文言・下の道筋をそろえて返す。
 * 表のセルの付け替えと、記録を選ぶ欄で同じ物を使う。
 */
export function useRecordPickerChrome(kind: string) {
	const { definition, navigate } = useRecordKind(kind)
	const system = useRecordSystem(definition)
	const external = system?.external ? system : null
	return {
		searchPlaceholder: external
			? `${external.name}の${definition.name}を検索…`
			: `${definition.name}を検索…`,
		style: external ? recordToneStyle(external.tone) : undefined,
		className: external
			? 'border-l-[3px] border-l-[hsl(var(--record-tone))]'
			: undefined,
		/** 表のセルで開くときの幅（帯の文字が収まる幅）。フォームの欄では欄の幅に合わせる。 */
		cellWidth: external ? 'w-72' : undefined,
		header: external ? (
			<RecordSystemBand
				system={{ name: external.name, icon: external.icon ?? definition.icon }}
				trailing={
					<>
						<span className='sr-only'>別のシステムから選ぶ</span>
						<ArrowUpRight aria-hidden className='h-3 w-3' />
					</>
				}
			>
				{definition.name}から選ぶ
			</RecordSystemBand>
		) : null,
		footer: definition.pickerActions?.length ? (
			<div className='flex flex-wrap gap-1 border-border border-t p-1.5'>
				{definition.pickerActions.map(action => (
					<RecordActionButton
						key={action.label}
						action={action}
						navigate={navigate}
					/>
				))}
			</div>
		) : null,
	}
}

export type RecordPickerProps<T = unknown> = {
	/** 登録した種類の名前。候補・見た目はその決まりから出す。 */
	kind: string
	/** 選んでいる記録。 */
	value: T | null
	/** 選んだら呼ばれる（「未設定」なら null）。 */
	onChange: (record: T | null) => void
	/** 候補。渡さなければ種類の決まりの `useCandidates` から出す。 */
	candidates?: readonly T[]
	/** 「未設定」に戻せるようにする。 */
	allowEmpty?: boolean
	/** 何も選んでいないときの文言。既定は「{名前}を選ぶ」。 */
	placeholder?: string
	disabled?: boolean
	id?: string
	name?: string
	'aria-label'?: string
	'aria-describedby'?: string
	'aria-invalid'?: boolean
	className?: string
}

/**
 * フォームの中で記録を選ぶ欄。選んでいる記録は表のセルと同じ絵と名前で出し、
 * 候補の枠は付け替えのセルと同じ（別のシステムから選ぶときの帯・色、検索、下の道筋）。
 * `<label htmlFor>` と `id` で項目名と結び付けられる。
 */
export const RecordPicker = forwardRef(function RecordPicker<T = unknown>(
	{
		kind,
		value,
		onChange,
		candidates,
		allowEmpty = false,
		placeholder,
		disabled,
		className,
		...aria
	}: RecordPickerProps<T>,
	ref: ForwardedRef<HTMLButtonElement>,
) {
	const { definition } = useRecordKind<T>(kind)
	const { byId } = useRecordCandidates(definition, value, candidates)
	const chrome = useRecordPickerChrome(kind)
	const [open, setOpen] = useState(false)
	// 候補の中で今あたっている物（矢印キーで動く）。選んでいる記録とは別に持ち、開くたびに選んでいる記録から始める。
	const [active, setActive] = useState('')
	const currentId = value ? definition.getId(value) : ''
	const pick = (record: T | null) => {
		onChange(record)
		setOpen(false)
	}
	const items: ReactNode[] = []
	byId.forEach((item, id) =>
		items.push(
			<CommandItem
				key={id}
				value={id}
				keywords={recordKeywords(definition, item)}
				onSelect={() => pick(item)}
			>
				<RecordChip
					kind={kind}
					record={item}
					interactive={false}
					showDescription
					toned
				/>
				{id === currentId ? (
					<Check
						aria-label={`選んでいる${definition.name}`}
						className='ml-auto'
					/>
				) : null}
			</CommandItem>,
		),
	)
	return (
		<Popover
			open={open}
			onOpenChange={next => {
				if (next) setActive(currentId)
				setOpen(next)
			}}
		>
			<PopoverTrigger asChild>
				<button
					ref={ref}
					type='button'
					disabled={disabled}
					aria-haspopup='listbox'
					{...aria}
					className={cn(
						'flex h-8 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-2 text-left text-sm transition-colors duration-fast hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
						className,
					)}
				>
					<span className='flex min-w-0 flex-1 items-center'>
						{value ? (
							<RecordChip
								kind={kind}
								record={value}
								interactive={false}
								showDescription
							/>
						) : (
							<span className='truncate text-subtle-foreground'>
								{placeholder ?? `${definition.name}を選ぶ`}
							</span>
						)}
					</span>
					<ChevronsUpDown
						aria-hidden
						className='h-3.5 w-3.5 shrink-0 text-muted-foreground'
					/>
				</button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				sideOffset={4}
				style={chrome.style}
				className={cn(
					'w-[var(--radix-popover-trigger-width)] min-w-64 max-w-[calc(100vw-24px)] overflow-hidden p-0',
					chrome.className,
				)}
				aria-label={`${definition.name}を選ぶ`}
			>
				{chrome.header}
				<Command value={active} onValueChange={setActive}>
					<CommandInput
						aria-label={`${definition.name}を検索`}
						placeholder={chrome.searchPlaceholder}
					/>
					<CommandList aria-label={`${definition.name}の候補`}>
						<CommandEmpty>一致する{definition.name}はありません。</CommandEmpty>
						<CommandGroup>
							{allowEmpty ? (
								<CommandItem value='' onSelect={() => pick(null)}>
									<span className='text-muted-foreground'>未設定</span>
									{!currentId ? (
										<Check
											aria-label='未設定を選んでいる'
											className='ml-auto'
										/>
									) : null}
								</CommandItem>
							) : null}
							{items}
						</CommandGroup>
					</CommandList>
				</Command>
				{chrome.footer}
			</PopoverContent>
		</Popover>
	)
}) as <T = unknown>(
	props: RecordPickerProps<T> & { ref?: Ref<HTMLButtonElement> },
) => ReactElement
