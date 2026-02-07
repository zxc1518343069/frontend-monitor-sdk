// src/plugins/rrwebPlugin.ts
import { FrontendMonitor } from "../core/monitor";
import { MonitorPlugin } from './types';
import { PluginName } from "./enum";
import { saveToCache } from "../utils/localCache";
import { ErrorType } from '../core/reportTypes';
import { DEFAULT_CONFIG } from '../core/constants';
import type { eventWithTime, listenerHandler } from '@rrweb/types';

// 定义 rrweb 的核心类型（避免直接 import rrweb 导致打包依赖）
interface RRWebInstance {
    record: (options: any) => listenerHandler | undefined;
}

export interface RrwebPluginOptions {
    /** 
     * 必须传入 rrweb 实例 
     * import * as rrweb from 'rrweb';
     */
    rrweb: RRWebInstance;
    uploadInterval?: number; // 分片上传间隔（毫秒）
    maxReplayDuration?: number; // 错误触发回放模式下的最大回放时长（毫秒）
    maskAllInputs?: boolean; // 屏蔽所有输入框内容
    maskTextSelector?: string; // 屏蔽指定元素文本
    saveToLocal?: boolean; // 是否保存事件到本地缓存
    localCacheKey?: string; // 本地缓存 key（默认 'rrweb-events-cache'）
    maxCacheSize?: number; // 本地缓存最大条数
}

export interface RrwebPayload {
    events: eventWithTime[]
}

const rrwebPlugin = (options?: RrwebPluginOptions): MonitorPlugin => {
    let events: eventWithTime[] = []; // 存储录制事件
    let timer: number | null = null;
    let stopRecord: listenerHandler | null | undefined; // rrweb 录制停止函数

    const cacheKey = options?.localCacheKey || DEFAULT_CONFIG.RRWEB_CACHE_KEY;
    const maxCacheSize = options?.maxCacheSize || DEFAULT_CONFIG.RRWEB_MAX_CACHE_SIZE;

    return {
        name: PluginName.RRWEB_PLUGIN,
        setup(monitor: FrontendMonitor) {
            if (!options?.rrweb) {
                console.error('[FrontendMonitor] rrwebPlugin 启动失败: 未传入 rrweb 实例');
                return;
            }

            // 初始化 rrweb 录制器
            try {
                stopRecord = options.rrweb.record({
                    emit(event: any) {
                        events.push(event);
                    },
                    maskAllInputs: options?.maskAllInputs ?? true,
                    maskTextSelector: options?.maskTextSelector ?? '.sensitive'
                });
            } catch (err) {
                console.error('[FrontendMonitor] rrweb 录制启动失败', err);
                return;
            }

            // 分片上传定时器
            const uploadInterval = options?.uploadInterval ?? DEFAULT_CONFIG.RRWEB_UPLOAD_INTERVAL;
            timer = window.setInterval(() => {
                if (events.length > 0) {
                    monitor.report({
                        type: ErrorType.RRWEB, payload: {
                            events
                        }
                    });

                    // 如果开启保存到本地，使用统一的 localCache 工具
                    if (options?.saveToLocal) {
                        saveToCache(
                            cacheKey,
                            { events: [...events] },  // 保存副本，避免引用问题
                            maxCacheSize
                        );
                    }

                    events = [];
                }
            }, uploadInterval);

            // 监听错误事件 → 错误触发回放模式
            const maxDuration = options?.maxReplayDuration ?? DEFAULT_CONFIG.RRWEB_MAX_REPLAY_DURATION;
            const uploadRecentEvents = () => {
                const now = Date.now();
                const recentEvents = events.filter(e => now - e.timestamp <= maxDuration);
                if (recentEvents.length > 0) {
                    monitor.report({
                        type: ErrorType.RRWEB, payload: {
                            events: recentEvents
                        }
                    });
                }
            };
            monitor.addEventListener(window, 'error', uploadRecentEvents)
            monitor.addEventListener(window, 'unhandledrejection', uploadRecentEvents)
        },
        destroy() {
            // 停止 rrweb 录制
            if (stopRecord) {
                stopRecord();
                stopRecord = null;
            }

            // 清理定时器
            if (timer) {
                clearInterval(timer);
                timer = null;
            }

            // 清空事件队列
            events = [];
        }
    };
};

export default rrwebPlugin;