# Frontend Monitor SDK

一个 **插件化、可扩展** 的前端监控 SDK，支持错误监控、性能监控、埋点、操作回放等功能。  
适用于 Web 前端项目（MPA / SPA），可按需加载插件，灵活配置。

---

## ✨ 特性

- **插件化架构**：核心类 + 插件体系，按需加载功能
- **统一 API 注册机制**：插件安全挂载 API，避免冲突
- **错误监控**：JS 运行时错误、Promise 未捕获异常、资源加载错误、白屏检测
- **性能监控**：资源性能、FCP / LCP / CLS 指标
- **埋点体系**：自动 PV & 停留时长，支持 URL 白名单过滤
- **可扩展性**：支持自定义插件、rrweb 操作回放
- **上报机制**：支持 `sendBeacon` / `fetch`，可扩展批量上报、去重、离线缓存

---

## 📦 安装

```bash
npm install frontend-monitor-sdk
```
---
## 📂 目录结构
```plaintext
frontend-monitor-sdk/
├── package.json                  # npm 项目配置文件
├── tsconfig.json                 # TypeScript 编译配置
├── rollup.config.js              # Rollup 打包配置
├── README.md                     # 项目说明文档
└── src/                          # 源码目录
    ├── index.ts                   # SDK 入口文件，导出核心类和插件
    ├── core/                      # 核心模块
    │   ├── monitor.ts             # 核心类（插件管理、API注册、上报机制）
    │   ├── types.ts               # 插件接口类型定义
    │   ├── pluginTypes.ts         # 各插件的配置类型定义
    │   ├── utils.ts               # 工具函数（通配符匹配、获取URL等）
    └── plugins/                   # 插件目录
        ├── trackingPlugin.ts      # 埋点插件（自动PV & 停留时长 + URL白名单）
        ├── jsError.ts             # JS运行时错误监控插件
        ├── promiseError.ts        # Promise未捕获异常监控插件
        ├── resourceError.ts       # 资源加载错误监控插件
        ├── whiteScreen.ts         # 白屏检测插件
        ├── resourcePerformance.ts # 资源性能监控插件
        ├── performanceMetrics.ts  # FCP/LCP/CLS性能指标监控插件
        └── rrwebPlugin.ts         # rrweb操作回放插件（未来实现）
```
---
## 🚀 快速开始
1. 引入核心类和插件
```ts
复制
import { FrontendMonitor } from 'frontend-monitor-sdk';
import { trackingPlugin, jsErrorPlugin, promiseErrorPlugin, resourceErrorPlugin, whiteScreenPlugin, resourcePerformancePlugin, performanceMetricsPlugin } from 'frontend-monitor-sdk/plugins';

const monitor = new FrontendMonitor({
  serverUrl: 'https://your-server.com/monitor/error',
  version: '1.0.0'
});

// 注册插件
monitor.use(trackingPlugin({
  monitoredUrls: ['/home', '/product/*', '/about'] // URL白名单
}));
monitor.use(jsErrorPlugin);
monitor.use(promiseErrorPlugin);
monitor.use(resourceErrorPlugin);
monitor.use(whiteScreenPlugin);
monitor.use(resourcePerformancePlugin);
monitor.use(performanceMetricsPlugin);

// 初始化
monitor.init();
```
---
2. 手动调用埋点 API
```ts
复制
// 手动记录PV
(monitor as any).trackPageView('CustomPage');

// 手动记录停留时长
(monitor as any).trackStayTime('CustomPage', 5000);
```
---
## 🔌 插件说明
**trackingPlugin**
+ 自动记录 PV（页面浏览）和停留时长 
+ 支持 URL 白名单过滤（静态数组或动态获取） 
+ 保留手动 API：trackPageView、trackStayTime

**jsErrorPlugin**
+ 捕获 JS 运行时错误（window.onerror）
**promiseErrorPlugin**
+ 捕获 Promise 未捕获异常（unhandledrejection）
**resourceErrorPlugin**
+ 捕获资源加载错误（图片、CSS、JS）

**whiteScreenPlugin**

+ 延迟检测页面是否有有效内容，判断白屏
**resourcePerformancePlugin**
+ 采集资源加载性能数据（加载时间、大小等）
**performanceMetricsPlugin**
+ 采集 FCP（首次内容绘制）、LCP（最大内容绘制）、CLS（累计布局偏移）
---
## 🛠 扩展插件
你可以自定义插件：

```ts
复制
const customPlugin = {
  name: 'customPlugin',
  setup(monitor) {
    monitor.registerApi('customApi', () => {
      monitor.report({ type: 'custom', message: 'Hello World' });
    });
  },
  destroy() {
    monitor.unregisterApi('customApi');
  }
};

monitor.use(customPlugin);
```
---
## 📡 上报机制
+ 默认使用 navigator.sendBeacon（页面卸载时也能发送）
+ 如果不支持 sendBeacon，使用 fetch POST
+ 可扩展批量上报、去重、离线缓存
---
## 📜 License
MIT