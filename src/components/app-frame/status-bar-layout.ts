export type StatusBarSide = 'left' | 'right'

/** Where one status bar item sits and whether the viewer shows it. */
export type StatusBarLayoutItem = {
	id: string
	visible: boolean
	side: StatusBarSide
}

/**
 * Read a saved layout. Unknown or malformed entries are dropped, items the
 * defaults add later are appended, and required items are always shown.
 */
export function parseStatusBarLayout(
	raw: string | null,
	defaults: readonly StatusBarLayoutItem[],
	requiredIds: readonly string[] = [],
): StatusBarLayoutItem[] {
	try {
		const parsed: unknown = JSON.parse(raw ?? 'null')
		if (!Array.isArray(parsed)) return [...defaults]
		const ids = new Set<string>()
		const items: StatusBarLayoutItem[] = []
		for (const item of parsed) {
			if (
				!item ||
				typeof item.id !== 'string' ||
				typeof item.visible !== 'boolean' ||
				(item.side !== 'left' && item.side !== 'right') ||
				ids.has(item.id)
			)
				continue
			ids.add(item.id)
			items.push({
				id: item.id,
				visible: requiredIds.indexOf(item.id) !== -1 || item.visible,
				side: item.side,
			})
		}
		return [...items, ...defaults.filter(item => !ids.has(item.id))]
	} catch {
		return [...defaults]
	}
}

/** Move an item before or after another; it takes the target's side. */
export function reorderStatusBarLayout(
	items: StatusBarLayoutItem[],
	id: string,
	targetId: string,
	after: boolean,
): StatusBarLayoutItem[] {
	const item = items.find(item => item.id === id)
	const target = items.find(item => item.id === targetId)
	if (!item || !target || id === targetId) return items
	const next = items.filter(item => item.id !== id)
	const targetIndex = next.findIndex(item => item.id === targetId)
	next.splice(targetIndex + Number(after), 0, { ...item, side: target.side })
	return next
}
