'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import * as React from 'react'

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

interface ComboboxOption {
	value: string
	label: string
	/** Extra strings the search filter matches besides the label. */
	keywords?: string[]
	/** Secondary text rendered under the label in the option row. */
	description?: string
	disabled?: boolean
}

interface ComboboxProps {
	options: ComboboxOption[]
	value?: string | null
	onValueChange?: (value: string) => void
	open?: boolean
	onOpenChange?: (open: boolean) => void
	/** Trigger label shown when no option is selected. */
	placeholder?: string
	searchPlaceholder?: string
	emptyText?: string
	disabled?: boolean
	/**
	 * Custom trigger element, rendered with `asChild`. Defaults to a
	 * select-like button showing the selected option's label.
	 */
	trigger?: React.ReactNode
	align?: React.ComponentPropsWithoutRef<typeof PopoverContent>['align']
	/** Class for the default trigger button. */
	className?: string
	/** Class for the popover content. */
	contentClassName?: string
}

/**
 * Searchable select built from Popover + Command (shadcn combobox
 * pattern). Options are filtered by label plus optional keywords, so
 * IDs and aliases can be matched without being displayed as the label.
 */
const Combobox = ({
	options,
	value,
	onValueChange,
	open: openProp,
	onOpenChange,
	placeholder = 'Select...',
	searchPlaceholder = 'Search...',
	emptyText = 'No results found.',
	disabled,
	trigger,
	align = 'start',
	className,
	contentClassName,
}: ComboboxProps) => {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
	const open = openProp ?? uncontrolledOpen
	const setOpen = (next: boolean) => {
		setUncontrolledOpen(next)
		onOpenChange?.(next)
	}

	const selected = options.find(option => option.value === value)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild disabled={disabled}>
				{trigger ?? (
					<button
						type='button'
						role='combobox'
						aria-expanded={open}
						disabled={disabled}
						className={cn(
							'flex h-7 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors duration-fast hover:bg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50',
							className,
						)}
					>
						<span
							className={cn('truncate', !selected && 'text-subtle-foreground')}
						>
							{selected?.label ?? placeholder}
						</span>
						<ChevronsUpDown className='size-3.5 shrink-0 text-subtle-foreground' />
					</button>
				)}
			</PopoverTrigger>
			<PopoverContent
				align={align}
				className={cn('w-64 p-0', contentClassName)}
			>
				<Command>
					<CommandInput placeholder={searchPlaceholder} className='h-9' />
					<CommandList>
						<CommandEmpty>{emptyText}</CommandEmpty>
						<CommandGroup>
							{options.map(option => (
								<CommandItem
									key={option.value}
									value={option.value}
									keywords={[option.label, ...(option.keywords ?? [])]}
									disabled={option.disabled}
									// cmdk lowercases item values in onSelect, so pass
									// the original value from the closure instead.
									onSelect={() => {
										onValueChange?.(option.value)
										setOpen(false)
									}}
								>
									<span className='flex min-w-0 flex-1 flex-col leading-tight'>
										<span className='truncate'>{option.label}</span>
										{option.description && (
											<span className='truncate text-2xs text-subtle-foreground'>
												{option.description}
											</span>
										)}
									</span>
									<Check
										className={cn(
											'ml-2 size-3.5 shrink-0 text-primary',
											option.value === value ? 'opacity-100' : 'opacity-0',
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
Combobox.displayName = 'Combobox'

export { Combobox, type ComboboxOption, type ComboboxProps }
