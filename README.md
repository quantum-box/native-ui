# @tachyon-sdk/native-ui

Linear / Notion のようなネイティブアプリらしい UI を実現する共通コンポーネントライブラリ。shadcn/ui（new-york）ベース。

- デザインシステム仕様: [docs/design-system.md](./docs/design-system.md)
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

コンポーネント一覧: Badge / Button / Command / Dialog / DropdownMenu / Input / Kbd / Label / Popover / Select / Separator / Tooltip

## 開発

```bash
corepack enable
yarn install
yarn ts      # 型チェック
yarn lint    # Biome lint
yarn format  # フォーマット確認（修正は format:write）
```

## コンポーネント追加ワークフロー

1. `npx shadcn@latest add <component>` でベースを取得する（`components.json` 設定済み）
2. 生成された import を**相対パスに修正**する（`@/lib/utils` → `../../lib/utils`）。
   consumer アプリの `@/` alias と衝突するため、ソース内で `@/` import は使用禁止
3. デザイントークンに合わせて調整する（高さ h-6/7/8、`text-sm`=13px、`duration-fast` 等）
4. `src/index.ts` から export する
5. `.design-sync/NOTES.md` の再同期チェックリストを確認のうえ `/design-sync` で Claude Design に反映する

## Claude Design 連携

このリポジトリは claude.ai/design の「Tachyon Native UI」プロジェクトと `/design-sync` で同期しています。設定は `.design-sync/` 配下（同期先の pin・変換設定・プレビュー）。トークンやコンポーネントを変更したら `/design-sync` を再実行してください。
