import { MonitorPlugin, MonitorOptions } from './types';

/**
 * 前端监控核心类
 * 支持插件注册、初始化、错误上报
 */
export class FrontendMonitor {
    private serverUrl?: string;
    private whiteScreenDelay: number;
    private version?: string;
    private plugins: MonitorPlugin[] = [];
    private options: MonitorOptions;

    constructor(options: MonitorOptions) {
        if (!options.serverUrl && !options.customReport) {
            throw new Error('请传入 serverUrl 或 customReport 作为错误上报方式');
        }
        this.serverUrl = options.serverUrl;
        this.whiteScreenDelay = options.whiteScreenDelay || 3000;
        this.version = options.version;
        this.options = options;
    }

    /**
     * 注册插件
     * @param plugin 插件对象
     */
    use(plugin: MonitorPlugin) {
        this.plugins.push(plugin);
        plugin.setup(this);
    }

    /**
     * 初始化核心功能（根据配置选择插件）
     */
    init() {
        if (this.options.enableJsError) {
            this.use(require('../plugins/jsError').default);
        }
        if (this.options.enablePromiseError) {
            this.use(require('../plugins/promiseError').default);
        }
        if (this.options.enableResourceError) {
            this.use(require('../plugins/resourceError').default);
        }
        if (this.options.enableWhiteScreen) {
            this.use(require('../plugins/whiteScreen').default);
        }
        console.log('[FrontendMonitor] SDK 初始化完成');
    }

    /**
     * 上报方法
     * @param data 错误或监控数据
     */
    report(data: Record<string, any>) {
        const payload = {
            ...data,
            url: location.href,
            userAgent: navigator.userAgent,
            time: Date.now(),
            version: this.version
        };

        // 如果用户提供了自定义上报函数，则调用它
        if (this.options.customReport) {
            try {
                this.options.customReport(payload);
            } catch (err) {
                console.error('[FrontendMonitor] 自定义上报函数执行失败', err);
            }
            return;
        }

        // 默认上报逻辑
        if (this.serverUrl) {
            if (navigator.sendBeacon) {
                navigator.sendBeacon(this.serverUrl, JSON.stringify(payload));
            } else {
                fetch(this.serverUrl, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: { 'Content-Type': 'application/json' }
                }).catch(err => {
                    console.error('[FrontendMonitor] 上报失败', err);
                });
            }
        }
    }
}