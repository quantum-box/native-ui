import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../basics/button'
import { Field, FieldActions, FieldGroup, InlineField } from './field'
import { Input } from './input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './select'
import { Textarea } from './textarea'

/**
 * 欄（Field）と、欄を横に並べる箱（FieldGroup）。
 *
 * 同じ行の欄は、ラベルの長さ・説明の有る無し・エラーの有る無しが違っても、入力欄の
 * 上端がそろう。入力欄は欄の箱より広がらず、箱の外へはみ出さない。
 */
const meta = {
	title: '入力/Field',
	id: 'field',
	component: Field,
	args: { label: '名前', children: <Input /> },
} satisfies Meta<typeof Field>

export default meta
type Story = StoryObj<typeof meta>

export const ひとつ: Story = {
	render: () => (
		<div className='w-72'>
			<Field label='名前' description='お客様に見せる名前です。' required>
				<Input placeholder='山田 太郎' />
			</Field>
		</div>
	),
}

const units = (
	<Select defaultValue='g'>
		<SelectTrigger aria-label='単位' className='w-16 shrink-0'>
			<SelectValue />
		</SelectTrigger>
		<SelectContent>
			<SelectItem value='g'>g</SelectItem>
			<SelectItem value='ml'>ml</SelectItem>
			<SelectItem value='個'>個</SelectItem>
		</SelectContent>
	</Select>
)

/** 説明の有る欄・無い欄・長いラベル・エラーが同じ行に並んでも、入力欄の上端がそろう。 */
export const 横に並べる: Story = {
	render: () => (
		<form className='max-w-4xl rounded-md border border-border p-4'>
			<FieldGroup className='sm:grid-cols-2 lg:grid-cols-5'>
				<Field className='sm:col-span-2' label='商品名' required>
					<Input defaultValue='有機トマト' />
				</Field>
				<Field label='内容量' required>
					<div className='flex gap-2'>
						<Input aria-label='内容量' defaultValue='500' inputMode='decimal' />
						{units}
					</div>
				</Field>
				<Field description='1パックに何個入りか' label='入数'>
					<Input inputMode='numeric' />
				</Field>
				<Field error='13 桁の数字で入れてください。' label='JANコード'>
					<Input defaultValue='4901' inputMode='numeric' />
				</Field>
				<Field label='とても長い名前の欄で、狭い幅ではラベルが折り返す'>
					<Input />
				</Field>
				<Field label='メモ'>
					<Textarea minRows={2} />
				</Field>
			</FieldGroup>
			<div className='mt-4 flex justify-end'>
				<Button type='submit'>保存</Button>
			</div>
		</form>
	),
}

/** 狭い箱（右の詳細など）に入れても、入力欄もボタンも右へはみ出さない。 */
export const 狭い箱: Story = {
	render: () => (
		<form className='w-72 overflow-hidden rounded-md border border-border p-3'>
			<FieldGroup className='grid-cols-3'>
				<Field label='内容量'>
					<div className='flex gap-2'>
						<Input defaultValue='500' />
						{units}
					</div>
				</Field>
				<Field description='1パックに何個入りか' label='入数'>
					<Input />
				</Field>
				<Field label='JANコード'>
					<Input defaultValue='4901234567890' />
				</Field>
			</FieldGroup>
		</form>
	),
}

/** 「包装規格を追加」のような欄。説明の有る欄・無い欄・エラーが 4 列に混ざる */
function PackageForm({ title }: { title?: string }) {
	return (
		<form
			aria-label={title ?? '包装規格を追加'}
			className='min-w-0 rounded-md border border-border bg-background p-4 text-foreground'
		>
			{title ? (
				<p className='mb-3 text-muted-foreground text-xs'>{title}</p>
			) : null}
			<FieldGroup columns={4}>
				<Field label='商品名' required>
					<Input defaultValue='有機トマト 500g' />
				</Field>
				<Field description='1 箱に入っている数' label='入数'>
					<Input defaultValue='12' inputMode='numeric' />
				</Field>
				<Field label='内容量'>
					<div className='flex min-w-0 gap-2'>
						<Input aria-label='内容量' defaultValue='500' inputMode='decimal' />
						{units}
					</div>
				</Field>
				<Field error='13 桁の数字で入れてください。' label='JAN コード'>
					<Input defaultValue='4901' inputMode='numeric' />
				</Field>
				<Field label='包装の種類（段ボール・袋・パックなど、仕入れ先の呼び方で）'>
					<Input />
				</Field>
				<Field description='空なら商品名と同じ' label='表示名'>
					<Input />
				</Field>
				<FieldActions>
					<Button type='button' variant='ghost'>
						やめる
					</Button>
					<Button type='submit' variant='primary'>
						保存
					</Button>
				</FieldActions>
			</FieldGroup>
		</form>
	)
}

/**
 * 4 列（`columns={4}`）。箱が狭くなると列を減らし、もっと狭ければ 1 列にする。
 * ライトとダーク、右の詳細ほどの狭い箱を並べる。
 */
export const 包装規格を追加: Story = {
	render: () => (
		<div className='grid w-[60rem] max-w-full gap-4'>
			<PackageForm />
			<div className='dark rounded-md bg-background p-3'>
				<PackageForm title='ダーク' />
			</div>
			<div className='w-[22rem]' data-testid='sheet-width'>
				<PackageForm title='右の詳細ほどの幅（22rem）' />
			</div>
		</div>
	),
}

/**
 * 絞り込みの行のように、欄の右にボタンを下ぞろえで並べる。説明もエラーも無い欄は
 * 入力欄の下に空きを作らないので、入力欄とボタンの下端がそろう。
 */
export const ボタンと並べる: Story = {
	render: () => (
		<form className='flex max-w-xl flex-wrap items-end gap-3 rounded-md border border-border p-3'>
			<Field className='w-40' label='開始日'>
				<Input type='date' />
			</Field>
			<Field className='w-40' label='終了日'>
				<Input type='date' />
			</Field>
			<Button type='submit'>表示</Button>
		</form>
	),
}

/**
 * 横 1 行の欄（InlineField）。名前を左、入力欄を右に置く。絞り込みの帯や、表の行の中の
 * 小さい欄に使う。単位は `suffix`、名前の列の幅をそろえるときは `labelWidth`。
 */
export const 横1行の欄: Story = {
	render: () => (
		<div className='grid max-w-xl gap-4'>
			<form className='flex flex-wrap items-center gap-4 rounded-md border border-border p-3'>
				<InlineField label='対象月'>
					<Input className='w-40' type='month' />
				</InlineField>
				<InlineField label='写真' suffix='枚'>
					<Input className='w-20' defaultValue={3} type='number' />
				</InlineField>
				<InlineField dense label='販売数' suffix='件'>
					<Input className='h-7 w-16 text-right' inputMode='numeric' />
				</InlineField>
			</form>
			<form className='grid gap-2 rounded-md border border-border p-3'>
				<InlineField label='日付の列' labelWidth='12rem'>
					<Input defaultValue='取引日' />
				</InlineField>
				<InlineField label='金額の列（とても長い名前）' labelWidth='12rem'>
					<Input defaultValue='金額' />
				</InlineField>
			</form>
			<form className='w-40 overflow-hidden rounded-md border border-border p-2'>
				<InlineField label='店舗・レジ'>
					<Input className='min-w-0 flex-1' defaultValue='本店 / 1 番レジ' />
				</InlineField>
			</form>
		</div>
	),
}
