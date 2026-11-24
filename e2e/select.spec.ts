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
	await page.goto(story('select--default'))
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
	await page.goto(story('select--default'))
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
	await page.goto(story('select--二つ並べる'))

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
	await page.goto(story('select--二つ並べる'))
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

/** 閉じる動きを 3 秒に延ばす。閉じかけの一覧が、確かに画面に残っている間を作る */
async function slowCloseAnimation(page: Page) {
	await page.addStyleTag({
		content: '[data-closed] { animation-duration: 3s !important; }',
	})
}

/** 待たずに数える（役割での検索は、読み上げから外れた物を数えない） */
const countNow = (page: Page, name: string | RegExp) =>
	page.getByRole('option', { name, exact: typeof name === 'string' }).count()

// Field の在庫移動の画面と同じく、選んだらすぐ次の Select を開く。
// 閉じる動きの間は閉じかけの一覧が画面に残るが、読み上げや役割での検索には
// 出てこず、押すこともできないことを確かめる
test('選んですぐ次の Select を開いても、閉じかけの一覧は検索に出ない', async ({
	page,
}) => {
	await page.goto(story('form--select-in-form'))
	await slowCloseAnimation(page)
	const from = page.getByRole('combobox', { name: '移動元' })
	const to = page.getByRole('combobox', { name: '移動先' })

	await from.click()
	await page.getByRole('option', { name: '倉庫 1', exact: true }).click()
	await to.click()
	await expect(page.getByRole('listbox')).toHaveCount(1)

	// 閉じかけの一覧は、まだ画面（DOM）にある
	expect(await page.locator('[role="listbox"]').count()).toBe(2)
	// それでも、役割での検索では、開いた一覧の項目しか出てこない
	expect(await countNow(page, '移動先倉庫 1')).toBe(1)
	await page.getByRole('option', { name: '移動先倉庫 1' }).click()

	await expect(from).toHaveText('倉庫 1')
	await expect(to).toHaveText('移動先倉庫 1')
	await expect(page.getByTestId('values')).toHaveText(
		'移動元: warehouse / 移動先: destination',
	)
})

test('閉じる動きの終わりが伝わらなくても、閉じてから 1 秒ほどで一覧を外す', async ({
	page,
}) => {
	await page.goto(story('form--select-in-form'))
	await slowCloseAnimation(page)
	const from = page.getByRole('combobox', { name: '移動元' })

	await from.click()
	await page.getByRole('option', { name: '店舗拠点 1' }).click()
	// 閉じる動き（3 秒）が終わる前に、逃げ道で外れる
	await expect(page.locator('[role="listbox"]')).toHaveCount(0, {
		timeout: 2000,
	})
	await expect(from).toHaveText('店舗拠点 1')
})

test('FormControl の中で react-hook-form が値を持つ Select も、閉じた一覧が残らない', async ({
	page,
}) => {
	await page.goto(story('form--select-in-form'))
	const from = page.getByRole('combobox', { name: '移動元' })
	const to = page.getByRole('combobox', { name: '移動先' })

	await from.click()
	await page.getByRole('option', { name: '倉庫 1', exact: true }).click()
	await expectNoList(page)
	await to.click()
	await page.getByRole('option', { name: '移動先倉庫 1' }).click()
	await expectNoList(page)
	await expect(page.getByTestId('values')).toHaveText(
		'移動元: warehouse / 移動先: destination',
	)

	// もう一度開いても、一覧はひとつだけで、選んだ項目に印が付く
	await from.click()
	await expect(page.getByRole('listbox')).toHaveCount(1)
	await expect(
		page.getByRole('option', { name: '倉庫 1', exact: true }),
	).toHaveAttribute('aria-selected', 'true')
	await page.keyboard.press('Escape')
	await expectNoList(page)
})

test('閉じたまま頭の文字を打つと、一覧を開かずに合う項目を選ぶ', async ({
	page,
}) => {
	await page.goto(story('select--default'))
	const trigger = page.getByRole('combobox')
	await trigger.focus()

	await page.keyboard.press('d')
	await expect(trigger).toHaveText('Done')
	await expect(page.getByRole('listbox')).toHaveCount(0)

	// 1 秒たつと、打った文字を忘れて新しく探す
	await page.waitForTimeout(1100)
	await page.keyboard.type('in')
	await expect(trigger).toHaveText('In progress')
	await expect(page.getByRole('listbox')).toHaveCount(0)

	// 開くと、選んだ項目に印が付いている
	await page.keyboard.press('Enter')
	await expect(
		page.getByRole('option', { name: 'In progress' }),
	).toHaveAttribute('aria-selected', 'true')
})
