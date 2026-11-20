# 秦罗万象 · 学术团队站（Qin-Luo Research Group）

中英双语学术团队静态站。内容由本地 Markdown / JSON 文件驱动，构建后生成纯静态页面，可离线预览；推送本仓 `master` 分支即完成内容更新（现网发布另有流程，见下文）。

## 仓库结构

```
content/            内容权威源（唯一需要日常编辑的目录）
  about.{zh,en}.md      团队简介（双语成对）
  members/              成员 <id>.{zh,en}.md
  publications/         成果 <slug>.{zh,en}.md
  team.json             团队名/对联/使命/首页 hero 与 teasers（权威载体）
src/                前端静态件（HTML / app.js / style.css）
dist/               构建产物（含 assets/data.js 数据注入），离线预览入口
build.mjs           构建脚本（零 npm 依赖，Node 内置模块）
tools/gate-harness.mjs  内容门检 harness（契约 v0.3）
```

## 内容编辑 → 更新流程

1. 编辑 `content/` 下的 `.md` 或 `team.json`。双语条目须成对维护 `<base>.zh.md` / `<base>.en.md`（缺译仅告警，前端以「译文待补」兜底）。
2. 运行构建（建议 Node 20+，无需 `npm install`）：

   ```
   node build.mjs
   ```

   构建前置自动执行门检 `tools/gate-harness.mjs --phase build`，任一违规即中止（fail-closed），不会产出脏 `dist/`。成功输出 `BUILD_OK …`。
3. `dist/` 已更新。本地离线预览：直接用浏览器打开 `dist/index.html`。
4. 提交并推送 `master` 分支（内容 + 构建产物一起提交）。

手动全量门检（含 `dist/` 一致性，推送前推荐）：

```
node tools/gate-harness.mjs --root . --phase push --gitleaks <gitleaks 可执行文件路径>
```

退出码 0 = 全绿；1 = 有违规，详情见 `harness-report.json` 与终端对账表。

## gitleaks 安装（必需）

密钥扫描器 gitleaks 的二进制**不入本仓**。请自行安装（ Releases: `github.com/gitleaks/gitleaks` ），并保证以下任一解析途径可用（按优先级）：

1. 命令行参数 `--gitleaks <路径>`；
2. 环境变量 `GITLEAKS_PATH=<路径>`；
3. 置于系统 `PATH` 中的 `gitleaks` 命令。

扫描器不可用时门检**直接拒绝**（fail-closed：扫不了 ≠ 干净），构建与推送前检均不放行。

## 现网（qinluolab.com）更新须另行批准

- GitHub Pages 的发布源是 **`gh-pages` 分支**；推送 `master` **不会**改变现网。
- 现网更新须走另行批准的发布流程（owner 批准后，由专门流水线/工单将审核过的 `dist/` 发布至 `gh-pages`）。请勿手工直接改动 `gh-pages` / `publish-main` 分支。

## 主题与语言持久化

- **语言**：导航常驻中英开关，默认中文；选择写入 `localStorage['ql-lang']`（`zh` / `en`），下次访问自动恢复。
- **主题**：`localStorage['ql-theme']`（`light` / `dark`）存储优先；无存储时跟随系统 `prefers-color-scheme` 并实时响应系统切换；手动切换后写入存储覆盖系统偏好。

## 内容红线（契约 v0.3 摘要）

- 成果条目 `attribution` 仅允许 `team`；演示/示例内容一律不入正式站（`team.json` 的 `fixture` 键已退役，在场即拒）。
- 无图片面：图片文件、`photo` 字段给值、正文图引用 / `data:image` 均拒。
- 隐私字段（电话、出生年月、政治面貌、通讯地址、照片等）一律不入站。
- 草稿 / 私密内容（`visibility` 非 `public`、`status` 非 `published`）不入站。
- 完整契约见团队工作区 `contract-v0.3.md`。