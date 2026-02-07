import { ErrorType } from "src/core/reportTypes";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";

export interface WhiteScreenOptions {
    /** 检测容器，默认为 body */
    rootSelector?: string;
    /** 白屏检测的采样点列表，默认使用十字交叉法 */
    samplePoints?: { x: number; y: number }[];
    /** 忽略的元素选择器列表（这些元素被视为容器，不计为有效内容） */
    ignoreSelectors?: string[];
    /** 首次检测延迟 (ms)，默认 3000 */
    firstCheckDelay?: number;
    /** 轮询检测次数，默认 3 次 */
    loopCount?: number;
    /** 轮询间隔 (ms)，默认 1000 */
    loopInterval?: number;
}

/**
 * 白屏检测插件
 * 采用 elementsFromPoint 采样法检测页面是否白屏
 */
const whiteScreenPlugin = (options?: WhiteScreenOptions): MonitorPlugin => {
    let timer: NodeJS.Timeout | null = null;
    let loopTimer: NodeJS.Timeout | null = null;
    let currentLoop = 0;

    // 默认配置
    const rootSelector = options?.rootSelector || 'body';
    const ignoreSelectors = options?.ignoreSelectors || ['html', 'body', '#app', '#root'];
    const firstCheckDelay = options?.firstCheckDelay ?? 3000;
    const loopCount = options?.loopCount ?? 3;
    const loopInterval = options?.loopInterval ?? 1000;

    /**
     * 判断元素是否为容器（无效内容）
     */
    const isContainer = (el: Element): boolean => {
        const selector = el.id ? `#${el.id}` : el.tagName.toLowerCase();
        if (ignoreSelectors.includes(selector)) return true;
        if (ignoreSelectors.some(s => el.matches(s))) return true;
        return false;
    };

    /**
     * 生成采样点（默认十字交叉法）
     */
    const getSamplePoints = () => {
        if (options?.samplePoints) return options.samplePoints;
        const { innerWidth, innerHeight } = window;
        const points = [];
        // 垂直中线
        for (let i = 1; i <= 9; i++) {
            points.push({ x: innerWidth / 2, y: (innerHeight * i) / 10 });
        }
        // 水平中线
        for (let i = 1; i <= 9; i++) {
            points.push({ x: (innerWidth * i) / 10, y: innerHeight / 2 });
        }
        return points;
    };

    return {
        name: PluginName.WHITE_SCREEN,
        setup(monitor) {
            const checkWhiteScreen = () => {
                const points = getSamplePoints();
                let emptyPoints = 0;

                points.forEach(({ x, y }) => {
                    const elements = document.elementsFromPoint(x, y);
                    const topEl = elements[0]; // 获取最上层元素

                    if (!topEl) {
                        emptyPoints++; // 没有任何元素
                    } else if (isContainer(topEl)) {
                        emptyPoints++; // 是容器元素
                    }
                });

                // 如果所有采样点都是空的，判定为白屏
                if (emptyPoints === points.length) {
                    if (currentLoop < loopCount) {
                        currentLoop++;
                        loopTimer = setTimeout(checkWhiteScreen, loopInterval);
                    } else {
                        monitor.report({
                            type: ErrorType.WHITE_SCREEN,
                            payload: {
                                message: '页面白屏',
                                emptyPoints,
                                totalPoints: points.length
                            }
                        });
                        // 停止检测
                        if (loopTimer) clearTimeout(loopTimer);
                    }
                } else {
                    // 只要有一次检测通过，就认为页面正常，停止后续检测
                    if (loopTimer) clearTimeout(loopTimer);
                }
            };

            // 页面加载完成后延迟检测
            if (document.readyState === 'complete') {
                timer = setTimeout(checkWhiteScreen, firstCheckDelay);
            } else {
                monitor.addEventListener(window, 'load', () => {
                    timer = setTimeout(checkWhiteScreen, firstCheckDelay);
                });
            }
        },
        destroy() {
            if (timer) clearTimeout(timer);
            if (loopTimer) clearTimeout(loopTimer);
        }
    };
}

export default whiteScreenPlugin;