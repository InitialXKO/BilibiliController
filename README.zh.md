# Bilibili 遥控器 (Trystero 零部署版)

> 无需部署任何服务器，只需加载扩展并扫码，即可将手机变成 Bilibili 遥控器！

![demo](misc/demo.png)

## 架构

```text
扩展 (UI 真身 + 业务逻辑) ── WebRTC 数据通道 (指令传输 + UI 包动态下发) ── 手机壳页面 (jsDelivr)
                                           │
                           信令走 Trystero (公共 MQTT Broker)
```

在 Chrome Extension Manifest V3 规范下，WebRTC 连接由 **Offscreen Document**（`offscreen.html`）负责维持，`background.js` Service Worker 则负责生命周期保活与 B 站页面、弹窗及 Offscreen 之间的消息路由。

## 核心特性

- **Trystero WebRTC 直连**：基于 Trystero 使用公共 MQTT Broker 进行 P2P 信令握手，控制指令与播放状态通过 DataChannel 直连传输，低延迟且无隐私隐患。
- **零服务器、零部署**：告别 Cloudflare Worker 部署与 Worker 认领流程。手机端壳页面无状态静态托管（通过 jsDelivr 访问）。
- **UI 动态下发**：遥控器手机端 UI 包（`ui.html`）跟着扩展直接发版，手机连接后自动由扩展下发渲染，保持手机界面与扩展版本始终同步。
- **符合 Manifest V3 & CSP 规范**：使用标准 Chrome Extension Manifest V3 架构，利用 Offscreen Document 和打包本地化的 Trystero 库处理 WebRTC 通信。
- **页面二维码与悬浮按钮**：直接在 B 站视频页及番剧页（`/video/*`、`/bangumi/play/*`）注入二维码展示浮层与悬浮控制按钮（FAB），方便随手开启/隐藏扫码。
- **打包发布自动化**：GitHub Release 发布时自动打包生成 `.crx` 和 `.zip` 扩展安装包。
- **完整播放与页面操控**：支持播放/暂停、±10s 快进快退、进度条拖拽防冲突、倍速切换、音量调节、上下集切换、全屏以及 D-Pad 页面元素导航。

## 快速开始

1. 下载或 Clone 本仓库。
2. 在 Chrome 中加载 `chrome_extension/` 目录作为解压的扩展程序（`chrome://extensions`）。
3. 打开任意 B 站视频或番剧播放页（`bilibili.com/video/...` 或 `bilibili.com/bangumi/play/...`）。
4. 用手机扫描页面注入或弹窗中的二维码即可开始遥控！
