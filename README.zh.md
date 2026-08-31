# Bilibili 遥控器 (PeerJS + Cloudflare Worker 版)

> 无需任何复杂凭据配置，只需 Fork 本仓库并扫码，即可将手机变成 Bilibili 遥控器！

![demo](misc/demo.png)

## 目标架构

```text
扩展 (Service Worker + Offscreen Doc) ──WSS──→ PeerJS 云（仅握手，用完即弃）
手机 Worker 页 ───────────────────────WSS──┘
        ↓
电脑 ⇆ 手机 WebRTC DataChannel 直连（控制命令/播放状态 P2P 直连，不经过任何服务器）
```

在 Chrome Extension Manifest V3 规范下，WebRTC 连接由 **Offscreen Document**（`offscreen.html`）负责维持，`background.js` Service Worker 则负责生命周期保活与 B 站页面、弹窗及 Offscreen 之间的消息路由。

## 核心特性

- **PeerJS WebRTC 直连**：通过 PeerJS 信令完成 WebRTC P2P 握手，控制指令与播放状态通过 DataChannel 直连传输，低延迟且无隐私隐患。
- **符合 Manifest V3 规范**：使用标准 Chrome Extension Manifest V3 架构，利用 Offscreen Document 处理 WebRTC 通信。
- **页面二维码与悬浮按钮**：直接在 B 站视频页及番剧页（`/video/*`、`/bangumi/play/*`）注入二维码展示浮层与悬浮控制按钮（FAB），方便随手开启/隐藏扫码。
- **零凭据开箱**：部署至 Cloudflare Worker (`wrangler deploy --temporary`)，通过「临时账户 + 认领链接」实现一键绑定。
- **智能 CI/CD 部署**：包含 Cloudflare Worker 健康检查与代码 Diff 监测，避免重复与不必要的部署。
- **打包发布自动化**：GitHub Release 发布时自动打包生成 `.crx` 和 `.zip` 扩展安装包。
- **完整播放与页面操控**：支持播放/暂停、±10s 快进快退、进度条拖拽防冲突、倍速切换、音量调节、上下集切换、全屏以及 D-Pad 页面元素导航。

## 首次使用流程

1. **Fork 本仓库**。
2. 进入 Actions 页面，运行 **Deploy Worker & Update Extension Config** 工作流（或向 `main`/`master` 分支提交一次修改自动触发）。
3. 在 Chrome 中加载 `chrome_extension/` 目录作为解压的扩展程序（`chrome://extensions`）。
4. 点击扩展图标打开弹窗：
   - 点击生成的 **Cloudflare 认领链接**（60 分钟内有效），登录/注册 Cloudflare 完成 Worker 认领。
   - 回到扩展弹窗点击 **验证并保存认领状态**。
5. 打开任意 B 站视频或番剧播放页（`bilibili.com/video/...` 或 `bilibili.com/bangumi/play/...`），用手机扫描页面注入或弹窗中的二维码即可开始遥控！
