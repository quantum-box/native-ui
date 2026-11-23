'use client'

import type * as React from 'react'

import { cn } from '../../lib/utils'
import { CopyButton } from './chat-copy'

/*
 * 返事の中のコードと表。どちらも右上にコピーのボタンを付ける。
 * 色付け（シンタックスハイライト）はしない。必要なら children に色付けした物を渡す。
 */

interface CodeBlockProps {
	/** コードの文字。コピーにもこれを使う。 */
	code: string
	/** 言葉の名前。例「SQL」「TypeScript」。見出しに出す。 */
	language?: string
	/** 見出しの代わりに出す名前。例「実行した SQL」。 */
	title?: React.ReactNode
	/** 色付けした物を出したいとき。渡さなければ code をそのまま出す。 */
	children?: React.ReactNode
	/** 高さの上限を超えたら中でスクロールする。 */
	maxHeight?: string
	className?: string
}

/** コードの表示。コピーのボタン付き。 */
function CodeBlock({
	code,
	language,
	title,
	children,
	maxHeight = '24rem',
	className,
}: Readonly<CodeBlockProps>) {
	return (
		<figure
			className={cn(
				'min-w-0 overflow-hidden rounded-md border border-border bg-surface',
				className,
			)}
		>
			<figcaption className='flex h-7 items-center gap-2 border-border border-b pr-1 pl-3 text-muted-foreground text-xs'>
				<span className='min-w-0 flex-1 truncate'>
					{title ?? language ?? 'コード'}
				</span>
				<CopyButton label='コードをコピー' text={code} />
			</figcaption>
			<pre
				className='overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed'
				style={{ maxHeight }}
			>
				<code>{children ?? code}</code>
			</pre>
		</figure>
	)
}

interface TableBlockProps {
	/** 列の見出し。 */
	columns: string[]
	/** 行。各行は列と同じ数の値。 */
	rows: Array<Array<React.ReactNode>>
	/** 見出し。例「店ごとの売上」。 */
	title?: React.ReactNode
	/** 右寄せにする列の番号（数字の列など）。 */
	numericColumns?: number[]
	className?: string
}

function cellText(value: React.ReactNode) {
	if (value === null || value === undefined || typeof value === 'boolean')
		return ''
	if (typeof value === 'string' || typeof value === 'number')
		return String(value)
	return ''
}

/** 表の表示。コピーすると、表計算に貼れるタブ区切りの文字になる。 */
function TableBlock({
	columns,
	rows,
	title,
	numericColumns = [],
	className,
}: Readonly<TableBlockProps>) {
	const tsv = () =>
		[columns, ...rows.map(row => row.map(cellText))]
			.map(row => row.join('\t'))
			.join('\n')
	return (
		<figure
			className={cn(
				'min-w-0 overflow-hidden rounded-md border border-border',
				className,
			)}
		>
			<figcaption className='flex h-7 items-center gap-2 border-border border-b bg-surface pr-1 pl-3 text-muted-foreground text-xs'>
				<span className='min-w-0 flex-1 truncate'>{title ?? '表'}</span>
				<span className='tabular-nums'>{rows.length} 行</span>
				<CopyButton label='表をコピー（表計算に貼れる形）' text={tsv} />
			</figcaption>
			<div className='overflow-auto'>
				<table className='w-full text-left text-xs'>
					<thead className='bg-surface text-muted-foreground'>
						<tr>
							{columns.map((column, index) => (
								<th
									className={cn(
										'whitespace-nowrap px-3 py-1.5 font-medium',
										numericColumns.indexOf(index) !== -1 && 'text-right',
									)}
									key={column}
									scope='col'
								>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, rowIndex) => (
							<tr className='border-border border-t' key={rowIndex}>
								{row.map((cell, index) => (
									<td
										className={cn(
											'px-3 py-1.5',
											numericColumns.indexOf(index) !== -1 &&
												'text-right tabular-nums',
										)}
										key={index}
									>
										{cell}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</figure>
	)
}

export { CodeBlock, type CodeBlockProps, TableBlock, type TableBlockProps }
