import { FrontendMonitor } from "src/core/monitor";
import { PluginName, PluginOptionsMap } from "src/plugins/enum";

/**
 * 插件接口定义
 * 所有插件必须实现 name 和 setup 方法
 * destroy 方法可选，用于插件卸载时清理资源
 */
export interface MonitorPlugin<T extends PluginName = PluginName> {
    name: T;
    setup: (monitor: FrontendMonitor) => void;
    dependencies?: T[]
    destroy?: (monitor: FrontendMonitor) => void;
    updateConfig?: (options: PluginOptionsMap[T]) => void
}