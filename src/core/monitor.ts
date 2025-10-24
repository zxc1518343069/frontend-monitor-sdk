import { MonitorPlugin } from './types';
import { Reporter, ReporterOptions } from './reporter';
import { ErrorType, ReportPayload, CommonData, PayloadMap } from './reportTypes';


interface MonitorOptions {
    serverUrl?: string;
    version?: string;
    customReport?: ReporterOptions['customReport'];
    commonData?: Partial<CommonData>
}

type ReportHook = <T extends ErrorType>(type: T, payload: ReportPayload<T>['payload']) => void;

/**
 * 核心类 FrontendMonitor
 * 负责插件管理、API注册、调用 Reporter 上报数据
 */
export class FrontendMonitor {
    private plugins: MonitorPlugin[] = [];
    private apiRegistry: Record<string, Function> = {};
    private reporter: Reporter;
    private commonData: Partial<CommonData> = {};
    private reportHooks: ReportHook[] = [];

    constructor(options: MonitorOptions) {
        this.reporter = new Reporter({
            serverUrl: options.serverUrl,
            customReport: options.customReport,
            offlineCacheKey: 'frontend-monitor-offline-cache'
        });

        if (options.version) {
            this.commonData.version = options.version;
        }
        if (options.commonData) {
            this.commonData = { ...this.commonData, ...options.commonData };
        }
    }

    // 注册钩子
    addReportHook(hook: ReportHook) {
        this.reportHooks.push(hook);
    }

    use(plugin: MonitorPlugin) {
        if (this.plugins.find(p => p.name === plugin.name)) {
            console.warn(`[FrontendMonitor] 插件 ${plugin.name} 已注册，跳过`);
            return;
        }
        this.plugins.push(plugin);
    }

    registerApi(apiName: string, fn: Function) {
        if (this.apiRegistry[apiName]) {
            console.warn(`[FrontendMonitor] API ${apiName} 已存在，跳过注册`);
            return;
        }
        this.apiRegistry[apiName] = fn;
        (this as any)[apiName] = fn;
    }

    removePlugin(apiName: string) {
        if (this.apiRegistry[apiName]) {
            delete (this as any)[apiName];
            delete this.apiRegistry[apiName];
        }
    }

    report<T extends ErrorType>(props: {
        type: T,
        payload: ReportPayload<T>['payload'],
        commonData?: Partial<CommonData>
    }) {
        // 先执行所有钩子
        this.reportHooks.forEach(hook => hook(type, payload));

        const { type, payload, commonData } = props
        this.reporter.add(type, payload, { ...this.commonData, ...commonData });
    }

    /**
     * 初始化方法
     * 启动所有已注册插件
     */
    init() {
        console.log('[FrontendMonitor] 初始化 SDK...');
        this.plugins.forEach(plugin => {
            try {
                plugin.setup(this);
                console.log(`[FrontendMonitor] 插件 ${plugin.name} 已启动`);
            } catch (err) {
                console.error(`[FrontendMonitor] 插件 ${plugin.name} 启动失败`, err);
            }
        });
        console.log('[FrontendMonitor] 所有插件已启动');
    }
}