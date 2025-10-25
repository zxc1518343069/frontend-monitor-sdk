import { ErrorType } from "src/core/reportTypes";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";

/**
 * 白屏检测插件
 * 延迟一定时间后检测页面是否有有效内容
 */
const whiteScreenPlugin: MonitorPlugin = {
    name: PluginName.WHITE_SCREEN,
    setup(monitor) {
        const delay = 3000; // 默认延迟3秒检测
        const handler = () => {
            const tags = ['IMG', 'CANVAS', 'SVG', 'VIDEO', 'P', 'SPAN', 'DIV'];
            const hasContent = tags.some(tag => document.querySelector(tag));
            if (!hasContent) {
                monitor.report({
                    type: ErrorType.WHITE_SCREEN,
                    payload: {
                        message: '页面可能出现白屏'
                    }
                });
            }
        };
        setTimeout(handler, delay);
    }
};

export default whiteScreenPlugin;