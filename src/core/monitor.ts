import { MonitorPlugin } from './types';
import { Reporter } from './reporter';
import { ErrorType, ReportPayload } from './reportTypes';

/**
 * 核心类 FrontendMonitor
 * 负责插件管理、API注册、调用 Reporter 上报数据
 */
export class FrontendMonitor {
    private plugins: MonitorPlugin[] = [];
    private apiRegistry: Record<string, Function> = {};
    private reporter: Reporter;

    constructor(options: { serverUrl?: string; version?: string; customReport?: (batch: ReportPayload[]) => void }) {
        this.reporter = new Reporter({
            serverUrl: options.serverUrl,
            customReport: options.customReport,
            batchInterval: 5000,
            offlineCacheKey: 'frontend-monitor-offline-cache'
        });
    }

    use(plugin: MonitorPlugin) {
        if (this.plugins.find(p => p.name === plugin.name)) {
            console.warn(`[FrontendMonitor] 插件 ${plugin.name} 已注册，跳过`);
            return;
        }
        this.plugins.push(plugin);
        plugin.setup(this);
    }

    registerApi(apiName: string, fn: Function) {
        if (this.apiRegistry[apiName]) {
            console.warn(`[FrontendMonitor] API ${apiName} 已存在，跳过注册`);
            return;
        }
        this.apiRegistry[apiName] = fn;
        (this as any)[apiName] = fn;
    }

    unregisterApi(apiName: string) {
        if (this.apiRegistry[apiName]) {
            delete (this as any)[apiName];
            delete this.apiRegistry[apiName];
        }
    }

    /**
     * 上报方法
     */
    report<T extends ErrorType>(type: T, payload: ReportPayload<T>['payload'], commonData?: any) {
        this.reporter.add(type, payload, commonData);
    }
}