# Frontend Monitor SDK

一个 **插件化、可扩展** 的前端监控 SDK，支持错误监控、性能监控、埋点、操作回放等功能。
适用于 Web 前端项目（MPA / SPA），可按需加载插件，灵活配置。

---

## ✨ 特性

- **插件化架构**：核心类 + 插件体系，按需加载功能，体积轻量。
- **类型安全**：全量 TypeScript 编写，提供完整的类型定义。
- **错误监控**：JS 运行时错误、Promise 未捕获异常、资源加载错误、白屏检测（采样法）。
- **性能监控**：资源加载性能（支持过滤/采样）、核心指标（FCP / LCP / CLS）。
- **埋点体系**：自动 PV & 停留时长，支持 URL 白名单过滤。
- **操作回放**：集成 `rrweb` 进行全量录制与错误触发回放（支持依赖注入，按需引入）。
- **消息通知**：支持自定义报警规则和阈值，对接钉钉/飞书/邮件。
- **上报机制**：支持 `sendBeacon` / `fetch`，支持批量上报、错误聚合、离线缓存。

---

## 📦 安装

### 1. 安装 SDK

```bash
npm install frontend-monitor-sdk
```

### 2. 安装可选依赖 (如果需要录制功能)

本 SDK 将 `rrweb` 设为对等依赖 (Peer Dependency)，以减小核心包体积。如果您需要使用 `rrwebPlugin`，请务必安装：

```bash
npm install rrweb
```

---

## 🚀 快速开始

### 基础用法

```typescript
import { FrontendMonitor } from 'frontend-monitor-sdk';
import {
    jsErrorPlugin,
    promiseErrorPlugin,
    resourceErrorPlugin,
    whiteScreenPlugin,
    performanceMetricsPlugin,
    resourcePerformancePlugin,
    trackingPlugin,
    notifyPlugin
} from 'frontend-monitor-sdk/plugins';

// 1. 初始化实例
const monitor = new FrontendMonitor({
    serverUrl: 'https://your-server.com/report', // 上报接口
    version: '1.0.0', // 应用版本
    commonData: {
        uid: 'user_123', // 用户ID
        env: 'prod'      // 环境
    }
});

// 2. 注册插件
monitor.use(jsErrorPlugin());
monitor.use(promiseErrorPlugin());
monitor.use(resourceErrorPlugin());

// 白屏检测 (采样法)
monitor.use(whiteScreenPlugin({
    rootSelector: '#app', // 根容器
    firstCheckDelay: 3000 // 首屏检测延迟
}));

// 性能监控
monitor.use(performanceMetricsPlugin()); // FCP, LCP, CLS
monitor.use(resourcePerformancePlugin({
    threshold: 1000, // 只上报加载超过 1s 的资源
    resourceTypes: ['script', 'css', 'xmlhttprequest'], // 只监控特定类型
    sampling: 0.5 // 50% 采样率
}));

// 埋点
monitor.use(trackingPlugin({
    monitoredUrls: ['/home', '/product/*'] // URL 白名单
}));

// 3. 启动
monitor.init();
```

### 高级用法：集成 rrweb 录制

```typescript
import { rrwebPlugin } from 'frontend-monitor-sdk/plugins';
import * as rrweb from 'rrweb'; // 需手动安装 rrweb

monitor.use(rrwebPlugin({
    rrweb: rrweb, // 必须传入 rrweb 实例
    saveToLocal: true, // 是否存入 localStorage (用于本地回放)
    uploadInterval: 10000, // 上报间隔
    maxCacheSize: 5 // 本地缓存条数
}));
```

### 高级用法：自定义报警

```typescript
import { ErrorType } from 'frontend-monitor-sdk';

monitor.use(notifyPlugin({
    rules: [
        { type: ErrorType.JS_ERROR, threshold: 10 }, // JS 错误发生 10 次才报警
        { type: ErrorType.WHITE_SCREEN, threshold: 1 } // 白屏立即报警
    ],
    customNotify: (data) => {
        // 调用你的报警接口，如钉钉 Webhook
        fetch('https://oapi.dingtalk.com/robot/send...', {
            method: 'POST',
            body: JSON.stringify({ msg: `报警: ${data.type}` })
        });
    }
}));
```

---

## 🔌 插件详解

| 插件名称 | 功能描述 | 关键配置项 |
| :--- | :--- | :--- |
| `jsErrorPlugin` | 捕获 `window.onerror` | 无 |
| `promiseErrorPlugin` | 捕获 `unhandledrejection` | 无 |
| `resourceErrorPlugin` | 捕获资源加载失败 (img, script) | 无 |
| `whiteScreenPlugin` | **白屏检测**<br>使用 `elementsFromPoint` 采样检测页面是否为空 | `rootSelector`: 根容器<br>`samplePoints`: 自定义采样点<br>`loopCount`: 轮询复查次数 |
| `performanceMetricsPlugin` | **核心性能指标**<br>采集 FCP, LCP, CLS | 无 |
| `resourcePerformancePlugin` | **资源加载性能**<br>采集资源耗时、大小、协议等 | `threshold`: 耗时阈值(ms)<br>`resourceTypes`: 资源类型白名单<br>`sampling`: 采样率(0-1) |
| `trackingPlugin` | **自动埋点**<br>PV (路由切换) & 停留时长 | `monitoredUrls`: 监控 URL 列表 (支持通配符) |
| `rrwebPlugin` | **录制回放**<br>全量录制 DOM 操作 | `rrweb`: **必传** rrweb 实例<br>`saveToLocal`: 是否本地缓存<br>`maskAllInputs`: 屏蔽输入框 |
| `notifyPlugin` | **报警通知**<br>端侧触发报警逻辑 | `rules`: 报警规则 (类型+阈值)<br>`customNotify`: 自定义回调 |

---

## 🛠 开发与构建

### 启动开发环境

启动测试页面，包含全量功能演示和实时日志面板。

```bash
npm run dev
# 访问 http://localhost:3000/test.html
```

### 构建 SDK

构建出用于发布的 `dist` 目录（包含 ES Module, UMD 和类型定义）。

```bash
npm run build:lib
```

---

## 📡 上报数据格式

SDK 上报的数据遵循统一的格式：

```typescript
interface ReportPayload {
    type: ErrorType;       // 错误类型 (jsError, whiteScreen, ...)
    hash: string;          // 错误指纹 (用于去重)
    commonData: {
        url: string;       // 页面 URL
        time: number;      // 时间戳
        userAgent: string; // 浏览器 UA
        version: string;   // 应用版本
        [key: string]: any;// 自定义字段 (uid 等)
    };
    payload: any;          // 具体错误数据 (不同 type 结构不同)
}
```

---

## 📜 License

MIT
