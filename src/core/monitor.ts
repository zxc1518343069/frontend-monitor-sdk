import { MonitorPlugin } from '../plugins/types';
import { ERROR_MESSAGES } from "./constants";
import { UpdateConfigEnum, UpdateConfigOptions } from "./types";
import { PluginName } from "../plugins/enum";
import { Reporter, ReporterOptions } from './reporter';
import { ErrorType, ReportPayload, CommonData } from './reportTypes';


interface MonitorOptions {
    serverUrl?: string;
    version?: string;
    customReport?: ReporterOptions['customReport'];
    commonData?: Partial<CommonData>
}

type ReportHook = <T extends ErrorType>(type: T, payload: ReportPayload<T>['payload']) => void;

interface ListenerRecord {
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
    options?: boolean | AddEventListenerOptions;
}

type PluginInput = MonitorPlugin | (() => MonitorPlugin);

/**
 * 核心类 FrontendMonitor
 * 负责插件管理、API注册、调用 Reporter 上报数据
 */
export class FrontendMonitor {
    // private plugins: MonitorPlugin[] = [];
    private apiRegistry: Record<string, Function> = {};
    private reporter!: Reporter;
    private commonData: Partial<CommonData> = {};
    private reportHooksMap: Map<string, ReportHook> = new Map<string, ReportHook>();

    private plugins: Map<PluginName, MonitorPlugin> = new Map();

    // 记录每个插件注册的监听器
    private pluginListeners: Map<PluginName, ListenerRecord[]> = new Map();
    // 当前正在 setup 的插件名称
    private currentSetupPlugin: PluginName | null = null;

    private static instance: FrontendMonitor | null = null;

    constructor(options: MonitorOptions) {
        if (FrontendMonitor.instance) {
            console.warn('[FrontendMonitor] 实例已存在，返回现有实例');
            return FrontendMonitor.instance;
        }

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

        FrontendMonitor.instance = this;
    }

    public static getInstance(): FrontendMonitor | null {
        return FrontendMonitor.instance;
    }

    /**
     * 重置单例实例（仅用于测试或特殊场景）
     */
    public static resetInstance() {
        FrontendMonitor.instance = null;
    }

    addEventListener<K extends keyof WindowEventMap>(
        target: Window,
        type: K,
        listener: (this: Window, ev: WindowEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    addEventListener<K extends keyof DocumentEventMap>(
        target: Document,
        type: K,
        listener: (this: Document, ev: DocumentEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    addEventListener<K extends keyof HTMLElementEventMap>(
        target: HTMLElement,
        type: K,
        listener: (this: HTMLElement, ev: HTMLElementEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    addEventListener<K extends keyof XMLHttpRequestEventMap>(
        target: XMLHttpRequest,
        type: K,
        listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    addEventListener(
        target: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void;

    addEventListener(
        target: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions
    ): void {
        // 只有在插件 setup 期间才能注册事件
        if (!this.currentSetupPlugin) {
            console.error('[FrontendMonitor] addEventListener 只能在插件 setup 中调用');
            return;
        }
        const record: ListenerRecord = {
            target,
            type,
            listener: listener as EventListenerOrEventListenerObject,
            options
        };

        if (!this.pluginListeners.has(this.currentSetupPlugin)) {
            this.pluginListeners.set(this.currentSetupPlugin, []);
        }
        this.pluginListeners.get(this.currentSetupPlugin)!.push(record);

        target.addEventListener(type, listener as EventListenerOrEventListenerObject, options);
    }


    /** 更新公共数据 */
    updateCommonData(data: Partial<CommonData>) {
        this.commonData = { ...this.commonData, ...data };
        console.log('[FrontendMonitor] commonData 已更新:', this.commonData);
    }

    updatePluginConfig<T extends UpdateConfigEnum>(
        pluginName: T,
        newConfig: UpdateConfigOptions[T]
    ) {
        // 特殊处理 Reporter 配置更新
        if (pluginName === 'reportOptions') {
            this.reporter.updateConfig(newConfig as Partial<ReporterOptions>);
            console.log(`[FrontendMonitor] Reporter 配置已更新:`, newConfig);
            return;
        }

        // 此时 pluginName 必定是 PluginName 类型，但 TS 无法自动推断排除 'reportOptions'
        // 所以我们需要显式地处理类型
        const name = pluginName as unknown as PluginName;
        const plugin = this.plugins.get(name);
        
        if (!plugin) {
            console.warn(`[FrontendMonitor] 插件 ${String(pluginName)} 未注册`);
            return;
        }

        // 使用双重断言绕过 TS 的重叠检查
        // 我们确信当 pluginName 为 T 时，对应的插件配置类型就是 UpdateConfigOptions[T]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedPlugin = plugin as any;

        if (typeof typedPlugin.updateConfig === 'function') {
            typedPlugin.updateConfig(newConfig);
            console.log(`[FrontendMonitor] 插件 ${String(pluginName)} 配置已更新:`, newConfig);
        } else {
            console.warn(`[FrontendMonitor] 插件 ${String(pluginName)} 未实现 updateConfig 方法，配置更新可能无效`);
        }
    }

    // 注册钩子
    addReportHook(name: string, hook: ReportHook) {
        const tmp = this.reportHooksMap.get(name)
        if (tmp) {
            return console.error(ERROR_MESSAGES.HOOK_EXISTS(name))
        }
        this.reportHooksMap.set(name, hook)
    }

    // 注册钩子
    deleteReportHook(name: string) {
        const tmp = this.reportHooksMap.get(name)
        if (!tmp) {
            return console.error(ERROR_MESSAGES.HOOK_NO_EXISTS(name))
        }
        this.reportHooksMap.delete(name)
    }

    use(plugin: PluginInput | PluginInput[]): this {
        // 统一转换为数组处理
        const pluginList = Array.isArray(plugin) ? plugin : [plugin];

        pluginList.forEach(pluginGn => {
            const pluginInstance = typeof pluginGn === 'function' ? pluginGn() : pluginGn;

            // O(1) 查找
            if (this.plugins.has(pluginInstance.name)) {
                console.warn(`[FrontendMonitor] 插件 ${pluginInstance.name} 已注册，跳过`);
                return;
            }

            // 检查插件依赖
            if (pluginInstance.dependencies) {
                const missingDeps = pluginInstance.dependencies.filter(
                    dep => !this.plugins.has(dep) || !pluginList.find(item => item.name === dep)
                );
                if (missingDeps.length > 0) {
                    console.error(
                        `[FrontendMonitor] 插件 ${pluginInstance.name} 缺少依赖: ${missingDeps.join(', ')}`
                    );
                    return;
                }
            }
            this.plugins.set(pluginInstance.name, pluginInstance);
        });

        return this; // 支持链式调用
    }

    registerApi(apiName: string, fn: Function) {
        if (this.apiRegistry[apiName]) {
            console.warn(`[FrontendMonitor] API ${apiName} 已存在，跳过注册`);
            return;
        }
        this.apiRegistry[apiName] = fn;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this as any)[apiName] = fn;
    }

    removeApi(apiName: string) {
        if (this.apiRegistry[apiName]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (this as any)[apiName];
            delete this.apiRegistry[apiName];
        }
    }

    removePluginListeners(pluginName: PluginName): void {
        const records = this.pluginListeners.get(pluginName);
        if (!records) return;

        records.forEach(({ target, type, listener, options }) => {
            target.removeEventListener(type, listener, options);
        });

        this.pluginListeners.delete(pluginName);
    }


    report<T extends ErrorType>(props: {
        type: T,
        payload: ReportPayload<T>['payload'],
        commonData?: Partial<CommonData>
    }) {
        const { type, payload, commonData } = props;
        console.log('[FrontendMonitor] report called:', type, payload);
        // 先执行所有钩子
        this.reportHooksMap.forEach(hook => hook(type, payload));
        this.reporter.add(type, payload, { ...this.commonData, ...commonData });
    }

    /**
     * 初始化方法
     * 启动所有已注册插件
     */
    init() {
        console.log('[FrontendMonitor] 初始化 SDK...');
        this.plugins.forEach((plugin, name) => {
            try {
                this.currentSetupPlugin = name;
                plugin.setup(this);
                this.currentSetupPlugin = null;
                console.log(`[FrontendMonitor] 插件 ${name} 已启动`);
            } catch (err) {
                this.currentSetupPlugin = null;
                console.error(`[FrontendMonitor] 插件 ${name} 启动失败`, err);
            }
        });
    }

    destroy(): void {
        this.plugins.forEach((plugin, name) => {
            plugin?.destroy?.(this);
            this.removePluginListeners(name);
        });

        this.plugins.clear();
        this.pluginListeners.clear();
        this.reportHooksMap.clear();
    }
}