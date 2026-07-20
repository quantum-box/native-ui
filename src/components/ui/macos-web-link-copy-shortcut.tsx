'use client'

import * as React from 'react'

export type MacOSWebLinkCopyKind = 'url' | 'rich-link' | 'url-fallback'

export interface MacOSWebLinkCopyResult {
	kind: MacOSWebLinkCopyKind
	url: string
	title?: string
}

export interface RichLinkClipboardContents {
	plainText: string
	html: string
}

export interface MacOSWebLinkClipboardEnvironment {
	clipboard?: Pick<Clipboard, 'write' | 'writeText'>
	ClipboardItem?: typeof ClipboardItem
}

export interface MacOSWebLinkCopyShortcutProps {
	/** Keep false outside the macOS native runtime so browser Cmd+L is untouched. */
	enabled: boolean
	/** Resolve at keydown time so route, query, and fragment changes stay current. */
	getWebUrl: () => string
	/** Resolve at keydown time for the rich-link label. */
	getPageTitle: () => string
	onCopy?: (result: MacOSWebLinkCopyResult) => void
	onError?: (error: unknown) => void
}

type ShortcutEvent = Pick<
	KeyboardEvent,
	'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
>

function escapeHtml(value: string): string {
	return value.replace(/[&<>'"]/g, character => {
		switch (character) {
			case '&':
				return '&amp;'
			case '<':
				return '&lt;'
			case '>':
				return '&gt;'
			case "'":
				return '&#39;'
			case '"':
				return '&quot;'
			default:
				return character
		}
	})
}

export function richLinkClipboardContents(
	url: string,
	title: string,
): RichLinkClipboardContents {
	return {
		plainText: url,
		html: `<a href="${escapeHtml(url)}">${escapeHtml(title)}</a>`,
	}
}

export function isMacOSWebUrlCopyShortcut(event: ShortcutEvent): boolean {
	return (
		event.metaKey &&
		!event.shiftKey &&
		!event.ctrlKey &&
		!event.altKey &&
		event.key.toLowerCase() === 'l'
	)
}

export function isMacOSWebRichLinkCopyShortcut(event: ShortcutEvent): boolean {
	return (
		event.metaKey &&
		event.shiftKey &&
		!event.ctrlKey &&
		!event.altKey &&
		event.key.toLowerCase() === 'l'
	)
}

export async function copyMacOSWebUrl(
	url: string,
	environment: MacOSWebLinkClipboardEnvironment,
): Promise<MacOSWebLinkCopyResult> {
	const writeText = environment.clipboard?.writeText?.bind(
		environment.clipboard,
	)
	if (!writeText) throw new Error('Plain text clipboard writing is unavailable')

	await writeText(url)
	return { kind: 'url', url }
}

export async function copyMacOSWebRichLink(
	url: string,
	title: string,
	environment: MacOSWebLinkClipboardEnvironment,
): Promise<MacOSWebLinkCopyResult> {
	const contents = richLinkClipboardContents(url, title)
	const write = environment.clipboard?.write?.bind(environment.clipboard)
	const ClipboardItemConstructor = environment.ClipboardItem

	if (write && ClipboardItemConstructor) {
		try {
			await write([
				new ClipboardItemConstructor({
					'text/plain': new Blob([contents.plainText], {
						type: 'text/plain',
					}),
					'text/html': new Blob([contents.html], {
						type: 'text/html',
					}),
				}),
			])
			return { kind: 'rich-link', url, title }
		} catch {
			// Fall back for WebViews that expose ClipboardItem but reject rich writes.
		}
	}

	const writeText = environment.clipboard?.writeText?.bind(
		environment.clipboard,
	)
	if (!writeText) throw new Error('Clipboard writing is unavailable')

	await writeText(contents.plainText)
	return { kind: 'url-fallback', url, title }
}

function browserClipboardEnvironment(): MacOSWebLinkClipboardEnvironment {
	return {
		clipboard: navigator.clipboard,
		ClipboardItem: globalThis.ClipboardItem,
	}
}

/**
 * Registers Cmd+L and Cmd+Shift+L for a macOS native shell.
 *
 * The component renders nothing. The consumer owns runtime detection, URL and
 * title mapping, and user-visible notifications through the callback props.
 */
function MacOSWebLinkCopyShortcut({
	enabled,
	getPageTitle,
	getWebUrl,
	onCopy,
	onError,
}: MacOSWebLinkCopyShortcutProps) {
	React.useEffect(() => {
		if (!enabled) return
		let disposed = false

		const handleKeyDown = (event: KeyboardEvent) => {
			const copiesUrl = isMacOSWebUrlCopyShortcut(event)
			const copiesRichLink = isMacOSWebRichLinkCopyShortcut(event)
			if (!copiesUrl && !copiesRichLink) return

			event.preventDefault()

			try {
				const url = getWebUrl()
				const operation = copiesRichLink
					? copyMacOSWebRichLink(
							url,
							getPageTitle(),
							browserClipboardEnvironment(),
						)
					: copyMacOSWebUrl(url, browserClipboardEnvironment())

				void operation
					.then(result => {
						if (!disposed) onCopy?.(result)
					})
					.catch(error => {
						if (!disposed) onError?.(error)
					})
			} catch (error) {
				if (!disposed) onError?.(error)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => {
			disposed = true
			window.removeEventListener('keydown', handleKeyDown)
		}
	}, [enabled, getPageTitle, getWebUrl, onCopy, onError])

	return null
}

export { MacOSWebLinkCopyShortcut }
