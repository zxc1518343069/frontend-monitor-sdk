import { ReportPayload, ErrorType, CommonData, PayloadMap } from './reportTypes';
import { clearCache, getLocalCache, saveToCache } from "../utils/localCache";
import { computeHash } from "../utils/hash";

export type QueuedReportPayload<T extends ErrorType = ErrorType> = ReportPayload<T> & { hash: string };


export interface ReporterOptions {
    serverUrl?: string;
    customReport?: (batch: ReportPayload[]) => Promise<void>
    /**
     * @description 上报间隔,默认出错就上报
     * @private
     */
    batchInterval?: number;
    /**
     * @description 缓存key
     * @private
     */
    offlineCacheKey?: string;
    /**
     * @description 最大重试次数
     */
    maxRetries?: number;
    /**
     * @description 最大缓存数
     */
    maxCacheSize?: number
    /**
     * @description  上报模式，单条上报还是批量上报，默认单条上报
     */
    uploadMode?: 'single' | 'batch';
    /**
     * @description  错误是否聚合,合并后相同错误只上报一次，默认不聚合
     */
    errorAggregation?: {
        /**
         * @description 是否需要错误数量统计
         * @default false
         */
        needErrorNumber?: boolean;
    };
}

/**
 * Reporter 类
 * 负责批量上报、去重、离线缓存、自定义上报
 */
export class Reporter {
    private queue: ReportPayload[] = [];
    private timer: number | null = null;
    private serverUrl?: string;
    private errorAggregation?: ReporterOptions['errorAggregation'];
    private customReport?: (batch: ReportPayload[]) => Promise<void> | void;
    private batchInterval: number;
    private maxRetries: number;
    private cacheKey: string;
    private uploadMode: string;

    private maxCacheSize: number;
    private requestFailCount: number = 0;
    private backendAvailable: boolean = true;

    constructor(options: ReporterOptions) {
        this.serverUrl = options.serverUrl;
        this.customReport = options.customReport;
        this.batchInterval = options.batchInterval || 1000;
        this.cacheKey = options.offlineCacheKey || 'frontend-monitor-offline-cache';
        this.maxRetries = options.maxRetries || 3;
        this.maxCacheSize = options.maxCacheSize || 100;
        this.uploadMode = options.uploadMode || 'single';
        this.errorAggregation = options.errorAggregation || {needErrorNumber: false};


        this.setupOfflineFlush();
        this.setupUnloadListener();
    }

    /**
     * 添加数据到队列
     * @param type 错误类型
     * @param payload 插件专属数据
     * @param commonData 公共信息（可选，用户可扩展）
     */
    add<T extends ErrorType>(type: T, payload: PayloadMap[T], commonData?: Partial<CommonData>) {
        const hash = computeHash(type, payload);

        const reportItem = createReportItem(type, payload, commonData, hash);

        // 如果开启聚合模式
        if (this.errorAggregation) {
            const existing = this.queue.find(item => item.hash === hash);
            if (existing) {
                existing.count = (existing.count || 1) + 1;
                return;
            }
        }


        // 如果后台不可用，直接存到本地缓存
        if (!this.backendAvailable || !navigator.onLine) {
            saveToCache(this.cacheKey, reportItem, this.maxCacheSize);
            return;
        }

        if (this.uploadMode === 'single') {
            // 单条上传模式
            this.send([reportItem]);
        } else {
            // 批量上传模式
            this.queue.push(reportItem);
            if (!this.timer) {
                this.timer = window.setTimeout(() => this.flush(), this.batchInterval);
            }
        }
    }


    /**
     * 批量上报
     */
    async flush() {
        if (this.queue.length === 0) {
            this.timer = null;
            return;
        }
        const batch = [...this.queue];
        this.queue = [];
        this.timer = null;
        this.send(batch);
    }

    /**
     * @description 发送数据到服务器或自定义上报函数
     * @param batch
     * @private
     */
    private send(batch: ReportPayload[]) {

        if (this.customReport) {
            try {
                this.customReport(batch);
                this.sendSuccess();
            } catch (err) {
                console.error('[FrontendMonitor] 自定义上报失败', err);
                this.sendFail(batch);
            }
            return;
        }

        if (this.serverUrl) {
            fetch(this.serverUrl, {
                method: 'POST',
                body: JSON.stringify(batch),
                headers: {'Content-Type': 'application/json'}
            })
                .then(res => {
                    res.ok ? this.sendSuccess() : this.sendFail(batch);
                })
                .catch(err => {
                    console.error('[FrontendMonitor] 批量上报失败', err);
                    this.sendFail(batch);
                });
        }
    }

    /**
     * 网络恢复时上报离线缓存
     */
    private setupOfflineFlush() {
        window.addEventListener('online', () => {
            const cache = getLocalCache(this.cacheKey)
            if (cache.length > 0) {
                this.queue.push(...cache);
                clearCache(this.cacheKey)
                this.flush();
            }
        });
    }

    private sendFail(reportList: QueuedReportPayload[]) {
        this.requestFailCount++;
        if (this.requestFailCount >= this.maxRetries) {
            console.warn('[FrontendMonitor] 后台不可用，切换到本地缓存模式');
            this.backendAvailable = false;
            reportList.forEach(item => saveToCache(this.cacheKey, item, this.maxCacheSize));
        } else {
            // 如果是批量模式，失败后重新加入队列
            if (this.uploadMode === 'batch') {
                this.queue.push(...reportList);
                this.timer = window.setTimeout(() => this.flush(), this.batchInterval);
            }
        }
    };

    private sendSuccess() {
        this.queue = [];
        this.requestFailCount = 0; // 重置失败计数
    };

    /**
     * 页面卸载兜底上报
     * 包括：关闭标签页、刷新、跳转、可选隐藏
     */
    private setupUnloadListener() {
        if (!this.serverUrl) {
            return
        }

        // 页面关闭、刷新、跳转
        window.addEventListener('beforeunload', () => {
            if (this.queue.length > 0 && this.serverUrl) {
                navigator.sendBeacon(this.serverUrl, JSON.stringify(this.queue));
                this.queue = [];
            }
        });

        // // 可选：页面隐藏时兜底上报
        // document.addEventListener('visibilitychange', () => {
        //     if (document.visibilityState === 'hidden' && this.queue.length > 0 && this.serverUrl) {
        //         navigator.sendBeacon(this.serverUrl, JSON.stringify(this.queue));
        //         this.queue = [];
        //     }
        // });
    }
}

/**
 * 创建上报项
 * @param type
 * @param payload
 * @param commonData
 * @param hash
 */
function createReportItem<T extends ErrorType>(
    type: T,
    payload: ReportPayload<T>['payload'],
    commonData: Partial<CommonData> | undefined,
    hash: string
): ReportPayload<T> {
    return {
        type,
        payload,
        hash,
        commonData: {
            url: location.href,
            time: Date.now(),
            userAgent: navigator.userAgent,
            ...(commonData || {})
        }
    };
}