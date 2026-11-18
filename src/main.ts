import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useThemeStore } from './stores/theme'
import { useAuthStore } from './stores/auth'
import './styles/tokens.css'
import './styles/base.css'

// T7-③：critical.css 阻塞式定义关键子集（font-display:swap，首屏先以同度量系统 CJK 字体绘制，
// 关键子集到达后无位移交换为 Noto）；fonts.css（全量 526 face，供下折叠/其他页回退）以 media=print
// 非阻塞加载，模块执行时立即翻转为 all，移出关键渲染路径。CSP script-src 'self' 禁止内联 onload，故在此外部模块翻转。
const fullFonts = document.querySelector<HTMLLinkElement>('link[data-fullfonts]')
if (fullFonts) fullFonts.media = 'all'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

useThemeStore(pinia).apply()

const auth = useAuthStore(pinia)
auth.bindClient()
void auth.ensureReady()

app.mount('#app')