import { ErrorType } from "src/core/reportTypes";
import { PluginName } from "src/plugins/enum";
import { TrackingPluginOptions } from '../core/pluginTypes';
import { MonitorPlugin } from 'plugins/types';
import { getCurrentUrl, matchPattern } from '../core/utils';

/**
 * 埋点插件
 * 自动记录PV（页面浏览）和停留时长
 * 支持URL白名单过滤（静态或动态获取）
 */
const trackingPlugin = (options?: TrackingPluginOptions): MonitorPlugin => {
    let monitoredUrlsCache: string[] | null = null; // 缓存URL列表

    return {
        name: PluginName.TRACKING_PLUGIN,
        setup(monitor) {
            let enterTime = Date.now(); // 页面进入时间
            let currentUrl = getCurrentUrl(); // 当前URL
            let monitoredUrls: string[] | null = null; // 需要监控的URL列表

            /** 检查当前URL是否需要监控 */
            const isMonitored = (url: string) => {
                if (!monitoredUrls || monitoredUrls.length === 0) return true;
                return monitoredUrls.some(pattern => matchPattern(pattern, url));
            };

            /** 初始化URL列表（支持缓存） */
            const initMonitoredUrls = async () => {
                if (monitoredUrlsCache) {
                    monitoredUrls = monitoredUrlsCache;
                    return;
                }
                if (typeof options?.monitoredUrls === 'function') {
                    try {
                        monitoredUrls = await options.monitoredUrls();
                        monitoredUrlsCache = monitoredUrls;
                    } catch (err) {
                        console.error('[FrontendMonitor] 获取监控URL列表失败', err);
                        monitoredUrls = null;
                    }
                } else if (Array.isArray(options?.monitoredUrls)) {
                    monitoredUrls = options?.monitoredUrls;
                    monitoredUrlsCache = monitoredUrls;
                } else {
                    monitoredUrls = null;
                }
            };

            /** 注册API：手动记录PV */
            const trackPageView = (pageName?: string) => {
                const page = pageName || getCurrentUrl();
                if (!isMonitored(page)) return;
                monitor.report({
                    type: ErrorType.TRACKING_PV,
                    payload: { page }
                });
            };

            /** 注册API：手动记录停留时长 */
            const trackStayTime = (pageName?: string, duration?: number) => {
                const page = pageName || getCurrentUrl();
                if (!isMonitored(page)) return;
                monitor.report({
                    type: ErrorType.TRACKING_STAY,
                    payload: {
                        page,
                        duration: duration || (Date.now() - enterTime),
                    }
                });
            };

            monitor.registerApi('trackPageView', trackPageView);
            monitor.registerApi('trackStayTime', trackStayTime);

            /** 自动PV & 停留时长逻辑 */
            const handlePageChange = () => {
                const newUrl = getCurrentUrl();
                if (newUrl !== currentUrl) {
                    trackStayTime(currentUrl, Date.now() - enterTime);
                    enterTime = Date.now();
                    currentUrl = newUrl;
                    trackPageView(newUrl);
                }
            };

            const handlePageUnload = () => {
                trackStayTime(currentUrl, Date.now() - enterTime);
            };

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'hidden') {
                    trackStayTime(currentUrl, Date.now() - enterTime);
                }
            };

            /** 初始化监听 */
            initMonitoredUrls().then(() => {

                const wrapHistoryMethod = (type: 'pushState' | 'replaceState') => {
                    const original = history[type];
                    return function (this: any, ...args: any[]) {
                        // @ts-ignore
                        const result = original.apply(this, args);
                        handlePageChange();
                        return result;
                    };
                };
                history.pushState = wrapHistoryMethod('pushState');
                history.replaceState = wrapHistoryMethod('replaceState');
                
                monitor.addEventListener(window, 'load', () => {
                    trackPageView(currentUrl);
                });
                monitor.addEventListener(window, 'popstate', handlePageChange);
                monitor.addEventListener(window, 'beforeunload', handlePageUnload);
                monitor.addEventListener(document, 'visibilitychange', handleVisibilityChange);

            });
        },

    };
};

export default trackingPlugin;