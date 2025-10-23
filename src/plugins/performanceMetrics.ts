import { MonitorPlugin } from '../core/types';

/**
 * 性能指标插件
 * 采集 FCP（首次内容绘制）、LCP（最大内容绘制）、CLS（累计布局偏移）
 */
const performanceMetricsPlugin: MonitorPlugin = {
    name: 'performanceMetrics',
    setup(monitor) {
        if (!('PerformanceObserver' in window)) {
            console.warn('[FrontendMonitor] 当前浏览器不支持 PerformanceObserver');
            return;
        }

        // FCP
        try {
            const fcpObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        monitor.report({
                            type: 'performanceMetrics',
                            metric: 'FCP',
                            value: entry.startTime
                        });
                    }
                });
            });
            fcpObserver.observe({ type: 'paint', buffered: true });
            (this as any)._fcpObserver = fcpObserver;
        } catch {}

        // LCP
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    monitor.report({
                        type: 'performanceMetrics',
                        metric: 'LCP',
                        value: entry.startTime
                    });
                });
            });
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            (this as any)._lcpObserver = lcpObserver;
        } catch {}

        // CLS
        try {
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry: any) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        monitor.report({
                            type: 'performanceMetrics',
                            metric: 'CLS',
                            value: clsValue
                        });
                    }
                });
            });
            clsObserver.observe({ type: 'layout-shift', buffered: true });
            (this as any)._clsObserver = clsObserver;
        } catch {}
    },
    destroy() {
        if ((this as any)._fcpObserver) (this as any)._fcpObserver.disconnect();
        if ((this as any)._lcpObserver) (this as any)._lcpObserver.disconnect();
        if ((this as any)._clsObserver) (this as any)._clsObserver.disconnect();
    }
};

export default performanceMetricsPlugin;