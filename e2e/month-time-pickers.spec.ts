import { expect, test } from '@playwright/test'

import { findLayoutProblems } from '../src/testing'

// 月・時刻・日時の入力欄を、本物のブラウザで動かして確かめる。
// 見本では「今日」を 2026/11/24 に固定している。

const story = (id: string) =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:light`

test('月: 開くと選んだ月にフォーカスがあり、矢印と Enter で選ぶと閉じて、開くボタンへ戻る', async ({
	page,
}) => {
	await page.goto(story('month-picker--default'))
	const input = page.getByRole('textbox', { name: '対象月' })
	const open = page.getByRole('button', { name: '月の一覧を開く' })
	await expect(input).toHaveValue('2026/10')

	await open.click()
	await expect(page.getByRole('grid', { name: '2026年' })).toBeVisible()
	await expect(page.locator('[data-month="2026-10"]')).toBeFocused()
	await page.keyboard.press('ArrowRight')
	await page.keyboard.press('ArrowRight')
	await page.keyboard.press('ArrowRight')
	await expect(page.getByRole('grid', { name: '2027年' })).toBeVisible()
	await expect(page.locator('[data-month="2027-01"]')).toBeFocused()
	await page.keyboard.press('Enter')

	await expect(page.locator('[data-slot="month-grid"]')).toHaveCount(0)
	await expect(input).toHaveValue('2027/01')
	await expect(page.getByText('値: 2027-01')).toBeVisible()
	await expect(open).toBeFocused()
})

test('月: 手で打って Tab で離れると月に直る。Esc で閉じると値は変わらない', async ({
	page,
}) => {
	await page.goto(story('month-picker--default'))
	const input = page.getByRole('textbox', { name: '対象月' })
	await input.fill('2026年3月')
	await page.keyboard.press('Tab')
	await expect(input).toHaveValue('2026/03')

	await page.getByRole('button', { name: '月の一覧を開く' }).click()
	await page.keyboard.press('ArrowRight')
	await page.keyboard.press('Escape')
	await expect(page.locator('[data-slot="month-grid"]')).toHaveCount(0)
	await expect(input).toHaveValue('2026/03')
})

test('月: 選べない月は押しても選ばれない', async ({ page }) => {
	await page.goto(story('month-picker--選べない月'))
	const input = page.getByRole('textbox', { name: '締める月' })
	await expect(page.locator('[data-slot="month-grid"]')).toBeVisible()
	// （Playwright は aria-disabled の物を「押せるまで待つ」ので、force で押す）
	await page.locator('[data-month="2026-08"]').click({ force: true })
	await page.locator('[data-month="2026-12"]').click({ force: true })
	await expect(input).toHaveValue('2026/10')
	await expect(page.getByRole('button', { name: '前の年' })).toBeDisabled()
	await expect(page.getByRole('button', { name: '次の年' })).toBeDisabled()
	await page.locator('[data-month="2026-07"]').click()
	await expect(input).toHaveValue('2026/07')
})

test('月: 開始月と終了月は、逆の順には選べない', async ({ page }) => {
	await page.goto(story('month-picker--開始月と終了月'))
	const to = page.getByLabel('終了月')
	await to.fill('2026/3')
	await page.keyboard.press('Tab')
	await expect(to).toHaveValue('2026/09')
	await to.fill('2026/4')
	await page.keyboard.press('Tab')
	await expect(to).toHaveValue('2026/04')
	expect(await page.evaluate(findLayoutProblems)).toEqual([])
})

test('時刻: 開くと選んだ時刻が見えてフォーカスがあり、矢印と Enter で選ぶと閉じる', async ({
	page,
}) => {
	await page.goto(story('time-picker--default'))
	const input = page.getByRole('textbox', { name: '開始' })
	const open = page.getByRole('button', { name: '時刻の一覧を開く' })

	await open.click()
	const selected = page.getByRole('option', { name: '09:30' })
	await expect(selected).toBeFocused()
	await expect(selected).toBeInViewport()
	await expect(selected).toHaveAttribute('aria-selected', 'true')
	await page.keyboard.press('ArrowDown')
	await page.keyboard.press('ArrowDown')
	await expect(page.getByRole('option', { name: '10:30' })).toBeFocused()
	await page.keyboard.press('End')
	await expect(page.getByRole('option', { name: '23:30' })).toBeInViewport()
	await page.keyboard.press('Home')
	await expect(page.getByRole('option', { name: '00:00' })).toBeInViewport()
	await page.keyboard.press('PageDown')
	await page.keyboard.press('Enter')

	await expect(page.getByRole('listbox')).toHaveCount(0)
	await expect(input).toHaveValue('01:00')
	await expect(page.getByText('値: 01:00')).toBeVisible()
	await expect(open).toBeFocused()
})

test('時刻: 手で打つと 1 分きざみで入り、読めない文字は元に戻る', async ({
	page,
}) => {
	await page.goto(story('time-picker--default'))
	const input = page.getByRole('textbox', { name: '開始' })
	await input.fill('1747')
	await page.keyboard.press('Tab')
	await expect(input).toHaveValue('17:47')
	await input.fill('ひる')
	await page.keyboard.press('Tab')
	await expect(input).toHaveValue('17:47')
	await input.fill('')
	await page.keyboard.press('Tab')
	await expect(page.getByText('値: （空）')).toBeVisible()
})

test('時刻: 範囲ときざみどおりの一覧が出る', async ({ page }) => {
	await page.goto(story('time-picker--範囲ときざみ'))
	await expect(page.getByRole('option')).toHaveCount(37)
	await expect(page.getByRole('option').first()).toHaveText('09:00')
	await expect(page.getByRole('option').last()).toHaveText('18:00')
	await expect(page.getByRole('option', { name: '10:15' })).toBeFocused()
})

test('日時: 日付をカレンダーで、時刻を一覧で選ぶと、1 つの値になる', async ({
	page,
}) => {
	await page.goto(story('date-time-picker--空'))
	await expect(page.getByText('値: （空）')).toBeVisible()

	await page.getByRole('button', { name: 'カレンダーを開く' }).click()
	await page.locator('[data-date="2026-11-26"]').click()
	await expect(
		page.getByRole('textbox', { name: '受付の日時 日付' }),
	).toHaveValue('2026/11/26')
	// 片方だけのあいだは、値は空のまま
	await expect(page.getByText('値: （空）')).toBeVisible()

	await page.getByRole('button', { name: '時刻の一覧を開く' }).click()
	await page.getByRole('option', { name: '14:00' }).click()
	await expect(page.getByText('値: 2026-11-26T14:00')).toBeVisible()
})

test('日時: はじめの時刻があれば、日付を入れただけで値が決まる', async ({
	page,
}) => {
	await page.goto(story('date-time-picker--はじめの時刻'))
	const date = page.getByRole('textbox', { name: 'レジ締めの日時 日付' })
	await date.fill('11/24')
	await page.keyboard.press('Tab')
	await expect(page.getByText('値: 2026-11-24T18:00')).toBeVisible()
})

test('日時: 範囲の端の日では、時刻の一覧も絞られる', async ({ page }) => {
	await page.goto(story('date-time-picker--範囲'))
	await page.getByRole('button', { name: '時刻の一覧を開く' }).click()
	await expect(page.getByRole('option').first()).toHaveText('10:00')
	await page.keyboard.press('Escape')

	const date = page.getByRole('textbox', {
		name: 'クーポンの有効の終わり 日付',
	})
	await date.fill('11/30')
	await page.keyboard.press('Tab')
	await page.getByRole('button', { name: '時刻の一覧を開く' }).click()
	await expect(page.getByRole('option').last()).toHaveText('18:00')
	await page.keyboard.press('Escape')

	await date.fill('12/1')
	await page.keyboard.press('Tab')
	await expect(date).toHaveValue('2026/11/30')
})

test('日時: 欄の中に並べても、入力欄の上端がそろい、はみ出さない', async ({
	page,
}) => {
	await page.goto(story('date-time-picker--欄の中'))
	await expect(page.getByLabel('受付の日時')).toHaveValue('2026/11/24')
	expect(await page.evaluate(findLayoutProblems)).toEqual([])
})
