/**
 * 本地缓存工具模块
 * 提供类型安全的 localStorage 封装
 *
 * 支持的数据类型：
 * - ReportPayload: 上报数据缓存（Reporter 使用）
 * - RrwebEventCache: rrweb 录制数据缓存（rrwebPlugin 使用）
 */

import type { ReportPayload } from '../core/reportTypes';
import type { eventWithTime } from '@rrweb/types';

/**
 * rrweb 事件缓存数据结构
 */
export interface RrwebEventCache {
    events: eventWithTime[];
}

/**
 * 支持的缓存数据类型
 */
export type CacheDataType = ReportPayload | RrwebEventCache;

/**
 * 清除指定键的缓存
 * @param cacheKey 缓存键名
 */
export function clearCache(cacheKey: string): void {
    try {
        localStorage.removeItem(cacheKey);
    } catch (error) {
        console.error('[LocalCache] 缓存清除失败', error);
    }
}

/**
 * 从 localStorage 加载缓存数据
 * @param cacheKey 缓存键名
 * @returns 缓存的数据数组，如果不存在或解析失败则返回空数组
 * @example
 * // Reporter 使用
 * const reportCache = getLocalCache<ReportPayload>('frontend-monitor-offline-cache');
 *
 * // rrwebPlugin 使用
 * const rrwebCache = getLocalCache<RrwebEventCache>('rrweb-events-cache');
 */
export function getLocalCache<T extends CacheDataType>(cacheKey: string): T[] {
    try {
        const data = localStorage.getItem(cacheKey);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[LocalCache] 缓存加载失败', error);
        return [];
    }
}

/**
 * 保存单条数据到 localStorage
 * 自动维护缓存数组，超过最大数量时删除最早的数据（FIFO 策略）
 * @param cacheKey 缓存键名
 * @param item 要保存的数据项
 * @param maxCacheSize 最大缓存条数
 * @example
 * // Reporter 保存上报数据
 * saveToCache<ReportPayload>('frontend-monitor-offline-cache', reportItem, 100);
 *
 * // rrwebPlugin 保存录制数据
 * saveToCache<RrwebEventCache>('rrweb-events-cache', { events: [...] }, 10);
 */
export function saveToCache<T extends CacheDataType>(
    cacheKey: string,
    item: T,
    maxCacheSize: number
): void {
    try {
        let cache = getLocalCache<T>(cacheKey);
        cache.push(item);

        // 使用负索引简化逻辑，保留最新的 maxCacheSize 条数据
        if (cache.length > maxCacheSize) {
            cache = cache.slice(-maxCacheSize);
        }

        localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
        console.error('[LocalCache] 缓存保存失败', error);
    }
}

/**
 * 批量保存数据到 localStorage
 * 适用于一次性保存多条数据的场景
 * @param cacheKey 缓存键名
 * @param items 要保存的数据数组
 * @param maxCacheSize 最大缓存条数
 * @example
 * // Reporter 批量保存
 * saveBatchToCache<ReportPayload>('frontend-monitor-offline-cache', reportItems, 100);
 */
export function saveBatchToCache<T extends CacheDataType>(
    cacheKey: string,
    items: T[],
    maxCacheSize: number
): void {
    try {
        let cache = getLocalCache<T>(cacheKey);
        cache.push(...items);

        // 保留最新的 maxCacheSize 条数据
        if (cache.length > maxCacheSize) {
            cache = cache.slice(-maxCacheSize);
        }

        localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
        console.error('[LocalCache] 批量缓存保存失败', error);
    }
}

/**
 * 更新整个缓存（替换而不是追加）
 * @param cacheKey 缓存键名
 * @param data 新的缓存数据
 * @example
 * // 过滤并更新缓存
 * const cache = getLocalCache<ReportPayload>('cache-key');
 * const filtered = cache.filter(item => item.type !== ErrorType.TRACKING_PV);
 * updateCache<ReportPayload>('cache-key', filtered);
 */
export function updateCache<T extends CacheDataType>(cacheKey: string, data: T[]): void {
    try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
        console.error('[LocalCache] 缓存更新失败', error);
    }
}



