import { ErrorType } from "src/core/reportTypes";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";

/**
 * 性能指标插件
 * 采集 FCP（首次内容绘制）、LCP（最大内容绘制）、CLS（累计布局偏移）
 */
const performanceMetricsPlugin = (): MonitorPlugin => {

    let fcpObserver: PerformanceObserver | null
    let lcpObserver: PerformanceObserver | null
    let clsObserver: PerformanceObserver | null

    return {
        name: PluginName.PERFORMANCE_METRICS,
        setup(monitor) {
            if (!('PerformanceObserver' in window)) {
                console.warn('[FrontendMonitor] 当前浏览器不支持 PerformanceObserver');
                return;
            }

            // FCP
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
                        }
                    });
                });
                fcpObserver.observe({ type: 'paint', buffered: true });
            } catch {
            }

            // LCP
            try {
                lcpObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        monitor.report({
                            type: ErrorType.PERFORMANCE_METRICS,
                            payload: {
                                metric: 'LCP',
                                value: entry.startTime
                            }
                        });
                    });
                });
                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
                (this as any)._lcpObserver = lcpObserver;
            } catch {
            }

            // CLS
            try {
                let clsValue = 0;
                clsObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry: any) => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            monitor.report({
                                type: ErrorType.PERFORMANCE_METRICS,
                                payload: {
                                    metric: 'CLS',
                                    value: clsValue
                                }
                            });
                        }
                    });
                });
                clsObserver.observe({ type: 'layout-shift', buffered: true });
            } catch {
            }
        },
        destroy() {
            if (fcpObserver) fcpObserver.disconnect();
            if (lcpObserver) lcpObserver.disconnect();
            if (clsObserver) clsObserver.disconnect();
        }
    };
}

export default performanceMetricsPlugin;