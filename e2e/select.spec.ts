import { type Page, expect, test } from '@playwright/test'

// Select の一覧が、閉じたあと画面にも読み上げにも残らないことを確かめる。
// base-ui は一度開いた一覧を、閉じたあとも見えない形で DOM に残す。
// そのままだと、画面の検査や読み上げが「閉じた一覧」まで拾ってしまう。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

/** 閉じる動きが終わるまで待ってから、残った一覧と項目の要素を数える */
async function expectNoList(page: Page) {
	await expect(page.locator('[role="listbox"]')).toHaveCount(0)
	await expect(page.locator('[role="option"]')).toHaveCount(0)
	await expect(page.locator('[id^="base-ui-"][id$="-list"]')).toHaveCount(0)
}

test('選んで閉じたあと、一覧と項目の要素が DOM に残らない', async ({ page }) => {
	await page.goto(story('入力-select--default'))
	const trigger = page.getByRole('combobox')

	await trigger.click()
	await expect(page.getByRole('listbox')).toBeVisible()
	await page.getByRole('option', { name: 'Todo' }).click()

	await expectNoList(page)
	await expect(trigger).toHaveText('Todo')
})

test('もう一度開くと、一覧はひとつだけで、選んだ項目に印が付く', async ({
	page,
}) => {
	await page.goto(story('入力-select--default'))
	const trigger = page.getByRole('combobox')

	await trigger.click()
	await page.getByRole('option', { name: 'Done' }).click()
	await expectNoList(page)

	await trigger.click()
	await expect(page.getByRole('listbox')).toHaveCount(1)
	await expect(page.getByRole('option', { name: 'Done' })).toHaveAttribute(
		'aria-selected',
		'true',
	)

	await page.keyboard.press('Escape')
	await expectNoList(page)
	await expect(trigger).toBeFocused()
})

test('二つの Select を続けて開いても、一覧はいつもひとつだけ', async ({
	page,
}) => {
	await page.goto(story('入力-select--二つ並べる'))

	await page.getByRole('combobox', { name: '状態' }).click()
	await page.getByRole('option', { name: '状態: 一つ目' }).click()
	await expectNoList(page)

	await page.getByRole('combobox', { name: '担当' }).click()
	const list = page.getByRole('listbox')
	await expect(list).toHaveCount(1)
	await expect(list).toContainText('担当: 一つ目')
	await expect(list).not.toContainText('状態: 一つ目')

	await page.getByRole('option', { name: '担当: 三つ目' }).click()
	await expectNoList(page)
})

test('選んで閉じたあとの写しは、開く前と同じ（一覧がうっすら残らない）', async ({
	page,
}, testInfo) => {
	await page.goto(story('入力-select--二つ並べる'))
	const below = page.getByTestId('below')
	const trigger = page.getByRole('combobox', { name: '状態' })

	const before = await below.screenshot({
		animations: 'disabled',
		// 写しは e2e/.results に残る（CI では成果物になる）
		path: testInfo.outputPath('select-before-open.png'),
	})

	await trigger.click()
	await expect(page.getByRole('listbox')).toBeVisible()
	const open = await below.screenshot({
		animations: 'disabled',
		path: testInfo.outputPath('select-open.png'),
	})
	// 開いている間は、一覧がこの場所に重なる（写しが変わる）
	expect(open.equals(before)).toBe(false)

	await page.getByRole('option', { name: '状態: 二つ目' }).click()
	await expectNoList(page)
	const after = await below.screenshot({
		animations: 'disabled',
		path: testInfo.outputPath('select-after-close.png'),
	})
	expect(after.equals(before)).toBe(true)
})
