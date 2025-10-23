import { MonitorPlugin } from '../core/types';
import { ErrorType, JsErrorPayload } from '../core/reportTypes';

/**
 * JS运行时错误插件
 */
const jsErrorPlugin: MonitorPlugin = {
    name: 'jsError',
    setup(monitor) {
        window.onerror = (message, source, lineno, colno, error) => {
            const payload: JsErrorPayload = {
                message: String(message),
                source,
                lineno,
                colno,
                stack: error?.stack
            };
            monitor.report(ErrorType.JS_ERROR, payload);
        };
    },
    destroy() {
        window.onerror = null;
    }
};

export default jsErrorPlugin;