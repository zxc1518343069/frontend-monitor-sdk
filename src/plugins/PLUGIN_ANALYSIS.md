# 前端监控 SDK 插件体系深度分析

本文档对 `src/plugins` 下的所有插件进行技术实现、选型对比及优缺点分析。

## 1. JS 运行时错误监控 (`jsErrorPlugin`)

### 实现方式
使用 `window.onerror` 进行全局监听。

### 技术选型对比
| 方案 | 特点 | 适用场景 |
| :--- | :--- | :--- |
| **`window.onerror`** | **(当前采用)** 可以获取 `message`, `source`, `lineno`, `colno`, `error` (堆栈) 等详细信息。 | **最佳实践**：专门用于捕获 JS 逻辑错误。 |
| `window.addEventListener('error')` | `ErrorEvent` 对象包含的信息相对较少，且主要用于捕获资源错误（在捕获阶段）。 | 资源错误监控。 |
| `try-catch` | 只能捕获同步代码块的错误，无法捕获全局异步错误，且侵入性强。 | 局部高危代码保护。 |

### 优缺点分析
*   **优点**: 能获取最完整的错误堆栈，便于定位具体代码行号。
*   **缺点**: 
    *   无法捕获 Promise 错误（需要 `unhandledrejection`）。
    *   无法捕获资源加载错误（不冒泡）。
    *   跨域脚本错误可能只显示 "Script error."（需要后端配置 CORS 和前端加 `crossorigin` 属性）。

---

## 2. 资源加载错误监控 (`resourceErrorPlugin`)

### 实现方式
使用 `window.addEventListener('error', handler, true)`，即在**捕获阶段**监听。

### 技术选型分析
*   **为什么不用 `window.onerror`?**
    *   资源加载失败（`img`, `script`, `link`）产生的 `error` 事件**不会冒泡**。`window.onerror` 只能捕获冒泡上来的错误，因此无法感知资源错误。
*   **为什么用 `useCapture: true`?**
    *   由于不冒泡，必须在事件到达目标元素之前的**捕获阶段**，在 `window` 上进行拦截。

### 优缺点分析
*   **优点**: 唯一能全局捕获资源加载失败的方法。
*   **缺点**: 
    *   **噪点多**: 容易捕获到第三方脚本（如广告、统计）被浏览器插件拦截导致的错误。
    *   **区分困难**: 需要通过 `event.target` 精确判断是否为 HTML 元素（`src`/`href`），避免与 JS 运行时错误混淆（虽然 JS 错误通常不走捕获阶段，但需防御性编程）。

---

## 3. Promise 异常监控 (`promiseErrorPlugin`)

### 实现方式
使用 `window.addEventListener('unhandledrejection')`。

### 分析
*   **必要性**: 现代前端大量使用 Promise/Async/Await。如果 Promise 被 `reject` 且没有 `catch`，`window.onerror` 无法捕获，必须使用此事件。
*   **缺点**: 只能捕获**未被处理**的 Promise 错误。如果开发者写了 `.catch()` 但处理逻辑有误，监控无法感知。

---

## 4. 白屏检测 (`whiteScreenPlugin`)

### 实现方式
**当前实现**: `setTimeout` 延迟检测，通过 `document.querySelector` 检查页面是否存在 `['IMG', 'DIV', ...]` 等标签。

### 深度评价 (存在缺陷)
*   **当前方案过于简陋**: 
    *   仅仅判断 DOM 节点是否存在是不够的。一个空白的 `<div id="root"></div>` 或者一个全屏的 Loading 骨架屏，都会被误判为“正常”。
    *   **误报率高**: 页面可能已经渲染了容器，但 JS 报错导致内容未填充。
*   **改进建议**:
    *   **采样法 (`elementsFromPoint`)**: 在屏幕中心十字线上取多个点，判断最上层元素是否为 `html`, `body` 或空容器。
    *   **关键点检测**: 检测根节点是否有子节点，且子节点是否有高度/宽度。

---

## 5. 性能指标监控 (`performanceMetricsPlugin`)

### 实现方式
使用 `PerformanceObserver` 监听 `paint` (FCP), `largest-contentful-paint` (LCP), `layout-shift` (CLS)。

### 技术选型对比
| 方案 | 特点 |
| :--- | :--- |
| **`PerformanceObserver`** | **(当前采用)** 现代 API，被动推送，性能开销小，支持 buffered (获取监听前的历史数据)。 |
| `performance.getEntriesByType` | 主动轮询或在特定时机调用，容易漏掉数据，且无法实时响应。 |

### 优缺点分析
*   **优点**: 使用了标准 API，准确度高。
*   **缺点**: 
    *   **兼容性**: 旧浏览器不支持 `PerformanceObserver`。
    *   **CLS 计算**: 当前实现使用了简单的防抖 (`setTimeout`)，可能无法准确反映整个会话窗口的布局偏移情况（Google 标准推荐使用 Session Window 算法）。

---

## 6. 资源性能监控 (`resourcePerformancePlugin`)

### 实现方式
使用 `PerformanceObserver` 监听 `resource` 类型。

### 优缺点分析
*   **优点**: 能获取所有静态资源的加载耗时、大小、协议等。
*   **风险**: 
    *   **数据量巨大**: 一个页面可能有上百个资源，全量上报会消耗大量带宽和存储。
    *   **建议**: 增加**采样率**配置，或只上报加载耗时超过特定阈值（如 2秒）的资源。

---

## 7. 埋点插件 (`trackingPlugin`)

### 实现方式
*   **PV (Page View)**: 
    *   重写 (Monkey Patch) `history.pushState` 和 `history.replaceState`。
    *   监听 `popstate` (浏览器前进后退)。
    *   监听 `load` (首屏)。
*   **停留时长**: 记录 `enterTime`，在页面切换或卸载时计算差值。

### 技术选型分析
*   **为什么重写 History API?**
    *   在 SPA (单页应用) 中，路由切换通常通过 `pushState` 完成，**不会触发浏览器刷新**，也不会触发标准的 `popstate` 事件（`popstate` 仅在用户点击浏览器前进/后退时触发）。因此必须拦截 `pushState` 才能感知路由变化。
*   **缺点**:
    *   **侵入性**: 修改了浏览器原生对象，理论上存在与其他库冲突的风险（虽然代码中保存了原始引用）。
    *   **Hash 模式**: 当前代码主要针对 History 模式，虽然 `popstate` 在现代浏览器也支持 Hash 变化，但兼容性不如 `hashchange` 事件。

---

## 8. 录制插件 (`rrwebPlugin`)

### 实现方式
集成 `rrweb` 库进行 DOM 录制。

### 优缺点分析
*   **优点**: 提供“案发现场”的视频级回放，是调试复杂 Bug 的杀手锏。
*   **缺点**:
    *   **体积大**: `rrweb` 核心库体积较大，会显著增加 SDK 体积。
    *   **性能开销**: 频繁的 DOM 序列化和 MutationObserver 回调可能影响主线程性能。
    *   **隐私风险**: 必须严格配置 `maskAllInputs` 和 `maskTextSelector`，否则极易泄露用户隐私（密码、手机号）。

---

## 9. 通知插件 (`notifyPlugin`)

### 实现方式
利用 SDK 内部的 `monitor.addReportHook` 机制，在数据上报前进行拦截和处理。

### 评价
*   **设计亮点**: 
    *   **解耦**: 通知逻辑与核心上报逻辑分离。
    *   **灵活性**: 支持自定义 `customNotify` 函数，方便对接钉钉、飞书或邮件系统。
    *   **阈值控制**: 内置了 `threshold` (阈值) 逻辑，防止报警风暴（例如：只有当 JS 错误发生 100 次才报警）。
