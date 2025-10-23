import { MonitorPlugin } from '../core/types';

/**
 * 资源性能监控插件
 * 使用 PerformanceObserver 采集资源加载时间、大小等信息
 */
const resourcePerformancePlugin: MonitorPlugin = {
    name: 'resourcePerformance',
    setup(monitor) {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        monitor.report({
                            type: 'resourcePerformance',
                            name: entry.name,
                            initiatorType: (entry as PerformanceResourceTiming).initiatorType,
                            duration: entry.duration,
                            transferSize: (entry as PerformanceResourceTiming).transferSize
                        });
                    }
                });
            });
            observer.observe({ entryTypes: ['resource'] });

            (this as any)._observer = observer;
        }
    },
    destroy() {
        if ((this as any)._observer) {
            (this as any)._observer.disconnect();
        }
    }
};

export default resourcePerformancePlugin;