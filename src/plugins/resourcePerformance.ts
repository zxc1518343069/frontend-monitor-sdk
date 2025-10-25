import { ErrorType } from "src/core/reportTypes";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";
import { warnIfNotSupported } from "src/utils/browser";

/**
 * 资源性能监控插件
 * 使用 PerformanceObserver 采集资源加载时间、大小等信息
 */
const resourcePerformancePlugin = (): MonitorPlugin => {
    let observer: PerformanceObserver | null = null

    return {
        name: PluginName.RESOURCE_PERFORMANCE,
        setup(monitor) {
            if (!warnIfNotSupported('PerformanceObserver')) {
                return;
            }
            observer = new PerformanceObserver((list) => {
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
        },
        destroy() {
            if (observer) {
                observer.disconnect();
                observer = null
            }
        }
    };
}

export default resourcePerformancePlugin;