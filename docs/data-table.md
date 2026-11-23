# 一覧の表（DataTable）

API でページを送る一覧の表と、表の中で使う部品。Storybook の `Components/DataTable` に例がある。

| 部品 | 役目 |
| --- | --- |
| `DataTable` | 一覧の表。列の定義と今のページの行を受け取り、ページ送りを出す |
| `DataTableColumnHeader` | 列の見出し。押すと並び替え・絞り込み・左に固定のメニューが開く |
| `DataTableSelectCell` | 表の中でその場で値を選んで保存するセル |
| `DataTableValueChip` | 表の中で値を小さな札として出す |
| `DataTableViewNotice` | 一覧の上の案内。並び替え・絞り込みが効いているときに「すべて解除」を出す |
| `DataTableTextCell` ほか | 表の中で文字・数・日付・オン・オフ・複数をその場で直す（下の「その場で値を直すセル」） |

どの部品も、アプリの仕組み（URL・API・テナントなど）には触らない。
今の並び替え・絞り込み・ページは使う側が渡し、変わったら関数で知らせる。
URL に残すか、端末に覚えさせるかは使う側が決める。

## DataTable

`@tanstack/react-table` の `ColumnDef` をそのまま渡す（native-ui の依存に入っているので、使う側も同じ版 8.21.3 を使う）。

```tsx
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@tachyon-sdk/native-ui'

const columns: ColumnDef<Product>[] = [
  { accessorKey: 'name', header: '商品名' },
  {
    accessorKey: 'price',
    header: '価格',
    cell: ({ row }) => yen(row.original.price),
    meta: { headerClassName: 'text-right', cellClassName: 'text-right tabular-nums' },
  },
]

<DataTable
  columns={columns}
  items={data.items}
  total={data.total}
  page={page}
  pageSize={pageSize}
  onPageChange={setPage}
  busy={loading}
  emptyMessage='商品はまだありません。'
/>
```

- `page` は 1 から数える。ページ数は `total` と `pageSize` から出す。
- `busy` の間はページ送りを止め、行が無ければ `loadingMessage`（既定「読み込んでいます…」）を出す。
- `hidePagination` でページ送りを隠す（全件を 1 ページで出す表など）。
- 列ごとの見た目は `meta.cellClassName`・`meta.headerClassName` で変える。この 2 つの型は native-ui が `ColumnMeta` に足しているので、使う側で `declare module` を書かなくてよい。
- `columns` は `useMemo` などで作り直さないようにする。作り直すとセルが作り直され、`DataTableSelectCell` の保存中の状態や失敗の文言が消える。

## 列の見出し（DataTableColumnHeader）

`sort`・`filter`・`pin` はそれぞれ省ける。省いた操作はメニューに出ない。
絞り込みの項目は `text`・`number`・`date`・`select` が使える。業務の決まりで確かめたいときは `validate` を渡す。
選択肢を開いたときに読み込みたいときは `onOpenChange` を使う。

メニューを開くと今の条件を書きかけとして写し、閉じると（Esc を含む）書きかけは捨てる。
「適用」で確かめてから、その見出しの項目だけを `onApply` に渡す。

```tsx
<TableHead className='p-0' aria-sort={ariaSort}>
  <DataTableColumnHeader
    label='商品名'
    sort={{ direction, onChange: setDirection }}
    filter={{
      active: Boolean(nameFilter),
      values: { name: nameFilter },
      fields: [{ key: 'name', label: '商品名に含む文字' }],
      onApply: values => setNameFilter(values.name),
      onClear: () => setNameFilter(''),
    }}
    pin={{ pinned, onChange: setPinned }}
  />
</TableHead>
```

`DataTable` の列で使うときは、`header` にこの部品を返し、`meta.headerClassName: 'p-0'` で見出しいっぱいを押せるようにする。

- ページを 1 に戻す・URL に書く・API を呼ぶ・設定を覚えるのは使う側。
- サーバーでページを分ける一覧では、並び替えと絞り込みは API に渡して全件に対して行う（読み込んだページだけで並べない）。
- `aria-sort` は見出しのセル（`<th>`）に付ける。
- 「左に固定」は知らせるだけ。固定の class（`sticky left-0 z-10` と背景）を見出しとセルの**両方**に付ける。見出しの背景は `bg-background bg-gradient-to-r from-muted/50 to-muted/50` にすると、ほかの見出しと同じ色で下の列を隠せる。

## 表の中で値を選ぶ（DataTableSelectCell）

```tsx
<TableCell className='p-0'>
  <DataTableSelectCell
    key={product.id}
    label='公開状態'
    ariaLabel={`${product.name}の公開状態を変更`}
    value={product.visibility}
    options={[
      { value: 'draft', label: '下書き' },
      { value: 'published', label: '公開中' },
    ]}
    disabled={!canEdit}
    onSave={async visibility => {
      const saved = await updateProduct(product.id, { visibility })
      replaceProduct(saved)
    }}
    formatError={() => '公開状態を保存できませんでした。'}
  />
</TableCell>
```

- `value` は使う側が持つ。`onSave` が終わる前に新しい値を反映し、失敗したら例外を投げる。
- セルは検索・先に新しい値を見せる・保存中は操作させない・保存できた印・失敗したら元に戻す、を受け持つ。
- 行には変わらない `key` を付ける（テナントが変わったら一覧ごと作り直す）。
- 選択肢の `value` は変わらない ID、`label` は人が読む名前。`keywords` で検索の言葉を足せる。
- `renderValue` で今の値と選択肢の見た目を変えられる。知らない値は ID のまま出す。
- 選択肢が無いときは値だけを出し、`emptyOptionsAction`（設定への案内など）を添える。`disabled` のときは案内も出さない。

## 並び替え・絞り込みの案内（DataTableViewNotice）

```tsx
<DataTableViewNotice active={hasSortOrFilter} onClear={clearAll} />
```

一覧の上に置く。どれかが効いているときだけ「並び替え・絞り込みを適用中」と「すべて解除」を出す。

## その場で値を直すセル

どのセルも「表示 → 編集 → 保存中 → 保存できた／失敗」の同じ流れの上にある。Storybook の `Components/DataTableInlineEdit` に、種類ごとの状態と、1 つの表でいろいろな列を直す例がある。

| 部品 | 値 | 例 |
| --- | --- | --- |
| `DataTableTextCell` | 1 行の文字（`string`） | 品目名、メモ |
| `DataTableNumberCell` | 数・金額（`number \| null`） | 単価、数量、与信限度 |
| `DataTableDateCell` | 日付（`YYYY-MM-DD` の文字、空は `''`） | 納期、支払日 |
| `DataTableToggleCell` | オン・オフ（`boolean`） | 公開、使う／使わない |
| `DataTableSelectCell` | 1 つを選ぶ（`string`） | ステージ、状態 |
| `DataTableMultiSelectCell` | 複数を選ぶ（`readonly string[]`） | タグ |

### 共通の振る舞い

- 押すか Enter で編集を始め、Enter で保存、Esc でやめる。Enter・Esc で終えたらセルにフォーカスが戻る。
- 文字・数・日付は、Tab やクリックでほかへ移っても保存する（フォーカスは移った先のまま）。編集を始めると今の文字が選ばれ、打つと置き換わる。
- 保存中は操作できない。保存できたら印が出る。失敗したら元の値に戻し、`formatError` の文言を出す。
- 引数は共通で `value`・`onSave`（Promise を返す）・`validate`（保存の前に確かめ、だめなら文言を返す）・`formatError`・`disabled`・`ariaLabel`。
- `onSave` の中で保存し、終わる前に使う側の値を新しい値にする。失敗したら例外を投げる。
- オン・オフは編集の段階が無く、切り替えるとすぐ保存する。
- 複数を選ぶセルは、候補の中で Enter・クリックで付け外しし、「保存」か外を押すと保存、Esc か「やめる」でやめる。

```tsx
<DataTableNumberCell
  ariaLabel={`${line.name}の単価を変更`}
  prefix='¥'
  min={0}
  value={line.price}
  onSave={async price => {
    const saved = await updateLine(line.id, { price })
    replaceLine(saved)
  }}
  formatError={() => '単価を保存できませんでした。'}
/>
```

### 数・金額

- `prefix`（`¥`、`$`）・`suffix`（`円`、`個`、`%`）を付けて桁区切りで右に寄せて出す。
- 全角の数字、「1,200」、「¥1,200円」も受け付ける。`fractionDigits`（小数の桁、既定 0）・`min`・`max`・`allowEmpty` で確かめる。
- 同じ読み取り・表示を `parseDataTableNumber`・`formatDataTableNumber` として単独でも使える。

### 行をまとめて後で保存する画面

表の中で直した値を、行や画面の「保存」でまとめて送る画面でも使える。`onSave` で手元の下書きを書き換えて、そのまま終える（`async value => setDraft(...)`）。

### 自分でセルを作る

ほかの種類が要るときは、`DataTableEditableCell`（押すと編集に変わるセル）に `renderValue`・`renderEditor` を渡す。1 行の入力欄なら `DataTableInputEditor` に `parse` を渡すだけでよい。保存の流れだけが要るときは `useDataTableInlineEdit` を使う。

```tsx
<DataTableEditableCell
  ariaLabel='時刻を変更'
  value={time}
  onSave={saveTime}
  renderValue={value => value || '未設定'}
  renderEditor={edit => (
    <DataTableInputEditor
      edit={edit}
      type='time'
      aria-label='時刻を変更'
      initialText={edit.value}
      parse={text => ({ value: text })}
    />
  )}
/>
```
