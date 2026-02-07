import { ErrorType } from "../core/reportTypes";
import { MonitorPlugin } from './types';
import { PluginName } from "./enum";
import { warnIfNotSupported } from "../utils/browser";
import { matchPattern } from "../utils";

export interface ResourcePerformanceOptions {
    /** 只上报加载耗时大于该阈值的资源（单位：ms），默认 0（全量上报） */
    threshold?: number;
    /** 指定需要监控的资源类型，默认监控所有类型 */
    resourceTypes?: string[];
    /** 忽略的资源 URL 列表（支持字符串或正则） */
    ignoreUrls?: (string | RegExp)[];
    /** 采样率 (0.0 - 1.0)，默认 1.0（全量上报） */
    sampling?: number;
}

/**
 * 资源性能监控插件
 * 使用 PerformanceObserver 采集资源加载时间、大小等信息
 */
const resourcePerformancePlugin = (options?: ResourcePerformanceOptions): MonitorPlugin => {
    let observer: PerformanceObserver | null = null

    return {
        name: PluginName.RESOURCE_PERFORMANCE,
        setup(monitor) {
            if (!warnIfNotSupported('PerformanceObserver')) {
                return;
            }

            const threshold = options?.threshold ?? 0;
            const resourceTypes = options?.resourceTypes;
            const ignoreUrls = options?.ignoreUrls ?? [];
            const sampling = options?.sampling ?? 1;

            observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'resource') {
                        const resourceEntry = entry as PerformanceResourceTiming;

                        // 1. 采样率过滤
                        if (Math.random() > sampling) {
                            return;
                        }

                        // 2. 耗时阈值过滤
                        if (resourceEntry.duration < threshold) {
                            return;
                        }

                        // 3. 资源类型过滤
                        if (resourceTypes && !resourceTypes.includes(resourceEntry.initiatorType)) {
                            return;
                        }

                        // 4. URL 黑名单过滤
                        if (ignoreUrls.some(pattern => matchPattern(pattern, resourceEntry.name))) {
                            return;
                        }

                        monitor.report({
                            type: ErrorType.RESOURCE_PERFORMANCE,
                            payload: {
                                name: resourceEntry.name,
                                initiatorType: resourceEntry.initiatorType,
                                duration: resourceEntry.duration,
                                transferSize: resourceEntry.transferSize,
                                // 补充更多关键指标
                                nextHopProtocol: resourceEntry.nextHopProtocol, // 协议 (h2, http/1.1)
                                dnsTime: resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart, // DNS耗时
                                tcpTime: resourceEntry.connectEnd - resourceEntry.connectStart, // TCP耗时
                                ttfb: resourceEntry.responseStart - resourceEntry.requestStart, // 首字节时间
                            }
                        });
                    }
                });
            });
            observer.observe({ entryTypes: ['resource'] });
        },
        destroy() {
            if (observer) {
                observer.disconnect();
                observer = null
            }
        }
    };
}

export default resourcePerformancePlugin;