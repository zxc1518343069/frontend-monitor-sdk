/**
 * SDK 全局配置常量
 * 集中管理默认值，方便维护和调整
 */

export const DEFAULT_CONFIG = {
    /** 白屏检测延迟时间（毫秒） */
    WHITE_SCREEN_DELAY: 3000,

    /** rrweb 分片上传间隔（毫秒） */
    RRWEB_UPLOAD_INTERVAL: 30000,

    /** rrweb 错误触发回放的最大时长（毫秒） */
    RRWEB_MAX_REPLAY_DURATION: 10000,

    /** rrweb 本地缓存 key */
    RRWEB_CACHE_KEY: 'rrweb-events-cache',

    /** rrweb 本地缓存最大条数 */
    RRWEB_MAX_CACHE_SIZE: 10,

    /** Reporter 批量上报间隔（毫秒） */
    BATCH_INTERVAL: 1000,

    /** Reporter 最大重试次数 */
    MAX_RETRIES: 3,

    /** Reporter 离线缓存最大条数 */
    MAX_CACHE_SIZE: 100,

    /** Reporter 离线缓存 key */
    OFFLINE_CACHE_KEY: 'frontend-monitor-offline-cache',

    /** 性能指标 CLS 防抖时间（毫秒） */
    CLS_DEBOUNCE_TIME: 1000,
} as const;

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
    NOT_SUPPORTED: (feature: string) => `[FrontendMonitor] 当前浏览器不支持 ${feature}`,
    PLUGIN_REGISTER_FAILED: (pluginName: string) => `[FrontendMonitor] 插件 ${pluginName} 注册失败`,
    PLUGIN_START_FAILED: (pluginName: string) => `[FrontendMonitor] 插件 ${pluginName} 启动失败`,
    API_EXISTS: (apiName: string) => `[FrontendMonitor] API ${apiName} 已存在，跳过注册`,
    MISSING_DEPENDENCY: (pluginName: string, deps: string[]) =>
        `[FrontendMonitor] 插件 ${pluginName} 缺少依赖: ${deps.join(', ')}`,
    CACHE_FAILED: (operation: string) => `[FrontendMonitor] 缓存${operation}失败`,
    BASE64_ENCODE_FAILED: '[FrontendMonitor] Base64编码失败，使用原始字符串',
    REPORT_FAILED: '[FrontendMonitor] 批量上报失败',
    CUSTOM_REPORT_FAILED: '[FrontendMonitor] 自定义上报失败',
    BACKEND_UNAVAILABLE: '[FrontendMonitor] 后端不可用，切换到本地缓存模式',
    ADDEVENTLISTENER_NOT_IN_SETUP: '[FrontendMonitor] addEventListener 只能在插件 setup 中调用',
} as const;
