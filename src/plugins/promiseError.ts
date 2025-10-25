import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";
import { warnIfNotSupported } from "src/utils/browser";
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
            if (!warnIfNotSupported('PerformanceObserver')) {
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
            monitor.addEventListener(window, 'unhandledrejection', handler)
        },
        destroy() {
            if (handler) {
                handler = null;
            }
        }
    };
}

export default promiseErrorPlugin;