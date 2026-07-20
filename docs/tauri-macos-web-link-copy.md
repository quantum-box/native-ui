# Tauri macOS Webリンクコピー実装ガイド

`MacOSWebLinkCopyShortcut`を使い、アドレスバーを持たないTauri macOSアプリから
表示中画面のWeb版URLを共有する標準パターン。`⌘L`はURL、`⌘⇧L`はNotion等へ
ページ名付きリンクとして貼り付けられるrich clipboard dataをコピーする。

このパターンはTachyon Platform UIで、macOSアプリの実操作、clipboard payloadの
unit test、Web版で標準`⌘L`を妨げないことを検証している。

## 責務の分離

| レイヤー | 責務 |
|---|---|
| `MacOSWebLinkCopyShortcut` | shortcut判定、default action抑止、plain/rich clipboard書き込み、plain fallback |
| React adapter | macOS runtime判定、Web URLとページタイトルの解決、結果通知 |
| Tauri shell | target OS等、native runtimeに関する信頼できる情報の提供 |

コンポーネントはheadlessで、`@tauri-apps/api`や特定routerへ依存しない。consumerは
`enabled`、`getWebUrl`、`getPageTitle`を渡し、`onCopy` / `onError`をToast等へ接続する。

## 1. Web URLを固定originから組み立てる

Tauri WebViewの`window.location.origin`は`tauri://localhost`等になり、外部共有には
使えない。共有先originを信頼済みの固定値として持ち、現在のpath、query、fragmentだけを
引き継ぐ。

```ts
const WEB_ORIGIN = 'https://platform.example'

function webUrlForCurrentLocation(): string {
  const route = `${window.location.pathname}${window.location.search}${window.location.hash}`
  return new URL(route, WEB_ORIGIN).toString()
}
```

ユーザー入力からoriginを選ばせない。native routeとWeb routeが一致しないアプリでは、
adapter側で明示的なroute mappingを行う。

## 2. ページタイトルをrouteから解決する

rich linkの表示名には、現在画面を識別できる短いページタイトルを使う。タブタイトルや
breadcrumbと同じmappingを再利用し、未知routeにはアプリ名をfallbackとして返す。

```ts
function pageTitleForCurrentLocation(): string {
  const path = window.location.pathname
  if (path === '/apps') return 'Applications'
  if (path.startsWith('/coding-jobs')) return 'Coding Jobs'
  if (path === '/storage') return 'Storage'
  return 'Platform'
}
```

URLとタイトルのcallbackはkeydown時に呼ばれるため、route変更後も最新値が使われる。

## 3. macOS native runtimeでだけ有効化する

Web版で`⌘L`を抑止するとブラウザのアドレスバーへ移動できなくなる。user agentだけで
推測せず、Tauri commandやアプリのruntime helperからtarget OSを取得する。

```tsx
'use client'

import {
  MacOSWebLinkCopyShortcut,
  toast,
} from '@tachyon-sdk/native-ui'
import { useEffect, useState } from 'react'

export function NativeWebLinkShortcuts() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    let disposed = false
    fetchAppTargetOs().then(targetOs => {
      if (!disposed) setEnabled(targetOs === 'macos')
    })
    return () => {
      disposed = true
    }
  }, [])

  return (
    <MacOSWebLinkCopyShortcut
      enabled={enabled}
      getWebUrl={webUrlForCurrentLocation}
      getPageTitle={pageTitleForCurrentLocation}
      onCopy={result => {
        if (result.kind === 'url') {
          toast.success('Web版URLをコピーしました')
        } else if (result.kind === 'rich-link') {
          toast.success('リンク付きタイトルをコピーしました')
        } else {
          toast.info('リッチリンク非対応のためURLをコピーしました')
        }
      }}
      onError={() => toast.error('Web版URLをコピーできませんでした')}
    />
  )
}
```

`fetchAppTargetOs`はconsumer側の関数である。取得失敗時は`enabled=false`を維持し、
shortcutを登録しない。

## Clipboard data contract

| Shortcut | Clipboard MIME type | 内容 |
|---|---|---|
| `⌘L` | `text/plain` | Web URL |
| `⌘⇧L` | `text/html` | `<a href="Web URL">ページタイトル</a>` |
| `⌘⇧L` | `text/plain` | rich text非対応先向けWeb URL |

HTML内のURLとタイトルはコンポーネントがescapeする。`ClipboardItem`またはrich writeが
利用できないWebViewでは`writeText()`へfallbackし、`onCopy`へ`url-fallback`を返す。
plain writeも失敗した場合だけ`onError`を呼ぶ。

## キーボードとアクセシビリティ

- exact matchだけを扱う。`⌘L` / `⌘⇧L`へ`Option`や`Control`が加わった場合は無視する。
- `enabled=true`の間だけ`window`へlistenerを登録し、unmount時に必ず解除する。
- shortcutを処理するときだけ`preventDefault()`を呼ぶ。
- 結果通知はToastまたは`role=status` / `aria-live=polite`で読み上げられるようにする。
- メニューやヘルプ画面へ操作を載せる場合は`Kbd`で`⌘ L`と`⌘ ⇧ L`を表す。

## 検証チェックリスト

- Unit test: exact shortcut判定、HTML escape、plain URL、rich MIME types、plain fallback。
- Storybook interaction: `⌘L`と`⌘⇧L`を送出し、clipboard callと`onCopy`結果を確認。
- macOS `.app`: 任意のroute/query/fragmentでURLが一致し、Toastが表示される。
- rich paste: Notion等へ貼り付け、ページタイトルがclickable linkになる。
- plain paste: terminal等へ貼り付け、Web URLだけになる。
- Web版: `⌘L`が通常どおりブラウザのアドレスバーを選択する。
- Windows/Linux/mobile: shortcut listenerが登録されず、既存挙動が変わらない。

このガイドはmacOS native shell専用である。Windowsへ広げる場合は`Ctrl+L`がブラウザや
editorで持つ意味を別途評価し、同じcomponentへ無条件に追加しない。
