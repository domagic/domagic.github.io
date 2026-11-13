import{A as c}from"./types-br4PmeRt.js";import{P as y,D as Z,c as V}from"./site-nPoG-CCm.js";const H={methodology:"方法论","causal-inference":"因果推断","platform-governance":"平台治理","literature-review":"文献综述","academic-writing":"学术写作",tools:"工具","field-experiment":"田野实验","academic-ethics":"学术伦理",ai:"AI","academic-ecosystem":"学术生态",essay:"随笔","open-science":"开放科学",reproducibility:"可复现性",life:"生活","research-life":"科研","digital-innovation":"数字化创新","working-paper":"工作论文",talk:"学术报告"};function d(...n){return n.map(l=>({slug:l,name:H[l]??l}))}const $={name:"Magic",handle:y.handle,title:"管理科学与工程 · 科研工作者",affiliation:y.affiliation,bio:"在管理与数据之间做一点魔法。研究方向为数字化创新与平台治理，相信好的研究应当既能解释世界，也能改善日常。这里记录我的论文、随笔、观点与一些不足为外人道的生活碎片。",location:"杭州 · 紫金港",email:y.email,sealChar:y.sealChar,research:y.research,links:Z,timeline:y.timeline,avatarUrl:null},z={authors:["Magic","合作者甲（演示）"],venue:"工作论文（演示）",year:2026,doi:null,pdfUrl:null},Y={authors:["Magic"],venue:"2026 暑期工作坊（演示）",year:2026,doi:null,pdfUrl:null},K=[{id:"p01",slug:"causal-inference-notes",category:"blog",title:"因果推断学习笔记：从相关到因果的三道门",excerpt:"相关不是因果，这句话人人会背，但真正落到研究设计里，门槛有三道：识别策略、反事实构造与稳健性检验。",tags:d("methodology","causal-inference"),visibility:"public",status:"published",publishedAt:"2026-10-28T09:00:00+08:00",updatedAt:"2026-10-30T10:00:00+08:00",readingMinutes:8,content:`## 为什么「相关不是因果」知易行难

每个学过统计的人都能背出这句话，但审稿人真正关心的是：**你的识别策略是什么？**

> 因果推断的核心不是模型，而是研究设计。

### 第一道门：识别策略

- 随机实验：黄金标准，但管理学场景中常常不可行
- 自然实验：DID、断点回归、工具变量
- 观测数据：匹配、双重稳健估计，假设最强

### 第二道门：反事实

反事实不可观测，所有方法都在回答同一个问题：*如果没有处理，结果会怎样？*

### 第三道门：稳健性

平行趋势检验、安慰剂检验、替换度量……稳健性不是锦上添花，而是识别的护城河。

\`\`\`r
# DID 基准回归
fixest::feols(y ~ treat:post | id + year, data = panel)
\`\`\`

下一篇文章打算写工具变量的排他性约束如何在审稿中辩护。`},{id:"p02",slug:"platform-governance-review",category:"blog",title:"平台治理研究图谱：我们到底在治理什么",excerpt:"把近五年平台治理文献摊开来看，治理对象其实只有三类：内容、行为与分配。本文给出一张分类图谱。",tags:d("platform-governance","literature-review"),visibility:"public",status:"published",publishedAt:"2026-09-15T09:00:00+08:00",updatedAt:"2026-09-15T09:00:00+08:00",readingMinutes:11,content:`## 治理的三类对象

1. **内容治理**：审核、推荐与可见性
2. **行为治理**：激励、惩罚与声誉机制
3. **分配治理**：流量、收益与注意力的分配

## 一个观察

多数研究把平台当作「黑箱监管者」，却很少打开算法决策过程本身。这既是数据可得性问题，也是理论缺口。

> 治理不是控制，而是塑造激励结构。

后续会按这三条线整理代表文献。`},{id:"p03",slug:"writing-workflow-2026",category:"blog",title:"我的学术写作流水线（2026 版）",excerpt:"从文献卡片到初稿再到打磨，一套跑了两年的写作流程：Zotero + Obsidian + Markdown，每天上午九十分钟。",tags:d("academic-writing","tools"),visibility:"public",status:"published",publishedAt:"2026-08-02T09:00:00+08:00",updatedAt:"2026-08-02T09:00:00+08:00",readingMinutes:6,content:`## 原则

- 写作从文献卡片开始，而不是从空白文档开始
- 每天固定时段，先写后改
- 一切皆 Markdown，版本可追溯

## 流程

1. 阅读时写「一句话卡片」
2. 每周把卡片聚成段落
3. 初稿只堆结构，不修句子
4. 冷却 48 小时后再打磨

> 初稿的任务是存在，不是完美。`},{id:"p04",slug:"field-experiment-pitfalls",category:"blog",title:"田野实验踩坑记：随机化不是终点",excerpt:"一次与平台合作的田野实验复盘：溢出效应、依从性与霍桑效应，每一个都足以让显著性消失。",tags:d("methodology","field-experiment"),visibility:"public",status:"published",publishedAt:"2026-06-20T09:00:00+08:00",updatedAt:"2026-06-21T09:00:00+08:00",readingMinutes:9,content:`## 三个坑

### 溢出效应

处理组的行为改变了对照组的环境，SUTVA 假设悄悄失效。

### 依从性

随机分配了处理，不等于被试真的接受了处理。ITT 与 LATE 要分开报告。

### 霍桑效应

被试知道自己在被观察，行为本身就会改变。

## 教训

实验设计阶段就要把「失效模式清单」写进预注册。`},{id:"p05",slug:"ai-reviewer-opinion",category:"opinion",title:"AI 审稿人来了，学术信任怎么办",excerpt:"AI 辅助审稿不可阻挡，但「谁为评审意见负责」必须回答。我的立场：AI 可以起草，责任必须归人。",tags:d("academic-ethics","ai"),visibility:"public",status:"published",publishedAt:"2026-10-05T09:00:00+08:00",updatedAt:"2026-10-05T09:00:00+08:00",readingMinutes:5,content:`## 立场

AI 可以辅助检索、核对统计、起草意见，但**署名评审人必须为每一条意见负责**。

## 三个理由

1. 评审是学术共同体的信任基础设施
2. 责任不可外包给模型
3. 保密义务与模型训练之间存在真实张力

> 工具越强大，责任边界越要清晰。`},{id:"p06",slug:"slow-science",category:"opinion",title:"慢科学：对「非升即走」的一点温和抵抗",excerpt:"发表速度不该是学术的唯一时钟。慢一点，把问题想透，是对领域也是对自己的诚实。",tags:d("academic-ecosystem","essay"),visibility:"public",status:"published",publishedAt:"2026-07-11T09:00:00+08:00",updatedAt:"2026-07-11T09:00:00+08:00",readingMinutes:4,content:`## 快与慢

考核时钟越快，研究问题越碎。我不反对效率，反对的是**把速度当成质量**。

## 我能做的

- 每年只推进一个核心问题
- 公开失败结果，减少抽屉问题
- 把审稿当成回馈共同体，而不是刷履历`},{id:"p07",slug:"open-data-default",category:"opinion",title:"开放数据应当成为默认项",excerpt:"除非涉及隐私或商业机密，研究数据默认开放。可复现性不是美德，是底线。",tags:d("open-science","reproducibility"),visibility:"public",status:"published",publishedAt:"2026-05-09T09:00:00+08:00",updatedAt:"2026-05-09T09:00:00+08:00",readingMinutes:5,content:`## 默认开放，例外说明

数据共享的默认值应该是「开放」，不开放需要给出理由：隐私、合同、安全。

## 成本与收益

整理数据确实费时，但一次整理，多次复用；别人复现你的结果，是最便宜的引用。`},{id:"p08",slug:"diary-2026-11-01",category:"diary",title:"十一月第一天：雨后的紫金港",excerpt:"（私密示例）雨停之后去操场走了两圈，想了很多关于毕业的事。",tags:d("life"),visibility:"private",status:"published",publishedAt:"2026-11-01T22:00:00+08:00",updatedAt:"2026-11-01T22:00:00+08:00",readingMinutes:3,content:`## 雨后的操场

雨停了，地面还亮着。绕着操场走了两圈，耳机里是没听完的播客。

毕业的压力像远处的雷声，知道它在，但暂时淋不到。今天不想论文，只想把觉睡好。

> 允许自己有只属于生活的一天。`},{id:"p09",slug:"diary-2026-10-18",category:"diary",title:"组会之后",excerpt:"（私密示例）今天的组会被问住了，记录一下当时的窘迫和后来的想通。",tags:d("life","research-life"),visibility:"private",status:"published",publishedAt:"2026-10-18T23:00:00+08:00",updatedAt:"2026-10-18T23:00:00+08:00",readingMinutes:4,content:`## 被问住的那一刻

老师问了一个识别假设的问题，我愣了五秒钟。那五秒钟很长。

后来想通了：被问住不是失败，是找到了下一步该补的洞。回去把平行趋势的文献又读了一遍。

今晚的奶茶是半糖，奖励自己没有当场逃避。`},{id:"p10",slug:"diary-draft-hangzhou",category:"diary",title:"（草稿）杭州的秋天",excerpt:"（私密草稿示例）桂花开了，写几句还没想好的话。",tags:d("life"),visibility:"private",status:"draft",publishedAt:null,updatedAt:"2026-10-09T20:00:00+08:00",readingMinutes:2,content:`## 桂花

满觉陇的桂花开了。今年还没去过。

（草稿：想写秋天与收尾的关系，还没想好。）`},{id:"p11",slug:"paper-digital-innovation",category:"academic",title:"工作论文：数字工具使用与团队创新绩效",excerpt:"基于 214 个团队的追踪数据，检验数字协作工具使用强度与创新绩效的非线性关系。",tags:d("digital-innovation","working-paper"),visibility:"public",status:"published",publishedAt:"2026-09-01T09:00:00+08:00",updatedAt:"2026-10-12T09:00:00+08:00",readingMinutes:12,academicMeta:z,content:`## 摘要（演示）

数字协作工具是否越多越好？基于 214 个团队的三轮追踪数据，我们发现工具使用强度与创新绩效呈倒 U 型关系，团队反思能力调节该关系。

## 状态

- 2026-09：初稿完成
- 2026-10：组内报告，修改识别策略
- 进行中：补充稳健性检验

*演示内容，非真实论文。*`},{id:"p12",slug:"talk-causal-2026",category:"academic",title:"报告回顾：管理学研究中的因果识别（2026 暑期工作坊）",excerpt:"在工作坊分享了 DID 与事件研究法的常见误用，整理了讲义与问答。",tags:d("causal-inference","talk"),visibility:"public",status:"published",publishedAt:"2026-07-25T09:00:00+08:00",updatedAt:"2026-07-25T09:00:00+08:00",readingMinutes:7,academicMeta:Y,content:`## 报告要点

1. 事件研究法的动态效应图怎么读
2. 平行趋势不满足时的三条退路
3. 预注册能防住什么、防不住什么

## 问答摘录

**问**：处理时点交错时 TWFE 为什么有问题？
**答**：已处理组会被当作对照组，产生负权重。用稳健估计量。

*演示内容。*`}],U="domagic.mock.db.v2",k="domagic.mock.sessions.v2",A="domagic.mock.refresh.v1",j="admin",C="magic-demo",_=900*1e3,L=720*60*60*1e3,P=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;function F(n){const l=n.replace(/\s/g,"").length;return Math.max(1,Math.round(l/400))}function W(n){return n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||`post-${Date.now().toString(36)}`}function B(n){return{id:n.slug,slug:n.slug,category:n.category,title:n.title,excerpt:n.excerpt,tags:n.tags,visibility:"public",status:"published",publishedAt:n.publishedAt,readingMinutes:n.readingMinutes}}function G(n){return{id:n.id,slug:n.slug,category:n.category,title:n.title,excerpt:"",tags:[],visibility:n.visibility,status:n.status,publishedAt:n.publishedAt,updatedAt:n.updatedAt}}function q(n={}){const l=n.storage??V(),N=n.latencyMs??120;let v=null;const M=new Set;function b(t){for(const i of M)i(t)}function m(){const t=l.getItem(U);if(t)try{return JSON.parse(t)}catch{}const i={posts:structuredClone(K),tags:{...H}};return l.setItem(U,JSON.stringify(i)),i}function D(t){l.setItem(U,JSON.stringify(t))}function T(){try{return JSON.parse(l.getItem(k)??"{}")}catch{return{}}}function I(t){l.setItem(k,JSON.stringify(t))}function O(){v=null,l.removeItem(A)}function x(t,i,e){const a=Date.now(),s=`mock-at-${crypto.randomUUID()}`,o=`mock-rt-${crypto.randomUUID()}`;return t[s]={kind:"access",familyId:e,expiresAt:a+_,user:i},t[o]={kind:"refresh",familyId:e,expiresAt:a+L,user:i},I(t),v=s,l.setItem(A,o),{accessToken:s,expiresAt:a+_,refreshToken:o,refreshExpiresAt:a+L,user:i,mustChangePassword:!1}}function J(){const t=l.getItem(A);if(!t)throw new c(401,"UNAUTHORIZED","缺少刷新凭据，请重新登录");const i=T(),e=i[t];if(!e||e.kind!=="refresh"||e.expiresAt<Date.now())throw O(),b(!1),new c(401,"UNAUTHORIZED","登录已失效，请重新登录");if(e.used){for(const[s,o]of Object.entries(i))o.familyId===e.familyId&&delete i[s];throw I(i),O(),b(!1),new c(401,"UNAUTHORIZED","检测到刷新令牌复用，会话已吊销")}e.used=!0;const a=x(i,e.user,e.familyId);return b(!0),a}function S(){if(!v)return null;const t=T()[v];return!t||t.kind!=="access"||t.expiresAt<Date.now()?null:t.user}function h(){const t=S();if(!t)throw new c(401,"UNAUTHORIZED","登录已失效，请重新登录");return t}async function u(){N>0&&await new Promise(t=>setTimeout(t,N))}function E(t,i){return i.map(e=>(t.tags[e]||(t.tags[e]=e),{slug:e,name:t.tags[e]}))}function R(t,i,e){if(i==="private"&&e.coverImageUrl)throw new c(422,"VALIDATION_ERROR","私密内容不允许设置封面图",{details:[{field:"coverImageUrl",message:"私密内容不允许设置封面图"}]});if(e.academicMeta&&t!=="academic")throw new c(422,"VALIDATION_ERROR","academicMeta 仅学术类型可携带",{details:[{field:"academicMeta",message:"仅 type=academic 的文章可携带学术元数据"}]})}return{async getProfile(){return await u(),structuredClone($)},async listPosts(t={}){await u();const i=m(),e=S(),a=t.scope==="admin"||t.category==="diary"&&!!e;if(t.scope==="admin"&&!e)throw new c(401,"UNAUTHORIZED","登录已失效，请重新登录");let s=a?[...i.posts]:i.posts.filter(r=>r.visibility==="public"&&r.status==="published");if(t.category&&(s=s.filter(r=>r.category===t.category)),t.tag&&(s=s.filter(r=>r.tags.some(g=>g.slug===t.tag))),a&&t.status&&(s=s.filter(r=>r.status===t.status)),a&&t.visibility&&(s=s.filter(r=>r.visibility===t.visibility)),t.q){const r=t.q.toLowerCase();s=s.filter(g=>[g.title,g.excerpt].some(w=>w.toLowerCase().includes(r)))}s.sort((r,g)=>a?(g.updatedAt??"").localeCompare(r.updatedAt??""):(g.publishedAt??"").localeCompare(r.publishedAt??""));const o=Math.max(1,t.page??1),p=Math.min(50,Math.max(1,t.pageSize??10)),f=(o-1)*p;return{items:s.slice(f,f+p).map(a?G:B),total:s.length,page:o,pageSize:p}},async getPost(t){await u();const e=m().posts.find(s=>s.slug===t),a=S();if(!e||!a&&(e.visibility==="private"||e.status==="draft"))throw new c(404,"NOT_FOUND","文章不存在");return structuredClone(e)},async getAdminPost(t){await u(),h();const i=m().posts.find(e=>e.id===t);if(!i)throw new c(404,"NOT_FOUND","文章不存在");return structuredClone(i)},async createPost(t){await u(),h();const i=JSON.parse(JSON.stringify(t)),e=m(),a=new Date().toISOString(),s=i.category,o=i.visibility??(s==="diary"?"private":"public"),p=i.status??"draft",f=i.slug?.trim()||W(i.title);if(!P.test(f))throw new c(422,"VALIDATION_ERROR","slug 格式不合法",{details:[{field:"slug",message:"仅允许小写字母、数字与连字符"}]});if(R(s,o,i),e.posts.some(g=>g.slug===f))throw new c(409,"CONFLICT","该 slug 已存在，请更换");const r={id:`p-${Date.now().toString(36)}`,slug:f,category:s,title:i.title,excerpt:i.excerpt||i.content.slice(0,200),content:i.content,tags:E(e,i.tags??[]),visibility:o,status:p,publishedAt:p==="published"?a:null,updatedAt:a,readingMinutes:F(i.content),academicMeta:s==="academic"?i.academicMeta??null:null};return e.posts.unshift(r),D(e),structuredClone(r)},async updatePost(t,i){await u(),h();const e=JSON.parse(JSON.stringify(i)),a=m(),s=a.posts.find(w=>w.id===t);if(!s)throw new c(404,"NOT_FOUND","文章不存在");if(e.slug&&e.slug!==s.slug){if(!P.test(e.slug))throw new c(422,"VALIDATION_ERROR","slug 格式不合法",{details:[{field:"slug",message:"仅允许小写字母、数字与连字符"}]});if(a.posts.some(w=>w.slug===e.slug))throw new c(409,"CONFLICT","该 slug 已存在，请更换")}const o=e.category??s.category,p=e.visibility??s.visibility,f=e.status??s.status;R(o,p,{coverImageUrl:"coverImageUrl"in e?e.coverImageUrl:void 0,academicMeta:"academicMeta"in e?e.academicMeta:s.academicMeta});const{tags:r,...g}=e;return Object.assign(s,g,{category:o,visibility:p,status:f,updatedAt:new Date().toISOString(),readingMinutes:F(e.content??s.content)}),r&&(s.tags=E(a,r)),f==="draft"?s.publishedAt=null:s.publishedAt||(s.publishedAt=new Date().toISOString()),o!=="academic"&&(s.academicMeta=null),D(a),structuredClone(s)},async deletePost(t){await u(),h();const i=m(),e=i.posts.findIndex(a=>a.id===t);if(e===-1)throw new c(404,"NOT_FOUND","文章不存在");i.posts.splice(e,1),D(i)},async listTags(){await u();const t=m(),i=new Map;for(const e of t.posts)if(!(e.visibility!=="public"||e.status!=="published"))for(const a of e.tags)i.set(a.slug,(i.get(a.slug)??0)+1);return Object.entries(t.tags).map(([e,a])=>({slug:e,name:a,count:i.get(e)??0})).sort((e,a)=>a.count-e.count||e.slug.localeCompare(a.slug))},async getArchive(){await u();const t=m(),i=new Map;for(const a of t.posts){if(a.visibility!=="public"||a.status!=="published"||!a.publishedAt)continue;const s=new Date(a.publishedAt).getFullYear(),o=i.get(s)??{year:s,count:0,posts:[]};o.count+=1,o.posts.push({slug:a.slug,title:a.title,category:a.category,publishedAt:a.publishedAt}),i.set(s,o)}const e=[...i.values()].sort((a,s)=>s.year-a.year);for(const a of e)a.posts.sort((s,o)=>o.publishedAt.localeCompare(s.publishedAt));return e},async login(t,i){if(await u(),t!==j||i!==C)throw new c(401,"UNAUTHORIZED","用户名或密码错误（演示账号见登录页提示）");const e={id:"u-owner",name:"Magic",role:"owner"},a=x(T(),e,`fam-${crypto.randomUUID()}`);return b(!0),a},async changePassword(t,i){if(await u(),h(),i.length<12||i.length>128)throw new c(400,"VALIDATION_ERROR","请求参数校验失败",{details:[{field:"newPassword",message:"newPassword must be longer than or equal to 12 characters"}]});if(t!==C)throw new c(401,"UNAUTHORIZED","当前密码不正确");if(i===t)throw new c(422,"VALIDATION_ERROR","新密码不能与当前密码相同");return I({}),O(),b(!1),{mustChangePassword:!1}},async logout(){await u();const t=l.getItem(A);if(t){const i=T();delete i[t],I(i)}O(),b(!1)},async me(){return await u(),h()},async restoreSession(){if(await u(),!l.getItem(A))return null;try{return J()}catch{return null}},subscribeAuth(t){return M.add(t),()=>M.delete(t)}}}export{q as createMockClient};
