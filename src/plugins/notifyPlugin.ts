import { FrontendMonitor } from "src/core/monitor";
import { createReportItem } from "src/core/reporter";
import { ErrorType, ReportPayload } from "src/core/reportTypes";
import { MonitorPlugin } from "src/core/types";

/**
 * NotifyPlugin 配置项
 */
export interface NotifyPluginOptions {
    /** 通知发送的目标 URL */
    notifyUrl?: string;
    /** 需要通知的错误类型列表（为空则通知所有类型） */
    notifyTypes?: ErrorType[];
    /** 性能指标通知的阈值（仅在 type 为 PERFORMANCE_METRICS 时生效） */
    threshold?: number;
    /** 自定义通知处理函数（优先于 notifyUrl） */
    customNotify?: <T extends ErrorType>(payload: ReportPayload<T>) => void;
}

/**
 * 通知插件
 * 用于在监控系统捕获到指定类型的错误或性能数据时，发送通知到指定 URL 或执行自定义处理
 */
const notifyPlugin = (options?: NotifyPluginOptions): MonitorPlugin => {
    return {
        name: "notifyPlugin",

        setup(monitor: FrontendMonitor) {
            // 注册报告钩子，当监控系统上报数据时触发
            monitor.addReportHook((type, payload) => {
                // 如果配置了 notifyTypes 且当前 type 不在列表中，则直接忽略
                if (options?.notifyTypes && !options.notifyTypes.includes(type)) return;

                // 构造通知数据
                const notifyData = createReportItem(type, payload, {}, 'notifyData')

                // 如果是性能指标类型，并且设置了阈值，则低于阈值时不通知
                if (type === ErrorType.PERFORMANCE_METRICS && options?.threshold) {
                    const count = (payload as { count?: number })?.count ?? 1;
                    if (count < options.threshold) return;
                }

                // 优先使用自定义通知函数
                if (options?.customNotify) {
                    options.customNotify(notifyData);
                    return;
                }

                // 如果没有自定义函数但配置了 notifyUrl，则发送 HTTP POST 请求
                if (options?.notifyUrl) {
                    fetch(options.notifyUrl, {
                        method: "POST",
                        body: JSON.stringify(notifyData),
                        headers: { "Content-Type": "application/json" }
                    }).catch(err => {
                        console.error("[NotifyPlugin] 通知发送失败", err);
                    });
                }
            });
        }
    };
};

export default notifyPlugin;