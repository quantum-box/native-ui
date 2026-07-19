# @tachyon-sdk/native-ui

Linear / Notion のようなネイティブアプリらしい UI を実現する共通コンポーネントライブラリ。shadcn/ui（new-york）ベース。

- デザインシステム仕様: [docs/design-system.md](./docs/design-system.md)
- Tauri macOSタブ実装ガイド: [docs/tauri-macos-tabs.md](./docs/tauri-macos-tabs.md)
- トークン実装: `src/styles/tokens.css`（`--nui-*` CSS 変数）
- Tailwind v3 preset: `src/tailwind-preset.ts`

ビルドせず source を直接参照する方式（`main: src/index.ts`）のため、consumer 側で transpile が必要です。

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

## セットアップ（consumer アプリ）

```js
// next.config.js
module.exports = {
  transpilePackages: ['@tachyon-sdk/native-ui'],
}
```

```ts
// tailwind.config.ts
import nativeUiPreset from '@tachyon-sdk/native-ui/src/tailwind-preset'

export default {
  presets: [nativeUiPreset],
  content: [
    './src/**/*.{ts,tsx}',
    // source 直参照のためライブラリも scan 対象に含める
    './node_modules/@tachyon-sdk/native-ui/src/**/*.{ts,tsx}',
  ],
}
```

```css
/* globals.css */
@import '@tachyon-sdk/native-ui/src/styles/tokens.css';
```

ダークモードは `<html class="dark">` で切り替え（`darkMode: ['class']`）。

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

コンポーネント一覧: Badge / Button / Checkbox / Combobox / Command / Dialog / DropdownMenu / Form / Input / Kbd / Label / MacOSWindowTabs / Popover / Select / Separator / Sidebar / Switch / Table / Tabs / Toast / Tooltip

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

## 開発

```bash
corepack enable
pnpm install
pnpm ts      # 型チェック
pnpm lint    # Biome lint
pnpm format  # フォーマット確認（修正は format:write）
pnpm test    # Vitest smoke test
pnpm build   # Storybook build
```

## コンポーネント追加ワークフロー

1. `npx shadcn@latest add <component>` でベースを取得する（`components.json` 設定済み）
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
| コンポーネントカード・型定義・使い方ガイド | `src/components/ui/*` + `.design-sync/previews/*`（手書きプレビュー） |
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
