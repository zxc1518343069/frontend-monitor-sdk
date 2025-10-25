import { ErrorType } from "src/core/reportTypes";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";

/**
 * 资源性能监控插件
 * 使用 PerformanceObserver 采集资源加载时间、大小等信息
 */
const resourcePerformancePlugin: MonitorPlugin = {
    name: PluginName.RESOURCE_PERFORMANCE,
    setup(monitor) {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        monitor.report({
                            type: ErrorType.RESOURCE_PERFORMANCE,
                            payload: {
                                name: entry.name,
                                initiatorType: (entry as PerformanceResourceTiming).initiatorType,
                                duration: entry.duration,
                                transferSize: (entry as PerformanceResourceTiming).transferSize
                            }
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