import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";
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
 *
 * 注意：此插件使用 window.onerror 而不是 monitor.addEventListener
 * 原因：
 * 1. window.onerror 提供更详细的错误信息（source, lineno, colno, error）
 * 2. window.addEventListener('error') 主要用于捕获资源加载错误
 */
const jsErrorPlugin = (): MonitorPlugin => {
    let originalErrorHandler: OnErrorEventHandler | null = null;

    return {
        name: PluginName.JS_ERROR,
        setup(monitor) {
            // 保存原始错误处理器
            originalErrorHandler = window.onerror;

            // 创建新的错误处理器
            const newErrorHandler: OnErrorEventHandler = (
                event: Event | string,
                source?: string,
                lineno?: number,
                colno?: number,
                error?: Error
            ) => {
                // 上报到监控系统
                const payload: JsErrorPayload = {
                    message: typeof event === 'string' ? event : event.type,
                    source,
                    lineno,
                    colno,
                    stack: error?.stack
                };
                monitor.report({ type: ErrorType.JS_ERROR, payload });

                // 调用原始处理器（如果存在）
                if (originalErrorHandler) {
                    return originalErrorHandler.call(window, event, source, lineno, colno, error);
                }
                return false;
            };

            window.onerror = newErrorHandler;
        },
        destroy() {
            // 恢复原始错误处理器
            window.onerror = originalErrorHandler;
            originalErrorHandler = null;
        }
    };
};

export default jsErrorPlugin;