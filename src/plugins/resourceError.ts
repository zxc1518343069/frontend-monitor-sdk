import { ErrorType } from "src/core/reportTypes";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";

/**
 * 资源加载错误监控插件
 * 使用 window.addEventListener('error', true) 捕获资源加载失败
 */
const resourceErrorPlugin: MonitorPlugin = {
    name: PluginName.RESOURCE_ERROR,
    setup(monitor) {
        const handler = (event: Event) => {
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
        window.addEventListener('error', handler, true);

        (this as any)._handler = handler;
    },
    destroy() {
        if ((this as any)._handler) {
            window.removeEventListener('error', (this as any)._handler, true);
        }
    }
};

export default resourceErrorPlugin;