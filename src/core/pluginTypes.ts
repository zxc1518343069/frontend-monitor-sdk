/**
 * 埋点插件配置类型
 */
export interface TrackingPluginOptions {
    monitoredUrls?: string[] | (() => Promise<string[]>); // 需要监控的URL列表（静态或动态获取）
}

/**
 * 性能插件配置类型
 */
export interface PerformancePluginOptions {
    reportInterval?: number; // 性能数据上报间隔
}

/**
 * rrweb插件配置类型
 */
export interface RrwebPluginOptions {
    maskAllInputs?: boolean; // 是否屏蔽所有输入框内容
    maskTextSelector?: string; // 屏蔽文本的选择器
    uploadInterval?: number; // 数据上传间隔
}