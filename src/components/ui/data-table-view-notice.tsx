import { cn } from '../../lib/utils'
import { Button } from './button'

export type DataTableViewNoticeProps = Readonly<{
	/** 並び替えか絞り込みのどれかが効いているとき true。 */
	active: boolean
	/** 「すべて解除」で呼ばれる。 */
	onClear: () => void
	className?: string
}>

/** 一覧の上に置く案内。列名から並び替え・絞り込みができることと、今それが効いているかを出す。 */
export function DataTableViewNotice({
	active,
	onClear,
	className,
}: DataTableViewNoticeProps) {
	return (
		<div
			className={cn(
				'flex min-h-8 flex-wrap items-center gap-2 px-4 py-1 text-muted-foreground text-xs',
				className,
			)}
		>
			<span>列名から並び替え・絞り込み</span>
			{active ? (
				<>
					<span aria-hidden>·</span>
					<span>並び替え・絞り込みを適用中</span>
					<Button type='button' onClick={onClear} size='sm' variant='ghost'>
						すべて解除
					</Button>
				</>
			) : null}
		</div>
	)
}
