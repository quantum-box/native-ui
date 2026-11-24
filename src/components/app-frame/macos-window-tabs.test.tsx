import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { MacOSWindowTabs } from './macos-window-tabs'

describe('MacOSWindowTabs', () => {
	it('renders an accessible titlebar tab list', () => {
		const markup = renderToStaticMarkup(
			<MacOSWindowTabs
				tabs={[
					{ id: 'apps', title: 'Apps' },
					{ id: 'storage', title: 'Storage', closable: false },
				]}
				activeTabId='apps'
				onTabSelect={vi.fn()}
				onTabClose={vi.fn()}
				onNewTab={vi.fn()}
			/>,
		)

		expect(markup).toContain('data-tauri-drag-region="true"')
		expect(markup).toContain('role="tablist"')
		expect(markup).toContain('aria-selected="true"')
		expect(markup).toContain('aria-label="Close Apps"')
		expect(markup).not.toContain('aria-label="Close Storage"')
		expect(markup).toContain('aria-label="New tab"')
	})
})
