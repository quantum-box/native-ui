# @tachyon-sdk/native-ui

Linear / Notion のようなネイティブアプリらしい UI を実現する共通コンポーネントライブラリ。shadcn/ui（new-york）ベース。

- デザインシステム仕様: [docs/design-system.md](./docs/design-system.md)
- 一覧の表（DataTable）の使い方: [docs/data-table.md](./docs/data-table.md)
- 記録の部品（表の外でも使う）の使い方: [docs/record.md](./docs/record.md)
- Tauri macOSタブ実装ガイド: [docs/tauri-macos-tabs.md](./docs/tauri-macos-tabs.md)
- Tauri macOS Webリンクコピーガイド: [docs/tauri-macos-web-link-copy.md](./docs/tauri-macos-web-link-copy.md)
- トークン実装: `src/styles/tokens.css`（`--nui-*` CSS 変数）
- Tailwind v3 preset: `src/tailwind-preset.ts`
- Tailwind v4 theme: `src/styles/theme.css`

エントリはビルド出力（`dist/`、ESM + CJS + 型定義同梱）です。`prepare` script が
tsup ビルドを実行するため、GitHub 依存としてインストールしても `dist/` が生成されます。
consumer 側での transpile（`transpilePackages` など）は不要になりました。
`@tachyon-sdk/native-ui/src/*` の直接参照も後方互換のため引き続き可能です。

## インストール

npm publish はしていません。GitHub 依存として追加します（private リポジトリのため git 認証が必要）:

```jsonc
// package.json
{
  "dependencies": {
    "@tachyon-sdk/native-ui": "quantum-box/native-ui"
  }
}
```

特定コミットに固定する場合は `"quantum-box/native-ui#<commit-ish>"`。

## セットアップ（consumer アプリ・Tailwind v3）

```ts
// tailwind.config.ts
import nativeUiPreset from '@tachyon-sdk/native-ui/tailwind-preset'

export default {
  presets: [nativeUiPreset],
  content: [
    './src/**/*.{ts,tsx}',
    // ライブラリのクラス名も scan 対象に含める
    './node_modules/@tachyon-sdk/native-ui/dist/**/*.{js,mjs}',
  ],
}
```

```css
/* globals.css */
@import '@tachyon-sdk/native-ui/styles/tokens.css';
```

## セットアップ（consumer アプリ・Tailwind v4）

```css
/* app.css */
@import 'tailwindcss';
@import '@tachyon-sdk/native-ui/styles/theme.css';
@source '../node_modules/@tachyon-sdk/native-ui/dist';

/* class ベースのダークモードを使う場合（この design system は class ベース） */
@custom-variant dark (&:where(.dark, .dark *));
```

`theme.css` は `tokens.css` を import した上で `--nui-*` トークンを Tailwind v4 の
theme 変数（`--color-*` / `--text-*` / `--radius-*` など）にマップします。
v3 preset と同じユーティリティ名（`bg-primary`, `text-2xs`, `duration-fast` 等）が使えます。

ダークモードは `<html class="dark">` で切り替え（v3: `darkMode: ['class']`、v4: 上記 `@custom-variant`）。

**注意**: preset は Tailwind のデフォルト type scale（`text-sm` = 13px 等）と radius を上書きします。既存アプリに導入する場合はアプリ全体の見た目に影響するため、画面確認を伴う独立した PR で導入してください。

## 使い方

```tsx
import { Button } from '@tachyon-sdk/native-ui'

// デフォルトは secondary（静かなボーダーボタン）。
// アクセント色は主要アクションのみに使う。
<Button>Cancel</Button>
<Button variant='primary'>Save</Button>
<Button variant='ghost' size='icon'><SettingsIcon /></Button>
```

コンポーネント一覧: Badge / Button / Calendar / Checkbox / Combobox / Command / DataTable / DatePicker / DateRangePicker / Dialog / DropdownMenu / Form / Input / InputGroup / Kbd / Label / MacOSWindowTabs / MacOSWebLinkCopyShortcut / Popover / Select / Separator / Sidebar / Switch / Table / Tabs / Textarea / Toast / Tooltip。Tauriタブnavigation向けに`isDesktopWindowTabOpenClick`もexportする。

```tsx
// アプリのナビゲーションは Sidebar 一式で組む
<Sidebar>
	<SidebarHeader>Tachyon Inc.</SidebarHeader>
	<SidebarSection>
		<SidebarItem asChild active={pathname === '/inbox'}>
			<Link href='/inbox'>
				<Inbox />
				<SidebarItemLabel>Inbox</SidebarItemLabel>
				<Kbd>G</Kbd>
			</Link>
		</SidebarItem>
	</SidebarSection>
	<SidebarFooter>…</SidebarFooter>
</Sidebar>
```

```tsx
// Tauri macOSのtraffic lightと統合する38pxのウインドウタブ。
// IPCとWebView lifecycleはconsumerがcallbackへ接続する。
<MacOSWindowTabs
	tabs={tabs}
	activeTabId={activeTabId}
	onTabSelect={activateTab}
	onTabClose={closeTab}
	onNewTab={createTab}
/>
```

```tsx
// macOS native appだけで有効化するheadless shortcut component。
// URL/title mappingと通知はconsumerが所有する。
<MacOSWebLinkCopyShortcut
	enabled={targetOs === 'macos'}
	getWebUrl={webUrlForCurrentLocation}
	getPageTitle={pageTitleForCurrentLocation}
	onCopy={result => toast.success(result.kind)}
	onError={() => toast.error('Webリンクをコピーできませんでした')}
/>
```

## フォームの欄を並べる

欄は `Field`（または react-hook-form の `FormItem`）、横に並べる箱は `FieldGroup`。同じ行の欄は、説明・エラー・長いラベルが混ざっても入力欄の上端がそろい、入力欄もボタンも箱の右端からはみ出さない。

```tsx
import { Button, Field, FieldActions, FieldGroup, Input } from '@tachyon-sdk/native-ui'

<FieldGroup columns={4}>
  <Field label='商品名' required>
    <Input />
  </Field>
  <Field label='入数' description='1 箱に入っている数'>
    <Input inputMode='numeric' />
  </Field>
  <Field label='JAN コード' error={errors.jan}>
    <Input inputMode='numeric' />
  </Field>
  <FieldActions>
    <Button variant='ghost'>やめる</Button>
    <Button type='submit' variant='primary'>保存</Button>
  </FieldActions>
</FieldGroup>
```

- `columns` はいちばん多いときの列の数。箱が狭いと（右の詳細の中など）列を減らし、もっと狭ければ 1 列。画面の幅ではなく箱の幅で決まる。
- react-hook-form なら、`Field` の代わりに `FormItem`（`FormLabel`・`FormControl`・`FormDescription`・`FormMessage`）をそのまま `FieldGroup` に入れてよい。

形の崩れ（同じ行の入力欄の上端のずれ・右へのはみ出し）は、テスト用の入口の `findLayoutProblems` で見つけられる。外の物を使わない 1 つの関数なので、Playwright の `evaluate` にそのまま渡せる。

```ts
import { findLayoutProblems } from '@tachyon-sdk/native-ui/testing'

expect(await page.locator('form').evaluate(findLayoutProblems)).toEqual([])
```

## 開発

```bash
corepack enable
pnpm install
pnpm ts      # 型チェック
pnpm lint    # Biome lint
pnpm format  # フォーマット確認（修正は format:write）
pnpm test      # Vitest smoke test
pnpm build     # Storybook build（Cloud App デプロイが使用）
pnpm build:lib # ライブラリビルド（dist/ に ESM + CJS + d.ts）
```

## 部品の置き場

部品は種類ごとに `src/components/<置き場>/` に置く。Storybook の左の一覧も同じ分け方で、
1 段目は日本語の見出し、2 段目は import する名前（英語。`Button`・`AiField` など）にそろえる。
見出しの並びは `.storybook/preview.tsx` の `storySort` で決める。

| 置き場 | Storybook の見出し | 置く物 |
| --- | --- | --- |
| `basics/` | 基本 | Button・Badge・Label・Separator・Kbd |
| `inputs/` | 入力 | Input・Textarea・InputGroup・Checkbox・Switch・Select・Combobox・Form・Calendar・DatePicker・DateRangePicker |
| `overlays/` | 重なる物 | Dialog・Sheet・Popover・Tooltip・DropdownMenu・Command・Toast・HoverCard・HoverPeek |
| `layout/` | 並べる・見せる | Tabs・Collapsible |
| `table/` | 表 | Table・DataTable と表のセル（その場で直すセル・記録のセル・計算した値のセル・密度） |
| `record/` | 記録 | 別の業務の記録（取引先・商品・店・担当者など）の見せ方。表の外でも使う物（RecordChip・RecordCard・RecordPicker など） |
| `ai/` | AI | AiField（AI が入れた入力欄）・AiReasoning（判断の中身）・AiSuggestion（候補） |
| `ai-chat/` | AI チャット | Message・Bubble・MessageScroller・Trace・Chat*（送る欄・道具の記録・実行の前の確かめ など） |
| `fact/` | データ基盤の値 | FactLabel・FactValue・FactField・FactPanel・AiValue（文の中の印） |
| `app-frame/` | 画面の枠 | Sidebar・StatusBar・FloatingPanel・macOS の窓とタブ |

新しい部品を足すときの決まり:

- 上の表で一番近い置き場に置く。どれにも合わないときは、新しい置き場を作る前に相談する。
- 部品のファイル・story・テストは同じ置き場に並べる（`button.tsx`・`button.stories.tsx`・`base.test.tsx`）。
- 置き場の中はフォルダを分けない（`../../lib/...` の深さがそろう）。ほかの置き場の部品は `../<置き場>/<部品>` で読む。
- story の `title` は `'<見出し>/<import する名前>'`（例: `'入力/Checkbox'`）。見出しを足したら `storySort` にも足す。
- 使う側へは、これまでどおり `src/index.ts` から出す（使う側は置き場を知らなくてよい）。

## コンポーネント追加ワークフロー

1. `npx shadcn@latest add <component>` でベースを取得し、上の「部品の置き場」の決まりに合うフォルダへ動かす（`components.json` 設定済み）
2. 生成された import を**相対パスに修正**する（`@/lib/utils` → `../../lib/utils`）。
   consumer アプリの `@/` alias と衝突するため、ソース内で `@/` import は使用禁止
3. デザイントークンに合わせて調整する（高さ h-6/7/8、`text-sm`=13px、`duration-fast` 等）
4. `src/index.ts` から export する
5. `.design-sync/NOTES.md` の再同期チェックリストを確認のうえ `/design-sync` で Claude Design に反映する

## Claude Design 連携

このリポジトリは claude.ai/design のデザインシステムプロジェクト **[Tachyon Native UI](https://claude.ai/design/p/7c8aade7-758e-4cca-b966-97ba577775fa)** と同期しています。Claude Design のエージェントは、この実コンポーネント（コンパイル済みバンドル）と `docs/*.md`（デザインシステム仕様・ページ構成例）を読んだ上で画面を組むため、生成されるデザインはそのままこのライブラリのコードにマップできます。

### 同期されるもの

| プロジェクト内 | ソース |
|---|---|
| コンポーネントカード・型定義・使い方ガイド | `src/components/*/*` + `.design-sync/previews/*`（手書きプレビュー） |
| コンパイル済みバンドル（実レンダリング用） | `src/index.ts` を esbuild でバンドル |
| スタイル（トークン込みTailwindコンパイル） | `src/styles/tokens.css` + `src/tailwind-preset.ts` |
| guidelines（デザインエージェントへの指針） | `docs/*.md` |
| README冒頭の規約ヘッダー | `.design-sync/conventions.md` |

### 再同期の手順

トークン・コンポーネント・`docs/*.md` を変更したら再同期する:

1. このリポジトリで対話型の `claude` セッションを開く（初回のみ `/design-login` で認可）
2. `/design-sync` を実行する — 同期先の pin と変換設定は `.design-sync/config.json` にあるので、差分だけが検証・アップロードされる
3. 新しいコンポーネントを追加した場合は `.design-sync/previews/<Name>.tsx` のプレビュー追加と、`config.json` の `componentSrcMap`（サブコンポーネント除外）への追記を忘れずに

機械的な注意点（ドライバの起動コマンド、`dist/` の再ビルド、既知の警告など）は [.design-sync/NOTES.md](./.design-sync/NOTES.md) に集約してあります。

Claude Design 上でユーザーが作成したデザイン（`templates/` 等）は同期の管理外で、上書き・削除されません。
