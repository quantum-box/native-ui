# Tachyon Native UI デザインシステム

`@tachyon-sdk/native-ui`（リポジトリ直下）のデザインシステム仕様。Linear / Notion のような「ネイティブアプリらしい」操作感を Web で実現するためのデザイントークンと原則を定義する。

- 実装（Single Source of Truth）: `src/styles/tokens.css`
- Tailwind 連携: `src/tailwind-preset.ts`
- コンポーネント基盤: shadcn/ui（new-york スタイル、cssVariables 方式）

## デザイン原則

1. **高密度・コンテンツファースト**: ベース 13px、コントロール高 28px を標準とし、1画面あたりの情報量を最大化する。装飾よりコンテンツ。
2. **境界はボーダーで、浮遊はシャドウで**: 面の区切りは 1px ボーダーを基本とし、シャドウはポップオーバー/モーダルなど「浮いている」要素にのみ使う。
3. **静かな配色**: 画面の 95% はニュートラルグレー。アクセント（indigo）は主要アクション・選択状態・フォーカスにのみ使用する。
4. **即時フィードバック**: hover は 100ms 以下、開閉は 150ms 前後。ユーザーを待たせるアニメーションは入れない。
5. **キーボードファースト**: すべてのインタラクティブ要素に focus-visible リングを表示し、ショートカットは `kbd` スタイルで明示する。
6. **楽観UIを既定とする**: 作成・更新・削除・並び替えなど、成功率の高い操作はサーバー応答を待たずに即座にUIへ反映する。失敗時のみロールバックし、エラー表示（トースト等）で通知する。ネイティブアプリらしい「待たされない」体験を最優先とし、ローディングスピナーでの待機はサーバー応答を待つ必然性が高い操作（決済確定など）に限定する。

## デザイントークン

CSS 変数はすべて `--nui-` プレフィックスで定義し、既存アプリの shadcn 変数（`--background` 等）と共存できるようにする。色は HSL 分解値（`H S% L%`）で保持し、Tailwind からは `hsl(var(--nui-x) / <alpha-value>)` で参照する。

### カラー

```yaml
# セマンティックカラートークン（HSL分解値）
colors:
  light:
    background: "0 0% 100%"        # ページ背景
    surface: "240 20% 98.5%"       # サイドバー・パネル・セカンダリボタン面
    foreground: "228 8% 17%"       # 標準テキスト (#282a30 相当)
    muted: "228 12% 95.5%"         # hover背景・無効面
    muted-foreground: "228 5% 42%" # 補助テキスト
    subtle-foreground: "228 5% 60%" # placeholder・微弱テキスト
    border: "228 10% 90%"          # 標準ボーダー
    border-strong: "228 8% 82%"    # 入力欄などフォーム系ボーダー
    primary: "234 59% 60%"         # アクセント (#5E6AD2 / Linear indigo 系)
    primary-foreground: "0 0% 100%"
    selected: "233 60% 96%"        # 選択行・選択項目の背景（アクセント淡色）
    popover: "0 0% 100%"
    destructive: "4 72% 55%"
    destructive-foreground: "0 0% 100%"
    success: "152 50% 40%"
    warning: "36 92% 50%"
    ring: "234 59% 60%"            # フォーカスリング＝アクセント

  dark:
    background: "228 7% 10%"       # #17181c 相当
    surface: "228 7% 13%"
    foreground: "220 10% 89%"
    muted: "228 7% 17%"
    muted-foreground: "224 6% 62%"
    subtle-foreground: "224 5% 48%"
    border: "227 7% 20%"
    border-strong: "227 7% 28%"
    primary: "235 70% 70%"
    primary-foreground: "0 0% 100%"
    selected: "234 35% 22%"
    popover: "228 7% 13%"
    destructive: "4 70% 60%"
    destructive-foreground: "0 0% 100%"
    success: "152 45% 50%"
    warning: "36 90% 60%"
    ring: "235 70% 70%"
```

使い分けの原則:

- `background` はページ全体、`surface` はサイドバー・ツールバー・カード等の面
- hover は `muted`、選択状態は `selected`（アクセント淡色）で区別する
- `success` / `warning` はステータス表示専用。ボタン等のアクションには使わない

### タイポグラフィ

```yaml
typography:
  font_family:
    sans: >-
      Inter, -apple-system, BlinkMacSystemFont, "Segoe UI",
      "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif
    mono: >-
      ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono",
      Menlo, monospace

  # Tailwind の fontSize スケールを上書きする（native-app 密度）
  scale:
    2xs: { size: 11px, line_height: 16px }  # バッジ・メタ情報
    xs:  { size: 12px, line_height: 18px }  # ラベル・キャプション
    sm:  { size: 13px, line_height: 20px }  # ★ UI標準（ボタン・メニュー・テーブル）
    base: { size: 14px, line_height: 22px } # 本文・詳細ペイン
    lg:  { size: 16px, line_height: 24px }  # セクション見出し
    xl:  { size: 20px, line_height: 28px }  # ページタイトル
    2xl: { size: 24px, line_height: 32px }  # 大見出し

  weight:
    normal: 400    # 本文
    medium: 500    # ★ UI要素の標準（ボタン・見出し・選択項目）
    semibold: 600  # ページタイトル・強調
    # bold(700) は原則使わない

  letter_spacing:
    heading: "-0.01em"  # lg 以上の見出しに適用
```

### 密度・サイズ

```yaml
density:
  spacing_grid: 4px  # 余白は 4px グリッド

  control_height:
    sm: 24px       # インライン・テーブル内ボタン (h-6)
    md: 28px       # ★ 標準（ボタン・入力欄・セレクト） (h-7)
    lg: 32px       # 主要CTA・検索バー (h-8)

  layout:
    sidebar_width: 240px
    list_row_height: 32px    # サイドバー項目・リスト行
    table_row_height: 36px
    menu_item_height: 28px

  icon_size:
    sm: 14px
    md: 16px       # ★ 標準
    lg: 20px
```

### テーブル・一覧レイアウト

行データを並べるテーブル（一覧・履歴など）の組み方。ERP管理画面テンプレートおよび
consumer 実装（tachyon-apps `apps/platform-ui`）で検証済みのルール。

- **full-bleed で敷く**: テーブルをカードや角丸ボーダーボックスで包まない。
  コンテンツ領域の端から端まで行を伸ばし、外側コンテナに padding を付けない。
- **左右余白は行内で取る**: コンテナの padding ではなく、ヘッダー行・データ行の
  水平 padding（20px）で余白を確保する。行ボーダー・ヘッダー背景・選択ハイライトが
  画面端まで届くようにするため。
- **ヘッダー行**: 高さ 38px、背景 `--nui-surface`、上下 1px `--nui-border`。
  ラベルは 11px semibold・letter-spacing 0.03em・`muted-foreground`。
  ソート可能な列はラベル右に 12px の矢印アイコンを添える。
- **データ行**: 高さ 36px（1行構成）〜52px（アバター + 2行構成）、
  下 1px `--nui-border`、hover は `--nui-muted` 50%。
- **選択行**: `--nui-selected` を行全面に敷き、左端に 2px の
  `--nui-primary` インセットバー（`inset 2px 0 0`）。
- **詳細ページも同様**: ページ全体を 1 つの padding で包まず、
  情報セクションごとに余白を持たせ、ページ内のテーブルは full-bleed にする。

### 楽観UI実装テンプレート

デザイン原則6を実装に落とし込むための標準パターン。consumer アプリでの実装は
以下のいずれかに揃える。

**React 19（`useOptimistic` が使える場合）**

```tsx
import { useOptimistic, startTransition } from 'react'

function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: string, done: boolean) => Promise<void> }) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(todo.done)

  const handleToggle = () => {
    const next = !optimisticDone
    startTransition(async () => {
      setOptimisticDone(next) // 即時反映。失敗時は元の todo.done に自動で戻る
      try {
        await onToggle(todo.id, next)
      } catch {
        toast.error('更新に失敗しました')
      }
    })
  }

  return <Checkbox checked={optimisticDone} onCheckedChange={handleToggle} />
}
```

**React 18 互換（手動ロールバック）**

```tsx
function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: string, done: boolean) => Promise<void> }) {
  const [done, setDone] = useState(todo.done)

  const handleToggle = async () => {
    const previous = done
    const next = !done
    setDone(next) // 即時反映
    try {
      await onToggle(todo.id, next)
    } catch {
      setDone(previous) // 失敗時のみロールバック
      toast.error('更新に失敗しました')
    }
  }

  return <Checkbox checked={done} onCheckedChange={handleToggle} />
}
```

**フォーム送信（submit）**: クリック直後にダイアログ/フォームを閉じて完了状態を表示し、実際の送信はバックグラウンドで進める。成否は `toast` で後から通知する。ボタンを `disabled`+スピナーにして送信完了まで画面を止める作りにしない。

```tsx
function CreateIssueForm({ onSubmit, onDone }: { onSubmit: (values: IssueInput) => Promise<Issue>; onDone: () => void }) {
  const [values, setValues] = useState<IssueInput>(initialValues)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onDone() // 即座にダイアログを閉じる・一覧に戻すなど、UI 上は完了扱い
    onSubmit(values)
      .then((issue) => {
        toast.success(`Issue ${issue.key} を作成しました`, {
          action: { label: '開く', onClick: () => router.push(`/issues/${issue.key}`) },
        })
      })
      .catch(() => {
        toast.error('作成に失敗しました', {
          action: { label: '再試行', onClick: () => onSubmit(values) },
        })
      })
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

適用の指針:

- **一覧の削除・並び替え**: 対象行を即座にリストから除去/移動し、失敗時のみ元の位置に戻す（フェードやシュリンクではなく即時除去でよい）。
- **作成（新規行追加）**: 一時 ID で即座にリストへ追加し、サーバー確定後に本 ID へ差し替える。失敗時は追加した行を除去してトースト表示。
- **インライン編集**: 入力確定と同時に表示値を更新し、保存 API はバックグラウンドで実行する。スピナーは出さない。
- **フォーム送信（作成・更新ダイアログ等）**: submit 時点でダイアログを閉じる／画面遷移するなど「完了」として扱い、実処理はバックグラウンドで継続する。結果は `toast` で非同期に通知し、成功時は関連ページへのリンクを、失敗時は再試行アクションを添える。送信ボタンをローディング表示で塞ぐ設計は避ける。
- **決済確定・不可逆操作**: 楽観更新の対象外。サーバー応答を待ち、ボタンをローディング状態にする。

### ナビゲーション（サイドバー）

アプリの主ナビゲーションは `Sidebar` コンポーネント一式で組む（`Sidebar` / `SidebarHeader` /
`SidebarSection` / `SidebarSectionLabel` / `SidebarItem` / `SidebarItemLabel` / `SidebarFooter`）。
インライン style で自作しない。

- **寸法**: 幅 240px 固定・`--nui-surface` 背景・右 1px `--nui-border`・内側 padding 8px。
  項目間ギャップ 2px、セクション間は 16px。
- **項目（SidebarItem）**: 高さ 32px・radius-md・アイコン 16px・ラベル 13px medium。
  状態は3段 — 通常 `muted-foreground` / hover `--nui-muted` 背景 + `foreground` /
  選択 `--nui-selected` 背景 + `foreground`（`active` prop）。
  **選択状態にアクセント色は使わない**。selected の淡色ティントだけで示す。
- **トレーリングヒント**: ラベルが `flex-1` を取るので、`Kbd`（ショートカット）や
  `Badge variant='neutral'`（件数）を子要素の末尾に置くだけで右端に揃う。
- **ヘッダー（SidebarHeader）**: ワークスペース名を semibold で。高さ 32px。
  右端にベル等の ghost アイコンを置ける。
- **セクションラベル（SidebarSectionLabel）**: 12px medium・`subtle-foreground`・高さ 24px。
  大文字化（uppercase）はしない。
- **フッター（SidebarFooter）**: `mt-auto` で最下部に固定。Settings / Help 等の低頻度項目。
- **アカウントバー（SidebarAccount + SidebarAvatar + SidebarAccountInfo）**:
  高さ 40px・アバター 24px（`--nui-selected` 背景にイニシャル、または img）・
  名前 13px medium + 詳細 11px muted の2行。右端に `ChevronsUpDown` 等のアイコン。
  フッターに置き、`asChild` で `DropdownMenuTrigger` をラップしてアカウントメニューを開く。
- **コンパクト表示（collapsed）**: `<Sidebar collapsed>` で 48px のアイコンレールになる。
  ラベル・Kbd・セクションラベル・アカウント情報は自動的に非表示（アバターとアイコンのみ残る）。
  幅は `transition-[width] duration-slow` でアニメーション。折りたたみ中の項目には
  `Tooltip` でラベルを補うこと。
- **検索エントリ**: 専用コンポーネントは作らない。`SidebarItem` + `Search` アイコン +
  右端 `<Kbd>⌘</Kbd><Kbd>K</Kbd>` の1行をナビ先頭に置き、クリックでコマンドパレットを開く。
- **ツリー／サブ項目（inset）**: `SidebarItem inset` で親の文字位置（32px）にインデントした
  アイコンなしサブ項目になる。プロジェクト → スプリント等の2階層まで。コンパクト時は自動非表示。
  件数は右端に `text-2xs` の `subtle-foreground`（Badge より静か）。
- **折りたたみセクション**: `SidebarSectionLabel` の末尾に `ChevronDown` を置く
  （開閉状態・回転はアプリ側）。
- **ピン留め**: ピン留め済み項目は最上部の「Pinned」セクションにまとめる。
  行アクションは `SidebarItemRow`（relative ラッパー）+ `SidebarItemAction`（右端に
  浮く 24px アイコンボタン、`Pin` アイコン 14px）で付ける。SidebarItem は `<button>`
  なのでアクションを子に入れず、必ず SidebarItemRow の兄弟として置くこと。
  デフォルトは行 hover / focus で出現、ピン留め済みの行では `alwaysVisible`。
  `aria-label`（Pin / Unpin）必須。アクション付き行に Kbd や Badge は置かない
  （右端スロットが競合する）。ピン状態の保持はアプリ側の責務。
- **ワークスペーススイッチャー**: `SidebarAccount` をヘッダー位置（最初の子）に置く。
  ワークスペースのアバターは `rounded-md bg-primary text-primary-foreground` で角丸スクエアに。
- **リンクとして使う**: `SidebarItem asChild` で `next/link` 等をラップする。
  現在地は `active`（`aria-current='page'` が付与される）。
- 開閉状態の保持・トグルはアプリ側の責務（コンポーネントは `collapsed` prop を受けるだけ）。

### 角丸

```yaml
radius:
  sm: 4px    # チェックボックス・バッジ・kbd
  md: 6px    # ★ 標準（ボタン・入力欄・メニュー項目）
  lg: 8px    # ポップオーバー・カード
  xl: 12px   # モーダル
  full: 9999px  # アバター・ピル
```

### エレベーション（影）

```yaml
elevation:
  level_0:  # 面の区切り（カード・パネル）
    shadow: none
    border: "1px solid var(--nui-border)"
  level_1:  # ドロップダウン・ポップオーバー・ツールチップ
    shadow: "0 4px 16px -2px rgb(0 0 0 / 0.10), 0 1px 3px rgb(0 0 0 / 0.06)"
  level_2:  # モーダル・コマンドパレット
    shadow: "0 16px 48px -8px rgb(0 0 0 / 0.20)"
  overlay:  # モーダル背面
    light: "rgb(0 0 0 / 0.40)"
    dark: "rgb(0 0 0 / 0.60)"
# dark テーマでは影が視認しづらいため、level_1/2 は必ず border と併用する
```

### モーション

```yaml
motion:
  duration:
    fast: 100ms    # hover / active の色変化
    base: 150ms    # ポップオーバー・ドロップダウンの開閉
    slow: 250ms    # モーダル・サイドパネルのスライド
  easing:
    out: "cubic-bezier(0.25, 1, 0.5, 1)"   # 開く・現れる
    in_out: "cubic-bezier(0.45, 0, 0.55, 1)" # 移動・リサイズ
  rules:
    - 閉じる動作は開く動作より速くする（または即時）
    - hoverの背景色変化は 100ms 以下、遅延を感じさせない
    - スピナー表示は 300ms 以上待つ場合のみ（フラッシュ防止）
```

### フォーカス・キーボード

```yaml
focus:
  ring: "0 0 0 2px hsl(var(--nui-background)), 0 0 0 4px hsl(var(--nui-ring) / 0.5)"
  # :focus-visible のみに適用（マウスクリックでは表示しない）

kbd:
  font: mono 11px
  style: "muted背景 + border + radius-sm、大文字表記（⌘K 等）"
```

## Tailwind との対応

`tailwind-preset.ts` が上記トークンを shadcn 互換のユーティリティ名にマップする。コンポーネントは shadcn 生成物の class 名（`bg-background`, `text-muted-foreground` 等）をそのまま使える。

| Tailwind クラス | トークン |
|---|---|
| `bg-background` / `bg-surface` / `bg-muted` / `bg-selected` | colors.* |
| `text-foreground` / `text-muted-foreground` / `text-subtle-foreground` | colors.* |
| `border-border` / `border-border-strong` | colors.border* |
| `bg-primary` `text-primary` / `bg-destructive` / `text-success` / `text-warning` | colors.* |
| `text-2xs`〜`text-2xl` | typography.scale（デフォルトスケールを上書き） |
| `rounded-sm/md/lg/xl` | radius（4/6/8/12px に上書き） |
| `shadow-overlay` / `shadow-modal` | elevation level_1 / level_2 |
| `duration-fast/base/slow`・`ease-out-quart` | motion |

## 利用方法（consumer アプリ）

```ts
// tailwind.config.ts
import nativeUiPreset from '@tachyon-sdk/native-ui/src/tailwind-preset'

export default {
  presets: [nativeUiPreset],
  content: [
    './src/**/*.{ts,tsx}',
    // ライブラリのソースも scan 対象に含める（source直参照のため必須）
    './node_modules/@tachyon-sdk/native-ui/src/**/*.{ts,tsx}',
  ],
}
```

```css
/* globals.css */
@import '@tachyon-sdk/native-ui/src/styles/tokens.css';
```

```js
// next.config.js
module.exports = {
  transpilePackages: ['@tachyon-sdk/native-ui'],
}
```

ダークモードは既存アプリと同じく `<html class="dark">`（`darkMode: ['class']`）で切り替える。

## コンポーネント追加ワークフロー

1. リポジトリ直下 で shadcn CLI を実行してベースを取得する（`components.json` 設定済み）
2. 生成物の import を**相対パス**に修正する（`@/lib/utils` → `../../lib/utils`）。consumer アプリの `@/` alias と衝突するため、パッケージ内で `@/` は使用禁止
3. トークン準拠に調整する（サイズを `control_height` に、`text-sm`=13px 前提の余白に、`duration-fast` に）
4. `src/index.ts` から export し、Storybook story を追加する

## 非目標（やらないこと）

- マーケティングサイト向けの大ぶりなスタイル（hero、大きな余白）は対象外
- テーマのカスタマイズ機構（テナント別テーマ等）は初期スコープ外。トークンの差し替えのみで将来対応
- Tailwind v4 対応は preset の差し替えで行う（トークン CSS はそのまま流用可能）
