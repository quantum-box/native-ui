/**
 * テストで使う道具（`@tachyon-sdk/native-ui/testing`）。部品の本体（`@tachyon-sdk/native-ui`）
 * とは別に読み込む。
 *
 * findLayoutProblems: 画面の形の崩れを探す。
 * 1. 同じ行に並ぶ欄の、入力欄の上端がそろっていない
 *    （説明のある欄と無い欄が並ぶと、無い欄の入力欄が下がる、など）
 * 2. 入力欄・ボタンが、中身を切る箱やフォーム・ダイアログ・右の詳細の右端からはみ出している
 *
 * 外の物を使わない 1 つの関数にしてあるので（中で使う関数も中に書く）、Playwright の
 * `page.evaluate(findLayoutProblems)` や `locator.evaluate(findLayoutProblems)` に
 * そのまま渡せる。jsdom では大きさが分からないので、本物のブラウザで使う。
 *
 * @example
 * // Playwright
 * import { findLayoutProblems } from '@tachyon-sdk/native-ui/testing'
 * expect(await page.locator('form').evaluate(findLayoutProblems)).toEqual([])
 */
export type LayoutProblem = Readonly<{
	kind: 'misaligned' | 'overflow'
	/** 何がずれているかを人が読める形で。 */
	detail: string
}>

export function findLayoutProblems(
	root: Element = document.body,
): LayoutProblem[] {
	const TOLERANCE = 1
	const CONTROL =
		'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([aria-hidden="true"]),select,textarea,[role="combobox"]'
	const BUTTON = 'button,a[role="button"]'
	// 一覧の表・浮かぶ枠（候補の一覧・メニュー）・見えない物の中は、見ない。
	const SKIP =
		'table,[role="listbox"],[role="menu"],[role="tooltip"],[data-radix-popper-content-wrapper],[data-base-ui-positioner],[data-slot="popover-content"],[aria-hidden="true"],.sr-only'
	const problems: LayoutProblem[] = []

	const visible = (element: Element) => {
		const rect = element.getBoundingClientRect()
		if (rect.width < 1 || rect.height < 1) return false
		const style = getComputedStyle(element)
		return style.visibility !== 'hidden' && style.display !== 'none'
	}
	const describe = (element: Element) => {
		const label =
			element.getAttribute('aria-label') ??
			(element.id
				? element.ownerDocument.querySelector(
						`label[for="${CSS.escape(element.id)}"]`,
					)?.textContent
				: null) ??
			element.getAttribute('placeholder') ??
			element.textContent ??
			''
		return `${element.tagName.toLowerCase()}「${label.trim().slice(0, 30)}」`
	}
	const controls = Array.from(root.querySelectorAll(CONTROL)).filter(
		element => visible(element) && !element.closest(SKIP),
	)

	// 1. 同じ行の欄の入力欄の上端。
	// 欄の箱 = native-ui の欄（data-slot="field"、中の最初の入力欄で比べる）か、
	// 入力欄を 1 つだけ持ち、ラベルもある、親の grid の直下の子。
	// 同じ親の、上端が同じ箱どうしを「同じ行」とみなす。
	type Item = { box: Element; control: Element }
	const boxes = new Map<Element, Item[]>()
	const seen = new Set<Element>()
	for (const control of controls) {
		let box: Element | null = control
		while (box?.parentElement && box.parentElement !== root.parentElement) {
			const parent: Element = box.parentElement
			const display = getComputedStyle(parent).display
			if (display === 'grid' || display === 'inline-grid') {
				const inside = Array.from(box.querySelectorAll(CONTROL)).filter(
					element => visible(element) && !element.closest(SKIP),
				)
				const hasLabel =
					box.querySelector('label') !== null || box.tagName === 'LABEL'
				const isField = box.getAttribute('data-slot') === 'field'
				if (box !== control && hasLabel && (isField || inside.length === 1)) {
					const siblings = Array.from(parent.children).filter(child =>
						child.querySelector(CONTROL),
					)
					// 同じ欄の 2 つ目の入力欄（量と単位など）は、最初の物で数える
					if (siblings.length >= 2 && !seen.has(box)) {
						seen.add(box)
						const list = boxes.get(parent) ?? []
						list.push({ box, control: inside[0] ?? control })
						boxes.set(parent, list)
					}
					break
				}
			}
			box = parent
		}
	}
	for (const list of boxes.values()) {
		const rows = new Map<number, Item[]>()
		for (const item of list) {
			const top = Math.round(item.box.getBoundingClientRect().top)
			const key =
				[...rows.keys()].find(other => Math.abs(other - top) <= TOLERANCE) ??
				top
			rows.set(key, [...(rows.get(key) ?? []), item])
		}
		for (const row of rows.values()) {
			if (row.length < 2) continue
			const tops = row.map(item => item.control.getBoundingClientRect().top)
			const spread = Math.max(...tops) - Math.min(...tops)
			if (spread > TOLERANCE)
				problems.push({
					detail: `同じ行の入力欄の上端が ${Math.round(spread)}px ずれている: ${row
						.map(item => describe(item.control))
						.join(' / ')}`,
					kind: 'misaligned',
				})
		}
	}

	// 2. はみ出し。入力欄とボタンが、中身を切る箱・フォーム・ダイアログ・右の詳細・
	// 調べている箱（root）の右端を超える。
	const targets = [
		...controls,
		...Array.from(root.querySelectorAll(BUTTON)).filter(
			element => visible(element) && !element.closest(SKIP),
		),
	]
	for (const target of targets) {
		const right = target.getBoundingClientRect().right
		let parent = target.parentElement
		while (parent && parent !== root.parentElement) {
			const style = getComputedStyle(parent)
			// 横に動かせる箱（表の横スクロールなど）の中は、はみ出してよい。
			if (style.overflowX === 'auto' || style.overflowX === 'scroll') break
			const clips =
				parent === root ||
				style.overflowX === 'hidden' ||
				style.overflowX === 'clip' ||
				parent.tagName === 'FORM' ||
				parent.getAttribute('role') === 'dialog'
			if (clips && visible(parent)) {
				const edge = parent.getBoundingClientRect().right
				if (right > edge + TOLERANCE) {
					problems.push({
						detail: `${describe(target)} が ${parent.tagName.toLowerCase()}${
							parent.getAttribute('role')
								? `[role=${parent.getAttribute('role')}]`
								: ''
						} の右端から ${Math.round(right - edge)}px はみ出している`,
						kind: 'overflow',
					})
					break
				}
				// この箱には収まっていても、外の箱（より狭く中身を切る箱など）からは
				// はみ出しているかもしれないので、さらに外を見る
			}
			parent = parent.parentElement
		}
	}
	return problems
}
