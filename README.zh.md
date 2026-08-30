# Bilibili 遥控器 (PeerJS + Cloudflare Worker 版)

> 无需任何复杂凭据配置，只需 Fork 本仓库并扫码，即可将手机变成 Bilibili 遥控器！

![demo](misc/demo.png)

## 目标架构

```text
电脑扩展 SW ──WSS──→ PeerJS 云（仅握手，用完即弃）
手机 Worker 页 ──WSS──┘
        ↓
电脑 ⇆ 手机 WebRTC DataChannel 直连（控制命令/播放状态 P2P 直连，不经过任何服务器）
```

## 核心特性

- **PeerJS 架构**：通过 PeerJS 信令完成 WebRTC P2P 握手，数据通过 DataChannel 局域网/直连通信。
- **零凭据开箱**：部署至 Cloudflare Worker (`wrangler deploy --temporary`)，通过「临时账户 + 认领链接」实现一键绑定。
- **移除假权限与本地服务器**：彻底废弃 `system.network` 假权限与本地 Python/HTTP 信令逻辑，Host 权限收窄至 `*.bilibili.com`。
- **完整操控**：支持播放/暂停、快进快退、进度条拖拽防冲突、倍速切换、音量调节、上下集切换、全屏以及 D-Pad 导航。

## 首次使用流程

1. **Fork 本仓库**。
2. 进入 Actions 页面，运行 **Deploy Worker & Update Extension Config** 工作流（或 Push 一次提交自动触发）。
3. 加载扩展并点击图标：
   - 点击生成的 **Cloudflare 认领链接**（60分钟内有效），登录/注册 Cloudflare 完成 Worker 认领。
   - 回到扩展弹窗点击 **验证并保存认领状态**。
4. 打开任意 B 站视频页（`bilibili.com/video/...`），用手机扫描弹出的二维码即可开始遥控。
