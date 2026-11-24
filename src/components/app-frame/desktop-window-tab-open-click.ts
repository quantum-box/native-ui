export interface DesktopWindowTabOpenClickEvent {
	button: number
	metaKey: boolean
	ctrlKey: boolean
	altKey?: boolean
}

/**
 * Returns true when a primary-button click requests a new desktop window tab.
 *
 * Consumers keep Tauri/WebView creation in their native shell and use this
 * helper from navigation controls before performing normal in-tab routing.
 * macOS sends Meta (Command), while Windows and Linux send Control.
 */
export function isDesktopWindowTabOpenClick(
	event: DesktopWindowTabOpenClickEvent,
) {
	return event.button === 0 && !event.altKey && (event.metaKey || event.ctrlKey)
}
