# 記録の部品

別の業務の記録（取引先・商品・店・担当者・請求書など）を、どこでも同じ見た目と動きで出す部品。表のセル（`DataTableRecordCell`）は、これらを使う薄い包み。Storybook の `記録/Record` に例がある。

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

## 外の仕事を結ぶ（Linear の Issue など）

外のサービスの仕事（Linear の Issue・プロジェクト、Field の問い合わせなど）を、行動などに結ぶ所。記録の部品の上に作ってあり、結んだ仕事は記録の名前の印と要点のカードで出す。Storybook の `記録/LinkedWork` に例がある。

| 部品 | 役目 |
| --- | --- |
| `defineLinkedWorkKind` | 外の仕事の種類を記録の種類として決める（名前は「番号 題名」、要点は番号・題名・進み具合、「{システム}で開く」） |
| `LinkedWorkList` | 結んだ仕事の一覧。まとめ（進行中 N 件 · 完了 N 件 · 読めない N 件）・読み直す・発生元・外した仕事（畳む）・空の状態 |
| `LinkedWorkItem` | 結んだ仕事 1 つ。進み具合の札（進行中・完了・取消）・結び方の札（進める仕事・参考）・「{システム}で開く ↗」・「外す」 |
| `UnlinkWorkDialog` | 外す理由（必須）を書かせる小さなダイアログ |
| `LinkWorkDialog` | 結ぶ手順。何を（種類）→ どこから（チームなど）→ 探して選ぶ（`RecordPicker`、「続きを読む」）→ 結び方 → 結ぶ |
| `WorkOrigin` | 「この行動は Linear の COM-912 … から生まれました（3 回受けました）」 |

```tsx
const kinds = {
  'linear.issue': defineLinkedWorkKind({ name: 'Issue', system: 'linear', icon: CircleDot, openLabel: 'Linear で開く' }),
}
const systems = { linear: { name: 'Linear', icon: SquareKanban, tone: 'violet' } } // 商標の色は使わず、色の印から選ぶ

<RecordKindProvider kinds={kinds} systems={systems} currentSystem='field'>
  <LinkedWorkList
    title='Linear の Issue'
    links={links}            // { id, kind, relation, record: { id, publicId, title, url, progress }, read, withdrawn }
    origin={{ kind: 'linear.issue', record: origin, receivedCount: 3 }}
    onLink={() => setOpen(true)}
    onUnlink={(work, reason) => withdraw(work.id, reason)}
    onReload={reload}
    onConnect={goToSettings}
  />
  <LinkWorkDialog
    open={open}
    onOpenChange={setOpen}
    kinds={[{ kind: 'linear.issue', label: 'Linear の Issue', sources: teams, sourceLabel: 'チーム' }]}
    candidates={page.records}
    hasMore={page.hasMore}
    onLoadMore={loadMore}
    onSelectionChange={({ kind, source }) => loadCandidates(kind, source)}
    onSubmit={({ kind, record, relation }) => link(kind, record, relation)}
  />
</RecordKindProvider>
```

- 読めない様子（`read`）は、記録の「消えた・見る権限が無い」と同じ考え方で出し、理由と次の一手を添える。
  - `stale` 古い・`partial` 一部だけ → 「古い」の札と「読み直す」
  - `revoked` 消えた・見られなくなった → 「{システム}をつなぎ直す」「外す」
  - `unconnected` つないでいない → 「{システム}をつなぐ」
  - `forbidden` 見る権限が無い・`unavailable` 今は読めない（読み直す）
  - 読めないときも、分かっている番号・題名は添える。
- 種類が 1 つしか無ければ、手順に「何を結ぶか」の段は出ない。どこから（チームなど）が 1 つなら、その段も出ない。
- 結べないとき（つないでいない）は `canLink={false}`・`cannotLinkReason`・`connectAction` で、理由と次の一手を出す。
- 外のサービスの場所（http・https）は、記録のカードでも新しいタブで開く（アプリの画面の移動は使わない）。
- 英字と日本語が隣り合う文言（例「Linear の Issue を検索…」）は `spaceLatin` で空白を入れて作る。
