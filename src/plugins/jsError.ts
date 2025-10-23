import { MonitorPlugin } from '../core/types';

/**
 * JS 运行时错误插件
 * 使用 window.onerror 捕获同步运行时错误
 */
const jsErrorPlugin: MonitorPlugin = {
    name: 'jsError',
    setup(monitor) {
        window.onerror = (msg, src, line, col, err) => {
            monitor.report({
                type: 'jsError',
                message: msg,
                source: src,
                lineno: line,
                colno: col,
                stack: err?.stack
            });
        };
    }
};

export default jsErrorPlugin;