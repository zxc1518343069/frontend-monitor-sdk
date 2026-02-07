import { ErrorType } from "../core/reportTypes";
import { MonitorPlugin } from './types';
import { PluginName } from "./enum";
import { warnIfNotSupported } from "../utils/browser";
import { DEFAULT_CONFIG } from "../core/constants";

/**
 * 性能指标插件
 * 采集 FCP（首次内容绘制）、LCP（最大内容绘制）、CLS（累计布局偏移）
 */
const performanceMetricsPlugin = (): MonitorPlugin => {

    let fcpObserver: PerformanceObserver | null
    let lcpObserver: PerformanceObserver | null
    let clsObserver: PerformanceObserver | null
    let clsReportTimer: number | null = null;

    return {
        name: PluginName.PERFORMANCE_METRICS,
        setup(monitor) {
            if (!warnIfNotSupported('PerformanceObserver')) {
                return;
            }
            // FCP - 只上报一次
            try {
                fcpObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.name === 'first-contentful-paint') {
                            monitor.report({
                                type: ErrorType.PERFORMANCE_METRICS,
                                payload: {
                                    metric: 'FCP',
                                    value: entry.startTime
                                }
                            });
                            // FCP 只需要上报一次
                            fcpObserver?.disconnect();
                        }
                    });
                });
                fcpObserver.observe({ type: 'paint', buffered: true });
            } catch (error) {
                console.error('[PerformanceMetrics] FCP 监控初始化失败', error);
            }

            // LCP - 只上报最终值
            try {
                let lastLcpValue = 0;
                lcpObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        lastLcpValue = entry.startTime;
                    });
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

                // 在页面即将卸载时上报最终的 LCP 值
                monitor.addEventListener(window, 'beforeunload', () => {
                    if (lastLcpValue > 0) {
                        monitor.report({
                            type: ErrorType.PERFORMANCE_METRICS,
                            payload: {
                                metric: 'LCP',
                                value: lastLcpValue
                            }
                        });
                    }
                });

                // 或在页面隐藏时上报
                monitor.addEventListener(document, 'visibilitychange', () => {
                    if (document.visibilityState === 'hidden' && lastLcpValue > 0) {
                        monitor.report({
                            type: ErrorType.PERFORMANCE_METRICS,
                            payload: {
                                metric: 'LCP',
                                value: lastLcpValue
                            }
                        });
                        lastLcpValue = 0; // 避免重复上报
                    }
                });
            } catch (error) {
                console.error('[PerformanceMetrics] LCP 监控初始化失败', error);
            }

            // CLS - 防抖上报，避免频繁上报
            try {
                let clsValue = 0;
                clsObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry: any) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;

                            // 使用防抖，合并上报
                            if (clsReportTimer) {
                                clearTimeout(clsReportTimer);
                            }

                            clsReportTimer = window.setTimeout(() => {
                                monitor.report({
                                    type: ErrorType.PERFORMANCE_METRICS,
                                    payload: {
                                        metric: 'CLS',
                                        value: clsValue
                                    }
                                });
                                clsReportTimer = null;
                            }, DEFAULT_CONFIG.CLS_DEBOUNCE_TIME);
                        }
                    });
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });

                // 页面卸载时上报最终的 CLS 值
                monitor.addEventListener(window, 'beforeunload', () => {
                    if (clsReportTimer) {
                        clearTimeout(clsReportTimer);
                    }
                    if (clsValue > 0) {
                        monitor.report({
                            type: ErrorType.PERFORMANCE_METRICS,
                            payload: {
                                metric: 'CLS',
                                value: clsValue
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('[PerformanceMetrics] CLS 监控初始化失败', error);
            }
        },
        destroy() {
            if (fcpObserver) fcpObserver.disconnect();
            if (lcpObserver) lcpObserver.disconnect();
            if (clsObserver) clsObserver.disconnect();
            if (clsReportTimer) {
                clearTimeout(clsReportTimer);
                clsReportTimer = null;
            }
        }
    };
}

export default performanceMetricsPlugin;
