import { FrontendMonitor } from "src/core/monitor";
import { createReportItem } from "src/core/reporter";
import { ErrorType, ReportPayload } from "src/core/reportTypes";
import { PluginName } from "src/plugins/enum";
import { MonitorPlugin } from "src/plugins/types";

/**
 * 通知规则配置
 */
export interface NotifyRule {
    /** 错误类型 */
    type: ErrorType;
    /**
     * 错误聚合次数阈值（可选）
     * 当开启 Reporter 的 errorAggregation 时，只有当同一错误的 count 达到此阈值才会通知
     * 例如：threshold: 100 表示同一个错误发生100次才通知
     * 不设置则每次都通知
     */
    threshold?: number;
}

/**
 * NotifyPlugin 配置项
 */
export interface NotifyPluginOptions {
    /** 通知发送的目标 URL */
    notifyUrl?: string;
    /**
     * 通知规则列表（推荐使用，更灵活）
     * 每个规则可以针对不同的错误类型设置不同的阈值
     */
    rules?: NotifyRule[];
    /** 自定义通知处理函数（优先于 notifyUrl） */
    customNotify?: <T extends ErrorType>(payload: ReportPayload<T>) => void;
}

/**
 * 通知插件
 * 用于在监控系统捕获到指定类型的错误或性能数据时，发送通知到指定 URL 或执行自定义处理
 */
const notifyPlugin = (options?: NotifyPluginOptions): MonitorPlugin => {
    // 构建规则映射表：ErrorType -> threshold
    const ruleMap = new Map<ErrorType, number | undefined>();

    // 优先使用新的 rules 配置
    if (options?.rules && options.rules.length > 0) {
        options.rules.forEach(rule => {
            ruleMap.set(rule.type, rule.threshold);
        });
    }

    return {
        name: PluginName.NOTIFY_PLUGIN,
        setup(monitor: FrontendMonitor) {
            // 注册报告钩子，当监控系统上报数据时触发
            monitor.addReportHook((type, payload) => {
                // 如果配置了规则，检查当前类型是否在规则中
                if (ruleMap.size > 0 && !ruleMap.has(type)) {
                    return; // 不在规则中，忽略
                }

                // 获取该类型的阈值配置
                const threshold = ruleMap.get(type);

                // 如果设置了阈值，检查错误聚合次数是否达到阈值
                if (threshold !== undefined) {
                    const count = (payload as { count?: number })?.count ?? 1;
                    // 只有当错误发生次数达到阈值时才通知
                    if (count < threshold) {
                        return;
                    }
                }

                // 构造通知数据
                const notifyData = createReportItem(type, payload, {}, 'notifyData')

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
        },
        destroy(monitor) {
            monitor.deleteReportHook(PluginName.NOTIFY_PLUGIN)
        }
    };
};

export default notifyPlugin;