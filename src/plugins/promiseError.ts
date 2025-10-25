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
const promiseErrorPlugin: MonitorPlugin = {
    name: PluginName.PROMISE_ERROR,
    setup(monitor) {
        const handler = (event: PromiseRejectionEvent) => {
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
        if ((this as any)._handler) {
            window.removeEventListener('unhandledrejection', (this as any)._handler);
        }
    }
};

export default promiseErrorPlugin;