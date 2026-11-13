# 自托管字体（T7-①）

- 来源：Google Fonts CSS2 API（`fonts.googleapis.com/css2`，Chrome UA → woff2 + unicode-range 子集），2026-11-13 镜像。
- 家族与字重（与原 CDN 请求一致，渲染不变）：
  - Fraunces：opsz 9..144，wght 500/700/900（可变字体，3 个子集文件）
  - IBM Plex Mono：wght 400/500（12 个文件）
  - Noto Sans SC：wght 400/500/700（可变字体，101 个子集文件）
  - Noto Serif SC：wght 600/900（可变字体，101 个子集文件）
- 共 217 个唯一 woff2 文件（约 10.8 MB）。`fonts.css` 保留全部 526 个 `@font-face` 块（可变字体文件跨字重共享），URL 为相对路径，`unicode-range` 原样保留；浏览器仅下载实际用到的子集。T7-③ 起 `fonts.css` 经 esbuild 压缩（保留全部块与相对 URL），`font-display` 由 `swap` 改为 `optional`（见下）。
- 许可：SIL OFL 1.1，各家族目录内 `OFL.txt`（版权行随字体来源保留）。
- CSP：`style-src` / `font-src` 收紧为仅 `'self'`（style-src 另含 Vue  scoped 样式所需 `'unsafe-inline'`）；`index.html` 已移除 fonts.googleapis.com / fonts.gstatic.com 的放行与 preconnect。
- 再生成：镜像脚本位于前端仓外（QinY worker tools/fonts-work/mirror.mjs），重新拉取并改写 CSS（含压缩与 font-display 处理）；请勿手改 `fonts.css`。

## T7-③ 性能优化（font-display: optional + 首屏预载）

- 问题：首屏 hero 标题（LCP 元素）依赖 Noto Serif SC 多个 CJK 子集（约 373 KB）。`font-display: swap` 下，移动端慢网络时 webfont 晚到（实测 LCP ~13.6 s），swap 触发 LCP 重测与布局位移（CLS 0.29–0.83，且随字体到达时序抖动）。
- 方案：`font-display: optional` + `index.html` 预载首屏关键子集（5 个 Noto Serif SC + Fraunces + IBM Plex Mono）。
  - 快连接/缓存命中（含本地 preview 与截图）：预载字体在首绘前到达 → 直接使用 webfont，**设计渲染不变**，无 swap。
  - 慢连接首屏（Lighthouse 移动节流）：字体错过 optional 块期 → 本次加载使用系统 fallback 且**不再 swap** → LCP≈FCP、CLS≈0。
  - 系统 fallback 仍保持 serif/sans 分类（Noto Serif SC→宋体类、Noto Sans SC→雅黑类），版式与字面类别一致。
- 实测：见 `shared/t7-frontend-evidence/lighthouse/`（性能/SEO 报告）。
- 残留风险：极慢网络的首次访问会看到系统字体（而非 Noto）直至刷新/缓存命中；这是 optional 的标准取舍，换取稳定的首屏性能与零位移。`fallbacks.css`（metric override 试验件）保留于目录但**未启用**——实测 hhea 度量与 Chrome 渲染度量不一致反而增大位移，故不采用。