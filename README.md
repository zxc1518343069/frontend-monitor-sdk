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
- **操作回放**：基于 rrweb 的全量录制与错误触发回放
- **消息通知**：支持配置事件，触发消息通知
- **上报机制**：支持 `sendBeacon` / `fetch`，可扩展批量上报、去重、离线缓存

---

## 📦 安装(todo)

**暂未发布到 npm上**

```bash
npm install frontend-monitor-sdk
```

---

## 📋 功能总览表

| 功能类别     | 插件名称                        | 主要功能说明                                 | 是否已实现 |
|----------|-----------------------------|----------------------------------------|-------|
| **错误监控** | `jsErrorPlugin`             | 捕获 JS 运行时错误（`window.onerror`）          | ✅ 已实现 |
|          | `promiseErrorPlugin`        | 捕获 Promise 未捕获异常（`unhandledrejection`） | ✅ 已实现 |
|          | `resourceErrorPlugin`       | 捕获资源加载错误（图片、CSS、JS 等）                  | ✅ 已实现 |
|          | `whiteScreenPlugin`         | 延迟检测页面是否有有效内容，判断白屏                     | ✅ 已实现 |
| **性能监控** | `resourcePerformancePlugin` | 采集资源加载性能数据（加载时间、大小等）                   | ✅ 已实现 |
|          | `performanceMetricsPlugin`  | 采集 FCP（首次内容绘制）、LCP（最大内容绘制）、CLS（累计布局偏移） | ✅ 已实现 |
| **埋点体系** | `trackingPlugin`            | 自动记录 PV（页面浏览）和停留时长，支持 URL 白名单过滤        | ✅ 已实现 |
| **操作回放** | `rrwebPlugin`               | 基于 rrweb 的全量录制与错误触发回放，支持分片上传、隐私保护、本地缓存 | ✅ 已实现 |
| **消息通知** | `notifyPlugin`              | 在关键事件发生时立即通知开发团队，支持 HTTP API 和自定义通知函数  | ✅ 已实现 |
| **上报机制** | `Reporter`（核心类内置）           | 支持单条/批量上传、错误聚合、离线缓存、页面卸载兜底上报           | ✅ 已实现 |
| **本地缓存** | `localCache`（工具模块）          | 封装 localStorage 操作，支持最大缓存数量限制          | ✅ 已实现 |

## 📂 目录结构

```plaintext
frontend-monitor-sdk/
├── package.json                  # npm 项目配置文件
├── tsconfig.json                 # TypeScript 编译配置
├── README.md                     # 项目说明文档
├── exampleTest/                  # 测试页面目录
│   ├── reporterTest.html         # 上报测试页面
│   ├── spa.html                  # 单页面测试
│   └── mpa.html                  # 多页面测试
│   └── rrwebTest.html            # rrweb 录制测试页面
│   └── rrwebReplay.html          # rrweb 回放测试页面
└── src/                          # 源码目录
    ├── index.ts                   # SDK 入口文件，导出核心类和插件
    ├── utils/                     # 辅助函数
    │   ├── localCache.ts          # 处理浏览器本地缓存
    │   ├── hash.ts                # hash 生成相关
    │   ├── index.ts               # 导入导出入口
    ├── core/                      # 核心模块
    │   ├── monitor.ts             # 核心类（插件管理、API注册、上报机制）
    │   ├── types.ts               # 插件接口类型定义
    │   ├── pluginTypes.ts         # 各插件的配置类型定义
    │   ├── utils.ts               # 工具函数（通配符匹配、获取URL等）
    └── plugins/                   # 插件目录
        ├── trackingPlugin.ts      # 埋点插件（自动PV & 停留时长 + URL白名单）
        ├── jsError.ts             # JS运行时错误监控插件
        ├── notifyPlugin.ts        # 消息通知插件
        ├── promiseError.ts        # Promise未捕获异常监控插件
        ├── resourceError.ts       # 资源加载错误监控插件
        ├── whiteScreen.ts         # 白屏检测插件
        ├── resourcePerformance.ts # 资源性能监控插件
        ├── performanceMetrics.ts  # FCP/LCP/CLS性能指标监控插件
        └── rrwebPlugin.ts         # rrweb操作回放插件
```

---

## 🚀 快速开始

1. 引入核心类和插件

```ts
import { FrontendMonitor } from 'frontend-monitor-sdk';
import {
    trackingPlugin,
    jsErrorPlugin,
    promiseErrorPlugin,
    resourceErrorPlugin,
    whiteScreenPlugin,
    resourcePerformancePlugin,
    performanceMetricsPlugin
} from 'frontend-monitor-sdk/plugins';

const monitor = new FrontendMonitor({
    serverUrl: 'https://your-server.com/monitor/error',
    version: '1.0.0'
});

// 注册插件
monitor.use(trackingPlugin({
    monitoredUrls: ['/home', '/product/*', '/about'] // URL白名单
}));

monitor.use(notifyPlugin({
    notifyUrl: 'http://localhost:3000/notify', // 你的通知接口
    rules: [
        {
            type: ErrorType.JS_ERROR,
            threshold: 100  // JS错误发生100次才通知
        },
        {
            type: ErrorType.PROMISE_ERROR,
            threshold: 50   // Promise错误发生50次才通知
        },
        {
            type: ErrorType.PERFORMANCE_METRICS
            // 不设置 threshold，每次都通知
        }
    ],
    customNotify: (data) => {
        console.log('通知触发:', data);
        alert(`通知触发: ${data.type}`);
    }
}));
monitor.use(rrwebPlugin({
    uploadInterval: 15000, // 每15秒上传一次分片
    maxReplayDuration: 5000, // 错误触发回放模式下回放最近5秒
    maskAllInputs: true, // 屏蔽所有输入框内容
    maskTextSelector: '.private', // 屏蔽指定元素文本
    saveToLocal: true, // 保存事件到本地缓存
    localCacheKey: 'rrweb-events-cache', // 本地缓存键名
    maxCacheSize: 5 // 最大缓存条数
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

// 注册 trackingPlugin 后方可调用这两个方法
// 如果使用自定义插件。, 请先参考扩展插件

// 手动记录PV
monitor.trackPageView('CustomPage');

// 手动记录停留时长
monitor.trackStayTime('CustomPage', 5000);
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

**rrwebPlugin**

+ 基于 rrweb 的全量录制与错误触发回放，支持分片上传、隐私保护、本地缓存

**notifyPlugin**

+ 在关键事件发生时立即通知开发团队，支持 HTTP API 和自定义通知函数
+ 支持为不同错误类型配置不同的阈值
+ 配置示例：
  ```typescript
  notifyPlugin({
    rules: [
      { type: ErrorType.JS_ERROR, threshold: 100 },       // JS错误100次才通知
      { type: ErrorType.PROMISE_ERROR, threshold: 50 },   // Promise错误50次才通知
      { type: ErrorType.PERFORMANCE_METRICS }             // 性能指标每次都通知
    ]
  })
  ```

---

## 🛠 扩展插件

你可以自定义插件：

```ts
const customPlugin = {
    name: 'customPlugin',
    setup(monitor) {
        // customApi 将绑定到monitor实例上。如果有需要。
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

+ 默认使用 fetch，支持自定义上报
+ 页面卸载时使用 navigator.sendBeacon
+ 可扩展批量上报、去重、离线缓存

---

## 📜 License

MIT