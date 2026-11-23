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
| `DataTableRecordCell` ほか | 別の業務の記録（取引先・商品・担当者など）を、種類ごとの決まりどおりに出す（下の「別の業務の記録を出すセル」） |

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

- 編集中はセルそのものが入力欄になる（表計算のように、入力欄の枠や余白は足さず、セルの外周の内側に線を 1 本）。文字の位置・大きさ・揃えは表示のときと同じで、直し始めても高さ・幅・文字の位置が変わらない。数・金額は表示と同じ文字（例「¥1,200」）で始まる。
- 候補が開く種類（選ぶ・複数を選ぶ）も、セルの中は枠なしで、開いている間は外周に線が出る。候補はポップオーバーに出る。
- 保存中の回る印・保存できた ✓・失敗の印は、どの種類でも右端の同じ場所に出す（右揃えの金額の列でも、印は文字の右）。印が無いときも場所は空けておく。
- 失敗したときは、セルの大きさを変えずに知らせる。
  - セルの外周が赤い線になり、右端（保存中の印・✓ と同じ場所）に赤い「!」が出る。
  - 理由はセルに付く吹き出しで出す。失敗した直後は 1 度だけ自分で開き、外を押すか数秒で閉じる。そのあとは、セルに触れる・フォーカスすると開く。
  - 吹き出しには、何が失敗したか（例「公開を『非公開』に切り替えられませんでした」）、理由（`formatError` の文）、元に戻した値（例「『公開』のままです。」）と、「もう一度」（同じ値で保存し直す）・「直す」（失敗した値を入れたまま編集に戻る。オン・オフには無い）を出す。
  - 見出しには各セルの `label`（例「単価」「L-1の単価」）を使う。
  - キーボードでは、失敗したセルで ↓ を押すと吹き出しの「もう一度」へ移る。Esc か吹き出しの端で Tab を押すとセルへ戻る。
  - 読み上げには、失敗・理由・元の値をすぐ伝え（aria-live）、セルの説明としても読む。
  - 確かめで止まったとき（編集中）は、吹き出しに理由だけを出す。
- 表の側で、失敗したセルをまとめて知らせることもできる（任意）。表を `DataTableInlineEditFailuresProvider` で包み、表の上か下に `DataTableInlineEditFailureSummary` を置くと、「3件を保存できませんでした」と、押すとそのセルへ移る一覧を出す。
- 自分でセルを作るときは、`dataTableInlineEditCellClassName`（箱）・`DataTableInlineEditTrigger`（表示のとき）・`DataTableEditingCell`（編集中）・`DataTableInlineEditShell`（失敗の理由）を使うと、ほかのセルとそろう。
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
## 別の業務の記録を出すセル

表のセルに、取引先・商品・店・担当者・請求書など別の業務の記録を出すときは、記録の種類ごとの見た目と動きを `RecordKindProvider` に 1 か所で登録する。どの表に出しても同じ見た目と動きになる。native-ui は種類の名前を知らず、登録された決まりどおりに出すだけ。Storybook の `Components/DataTableRecordCell` に例がある。

| 部品 | 役目 |
| --- | --- |
| `RecordKindProvider` / `defineRecordKind` | 種類ごとの決まりを登録する |
| `RecordChip` | 記録を 1 つ出す（表の外でも使える） |
| `DataTableRecordCell` | 表のセルに記録を 1 つ、または複数出す |
| `dataTableRecordColumn` | 記録を出す列をまとめて作る |
| `DataTableRecordSelectCell` | その場で別の記録に付け替える |
| `HoverCard` | 触れると出る小さな枠（要点に使う） |

### 種類の決まり

```tsx
const customerKind = defineRecordKind<Customer>({
  name: '取引先',
  system: 'crm', // systems のキー
  icon: Building2,
  getId: customer => customer.id,
  getLabel: customer => customer.name,
  getDescription: customer => customer.code,
  getHref: customer => `/customers/${customer.id}`,
  renderPreview: customer => <CustomerSummary customer={customer} />,
  getActions: customer => [
    recordActions.newTab(`/customers/${customer.id}`),
    { label: 'この取引先の請求書を見る', icon: FileText, href: `/invoices?customer=${customer.id}` },
    recordActions.copy(customer.code, 'コードをコピー'),
  ],
  useCandidates: useCustomerOptions, // 付け替えの候補（アプリのフック）
  missingText: '削除された取引先',
})

<RecordKindProvider
  kinds={{ customer: customerKind, product: productKind, member: memberKind }}
  systems={{
    crm: { name: '顧客管理', icon: Building2, tone: 'blue' },
    catalog: { name: '商品管理', icon: Package, tone: 'amber' },
  }}
  currentSystem='catalog' // 今の画面のシステム
  navigate={href => navigate(href)} // アプリの画面の移動の仕組み
>
  <App />
</RecordKindProvider>
```

- `getHref` があれば押すと詳細へ移る。`navigate` を渡すとアプリの方法で移り、⌘・Ctrl を押しながらだとふつうのリンクとして新しいタブで開く。行を押したときの動きとは重ならない。
- システム（商品管理・顧客管理・会計など）の名前・絵・色の印は、`RecordKindProvider` の `systems` に 1 か所で決め、種類の `system` にそのキーを書く。色の印は `blue`・`green`・`amber`・`violet`・`rose`・`teal`・`slate`（トークン `--nui-tone-*`、ライトとダークで別の値）。
- `currentSystem` に今の画面のシステムを渡す。別のシステムの記録の枠は、上にシステムの色の帯（絵・名前・「別のシステムの記録 ↗」）、左に同じ色の線、読むだけの地、同じ色の「{システム}で開く」で出し、別のシステムをのぞいていると分かるようにする。同じシステムの記録はふつうの枠で、開く操作は「{名前}を開く」になる。
- 記録に触れる・キーボードでフォーカスすると、要点の枠が出る。枠の上に種類とシステム、真ん中に `renderPreview`、下に「{システム}で開く」（`getHref` の場所へ移る。文言は `openLabel` で変えられる）と `getActions` の操作が並ぶ。
- キーボードでは記録で ↓ を押すと枠の中の最初の操作（「{システム}で開く」）へ移る。Tab で操作を順に移り、Esc か枠の端で Tab を押すと記録へ戻る。読み上げには「下矢印キーで、要点と開く操作へ移ります」と伝える。
- 消えた・見る権限が無い・読み込めない記録でも枠は出る。「{システム}で開く」は押せない形で出し、横に理由（「見る権限が無いので開けません。」など）を出す。
- `getActions` には `recordActions.newTab(href)`（新しいタブで開く）・`recordActions.copy(text, label)`（コピー。押すと「コピーしました」）や、`{ label, icon, href }`（例「この商品の受注を見る」）、`{ label, onSelect }` を並べる。
- 枠の中身だけを出したいときは `RecordCard` を使う。
- `renderAvatar` があれば、`icon` の代わりに記録ごとの絵（担当者の頭文字など）を出す。
- 文言は種類ごとに変えられる: `missingText`（既定「削除された{名前}」）・`forbiddenText`（既定「見る権限がありません」。前に種類の名前が付く）・`unavailableText`（既定「{名前}を読み込めませんでした」）・`loadingText`（読み上げ）。
- `getKeywords` は付け替えの検索に使う言葉（読み仮名・コードなど）。
- `kinds` は毎回作り直さない（外で 1 回作って渡す）。

### セルに出す

```tsx
// 列ごと作る（表ごとにセルを書かない）
dataTableRecordColumn<Invoice, Customer>({
  id: 'customer',
  header: '取引先',
  kind: 'customer',
  get: invoice => invoice.customer,
  status: invoice => invoice.customerStatus, // 'loading' | 'missing' | 'forbidden' | 'unavailable'
})

// 自分でセルを書くとき
<DataTableRecordCell kind='member' records={[sato, recordPlaceholder('forbidden', 'u-9')]} max={2} />
```

- 記録の様子は `ready`（ふつう）・`loading`・`missing`（消えた）・`forbidden`（見る権限が無い）・`unavailable`（読み込めない）。記録が `null` で様子を渡さなければ「未設定」（`emptyText` で変えられる）。
- 複数の記録は並べて出し、`max`（既定 2）を超えたら「+N」を押すと全部が出る。並びの中の読み込み中・消えた記録は `recordPlaceholder(様子, 見分け)` で置く。
- 記録を読むのはアプリ側。ID から名前を引くフックなどで記録と様子を作って渡す。

### 付け替える

```tsx
<DataTableRecordSelectCell<Member>
  kind='member'
  ariaLabel={`${task.title}の担当者を変更`}
  record={task.member}
  allowEmpty
  onSave={async member => {
    const saved = await updateTask(task.id, { memberId: member?.id ?? null })
    replaceTask(saved)
  }}
/>
```

- 流れは `DataTableSelectCell` と同じ（保存中は止める、保存できたら印、失敗したら元に戻して理由を出す）。
- 別のシステムの記録から選ぶときは、候補の枠にも要点の枠と同じ色の帯（例「店舗管理 · 店から選ぶ ↗」）と左の線を付け、検索欄は「店舗管理の店を検索…」、候補の絵もシステムの色にする。色と絵は要点の枠と同じ `systems` の決まりから取る。同じシステムから選ぶときはふつうの枠。
- 種類の決まりの `pickerActions` に、候補の枠の下に出す元のシステムへの道筋を書く（例 `{ label: '店舗管理で新しく作る', icon: Plus, href: '/shops/new' }`、「店舗管理で一覧を開く」）。
- `DataTableSelectCell` 自体にも、候補の枠に物を足す `pickerHeader`・`pickerFooter`・`searchPlaceholder`・`pickerClassName`・`pickerStyle` がある。
- 候補は種類の決まりの `useCandidates` から出す。`candidates` を渡すとそちらを使う。今の記録が候補に無くても出す。
- `allowEmpty` で「未設定」に戻せる。保存には記録（または `null`）が渡る。
- `validate` に記録（または `null`）が渡る。だめなら理由の文言を返すと保存しない。
- セルの種類を途中で変えるときは `key` も変える（種類ごとに候補を読むフックが違うため）。
