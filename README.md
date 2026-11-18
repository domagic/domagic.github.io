# domagic-frontend

domagic.github.io 个人网站前端（T2 骨架 + T5a 冻结契约 v1 对齐）。Vue 3 + Vite + TypeScript + Vue Router + Pinia。
设计方向与页面规格见群共享目录《前端设计说明-T2.md》；契约对齐整改见《T5a-契约对齐整改报告.md》。

## 快速开始

```bash
npm install
npm run dev      # http://127.0.0.1:5173，默认 mock 模式，无需后端
```

- 演示登录：`admin / magic-demo`（仅 mock 数据使用，非真实凭据）。
- 日记「板块」已下线：无公开导航/首页入口/分类列表页；既有私密文章仅所有者登录后可经后台访问（契约 `Category` 类型与后端不变）。
- 管理页 `/admin`：概览统计、文章筛选、新建/编辑（Markdown 实时预览）、删除二次确认；mock 数据持久化在 localStorage，刷新保留。重置演示数据：清除站点 localStorage 即可。

## 脚本

| 命令 | 作用 |
|---|---|
| `npm run dev` | 开发服务器 |
| `npm run test` | vitest 单测（http 适配层契约映射/双令牌刷新、mock API 权限/CRUD、Markdown XSS、路由守卫、工具函数） |
| `npm run typecheck` | vue-tsc 严格类型检查 |
| `npm run build` | 类型检查 + 生产构建 + 生成 404.html/sitemap.xml |
| `npm run preview` | 预览生产构建 |

## mock / 真实后端切换

复制 `.env.example` 为 `.env`：

```
VITE_API_MODE=http
VITE_API_BASE_URL=https://你的后端地址
# CSP connect-src 放行后端源（空格分隔多个源；须与 VITE_API_BASE_URL 同源）
VITE_CSP_CONNECT_SRC=https://你的后端地址
```

视图与 store 只依赖 `src/api/types.ts` 的 `ApiClient` 接口；线上形状与内部模型的映射全部在 `src/api/http/httpClient.ts` 适配层完成，页面代码零改动。
契约唯一事实源：冻结版 v1 `shared/T1-后端设计/openapi.v1.json`（设计说明第 5 节草案已作废）。mock fixtures 为动态 import，仅 mock 模式加载，http 构建产物不含任何 mock 代码。

## 部署（GitHub Pages，需 lcg_magic 批准后执行）

1. `npm run build` 产出 `dist/`（含 SPA 404 回退与 sitemap）。
2. 用户站 base 为 `/`；若改为项目站，构建时设 `VITE_BASE=/仓库名/`。
3. 发布方式（Actions 或 gh-pages 分支）在 T6 与 Manager 确认后执行；**未经批准不 push、不发布**。

## 安全边界（前端侧）

- 无任何业务密钥/真实凭据；`.env` 不入库（.gitignore 已排除）。
- Markdown 渲染经 DOMPurify sanitize；外链 `rel=noopener noreferrer`。
- 认证按 ADR-004 双令牌：accessToken 仅存内存（刷新即失，不落盘）；refreshToken 存 localStorage（键 `domagic.refresh.v1`），每次刷新轮换；401 → 单次刷新 + 并发排队 + 重放一次，刷新失败清令牌并回登录页。
- `index.html` 含 CSP meta（`connect-src` 由 `VITE_CSP_CONNECT_SRC` 注入）；429 读取 `Retry-After` 进入冷却倒计时。**后端 CORS 须 `Access-Control-Expose-Headers: Retry-After`**，否则跨域下前端只能使用默认冷却时长。
- 私密内容不预渲染；公开端点对 private/draft 与不存在同形 404，前端门禁只是展示层兜底。
- 权限的真实判定在后端（RBAC），前端门禁只是展示层兜底。

## 已知残余风险

- 字体已自托管（T7-①）：`public/fonts/`（woff2 子集 + OFL 许可），CSP `font-src 'self'`，无第三方字体源。T7-③ 性能优化：`font-display: optional` + 首屏关键子集预载（快连接/缓存用 webfont 设计不变，慢连接首屏用系统 fallback 且零 swap → 稳定 LCP/CLS），并压缩 `fonts.css`。详见 `public/fonts/README.md`。
- SPA 首屏 SEO 弱于 SSG；T7 可评估预渲染（如 vite-ssg）。
- GitHub Pages 无法自定义响应头（CSP/HSTS 等），需 meta 方案或后端/托管侧补齐。