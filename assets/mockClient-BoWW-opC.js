import{A as o}from"./types-br4PmeRt.js";import{P as A,D as Y,c as K}from"./site-nPoG-CCm.js";const Z={methodology:"方法论","causal-inference":"因果推断","platform-governance":"平台治理","literature-review":"文献综述","academic-writing":"学术写作",tools:"工具","field-experiment":"田野实验","academic-ethics":"学术伦理",ai:"AI","academic-ecosystem":"学术生态",essay:"随笔","open-science":"开放科学",reproducibility:"可复现性",life:"生活","research-life":"科研","digital-innovation":"数字化创新","working-paper":"工作论文",talk:"学术报告"};function d(...n){return n.map(l=>({slug:l,name:Z[l]??l}))}const j={name:"Magic",handle:A.handle,title:"管理科学与工程 · 科研工作者",affiliation:A.affiliation,bio:"在管理与数据之间做一点魔法。研究方向为数字化创新与平台治理，相信好的研究应当既能解释世界，也能改善日常。这里记录我的论文、随笔、观点与一些不足为外人道的生活碎片。",location:"杭州 · 紫金港",email:A.email,sealChar:A.sealChar,research:A.research,links:Y,timeline:A.timeline,avatarUrl:null},G={authors:["Magic","合作者甲（演示）"],venue:"工作论文（演示）",year:2026,doi:null,pdfUrl:null},W={authors:["Magic"],venue:"2026 暑期工作坊（演示）",year:2026,doi:null,pdfUrl:null},X=[{id:"p01",slug:"causal-inference-notes",category:"blog",title:"因果推断学习笔记：从相关到因果的三道门",excerpt:"相关不是因果，这句话人人会背，但真正落到研究设计里，门槛有三道：识别策略、反事实构造与稳健性检验。",tags:d("methodology","causal-inference"),visibility:"public",status:"published",publishedAt:"2026-10-28T09:00:00+08:00",updatedAt:"2026-10-30T10:00:00+08:00",readingMinutes:8,content:`## 为什么「相关不是因果」知易行难

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

（草稿：想写秋天与收尾的关系，还没想好。）`},{id:"p11",slug:"paper-digital-innovation",category:"academic",title:"工作论文：数字工具使用与团队创新绩效",excerpt:"基于 214 个团队的追踪数据，检验数字协作工具使用强度与创新绩效的非线性关系。",tags:d("digital-innovation","working-paper"),visibility:"public",status:"published",publishedAt:"2026-09-01T09:00:00+08:00",updatedAt:"2026-10-12T09:00:00+08:00",readingMinutes:12,academicMeta:G,content:`## 摘要（演示）

数字协作工具是否越多越好？基于 214 个团队的三轮追踪数据，我们发现工具使用强度与创新绩效呈倒 U 型关系，团队反思能力调节该关系。

## 状态

- 2026-09：初稿完成
- 2026-10：组内报告，修改识别策略
- 进行中：补充稳健性检验

*演示内容，非真实论文。*`},{id:"p12",slug:"talk-causal-2026",category:"academic",title:"报告回顾：管理学研究中的因果识别（2026 暑期工作坊）",excerpt:"在工作坊分享了 DID 与事件研究法的常见误用，整理了讲义与问答。",tags:d("causal-inference","talk"),visibility:"public",status:"published",publishedAt:"2026-07-25T09:00:00+08:00",updatedAt:"2026-07-25T09:00:00+08:00",readingMinutes:7,academicMeta:W,content:`## 报告要点

1. 事件研究法的动态效应图怎么读
2. 平行趋势不满足时的三条退路
3. 预注册能防住什么、防不住什么

## 问答摘录

**问**：处理时点交错时 TWFE 为什么有问题？
**答**：已处理组会被当作对照组，产生负权重。用稳健估计量。

*演示内容。*`}],S="domagic.mock.db.v2",C="domagic.mock.sessions.v2",w="domagic.mock.refresh.v1",B="admin",L="magic-demo",P=900*1e3,F=720*60*60*1e3,N=/^[a-z0-9]+(?:-[a-z0-9]+)*$/,V=2e5,H=10;function J(n){const l=n.replace(/\s/g,"").length;return Math.max(1,Math.round(l/400))}function $(n){return n.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")||`post-${Date.now().toString(36)}`}function Q(n){return{id:n.slug,slug:n.slug,category:n.category,title:n.title,excerpt:n.excerpt,tags:n.tags,visibility:"public",status:"published",publishedAt:n.publishedAt,readingMinutes:n.readingMinutes}}function q(n){return{id:n.id,slug:n.slug,category:n.category,title:n.title,excerpt:"",tags:[],visibility:n.visibility,status:n.status,publishedAt:n.publishedAt,updatedAt:n.updatedAt}}function it(n={}){const l=n.storage??K(),E=n.latencyMs??120;let I=null;const D=new Set;function b(t){for(const e of D)e(t)}function m(){const t=l.getItem(S);if(t)try{return JSON.parse(t)}catch{}const e={posts:structuredClone(X),tags:{...Z}};return l.setItem(S,JSON.stringify(e)),e}function T(t){l.setItem(S,JSON.stringify(t))}function v(){try{return JSON.parse(l.getItem(C)??"{}")}catch{return{}}}function O(t){l.setItem(C,JSON.stringify(t))}function M(){I=null,l.removeItem(w)}function U(t,e,i){const s=Date.now(),a=`mock-at-${crypto.randomUUID()}`,r=`mock-rt-${crypto.randomUUID()}`;return t[a]={kind:"access",familyId:i,expiresAt:s+P,user:e},t[r]={kind:"refresh",familyId:i,expiresAt:s+F,user:e},O(t),I=a,l.setItem(w,r),{accessToken:a,expiresAt:s+P,refreshToken:r,refreshExpiresAt:s+F,user:e,mustChangePassword:!1}}function z(){const t=l.getItem(w);if(!t)throw new o(401,"UNAUTHORIZED","缺少刷新凭据，请重新登录");const e=v(),i=e[t];if(!i||i.kind!=="refresh"||i.expiresAt<Date.now())throw M(),b(!1),new o(401,"UNAUTHORIZED","登录已失效，请重新登录");if(i.used){for(const[a,r]of Object.entries(e))r.familyId===i.familyId&&delete e[a];throw O(e),M(),b(!1),new o(401,"UNAUTHORIZED","检测到刷新令牌复用，会话已吊销")}i.used=!0;const s=U(e,i.user,i.familyId);return b(!0),s}function R(){if(!I)return null;const t=v()[I];return!t||t.kind!=="access"||t.expiresAt<Date.now()?null:t.user}function h(){const t=R();if(!t)throw new o(401,"UNAUTHORIZED","登录已失效，请重新登录");return t}async function u(){E>0&&await new Promise(t=>setTimeout(t,E))}function x(t,e){return e.map(i=>(t.tags[i]||(t.tags[i]=i),{slug:i,name:t.tags[i]}))}function _(t,e,i){if(e==="private"&&i.coverImageUrl)throw new o(422,"VALIDATION_ERROR","私密内容不允许设置封面图",{details:[{field:"coverImageUrl",message:"私密内容不允许设置封面图"}]});if(i.academicMeta&&t!=="academic")throw new o(422,"VALIDATION_ERROR","academicMeta 仅学术类型可携带",{details:[{field:"academicMeta",message:"仅 type=academic 的文章可携带学术元数据"}]})}function k(t,e){if(e.content!==void 0&&e.content.length>V)throw new o(400,"VALIDATION_ERROR","请求参数校验失败",{details:[{field:"contentMd",message:`contentMd must be shorter than or equal to ${V} characters`}]});if(e.tags!==void 0&&e.tags.length>H)throw new o(400,"VALIDATION_ERROR","请求参数校验失败",{details:[{field:"tags",message:`tags must contain no more than ${H} elements`}]});if(t!=="published"&&e.publishedAt)throw new o(422,"VALIDATION_ERROR","草稿不允许携带发布时间",{details:[{field:"publishedAt",message:"publishedAt 仅 status=published 可携带"}]})}return{async getProfile(){return await u(),structuredClone(j)},async listPosts(t={}){await u();const e=m(),i=R(),s=t.scope==="admin"||t.category==="diary"&&!!i;if(t.scope==="admin"&&!i)throw new o(401,"UNAUTHORIZED","登录已失效，请重新登录");let a=s?[...e.posts]:e.posts.filter(c=>c.visibility==="public"&&c.status==="published");if(t.category&&(a=a.filter(c=>c.category===t.category)),t.tag&&(a=a.filter(c=>c.tags.some(g=>g.slug===t.tag))),s&&t.status&&(a=a.filter(c=>c.status===t.status)),s&&t.visibility&&(a=a.filter(c=>c.visibility===t.visibility)),t.q){const c=t.q.toLowerCase();a=a.filter(g=>[g.title,g.excerpt].some(y=>y.toLowerCase().includes(c)))}a.sort((c,g)=>s?(g.updatedAt??"").localeCompare(c.updatedAt??""):(g.publishedAt??"").localeCompare(c.publishedAt??""));const r=Math.max(1,t.page??1),p=Math.min(50,Math.max(1,t.pageSize??10)),f=(r-1)*p;return{items:a.slice(f,f+p).map(s?q:Q),total:a.length,page:r,pageSize:p}},async getPost(t){await u();const i=m().posts.find(a=>a.slug===t),s=R();if(!i||!s&&(i.visibility==="private"||i.status==="draft"))throw new o(404,"NOT_FOUND","文章不存在");return structuredClone(i)},async getAdminPost(t){await u(),h();const e=m().posts.find(i=>i.id===t);if(!e)throw new o(404,"NOT_FOUND","文章不存在");return structuredClone(e)},async createPost(t){await u(),h();const e=JSON.parse(JSON.stringify(t)),i=m(),s=new Date().toISOString(),a=e.category,r=e.visibility??(a==="diary"?"private":"public"),p=e.status??"draft",f=e.slug?.trim()||$(e.title);if(!N.test(f))throw new o(422,"VALIDATION_ERROR","slug 格式不合法",{details:[{field:"slug",message:"仅允许小写字母、数字与连字符"}]});if(_(a,r,e),k(p,e),i.posts.some(g=>g.slug===f))throw new o(409,"CONFLICT","该 slug 已存在，请更换");const c={id:`p-${Date.now().toString(36)}`,slug:f,category:a,title:e.title,excerpt:e.excerpt||e.content.slice(0,200),content:e.content,tags:x(i,e.tags??[]),visibility:r,status:p,publishedAt:p==="published"?e.publishedAt??s:null,updatedAt:s,readingMinutes:J(e.content),academicMeta:a==="academic"?e.academicMeta??null:null};return i.posts.unshift(c),T(i),structuredClone(c)},async updatePost(t,e){await u(),h();const i=JSON.parse(JSON.stringify(e)),s=m(),a=s.posts.find(y=>y.id===t);if(!a)throw new o(404,"NOT_FOUND","文章不存在");if(i.slug&&i.slug!==a.slug){if(!N.test(i.slug))throw new o(422,"VALIDATION_ERROR","slug 格式不合法",{details:[{field:"slug",message:"仅允许小写字母、数字与连字符"}]});if(s.posts.some(y=>y.slug===i.slug))throw new o(409,"CONFLICT","该 slug 已存在，请更换")}const r=i.category??a.category,p=i.visibility??a.visibility,f=i.status??a.status;_(r,p,{coverImageUrl:"coverImageUrl"in i?i.coverImageUrl:void 0,academicMeta:"academicMeta"in i?i.academicMeta:a.academicMeta}),k(f,i);const{tags:c,...g}=i;return Object.assign(a,g,{category:r,visibility:p,status:f,updatedAt:new Date().toISOString(),readingMinutes:J(i.content??a.content)}),c&&(a.tags=x(s,c)),f==="draft"?a.publishedAt=null:a.publishedAt||(a.publishedAt=new Date().toISOString()),r!=="academic"&&(a.academicMeta=null),T(s),structuredClone(a)},async deletePost(t){await u(),h();const e=m(),i=e.posts.findIndex(s=>s.id===t);if(i===-1)throw new o(404,"NOT_FOUND","文章不存在");e.posts.splice(i,1),T(e)},async listTags(){await u();const t=m(),e=new Map;for(const i of t.posts)if(!(i.visibility!=="public"||i.status!=="published"))for(const s of i.tags)e.set(s.slug,(e.get(s.slug)??0)+1);return Object.entries(t.tags).map(([i,s])=>({slug:i,name:s,count:e.get(i)??0})).sort((i,s)=>s.count-i.count||i.slug.localeCompare(s.slug))},async createTag(t){await u(),h();const e=t.name?.trim();if(!e||e.length>80)throw new o(400,"VALIDATION_ERROR","请求参数校验失败",{details:[{field:"name",message:"name 长度需在 1-80 字符之间"}]});const i=t.slug?.trim()||$(e);if(!N.test(i)||i.length>80)throw new o(400,"VALIDATION_ERROR","请求参数校验失败",{details:[{field:"slug",message:"仅允许小写字母、数字与连字符"}]});const s=m();if(s.tags[i])throw new o(409,"CONFLICT","该标签 slug 已存在");return s.tags[i]=e,T(s),{slug:i,name:e,count:0}},async getArchive(){await u();const t=m(),e=new Map;for(const s of t.posts){if(s.visibility!=="public"||s.status!=="published"||!s.publishedAt)continue;const a=new Date(s.publishedAt).getFullYear(),r=e.get(a)??{year:a,count:0,posts:[]};r.count+=1,r.posts.push({slug:s.slug,title:s.title,category:s.category,publishedAt:s.publishedAt}),e.set(a,r)}const i=[...e.values()].sort((s,a)=>a.year-s.year);for(const s of i)s.posts.sort((a,r)=>r.publishedAt.localeCompare(a.publishedAt));return i},async login(t,e){if(await u(),t!==B||e!==L)throw new o(401,"UNAUTHORIZED","用户名或密码错误（演示账号见登录页提示）");const i={id:"u-owner",name:"Magic",role:"owner"},s=U(v(),i,`fam-${crypto.randomUUID()}`);return b(!0),s},async changePassword(t,e){if(await u(),h(),e.length<12||e.length>128)throw new o(400,"VALIDATION_ERROR","请求参数校验失败",{details:[{field:"newPassword",message:"newPassword must be longer than or equal to 12 characters"}]});if(t!==L)throw new o(401,"UNAUTHORIZED","当前密码不正确");if(e===t)throw new o(422,"VALIDATION_ERROR","新密码不能与当前密码相同");return O({}),M(),b(!1),{mustChangePassword:!1}},async logout(){await u();const t=l.getItem(w);if(t){const e=v();delete e[t],O(e)}M(),b(!1)},async me(){return await u(),h()},async restoreSession(){if(await u(),!l.getItem(w))return null;try{return z()}catch{return null}},subscribeAuth(t){return D.add(t),()=>D.delete(t)}}}export{it as createMockClient};
