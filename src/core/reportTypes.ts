import { JsErrorPayload } from "../plugins/jsError";
import { PromiseErrorPayload } from "../plugins/promiseError";
import { RrwebPayload } from "../plugins/rrwebPlugin";


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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;    // 用户可扩展字段
}


export interface ResourceErrorPayload {
    tagName: string;
    src: string;
}

export interface WhiteScreenPayload {
    message: string;
    /** 空白采样点数量 */
    emptyPoints?: number;
    /** 总采样点数量 */
    totalPoints?: number;
}

export interface PerformanceMetricsPayload {
    metric: 'FCP' | 'LCP' | 'CLS';
    value: number;
}

export interface ResourcePerformancePayload {
    /** 资源名称（通常是 URL） */
    name: string;
    /** 资源类型 (script, css, img, xmlhttprequest 等) */
    initiatorType: string;
    /** 加载耗时 (ms) */
    duration: number;
    /** 传输大小 (bytes) */
    transferSize: number;
    /** 协议版本 (h2, http/1.1 等) */
    nextHopProtocol?: string;
    /** DNS 查询耗时 (ms) */
    dnsTime?: number;
    /** TCP 连接耗时 (ms) */
    tcpTime?: number;
    /** 首字节时间 (Time to First Byte) (ms) */
    ttfb?: number;
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
    payload: PayloadMap[T] & { count?: number }
    hash: string
}