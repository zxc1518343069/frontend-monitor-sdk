/**
 * Plugins 模块入口文件
 * 统一导出所有插件和相关类型
 */

// 导出插件枚举和类型
export * from './enum';
export * from './types';

// 导出错误监控插件
export { default as jsErrorPlugin } from './jsError';
export { default as promiseErrorPlugin } from './promiseError';
export { default as resourceErrorPlugin } from './resourceError';
export { default as whiteScreenPlugin } from './whiteScreen';

// 导出性能监控插件
export { default as performanceMetricsPlugin } from './performanceMetrics';
export { default as resourcePerformancePlugin } from './resourcePerformance';

// 导出功能性插件
export { default as trackingPlugin } from './trackingPlugin';
export { default as rrwebPlugin } from './rrwebPlugin';
export { default as notifyPlugin } from './notifyPlugin';
