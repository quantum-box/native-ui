'use client'

import { Plus, X } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'

export interface MacOSWindowTab {
	/** Stable identifier used by the Tauri WebView and tab state. */
	id: string
	/** Concise page title shown in the tab. */
	title: string
	/** Set false for a tab that the application must keep open. */
	closable?: boolean
}

export interface MacOSWindowTabsProps
	extends React.HTMLAttributes<HTMLElement> {
	tabs: readonly MacOSWindowTab[]
	activeTabId: string
	onTabSelect: (tabId: string) => void
	onTabClose?: (tabId: string) => void
	onNewTab?: () => void
	/** Width reserved for the macOS traffic lights. Defaults to 76px. */
	windowControlsInset?: number
	tabListLabel?: string
	newTabLabel?: string
	closeTabLabel?: (tab: MacOSWindowTab) => string
}

/**
 * A 38px macOS titlebar tab strip for a Tauri window using titleBarStyle=Overlay.
 *
 * This component is deliberately presentation-only. The consumer owns WebView
 * creation, readiness, activation, and disposal, and connects those operations
 * through the callbacks.
 */
const MacOSWindowTabs = React.forwardRef<HTMLElement, MacOSWindowTabsProps>(
	(
		{
			activeTabId,
			className,
			closeTabLabel = tab => `Close ${tab.title}`,
			newTabLabel = 'New tab',
			onNewTab,
			onTabClose,
			onTabSelect,
			tabListLabel = 'Window tabs',
			tabs,
			windowControlsInset = 76,
			...props
		},
		ref,
	) => {
		const tabButtonRefs = React.useRef(new Map<string, HTMLButtonElement>())

		const selectRelativeTab = (
			currentIndex: number,
			key: React.KeyboardEvent<HTMLButtonElement>['key'],
		) => {
			if (tabs.length === 0) return

			let nextIndex: number | undefined
			if (key === 'ArrowLeft') {
				nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
			} else if (key === 'ArrowRight') {
				nextIndex = (currentIndex + 1) % tabs.length
			} else if (key === 'Home') {
				nextIndex = 0
			} else if (key === 'End') {
				nextIndex = tabs.length - 1
			}

			if (nextIndex === undefined) return
			const nextTab = tabs[nextIndex]
			onTabSelect(nextTab.id)
			tabButtonRefs.current.get(nextTab.id)?.focus()
		}

		return (
			<header
				ref={ref}
				data-tauri-drag-region
				className={cn(
					'flex h-[38px] shrink-0 select-none items-stretch border-border border-b bg-surface',
					className,
				)}
				{...props}
			>
				<div
					data-tauri-drag-region
					className='shrink-0'
					style={{ width: windowControlsInset }}
				/>
				<div
					role='tablist'
					aria-label={tabListLabel}
					className='flex min-w-0 items-stretch overflow-x-auto'
				>
					{tabs.map((tab, index) => {
						const active = tab.id === activeTabId
						const closable = tab.closable !== false && onTabClose !== undefined

						return (
							<div
								key={tab.id}
								data-active={active || undefined}
								className={cn(
									'group relative flex h-full min-w-32 max-w-56 items-center border-border border-r transition-colors duration-fast',
									active
										? 'bg-background before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground',
								)}
							>
								<button
									ref={node => {
										if (node) tabButtonRefs.current.set(tab.id, node)
										else tabButtonRefs.current.delete(tab.id)
									}}
									type='button'
									role='tab'
									aria-selected={active}
									tabIndex={active ? 0 : -1}
									onClick={() => onTabSelect(tab.id)}
									onKeyDown={event => {
										if (
											event.key === 'ArrowLeft' ||
											event.key === 'ArrowRight' ||
											event.key === 'Home' ||
											event.key === 'End'
										) {
											event.preventDefault()
											selectRelativeTab(index, event.key)
										}
									}}
									className={cn(
										'flex h-full min-w-0 flex-1 items-center px-3 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
										active && 'font-medium text-foreground',
										closable && 'pr-1',
									)}
								>
									<span className='truncate'>{tab.title}</span>
								</button>
								{closable ? (
									<button
										type='button'
										aria-label={closeTabLabel(tab)}
										onClick={() => onTabClose(tab.id)}
										className='mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-subtle-foreground opacity-70 transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100'
									>
										<X className='size-3' strokeWidth={2} />
									</button>
								) : null}
							</div>
						)
					})}
				</div>
				{onNewTab ? (
					<button
						type='button'
						aria-label={newTabLabel}
						title={`${newTabLabel} (⌘T)`}
						onClick={onNewTab}
						className='m-1 inline-flex w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						<Plus className='size-3.5' />
					</button>
				) : null}
				<div data-tauri-drag-region className='min-w-6 flex-1' />
			</header>
		)
	},
)
MacOSWindowTabs.displayName = 'MacOSWindowTabs'

export { MacOSWindowTabs }
