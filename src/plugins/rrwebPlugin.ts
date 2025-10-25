// src/plugins/rrwebPlugin.ts
import { FrontendMonitor } from "src/core/monitor";
import { MonitorPlugin } from 'plugins/types';
import { PluginName } from "src/plugins/enum";
import { ErrorType } from '../core/reportTypes';
import { record } from "rrweb";
import type { eventWithTime } from '@rrweb/types';

export interface RrwebPluginOptions {
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

    const cacheKey = options?.localCacheKey || 'rrweb-events-cache';
    const maxCacheSize = options?.maxCacheSize || 10;

    return {
        name: PluginName.RRWEB_PLUGIN,
        setup(monitor: FrontendMonitor) {
            // 初始化 rrweb 录制器
            record({
                emit(event: any) {
                    events.push(event);
                },
                maskAllInputs: options?.maskAllInputs ?? true,
                maskTextSelector: options?.maskTextSelector ?? '.sensitive'
            });

            // 分片上传定时器
            const uploadInterval = options?.uploadInterval ?? 30000; // 默认30秒
            timer = window.setInterval(() => {
                console.log('time', uploadInterval, events)
                if (events.length > 0) {
                    monitor.report({
                        type: ErrorType.RRWEB, payload: {
                            events
                        }
                    });
                    // 如果开启保存到本地
                    if (options?.saveToLocal) {
                        const cache = JSON.parse(localStorage.getItem(cacheKey) || '[]');
                        cache.push({ events });
                        if (cache.length > maxCacheSize) {
                            cache.shift(); // 删除最早的数据
                        }
                        localStorage.setItem(cacheKey, JSON.stringify(cache));
                        // saveToCache(cacheKey, { events }, maxCacheSize);
                    }
                    events = [];
                }
            }, uploadInterval);

            // 监听错误事件 → 错误触发回放模式
            // 错误触发回放模式
            const maxDuration = options?.maxReplayDuration ?? 10000; // 默认10秒
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

            window.addEventListener('error', uploadRecentEvents);
            window.addEventListener('unhandledrejection', uploadRecentEvents);
        },
        destroy() {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
            events = [];
        }
    };
};

export default rrwebPlugin;