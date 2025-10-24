import { JsErrorPayload } from "src/plugins/jsError";
import { PromiseErrorPayload } from "src/plugins/promiseError";
import { RrwebPayload } from "src/plugins/rrwebPlugin";


/**
 * 错误类型枚举
 * 所有插件的 type 都必须在这里定义
 */
export enum ErrorType {
    JS_ERROR = 'jsError',
    PROMISE_ERROR = 'promiseError',
    RESOURCE_ERROR = 'resourceError',
    WHITE_SCREEN = 'whiteScreen',
    PERFORMANCE_METRICS = 'performanceMetrics',
    RESOURCE_PERFORMANCE = 'resourcePerformance',
    TRACKING_PV = 'trackPageView',
    RRWEB = 'rrweb',
    TRACKING_STAY = 'trackStayTime'
}

/**
 * 公共信息类型
 * SDK 会自动填充基础信息，用户可扩展
 */
export interface CommonData {
    url: string;           // 当前页面URL
    userAgent: string;     // 浏览器UA
    time: number;          // 时间戳
    version?: string;      // 项目版本号
    [key: string]: any;    // 用户可扩展字段
}


export interface ResourceErrorPayload {
    tagName: string;
    src: string;
}

export interface WhiteScreenPayload {
    message: string;
}

export interface PerformanceMetricsPayload {
    metric: 'FCP' | 'LCP' | 'CLS';
    value: number;
}

export interface ResourcePerformancePayload {
    name: string;
    initiatorType: string;
    duration: number;
    transferSize: number;
}

export interface TrackingPvPayload {
    page: string;
}

export interface TrackingStayPayload {
    page: string;
    duration: number;
}

/**
 * Payload 映射表
 * 用于根据 type 自动推导 payload 类型
 */
export type PayloadMap = {
    [ErrorType.JS_ERROR]: JsErrorPayload;
    [ErrorType.PROMISE_ERROR]: PromiseErrorPayload;
    [ErrorType.RESOURCE_ERROR]: ResourceErrorPayload;
    [ErrorType.WHITE_SCREEN]: WhiteScreenPayload;
    [ErrorType.PERFORMANCE_METRICS]: PerformanceMetricsPayload;
    [ErrorType.RESOURCE_PERFORMANCE]: ResourcePerformancePayload;
    [ErrorType.TRACKING_PV]: TrackingPvPayload;
    [ErrorType.TRACKING_STAY]: TrackingStayPayload;
    [ErrorType.RRWEB]: RrwebPayload;
};

/**
 * 最终的上报数据类型
 */
export interface ReportPayload<T extends ErrorType = ErrorType> {
    type: T;
    commonData: CommonData;
    payload: PayloadMap[T]
    count?: number
    hash: string
}