import { ReportPayload, ErrorType, CommonData } from './reportTypes';

type QueuedReportPayload<T extends ErrorType = ErrorType> = ReportPayload<T> & { hash: string };

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
    private cacheKey: string;

    constructor(options: {
        serverUrl?: string;
        customReport?: (batch: ReportPayload[]) => void;
        batchInterval?: number;
        offlineCacheKey?: string;
    }) {
        this.serverUrl = options.serverUrl;
        this.customReport = options.customReport;
        this.batchInterval = options.batchInterval || 5000;
        this.cacheKey = options.offlineCacheKey || 'frontend-monitor-offline-cache';
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

        const reportItem: ReportPayload<T> = {
            type,
            commonData: baseCommonData,
            payload
        };

        const hash = btoa(`${type}-${JSON.stringify(payload)}`);
        if (this.queue.some(item => item.hash === hash)) return;

        const reportItemWithHash: QueuedReportPayload<T> = {
            ...reportItem,
            hash
        };

        this.queue.push(reportItemWithHash);

        if (!this.timer) {
            this.timer = window.setTimeout(() => this.flush(), this.batchInterval);
        }
    }

    /**
     * 批量上报
     */
    flush() {
        if (this.queue.length === 0) {
            this.timer = null;
            return;
        }
        const batch = [...this.queue];
        this.queue = [];
        this.timer = null;

        if (this.customReport) {
            this.customReport(batch);
            return;
        }

        if (this.serverUrl) {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(this.serverUrl, JSON.stringify(batch));
            } else {
                fetch(this.serverUrl, {
                    method: 'POST',
                    body: JSON.stringify(batch),
                    headers: { 'Content-Type': 'application/json' }
                });
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
}