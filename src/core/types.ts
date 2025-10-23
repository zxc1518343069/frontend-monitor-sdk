import {FrontendMonitor} from "./monitor";

/**
 * 插件接口定义
 */
export interface MonitorPlugin {
    /** 插件名称 */
    name: string;
    /** 插件初始化方法，传入 monitor 实例 */
    setup: (monitor: FrontendMonitor) => void;
}

/**
 * SDK 初始化配置项
 */
export interface MonitorOptions {
    /** 错误上报地址（如果不使用自定义上报则必填） */
    serverUrl?: string;
    /** 白屏检测延迟时间（毫秒） */
    whiteScreenDelay?: number;
    /** 项目版本号（用于 SourceMap 解析） */
    version?: string;
    /** 是否开启 JS 运行时错误收集 */
    enableJsError?: boolean;
    /** 是否开启 Promise 未捕获异常收集 */
    enablePromiseError?: boolean;
    /** 是否开启资源加载错误收集 */
    enableResourceError?: boolean;
    /** 是否开启白屏检测 */
    enableWhiteScreen?: boolean;
    /** 自定义上报函数（如果提供则替代默认上报逻辑） */
    customReport?: (data: Record<string, any>) => void;
}