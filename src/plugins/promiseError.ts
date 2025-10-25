import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";
import { ErrorType } from '../core/reportTypes';


export interface PromiseErrorPayload {
    message: string;
    stack?: string;
}

/**
 * Promise未捕获异常插件
 */
const promiseErrorPlugin = (): MonitorPlugin => {
    let handler: ((event: PromiseRejectionEvent) => void) | null = null;


    return {
        name: PluginName.PROMISE_ERROR,
        setup(monitor) {
            if (!('PerformanceObserver' in window)) {
                console.warn('[FrontendMonitor] 当前浏览器不支持 PerformanceObserver');
                return;
            }
            handler = (event: PromiseRejectionEvent) => {
                const payload: PromiseErrorPayload = {
                    message: event.reason?.message || String(event.reason),
                    stack: event.reason?.stack
                };
                monitor.report({
                    type: ErrorType.PROMISE_ERROR, payload
                });
            };
            window.addEventListener('unhandledrejection', handler);
            (this as any)._handler = handler;
        },
        destroy() {
            if (handler) {
                window.removeEventListener('unhandledrejection', handler);
                handler = null;
            }
        }
    };
}

export default promiseErrorPlugin;