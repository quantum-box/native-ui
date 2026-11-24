# 記録の部品

別の業務の記録（取引先・商品・店・担当者・請求書など）を、どこでも同じ見た目と動きで出す部品。表のセル（`DataTableRecordCell`）は、これらを使う薄い包み。Storybook の `Components/Record` に例がある。

| 部品 | 役目 | 使う場所の例 |
| --- | --- | --- |
| `RecordKindProvider` / `defineRecordKind` | 種類とシステムの決まりを 1 か所で登録する | アプリの外側に 1 つ |
| `RecordChip`（`RecordLink`） | 絵と名前。押すと詳細へ、触れる・↓ で要点のカード | 一覧・通知・右から出る詳細 |
| `RecordMention` | 文の中の控えめな形（まわりの文字の大きさのまま、点線の下線） | 文・AI の返事 |
| `RecordCard` | 要点のカード（システムの帯・要点・「〜で開く」と操作） | 触れたときの枠、カードを並べる画面 |
| `RecordPicker` | フォームで記録を選ぶ欄（候補の枠は表の付け替えと同じ） | フォーム |
| `RecordList` | 記録の一覧（種類ごとにまとめる・「ほか N 件」） | 詳細の画面の「関係する記録」・AI の返事の出典 |

種類とシステムの決まりの書き方は `docs/data-table.md` の「別の業務の記録を出すセル」を見る。決まりは表でも表の外でも同じ物を使う。

## 文の中

```tsx
<p>
  <RecordMention kind='customer' record={customer} /> から注文がありました。
</p>
```

- 文の中では、記録ごとの絵（担当者の顔など）より控えめな種類の絵を使う。
- 別のシステムの記録は、絵がシステムの色になる。
- 触れる・フォーカスすると、表のセルと同じ要点のカード（「〜で開く」）が出る。消えた・見る権限が無い記録も同じ出し方。

## フォームで選ぶ

```tsx
<Label htmlFor='order-customer'>取引先</Label>
<RecordPicker<Customer>
  id='order-customer'
  kind='customer'
  value={customer}
  onChange={setCustomer}
  allowEmpty
/>
```

- 選んでいる記録は、表のセルと同じ絵と名前で出す。何も選んでいないときは `placeholder`（既定「{名前}を選ぶ」）。
- 候補は種類の決まりの `useCandidates`、または `candidates`。検索は名前・補足・`getKeywords`（読み仮名など）で探せる。
- 別のシステムから選ぶときは、候補の枠に色の帯（例「店舗管理 · 店から選ぶ」）と線、検索欄の文言（例「店舗管理の店を検索…」）、下の道筋（`pickerActions`）が付く。表の付け替えのセルと同じ物（`useRecordPickerChrome`）。
- `id`・`aria-label`・`aria-describedby`・`aria-invalid` を渡せる。

## 一覧（関係する記録・出典）

```tsx
<RecordList
  title='関係する記録'
  groupByKind
  items={[
    { key: 'c1', kind: 'customer', record: customer, meta: '注文元' },
    { key: 'm1', kind: 'member', record: member, meta: '担当' },
    { key: 'p9', kind: 'product', status: 'missing', meta: '× 3' },
  ]}
/>
```

- `meta` は右に小さく出す補足、`badge` は名前の横の小さな印（例 AI の返事で「変えた」）。
- AI の返事では、文の中を `RecordMention`、下の一覧を `RecordList` にする。記録でない資料（明細の抜き出しなど）は、これまでどおりチャットの `CitationMark`・`SourceList` で出す。
