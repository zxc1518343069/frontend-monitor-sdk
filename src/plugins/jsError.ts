import { MonitorPlugin } from '../core/types';
import { ErrorType } from '../core/reportTypes';


/**
 * 各错误类型的 payload 类型定义
 */
export interface JsErrorPayload {
    message: string;
    source?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
}


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
            monitor.report({ type: ErrorType.JS_ERROR, payload });
        };
    },
    destroy() {
        window.onerror = null;
    }
};

export default jsErrorPlugin;