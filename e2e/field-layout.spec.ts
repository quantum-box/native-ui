import { expect, test } from '@playwright/test'

import { findLayoutProblems } from '../src/testing'

// 欄を横に並べたときの形の崩れ（同じ行の入力欄の上端のずれ・右へのはみ出し）を、
// 使う側にも出している findLayoutProblems で確かめる（@tachyon-sdk/native-ui/testing）。

const story = (id: string, theme = 'light') =>
	`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:${theme}`

for (const width of [320, 390, 820, 1280]) {
	test(`包装規格を追加: 幅 ${width}px で、上端がそろい、何もはみ出さない`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 1200 })
		await page.goto(story('field--包装規格を追加'))
		const forms = page.locator('form')
		await expect(forms).toHaveCount(3)
		for (const form of await forms.all()) {
			expect(await form.evaluate(findLayoutProblems)).toEqual([])
		}
	})
}

test('包装規格を追加: 広いと 4 列、右の詳細ほどの幅では列を減らす', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 1200 })
	await page.goto(story('field--包装規格を追加'))
	const columns = (index: number) =>
		page
			.locator('[data-slot=field-group]')
			.nth(index)
			.evaluate(
				el => getComputedStyle(el).gridTemplateColumns.split(' ').length,
			)
	expect(await columns(0)).toBe(4)
	expect(await columns(2)).toBeLessThan(4)

	// 保存・やめるは最後の行で、右端にそろう
	const group = page.locator('[data-slot=field-group]').first()
	const save = group.getByRole('button', { name: '保存' })
	const [groupBox, saveBox] = await Promise.all([
		group.boundingBox(),
		save.boundingBox(),
	])
	expect(
		Math.abs(
			(groupBox?.x ?? 0) +
				(groupBox?.width ?? 0) -
				((saveBox?.x ?? 0) + (saveBox?.width ?? 0)),
		),
	).toBeLessThanOrEqual(1)
})

test('包装規格を追加: ダークでも同じ', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 1200 })
	await page.goto(story('field--包装規格を追加', 'dark'))
	expect(
		await page.locator('form').first().evaluate(findLayoutProblems),
	).toEqual([])
})

for (const width of [390, 1280]) {
	test(`FormItem（react-hook-form）を FieldGroup に並べても、上端がそろう（幅 ${width}px）`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 1000 })
		await page.goto(story('form--form-itemを並べる'))
		const form = page.locator('form')
		await expect(form.getByText('13 桁の数字で入れてください。')).toBeVisible()
		if (width >= 1280) {
			// 広いときは 4 つの欄が 1 行に並ぶ（そろっているかを比べる相手がいる）
			const tops = await form
				.locator('[data-slot=field]')
				.evaluateAll(els => els.map(el => Math.round(el.getBoundingClientRect().top)))
			expect(new Set(tops).size).toBe(1)
		}
		expect(await form.evaluate(findLayoutProblems)).toEqual([])
	})
}

test('findLayoutProblems は、ずれとはみ出しを見つける', async ({ page }) => {
	await page.setContent(`
		<form style="width:300px;overflow:hidden">
			<div style="display:grid;grid-template-columns:1fr 1fr">
				<div style="display:grid"><label>A</label><input aria-label="A" style="width:100%"><p>説明</p></div>
				<div style="display:grid"><label>B</label><p>上に何かある</p><input aria-label="B" style="width:100%"></div>
			</div>
			<button style="width:400px">はみ出すボタン</button>
		</form>`)
	const problems = await page.locator('form').evaluate(findLayoutProblems)
	expect(problems.map(problem => problem.kind).sort()).toEqual([
		'misaligned',
		'overflow',
	])
})

test('findLayoutProblems は、内の箱に収まっていても外の狭い箱からのはみ出しを見つける', async ({
	page,
}) => {
	await page.setContent(`
		<div id="root" style="width:300px;overflow:hidden">
			<form style="width:600px">
				<button style="width:600px">外の箱からはみ出すボタン</button>
			</form>
		</div>`)
	const problems = await page.locator('#root').evaluate(findLayoutProblems)
	expect(problems).toHaveLength(1)
	expect(problems[0]?.kind).toBe('overflow')
	expect(problems[0]?.detail).toContain('div の右端から 300px')
})

for (const width of [320, 820, 1280]) {
	test(`横 1 行の欄: 幅 ${width}px で、入力欄が箱の外へはみ出さない`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto(story('field--横1行の欄'))
		const forms = page.locator('form')
		await expect(forms).toHaveCount(4)
		for (const form of await forms.all()) {
			expect(await form.evaluate(findLayoutProblems)).toEqual([])
		}
	})
}

test('横 1 行の欄: 名前を押すと入力欄に移り、名前の列の幅がそろう', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto(story('field--横1行の欄'))
	await page.getByText('対象月').click()
	await expect(page.getByLabel('対象月')).toBeFocused()
	const lefts = await page
		.locator('form')
		.nth(1)
		.locator('input')
		.evaluateAll(inputs =>
			inputs.map(input => Math.round(input.getBoundingClientRect().left)),
		)
	expect(new Set(lefts).size).toBe(1)
	// 箱が狭いと、広い画面でも入力欄が名前の下へ回る
	const narrow = page.locator('form').nth(2)
	const [name, input] = await Promise.all([
		narrow.locator('label').boundingBox(),
		narrow.locator('input').boundingBox(),
	])
	expect(input?.y ?? 0).toBeGreaterThan((name?.y ?? 0) + (name?.height ?? 0) - 1)
})
