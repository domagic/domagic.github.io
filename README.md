# 秦罗万象 · 学术团队站（Qin-Luo Research Group）

中英双语学术团队静态站。内容由本地 Markdown / JSON 文件驱动，构建后生成纯静态页面，可离线预览；**Pages 源设为 master /docs 后，推送本仓 `master` 分支即自动上线，无需任何流水线**。

## 仓库结构

```
content/            内容权威源（唯一需要日常编辑的目录）
  about.{zh,en}.md      团队简介（双语成对）
  members/              成员 <id>.{zh,en}.md
  publications/         成果 <slug>.{zh,en}.md
  team.json             团队名/对联/使命/首页 hero 与 teasers（权威载体）
src/                前端静态件（HTML / app.js / style.css）
dist/               构建产物（含 assets/data.js 数据注入），离线预览入口
docs/               dist/ 的逐字节镜像＋CNAME＋.nojekyll，由 build 自动生成（GitHub Pages 发布目录，勿手改）
build.mjs           构建脚本（零 npm 依赖，Node 内置模块）
tools/gate-harness.mjs  内容门检 harness（契约 v0.3.1）
```

## 内容编辑 → 更新流程

1. 编辑 `content/` 下的 `.md` 或 `team.json`。双语条目须成对维护 `<base>.zh.md` / `<base>.en.md`（缺译仅告警，前端以「译文待补」兜底）。
2. 运行构建（建议 Node 20+，无需 `npm install`）：

   ```
   node build.mjs
   ```

   构建前置自动执行门检 `tools/gate-harness.mjs --phase build`，任一违规即中止（fail-closed），不会产出脏产物。成功后 `dist/` 更新，并同批逐字节镜像到 `docs/`（另写 `docs/CNAME` 与 `docs/.nojekyll`）。输出 `BUILD_OK …`。
3. 本地离线预览：直接用浏览器打开 `dist/index.html`（`docs/index.html` 内容相同）。
4. 提交并推送 `master` 分支（内容 + dist/ + docs/ 一起提交）→ Pages 自动重新发布，现网即更新。

**docs/ 由 build 自动生成，请勿手工编辑**；手改会被门检 G8′（docs 与 dist 逐字节全等）拒绝。

手动全量门检（含 dist/docs 一致性，推送前推荐）：

```
node tools/gate-harness.mjs --root . --phase push --gitleaks <gitleaks 可执行文件路径>
```

退出码 0 = 全绿；1 = 有违规，详情见 `harness-report.json` 与终端对账表。

## 发布机制与 Settings（master 单分支架构）

- GitHub Pages 发布源 = **master 分支 /docs 目录**（GitHub 仅支持根或 /docs，故用 docs 镜像）。推 master 即自动上线，无流水线。
- `dist/` 保留为离线预览入口，行为与内容不变。
- 其余分支（gh-pages / publish-main 等）已冻结（退役另批），请勿向其推送；publish 流水线停用已批准，待 Settings③ 执行。
- **Settings 四项摘要**（仓库管理员界面）：
  1. 默认分支：`publish-main` → `master`；
  2. Pages 源：`master` 分支 `/docs` 目录；
  3. Actions：Disable publish workflow（停用旧发布流水线）；
  4. Pages 自定义域名核对：`qinluolab.com`（由 `docs/CNAME` 承载）。
- **回滚**：Settings 将 Pages 源切回 `gh-pages`（旧版）即可，一键操作、零分支写入。

## gitleaks 安装（必需）

密钥扫描器 gitleaks 的二进制**不入本仓**。请自行安装（ Releases: `github.com/gitleaks/gitleaks` ），并保证以下任一解析途径可用（按优先级）：

1. 命令行参数 `--gitleaks <路径>`；
2. 环境变量 `GITLEAKS_PATH=<路径>`；
3. 置于系统 `PATH` 中的 `gitleaks` 命令。

扫描器不可用时门检**直接拒绝**（fail-closed：扫不了 ≠ 干净），构建与推送前检均不放行。

## 主题与语言持久化

- **语言**：导航常驻中英开关，默认中文；选择写入 `localStorage['ql-lang']`（`zh` / `en`），下次访问自动恢复。
- **主题**：`localStorage['ql-theme']`（`light` / `dark`）存储优先；无存储时跟随系统 `prefers-color-scheme` 并实时响应系统切换；手动切换后写入存储覆盖系统偏好。

## 内容红线（契约 v0.3.1 摘要）

- 成果条目 `attribution` 仅允许 `team`；演示/示例内容一律不入正式站（`team.json` 的 `fixture` 键已退役，在场即拒）。
- 无图片面：图片文件、`photo` 字段给值、正文图引用 / `data:image` 均拒。
- 隐私字段（电话、出生年月、政治面貌、通讯地址、照片等）一律不入站。
- 草稿 / 私密内容（`visibility` 非 `public`、`status` 非 `published`）不入站。
- **docs 镜像门 G8′（v0.3.1 增补）**：docs/ 与 dist/ 逐字节全等；docs/CNAME 须为 `qinluolab.com`；docs/.nojekyll 必须在场；build 与 push 双相 fail-closed。
- 完整契约见团队工作区 `contract-v0.3.md` ＋ `contract-v0.3.1.md`（增补件）。