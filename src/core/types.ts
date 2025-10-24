import { FrontendMonitor } from "src/core/monitor";

/**
 * 插件接口定义
 * 所有插件必须实现 name 和 setup 方法
 * destroy 方法可选，用于插件卸载时清理资源
 */
export interface MonitorPlugin {
    name: string;
    setup: (monitor: FrontendMonitor) => void;
    destroy?: () => void;
}