'use client'

import { Check, Copy } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import { Button, type ButtonProps } from '../basics/button'

/** 文字をクリップボードに写し、写せたかを少しのあいだ覚えておく。 */
function useCopy(timeout = 1500) {
	const [copied, setCopied] = React.useState(false)
	const timer = React.useRef<ReturnType<typeof setTimeout>>()
	React.useEffect(() => () => clearTimeout(timer.current), [])
	const copy = React.useCallback(
		async (text: string) => {
			try {
				await navigator.clipboard.writeText(text)
				setCopied(true)
				clearTimeout(timer.current)
				timer.current = setTimeout(() => setCopied(false), timeout)
				return true
			} catch {
				return false
			}
		},
		[timeout],
	)
	return { copied, copy }
}

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
	/** 写す文字。関数なら押したときに作る。 */
	text: string | (() => string)
	/** 読み上げとマウスを乗せたときの名前。 */
	label?: string
	/** 写せたあとの名前。 */
	copiedLabel?: string
	/** 文字も並べて出す。 */
	showLabel?: boolean
}

/** 押すとクリップボードに写すボタン。写せたら少しのあいだ印が ✓ になる。 */
function CopyButton({
	text,
	label = 'コピー',
	copiedLabel = 'コピーしました',
	showLabel = false,
	variant = 'ghost',
	size = 'sm',
	className,
	...props
}: Readonly<CopyButtonProps>) {
	const { copied, copy } = useCopy()
	const name = copied ? copiedLabel : label
	return (
		<Button
			aria-label={showLabel ? undefined : name}
			className={cn(!showLabel && size === 'sm' && 'w-6 px-0', className)}
			onClick={() => void copy(typeof text === 'function' ? text() : text)}
			size={size}
			title={name}
			type='button'
			variant={variant}
			{...props}
		>
			{copied ? <Check aria-hidden /> : <Copy aria-hidden />}
			{showLabel ? name : null}
			<span aria-live='polite' className='sr-only'>
				{copied ? copiedLabel : ''}
			</span>
		</Button>
	)
}

export { CopyButton, type CopyButtonProps, useCopy }
