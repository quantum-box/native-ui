# Tauri macOS ウインドウタブ実装ガイド

`MacOSWindowTabs` と Tauri v2 の child WebView を組み合わせ、1枚のネイティブ
Window の中で複数画面をタブとして扱うための標準パターン。

この方式は Tachyon Platform UI で、タブ追加・切替時にウインドウや白い
WKWebView backing layerが一瞬露出しないことを実アプリで検証している。

## 責務の分離

| レイヤー | 責務 |
|---|---|
| `MacOSWindowTabs` | 38pxの見た目、traffic light用余白、drag region、タブ操作、キーボード、ARIA |
| React adapter | Tauri event購読、現在URLからのタイトル更新、2 frames後のready通知 |
| Rust/Tauri shell | child WebView生成、ready/selected/pending状態、表示切替、close、`⌘T`メニュー |

コンポーネントは `@tauri-apps/api` に依存しない。WebView labelやcommand名は各アプリが
決め、callback propsへ接続する。これによりStorybook、Web preview、複数のTauriアプリで
同じデザインを利用できる。

## 1. ウインドウをoverlay化する

`tauri.conf.json` のmacOS Windowでタイトル専用行を消し、traffic lightは残す。

```json
{
  "app": {
    "windows": [{
      "label": "main",
      "titleBarStyle": "Overlay",
      "hiddenTitle": true
    }]
  }
}
```

`MacOSWindowTabs` は高さ38px、左76pxをtraffic light用に空ける。アプリ固有の調整が
必要な場合だけ `windowControlsInset` を変更する。ネイティブ装飾を無効化すると角丸、影、
traffic lightまで失うため、このパターンではdecorationsを維持する。

## 2. multiwebviewを有効化する

Tauri v2 の `Window::add_child` を使うため、Rust依存で `unstable` featureを有効にする。

```toml
[dependencies]
tauri = { version = "2", features = ["unstable"] }
```

動的WebViewにもIPCを許可する。capabilityはWindowではなくWebView labelを対象にする。

```json
{
  "identifier": "default",
  "webviews": ["main", "app-tab-*"],
  "permissions": ["core:default", "opener:default"]
}
```

labelは `app-tab-<monotonic counter>` のようにプロセス内で一意にし、閉じたlabelを
再利用しない。外部URLをchild WebViewの初期URLとして受け付けず、アプリ内pathだけを
許可する。

## 3. 1 Window内でchild WebViewを切り替える

macOSのネイティブWindowは常に `main` の1枚だけを使う。初期WebViewも最初のタブとして
登録し、追加タブは同じWindowへ `Window::add_child` する。

管理する状態の最小単位は次のとおり。

```text
tabs: ordered WebView labels
selected: currently visible and focused label
ready: labels whose React content has painted
pending_activation: newly created label to select after ready
```

タブ切替ではネイティブWindowをhide/showしない。対象child WebViewを表示・focusし、以前の
child WebViewだけをhideする。選択タブを閉じる場合も、次のWebViewを先に表示してから対象を
破棄する。複数の `WebviewWindow` を切り替える方式は、切替順にかかわらずWindowが消える
フレームを作りやすいため採用しない。

## 4. 新規タブの白いちらつきを防ぐ

HTMLの `load` 完了は、ReactとWKWebViewの描画完了を意味しない。次のhandshakeを使う。

1. 新しいchild WebViewをWindowのclient sizeで生成する。
2. x座標をWindow幅の外側に置き、実表示サイズのまま画面外で描画させる。
3. React adapterはmount後に `requestAnimationFrame` を2回待つ。
4. adapterから `mark_tab_content_ready` commandを呼ぶ。
5. Rustはpending activationなら、描画済みWebViewを画面内へ移動してから前のWebViewをhideする。
6. background tabならready登録後もhideしたまま、後の選択に備える。

```tsx
useEffect(() => {
  let secondFrame = 0
  const firstFrame = requestAnimationFrame(() => {
    secondFrame = requestAnimationFrame(() => {
      invoke('mark_tab_content_ready')
    })
  })

  return () => {
    cancelAnimationFrame(firstFrame)
    cancelAnimationFrame(secondFrame)
  }
}, [])
```

新規WebViewを最初から現在画面へ重ねる、白背景をCSSで別色にする、
`PageLoadEvent::Finished` だけをready判定にする、という対策では初期backing layerの露出を
完全には防げない。

## 5. React adapterからコンポーネントへ接続する

```tsx
import { MacOSWindowTabs } from '@tachyon-sdk/native-ui'
import { invoke } from '@tauri-apps/api/core'

<MacOSWindowTabs
  tabs={tabs.map(tab => ({ id: tab.label, title: tab.title }))}
  activeTabId={tabs.find(tab => tab.selected)?.label ?? ''}
  onTabSelect={label => invoke('activate_tab', { label })}
  onTabClose={label => invoke('close_tab', { label })}
  onNewTab={() => invoke('create_tab', { path: null, activate: true })}
  tabListLabel='Application tabs'
  newTabLabel='新しいタブ'
  closeTabLabel={tab => `${tab.title}を閉じる`}
/>
```

Rust側は状態変更後に全child WebViewへ `tabs-changed` eventを送り、各adapterが一覧を再取得する。
タイトルはroute変更時に更新する。`⌘+クリック` は `create_tab({ path, activate: false })` とし、
現在画面と選択状態を維持したままbackgroundでreadyまで進める。

## キーボードとアクセシビリティ

- Fileメニューに `New Tab` / `CmdOrCtrl+T` を追加する。
- `⌘W` とネイティブclose requestは選択中WebViewだけを閉じる。最後の1タブならWindowを閉じる。
- tablistは `role=tablist`、各タブは `role=tab` と `aria-selected` を持つ。
- `ArrowLeft` / `ArrowRight` は隣のタブ、`Home` / `End` は端のタブへ移動する。
- closeとnew tabには、consumerの言語に合わせた明示的なラベルを渡す。
- drag可能なのはtraffic light余白と空き領域だけにし、タブ・close・plusは通常のbuttonにする。

## 検証チェックリスト

- Rust unit test: label一意性、ready前に選択しないこと、pending activationの一度だけのconsume。
- React test: title mapping、background openが `activate: false` を渡すこと、public export。
- Storybook: light/dark、長いタイトル、overflow、1/複数/close不可タブ。
- release `.app`: `+`、`⌘T`、menu、`⌘+click`、双方向切替、`⌘W`。
- Accessibility tree: native Windowは常に1つ、選択tabは1つ、new/close buttonにlabelがある。
- 画面観察: 新規タブ追加時と切替時にデスクトップや白いWebViewが1 frameも露出しない。

このガイドはmacOS専用shellのパターンであり、Web・Windows・Linux・mobileへ同じ
multiwebview制御を無条件に広げない。
