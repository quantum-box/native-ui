import { type Locator, type Page, expect, test } from '@playwright/test'

// 長い文の欄（Textarea）と、欄に物を付ける囲み（InputGroup）を、本物のブラウザで
// 動かす。高さの伸び縮み・上限でのスクロール・囲みの輪は、jsdom では分からない。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

const height = (locator: Locator) =>
	locator.evaluate(el => el.getBoundingClientRect().height)
const lineHeight = (locator: Locator) =>
	locator.evaluate(el => Number.parseFloat(getComputedStyle(el).lineHeight))

async function typeLines(page: Page, count: number) {
	for (let i = 1; i <= count; i++) {
		await page.keyboard.type(`${i} 行目`)
		if (i < count) await page.keyboard.press('Shift+Enter')
	}
}

test('Textarea は中身に合わせて伸び、最大の行数を超えると欄の中でスクロールする', async ({
	page,
}) => {
	await page.goto(story('textarea--外で値を持つ'))
	const textarea = page.getByRole('textbox', { name: '返信' })
	const line = await lineHeight(textarea)

	// minRows=2: 空でも 2 行ぶんの高さ
	const empty = await height(textarea)
	expect(empty).toBeGreaterThanOrEqual(line * 2)
	expect(empty).toBeLessThan(line * 3)

	// 3 行書くと伸びる
	await textarea.click()
	await typeLines(page, 3)
	const three = await height(textarea)
	expect(three).toBeGreaterThan(empty + line * 0.5)
	expect(
		await textarea.evaluate(el => getComputedStyle(el).overflowY),
	).toBe('hidden')

	// maxRows=4: 8 行書いても 4 行ぶんで止まり、欄の中でスクロールする
	await page.keyboard.press('Shift+Enter')
	await typeLines(page, 5)
	const many = await height(textarea)
	expect(many).toBeLessThan(line * 5)
	expect(
		await textarea.evaluate(el => getComputedStyle(el).overflowY),
	).toBe('auto')
	expect(
		await textarea.evaluate(el => el.scrollHeight > el.clientHeight),
	).toBe(true)

	// 消すと縮む
	await page.keyboard.press('ControlOrMeta+a')
	await page.keyboard.press('Backspace')
	await expect.poll(() => height(textarea)).toBeLessThan(line * 3)
	await expect(page.getByText('0 / 200')).toBeVisible()
})

test('InputGroup の中の欄にフォーカスすると、囲みに輪が出る。付けた物の余白を押すと欄に移る', async ({
	page,
}) => {
	await page.goto(story('input-group--状態の一覧'))
	const textarea = page.getByRole('textbox', { name: '質問' }).first()
	const group = textarea.locator('xpath=ancestor::*[@data-slot="input-group"][1]')

	const ringOf = () =>
		group.evaluate(el => getComputedStyle(el).boxShadow !== 'none')
	expect(await ringOf()).toBe(false)

	// 下の帯の「⌘Enter で送信」の文字（ボタンではない所）を押すと、欄に移る
	await group.getByText('⌘Enter で送信').click()
	await expect(textarea).toBeFocused()
	expect(await ringOf()).toBe(true)

	// 欄が伸びると、囲みも一緒に伸びる（下の帯は欄の下のまま）
	const before = await height(group)
	await typeLines(page, 4)
	await expect.poll(() => height(group)).toBeGreaterThan(before)
	const addon = group.locator('[data-slot="input-group-addon"]')
	const [textBox, addonBox] = await Promise.all([
		textarea.boundingBox(),
		addon.boundingBox(),
	])
	expect(addonBox?.y ?? 0).toBeGreaterThanOrEqual(
		(textBox?.y ?? 0) + (textBox?.height ?? 0) - 1,
	)
})

test('class で高さの上限（max-h-*）を決めた欄も、そこで止まってスクロールする', async ({
	page,
}) => {
	await page.goto(story('input-group--送る欄'))
	const textarea = page.getByRole('textbox', { name: '質問' })
	const submit = page.getByRole('button', { name: '質問する' })
	await expect(submit).toBeDisabled()

	await textarea.click()
	await typeLines(page, 15)
	await expect(submit).toBeEnabled()
	// max-h-40 = 160px
	expect(await height(textarea)).toBeLessThanOrEqual(160.5)
	expect(
		await textarea.evaluate(el => el.scrollHeight > el.clientHeight),
	).toBe(true)
	expect(
		await textarea.evaluate(el => getComputedStyle(el).overflowY),
	).toBe('auto')

	// ⌘Enter で送ると、欄が空になり、高さが戻る
	await page.keyboard.press('Meta+Enter')
	await expect(textarea).toHaveValue('')
	await expect.poll(() => height(textarea)).toBeLessThan(100)
})

test('囲みの中の長い文の欄も、rows を渡すとそれが最小の行数になる', async ({
	page,
}) => {
	await page.goto(story('input-group--行数を決める'))
	const textarea = page.getByRole('textbox', { name: '依頼' })
	const line = await lineHeight(textarea)
	const empty = await height(textarea)
	expect(empty).toBeGreaterThanOrEqual(line * 4)
	expect(empty).toBeLessThan(line * 5)
})
