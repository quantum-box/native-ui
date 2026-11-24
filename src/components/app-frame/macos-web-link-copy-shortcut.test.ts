import { describe, expect, it, vi } from 'vitest'

import {
	copyMacOSWebRichLink,
	copyMacOSWebUrl,
	isMacOSWebRichLinkCopyShortcut,
	isMacOSWebUrlCopyShortcut,
	richLinkClipboardContents,
} from './macos-web-link-copy-shortcut'

class ClipboardItemMock {
	readonly data: Record<string, Blob>

	constructor(data: Record<string, Blob>) {
		this.data = data
	}
}

describe('macOS web link copy shortcuts', () => {
	it('accepts Cmd+L without conflicting modifiers', () => {
		expect(
			isMacOSWebUrlCopyShortcut({
				altKey: false,
				ctrlKey: false,
				key: 'l',
				metaKey: true,
				shiftKey: false,
			}),
		).toBe(true)
		expect(
			isMacOSWebUrlCopyShortcut({
				altKey: false,
				ctrlKey: false,
				key: 'l',
				metaKey: true,
				shiftKey: true,
			}),
		).toBe(false)
	})

	it('accepts only Cmd+Shift+L for rich links', () => {
		expect(
			isMacOSWebRichLinkCopyShortcut({
				altKey: false,
				ctrlKey: false,
				key: 'L',
				metaKey: true,
				shiftKey: true,
			}),
		).toBe(true)
		expect(
			isMacOSWebRichLinkCopyShortcut({
				altKey: false,
				ctrlKey: true,
				key: 'l',
				metaKey: true,
				shiftKey: true,
			}),
		).toBe(false)
	})

	it('copies a plain web URL', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		await expect(
			copyMacOSWebUrl('https://platform.example/apps', {
				clipboard: { write: vi.fn(), writeText },
			}),
		).resolves.toEqual({
			kind: 'url',
			url: 'https://platform.example/apps',
		})
		expect(writeText).toHaveBeenCalledWith('https://platform.example/apps')
	})

	it('copies HTML and plain text representations for a rich link', async () => {
		const write = vi.fn().mockResolvedValue(undefined)
		const writeText = vi.fn().mockResolvedValue(undefined)
		await expect(
			copyMacOSWebRichLink(
				'https://platform.example/apps?tenant=a&tab=b',
				'Apps <production>',
				{
					clipboard: { write, writeText },
					ClipboardItem: ClipboardItemMock as unknown as typeof ClipboardItem,
				},
			),
		).resolves.toEqual({
			kind: 'rich-link',
			title: 'Apps <production>',
			url: 'https://platform.example/apps?tenant=a&tab=b',
		})

		const [items] = write.mock.calls[0]
		const [item] = items as ClipboardItemMock[]
		expect(Object.keys(item.data).sort()).toEqual(['text/html', 'text/plain'])
		expect(writeText).not.toHaveBeenCalled()
	})

	it('falls back to the plain URL when rich clipboard writing fails', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		const result = await copyMacOSWebRichLink(
			'https://platform.example/storage',
			'Storage',
			{
				clipboard: {
					write: vi.fn().mockRejectedValue(new Error('not supported')),
					writeText,
				},
				ClipboardItem: ClipboardItemMock as unknown as typeof ClipboardItem,
			},
		)

		expect(result.kind).toBe('url-fallback')
		expect(writeText).toHaveBeenCalledWith('https://platform.example/storage')
	})

	it('escapes the rich link HTML', () => {
		expect(
			richLinkClipboardContents(
				'https://platform.example/apps?tenant=a&tab=b',
				'Apps <production>',
			),
		).toEqual({
			plainText: 'https://platform.example/apps?tenant=a&tab=b',
			html: '<a href="https://platform.example/apps?tenant=a&amp;tab=b">Apps &lt;production&gt;</a>',
		})
	})
})
