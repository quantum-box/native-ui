# Tachyon Native UI — このデザインシステムでの作り方

Linear / Notion のような**ネイティブアプリ的な高密度UI**を実現するライブラリ。コンパクトなコントロール、静かなサーフェス、キーボードファーストの操作感が特徴。マーケティングサイト的なレイアウト（ヒーロー、大きな余白）はこのDSの対象外。

## セットアップとラップ

- コンポーネントは単体で動作する。グローバルプロバイダーは不要 — **ただし `Tooltip` だけは `TooltipProvider` の内側に置くこと**（アプリルートを一度 `<TooltipProvider>…</TooltipProvider>` でラップする）。
- ダークモード: ルート要素に `dark` クラスを付与する。ダークモードでは影が見えにくいため、浮いたサーフェスには必ずボーダーを併用する。
- ベースフォント（Inter）は同梱スタイルシートが自動適用する。等幅（ショートカット表記・コード）は `var(--nui-font-mono)` を使う。

## スタイリングの流儀 — トークンを使う。任意のユーティリティクラスは使わない

**重要:** 同梱CSSにはライブラリ自身が使うTailwindユーティリティしか含まれていない — 汎用のTailwindランタイムではない。自分で書くレイアウトグルー（コンテナ・余白・グリッド）にはインラインstyleか、デザイントークンを使った `<style>` ブロックを使うこと。クラス名を発明してはいけない。

カラートークンはHSLトリプレットなので `hsl()` で包む:

```css
color: hsl(var(--nui-foreground));
background: hsl(var(--nui-surface));
border: 1px solid hsl(var(--nui-border));
```

| トークン | 用途 |
|---|---|
| `--nui-background` / `--nui-surface` / `--nui-muted` | アプリ背景 / パネル / hover・控えめな塗り |
| `--nui-foreground` / `--nui-muted-foreground` / `--nui-subtle-foreground` | テキストの階層 |
| `--nui-border` / `--nui-border-strong` | ヘアライン / 入力欄 |
| `--nui-primary` / `--nui-primary-foreground` | アクセント（Linear風インディゴ）— 主要アクション専用 |
| `--nui-selected` | 選択中の行・項目の背景 |
| `--nui-popover` / `--nui-popover-foreground` | フローティングサーフェス |
| `--nui-destructive` / `--nui-success` / `--nui-warning` | ステータス |
| `--nui-radius-sm/md/lg/xl` | 4/6/8/12px — バッジ / コントロール / ポップオーバー / モーダル |
| `--nui-shadow-overlay` / `--nui-shadow-modal` | level-1 / level-2 エレベーション |
| `--nui-duration-fast/base/slow`, `--nui-ease-out` | 100/150/250ms のモーション |

密度ルール: 余白は4pxグリッド。コントロール高さは 24/28/32px（ボタン・入力欄・セレクトの標準は **28px**）。本文テキストは 13–14px。メニュー行 28px、リスト行 32px、サイドバー幅 240px。

## コンポーネントAPIの注意点

- `Button` の**デフォルトは `variant='secondary'`**（静かなボーダーボタン）— これが主力。`variant='primary'` は画面内の「主要アクション1つ」だけに使う。ツールバーは `ghost`、アイコンのみは `size='icon'`（lucideアイコンを子に渡す）。
- 複合コンポーネントはフラットにエクスポートされている: `Dialog`+`DialogContent`/`DialogHeader`/`DialogTitle`/`DialogDescription`/`DialogFooter`/`DialogTrigger`、`DropdownMenu`+`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem`/`DropdownMenuCheckboxItem`/`DropdownMenuSeparator`/`DropdownMenuShortcut`/`DropdownMenuSub…`、`Select`+`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectGroup`/`SelectLabel`/`SelectItem`、`Popover`+`PopoverTrigger`/`PopoverContent`、`Command`+`CommandInput`/`CommandList`/`CommandGroup`/`CommandItem`/`CommandShortcut`/`CommandEmpty`、`Tooltip`+`TooltipTrigger`/`TooltipContent`。
- `Input` は `error?: string` プロップを持つ（エラーメッセージ表示 + destructiveボーダー。`id` を必ず渡す）。`Label htmlFor` と組み合わせる。
- `Kbd` はキーボードヒント表示: `<Kbd>⌘</Kbd><Kbd>K</Kbd>` — アクションの隣にショートカットを添える（メニュー項目内では代わりに `DropdownMenuShortcut`/`CommandShortcut` を使う）。

## 典型例

```tsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 320 }}>
  <Label htmlFor='workspace-name'>Workspace name</Label>
  <Input id='workspace-name' defaultValue='Tachyon Inc.' />
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
    <Button>Cancel</Button>
    <Button variant='primary'>Save changes</Button>
  </div>
</div>
```

スタイリングの前に `styles.css`（トークン定義）と各コンポーネントの `.d.ts` / `.prompt.md` を読むこと — それらが一次情報。
