'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import * as React from 'react'

import { compatRender } from '../../lib/overlay'
import { cn } from '../../lib/utils'

// 中身は base-ui の Tabs。使い方（value・onValueChange・asChild・data-state）は Radix のときと同じ。

export interface TabsProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'dir'> {
	value?: string
	defaultValue?: string
	onValueChange?(value: string): void
	orientation?: 'horizontal' | 'vertical'
	/** automatic（既定）: 矢印で動くと選ばれる。manual: Enter・Space で選ぶ */
	activationMode?: 'automatic' | 'manual'
	dir?: 'ltr' | 'rtl'
	asChild?: boolean
}

const ActivationContext = React.createContext<'automatic' | 'manual'>(
	'automatic',
)

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
	(
		{
			value,
			defaultValue,
			onValueChange,
			orientation = 'horizontal',
			activationMode = 'automatic',
			dir: _dir,
			asChild,
			children,
			...props
		},
		ref,
	) => (
		<ActivationContext.Provider value={activationMode}>
			<TabsPrimitive.Root
				ref={ref}
				value={value}
				// Radix と同じく、何も渡さなければ何も選ばない（base-ui の既定は 0）
				defaultValue={defaultValue ?? null}
				onValueChange={(next: string) => onValueChange?.(next)}
				orientation={orientation}
				render={compatRender(
					'div',
					asChild,
					children,
					(state: { orientation: string }) => ({
						'data-orientation': state.orientation,
					}),
				)}
				{...props}
			>
				{asChild ? undefined : children}
			</TabsPrimitive.Root>
		</ActivationContext.Provider>
	),
)
Tabs.displayName = 'Tabs'

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
	/** 矢印で端まで行ったら反対の端へ戻る。既定は true */
	loop?: boolean
	asChild?: boolean
}

/**
 * Radix と同じ矢印の動き。使えないタブは飛ばし、端では反対の端へ戻る（loop のとき）。
 * automatic なら動いた先を選ぶ。base-ui は使えないタブにも止まるので、ここで先に受ける。
 */
function handleRovingKeys(
	event: React.KeyboardEvent<HTMLDivElement>,
	loop: boolean,
	activationMode: 'automatic' | 'manual',
) {
	const list = event.currentTarget
	const vertical = list.getAttribute('aria-orientation') === 'vertical'
	const rtl = getComputedStyle(list).direction === 'rtl'
	const nextKey = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
	const prevKey = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
	if ([nextKey, prevKey, 'Home', 'End'].indexOf(event.key) === -1) return
	if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
	const tabs = Array.from(
		list.querySelectorAll<HTMLElement>('[role="tab"]'),
	).filter(
		tab =>
			!tab.hasAttribute('data-disabled') &&
			!(tab as HTMLButtonElement).disabled &&
			tab.getAttribute('aria-disabled') !== 'true',
	)
	if (tabs.length === 0) return
	const current = tabs.indexOf(document.activeElement as HTMLElement)
	let target: HTMLElement | undefined
	if (event.key === 'Home') target = tabs[0]
	else if (event.key === 'End') target = tabs[tabs.length - 1]
	else {
		const step = event.key === nextKey ? 1 : -1
		const index = current + step
		if (index >= 0 && index < tabs.length) target = tabs[index]
		else if (loop) target = tabs[(index + tabs.length) % tabs.length]
		else target = tabs[current]
	}
	event.preventDefault()
	event.stopPropagation()
	if (!target) return
	target.focus()
	if (
		activationMode === 'automatic' &&
		target.getAttribute('aria-selected') !== 'true'
	)
		target.click()
}

const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
	(
		{ className, loop = true, asChild, children, onKeyDownCapture, ...props },
		ref,
	) => {
		const activationMode = React.useContext(ActivationContext)
		return (
			<TabsPrimitive.List
				ref={ref}
				onKeyDownCapture={(event: React.KeyboardEvent<HTMLDivElement>) => {
					onKeyDownCapture?.(event)
					if (!event.defaultPrevented)
						handleRovingKeys(event, loop, activationMode)
				}}
				loopFocus={loop}
				activateOnFocus={activationMode === 'automatic'}
				className={cn(
					'inline-flex h-8 items-center justify-center rounded-md bg-muted p-0.5 text-muted-foreground',
					className,
				)}
				render={compatRender(
					'div',
					asChild,
					children,
					(state: { orientation: string }) => ({
						'data-orientation': state.orientation,
					}),
				)}
				{...props}
			>
				{asChild ? undefined : children}
			</TabsPrimitive.List>
		)
	},
)
TabsList.displayName = 'TabsList'

export interface TabsTriggerProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	value: string
	asChild?: boolean
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
	({ className, asChild, children, ...props }, ref) => (
		<TabsPrimitive.Tab
			ref={ref}
			className={cn(
				'inline-flex h-7 items-center justify-center whitespace-nowrap rounded-sm px-2.5 text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
				className,
			)}
			render={compatRender(
				'button',
				asChild,
				children,
				(state: { active: boolean; orientation: string }) => ({
					'data-state': state.active ? 'active' : 'inactive',
					'data-orientation': state.orientation,
				}),
			)}
			{...props}
		>
			{asChild ? undefined : children}
		</TabsPrimitive.Tab>
	),
)
TabsTrigger.displayName = 'TabsTrigger'

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
	value: string
	/** 選ばれていなくても DOM に残す */
	forceMount?: boolean
	asChild?: boolean
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
	({ className, forceMount, asChild, children, ...props }, ref) => (
		<TabsPrimitive.Panel
			ref={ref}
			keepMounted={forceMount}
			className={cn(
				'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
				className,
			)}
			render={compatRender(
				'div',
				asChild,
				children,
				(state: { hidden: boolean; orientation: string }) => ({
					'data-state': state.hidden ? 'inactive' : 'active',
					'data-orientation': state.orientation,
				}),
			)}
			{...props}
		>
			{asChild ? undefined : children}
		</TabsPrimitive.Panel>
	),
)
TabsContent.displayName = 'TabsContent'

export { Tabs, TabsList, TabsTrigger, TabsContent }
