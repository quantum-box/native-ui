'use client'

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import * as React from 'react'

import { compatRender, isNativeButtonChild, openState } from '../../lib/overlay'

// 押すと開いたり閉じたりする囲み。中身は base-ui の Collapsible。
// 使い方（open・onOpenChange・asChild・data-state・--radix-collapsible-content-height）は
// Radix のときと同じ。

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?(open: boolean): void
	disabled?: boolean
	asChild?: boolean
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
	({ onOpenChange, asChild, children, disabled, ...props }, ref) => (
		<CollapsiblePrimitive.Root
			ref={ref}
			disabled={disabled}
			onOpenChange={(open: boolean) => onOpenChange?.(open)}
			render={compatRender(
				'div',
				asChild,
				children,
				(state: { open: boolean }) => ({
					...openState(state),
					'data-disabled': disabled ? '' : undefined,
				}),
			)}
			{...props}
		>
			{asChild ? undefined : children}
		</CollapsiblePrimitive.Root>
	),
)
Collapsible.displayName = 'Collapsible'

const CollapsibleTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => (
	<CollapsiblePrimitive.Trigger
		ref={ref}
		nativeButton={isNativeButtonChild(asChild, children)}
		render={compatRender(
			'button',
			asChild,
			children,
			(state: { open: boolean; disabled: boolean }) => ({
				...openState(state),
				'data-disabled': state.disabled ? '' : undefined,
			}),
		)}
		{...props}
	>
		{asChild ? undefined : children}
	</CollapsiblePrimitive.Trigger>
))
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

export interface CollapsibleContentProps
	extends React.HTMLAttributes<HTMLDivElement> {
	/** 閉じても DOM に残す */
	forceMount?: boolean
	asChild?: boolean
}

const CollapsibleContent = React.forwardRef<
	HTMLDivElement,
	CollapsibleContentProps
>(({ forceMount, asChild, children, style, ...props }, ref) => (
	<CollapsiblePrimitive.Panel
		ref={ref}
		keepMounted={forceMount}
		style={
			{
				// Radix のときの変数の名前でも、開く・閉じる動きの高さを使えるようにする
				'--radix-collapsible-content-height': 'var(--collapsible-panel-height)',
				'--radix-collapsible-content-width': 'var(--collapsible-panel-width)',
				...style,
			} as React.CSSProperties
		}
		render={compatRender('div', asChild, children, openState)}
		{...props}
	>
		{asChild ? undefined : children}
	</CollapsiblePrimitive.Panel>
))
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
