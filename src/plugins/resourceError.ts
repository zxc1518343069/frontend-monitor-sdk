import { ErrorType } from "src/core/reportTypes";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";

/**
 * 资源加载错误监控插件
 * 使用 window.addEventListener('error', true) 捕获资源加载失败
 */
const resourceErrorPlugin = (): MonitorPlugin => {
    let handler: ((event: Event) => void) | null = null;
    return {
        name: PluginName.RESOURCE_ERROR,
        setup(monitor) {
            handler = (event: Event) => {
                const target = event.target as HTMLElement;
                if (target && (target as any).src) {
                    monitor.report({
                        type: ErrorType.RESOURCE_ERROR,
                        payload: {
                            tagName: target.tagName,
                            src: (target as any).src || (target as any).href
                        }
                    });
                }
            };
            monitor.addEventListener(window, 'error', handler, true)
        },
        destroy() {
            if (handler) {
                handler = null
            }
        }
    };
}

export default resourceErrorPlugin;