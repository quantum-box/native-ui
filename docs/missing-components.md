# 足りない部品の案

Field（quantum-box/tachyonfield の `apps/client/src`）を読み、native-ui に同じ役割の部品が無くて
Field が自分で作っている物を洗い出した。ここは案だけで、部品はまだ作っていない。

- 調べた日: 2026-11-24。Field は手元の `e3b62583d`（2026-10-16）。テストのファイルは数えていない。
- 数は「使っている行の数 / ファイルの数」。`grep` で数えた。
- 方針: 同じ操作・同じ見た目が複数の画面に出るときは、共通の部品を 1 つ用意して全部の場所で使う。

## 先に知っておくこと

1. **Field は古い native-ui を見ている。** `apps/client/package.json` は native-ui を
   `#4ef198c`（2026-07 ごろ）に固定している。そのあとに足した Textarea・Field・InputGroup・
   Collapsible・CopyButton・DataTable・Sheet・HoverCard・Record などは、Field からまだ使えない。
   下の「もう native-ui にある物」は、版を上げれば置き換えられる。新しい部品は要らない。
2. **Field の共通の物は、ほぼ 1 つのファイルにある。** `components/app-chrome.tsx`（397 行）に
   画面の骨組み（見出し・パンくず・誤り・読み込み中・空・下の帯など）がまとまっている。
   Field の中ではすでに共通になっているので、native-ui に移す値打ちは
   「ほかの製品でも同じ物を使える」ことにある。
3. カレンダーと日付の入力欄は、この案と同じ PR で作った（Calendar・DatePicker・DateRangePicker）。
   Field の日付の入力は 82 / 43。

## 足す順のおすすめ

| 順 | 部品 | Field の今 | 使っている数 | native-ui に足すとどうなるか | base-ui の下地 |
| --- | --- | --- | --- | --- | --- |
| 1 | **Alert**（知らせの帯）と画面の誤り | `AppPageError`（`app-chrome.tsx:147`）。ほかに色を付けた帯を画面ごとに手書き | `AppPageError` 208 / 159。手書きの帯 36 / 26（class の書き方が約 20 通り）。`role='alert'` の 1 行の誤り 約 45 | 誤り・注意・お知らせの色と形が 1 つに決まる。いちばん見た目がばらついている所なので、最初に効く | 無し（自作） |
| 2 | **ConfirmDialog**（確かめる窓） | `FinancialConfirmationDialog`。ほかに Dialog と赤いボタンで手書き | 38 / 26 と、手書き 約 25 ファイル | 「消しますか」の窓の文・ボタンの並び・処理中の止め方がそろう。Esc や外を押しても閉じない、正しい読み上げになる | `alert-dialog` |
| 3 | **Button の loading** と Spinner | `disabled={busy}` と `{busy ? '保存中…' : '保存'}` を毎回書く | 130 / 76。回る印 15 / 11（大きさが 3 通り）。更新ボタン `AppRefreshButton` 126 / 125 | `<Button loading>` だけで、押せなくなり、回る印が出る。更新ボタンもこの上に作れる。小さな変更で届く所が広い | 無し（Button に足す） |
| 4 | **画面の骨組み**（Page・PageHeader・Breadcrumb・DetailSection・PageFooter・PageLoading） | `app-chrome.tsx` の `AppPage`・`AppToolbar`・`AppToolbarTitleRow`・`AppBreadcrumb`・`AppDetailSection`・`AppPageFooter`・`AppPageLoading` | 見出し 165 / 162、パンくず 132 / 131、区切りの見出し 198 / 70、下の帯（前へ・次へ）59 / 59、読み込み中 160 / 149 | どの製品の画面も同じ骨組みになる。数はいちばん多いが、Field の中ではもう共通なので、急がない。パンくずはリンクの部品を外から渡せる形にする | `toolbar`（並んだボタンを矢印で動く） |
| 5 | **EmptyState**（空のとき） | `AppEmptyState`（表のセルの中だけ）。表の外は手書き | 105 / 88 と、手書き 39 / 26 | 表の中・外・枠つきの 3 つの形を 1 つの部品で出せる。今ある `ChatEmptyState` はチャット専用 | 無し（自作） |
| 6 | **DescriptionList**（名前と値の並び） | 同じ `DetailField` を 6 つの画面に写して書いている。ほかに `<dl>` を手書き | `DetailField` 76 / 6。`<dt>` 136 / 43 | 詳細の画面の「名前：値」の並びが 1 つになる。形は 2 つ（格子と、線で区切った行） | 無し（自作） |
| 7 | **NumberInput**（数・金額の入力） | `type='number'` と、空のときの `NaN` をよける書き方を毎回書く | 58 / 32。`NaN` よけ 13 / 6 | 数だけ打てる、空を空として扱う、3 けた区切りと「円」を出す、が部品の仕事になる | `number-field` |
| 8 | **Stat**（数字の札） | 同じ `Metric` を 7 つの画面に写して書いている。ほかに `KpiTiles`・`SummaryTiles` など 5 つ | `Metric` 28 / 7 | 名前・大きな数字・補足・色の並びが 1 つになる | 無し（自作） |
| 9 | **SegmentedControl**（切り替えのボタンの並び） | Tabs を絞り込みの切り替えに使っている（中身の `TabsContent` があるのは 1 ファイルだけ） | `TabsList` 31 / 29 | 「タブ」ではなく「どれか 1 つを選ぶボタン」として読み上げられる。見た目は今のままにできる | `toggle-group` |

### そのあと（数が少ない・小さい物）

| 部品 | Field の今 | 数 | ひとこと |
| --- | --- | --- | --- |
| SearchField（探す欄） | `AppSearchField` と手書き 4 | 25 / 25 | 今の InputGroup の上にすぐ作れる |
| FilePicker（ファイルを選ぶ） | 見えない `<input type='file'>` とボタン | 24 / 23 | 引っぱって落とす形は今は 0。ボタンで選ぶ形だけでよい |
| 月・時刻・日時の入力 | ブラウザの `month` 5 / 4、`time` 10 / 6、`datetime-local` 6 / 6 | 21 | **作った**（MonthPicker・TimePicker・DateTimePicker）。値の形はブラウザの入力と同じ |
| 押せる行 | `rowActivateProps()` | 40 / 38 | 新しい部品ではなく、Table の行に `onActivate` を足す |
| Meter（横の棒） | 同じ書き方の手書き | 7 / 5 | base-ui に `meter`・`progress` がある |
| 日時の表示 | `formatDate` を 16 回、別々に書いている | 24 / 21 | 部品より、共通の関数 1 つ |
| 公開の画面の「終わりました」など | 手書き | 4 画面 | EmptyState の大きい形で足りる |

## もう native-ui にある物（Field の版を上げれば置き換えられる）

| Field の今 | 数 | native-ui の部品 |
| --- | --- | --- |
| 手書きの `<textarea>` | 58 / 39 | Textarea |
| 手書きの「ラベルと入力欄」 | 97 / 10 | Field・FieldGroup |
| 手書きの `<select>` | 42 / 19 | Select・Combobox（スマホで OS の一覧を使いたい所は残す） |
| `<details>` | 13 / 12 | Collapsible |
| `navigator.clipboard` | 5 / 5 | CopyButton・useCopy |
| `AppDataTable` | 19 / 12 | DataTable |
| `ObjectReferencePicker` | 37 / 24 | RecordPicker |
| アイコンだけのボタン（説明が出ない） | 32 / 24 | Button と Tooltip（Field は Tooltip を 0 回しか使っていない） |

## 調べたが、要らない物

Field で 1 回も使っていない: Avatar・ラジオ・Slider・右クリックのメニュー・Menubar・Tree・
Timeline・星の評価・手書きの署名・QR・地図・スマホの下から出る引き出し・Skeleton・図（グラフ）。

Card（枠で囲む箱）は足さない。Field は枠で囲まず、線で区切る作りで、囲みの書き方は 1 回きりの物が
多い（設計の決まり「テーブルをカードで包まない」とも合う）。

1 画面だけの物も足さない: かんばん（商談）、札を並べて打つ欄（顧客）、段階の表示（受付）。
2 つ目の画面が出たら考える。
