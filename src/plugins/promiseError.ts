import { MonitorPlugin } from '../core/types';
import { ErrorType } from '../core/reportTypes';


export interface PromiseErrorPayload {
    message: string;
    stack?: string;
}

/**
 * Promise未捕获异常插件
 */
const promiseErrorPlugin: MonitorPlugin = {
    name: 'promiseError',
    setup(monitor) {
        const handler = (event: PromiseRejectionEvent) => {
            const payload: PromiseErrorPayload = {
                message: event.reason?.message || String(event.reason),
                stack: event.reason?.stack
            };
            monitor.report(ErrorType.PROMISE_ERROR, payload);
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