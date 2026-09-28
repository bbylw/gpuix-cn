# GPUIX

**React 与 Solid**，跑在 [GPUI](https://github.com/zed-industries/zed/tree/main/crates/gpui) 上。GPUI 是 Zed 的 GPU UI 框架。

用 TypeScript 编写 React 或 Solid 组件树。GPUIX 使用 Metal、DirectX 或 Vulkan 将其绘制出来。没有 Electron，也没有 WebView。

`useState` 与 JSX 依旧可用。布局、文本与输入都经由 GPUI 处理，而非 DOM。

> 本文是 [GPUIX 官方 README](https://github.com/remorses/gpuix/blob/main/README.md) 的中文版本，章节顺序与原仓库一致。示例与 API 以英文原文为准。

## 快速开始

### 三行命令

通过官方示例创建一个应用。该命令只会下载 `example-app/` 并安装它的依赖。无需克隆仓库、原生构建或安装 Rust 工具链。

```bash
bunx @gpuix/cli new my-app
cd my-app
bun run dev
```

`@gpuix/react` 会拉取对应你平台的原生渲染器。编辑 `app.tsx`，运行中的窗口会在保存时重新挂载。点击与键盘处理器会切换到新的组件树，而无需重建窗口。

> [!TIP]
> **你用 Solid 1 吗**
>
> 如果你用的是 Solid 而非 React，请从 [Solid 快速开始](#solid-快速开始) 入手。

### 第一个应用长什么样

整个应用就是一个 `app.tsx`。`useState`、事件处理器与内联样式都和 React 里一样：

```tsx
import { useState } from 'react'
import { render } from '@gpuix/react'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div style={{ padding: 24, backgroundColor: '#1a1a1a', height: '100%' }}>
      <div
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: 12,
          borderRadius: 8,
          cursor: 'pointer',
          backgroundColor: '#232323',
          hover: { backgroundColor: '#2c2c2c' },
        }}
      >
        <text style={{ color: '#e2e2e2' }}>Count: {count}</text>
      </div>
    </div>
  )
}

render(<App />, { title: 'My App', width: 800, height: 600 })
```

以 `bun --hot` 运行它：

```bash
bun --hot app.tsx
```

使用 `bun --hot`，而不是普通的 `bun`。这样保存时会在同一个窗口上重新挂载 React，而非打开第二个窗口。

> [!IMPORTANT]
> **给每一处 `<text>` 都设置 `color`。** GPUI 不会从父元素继承 `color`，因此没有颜色的文本会被绘制成**黑色**，在深色表面上会消失不见。

### 接下来

| 目标 | 页面 |
|---|---|
| 不想要示例应用，自己装依赖 | [从零开始构建](#从零开始构建) |
| 看运行起来的应用长什么样 | [示例](#示例) |
| 理解它为什么能跑起来 | [架构](#architecture) |
| 打包成可分发的 App | [打包成带图标的 App](#打包成带图标的-app) |

## 从零开始构建

如果你不想要示例应用，可以直接安装这些包：

```bash
bun add --exact @gpuix/react @gpuix/native react
bun add -d @types/react typescript
```

> [!WARNING]
> **把两个包钉到同一版本**
>
> **请将你的 adapter 与 `@gpuix/native` 固定到完全相同的版本。** GPUIX 仍处于 1.0 之前的版本，因此一次新发布都可能破坏其中任意一个包。adapter 会以版本区间的方式拉取 `@gpuix/native`，而这个区间可能在较旧的 adapter 下安装一个更新的原生二进制。请把两者都作为直接依赖添加，并一起升级。

### 1. 让 TypeScript 指向 GPUIX 的 JSX 类型

**`jsxImportSource` 是必需的。** 若缺少它，TypeScript 会使用 DOM 类型，导致 `<virtual-list>`、`<markdown>`、`<code>` 与 `style.hover` 都无法通过类型检查。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@gpuix/react",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

### 2. 编写入口文件

文件以 `render()` 结尾。该调用会创建窗口、挂载 React 并启动帧循环。

```tsx
import { useState } from 'react'
import { render } from '@gpuix/react'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div style={{ padding: 24, backgroundColor: '#1a1a1a', height: '100%' }}>
      <div
        onClick={() => setCount((c) => c + 1)}
        style={{
          padding: 12,
          borderRadius: 8,
          cursor: 'pointer',
          backgroundColor: '#232323',
          hover: { backgroundColor: '#2c2c2c' },
        }}
      >
        <text style={{ color: '#e2e2e2' }}>Count: {count}</text>
      </div>
    </div>
  )
}

render(<App />, { title: 'My App', width: 800, height: 600 })
```

> [!IMPORTANT]
> **给每一处 `<text>` 都设置 `color`。** GPUI 不会从父元素继承 `color`，因此没有颜色的文本会被绘制成**黑色**，在深色表面上会消失不见。

### 3. 运行它

```bash
bun --hot app.tsx
```

使用 `bun --hot`，而不是普通的 `bun`。这样保存时会在同一个窗口上重新挂载 React，而非打开第二个窗口。

### 4. 编译为二进制

```bash
bun build --compile app.tsx --outfile dist/app
./dist/app
```

该二进制自带渲染器，因此运行时无需 Bun，也无需安装 Node。若想让发布体积更小，可以不在 Bun 上运行这个 React 应用，而是改用 [hermes-node](https://github.com/remorses/gpuix/blob/main/website/src/guides/hermes.mdx)：那条路径是 **12 MB** 外加一个 **22 MB** 的原生 sidecar。完整的打包步骤见 [编译为二进制文件](#编译为二进制文件) 与 [打包成带图标的 App](#打包成带图标的-app)。

### 5. Shell 补全

为 `gpuix` 命令安装补全：

```bash
bun add -g @gpuix/cli
gpuix completions install
```

## 编译为二进制文件

```bash
bun build --compile app.tsx --outfile dist/app
./dist/app
```

该二进制自带渲染器，因此运行时无需 Bun，也无需安装 Node。

> [!TIP]
> **想让发布体积更小？**
>
> 可以不在 Bun 上运行这个 React 应用，而是改用 [hermes-node](https://github.com/remorses/gpuix/blob/main/website/src/guides/hermes.mdx)。那条路径是 **12 MB** 外加一个 **22 MB** 的原生 sidecar。具体步骤见该指南。

实测体积对照：在本机上，Bun 版 chat 的 `.app` 为 **82 MB**。Hermes 版 counter 的 `.app` 为 **34 MB**。完整的图标与签名流程见[打包成带图标的 App](#打包成带图标的-app)。

### 三个平台

Packager 只构建**宿主**操作系统。请在 macOS、Linux 与 Windows 上分别运行。

```bash
# macOS
bun build --compile app.tsx --outfile dist/app

# Linux
bun build --compile app.tsx --outfile dist/app

# Windows
bun build --compile app.tsx --outfile dist/app.exe
```

注意 Windows 的输出文件名带 `.exe` 后缀，而 macOS 与 Linux 不带。后续 packager 使用的 `binariesDir` 与这个文件名一致。

### 下一步

| 目标 | 页面 |
|---|---|
| 生成 `.app` / `.AppImage` / setup `.exe` | [打包成带图标的 App](#打包成带图标的-app) |
| 让应用能自我更新 | [自动更新](#auto-update) |

## 打包成带图标的 App

原始的 Mach-O 文件没有 Dock 图标。请用 [cargo-packager](https://github.com/crabnebula-dev/cargo-packager) 来包装该二进制文件。配置：[Config](https://docs.rs/cargo-packager/latest/cargo_packager/config/struct.Config.html)。CLI：[docs.rs/cargo-packager](https://docs.rs/cargo-packager/latest/cargo_packager/)。

```bash
cargo install cargo-packager --locked
```

### 生成 .icns

用一张 1024 的 PNG 生成 `.icns`，然后再打包。传入的是 `.icns`，而不是 1024 的 PNG —— cargo-packager 曾以 `No matching IconType` 拒绝过 1024 的 PNG。

```bash
mkdir AppIcon.iconset
sips -z 16 16 icon-1024.png --out AppIcon.iconset/icon_16x16.png
sips -z 32 32 icon-1024.png --out AppIcon.iconset/icon_16x16@2x.png
sips -z 32 32 icon-1024.png --out AppIcon.iconset/icon_32x32.png
sips -z 64 64 icon-1024.png --out AppIcon.iconset/icon_32x32@2x.png
sips -z 128 128 icon-1024.png --out AppIcon.iconset/icon_128x128.png
sips -z 256 256 icon-1024.png --out AppIcon.iconset/icon_128x128@2x.png
sips -z 256 256 icon-1024.png --out AppIcon.iconset/icon_256x256.png
sips -z 512 512 icon-1024.png --out AppIcon.iconset/icon_256x256@2x.png
sips -z 512 512 icon-1024.png --out AppIcon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out AppIcon.iconset/icon_512x512@2x.png
iconutil -c icns AppIcon.iconset -o AppIcon.icns
```

### packager.json

**Bun**（单个二进制文件）：

```json
{
  "productName": "My App",
  "version": "0.1.0",
  "identifier": "dev.example.app",
  "binariesDir": "dist",
  "outDir": "bundle",
  "binaries": [{ "path": "app", "main": true }],
  "icons": ["AppIcon.icns"],
  "formats": ["app"]
}
```

```bash
cargo packager --release --config packager.json
open "bundle/My App.app"
```

**Hermes** 需要把 `.node` 放在 exe 旁边。请把它列为**第二个二进制文件**，而非资源。资源放在 `Contents/Resources`。`dlopen` 会在 `Contents/MacOS` 中查找。

```json
{
  "binaries": [
    { "path": "gpuix-hermes", "main": true },
    { "path": "gpuix-native.darwin-arm64.node", "main": false }
  ]
}
```

`formats` 仅针对宿主操作系统：

| OS | `formats` | 输出 |
|---|---|---|
| macOS | `"app"`，然后 `"dmg"` | `.app`，可选的 `.dmg` |
| Windows | `"nsis"` | setup `.exe` |
| Linux | `"appimage"` | `.AppImage` |

### 输出文件名

使用 `productName: "My App"`、`version: "0.1.0"` 以及 `binaries: [{ "path": "app", "main": true }]` 时，packager 会写出：

| OS | `formats` | `outDir`（`bundle/`）中的文件 |
|---|---|---|
| macOS | `"app"` | `My App.app`，签名后再生成 `My App.app.tar.gz` + `My App.app.tar.gz.sig` |
| Linux | `"appimage"` | `app_0.1.0_x86_64.AppImage` + `.sig` |
| Windows | `"nsis"` | `app_0.1.0_x64-setup.exe` + `.sig` |

> [!IMPORTANT]
> **三个容易踩的命名细节**
>
> - macOS 的更新器需要的是 **`.app.tar.gz`**，而不是 `.app`，也不是 `.dmg`。Packager 只有在签名时才会给 `.app` 打 tar 包。
> - Linux 与 Windows 的文件名使用**二进制词干**（binary stem，即 `app`），而非 `productName`。
> - NSIS 的架构是 `x64`，而非 `x86_64`。若缺少同级的 `.sig` 会报错。

### --release 是什么

Packager 只构建**宿主**操作系统。请在 macOS、Linux 与 Windows 上分别运行。

`--release` 是 packager 的 profile（在 `binariesDir` 中查找 release 二进制）。它不是 `cargo build --release`。当设置了签名相关的环境变量时，签名会自动进行。来源：[cargo-packager CLI](https://docs.rs/cargo-packager/latest/cargo_packager/)。

### 加上自动更新

签名只需执行一次，接下来就可以让应用自我更新。见[自动更新](#auto-update)。

## auto-update

---
title: 自动更新
description: 'checkUpdate 的端点约定、签名产物与命名规则，以及更新后为什么必须退出。'
eyebrow: 打包与发布
---

打包**不会**自动开启更新。运行中的应用会调用 `@gpuix/native` 上的 `checkUpdate`。HTTP 使用的是与 `<img>` 相同的 `reqwest_client`。不存在第二个原生插件。

## 托管到 GitHub Releases

先创建 release。CI 会在每个操作系统上打包、签名，并上传 bundle 及其 `.sig`。应用会访问 `https://github.com/OWNER/REPO/releases/latest`。它会被重写为 `https://api.github.com/repos/OWNER/REPO/releases/latest`。更新器读取 `tag_name` 与 `assets`，然后 GET 同级的 `{name}.sig`。

## 只需签名一次

```bash
cargo packager signer generate
```

将私钥及其密码作为仓库密钥 `CARGO_PACKAGER_SIGN_PRIVATE_KEY` 与 `CARGO_PACKAGER_SIGN_PRIVATE_KEY_PASSWORD` 存储。把**公钥**放入应用。

```tsx
import { checkUpdate } from '@gpuix/native'
import { render } from '@gpuix/react'
import { App } from './app'

async function maybeUpdate() {
  const update = await checkUpdate('0.1.0', {
    endpoints: ['https://github.com/OWNER/REPO/releases/latest'],
    pubkey: '<public key from signer generate>',
  })
  if (update) await update.downloadAndInstall()
}

maybeUpdate()
render(<App />)
```

`https://github.com/OWNER/REPO` 是同一个端点。

## 上传产物

请自行创建 GitHub release，然后再打包并上传。`--clobber` 会在 CI 重试时替换某个 asset。不要上传 feed JSON。

```bash
# macOS
bun build --compile app.tsx --outfile dist/app
cargo packager --release --config packager.json
gh release upload v0.1.0 \
  "bundle/My App.app.tar.gz" \
  "bundle/My App.app.tar.gz.sig" \
  --clobber

# Linux
bun build --compile app.tsx --outfile dist/app
cargo packager --release --config packager.json
gh release upload v0.1.0 \
  bundle/app_0.1.0_x86_64.AppImage \
  bundle/app_0.1.0_x86_64.AppImage.sig \
  --clobber

# Windows
bun build --compile app.tsx --outfile dist/app.exe
cargo packager --release --config packager.json
gh release upload v0.1.0 \
  bundle/app_0.1.0_x64-setup.exe \
  bundle/app_0.1.0_x64-setup.exe.sig \
  --clobber
```

> [!IMPORTANT]
> **更新后必须退出进程**
>
> `downloadAndInstall()` 会替换已打包的文件。它**不会**自动重启。请在它返回后退出，否则下次启动用的还是旧应用。

## 平台支持

HTTPS 支持位于原生 crate 中。这在 **Bun** 与 **hermes-node** 上可用。它在浏览器的 wasm 构建中不存在。

仓库必须是 **public** 的，否则 GitHub 的 API 会返回 404。可选：在 `api.github.com` 前放一层 Cloudflare 缓存。用的是同一份 GitHub JSON，并非自定义 schema。

## 文件名约定

这些约定必须与 packager 的输出一致，否则更新器会找不到同级的 `.sig`：

| OS | 需要上传的文件 |
|---|---|
| macOS | `My App.app.tar.gz` + `My App.app.tar.gz.sig` |
| Linux | `app_0.1.0_x86_64.AppImage` + `.sig` |
| Windows | `app_0.1.0_x64-setup.exe` + `.sig` |

详见[打包成带图标的 App](#输出文件名)。

## 示例

### 仓库内的示例

| 示例 | 运行 | 展示内容 |
|---|---|---|
| **todo** | 在 [`example-app/`](https://github.com/remorses/gpuix/tree/main/example-app) 中执行 `bun run dev` | 起点：单个文件、一个 `<virtual-list>`、一个原生 `<input>`，以及一个带动画的侧边栏 |
| **blurred window** | `bun run blurred-window` | macOS 磨砂玻璃表面，使用 GPUI 原生的 vibrancy 背景与透明标题栏 |
| **chat** | `bun --hot chat.tsx` | 一个 GPUIX 应用：透明标题栏、带动画的侧边栏、按线程的对话记录、示例回复、输入框，以及 `<markdown>` |
| **timeline** | `bun --hot timeline.tsx` | 视频编辑器时间轴：片段拖拽、带吸附的边缘裁剪、播放头拖动、框选、指针下缩放，以及带冻结标尺与轨道列的双轴平移 |
| **mail** | `bun --hot mail.tsx` | 类 Superhuman 的邮件客户端：三栏布局、线程列表，以及一封 Framer 新闻信 |
| **disktree** | `npx disktree [dir]`，源码位于 [`disktree/`](https://github.com/remorses/gpuix/tree/main/disktree) | [tobi/disktree](https://github.com/tobi/disktree) 的移植版，已发布到 npm：在 worker 线程上扫描文件夹或整块磁盘，在磨砂窗口上绘制半透明矩形树图，并对可回收空间排序 |
| **native-text** | `bun --hot native-text.tsx` | 三个原生文本组件，带切换标签页 |
| **counter** | `bun --hot counter.tsx` | 尽可能小的应用：状态、事件、hover |
| **diff** | `bun --hot diff.tsx` | 一个用 JS 中的 `<div>` 和 `<text>` 组合而成的 diff 查看器，用于对比 |
| **web** | 从仓库根目录执行 `bun run web` | 在浏览器 canvas 中用 WebGPU 渲染的 ChatGPT 示例 |

待办应用位于 [`example-app/`](https://github.com/remorses/gpuix/tree/main/example-app)，可以通过 `bunx @gpuix/cli new` 复制。其余示例位于 [`examples/`](https://github.com/remorses/gpuix/tree/main/examples)。

> [!NOTE]
> 那些 `bun --hot` 命令需要克隆本仓库并进行本地原生构建，单靠已发布的包无法运行。

### 下载独立构建

或者从 [GitHub release](https://github.com/remorses/gpuix/releases) 下载一个独立的 **chat** 构建。无需安装 Bun 或 Rust。

```bash
tar -xzf example-chat-aarch64-apple-darwin.tar.gz
./example-chat-aarch64-apple-darwin
```

压缩包会保留可执行位，因此无需 `chmod` 步骤。macOS 在首次运行时仍可能拦截未签名的二进制文件。请右键点击该文件，选择 **打开** 并确认。

在 Windows 上，下载 `example-chat-x86_64-pc-windows-msvc.exe` 并双击运行。在 Linux 上，文件是 `example-chat-x86_64-unknown-linux-gnu.tar.gz`。

### 浏览器中的 Web 示例

Web 示例打包了与桌面 chat 示例相同的 React 应用与协调器（reconciler）。wasm-bindgen 会把 mutation 与事件回调暴露给既有的 retained tree 和 `GpuixView`，它们运行在 GPUI 的浏览器平台之上。

Web 构建需要 nightly 版 Rust 以及与之匹配的 wasm-bindgen CLI：

```bash
rustup toolchain install nightly --component rust-src --target wasm32-unknown-unknown
cargo install wasm-bindgen-cli --version 0.2.127 --locked
bun run web
```

生成的 Wasm 使用了共享内存，因此页面必须是跨源隔离（cross-origin isolated）的。生产服务器必须在**顶层文档**上发送以下响应头：

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

`require-corp` 进而会约束**跨源**子资源，这些子资源必须自己提供 CORS 或 `Cross-Origin-Resource-Policy`。只要把 JavaScript 与 Wasm 和文档放在同一源下，就无需其他操作。

`bun run web` 只有在 `packages/native/wasm` 缺失时才会重新构建 Wasm。在修改了 Rust 代码后，可以强制重建：

```bash
bun scripts/web.ts --rebuild
```

#### 浏览器中的热重载

`bun run web` 通过 Bun 的前端开发服务器来提供示例，因此对 `examples/chat.tsx` 的修改会以一次 **React Fast Refresh** 更新的形式到达。组件会就地替换，且 `useState` 得以保留，这意味着输入框文本、侧边栏选中项以及滚动位置都会保持在原处。GPUI 的 canvas 绝不会被重建，约 19 MB 的 Wasm 模块也绝不会被重新拉取。

Fast Refresh 只适用于「所有导出都是组件」的模块。如果修改的是其他内容（例如入口文件），Bun 会改为重载页面。两条路径都正确，只是重载会慢一些。

Wasm 这半部分是**单例，绝不能重复求值**。`WebGpuixRenderer::init` 在其 thread-local 应用已经存在时会以 `GPUIX web is already running` 报错，而 GPUI 的浏览器平台会把自己的 canvas 追加到 `<body>`。保护它的关键并不在于它身处 `node_modules` 中 —— Bun 会把它和你的应用打包进同一个客户端注册表。关键在于 Bun 只会重新运行**改动过的**模块，然后沿其导入者向上回溯，因此未改动的依赖会保持已求值且被缓存。由此得出两条规则：

- 不要在入口文件中调用 `import.meta.hot.accept("./your-app", ...)`。Bun 哪怕在被导入模块已经自行接受（self-accepted）时，也会运行导入者的依赖接受回调，于是该回调会在一次成功的刷新之上再次挂载组件树，并丢弃所有 `useState`。
- 把 `@gpuix/native` 的导入放在一个「永远不会成为 Refresh 边界、也绝不被显式接受」的模块里。

## architecture

---
title: 架构
description: '三层数据流：JS 侧的 mutation 队列、Rust 侧的 RetainedTree，以及 GPUI 每帧的立即模式重建。'
eyebrow: 核心概念
---

GPUIX 通过一套**基于共享 mutation 的运行时**把 React 和 Solid 桥接到 GPUI。桌面应用使用 napi-rs；浏览器应用则通过 wasm-bindgen 加载同一个 Rust 渲染器。每个框架 adapter 都会把发生变化的元素收集成一次原子的 mutation 批次。Rust 将该批次应用到一棵 retained 元素树上，GPUI 每一帧都会读取这棵树。

```text
┌─────────────────────────────────────────────────────────────────┐
│  React or Solid (JavaScript)                                    │
│                                                                 │
│  function App() {                                               │
│    const [count, setCount] = useState(0)                        │
│    return (                                                     │
│      <div style={{ display: 'flex', gap: 8 }}>                  │
│        <div onClick={() => setCount(c => c + 1)}>               │
│          Count: {count}                                         │
│        </div>                                                   │
│      </div>                                                     │
│    )                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                    │ napi desktop / wasm-bindgen browser
                    │ applyBatch([
                    │   ["createElement", 1, "div"],
                    │   ["setStyle", 1, {...}],
                    │   ["setRoot", 1]
                    │ ])
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Rust host bridge                                               │
│                                                                 │
│  RetainedTree ── stores elements, styles, event flags           │
│       │                                                         │
│       ▼  each GPUI frame                                        │
│  GpuixView::render() → build_element() → GPUI elements          │
└─────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  GPUI                                                           │
│                                                                 │
│  Metal, DirectX, Vulkan, or browser WebGPU / WebGL2             │
│  Flexbox layout via Taffy                                       │
└─────────────────────────────────────────────────────────────────┘
```

## 为什么这样可行

GPUI 是一个**立即模式（immediate-mode）**的 UI 框架 —— 它每一帧都会重建整个元素树。GPUIX 没有去对抗这一点，而是顺势而为：

1. React 或 Solid 的 adapter 检测到状态变化，并将宿主 mutation（`createElement`、`setStyle`、`appendChild` 等）排入队列。
2. `applyBatch()` 校验并把完整的提交应用到 Rust 的 **RetainedTree**。
3. 在每一帧 GPUI 中，`GpuixView::render()` 遍历 RetainedTree 并调用 `build_element()` 来生成临时的 GPUI 元素。
4. GPUI 对其进行布局（Taffy flexbox）并渲染到 GPU。
5. 只有**发生变化的元素**才会跨越 FFI 边界。框架 adapter 发送的是最小化的 mutation。

换句话说：JS 侧维护的是一棵**保留树**（retained tree），GPUI 侧维护的是**立即模式**的每帧重建。昂贵的那部分（布局与绘制）留在 GPUI 里，昂贵但不必要的那部分（跨 FFI 的变更传输）被压到最小。

## Mutation API

JS 与 Rust 之间的 mutation 接口是同一个原子方法。桌面端使用 napi，浏览器端使用 wasm-bindgen：

```ts
type MutationHost = Pick<GpuixRenderer, 'applyBatch'>
```

`createMutationQueue` 只需要它。窗口尺寸、焦点与选区使用更小的宿主类型（`WindowSizeHost`、`SelectionHost`）。`NativeRenderer` 就是 `MutationHost` 再加上这些方法，因此一个假的（fake）实现只需实现 `applyBatch` 即可。

## 元素 ID 的分配

元素 ID 是 JS 端用递增计数器生成的普通数字。React 在并发渲染模式下可能会放弃某些工作，因此 GPUIX 会把新的宿主节点暂存在 JS 中，直到 React 在提交（commit）阶段把被接受的子树安置好。只有在那时，它的 mutation 才会被加入批次。`applyBatch()` 会以原子方式应用这次被接受的提交，并把 Rust 视图标记为「下一帧需要重绘（dirty）」。

## 事件流

事件从 GPUI 经由桌面端的 `ThreadsafeFunction`（以及浏览器端的 wasm-bindgen 回调）回传到 React。

```text
User clicks element id=3
       │
       ▼
GPUI fires on_click on the element
       │
       ▼
Rust closure calls emit_event_full(callback, 3, "click", {x, y, ...})
       │
       ▼
Desktop ThreadsafeFunction / browser callback sends EventPayload
       │
       ▼
JS event registry: eventHandlers.get(3)?.get("click")?.(payload)
       │
       ▼
React handler runs: onClick={() => setCount(c => c + 1)}
       │
       ▼
State update triggers re-render → reconciler sends mutations back to Rust
```

事件处理器存放在 JS 侧的一个注册表中，以 `(elementId, eventType)` 为键。Rust 只知道某个元素**是否有**监听器（通过 `setEventListener`），而不知道闭包本身 —— 真正的处理器位于 JS 中。

> [!NOTE]
> 这个设计的直接后果是：GPUI **不会**像 DOM 那样让点击冒泡。命中测试在 GPUI 的绘制盒子列表上是扁平的，命中哪个就派发给哪个。相关注意事项见[支持的样式](#styling)与[无样式控件](#headless-controls)。

## 两个框架的分工

React 与 Solid 共用同一套 ID、mutation 队列、事件路由、测试 API、自动化客户端、观察者以及文本搜索匹配器。它们各自框架相关的调度器与组件上下文则保留在各自的 adapter 包中。

## Solid 快速开始

安装 Solid 以及官方的 Solid adapter：

```bash
bun add --exact @gpuix/solid @gpuix/native solid-js
```

### 使用 Solid 保留的 JSX

preload 会为 Solid 的通用渲染器编译应用的 `.tsx` 与 `.jsx` 文件，并选择响应式的客户端运行时。

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "@gpuix/solid",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  }
}
```

```toml
preload = ["@gpuix/solid/preload"]
```

```tsx
import { createSignal } from 'solid-js'
import { render } from '@gpuix/solid'

function App() {
  const [count, setCount] = createSignal(0)
  return (
    <div style={{ padding: 24, backgroundColor: '#1a1a1a', height: '100%' }}>
      <div onClick={() => setCount((value) => value + 1)}>
        <text style={{ color: '#e2e2e2' }}>Count: {count()}</text>
      </div>
    </div>
  )
}

render(() => <App />, { title: 'Solid GPUIX', width: 800, height: 600 })
```

直接运行即可。无需包装命令，也无需 Vite 配置。

```bash
bun app.tsx
bun --hot app.tsx
```

> [!IMPORTANT]
> 注意 `jsx` 是 `"preserve"` 而不是 `"react-jsx"`，并且 `jsxImportSource` 指向 `@gpuix/solid`。

### 生产构建

对于生产环境的 `Bun.build`，传入导出的插件：

```ts
import solidPlugin from '@gpuix/solid/bun-plugin'

await Bun.build({
  entrypoints: ['./app.tsx'],
  target: 'bun',
  outdir: './dist',
  plugins: [solidPlugin],
})
```

### 版本范围

`@gpuix/solid` 面向稳定的 Solid 1.9。其 peer 版本区间为 `>=1.9 <2`。

完整的 Solid adapter API 见 [Solid 指南](https://github.com/remorses/gpuix/blob/main/website/src/guides/solid.mdx)。

### 两个框架共享什么

React 与 Solid 共用同一套 ID、mutation 队列、事件路由、测试 API、自动化客户端、观察者以及文本搜索匹配器。它们各自框架相关的调度器与组件上下文则保留在各自的 adapter 包中。详见[架构](#architecture)与[支持的元素](#支持的元素)。

## 构建 GPUIX 自身

本节面向**参与 GPUIX 自身开发**的人。若只是用它来构建应用，请改看[快速开始](#快速开始)。安装这些包不需要 Rust 工具链，也不需要 submodule。

### 前置条件

1. Rust 工具链
2. Node.js 18+
3. 含 Metal Toolchain 的 Xcode（macOS）

```bash
# 如需要则安装 Metal Toolchain
xcodebuild -downloadComponent MetalToolchain

# 安装依赖
bun install

# 检出被固定的 GPUI fork
git submodule update --init --recursive

# 构建原生包
cd packages/native
bun run build

# 构建 React 包
cd ../react
bun run build

# 构建 Solid 包
cd ../solid
bun run build

# 运行示例（长时会话建议使用 tmux）
cd ../../examples
bun --hot counter.tsx
```

更多开发流程见[开发 Rust 侧](#developing-rust)。

## render() 与窗口选项

```tsx
import React, { useState } from 'react'
import { render } from '@gpuix/react'

function App() {
  const [count, setCount] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 8, padding: 16 }}>
      <div
        style={{ backgroundColor: '#3b82f6', borderRadius: 8, padding: 12, cursor: 'pointer' }}
        onClick={() => setCount(c => c + 1)}
      >
        <div style={{ color: '#ffffff' }}>Count: {count}</div>
      </div>
    </div>
  )
}

render(<App />, {
  title: 'My App',
  width: 800,
  height: 600,
  titlebarTransparent: true,
  windowBackground: 'blurred',
  trafficLightX: 16,
  trafficLightY: 17,
})
```

`render()` 会创建原生窗口、挂载 React 并启动帧循环。红色的红绿灯按钮会退出进程。需要从终端再次启动应用。

| 选项 | 取值 | 用途 |
|---|---|---|
| `titlebarTransparent` | boolean | 隐藏原生标题栏，让应用把装饰元素绘制在红绿灯按钮之下 |
| `windowBackground` | `"opaque"`（默认）、`"transparent"`、`"blurred"` | 窗口填充。`"blurred"` 即 macOS 的 vibrancy 背景 |
| `trafficLightX` / `trafficLightY` | 像素 | 红绿灯按钮原点。chat 示例使用的是 `(16, 17)` |
| `transparent` | boolean | 当 `windowBackground` 未设置时，等同于 `windowBackground: "transparent"` |
| `appName` | string | macOS `Hide X` 与 `Quit X` 条目里的名称。默认为 `title` |
| `focus` | boolean，默认 `true` | 设为 `false` 时窗口在活跃应用之后打开，类似 `open -g` |
| `show` | boolean，默认 `true` | 设为 `false` 时窗口以隐藏方式打开。调用 `activateWindow()` 来显示它 |

在保存后再次调用它，它会在同一个窗口上重新挂载组件树。

### 其它 render 选项

| 选项 | 用途 |
|---|---|
| `onKeyDown` / `onKeyUp` | 窗口级键盘监听器，见[焦点与键盘导航](#渲染器键盘回调) |
| `onSelectionChange` | 窗口级选区变更回调，见[文本选区](#text-selection) |
| `debugFrameOverlay` | 帧时间叠加层，见[调试帧叠加层](#debug-overlay) |
| `keyboardFocusDim` | 关闭「其余元素变暗」的默认焦点行为 |
| `tabNavigation` | `false` 关闭 Tab 的默认焦点移动 |

### macOS 菜单栏

GPUIX 会为你安装好应用菜单栏，因此一个全新的应用就已经响应 `⌘Q`、`⌘H`、`⌥⌘H`、`⌘M` 与 `⌘W`。若没有它，`NSApp.mainMenu` 会是 nil，macOS 绘制出的菜单栏是空的，而这些快捷键根本不存在：AppKit 只通过菜单项来提供它们。

```text
Apple    <executable>             Window
         ├ Services               ├ (AppKit window tiling)
         ├ Hide <appName>   ⌘H    ├ Minimize          ⌘M
         ├ Hide Others     ⌥⌘H    ├ Zoom
         ├ Show All               ├ Close Window      ⌘W
         └ Quit <appName>   ⌘Q    └ (open windows)
```

> [!NOTE]
> **`appName` 并不会设置应用菜单的标题。** macOS 从可执行文件获取该标题，因此开发期间 `bun app.tsx` 显示的是 `bun`，而 `bun build --compile` 编译出的二进制显示的是它自己的文件名。只有真正的 `.app` bundle 才会改变它。`appName` 只会影响菜单内部的条目，仅此而已。

**没有 Edit 菜单**，这是有意为之。菜单的按键等效（key equivalent）会被 AppKit 在窗口接收到按键事件之前就消费掉，因此一个带有 `⌘C` 的 Edit 菜单会把按键从文本选区以及 `<input>` 手中抢走。

### 用 render()，而不是 createRenderer()

在应用入口处请使用 **`render()`**，而非 `createRenderer()`。`bun --hot` 在保存时会重新运行整个文件。若用 `createRenderer()` 加 `init()`，就会再构建一个宿主。`render()` 是幂等的：第一次调用拥有窗口，后续调用只会重新挂载 React。

`createRenderer()`、`createRoot()` 与 `startFrameLoop()` 仍然公开，供测试和自定义宿主使用。当你已经持有一个 renderer 时，可以把 `{ renderer }` 传入 `render()`。

**一个 renderer 驱动一个 root。** 一个 renderer 拥有一个窗口、一个原生 root id 和一张事件映射表，因此若该 renderer 已经有了一个已挂载的 root，`createRoot()` 会抛出异常。在创建另一个 root 之前，请先对第一个 root 调用 `unmount()`；`render()` 已经替你做了这件事。

### 帧循环

在 **macOS** 上，`startFrameLoop` 会以固定频率（默认约 125fps）调用 `renderer.tick()`。每一帧只排空已就绪的 AppKit 事件与 Core Foundation 源，随后便返回，不会等待下一次原生唤醒。Bun 的定时器、socket、promise 以及 PTY 回调都可以在帧之间运行。传入 `{ frameMs }` 可改变频率，并对返回的控制句柄调用 `.stop()` 来结束它。

在 **Windows 与 Linux** 上，GPUI 在一个专用的 Rust UI 线程上运行其正常的阻塞式原生事件循环。`tick()` 并不会驱动该循环。它只报告 UI 线程是否仍处于 `Platform::run` 内部。`startFrameLoop` 仍然会创建一个 JavaScript 定时器，以便「最后一个窗口关闭」能够返回 false、而 `render()` 能够 `process.exit`，从而与 macOS 保持一致。所有平台都使用 GPUI 原生的平台、窗口、渲染器、输入、滚动、剪贴板、键盘与 IME 实现。内嵌的 macOS 运行循环扩展来自被固定的 GPUIX fork。

> [!IMPORTANT]
> 在 macOS 上，**绝不要**用 `setImmediate` 循环来驱动 `tick()`。那会以每秒数万次的频率空转，在完全空闲的应用上烧掉 **73% 的 CPU**，而按节奏驱动时只有 **1%**。

**运行时抛错不会冻结窗口。** 帧循环会捕获来自 `tick()` 的错误，原生事件回调会捕获来自 React 处理器的抛错，而 `render()` 会安装 `uncaughtException` / `unhandledRejection` 监听器，从而让 bun 保持存活。窗口会显示堆栈，以及一个**重新加载**按钮，用于重新挂载上一次的 `render()` 树。在 `bun --hot` 下保存也会重新挂载。进程不会退出。

## 后台启动与 agent 驱动

`focus: false` 会以**不抢占焦点**的方式打开窗口。你正在输入的应用会保留光标与活跃标题栏。`show: false` 则更进一步，根本不打开任何窗口，于是进程带着一个存活的 React 树运行，但屏幕上什么都没有。

```tsx
render(<App />, { title: 'Notes', focus: false })
```

> [!IMPORTANT]
> **只要由编码 agent 运行你的应用，就该开启这个选项。** 否则，一个为了检查成果而启动应用的 agent，会在每次迭代时把这个窗口猛地拽到你正在做的事情前面，哪怕你话才说到一半。使用 `focus: false` 后，agent 依然能拿到一个真实的、由 GPU 渲染的窗口来截图和点击，而你则可以保留自己的编辑器。

| 平台 | `focus: false` | `show: false` |
|---|---|---|
| macOS | 窗口排到最前但不成为 key 窗口，类似 `open -g` | 生效 |
| Windows | `SW_SHOWNOACTIVATE` | 生效 |
| Linux | **被忽略**，窗口以聚焦状态打开 | **被忽略** |

在 macOS 上，进程仍然会获得一个 **Dock 图标**。GPUI 设置的是常规激活策略，因此目前还没有菜单栏代理（menu-bar-agent）模式。若要真正的后台守护进程，请从 `~/Library/LaunchAgents/` 下的 `launchd` agent 来运行应用；launchd 永远不会激活该进程。

### 让 agent 来驱动应用

通过环境变量让焦点变为「按需开启」，这样人类运行时行为正常，而 agent 运行时不会来打扰你：

```tsx
render(<App />, {
  title: 'Notes',
  focus: process.env.GPUIX_BACKGROUND !== '1',
})
```

```bash
bun app.tsx                      # 你：窗口来到最前
GPUIX_BACKGROUND=1 bun app.tsx   # agent：窗口在你的编辑器之后打开
```

`launch()` 会直接透传 `env`，因此 agent 脚本只需设置一次，之后每一次截图、点击与断言都运行在一个永远不会打断你的窗口上：

```ts
import { launch } from '@gpuix/react/automation'

const app = await launch({
  command: 'bun',
  args: ['app.tsx'],
  env: { GPUIX_BACKGROUND: '1' },
})

await app.getByTestId('bump').waitFor()
await app.getByTestId('bump').click()
await app.screenshot({ path: 'tmp/after-click.png' })
await app.close()
```

唯一改变的是焦点。**自动化并不需要焦点。** `click()` 命中最后一次绘制的边界框，`screenshot()` 读取 GPU 表面，因此两者在窗口位于你编辑器之后时也能工作，甚至在根本不在屏幕上的 `show: false` 窗口上也能工作。

```text
  agent ──►  launch({ env: { GPUIX_BACKGROUND: '1' } })
                │
                ▼
           GPU window renders and paints without activation
                │
                ├──►  getByTestId(..).click()   ✓  hits the last painted bounds
                ├──►  screenshot({ path })      ✓  reads the GPU surface
                ├──►  fill() / press()          ✓  uses the live input pipeline
                └──►  close()

  you   ──►  keep typing, your editor stays frontmost the whole time
```

`fill()` 与 `press()` 使用的是实时的 GPUI 窗口输入管线。它们无需激活桌面窗口即可工作。**Linux 会忽略 `focus`**，因此那里的 agent 仍然会拿到一个获得焦点的窗口。

> [!TIP]
> 在可以的时候，优先使用 `createTestRoot()`。它**完全不打开窗口**，因此没有任何东西能抢走焦点，键盘输入也能正常工作。当检查需要一个真实的窗口、真实的 GPU 绘制或真实的进程时，再退而使用 `launch()` 加 `focus: false`。

完整的自动化 API 见[自动化](#automation)。

## 窗口控制与文件选择器

### 窗口控制

桌面渲染器暴露了 GPUI 原生的最小化、缩放与全屏操作。可通过 `useGpuixRequired()` 或 `createRenderer()` 返回的 renderer 来访问它们。

```tsx
function WindowControls() {
  const renderer = useGpuixRequired()
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div onClick={() => renderer.minimizeWindow?.()}>Minimize</div>
      <div onClick={() => renderer.zoomWindow?.()}>Zoom</div>
      <div onClick={() => renderer.toggleFullscreen?.()}>Fullscreen</div>
    </div>
  )
}
```

`minimizeWindow()`、`zoomWindow()` 与 `toggleFullscreen()` 在 macOS、Windows、Linux 和 FreeBSD 上均可使用。`zoomWindow()` 使用的是平台原生的缩放或最大化操作。这些方法在浏览器渲染器中不可用。

### 文件选择器

`promptForPaths()` 会打开操作系统的文件选择器。它解析为所选的绝对路径，若用户取消则返回 `null`。

```tsx
import { useGpuixRequired } from '@gpuix/react'

function AttachFiles() {
  const renderer = useGpuixRequired()

  const attach = async () => {
    const paths = await renderer.promptForPaths?.({
      files: true,
      multiple: true,
      prompt: 'Attach',
    })
    if (paths) console.log(paths)
  }

  return <div onClick={attach}>Attach files</div>
}
```

不带任何选项时，选择器会选择一个文件。设置 `directories: true` 则可改为选择目录。macOS 可以在一次提示里同时选择文件与目录；Windows 与 Linux 则要求每次提示只选一种。无效的选项以及平台选择器失败都会 reject。浏览器端的方法会 reject，因为浏览器返回的是 `File` 对象，而非操作系统路径。一个被注入的自定义 renderer 可以省略这一可选能力。

> [!NOTE]
> 在当前的 Windows GPUI 后端上，系统对话框无法区分取消与其他 `IFileDialog::Show` 错误，因此两者都会解析为 `null`。这需要在 GPUI 中修复，GPUIX 才能上报那些错误。

### 激活窗口

`activateWindow()` 会把窗口提到最前并让它获得焦点。这是显示 `show: false` 窗口的唯一方式。可在任意组件里通过 `useGpuixRequired()` 获取它：

```tsx
import { useGpuixRequired } from '@gpuix/react'

function Reveal() {
  const renderer = useGpuixRequired()
  return <div onClick={() => renderer.activateWindow?.()}>Show</div>
}
```

在 React 之外，可以在 `createRenderer()` 返回的 renderer 上调用它。更多背景见[后台启动与 agent 驱动](#后台启动与-agent-驱动)。

## flushSync

该 root 是一个**并发 root**，因此 React 会在随后的微任务中提交。`flushSync` 会强制让渲染与提交在返回之前完成，这与 `react-dom` 中的行为一致。

```tsx
import { flushSync } from '@gpuix/react'

flushSync(() => setSidebarOpen(true))
```

它只 flush **React 本身**，一直到底层的一次 `applyBatch` 调用。返回之后，原生 retained 树（包括样式与文本）就是最新的。

> [!NOTE]
> 它**不会**等待 GPUI。布局与绘制仍然发生在下一帧，就像浏览器在 DOM 变更之后才绘制一样。要看到像素，可以在应用里等一帧，或者在测试中调用 `renderer.flush()`。

当一个顺序相关的 bug 依赖于提交先落地时使用它：例如先卸载再重新挂载，或者先改变状态再喂入下一个事件。

## debug-overlay

---
title: 调试帧叠加层
description: '叠加层显示的是绘制时间而非 FPS。三个模式、四项统计，以及性能回归测试怎么跑。'
eyebrow: 窗口与渲染器
---

GPUI 会在布局之后把帧时间统计绘制进窗口。这个叠加层并不是一个 React 元素 —— 一个 React 的 FPS 标签会每帧都更新，反而造成更多工作。

```tsx
render(<App />, { title: 'My App', debugFrameOverlay: 'full' })
```

| 模式 | 你看到的内容 |
|---|---|
| `hidden` | 无（默认） |
| `minimal` | 上次绘制时间，例如 `8.3 MS` |
| `full` | `CUR`、`1%`、`10%`、`MAX`、`FRAMES` |

或者直接调用 renderer：

```ts
renderer.setDebugFrameOverlay('full')
renderer.cycleDebugFrameOverlay()
renderer.resetDebugFrameOverlayStats()
renderer.getDebugFrameOverlay() // 'hidden' | 'minimal' | 'full'
renderer.getDebugFrameOverlayStats()
// { currentMs, p90Ms, p99Ms, maxMs, frames, samples }
```

`p90Ms` 是叠加层的 **10%** 那条线。`p99Ms` 是 **1%** 那条线。它们代表的是缓慢的尾部。

> [!TIP]
> **8.3 MS 约等于 120 Hz**
>
> 叠加层显示的是**绘制时间**，而非 FPS。

## 性能回归测试

chat 示例为此提供了一个回归测试：`examples/chat.perf.test.tsx`。它对挂载、滚轮绘制与侧边栏点击计时。它断言的是 p95，而非每一帧。

默认的示例套件排除了这个硬件计时测试，以免共享 CI runner 的方差导致功能检查失败。请在目标 Mac 上显式运行它。

在 macOS 上，`THROTTLE=utility` 会在 `taskpolicy -c utility` 之下重启进程。这会把工作钉在 E-core 上。它是对 **M1/M2 Air CPU** 的近似，而非 Chrome 的 6 倍。GPU 与 RAM 仍然很快。`THROTTLE=background` 更慢。

```bash
cd examples
THROTTLE=utility bun run test:perf
THROTTLE=utility bun --hot chat.tsx
```

与虚拟列表的裁剪策略配合使用效果最好，参见[虚拟列表](#可平移表面必须裁剪)。

## 热重载

### 1. 文件以 render() 结尾

```tsx
import { render } from '@gpuix/react'

function App() {
  return <div style={{ padding: 16 }}>hello</div>
}

render(<App />, { title: 'My App', width: 800, height: 600 })
```

不要在此文件中调用 `createRenderer()` 或 `init()`。`bun --hot` 在保存时会重新运行整个入口。第二次 `init()` 会打开第二个窗口。

### 2. 用 bun --hot 启动应用

优先使用 **`bun --hot`**，而非普通的 `bun` 或 `tsx` 运行。没有 `--hot` 时，一次保存会启动第二个进程。有了它，`render()` 会在同一个窗口上重新挂载 React。

```bash
bun --hot app.tsx
```

### 3. 保存文件

```text
save .tsx  ►  bun re-evaluates the entry  ►  render() remounts React
                     │
                     ▼
              GpuixRenderer, window, GPU stay
```

第一次 `render()` 会创建原生宿主并将其存储在 `globalThis` 上。每次保存都会卸载 React 树，并在同一个宿主上挂载一棵新的。

**保持不变：** 窗口、GPU 设备、原生 `.node` 插件、GPUI 的滚动物理。

**会被重置：** `useState`、焦点、React 事件处理器。

> [!NOTE]
> 这是一次**重新挂载**，而非 React Refresh。要保留 hook 状态，需要 Bun 在 `--hot` 期间注入 `$RefreshReg$`。该 transform 仅存在于 `bun build --react-fast-refresh`。相关追踪见 [oven-sh/bun#40179](https://github.com/oven-sh/bun/issues/40179)。

原生的 `.node` 改动仍然需要重新构建。参见[开发 Rust 侧](#developing-rust)。

浏览器 Web 示例的热重载路径不同：它走的是 React Fast Refresh，会保留 `useState`。见[示例](#浏览器中的热重载)。

## animation

---
title: 原生动画
description: 'motion.div、AnimatePresence 退场与确定性帧捕获，附目标值与 timing 的取值表。'
eyebrow: 组件
---

使用 **`motion.div`** 可以从初始样式动画到目标样式。React 只发送一次目标。Rust 会计算中间值，并请求 GPUI 帧，直到过渡结束 —— **每一帧都不需要一次 React 渲染或 N-API 调用**。

## 动画化一个目标

```tsx
import { motion } from '@gpuix/react'

function WelcomeCard() {
  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ overflow: 'hidden' }}
    >
      <text style={{ color: '#ffffff' }}>Welcome</text>
    </motion.div>
  )
}
```

当元素必须以它的第一个 `animate` 目标挂载时，设置 **`initial={false}`**。后续的 `animate` 变化仍会正常过渡。如果目标在动画进行中发生了改变，下一次过渡会从当前可见的值开始，因此反向播放动画时不会发生跳变。

## 目标与计时

Motion 目前接受以下**数值目标**：

| 目标 | 取值范围或单位 |
|---|---|
| `width`、`height` | 像素，零或更大 |
| `top`、`right`、`bottom`、`left` | 像素 |
| `opacity` | `0` 到 `1` |
| `borderRadius` | 像素，零或更大 |

**transition** 使用秒，与 Motion for React 一致：

| 选项 | 默认值 | 取值 |
|---|---:|---|
| `duration` | `0.3` | 非负数秒 |
| `delay` | `0` | 非负数秒 |
| `ease` | `"easeOut"` | `"linear"`、`"ease"`、`"easeIn"`、`"easeOut"`、`"easeInOut"`，或 `[x1, y1, x2, y2]` |

> [!NOTE]
> 弹簧（springs）、关键帧（keyframes）、变体（variants）与共享布局动画目前尚不可用。

## 动画化侧边栏

动画化一个**外层裁剪容器**，并让内层侧边栏保持固定宽度。这样可以在不每帧重排其文本的情况下显示或隐藏内容。

```tsx
import { motion } from '@gpuix/react'
import type { ReactNode } from 'react'

function SidebarFrame({
  collapsed,
  children,
}: {
  collapsed: boolean
  children: ReactNode
}) {
  const sidebarWidth = 252
  const dividerWidth = 1

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 0 : sidebarWidth + dividerWidth }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <div style={{ width: sidebarWidth, height: '100%', flexShrink: 0 }}>
        {children}
      </div>
      <div style={{ width: dividerWidth, height: '100%', flexShrink: 0 }} />
    </motion.div>
  )
}
```

**chat 示例** 使用的就是这种模式。侧边栏在外层宽度于 `253` 到 `0` 像素之间移动时始终保持挂载。

## 动画化卸载

带有 **`exit`** 的 `motion.div` 只有在目标完成后才会离开，并且仅当它作为 **`AnimatePresence`** 的子元素时如此。若没有 `AnimatePresence`，React 会在同一次提交中销毁该节点。

```tsx
import { AnimatePresence, motion } from '@gpuix/react'

function Toast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="toast"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <text>Saved</text>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
```

当可能有多于一个子元素离开时，给每个子元素一个**唯一的 `key`**。在 `AnimatePresence` 上设置 **`initial={false}`** 可跳过首次绘制时的进入动画。没有 `exit` 的子元素会在无补间的情况下被移除。当目标已经匹配、节点位于虚拟列表已绘制窗口之外，或无效的运行期数据导致原生目标不可用时，退出仍然会完成。

`AnimatePresence` 还接受 **`onExitComplete`**，它在每个离开的子元素都消失之后运行。`useIsPresent()` 报告一个自定义后代是否正在离开。`usePresence()` 返回同样的状态外加 `safeToRemove`，用于一个自行决定何时可以卸载 retained 子元素的自定义退出。

```tsx
import { usePresence } from '@gpuix/react'

function DeferredRemoval() {
  const [isPresent, safeToRemove] = usePresence()

  return (
    <div onClick={() => !isPresent && safeToRemove?.()}>
      <text>{isPresent ? 'Ready' : 'Click to remove'}</text>
    </div>
  )
}
```

`motion.div` 接受 **`onMotionComplete`**。它在当前原生目标落定时运行。如果 React 在较早的完成到达 JavaScript 之前改变了目标，那个过期的完成会被忽略。

## 捕获精确的帧

[自动化 API](#automation) 可以冻结原生 motion 时钟并渲染特定的时间戳。这避免了定时器 sleep，并让 CI 在每次运行中都得到相同的帧。

```tsx
import { connectTest } from '@gpuix/react/automation'
import { createTestRoot } from '@gpuix/react/testing'
import { ChatApp } from './chat'

const { render, renderer } = createTestRoot()
render(<ChatApp />)
const app = await connectTest(renderer)

const startedAt = await app.clock.pause()
await app.getByTestId('sidebar-collapse').click()

await app.captureFrames('review/sidebar', [
  startedAt,
  startedAt + 50,
  startedAt + 100,
  startedAt + 150,
  startedAt + 200,
])

await app.clock.resume()
```

`motion.div` 只需要一个数值目标。弹簧、关键帧与共享布局动画仍在计划中；带 `exit` 的退场过渡与确定性帧捕获已经可用。

## scrolling

---
title: 滚动
description: 'overflow: scroll 容器获得原生滚动物理。哪些约束最容易踩坑，以及如何让多个窗格逐像素同步。'
eyebrow: 组件
---

带有 `overflow: "scroll"` 的容器会变成原生可滚动的。GPUI 会自动处理滚动物理、裁剪与偏移保持。

普通的滚动容器仍然会构建每一个子元素。当集合可能变得很大时，请使用 [`<virtual-list>`](#virtual-list)。

> [!IMPORTANT]
> **不支持嵌套滚动**
>
> 只允许一个父元素滚动。内部的 `overflow: "scroll"`、`<virtual-list>` 或 `<diff>` 都不能滚动。GPUI 会把同一个滚轮事件同时发给这两个命中框，于是内部列表会抢走这个手势。
>
> 把长内部内容留在那个父元素里。用**可展开**（预览加「显示更多」）把它折叠起来，而不要给子元素自己的视口。

> [!TIP]
> **水平溢出是例外**
>
> 在宽子元素（一行代码、一张表格）上设置 `overflowX: "scroll"` 不会抢走垂直滚轮。GPUIX 把它布局为一个带有 `minWidth: 0` 的 flex 视口。宽子元素不能被压缩：设置 `flexShrink: 0` 或一个确定的宽度。在 **X** 方向上滑动来平移。垂直滚轮仍留在父元素上。

```tsx
function Expandable({
  preview,
  children,
}: {
  preview: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {open ? children : preview}
      {!open && <div onClick={() => setOpen(true)}>Show more</div>}
    </div>
  )
}
```

## 基本滚动容器

```tsx
function ScrollableList() {
  return (
    <div style={{ height: 300, overflow: 'scroll' }}>
      {items.map((item, i) => (
        <div key={i} style={{ height: 60, padding: 12 }}>
          {item.name}
        </div>
      ))}
    </div>
  )
}
```

按轴滚动：使用 `overflowX: "scroll"` 或 `overflowY: "scroll"`。`overflow: "scroll"` 会像浏览器一样，从一个对角线的手势同时滚动两个轴。

flex 列会把它的子元素拉伸到交叉轴，因此一个双轴容器需要它的每一行声明一个宽度。否则在 **X** 方向上就没有任何可平移的内容：

```tsx
<div style={{ width: 260, height: 220, overflow: 'scroll', display: 'flex', flexDirection: 'column' }}>
  {rows.map((row) => (
    <div key={row.id} style={{ display: 'flex', width: 810, flexShrink: 0 }}>
      {row.cells}
    </div>
  ))}
</div>
```

## 必须一起移动的面板

原生滚动容器无法驱动**冻结表头**。GPUI 在滚轮那一帧移动容器，而要移动表头的 JavaScript 回调会晚一帧才到达，因此快速平移时表头会被撕裂开。

当两个窗格必须逐像素锁定时，在 React 中拥有这个偏移量：在一个**不滚动**的父元素上放一个 `onScroll` 监听器，把 `scrollX` 和 `scrollY` 保留在 state 中，并用绝对定位的包装层平移每个窗格的内容。Zed 也是这么做的：编辑器拥有自己的滚动位置，并据此绘制标尺和文本。

```tsx
function Pane({ offsetX, children }: { offsetX: number; children: React.ReactNode }) {
  return (
    <div style={{ flexGrow: 1, minWidth: 0, overflow: 'hidden', position: 'relative' }}>
      {/* An empty positioned box still takes hits, so opt it out. */}
      <div style={{ position: 'absolute', left: -offsetX, top: 0, pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  )
}
```

把正在移动的子树放在一个 `memo` 组件中，其 props 在平移过程中保持不变。这样滚轮只会带来少量的样式 mutation，而不是每行一个。[timeline 示例](https://github.com/remorses/gpuix/blob/main/examples/timeline.tsx) 就对一个标尺、一条轨道列以及一个片段网格做了这样的处理。

## 编程式滚动

请使用宿主 ref。`scrollIntoView()` 会向上找到最近的滚动父元素。在你已经持有一个 id 时，`scrollTo` 和 `scrollToItem` 仍然存在于 renderer 上。

```tsx
function ProgrammaticScroll() {
  const lastItem = useRef<PublicInstance>(null)

  return (
    <>
      <div style={{ height: 200, overflow: 'scroll' }}>
        {items.map((item, i) => (
          <div key={i} ref={i === items.length - 1 ? lastItem : undefined}>
            {item}
          </div>
        ))}
      </div>
      <div onClick={() => lastItem.current?.scrollIntoView?.()}>Jump to last</div>
    </>
  )
}
```

```ts
renderer.scrollTo(elementId, x, y)        // 直接设置偏移
renderer.scrollToItem(elementId, index)   // 将子元素滚动到可见区域
renderer.scrollIntoView(elementId)        // 最近的滚动父元素
renderer.getScrollOffset(elementId)       // 返回 [x, y] 或 null
```

## virtual-list

---
title: 虚拟列表
description: '可变行高、聊天尾部跟随、滚动锚定，以及为什么裁剪比 memo 更重要。'
eyebrow: 组件
---

将 `<virtual-list>` 用于**长且高度可变的集合**，例如消息列表。React 与 Rust 会保留每一行，但 GPUI 只构建、布局并绘制靠近视口的那些行。

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <virtual-list
      alignment="bottom"
      followTail
      estimatedItemHeight={180}
      style={{ flexGrow: 1, minHeight: 0 }}
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
    </virtual-list>
  )
}
```

该列表需要一个**有界的高度**或有界的 flex 空间。它的直接子元素是行，可以包含任意 GPUIX 宿主或自定义元素。

| 属性 | 默认值 | 用途 |
|---|---:|---|
| `alignment` | `"top"` | 聊天风格初始定位请使用 `"bottom"` |
| `followTail` | `false` | 在用户滚走之前，跟随追加的行 |
| `overdraw` | `512` | 在视口之外额外构建的像素 |
| `estimatedItemHeight` | 无 | 未测量行的高度提示。配合 `itemCount` 时**必填** |

## 虚拟化是如何工作的

**React 协调（reconciliation）保持正常。** 完整的带 key 子元素列表会跨越 mutation 协议，并保留在 Rust 的 retained 树中。GPUIX 只把昂贵的 GPUI 元素构建、布局与绘制工作推迟。

```text
React Fiber + Rust RetainedTree    all row IDs, props, text, and events
                 │
                 ▼
          GPUI ListState          row count and measured height cache
                 │
                 ▼ visible indexes plus overdraw
          cx.processor            re-enters GpuixView after root render
                 │
                 ▼
          fresh BuildCtx          builds only the requested React subtree
                 │
                 ▼
       GPUI layout and paint      visible rows only
```

## 行高

**行不需要等高，你也不必知道它们的高度。** GPUI 会在某一行进入视口时测量它。`estimatedItemHeight` 是**对尚未被测量的行的提示**，而非一份尺寸契约。

```text
index:     0        1        2        3        4        5        6        7
       ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
       │  hint  │  hint  │measured│measured│measured│  hint  │  hint  │  hint  │
       │  220px │  220px │  184px │  512px │   96px │  220px │  220px │  220px │
       └────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
           ▲                          ▲                          ▲
           │                          │                          │
     estimate only         real, variable heights          estimate only
                          (viewport plus overdraw)
```

该高度缓存的总和就是滚动长度，因此粗略的估计只会影响**滚动条的准确性**（在某一行被访问之前）。测量得到的高度会自动替换估计值，滚动条也会随着滚动而收敛。

当一个 retained 后代发生变化时，GPUIX 会把它所在的那个直接行标记为需要重新测量，因此一个正在流式增长的行能够正确变高。追加、移除或重排带 key 的行时，ID 未变的那些行的测量结果会被保留。

在 children 模式下，`estimatedItemHeight` 是可选的 —— 此时每一行都存在且可被测量。配合 `itemCount` 时它**是必填的**，因为 React 永远不会挂载窗口之外的行，原生层也就没有可测量的元素。那些索引在 React 挂载真实行之前，会渲染成一个具有估计高度的空盒子。

## 行的边界

每一个**直接宿主子元素**就是一行虚拟行。给每一行一个稳定的 React key 和一个宿主根节点：

```tsx
<virtual-list style={{ height: 500 }}>
  {messages.map((message) => (
    <div key={message.id} style={{ paddingBottom: 24 }}>
      <Message message={message} />
    </div>
  ))}
</virtual-list>
```

一行里可以包含嵌套的 `<div>`、`<text>`、`<markdown>`、`<code>`、`<diff>`、`<input>` 与 `<textarea>` 元素。可聚焦的行在移出屏幕后仍然保持活跃，因此键盘输入与原生编辑器状态都会被保留。这些子元素自身不能滚动。嵌套滚动不受支持；参见[滚动](#scrolling)。

> [!NOTE]
> `<virtual-list>` 不接受 `testId`、`hover` / `active` 样式，也不接受 `onFileDrop`。请把这些放在包裹用的 `<div>` 上 —— gpui 的列表不是交互元素，没有可持有状态的交互身份，也无法记录边界盒子。

## 聊天尾部行为

组合 `alignment="bottom"` 与 `followTail` 用于聊天线程：

```tsx
<virtual-list
  alignment="bottom"
  followTail
  estimatedItemHeight={220}
  style={{ flexGrow: 1, minHeight: 0 }}
>
  {turns.map((turn) => (
    <ChatTurn key={turn.id} turn={turn} />
  ))}
</virtual-list>
```

当用户处于底部时，列表会跟随新行。向上滚动会暂停尾部跟随；回到底部后会再次启用。一个正在流式输出的最后一行会随着内容增长而被重新测量。

## 滚动锚定

列表锚定在**行索引**上，而非像素偏移上。在 children 模式下，React 会按 key 进行协调，因此即使在前面插入内容，该索引仍然落在同一行上：屏幕上已有的行会保持在原处。浏览器的做法相同，并称之为滚动锚定（scroll anchoring）。

唯一的例外（同样照搬自浏览器）：一个顶端对齐、并且已经滚动到**最顶部**的列表会保持在顶部，因此前面插入的行是可见的。

```text
scrolled down                          pinned to the top
┌──────────────────┐                   ┌──────────────────┐
│ new row  (above) │  ◄── inserted     │ new row          │  ◄── inserted, visible
├──────────────────┤                   ├──────────────────┤
│ ░░ viewport ░░░░ │  stays put        │ ░░ viewport ░░░░ │  follows the insert
│ ░░░░░░░░░░░░░░░░ │                   │ ░░░░░░░░░░░░░░░░ │
└──────────────────┘                   └──────────────────┘
```

这正是待办列表或信息流想要的行为：`setItems((current) => [fresh, ...current])` 会把新行放到屏幕上。而一个在用户阅读时加载更早分页的历史面板，则应该使用 `alignment="bottom"`，这样页面加载永远不会移动文本。

### 使用 itemCount 时

> [!IMPORTANT]
> **修正工作由应用自己负责**
>
> 没有可供协调的 key，因此索引就是一切。在前面插入会把每一行都向下挪一个位置，而锚点仍指向那个旧的数字，于是内容恰好滑动了你插入的行数。请把 `windowStart` 移动相同的数量：
>
>
> 不要去改动处于 `0` 的 `windowStart`；列表在那儿被钉在顶部，新行应当可见。

## 编程式滚动

使用一个 ref 来调用与普通滚动容器相同的 renderer 滚动方法：

```tsx
function Results({ rows }: { rows: Result[] }) {
  const renderer = useGpuixRequired()
  const listRef = useRef<{ id: number } | null>(null)

  const reveal = (index: number) => {
    if (listRef.current) {
      renderer.scrollToItem?.(listRef.current.id, index)
    }
  }

  return (
    <>
      <virtual-list ref={listRef} style={{ height: 400 }}>
        {rows.map((row) => (
          <ResultRow key={row.id} row={row} />
        ))}
      </virtual-list>
      <div onClick={() => reveal(rows.length - 1)}>Reveal latest</div>
    </>
  )
}
```

`scrollTo`、`scrollToItem` 与 `getScrollOffset` 都支持虚拟列表。

在虚拟列表上，`scrollToItem` 接受一个可选的**像素偏移**，并且列表会报告它的逻辑锚点：

```ts
renderer.scrollToItem(listId, index, offsetInItem)  // 偏移单位为 px，可以为负
renderer.getListScrollTop(listId)  // [itemIndex, offsetInItemPx, viewportHeightPx] 或 null
```

**负的偏移会把视口顶部锚定在行的上方**，下一次布局会用真实的测量高度来解析它。这正是无限滚动历史所需的工具：当读者停留在一个加载行时，读取 `getListScrollTop`，提交已获取的分页，然后用一个负偏移重新锚定到原本位于加载行下方的那条消息上。在新行于其上方完成测量期间，该消息会停留在相同的像素位置 —— 具体可参考 `examples/infinite-chat.tsx` 这个完整示例。

一个等于条目总数的 `itemIndex` 是 gpui 的**末尾哨兵（at-end sentinel）**：一个 resting 在最末端、底端对齐的列表。停留在尾部加载行的读者通常就位于此处，而同一元组中的视口高度正是把它转换为相对于尾部各行的位置的东西（示例中为 `EDGE_HEIGHT - viewportHeight`）。

虚拟列表的 `scrollToItem` 调用会在**下一帧的子元素拼接之后、下一次渲染时**生效，因此一个针对刚刚提交的子元素列表计算出来的索引永远不会被偏移两次。

## 性能模型

| 工作 | 普通滚动容器 | `<virtual-list>` children | `<virtual-list>` + `itemCount` |
|---|---|---|---|
| React Fiber 节点 | 所有行 | 所有行 | 可见窗口 |
| Rust retained 节点 | 所有行 | 所有行 | 可见窗口 |
| GPUI 行构建 | 所有行 | 可见行加 overdraw | 可见行加 overdraw |
| 布局与绘制 | 所有行 | 可见行加 overdraw | 可见行加 overdraw |
| 高度元数据 | 无 | 每行一个轻量条目 | 每个逻辑行一个轻量条目 |

children 形式仍然会创建每一个 React 子元素，因此一个一万行的 `turns.map` 挂载起来很慢。传入 `itemCount` 与 `windowStart`，并且只渲染那一个切片，才能同样把窗口挂载出来。拥有数百万行的集合仍然需要应用层的分页，或一个拥有数据的原生元素。

## 保持滚动流畅

滚轮事件会通知窗口视图。随后 GPUI 会重新构建**可见的**那些行，并由 Taffy 再次布局。绘制时间消耗在这些行上，而非列表的长度上。

把长列表放到 `<virtual-list>` 上。让 `overdraw` 保持在一个额外视口左右。把庞大的内容放进单个原生节点（`<markdown>`、`<code>`、`<diff>`），而不是一棵 React span 树。

宿主 `<virtual-list>` 仍然会保留每一个 React 子元素。传入 `itemCount`、`estimatedItemHeight` 与 `windowStart`，然后只渲染那个窗口，这样挂载时就不会创建每一行。当缺少估计值时，原生层会忽略 `itemCount`，因此一次跳转不会把未挂载的行压缩到高度 0。

**没有 `VirtualList` 包装组件。** 窗口是应用状态：只有应用自己知道它何时必须扩大 —— 例如当某个过滤器在没有发生任何滚动的情况下增大了 `itemCount`。把 `start` 放在 `useState` 里，从 `onVisibleRange` 移动它，并围绕它做切片。

```tsx
const WINDOW = 40

const Transcript = memo(function Transcript({ turns }: { turns: Turn[] }) {
  const [start, setStart] = useState(0)
  const end = Math.min(turns.length, start + WINDOW)
  return (
    <virtual-list
      itemCount={turns.length}
      windowStart={start}
      estimatedItemHeight={220}
      style={{ flexGrow: 1, minHeight: 0 }}
      onVisibleRange={(event) =>
        setStart(Math.max(0, Math.floor(event.startIndex ?? 0) - WINDOW / 4))
      }
    >
      {turns.slice(start, end).map((turn) => (
        <ChatTurn key={turn.id} turn={turn} />
      ))}
    </virtual-list>
  )
})

function ChatApp() {
  const [collapsed, setCollapsed] = useState(false)
  const [turns, setTurns] = useState(initialTurns)
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
      <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed(true)} />
      <Transcript turns={turns} />
      <Composer onSend={(text) => setTurns((current) => [...current, { text }])} />
    </div>
  )
}
```

`turns` 只有在消息到达时才会是一个新数组。Sidebar 与草稿的更新不会动这个引用，因此 `memo` 会跳过这次 map。chat 示例使用的就是这种模式。

宽子元素上的 `overflowX: "scroll"` 不能抢走垂直滚轮。GPUIX 在该路径上设置了 `restrict_scroll_to_axis`。原生的 `overflow_x_scroll()` 必须调用同一个方法。

在滚动时打开 [`debugFrameOverlay: 'full'`](#debug-overlay)。叠加层显示的是**绘制时间**。`8.3 MS` 约等于 120 Hz。

## 可平移表面必须裁剪

`<virtual-list>` 是唯一会做虚拟化的东西。一个由**你**自己掌握偏移的表面 —— 时间轴、节点图、地图 —— 会把它的子元素绝对定位，于是 GPUI 在每一帧都会构建并布局**每一个** retained 子元素。没有任何东西替你跳过它们。

`memo` 与裁剪（culling）分别修复不同的部分，而其中只有一个是绘制：

```text
memo(Layer)  ►  削减 React 工作以及 applyBatch 的 mutation
cull in JS   ►  削减 GPUI 构建、Taffy 布局与绘制
```

你已经知道偏移，因此可见窗口只差一个 `useMemo`：

```tsx
const visible = useMemo(() => {
  const from = scrollX / pxPerSecond
  const to = (scrollX + viewportWidth) / pxPerSecond
  return clips.filter((clip) => clip.start <= to && clip.start + clip.duration >= from)
}, [clips, scrollX, pxPerSecond, viewportWidth])
```

timeline 示例在横跨 26 条轨道、共 3,259 个片段上测量了两者：

| 滚轮平移，单帧 | p50 |
|---|---|
| 已裁剪 | **7.7 ms** |
| 仅 `memo`，不裁剪 | **92 ms** |

> [!IMPORTANT]
> 性能采样必须包含 `renderer.flush()`。否则你计时的只是 React 更新，而不包含随后发生的任何 GPUI 构建、布局与绘制。上面的「仅 `memo`」数字如果忘了这一点，看起来会像 **0.6 ms**。

## text-input

---
title: 文本输入
description: '平台原生编辑器能力：光标、选区、IME、剪贴板与撤销重做，以及行高与内边距的尺寸规则。'
eyebrow: 组件
---

`<input>` 与 `<textarea>` 使用 GPUI 的平台输入处理器。它们支持原生的光标（caret）、文本选区、IME 组合、剪贴板操作、撤销/重做、字素安全的删除（grapheme-safe deletion）以及鼠标定位。

```tsx
<textarea
  value={draft}
  placeholder="Ask anything"
  minRows={1}
  maxRows={8}
  onChange={(event) => setDraft(event.value ?? '')}
/>

<textarea
  value={draft}
  onChange={(event) => setDraft(event.value ?? '')}
  onSubmit={send}
/>
```

在 `<textarea>` 中，`Enter` 会插入一个换行。传入 **`onSubmit`** 则改为在 Enter 时触发该事件；`Shift+Enter` 仍然插入换行。`<input>` 在 Enter 时始终触发 `onSubmit`。编辑器会先在原生层更新，然后才把完整的值报告给 React。

`value` 的变化可以替换原生内容，但保持相同的 prop 值并不会像浏览器托管的输入框那样拒绝一次编辑。

## 光标

聚焦的光标在编辑期间保持实心，空闲时每 500ms 闪烁一次。在失焦或窗口处于非活跃状态时，它会停止调度重绘帧。可以通过共享的原生主题覆盖它的颜色：

```tsx
<input theme={{ caret: '#22c55e' }} />
```

## 剪贴板

当剪贴板中没有文本时，`Cmd+V` 或 `Ctrl+V` 会继续触发 `onKeyDown`，而不是消失在编辑器内部。这样应用就可以自己处理只有图片、或只有文件的剪贴板。即便操作系统把文件路径作为兜底文本一并包含，被复制的文件也仍会传播。混合了文本与图片的剪贴板内容仍然会粘贴其文本部分。

## 行高

`style` 中的 **`fontSize` 与 `lineHeight`** 用于设定每一行的尺寸。若不提供 `lineHeight`，行会使用 GPUI 默认的 leading，因此更大的 `fontSize` 会让盒子变高。传入 `lineHeight` 以像素为单位设定行高。`minRows` 与 `maxRows` 会按该高度做倍数放大。显式的 `height` 仍然会覆盖两者。

```tsx
<textarea
  value={draft}
  minRows={1}
  maxRows={8}
  style={{ fontSize: 14, lineHeight: 20 }}
  onChange={(event) => setDraft(event.value ?? '')}
/>
```

## 搜索胶囊中的输入框

`<input>` **默认没有内边距**，并且会把文本绘制在盒子的顶部。当给定了额外高度时，单行输入框会将其文本垂直居中。请在输入框的 style 上或一个父级包装容器上设置 `padding`。当输入框带有 `borderRadius` 时，文本会自动裁剪为圆角形状。

```tsx
<div style={{
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  height: 32,
  paddingLeft: 10,
  paddingRight: 4,
  borderRadius: 16,
  backgroundColor: '#1a1a22',
  borderWidth: 1,
  borderColor: '#ffffff14',
}}>
  <input
    value={query}
    onChange={(e) => setQuery(e.value ?? '')}
    style={{ flexGrow: 1, minWidth: 0, fontSize: 13, color: '#e8e8ed' }}
  />
</div>
```

> [!NOTE]
> `minWidth: 0` 在这里是必需的：一个需要收缩的 flex 子项没有它就不会收缩到内容宽度以下。规则和 CSS 一致，参见[支持的样式](#styling)。

## 与键盘的关系

Tab 永远不会向 `<input>` 或 `<textarea>` 中输入一个 tab 字符，这与浏览器一致。一个想要输入 tab 的编辑器会调用 `preventDefault()` 并自行插入它。焦点与键盘派发的完整规则见[焦点与键盘导航](#focus-keyboard)。

## accessibility

---
title: 无障碍
description: '属性映射、默认 role 表格，以及哪些 props 在浏览器渲染器中只是空操作。'
eyebrow: 组件
---

GPUI 通过 AccessKit 与 **macOS AX 树**、Windows UIA 以及 Linux AT-SPI 通信。GPUIX 把 React 的 props 映射到这套 API 上。一个节点只有在**同时**拥有 GPUI id（始终设置）和一个 **role** 时，才会进入这棵树。

属性名与 React DOM 一致。role 的**取值**是 ARIA 令牌，而非 AccessKit 的 PascalCase。`"none"` 与 `"presentation"` 不会产生节点。

```tsx
<div
  role="button"
  aria-label="Delete note"
  aria-description="Removes this note"
  aria-id="notes.delete"
  onClick={remove}
>
  Delete
</div>
```

| 属性 | GPUI / AccessKit |
|---|---|
| `role` | `.role(Role::…)` |
| `aria-label` | 可访问名称（accessible name） |
| `aria-description` | 名称、角色、取值之后的额外描述 |
| `aria-id` | `AXIdentifier` / UIA AutomationId |
| `aria-expanded` | 展开状态 |
| `aria-selected` | 选中状态 |
| `aria-valuetext` | 字符串取值 |
| `aria-level` | 标题层级 |

## 原生默认值

原生默认值意味着常见元素不会「沉默」：

| 元素 | 默认 role | 名称 / 取值 |
|---|---|---|
| `<text>` | `Label` | 内容作为 `aria-valuetext` |
| `<input>` | `TextInput` | `value` 与 `placeholder` |
| `<textarea>` | `MultilineTextInput` | `value` 与 `placeholder` |
| `<img>` | `Image` | `alt` 作为 `aria-label` |

显式的 `role` 会覆盖这些默认值。

> [!IMPORTANT]
> **一个可点击的 `div` 在你设置 `role="button"` 之前不是按钮。** `onClick` 会注册 AccessKit 的 `Click`，因此 VoiceOver 的 Press 会触发同一个 JS `click` 处理器，但它仍然不会进入 Tab 顺序 —— 那需要 [`tabIndex`](#focus-keyboard) 或 `Button` 原语。

> [!NOTE]
> 浏览器 / wasm 渲染器没有 AccessKit 适配器。这些 props 在那里是空操作（no-op）。

## 与内置原语的关系

`Button`、`Dialog.Trigger`、`Dialog.Close` 等[内置原语](#headless-controls)已经设置了正确的 role 与键盘行为，因此优先使用它们，而不是手写带 `role` 的 `div`。

## focus-keyboard

---
title: 焦点与键盘导航
description: 'tab 顺序、键盘事件的派发路径、默认动作的取消方式，以及命令式聚焦 API。'
eyebrow: 组件
---

焦点是一个**原生 GPUI 概念**。GPUIX 会把稳定的 React 元素 ID 连接到持久的 `gpui::FocusHandle` 值上，因此焦点在 React 重新渲染后依然保留：

```text
React <div tabIndex={0}>
            │
            ▼
Retained element ID ► persistent gpui::FocusHandle ► keyboard/action dispatch
            ▲
            │
      React rerenders
```

`<input>` 与 `<textarea>` 会自动成为 tab 停靠点。当一个 `div` 需要参与显式的焦点遍历时，给它加上 `tabIndex`：

```tsx
<div
  tabIndex={0}
  onFocus={() => setActive(true)}
  onBlur={() => setActive(false)}
  onKeyDown={(event) => {
    if (event.key === 'enter') submit()
  }}
>
  Submit
</div>
```

| 属性 | 行为 |
|---|---|
| `tabIndex={0}` | 加入正常的焦点遍历顺序 |
| `tabIndex={n}` | 使用 `n` 作为它的 GPUI tab 顺序索引 |
| `tabIndex={-1}` | 被焦点遍历跳过，但可通过点击或 renderer API 获得焦点 |
| `autoFocus` | 在它的原生焦点句柄被创建时获取一次焦点 |

## 元素键盘回调

`onKeyDown` 会先为获得焦点的元素触发，然后沿着 GPUI 的焦点派发路径，为声明了 `onKeyDown` 的祖先元素触发。`onKeyUp` 在按键释放时沿着同样的路径触发。添加这两个回调中的任意一个都会创建该元素的原生焦点句柄。

```tsx
<div
  autoFocus
  tabIndex={0}
  onKeyDown={(event) => {
    console.log(event.key, event.keyChar, event.modifiers, event.isHeld)
  }}
  onKeyUp={(event) => {
    console.log(`${event.key} released`)
  }}
>
  Focused target
</div>
```

GPUI 会在原始键盘回调之前派发匹配的按键动作（key action）。如果一个动作消费了那个键，`onKeyDown` 就不会触发。

## Tab 默认移动焦点

**Tab** 与 **Shift+Tab** 会沿 tab 顺序移动焦点，就像浏览器一样。该默认行为在该按键的每一个 `onKeyDown` 处理器之后运行，因此任何处理器都可以取消它：

```tsx
<div
  tabIndex={0}
  onKeyDown={(event) => {
    if (event.key !== 'tab') return
    event.preventDefault() // 这个 Tab 停留在此处
    insertIndent()
  }}
/>
```

按键事件的工作方式类似于一个冒泡到 `window` 的 DOM 事件：

| 调用 | 效果 |
|---|---|
| `event.preventDefault()` | 取消默认行为。Tab 不移动焦点 |
| `event.stopPropagation()` | 跳过祖先的 `onKeyDown` 与 window 的 `onKeyDown`。默认行为仍然运行 |
| `event.defaultPrevented` | 当该按键更早的处理器已阻止它时为真 |

```text
keystroke ► GPUI actions ► element onKeyDown (focused → ancestors) ► render({ onKeyDown }) ► default
                                   preventDefault() anywhere here cancels ─────────────────────┘
```

Tab 也永远不会向 `<input>` 或 `<textarea>` 中输入一个 tab 字符，同样与浏览器一致。一个想要输入 tab 的编辑器会调用 `preventDefault()` 并自行插入它。

用 `tabNavigation: false` 为整个窗口关闭该默认行为：

```tsx
render(<App />, { tabNavigation: false })
```

> [!NOTE]
> GPUI 在 JavaScript 运行之前就完成了原生派发，因此这些调用改变的是 GPUIX 接下来的行为。它们无法阻止一个已经消费了该按键的 GPUI 动作。

## 渲染器键盘回调

把 `onKeyDown` 或 `onKeyUp` 传给 `render()`，即可获得一个窗口级监听器。它会在元素回调之后、针对那些没有被任何 GPUI 动作消费的原始按键触发，并且位于 Tab 默认行为之前。它以 renderer 作为第二个参数：

```tsx
render(<App />, {
  onKeyDown(event, renderer) {
    if (event.key === 'k' && event.modifiers?.cmd) openPalette()
  },
})
```

## 命令式焦点

`focusNext()` 与 `focusPrevious()` 直接映射到 GPUI 的 `window.focus_next()` 与 `window.focus_prev()`。`focusNextWithin(id)` / `focusPreviousWithin(id)` 在该子树内部包裹遍历。`getFocusedElementId()` 返回宿主 id，或 `null`。在 WebGPU 打开期间发出的浏览器焦点请求会被排队，并在首个焦点句柄存在之后应用。如果在那次渲染之前到达了多个请求，以最新的请求为准。

使用 ref 来进行命令式聚焦：

```tsx
const buttonRef = useRef<{ id: number }>(null)

function focusButton() {
  if (buttonRef.current) renderer.focusElement(buttonRef.current.id)
}

<div ref={buttonRef} tabIndex={-1}>Focused on demand</div>
```

添加 `onKeyDown`、`onKeyUp`、`onFocus` 或 `onBlur` 会创建一个持久的焦点句柄。当元素必须通过焦点遍历可达时，同样要加上 `tabIndex`。移除 `tabIndex` 会把该元素从那个顺序中删除。

## 在自定义面板内捕获 Tab

`Dialog.Popup` 已经做了这件事。对于你自己的面板，请阻止默认的 Tab，然后用 `focusNextWithin` / `focusPreviousWithin` 在其内部包裹遍历。

```tsx
function onKeyDown(event: KeyEvent) {
  if (event.key !== 'tab' || !panel) return
  event.preventDefault()
  if (event.modifiers?.shift) renderer.focusPreviousWithin?.(panel.id)
  else renderer.focusNextWithin?.(panel.id)
}

<div ref={setPanel} onKeyDown={onKeyDown}>
  <div tabIndex={0} autoFocus>Ok</div>
  <div tabIndex={0}>Cancel</div>
</div>
```

## 焦点样式

GPUIX 的默认行为是：当某个控件拥有键盘焦点时，其余可聚焦元素变暗。你可以用 `focusVisible` 覆盖这一点，详见[支持的样式](#焦点样式)。

## headless-controls

---
title: 无样式控件
description: 'Button、Select、Combobox、Tooltip、Dialog 的部件表、浮层绘制顺序与层栈规则。'
eyebrow: 组件
---

内置的控件是**无样式的原语（primitive）**，而非一套固定的组件库。请像在 shadcn 中使用 Radix 原语那样使用它们：导入一个原语命名空间，在本地文件中包装并加上样式，然后在应用的各处导入这些本地组件。

```text
@gpuix/react/select ► components/ui/select.tsx ► application screens
  native behavior       local styles/variants       product-specific use
```

每个原语都有一个专用的命名空间入口：

| 导入 | 主要组成部分 |
|---|---|
| `@gpuix/react/button` | `Button`、`buttonProps` |
| `@gpuix/react/select` | `Root`、`Trigger`、`Value`、`Content`、`Item` |
| `@gpuix/react/combobox` | `Root`、`Input`、`Content`、`List`、`Item`、`Empty` |
| `@gpuix/react/tooltip` | `Provider`、`Root`、`Trigger`、`Content` |
| `@gpuix/react/dialog` | `Root`、`Trigger`、`Portal`、`Backdrop`、`Popup`、`Title`、`Description`、`Close` |
| `@gpuix/react/floating` | `FloatingLayer`、`renderSlot` |

## 构建一个本地 Select

创建 `components/ui/select.tsx`。这是应用代码，因此无需等待 GPUIX 增加主题选项，就可以直接复制并修改它：

```tsx
import * as React from 'react'
import * as SelectPrimitive from '@gpuix/react/select'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value
export const SelectGroup = SelectPrimitive.Group

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectPrimitive.SelectTriggerProps
>(({ style, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    {...props}
    style={(state) => ({
      width: 220,
      height: 36,
      padding: 8,
      backgroundColor: state.open ? '#334155' : '#1e293b',
      borderRadius: 8,
      ...(typeof style === 'function' ? style(state) : style),
    })}
  />
))

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectPrimitive.SelectContentProps
>(({ style, ...props }, ref) => (
  <SelectPrimitive.Content
    ref={ref}
    sideOffset={6}
    {...props}
    style={{
      width: 220,
      maxHeight: 240,
      overflowY: 'scroll',
      padding: 4,
      backgroundColor: '#0f172a',
      borderRadius: 8,
      ...style,
    }}
  />
))

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectPrimitive.SelectItemProps
>(({ style, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    {...props}
    style={(state) => ({
      padding: 8,
      opacity: state.disabled ? 0.4 : 1,
      backgroundColor: state.highlighted
        ? '#334155'
        : state.selected
          ? '#1e3a5f'
          : '#0f172a',
      ...(typeof style === 'function' ? style(state) : style),
    })}
  />
))
```

当 `SelectValue` 需要在菜单关闭时显示一个标签时，在 `Root` 上传入 **`items`**。键盘导航会读取已挂载的 `SelectItem` 子元素。在 `Item` 外面包一层带样式的包装组件没有问题。若不传 `items`，`SelectValue` 显示的是原始取值。

```tsx
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './components/ui/select'

const models = [
  { value: 'sonnet', label: 'Sonnet' },
  { value: 'opus', label: 'Opus' },
]

<Select items={models} value={model} onValueChange={setModel}>
  <SelectTrigger>
    <SelectValue placeholder="Select a model" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {models.map((item) => (
        <SelectItem key={item.value} value={item.value}>
          {item.label}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

触发器是一个 tab 停靠点（即便使用 `asChild` 时也是如此），除非该部件或其子元素设置了自身的 `tabIndex`。打开 Select 会让其内容获得焦点。`Up`、`Down`、`Ctrl+P`、`Ctrl+N`、`Enter` 与 `Escape` 控制菜单。Escape 会经过[层栈](#escape-关闭顶层)。弹层是模态的，类似于 Base UI：Tab 不会离开它。通过键盘或一次选择来关闭时，会把焦点恢复到触发器上。在外部按下则关闭它，并把焦点留在按下动作放置的位置。被禁用的项会被跳过。

> [!IMPORTANT]
> **GPUI 不会冒泡点击**
>
> 当一个带样式的行负责绘制项的填充时，请使用 `asChild`，让那一行成为真正的命中目标：
>
>
> 子元素必须转发它的 ref 与宿主 props。`ComboboxItem` 支持同样的模式。

## 为 Combobox 与 Tooltip 加样式

也请从命名空间导入开始它们的本地文件：

```tsx
// components/ui/combobox.tsx
import * as ComboboxPrimitive from '@gpuix/react/combobox'

// components/ui/tooltip.tsx
import * as TooltipPrimitive from '@gpuix/react/tooltip'
```

应用仍然使用复合组件（compound components），而非一个大配置对象：

```tsx
<ComboboxPrimitive.Root items={['Next.js', 'SvelteKit', 'Astro']}>
  <ComboboxPrimitive.Input style={{ width: 220, height: 36, padding: 8 }} />
  <ComboboxPrimitive.Content style={{ width: 220 }}>
    <ComboboxPrimitive.Empty>No frameworks found.</ComboboxPrimitive.Empty>
    <ComboboxPrimitive.List>
      {(item) => (
        <ComboboxPrimitive.Item key={item} value={item}>
          {item}
        </ComboboxPrimitive.Item>
      )}
    </ComboboxPrimitive.List>
  </ComboboxPrimitive.Content>
</ComboboxPrimitive.Root>
```

```tsx
<TooltipPrimitive.Provider delayDuration={350}>
  <TooltipPrimitive.Root>
    <TooltipPrimitive.Trigger asChild>
      <div tabIndex={0} style={{ padding: 8 }}>Copy</div>
    </TooltipPrimitive.Trigger>
    <TooltipPrimitive.Content side="top" sideOffset={6}>
      Copy message
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
```

Combobox 使用原生 input 来进行文本编辑、IME、剪贴板与焦点。焦点离开 input 会关闭弹层，因此一个移动焦点的 Tab 会将其关闭，而被阻止的 Tab 则保持它打开。Combobox 与 Tooltip 的触发器都像 Select 触发器一样是 tab 停靠点。Tooltip 的 `asChild` 会保留子元素的 ref，并把触发器行为合并进那个宿主元素。子元素自身的处理器会先运行。

所有浮动内容都使用 GPUI 延迟的 `anchored()` 层，吸附在窗口内部，并遮挡其背后的控件。

## 浮层菜单

菜单、tooltip 与对话框必须使用 `SelectContent`、`ComboboxContent` 或 `<anchored deferred>`。它们会在后续的绘制 pass 中，绘制在 `<virtual-list>` 以及页面其余部分之上。

一个 `position: "absolute"` 的卡片如果溢出到输入框之外，会位于虚拟列表**之下**。列表在输入框之后绘制，因此你会透过菜单看到 markdown，而点击会命中它背后的文本。

```tsx
<Select items={[{ value: 'flash', label: 'DeepSeek V4 Flash' }]} value={model} onValueChange={setModel}>
  <div style={{ position: 'relative' }}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent side="top" sideOffset={4} style={{ backgroundColor: '#232323' }}>
      <SelectItem value="flash">DeepSeek V4 Flash</SelectItem>
    </SelectContent>
  </div>
</Select>
```

> [!IMPORTANT]
> **给每一个浮层一个不透明的填充**
>
> 使用 `#232323`，而不是 `#23232399`。`FloatingLayer` 默认是 `#1A1A1A`。项的行应使用同样的纯色，或一个纯色的 hover 颜色。在磨砂窗口上一个 `#00000000` 的子元素会穿透 Metal 直达桌面。
>
> 一个没有在 style 中指定填充的原始 `<anchored>` 会绘制成 `#1A1A1A`。设置 `backgroundColor: "transparent"` 则什么都不绘制，就像 `Dialog.Portal` 那样。

`fill="window"` 会让一个 `<anchored>` 覆盖整个窗口，类似于 `Dialog.Portal`。原生层每一帧都会读取视口尺寸，因此该层会在同一帧内跟随窗口缩放。它会忽略 `position`、`side`、`align`、`anchor`、`offset` 与 `fit`。

```tsx
<anchored fill="window" style={{ backgroundColor: 'transparent' }}>
  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />
</anchored>
```

`FloatingLayer` 会把统一的圆角与每个角的圆角复制到它的 anchored 表面上，因此圆角的 Select、Combobox 与 Tooltip 内容不会在它背后露出方角。它还会把 `visibility` 与 `opacity` 放在那个外层表面上，让兜底的填充跟随它们，而不会让嵌套的透明度相乘。`pointerEvents: "none"` 会禁用 anchored 遮挡层。背景、边框、阴影、溢出与布局仍然留在内层内容上，以避免重复绘制或改变弹层几何。

## 测量一个元素

`getElementBounds(id)` 返回最后一次绘制的盒子，如果该节点没有绘制则返回 `null`。它在实时的 `GpuixRenderer` 与测试渲染器上都可以工作。边界是在**绘制（paint）**期间记录的，因此应在某一帧之后读取，而不是在挂载的那次提交中读取。

```tsx
const box = renderer.getElementBounds?.(ref.current.id)
// { x, y, width, height }
```

## Button

GPUIX 没有原生的 `<button>`，因此一个带 `onClick` 的 `div` 既无法用 Tab 到达，也会忽略键盘。`Button` 就是 [Base UI Button](https://base-ui.com/react/components/button)：

```tsx
import { Button } from '@gpuix/react/button'

<Button onClick={save} disabled={saving} style={(state) => ({ opacity: state.disabled ? 0.5 : 1 })}>
  Save
</Button>
```

| 行为 | 细节 |
|---|---|
| Tab 停靠点 | `tabIndex` 0，`role="button"` |
| `onClick` | 按下触发，按下 **Enter**（不重复触发）时触发，**Space** 在抬起时触发 |
| `disabled` | 没有 `onClick`，离开 Tab 顺序 |
| `focusableWhenDisabled` | 在禁用时仍留在 Tab 顺序中，用于一个繁忙的「Saving…」按钮 |
| `asChild` | 把行为合并进你自己的元素 |
| `style` | 对象，或一个以 `{ disabled }` 为参数的函数 |

`buttonProps(behavior)` 为你的自定义部件返回同样的 props。`Dialog.Trigger` 与 `Dialog.Close` 都构建在它之上。

## Dialog

部件与 [Base UI Dialog](https://base-ui.com/react/components/dialog) 相同：

```tsx
import * as Dialog from '@gpuix/react/dialog'

<Dialog.Root>
  <Dialog.Trigger>Settings</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Backdrop style={{ backgroundColor: '#00000080' }} />
    <Dialog.Popup style={{ width: 420, padding: 16, backgroundColor: '#232323' }}>
      <Dialog.Title>Settings</Dialog.Title>
      <Dialog.Close>Done</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Portal>
</Dialog.Root>
```

| 部件 | 行为 |
|---|---|
| `Root` | `open`、`defaultOpen`、`onOpenChange`、`modal`（默认 `true`）、`disablePointerDismissal` |
| `Trigger` | Tab 停靠点。点击、Enter 或 Space 打开 |
| `Portal` | 全窗口延迟层（`<anchored fill="window">`）。在同一帧内跟随窗口缩放。绘制在 `<virtual-list>` 之上。默认将其子元素居中。模态：阻止其背后点击与滚轮 |
| `Backdrop` | 按下关闭对话框 |
| `Popup` | 打开时把焦点移入，关闭时移出。模态：Tab 与 Shift+Tab 留在内部 |
| `Close` | Tab 停靠点。点击、Enter 或 Space 关闭 |

Popup 上的 `initialFocus` 与 `finalFocus` 决定焦点去向，就像 Base UI：

```tsx
<Dialog.Popup initialFocus={searchRef} finalFocus={composerRef}>
```

| 取值 | `initialFocus`（打开时） | `finalFocus`（关闭时） |
|---|---|---|
| 未设置 / `true` | Popup 自身，因此第一次 Tab 会进入它 | 触发器，否则是 Popup 打开时获得焦点的元素 |
| ref 或元素 | 那个元素 | 那个元素 |
| `false` | 焦点保持不变 | 焦点保持不变 |
| 函数 | 返回上述之一。`null` 表示使用默认值 | 同上 |

`initialFocus` 的默认值与 Base UI 不同，后者会选择第一个可 tab 的元素。GPUI 的 tab 顺序只有在 Popup 已经绘制之后才存在，因此 GPUIX 会聚焦 Popup，并让第一次 Tab 去遍历那个顺序。

一个从应用状态打开、没有 `Trigger` 的对话框仍然会归还焦点：Popup 会在它挂载之前记录下获得焦点的元素。

`initialFocus` 会胜过 Popup 内部的 `autoFocus`。请把该字段作为 `initialFocus` 传入。

嵌套的对话框遵循层栈。当两者在一次更新中同时打开时，内部的那个获得焦点。当两者在一次更新中同时关闭时，焦点会回到外层对话框的返回目标。Popup 内部的 Select 或 Tooltip 会打开在它之上，并且 Escape 会先关闭它。

## Escape 关闭顶层

每一个打开的 Dialog Popup、Select、Combobox 与 Tooltip 都位于每个窗口的同一个**层栈（layer stack）** 上。Escape 只关闭最近打开的那一层，即便没有任何元素获得焦点。它是一个默认动作，就像 Tab，因此任何 `onKeyDown` 都可以让它保持打开：

```tsx
<Dialog.Popup
  onKeyDown={(event) => {
    if (event.key === 'escape' && dirty) event.preventDefault()
  }}
/>
```

一个自定义浮层通过 `DismissableLayer` 加入同一个栈。只在浮层打开期间挂载它：

```tsx
import { DismissableLayer } from '@gpuix/react' // 或 '@gpuix/solid'

{open && (
  <DismissableLayer onEscapeKeyDown={() => setOpen(false)}>
    <anchored deferred>{/* overlay */}</anchored>
  </DismissableLayer>
)}
```

一个挂载在另一个内部的层永远位于其上方，即便两者在同一次提交中打开。`DismissableLayer` 也接受 `initialFocus()` 与 `finalFocus(previous)`，它们返回一个元素 id 或 `null`。栈会按栈的顺序调用它们，因此在打开时只有顶层会获得焦点。

与框架无关的代码使用 `pushDismissLayer(renderer, layer, { previousFocus })`（带一个 `parent` 字段），并在该层关闭时调用返回的函数。

## text-selection

---
title: 文本选区
description: '跨元素选区如何工作、如何读取与响应，以及如何用 userSelect 关掉不需要的地方。'
eyebrow: 文本能力
---

GPUIX 绘制的每一段文本都是**可选中、可复制的**，包括位于 `<code>`、`<diff>` 与 `<markdown>` 内部的文本。一次从标题开始、在围栏代码块内结束的拖拽，会选中它们之间的所有内容；Cmd+C 会按文档顺序把它们拼接后复制。

这里没有任何需要开启的选项。轻点不会选中，只有拖拽才会。若要*关闭*——例如工具栏、按钮、行号槽——请设置 `userSelect: "none"`，它会像对应的 CSS 属性一样被继承：

```tsx
<div style={{ userSelect: 'none' }}>
  <text>toolbar label, never selected</text>
</div>
```

## 读取与响应选区

```tsx
render(<App />, {
  onSelectionChange(event) {
    setCopied(event.value ?? '')
  },
})

renderer.getSelectedText()   // 拼接后的文本，或 null
renderer.clearSelection()
```

`onSelectionChange` 是 `render()` / `createRoot()` 上的一个**窗口级**回调，挂载方式与 `onKeyDown` 相同。文本选区是应用级的，而非逐元素的。它会在选中的范围发生变化时触发一次，包括清空到空（此时 `value` 被省略）。未发生变化的帧不会触发。

载荷是一个普通的 `EventPayload`。`value` 是拼接后的选中文本。

## 它是怎么工作的

选区之所以能工作，是因为每一个被绘制的文本元素都会以**绘制顺序**（即文档顺序）注册进一个逐帧的注册表。一次锚定在某个元素中的拖拽会针对该注册表解析为逐元素的跨度：锚点与末端处是部分选中，中间的全部整段选中。

> [!NOTE]
> **为什么不采用像 Zed 那样的一个大文本元素？**
>
> Zed 的 markdown 之所以能连续选中，是因为它的整个文档是位于单一文本模型之上的单个元素。GPUIX 渲染的是一个文本元素的*树*，因此它改为在绘制时重建这种连续性。该机制移植自 [Comet](https://github.com/zeronsh/comet)（MIT 许可），它曾面临同样的问题。

> [!IMPORTANT]
> **userSelect: none 并不退出搜索**
>
> 浏览器仍然能找到那段文本，因此 GPUIX 仍然会高亮它。只有元素自身的装饰（chrome）、代码行号槽或 diff 文件头会被排除。详见[高亮与搜索](#highlight-search)。

## highlight-search

---
title: 高亮与搜索
description: 'highlight 属性、useTextSearch 查找栏、显式范围，以及虚拟列表下的计数责任。'
eyebrow: 文本能力
---

**`highlight` 属性**会在匹配文本背后绘制一层背景色。把它放在任何元素上，就会作用于该元素的子树，因此放在根节点上会搜索整个窗口，而放在某个容器上则只搜索那个容器。

```tsx
<div highlight={{ query: 'fox' }}>
  <text>the quick brown fox</text>
</div>
```

它能触达 `<text>`、`<code>`、`<markdown>` 与 `<diff>` 而无需额外属性，因为 GPUIX 绘制的每一个字符串都会经过同一个漏斗。

## 一个查找栏

`useTextSearch` 负责光标与计数。`next` 与 `previous` 是普通的事件处理器，因此这里不需要任何 effect。

```tsx
import { useTextSearch } from '@gpuix/react'

function Find() {
  const [query, setQuery] = useState('')
  const search = useTextSearch({ query })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={query} onChange={(e) => setQuery(e.value ?? '')} />
        <text>{search.total === 0 ? 'No results' : `${search.active + 1}/${search.total}`}</text>
        <div onClick={search.previous}><text>↑</text></div>
        <div onClick={search.next}><text>↓</text></div>
      </div>

      <div {...search.props} style={{ flex: 1 }}>
        <Transcript />
      </div>
    </div>
  )
}
```

## 显式范围

当你已经有了偏移量（来自 LSP 范围或你自己的模型）时，直接传入它们，而不是 query。它们是 **UTF-16 码元**下的 `[start, end)`，也就是 `indexOf` 与 `RegExp.exec` 返回的单位。

```tsx
<div highlight={{ ranges: [[6, 11]], color: '#f43f5e55' }}>
  <text>Hello {name}!</text>
</div>
```

> [!IMPORTANT]
> 一对会拆分代理对（surrogate pair）的范围是**被拒绝**的，绝不会被吸附取整。范围只索引 retained 文本；原生元素在 Rust 中构建它们自己的字符串，因此那些情况请使用 `query`。

## 选项

| 字段 | 含义 |
|---|---|
| `query` | 要匹配的子串，默认大小写不敏感 |
| `caseSensitive` | 仅精确匹配大小写 |
| `wholeWord` | 两侧相邻字符都不能是字母数字或 `_` |
| `ranges` | 显式的 `[start, end)` UTF-16 范围对 |
| `color` / `activeColor` | 任意 CSS 颜色；默认值来自主题 |
| `activeIndex` | 哪个匹配获得 `activeColor`，用于查找光标 |
| `matchIndexOffset` | 该子树之前的匹配数；仅用于虚拟化内容 |
| `radius` | 背景色的圆角半径，默认 2 |

传入一个**数组**可以一次性绘制多个，例如搜索匹配项加上一处常驻的提及着色。靠后的条目绘制在更上层。

## 匹配规则

匹配之间**不重叠**，且从左往右取。不区分大小写用的是 Unicode **小写化**而非完整的大小写折叠，所以 `ﬀ` 不会匹配 `ff`。词边界是任何不属于 Unicode Alphabetic、数字或 `_` 的码点。

一个匹配不会跨行，这一点和浏览器的查找完全一致。但它**会**跨过 React 为同一行插值创建的多个宿主节点 —— 这比听起来更重要：

```tsx
// 这里 React 产生了 3 个宿主文本节点，`Hello Tommy` 仍然算一次匹配。
<div highlight={{ query: 'Hello Tommy' }}>
  <text>Hello {name}!</text>
</div>
```

最近的声明胜出，因此一个嵌套的 `highlight` 会为那个子树替换掉其祖先的声明。

## 搜索一个虚拟列表

`<virtual-list>` 永远不会构建屏幕外的行，因此原生层只能看到已挂载的窗口。由此带来两点推论，并且两者都是应用的责任，因为行数据由应用掌握。

**自己统计匹配数**，使用 `findRanges`，它会在你提供的字符串上运行与原生匹配器相同的算法。

**说明你的窗口从哪里开始**，以一个它**上方**的**匹配数**来计，而不是行索引。若不说明，原生层会从零开始给已挂载的行编号，`activeIndex` 就会变成「第 n 个可见匹配」，而查找光标就会落到错误的行上。

这两个数字在 `matches` 中一起传递，因为只给其中一个而漏掉另一个永远是错误的。

```tsx
import { findRanges, useTextSearch } from '@gpuix/react'

// 每行一项，因此前缀和能同时给出这两个数字。
const perRow = useMemo(
  () => rows.map((row) => findRanges({ text: row.text, query }).length),
  [rows, query],
)

const search = useTextSearch({
  query,
  matches: {
    total: perRow.reduce((n, count) => n + count, 0),
    indexOffset: perRow.slice(0, windowStart).reduce((n, count) => n + count, 0),
  },
})

// search.next() 移动光标；滚动由你来做
listRef.current.scrollToItem(rowOfMatch(search.active))
```

`findRanges` 对**同一**字符串匹配原生的算法。请在原生层绘制的相同逻辑行上调用它：同一个父元素下相邻的文本节点算作一行，而 `<markdown>` 绘制的是内联片段（run）而非其源码。

## 为什么是背景色块

`HighlightStyle.background_color` 由 gpui 在原生层绘制，但只有方角，而且无法报告它绘制出的盒子。GPUIX 从 `range_rects`（与选区及行内代码药丸相同的辅助函数）绘制四边形，因此一个软换行后的匹配在每一视觉行上是一个盒子，`getPaintedHighlights()` 无需截图就能对几何做断言。Zed 自己的编辑器出于同样的原因也手动绘制搜索高亮。参见[测试](#testing)。

> [!NOTE]
> `userSelect: "none"` 并不会退出搜索。浏览器仍然能找到那段文本，因此 GPUIX 仍然会高亮它。只有元素自身的装饰（chrome）、代码行号槽或 diff 文件头会被排除。

## native-text

---
title: 原生文本组件
description: '三个在 Rust 侧完成排版与着色的元素，以及如何用 theme 重新调校而无需重新构建。'
eyebrow: 组件
---

有三个元素会使用在 Rust 中计算得到的 Syntect 语法高亮来渲染文本。颜色来自一个主题属性，因此晚到的高亮可以在不改变布局的前提下为各个片段重新着色。

## `<code>`

一个带语法高亮的代码块。每行一行、行高为精确值，因此在高亮运行之前，该块的高度就已经确定。

```tsx
<code
  code={source}
  language="typescript"        // 或 path="src/app.ts" 以从扩展名推断
  showLineNumbers
  style={{
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff1f',
    backgroundColor: '#ffffff09',
  }}
/>
```

`style` 中的 `fontFamily`、`fontSize`、`fontWeight`、`lineHeight` 与 `color` 会覆盖主题。行高是固定的，因此仅靠 `fontSize` 会按主题的比例缩放该高度；传入 `lineHeight` 则可以精确设定。

> [!IMPORTANT]
> **code 不绘制任何属于自己的表面**
>
> 没有填充、边框、圆角、内边距，也没有语言头部。`style` 就是那个表面，因此卡片外观由你决定。
>
> 此外它还有两件事仍由自己负责：行**永不换行**，且该块本身就是自己的水平滚动器。长行会在其内部的水平滚轮下平移，因此 `style` 中的 `whiteSpace` 与 `overflowX` 不起作用。

要加一个语言头部，或任何其他装饰，请把它包进一个你自己的 `<div>`：

```tsx
<div style={{ display: 'flex', flexDirection: 'column', borderRadius: 10, overflow: 'hidden' }}>
  <div style={{ padding: 6, backgroundColor: '#ffffff09' }}>
    <text style={{ fontSize: 12, color: '#a3a3a3' }}>{language}</text>
  </div>
  <code code={source} language={language} style={{ padding: 12, minWidth: 0 }} />
</div>
```

`<markdown>` 不同：它保留自己那张围栏代码块卡片，因为文档渲染器掌握着自身的布局。可以用 `mdCode*` 这组度量值来微调那张卡片。

## `<diff>`

一个统一格式（unified）的 diff 查看器。默认情况下它**随父元素流动**，因此父级列表可以是唯一的滚动器。折叠一个文件会移除它的行（而非隐藏它们），因此一个被折叠的一万行文件只占一行。

用 `maxLines` 来让长补丁保持短小。「显示更多」会触发 `onShowMore`。在那个处理器里清空 `maxLines` 即可显示其余部分。

只有当你需要一个专门的全窗口查看器时，才传入 `scroll` 与一个**有界高度**。那条路径使用 GPUI 的 `list()` 并做虚拟化。不要把它嵌套进另一个滚动器中。参见[滚动](#scrolling)。

```tsx
<diff
  patch={unifiedPatch}
  wordDiff                     // 仅高亮发生了变化的 token
  maxLines={open ? undefined : 24}
  collapsedPaths={['pnpm-lock.yaml']}
  onShowMore={() => setOpen(true)}
  onToggleFile={(e) => toggle(e.value)}
  onLineClick={(e) => console.log(e.oldLine, e.newLine, e.value)}
/>
```

## `<markdown>`

GitHub 风格 markdown：标题、列表、表格、块引用、围栏代码、删除线、任务列表，以及自动链接的裸 URL。

```tsx
<markdown source={readme} onLinkClick={(e) => open(e.value)} />
```

## 主题

这三个组件都接受同一个可选的 `theme` 属性。每一个字段都会叠加在内置的暗色主题之上，因此只覆盖其中一个 token，其余的仍保持原样。

```tsx
<code
  code={source}
  language="rust"
  theme={{
    appearance: 'dark',        // 或 'light'
    accent: '#7c86ff',
    syntax: { keyword: '#f38ba8', string: '#a6e3a1' },
  }}
/>
```

## 布局数字也住在主题里

行高、行号槽宽度、内边距以及标题字号阶梯都位于 `metrics` 下，是属性而非 Rust 常量，因此调校设计只是一次 React 重新渲染，而绝不需要重新构建原生层。

```tsx
<diff
  patch={patch}
  theme={{
    metrics: {
      diffLineHeight: 26,
      diffGutterWidth: 48,
      mdHeadingSizes: [24, 19, 16, 14],
    },
  }}
/>
```

当 `scroll` 开启时，`<diff>` 会从这些数字出发做虚拟化，而无需测量，因此改动 `diffLineHeight` 也会重新调整滚动模型的大小。

> [!TIP]
> **同样这三件事可以完全免去重新构建：** 修改 `patch` 或 `source`，下一帧就会显示。调整 `theme.metrics` 里的行高或标题字号只是一次 React 重渲染。

## 内置语言

Rust、TypeScript、TSX、JavaScript、JSX、Python、Go、JSON、Bash、TOML、YAML、Markdown、HTML、CSS、C。

## 支持的元素

| 元素 | 描述 |
|---|---|
| `div` | 使用 flexbox 布局的容器 |
| `text` | 文本内容，可选中 |
| `code` | 带语法高亮的代码块 |
| `diff` | 统一格式 diff 查看器。默认随父元素流动 |
| `markdown` | GitHub 风格 markdown |
| `input` | 原生单行文本编辑器 |
| `textarea` | 原生多行、自动增高的文本编辑器 |
| `virtual-list` | 长集合；只构建可见的行 |
| `img` | 本地、data URL，或 http(s) 的位图或 SVG 图像 |
| `svg` | 可染色的单色 SVG 图标，来自源码或磁盘 |
| `anchored` | 定位浮层 |
| `canvas` | 自定义绘制（计划中） |

### 几处差异

> [!IMPORTANT]
> **GPUIX 没有 `<button>`。** 一个带 `onClick` 的 `div` 既无法用 Tab 到达，也会忽略键盘。内置的 [`Button` 原语](#headless-controls) 就是为此准备的：它基于 [Base UI Button](https://base-ui.com/react/components/button)，提供 tab 停靠点、`role="button"` 与 Enter / Space 行为。

> [!WARNING]
> **不要把 `<text>` 嵌套进 `<text>`。** 相邻的 `<text>` 兄弟会合并成一行；另一个 `<text>` 内的 `<text>` 子项则会被当作一个嵌套 div 处理。

> [!NOTE]
> **GPUI 的默认文本颜色是黑色而非白色。** 与 CSS 不同，GPUI 不会从父元素继承 `color`。每一个没有显式设置 `color` 样式的 `<text>` 元素都会渲染为黑色 —— 在深色背景上会不可见。请在文本元素或父级 `<div>` 上设置 `color`。

### 各元素详见

| 元素 | 文档 |
|---|---|
| `code` / `diff` / `markdown` | [原生文本组件](#native-text) |
| `input` / `textarea` | [文本输入](#text-input) |
| `virtual-list` | [虚拟列表](#virtual-list) |
| `img` / `svg` | [图像与图标](#图像与图标) |
| `anchored` | [无样式控件](#headless-controls) |
| 事件属性 | [支持的事件](#events) |
| 布局与视觉样式 | [支持的样式](#styling) |

## 图像与图标

### `<img>`

`<img>` 通过 GPUI 的图像元素绘制。它从磁盘、data URL 或 http(s) 加载 **PNG、JPEG、WebP、GIF、SVG、BMP、TIFF、ICO 以及 Netpbm**。这里的 SVG 是一张全彩图像，而非可染色的图标。

```tsx
<img
  src={fileURLToPath(new URL('./photo.png', import.meta.url))}
  objectFit="cover"
  style={{ width: 240, height: 140, borderRadius: 12 }}
/>
```

```tsx
const src = `data:image/png;base64,${Buffer.from(pngBytes).toString('base64')}`

<img src={src} style={{ width: 240, height: 140 }} />
```

```tsx
<img
  src="https://example.com/avatar.png"
  objectFit="cover"
  style={{ width: 48, height: 48, borderRadius: 24 }}
/>
```

> [!IMPORTANT]
> **必须同时设置 `width` 和 `height`。** GPUI 在后台任务里抓取并解码，组件树不会等待。如果没有确定尺寸，盒子在解码前是空的，解码后会跳到位图尺寸。

Data URL 支持上面列出的所有图像格式，接受 base64 与百分号编码的载荷。远程 URL 与磁盘文件共用同一套 GPUI 图像缓存，不会被写入临时文件。

`objectFit` 与 CSS 一致：`"contain"`（默认）、`"cover"`、`"fill"`、`"scaleDown"` 或 `"none"`。空的 `src` 或加载失败会显示一个兜底占位符，而不会崩溃。仍在加载的 URL 会画出一块声明尺寸的空盒子，没有加载转圈。

`borderRadius` 会裁剪位图，GPUI 按这些圆角绘制图像。父级的 `overflow: "hidden"` 包裹层**不会**裁剪 `<img>` 子元素，请把圆角直接写在图像上。

```tsx
<img
  src={avatarUrl}
  objectFit="cover"
  style={{ width: 32, height: 32, borderRadius: 16 }}
/>
```

### 来自缓冲区的实时图像

Data URL 依然可用，但它会把字节 base64 编码进变更 JSON 里。对于波形、canvas 导出，或任何你已存在于内存中的帧，直接通过 `<img>` 的 ref 推送**原始字节**，这个调用会跳过 JSON。

`setImage` 接受已编码的 **PNG、JPEG、WebP、GIF、SVG、BMP、TIFF、ICO 或 Netpbm**。`setImagePixels` 默认接受打包的 **RGBA**。实时波形优先用像素，没有 PNG 编码，也没有 JSON。

当你的数据源本身就产出 **BGRA** 时，传入 `{ format: 'bgra' }`。这是 GPUI 的原生顺序，因此上传会跳过一次逐像素的 swizzle。ffmpeg（`-pix_fmt bgra`）、VideoToolbox 与 node-canvas 的 `toBuffer('raw')` 都产出它。

```ts
img.current?.setImagePixels(width, height, rgba)
img.current?.setImagePixels(width, height, bgra, { format: 'bgra' })
```

> [!WARNING]
> **不要在调用前压缩帧**
>
> PNG 或 JPEG 编码的代价远高于它省下的那点拷贝。

两者都可以在挂载后于 `useLayoutEffect` 中调用。后续 React `src` 的**变更**会覆盖这些像素。Alpha 是直通（straight）的，而非预乘（premultiplied）。

**没有** density 参数。`setImagePixels` 上的 `width` 和 `height` 是位图像素，`style.width` 和 `style.height` 是布局盒子。在 retina 屏幕上，应按盒子尺寸的 **2x**（或 `devicePixelRatio`）上传，否则 GPUI 会把一个逻辑像素拉伸成四个屏幕像素。

```tsx
import { createCanvas } from 'canvas'
import { useLayoutEffect, useRef } from 'react'
import type { ImgInstance } from '@gpuix/react'

function Waveform({ samples }: { samples: Float32Array }) {
  const img = useRef<ImgInstance>(null)

  useLayoutEffect(() => {
    const width = 1600
    const height = 160
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#5ca9ff'
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let x = 0; x < samples.length; x++) {
      const y = height / 2 - samples[x]! * (height / 2 - 8)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    img.current?.setImagePixels(width, height, canvas.toBuffer('raw'), {
      format: 'bgra',
    })
  }, [samples])

  return <img ref={img} objectFit="fill" style={{ width: 800, height: 80 }} />
}
```

node-canvas 的 `toBuffer('raw')` 在小端机器上（所有 Apple Silicon、x86 与 ARM64 桌面机）是 **BGRA**，且无行内填充。它是**预乘**的，而 GPUIX 期望直通 alpha，两者只有在像素不透明时才一致，所以示例先填充背景。对于透明 canvas，请用 `getImageData().data` 并以默认的 `'rgba'` 格式。

[波形示例](https://github.com/remorses/gpuix/blob/main/examples/waveform.tsx) 就是手写 BGRA、按 2x 上传的。

### `<svg>`

`<svg>` 使用 GPUI 的**单色图标渲染器**。原始 `source` 在桌面端和浏览器里都有效。桌面应用也能用本地 `src` 路径。图标作为一个形状被绘制，并用 `style.color` 上色。

> [!TIP]
> 对于应用图标，优先用**原始 SVG 源码**。它能同时兼容 GPUIX 两个目标平台，并让打包器把每个图标内联进 JavaScript 包。只有当桌面应用有意分发松散的资源文件时才用 `src`。

`src` 是文件系统路径**或**一个 `data:image/svg+xml,…` URL。Vitest 与部分 Bun 的 `import … with { type: 'file' }` 绑定会输出 data URL，GPUIX 两者都能解码。

> [!IMPORTANT]
> `style.color` 是必需的。没有它图标不会绘制。优先在文件里使用 `fill="#000"` 或 `stroke="#000"`。SVG 中的 `currentColor` 与 `style.color` 不是同一回事。

#### Bun

用 Bun 的 [`text` loader](https://bun.sh/docs/bundler/loaders#text)。该导入是一个包含完整 SVG 的字符串，`bun build` 会把它嵌入产物中。

```tsx
import searchSvg from './assets/icons/search.svg' with { type: 'text' }

<svg
  source={searchSvg}
  style={{ width: 16, height: 16, color: '#b4b4b4' }}
/>
```

聊天示例就是这样用原始 SVG 源码构建出每个侧边栏与输入栏图标的。

#### Node.js

对于受支持的 Node.js 版本，相对模块读取一次图标即可。用 `URL` 可以跨操作系统保持路径正确，并避开 `__dirname`。

```tsx
import { readFileSync } from 'node:fs'

const searchSvg = readFileSync(
  new URL('./assets/icons/search.svg', import.meta.url),
  'utf8',
)

<svg
  source={searchSvg}
  style={{ width: 16, height: 16, color: '#b4b4b4' }}
/>
```

Node.js 也有 [text modules](https://nodejs.org/api/esm.html#text-modules)，但当前需要 `--experimental-import-text`。在 text import 不再需要运行时标志之前，优先用 `readFileSync`。

## events

---
title: 支持的事件
description: '全部事件属性与载荷字段、指针捕获的触发规则，以及滚轮不冒泡这一点。'
eyebrow: 参考
---

| 事件 | 属性 | 载荷字段 |
|---|---|---|
| 点击 | `onClick` | `x`, `y`, `button`, `clickCount`, `isRightClick`, `modifiers` — 仅主键 |
| 辅助点击 | `onAuxClick` | `x`, `y`, `clickCount`, `isRightClick`, `modifiers` — 非主键 |
| 鼠标按下 | `onMouseDown` | `x`, `y`, `button`, `clickCount`, `modifiers` |
| 鼠标抬起 | `onMouseUp` | `x`, `y`, `button`, `clickCount`, `modifiers` |
| 鼠标进入 | `onMouseEnter` | `hovered` |
| 鼠标离开 | `onMouseLeave` | `hovered` |
| 鼠标移动 | `onMouseMove` | `x`, `y`, `pressedButton`, `modifiers` |
| 外侧点击 | `onMouseDownOutside` | `x`, `y`, `button`, `modifiers` |
| 按键按下 | `onKeyDown` | `key`, `keyChar`, `isHeld`, `modifiers` |
| 按键抬起 | `onKeyUp` | `key`, `keyChar`, `modifiers` |
| 获得焦点 | `onFocus` | — |
| 失去焦点 | `onBlur` | — |
| 滚动 | `onScroll` | `deltaX`, `deltaY`, `precise`, `touchPhase`, `modifiers` |
| 文件拖入 | `onFileDrop` | `paths`, `x`, `y` — 来自 Finder 或系统的 Unicode 文件系统路径 |
| 变更 | `onChange` | `value` — 仅 `<input>` 与 `<textarea>` |
| 提交 | `onSubmit` | `value` — `<input>` 始终触发，`<textarea>` 在设置了 `onSubmit` 时触发 |
| 切换文件 | `onToggleFile` | `value`（文件路径）— 仅 `<diff>` |
| 展开更多 | `onShowMore` | `value`（隐藏行数）— 仅 `<diff>` |
| 行点击 | `onLineClick` | `value`, `oldLine`, `newLine` — 仅 `<diff>` |
| 链接点击 | `onLinkClick` | `value`（URL）— 仅 `<markdown>` |
| 选区变更 | `onSelectionChange` | `value`（拼接后的选中文本）— `render()` 上的窗口级事件 |

键盘与焦点监听器会自动创建一个持久的 GPUI `FocusHandle`。仅加监听器并不会把 `div` 放进 Tab 顺序；为此要加上 `tabIndex={0}`。输入框与多行文本框已经使用 tab index `0`。

## 监听器可以放在哪里

把监听器放在 `div`、`text`、`img`、`svg`、`input`、`textarea`、`code`、`markdown`、`diff` 或 `anchored` 上。

`<virtual-list>` 不接受该事件，请把它包起来：

```tsx
<div
  onFileDrop={(event) => openFiles(event.paths ?? [])}
  style={{ width: 400, height: 300 }}
>
  <virtual-list estimatedItemHeight={24}>{rows}</virtual-list>
</div>
```

## 文件拖放

来自 Finder 或系统的文件拖放会落在注册了 `onFileDrop` 的悬停元素上。`paths` 是绝对 Unicode 文件系统路径的数组。`x` 和 `y` 是窗口像素坐标系下的拖放落点。空拖放，或拖放中包含非 Unicode 路径时，不会触发。

## 指针捕获

同时监听 `onMouseDown` 和 `onMouseMove` 的节点会**捕获指针**，类似 HTML 的 [`setPointerCapture`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)。在指针离开命中区、离开父级、离开窗口之后，`onMouseMove` 和 `onMouseUp` 仍会继续触发。只有 `onMouseDown` / `onMouseUp` 的节点不会捕获，所以在外部松开时点击依然会结束。

捕获由**按下动作本身**触发，所以请把三个监听器都放在用户抓取的那个元素上：

```tsx
<div
  style={{ cursor: 'grab', active: { cursor: 'grabbing' } }}
  onMouseDown={(e) => beginDrag(e)}
  onMouseMove={(e) => moveDrag(e)}
  onMouseUp={endDrag}
/>
```

> [!WARNING]
> 按下时挂载的全窗口遮罩无法替代这一点。按下发生时遮罩还不存在，所以它永远无法触发捕获，越过窗口边缘的松开动作就会丢失。手势进行中只有被按下的元素会收到移动事件，其余情况下只有悬停元素会收到，因此代价是每次指针移动一个事件。

捕获仅在**左**键按下时触发。右键拖拽不会被捕获，因此指针离开元素时就会结束。

`onClick` 在左键松开时触发。其它按键请用 `onAuxClick` 并读取 `event.isRightClick`。`onMouseDown` 与 `onMouseUp` 通过 `event.button`（`0` 左键、`1` 中键、`2` 右键）能看到每一个按键。

## 滚轮不冒泡

> [!IMPORTANT]
> 滚轮不像 DOM 事件那样冒泡。GPUI 只对一层已绘制元素做命中测试，因此滚轮会传到元素**背后**的任何一个可滚动容器上，而不只是祖先。一个浮在无关滚动面板上方的绝对定位卡片，会把那个面板滚起来。给真正的遮罩元素设置 `pointerEvents: "auto"`，让它连滚轮也一起吞掉。

`<anchored>` 默认就会遮挡，并有独立的 `occlude` prop，因此菜单与 tooltip 两者都不需要自己处理这件事。

> [!NOTE]
> `pointerEvents: "none"` 意味着该元素**不插入命中盒**，所以它不会挡住身后的任何东西。它并不会禁用同一元素上的监听器，也不会被继承，因此子元素仍保留自己的命中盒。

一个填充了内容、位于点击目标内部的子元素（开关滑块、单选点、勾选图标）需要 `pointerEvents: "none"`，否则它会吃掉父元素的点击。对于 Select 与 Combobox 的行，请改用 item 原语的 `asChild` prop。详见[无样式控件](#headless-controls)。

## styling

---
title: 支持的样式
description: '完整属性清单、颜色文法、渐变与阴影写法，以及 hover / active / focusVisible 的原生行为。'
eyebrow: 参考
---

通过 `style` 属性做类 CSS 的样式设置：

```tsx
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
  backgroundColor: '#3b82f6',
  borderRadius: 8,
}}>
  <div style={{ color: '#ffffff', fontSize: 18 }}>
    Hello GPUI!
  </div>
</div>
```

> [!IMPORTANT]
> **GPUIX 的样式看起来像 CSS，但不是 CSS**
>
> 几个差异会在第一个项目里绊倒所有人：
>
> - **`div` 是块级，不是 flex。** 在使用 `flexDirection`、`gap`、`alignItems` 或 `alignSelf` 之前要先设 `display: "flex"`。不设的话这些属性会被静默忽略。
> - **需要收缩的 flex 子项需要 `minWidth: 0`。** 规则和 CSS 一致，但因为没有浏览器 DevTools 可检查而更容易遗漏。
> - **没有简写值。** `padding`、`margin` 和 `border` 只接受数字。像 `"0 16px"`、`"1px solid #fff"` 或 `calc()` 这类 CSS 字符串会被忽略。
> - **`boxShadow` 是结构化对象**，不是 CSS 字符串。见下文。
> - **没有 `<button>`。** 用 `<div onClick>` 配合 `cursor: "pointer"`，或使用 `Button` 原语。
> - **不要把 `<text>` 嵌套进 `<text>`。** 相邻的 `<text>` 兄弟会合并成一行。另一个 `<text>` 内的 `<text>` 子项是一个嵌套 div。
> - **`<input>` 没有默认内边距。** 在 input 的样式上设 `padding`，或在父包裹层上留白。input 会自动按其自身的 `borderRadius` 裁剪。

## 属性总览

**布局：** `display`（`"flex"` | `"grid"`）、`flexDirection`、`flexWrap`、`flexGrow`、`flexShrink`、`flexBasis`、`alignItems`、`alignSelf`、`alignContent`、`justifyContent`、`gap`、`rowGap`、`columnGap`、`gridTemplateColumns`、`gridTemplateRows`、`gridColumnMin`、`gridRowMin`

**尺寸：** `width`、`height`、`minWidth`、`minHeight`、`maxWidth`、`maxHeight` — 接受像素（数字）或百分比（如 `"100%"` 这样的字符串）

**间距：** `padding`、`paddingTop/Right/Bottom/Left`、`margin`、`marginTop/Right/Bottom/Left`

**定位：** `position`（`"relative"` | `"absolute"` | `"fixed"`）、`top`、`right`、`bottom`、`left` — `"fixed"` 的布局方式同 `"absolute"`，因为 GPUI 没有可固定其上的滚动文档

**视觉：** `background`、`backgroundColor`、`color`、`opacity`、`cursor`、`pointerEvents`、`borderRadius`、`borderTopLeftRadius`、`borderTopRightRadius`、`borderBottomLeftRadius`、`borderBottomRightRadius`、`borderWidth`、`borderTopWidth`、`borderRightWidth`、`borderBottomWidth`、`borderLeftWidth`、`borderColor`、`boxShadow`、`outlineWidth`、`outlineColor`、`outlineOffset`

**溢出：** `overflow`、`overflowX`、`overflowY` — `"hidden"` 裁剪内容，`"scroll"` 创建一个带有持久滚动状态的原生可滚动容器

**文本：** `fontSize`、`fontFamily`、`fontWeight`、`textAlign`、`lineHeight`、`whiteSpace`、`textOverflow`、`lineClamp`、`textDecoration`（`"underline"` | `"line-through"` | `"none"`）

**选区：** `userSelect`（`"text"` | `"none"`）、`selectionColor` — 两者都会沿树向下继承

**焦点：** `focusVisible`

## 光标

`cursor` 接受 CSS 关键字。未列出的关键字会被忽略，就像其它无效的样式值一样。

| 分组 | 关键字 |
|---|---|
| 指向 | `default`、`auto`、`pointer`、`context-menu`、`not-allowed`、`no-drop` |
| 文本 | `text`、`vertical-text`、`crosshair` |
| 拖拽 | `grab`、`grabbing`、`move`、`all-scroll`、`alias`、`copy` |
| 缩放 | `col-resize`、`row-resize`、`ew-resize`、`ns-resize`、`nwse-resize`、`nesw-resize`、`n-resize`、`e-resize`、`s-resize`、`w-resize`、`ne-resize`、`nw-resize`、`se-resize`、`sw-resize` |

```tsx
<div style={{ cursor: 'grab', active: { cursor: 'grabbing' } }} />
<div style={{ cursor: 'col-resize' }} />
```

## 颜色

所有带颜色的样式字段都接受同一套字符串文法。GPUIX 原生使用 `csscolorparser` 0.8.3，接受：

- 具名颜色与 `transparent`；
- 3/4/6/8 位十六进制，带不带 `#` 均可；
- `rgb()` / `rgba()`、`hsl()` / `hsla()`、`hwb()` / `hwba()`，以及 `hsv()` / `hsva()`；
- `lab()`、`lch()`、`oklab()`，以及 `oklch()`；
- `none` 分量，以及解析器有限的相对颜色 `from` / `calc()` 形式。

标准逗号写法与现代空格/斜杠 alpha 写法都可用。GPUI 绘制前会把值转换为硬裁剪的 sRGB。无效字符串只会被该属性忽略，不会拒绝整个样式对象。

### 线性渐变

`background` 接受 GPUI 原生的**两色标线性渐变**。角度遵循 CSS 规则：`0` 指向上方，数值顺时针增大。色标位置用 `0` 到 `1`。

```tsx
<div
  style={{
    background: {
      type: 'linear-gradient',
      angle: 90,
      stops: [
        { color: '#7c3aed', position: 0 },
        { color: '#06b6d4', position: 1 },
      ],
      colorSpace: 'oklab',
    },
    borderRadius: 12,
  }}
/>
```

`colorSpace` 可选，默认为 `"srgb"`。GPUI 也支持 `"oklab"`。它不支持径向、锥形、重复渐变，也不支持超过两个色标的渐变。

`hsv()`、`hsva()` 与 `hwba()` 是解析器的扩展，而非 CSS Color 4 标准函数。`color()`、平台/动态颜色，以及数值形式的颜色整数均不被接受。

### 现代颜色语法

主题值可以使用同样的现代文法：

```tsx
const theme = {
  surface: 'oklch(18% 0.02 260)',
  accent: 'oklch(67.3% 0.182 276.935)',
  text: 'oklch(96% 0 0)',
}

<div style={{ backgroundColor: theme.surface, borderColor: theme.accent }}>
  <text style={{ color: theme.text }}>Hello GPUI!</text>
</div>
```

有限的相对颜色形式可以从一个基准值派生出新颜色：

```tsx
<div
  style={{
    backgroundColor: '#bad455',
    borderColor: 'oklch(from #bad455 calc(l - 0.15) calc(c * 0.7) h)',
  }}
/>
```

## 阴影

`boxShadow` 接受单个结构化阴影。其字段为 `offsetX`、`offsetY`、`blurRadius`、`spreadRadius` 与 `color`：

```tsx
<div
  style={{
    boxShadow: {
      offsetX: 0,
      offsetY: 4,
      blurRadius: 12,
      spreadRadius: 0,
      color: '#00000033',
    },
  }}
/>
```

## 悬停与激活

`hover` 与 `active` 是**嵌套的样式对象**。当指针悬停在元素上或鼠标按下时，GPUI 会以原生方式应用它们，没有 JavaScript 往返。

```tsx
<div
  style={{
    backgroundColor: '#313244',
    borderRadius: 8,
    padding: 12,
    hover: { backgroundColor: '#45475a' },
    active: { backgroundColor: '#585b70' },
  }}
>
  Press
</div>
```

嵌套只有一层深。`hover` 对象中不能再包含另一个 `hover` 或 `active`。

它们对**所有**元素都有效，包括 `<text>`、`<code>`、`<markdown>`、`<diff>`、`<img>`、`<svg>` 以及编辑器。唯一的例外是 `<virtual-list>`，它的 `style` 类型不接受它们：gpui 的列表没有可持有悬停或按下状态的交互身份，所以请把它们放在包裹用的 `<div>` 上。

## 焦点样式

`focusVisible` 是一个嵌套样式对象，类似 `hover`。它在元素拥有焦点**且最后一次输入来自键盘**时应用，类似 CSS 的 `:focus-visible`。GPUI 会以原生方式应用它。

鼠标按下永远不会显示它，文本字段也一样。没有单独的 `focus` 键。

```tsx
<div
  tabIndex={0}
  style={{
    borderRadius: 8,
    backgroundColor: '#313244',
    focusVisible: { outlineWidth: 2, outlineColor: '#89b4fa', outlineOffset: 2 },
  }}
/>
```

它需要一个**可聚焦**的元素：`tabIndex`、某个键或焦点监听器、`<input>`、`<textarea>`，或 `Button` 之类的原语。

### 默认行为：其余一切变暗

GPUIX 不画任何环。当某个控件（`Button`、设置了 `tabIndex` 的 div）拥有键盘焦点时，每一个**其它**可聚焦元素都会以 40% 的不透明度渲染。被聚焦的那个保持原样，于是你能一眼看清 Tab 能到达的所有元素。

```text
Tab  ► [ 保存 ]  (新建变暗)  (搜索变暗)  (输入框变暗)
```

- 鼠标按下、拖拽，或鼠标移动超过 8px 会结束变暗。手搭在触控板上产生的更小抖动则保留。
- 聚焦的 `<input>` 或 `<textarea>` 不会让任何元素变暗：打字同样属于键盘输入，且光标已经表明了焦点。
- 被聚焦元素的祖先永远不会变暗，因为不透明度会覆盖整棵子树。
- `focusVisible` 与变暗是**相互独立**的。一个从 `focusVisible` 获得环的元素，在另一个控件拥有焦点时仍会变暗。
- `style.keyboardFocusDim: false` 会让单个元素保持完全不透明。`Select.Content` 和 `Dialog.Popup` 会设置它。

```tsx
<div tabIndex={0} style={{
  focusVisible: { outlineWidth: 2, outlineColor: '#89b4fa' }, // 获得焦点时
}} />                                                         // 否则变暗
<div tabIndex={0} style={{ keyboardFocusDim: false }} />      // 永不变暗
```

**对整个窗口关闭变暗。** 向 `render()`（或 `createTestRoot()`）传入 `keyboardFocusDim: false`，然后用 `focusVisible` 自己设置焦点样式。

```tsx
render(<App />, { keyboardFocusDim: false })
```

**是描边（outline）不是边框（border）。** `outlineWidth`、`outlineColor` 与 `outlineOffset` 在边框盒外侧画线，类似 CSS 的 `outline`。它**不占布局空间**，所以用 `focusVisible` 加的环不会移动任何东西。负的 offset 会把它画在内侧。它遵循 `borderRadius`。设置了 `overflow: "hidden"` 的父级会裁剪它，就像在浏览器里一样。

## 两处文本注意事项

> [!WARNING]
> **white-space: pre 不受支持**
>
> GPUI 的文本系统只有 `normal`（自动换行）和 `nowrap`（单行）。要像 HTML `<pre>` 那样保留换行，请在 React 里按 `\n` 切分文本，并把每一行作为独立的 `<text>` 元素渲染在一个 flex 纵向容器里：
>

> [!IMPORTANT]
> **GPUI 默认文本颜色是黑色而非白色。** 与 CSS 不同，GPUI 不会从父元素继承 `color`。每一个没有显式设置 `color` 样式的 `<text>` 元素都会渲染为黑色 —— 在深色背景上会不可见。请务必在你的文本元素或父级 `<div>` 上设置 `color`（父级 `<div>` 会通过 GPUI 的 `Styled` trait 把 `text_color` 应用到该子树的所有子元素）。

## automation

---
title: 自动化
description: '三种宿主（测试 root、浏览器页面、子进程）共用一套客户端，含定位器、鼠标与时钟控制。'
eyebrow: 自动化
---

用 **`testId`** 标记元素，然后像 Playwright 那样驱动它们。同一个客户端可在 vitest、浏览器页面内，以及针对子进程时使用。鼠标操作在三种宿主里都走普通的 GPUI 输入路径。

```tsx
<div testId="sidebar-collapse" onClick={onCollapse}>‹</div>
<textarea testId="composer" value={draft} onChange={...} />
<div testId="send" onClick={onSend}>↑</div>
```

```ts
import { createTestRoot } from '@gpuix/react'
import { connectTest } from '@gpuix/react/automation'
import { ChatApp } from './chat'

const { render, renderer } = createTestRoot()
render(<ChatApp />)
const app = await connectTest(renderer)

await app.screenshot({ path: 'open.png' })

await app.clock.pause()
await app.getByTestId('sidebar-collapse').click()
await app.clock.fastForward(200)
await app.screenshot({ path: 'collapsed.png' })

await app.getByTestId('composer').fill('hello gpuix')
await app.getByTestId('send').click()
await app.screenshot({ path: 'sent.png' })
```

这就是聊天示例。真正的测试位于 [`examples/chat.test.tsx`](https://github.com/remorses/gpuix/blob/main/examples/chat.test.tsx)。

```text
createTestRoot()          browser render()          launch({ command, args })
       │                         │                              │
       ▼                         ▼                              ▼
connectTest(renderer)      globalThis.gpuix                child stdin / stdout
       │                         │                              │
       └─────────────────────────┴──► App / Locator ◄───────────┘
                                  click, fill, query, clock
```

## 浏览器应用

每次浏览器渲染都会把自动化 `App` 安装为 **`globalThis.gpuix`**。在 `render()` 返回后它始终可用，无需设置标志或独立的传输层。

```ts
await page.evaluate(async () => {
  await globalThis.gpuix
    .getByTestId('sidebar-collapse')
    .click()

  await globalThis.gpuix
    .getByTestId('composer')
    .fill('hello from Playwriter')

  await globalThis.gpuix.clock.pause()
  await globalThis.gpuix.clock.fastForward(200)
})
```

浏览器全局对象支持定位器、输入、树与文本查询、边界、选区、滚动、焦点以及时钟控制。浏览器页面无法写入任意的本地截图路径，请用控制浏览器的工具来做：

```ts
await page.screenshot({ path: 'review/chat.png', scale: 'css' })
```

边界返回的是**画布像素**而非 CSS 像素，因为那是 GPUI 布局所用的坐标系。在 2x 屏幕上，坐标 `x: 44` 的 locator 对应 CSS `x: 22`。在把矩形交给浏览器工具之前要先做转换：

```ts
const scale = await page.evaluate(() => {
  const canvas = document.querySelector('canvas')!
  return canvas.width / canvas.clientWidth
})
const { bounds } = await page.evaluate(() =>
  globalThis.gpuix.getByText('New Task').waitFor(),
)
await page.screenshot({
  scale: 'css',
  clip: {
    x: bounds.x / scale,
    y: bounds.y / scale,
    width: bounds.width / scale,
    height: bounds.height / scale,
  },
})
```

不要为此去读 `window.devicePixelRatio`。自动化工具可能在 GPUI 已经确定画布尺寸之后覆盖了视口缩放因子，那时两者就会产生分歧。

## 定位器

| 调用 | 匹配 |
|---|---|
| `app.getByTestId('send')` | `testId` 属性 |
| `app.getByText('New chat')` | 节点自身的文本 |
| `app.getByType('textarea')` | 宿主元素类型 |
| `locator.getByText('...')` | 另一个定位器的后代 |

`click()` 命中最后一次绘制边界的中心。`fill(text)` 替换获得焦点的编辑器内容。`press('enter')` 发送一个按键。`waitFor()` 会轮询直到恰好存在一个匹配。`textContent()` 返回节点自身及所有后代的文本，类似 DOM 的 `textContent`。

## 鼠标、滚轮与拖拽

| 调用 | 作用 |
|---|---|
| `locator.hover()` | 把指针移动到中心，从而触发悬停样式与工具提示 |
| `locator.wheel(dx, dy)` | 在中心上触发一次滚轮事件 |
| `locator.dragBy(dx, dy)` | 在中心按下、移动、松开 |
| `locator.dragTo(target)` | 同上，但结束于另一个定位器或一个 `{ x, y }` 点 |
| `app.mouse.move / down / up / click` | 窗口坐标系下的原始指针输入 |
| `app.mouse.wheel(target, dx, dy)` | 在某个点或定位器上的滚轮事件 |
| `app.mouse.drag(from, to)` | 在两个点、两个定位器或混合之间拖拽 |

拖拽发送的是**插值的移动**而非一次跳跃，因为吸附、实时预览以及按移动提交只有在指针真正移动时才会出现。传入 `steps` 控制步数，传入 `offset` 让按下位置偏离中心。

```ts
await app.getByTestId('clip-7').dragBy(120, 0, { steps: 6 })
await app.getByTestId('clip-7-trim-end').dragTo(app.getByTestId('clip-8'))
await app.mouse.drag({ x: 240, y: 500 }, { x: 700, y: 620 })
```

每个鼠标调用都接受与 `press('cmd-a')` 相同语法的 **`modifiers`**，因此 cmd-滚轮缩放、shift-点击范围选择，以及 alt-拖拽复制都可被测试：

```ts
await app.getByTestId('canvas').wheel(0, 120, { modifiers: 'cmd' })
await app.getByTestId('clip-8').click({ modifiers: 'shift' })
```

> [!IMPORTANT]
> **click() 需要已绘制的边界**
>
> 每个接受 `testId` 的元素都会记录它们，包括 `<img>`、`<svg>` 与 `<anchored>`。`<anchored>` 报告的是浮层自身而非其锚定触发器的盒子，所以即便浮层被延迟并吸附回窗口内侧，`click()` 依然会落在菜单上。
>
> `<virtual-list>` 是例外，它不接受 `testId`。gpui 的列表不是交互元素，因此无从记录边界盒子。请把定位器放在包裹用的 `<div>` 上。

## 截图与时钟

`app.screenshot({ path })` 把当前 GPU 帧写成 PNG。

`app.clock.pause()`、`set(ms)` 与 `fastForward(ms)` 会冻结原生动画时间。用它可以在已知时间戳处捕获侧边栏动画：

```ts
const startedAt = await app.clock.pause()
await app.getByTestId('sidebar-collapse').click()
await app.captureFrames('review/sidebar', [
  startedAt,
  startedAt + 100,
  startedAt + 200,
])
```

## 实时应用

`launch({ command, args })` 启动应用，并通过 stdin 以与 SSE `data:` 行相同的方式发送命令。应用仅在 stdin 是**管道**时才监听，因此普通的终端运行不受影响。没有 `data:` 前缀的行会被忽略，`console.log` 不会破坏消息。

```ts
import { launch } from '@gpuix/react/automation'

const app = await launch({
  command: 'bun',
  args: ['examples/chat.tsx'],
  env: { GPUIX_BACKGROUND: '1' },
})
await app.getByTestId('composer').fill('hello')
await app.getByTestId('composer').press('enter')
await app.getByText('hello').waitFor()
await app.screenshot({ path: 'live.png' })
await app.close()
```

> [!WARNING]
> 每个实时应用检查都必须设置 `GPUIX_BACKGROUND=1`，并且应用的入口必须把该标志映射为 `focus: false`。在 macOS 与 Windows 上，自动化会走真实的窗口输入与绘制管线，但并不会激活窗口，因此占用用户键盘并无测试价值。Linux 目前忽略 `focus`。

`fill()` 与 `press()` 经由实时 GPUI 窗口输入管线派发，因此原生 `<input>` 与 `<textarea>` 元素接收的是 GPUI 的键盘与 IME 处理，而非仅供测试的输入路径。

更多背景见[后台启动与 agent 驱动](#后台启动与-agent-驱动)。

## testing

---
title: 测试
description: 'GPU 支撑的测试渲染器、低层事件模拟 API，以及断言数字而非像素的写法。'
eyebrow: 自动化
---

[自动化](#automation)里的定位器构建在一个 **GPU 支撑的测试渲染器**（`TestGpuixRenderer`）之上。它与生产环境运行相同的 `GpuixView`、`build_element()`、`apply_styles()` 与事件处理程序。测试窗口被放置在屏幕外，并由 macOS 上的 Metal 或 Windows 上的 DirectX 渲染。当定位器不够用时，下面这些方法是更底层的 API。

| 平台 | 测试渲染器 | PNG 捕获 |
|---|---|---|
| macOS | Metal | 支持 |
| Windows | DirectX | 支持 |
| Linux | 暂不支持 | 等待 GPUI 的 wgpu 无头渲染器 |

```ts
import { createTestRoot } from '@gpuix/react/testing'

const { root, renderer } = createTestRoot()

root.render(<MyComponent />)
renderer.flush()  // 在原生 GPU 上触发 GpuixView::render()

// 通过 GPUI 的原生输入管线模拟事件
renderer.nativeSimulateClick(50, 50)
renderer.nativeSimulateKeystrokes('enter')

// 检查结果
const events = renderer.drainNativeEvents()
renderer.captureScreenshot('/tmp/test.png')
const text = renderer.getAllText()
```

## 测试原生元素

`getAllText()` 只能看到留存树中的 `<text>` 节点。`<code>`、`<diff>` 与 `<markdown>` 是在 GPUI 内部绘制文本的，因此要用 `getPaintedText()`，它会按绘制顺序返回最后一帧里绘制的所有字符串：

```ts
root.render(<code code={'a\nb'} language="ts" />)
expect(renderer.getPaintedText()).toEqual(['a', 'b'])
```

选区有专门的辅助方法。监听器是在**绘制**期间注册的，所以 `dragSelect` 会在每一步之间刷新；如果没有这些刷新，手动调用 `simulateMouseDown` / `Move` / `Up` 将选不中任何内容：

```ts
expect(renderer.dragSelect(20, 30, 900, 300)).toBe('first line\nsecond line')
```

高亮是一个**四边形（quad）**，所以无论怎么 `getPaintedText()` 都看不到它。请用 `getPaintedHighlights()`，它会以 UTF-16 单位报告匹配范围，以及它实际绘制的盒子（每个可视行一个）：

```ts
root.render(
  <div highlight={{ query: 'quick' }}>
    <text>the quick brown fox</text>
  </div>,
)
const [hit] = renderer.getPaintedHighlights()
expect(hit.text.slice(hit.start, hit.end)).toBe('quick')
expect(hit.rects).toHaveLength(1)
```

## 断言数字，而非像素

对于一个有状态的交互面，把你想断言的状态绘制进一个 **readout** 元素，再用 `textContent()` 读取。截图只告诉你有东西变了；readout 会告诉你变了什么，而且失败信息会直接给出那个数字。

```tsx
<text testId="readout">{`x=${scrollX} y=${scrollY} zoom=${zoom} sel=${selected}`}</text>
```

```ts
const readout = await app.getByTestId('readout').textContent()
expect(readout).toBe('x=140 y=60 zoom=24 sel=clip-7')
```

[`examples/timeline.test.tsx`](https://github.com/remorses/gpuix/blob/main/examples/timeline.test.tsx) 里的每个测试都用这种方式工作，包括拖拽、裁剪、吸附与缩放手势。同时保留截图，供运行后人工查看。

> [!IMPORTANT]
> **性能采样必须包含 renderer.flush()**
>
> 否则你计时的只是 React 更新，而不包含随后发生的任何 GPUI 构建、布局与绘制。参见[虚拟列表](#可平移表面必须裁剪)中的 p50 对比。

## 截图落盘位置

截图落在 `packages/react/screenshots/` 与 `examples/screenshots/`，两者都在 gitignore 中，因此可在运行后检查，而不会给每次提交增加一个二进制 diff。README 引用的精选图集位于 `docs/images/`，可用以下命令重新生成：

```bash
bun scripts/screenshots.ts
```

## developing-rust

---
title: 开发 Rust 侧
description: '为什么原生模块无法热重载、重新编译的实际耗时，以及 bun run dev 的工作流。'
eyebrow: 参考
---

JS 重挂载已在[热重载](#热重载)里讲过。原生那一半**没有热重载**，也不可能做到：对 `.node` 文件的 `require()` 会调用 `process.dlopen`，而 Node 没有配套的卸载，活动状态（GPUI 的平台、GPU 设备、已打开的窗口、UI 线程以及选区注册表）都留在已加载的库里。第二次加载会在第一个库仍被加载的同时创造出独立的原生状态。

重新编译足够快，所以其实无所谓。在一台 M 系列 Mac 上改动一个文件后实测：

| 步骤 | 耗时 |
|---|---|
| `cargo check --lib` | 1.5s |
| `cargo build --lib` | 4.9s |
| `bun run build:debug` (napi) | ~2s |
| 单个 vitest 截图文件 | ~2s |

`bun run dev` 把这套流程串成一个循环：它监视 `packages/native/src`，重新编译并重渲染截图测试。**从改动 Rust 到生成新 PNG 大约 4 秒。**

```bash
bun run dev                      # rebuild, re-render the showcase screenshots
bun scripts/dev.ts --shots diff  # only tests matching "diff"
bun scripts/dev.ts --app native-text   # rebuild, restart an example app
```

> [!TIP]
> 截图模式是更好的默认选择。用 Preview.app 打开 `packages/react/screenshots/showcase.png`，它会在写入时自动刷新；而且与现实窗口不同，PNG 也能被 agent 读取。

## 两件完全避免重新编译的事

- **内容**本身就在 props 里。修改 `patch` 或 `source`，下一帧就会显示。
- **设计数值**在 `theme.metrics` 里。调整行高或标题字号只是一次 React 重渲染。

参见[原生文本组件](#布局数字也住在主题里)。

## 确定性调度

测试渲染器使用 `VisualTestAppContext` 配合 `TestDispatcher` 来实现确定性调度。事件模拟走的是 GPUI 基于坐标的命中测试与派发 —— 而不是合成的 JS 事件。

详见[测试](#testing)。

## 贡献指南

详细的架构、通信流程与贡献指南见 [AGENTS.md](https://github.com/remorses/gpuix/blob/main/AGENTS.md)。

## 实现状态

### 核心运行时

- [x] 基于 mutation 协议的 React reconciler
- [x] 通过 napi-rs 与 wasm-bindgen 实现的原子化 `applyBatch()` 变更传输
- [x] RetainedTree（Rust 侧元素存储）
- [x] 样式映射（CSS 属性 → GPUI 样式方法）

### 事件与输入

- [x] 鼠标事件（click、mouseDown、mouseUp、mouseMove、mouseEnter、mouseLeave）
- [x] 外侧点击（`onMouseDownOutside`）
- [x] 带 delta 与触摸相位的滚轮事件
- [x] 键盘事件（keyDown、keyUp），带焦点管理
- [x] 获得/失去焦点事件，自动创建 FocusHandle
- [x] 原生文本输入与多行 textarea

### 布局与绘制

- [x] 可滚动容器（`overflow: "scroll"`），带持久滚动状态
- [x] 编程式滚动 API（`scrollTo`、`scrollToItem`、`scrollIntoView`、`getScrollOffset`）
- [x] 虚拟列表（`<virtual-list>`）
- [x] 原生文本组件（`<code>`、`<diff>`、`<markdown>`）
- [x] 图像与 SVG 元素（`<img>`、`<svg>`），以及 `<img>` ref 上的 `setImage` / `setImagePixels`
- [x] 原生 `hover` 与 `active` 样式
- [x] 原生 `motion.div` 过渡，带确定性帧捕获
- [x] `motion.div` 的 `AnimatePresence` 退场过渡
- [ ] Canvas 元素

### 文本能力

- [x] 跨元素文本选区
- [x] 文本高亮与搜索（`highlight`、`useTextSearch`）
- [x] 无样式 Select、Combobox 与 Tooltip

### 窗口

- [x] 窗口标题（`setWindowTitle`）
- [x] 原生窗口控制（`minimizeWindow`、`zoomWindow`、`toggleFullscreen`）
- [x] 窗口装饰（`titlebarTransparent`、`windowBackground`、红绿灯位置）
- [x] 带标准快捷键的 macOS 菜单栏（`appName`）
- [x] 后台启动（`focus`、`show`、`activateWindow`）
- [x] 最后一个窗口关闭时退出进程
- [x] 运行时错误保持 macOS 窗口存活并显示堆栈浮层
- [x] 调试边框浮层（`debugFrameOverlay` / `setDebugFrameOverlay`）
- [ ] 应用声明的菜单与菜单回调
- [ ] 多窗口

### 开发体验

- [x] 带截图的 GPU 支撑测试渲染器
- [x] 独立构建（锁定 GPUI 平台依赖）
- [x] `bun --hot` 下的 JS 重挂载（`render()` 保留原生窗口）
- [ ] 原生 `.node` 插件的热重载。`bun run dev` 会重新编译并重启。原生模块无法卸载。
- [ ] `bun --hot` 期间的 React Refresh（需要 Bun 运行时转换）

### 已知限制

| 限制 | 说明 |
|---|---|
| 没有嵌套滚动 | 只允许一个父元素滚动，见[滚动](#scrolling) |
| Linux 忽略 `focus` | 窗口仍会以聚焦状态打开，见[后台启动](#后台启动与-agent-驱动) |
| 浏览器渲染器无窗口控制 | `minimizeWindow` 等在浏览器中不可用 |
| 浏览器渲染器无 AccessKit | 无障碍 props 在 wasm 构建中是空操作，见[无障碍](#accessibility) |
| Linux 测试渲染器 | 暂不支持，等待 GPUI 的 wgpu 无头渲染器，见[测试](#testing) |
| 颜色文法是 `csscolorparser` 0.8.3 | `hsv()` / `hsva()` / `hwba()` 是解析器扩展而非 CSS Color 4 标准函数；不支持径向、锥形与重复渐变，也不支持超过两个色标的渐变，见[支持的样式](#颜色) |

> [!NOTE]
> GPUIX 仍处于 1.0 之前的阶段。破坏性变更可能在 v1 之前出现。请把所选的 adapter 与 `@gpuix/native` 固定到**完全相同的版本**，并一起升级它们。详见[从零开始构建](#从零开始构建)。

### 文档

详细的架构、通信流程与贡献指南见 [AGENTS.md](https://github.com/remorses/gpuix/blob/main/AGENTS.md)。

### 许可证

[Apache-2.0](https://github.com/remorses/gpuix/blob/main/LICENSE)

## 文档

详细的架构、通信流程与贡献指南见 [AGENTS.md](https://github.com/remorses/gpuix/blob/main/AGENTS.md)。

## 许可

[Apache-2.0](https://github.com/remorses/gpuix/blob/main/LICENSE)
