/**
 * SDK 入口文件
 * 负责导出核心类和插件，供外部使用
 */
export { FrontendMonitor } from './core/monitor';
export type { MonitorPlugin } from './core/types';
export type { TrackingPluginOptions } from './core/pluginTypes';

// 导出插件
export { default as trackingPlugin } from './plugins/trackingPlugin';