import { ReportPayload, ErrorType, CommonData } from './reportTypes';

type QueuedReportPayload<T extends ErrorType = ErrorType> = ReportPayload<T> & { hash: string };


interface ReporterOptions {
    serverUrl?: string;
    customReport?: (batch: ReportPayload[]) => void;
    /**
     * @description 上报间隔
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
}

/**
 * Reporter 类
 * 负责批量上报、去重、离线缓存、自定义上报
 */
export class Reporter {
    private queue: QueuedReportPayload[] = [];
    private timer: number | null = null;
    private serverUrl?: string;
    private customReport?: (batch: ReportPayload[]) => void;
    private batchInterval: number;
    private maxRetries: number;
    private cacheKey: string;

    private maxCacheSize: number;
    private requestFailCount: number = 0;
    private backendAvailable: boolean = true;


    constructor(options: ReporterOptions) {
        this.serverUrl = options.serverUrl;
        this.customReport = options.customReport;
        this.batchInterval = options.batchInterval || 1000;
        this.cacheKey = options.offlineCacheKey || 'frontend-monitor-offline-cache';
        this.setupOfflineFlush();
        this.maxRetries = options.maxRetries || 3;
        this.maxCacheSize = options.maxCacheSize || 100;
        this.setupOfflineFlush();
    }

    /**
     * 添加数据到队列
     * @param type 错误类型
     * @param payload 插件专属数据
     * @param commonData 公共信息（可选，用户可扩展）
     */
    add<T extends ErrorType>(type: T, payload: ReportPayload<T>['payload'], commonData?: Partial<CommonData>) {
        const baseCommonData: CommonData = {
            url: location.href,
            userAgent: navigator.userAgent,
            time: Date.now(),
            ...commonData
        };

        const reportItem: QueuedReportPayload<T> = {
            type,
            commonData: baseCommonData,
            payload,
            hash: safeBtoa(`${type}-${JSON.stringify(payload)}`)
        };

        if (this.queue.some(item => item.hash === reportItem.hash)) return;

        // 如果后台不可用，直接存到本地缓存
        if (!this.backendAvailable || !navigator.onLine) {
            this.saveToCache(reportItem);
            return;
        }

        this.queue.push(reportItem);

        if (!this.timer) {
            this.timer = window.setTimeout(() => this.flush(), this.batchInterval);
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
        this.timer = null;


        if (this.customReport) {
            try {
                this.customReport(batch);
                this.sendSuccess()
            } catch (err) {
                console.error('[FrontendMonitor] 自定义上报失败', err);
                this.sendFail(batch);
            }
            return;
        }

        if (this.serverUrl) {
            try {
                if (navigator.sendBeacon) {
                    const ok = navigator.sendBeacon(this.serverUrl, JSON.stringify(batch));
                    console.log(ok);
                    ok ? this.sendSuccess() : this.sendFail(batch);
                    return
                }
                const res = await fetch(this.serverUrl, {
                    method: 'POST',
                    body: JSON.stringify(batch),
                    headers: {'Content-Type': 'application/json'}
                });
                this.sendSuccess()
            } catch (err) {
                console.error(err);
                this.sendFail(batch);
            }

        }
    }

    /**
     * 网络恢复时上报离线缓存
     */
    private setupOfflineFlush() {
        window.addEventListener('online', () => {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
            if (cache.length > 0) {
                this.queue.push(...cache);
                localStorage.removeItem(this.cacheKey);
                this.flush();
            }
        });
    }

    private saveToCache(item: QueuedReportPayload) {
        let cache: QueuedReportPayload[] = JSON.parse(localStorage.getItem(this.cacheKey) || '[]');
        cache.push(item);
        // 如果超过最大缓存数量 → 删除最早的数据
        if (cache.length > this.maxCacheSize) {
            cache = cache.slice(cache.length - this.maxCacheSize);
        }
        localStorage.setItem(this.cacheKey, JSON.stringify(cache));
    }

    private sendFail(reportList: QueuedReportPayload[]) {
        this.requestFailCount++;
        // 如果连续失败次数达到上限 → 判定后台失效
        if (this.requestFailCount >= this.maxRetries) {
            console.warn('[FrontendMonitor] 后台服务器不可用，切换到本地缓存模式');
            this.backendAvailable = false;
            // 将队列中的数据存到本地缓存
            reportList.forEach(item => this.saveToCache(item));
            this.queue = [];
        } else {
            // 失败但未达到上限 → 保留队列，稍后重试
            this.queue = [...reportList, ...this.queue];
            this.timer = window.setTimeout(() => this.flush(), this.batchInterval);
        }
    };

    private sendSuccess() {
        this.queue = [];
        this.requestFailCount = 0; // 重置失败计数
    };


}

function safeBtoa(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
}