import * as React from 'react'

import { cn } from '../../lib/utils'

const Table = React.forwardRef<
	HTMLTableElement,
	React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
	<div className='relative w-full overflow-auto'>
		<table
			ref={ref}
			className={cn('w-full caption-bottom text-sm', className)}
			{...props}
		/>
	</div>
))
Table.displayName = 'Table'

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<thead
		ref={ref}
		className={cn(
			'border-y border-border bg-surface [&_tr]:border-b-0 [&_tr]:hover:bg-transparent',
			className,
		)}
		{...props}
	/>
))
TableHeader.displayName = 'TableHeader'

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
	<tbody
		ref={ref}
		className={cn('[&_tr:last-child]:border-b-0', className)}
		{...props}
	/>
))
TableBody.displayName = 'TableBody'

const TableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
	<tr
		ref={ref}
		className={cn(
			'border-b border-border transition-colors duration-fast hover:bg-muted/50 data-[state=selected]:bg-selected data-[state=selected]:shadow-[inset_2px_0_0_hsl(var(--nui-primary))]',
			className,
		)}
		{...props}
	/>
))
TableRow.displayName = 'TableRow'

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<th
		ref={ref}
		className={cn(
			'h-[38px] px-5 text-left align-middle text-2xs font-semibold tracking-[0.03em] text-muted-foreground [&:has([role=checkbox])]:pr-0',
			className,
		)}
		{...props}
	/>
))
TableHead.displayName = 'TableHead'

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
	<td
		ref={ref}
		className={cn(
			'h-9 px-5 py-2 align-middle [&:has([role=checkbox])]:pr-0',
			className,
		)}
		{...props}
	/>
))
TableCell.displayName = 'TableCell'

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
	<caption
		ref={ref}
		className={cn('mt-3 text-xs text-muted-foreground', className)}
		{...props}
	/>
))
TableCaption.displayName = 'TableCaption'

export {
	Table,
	TableHeader,
	TableBody,
	TableRow,
	TableHead,
	TableCell,
	TableCaption,
}
