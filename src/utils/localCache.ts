import {ReportPayload} from "../core/reportTypes";


/**
 * 提取缓存清除逻辑
 */
export function clearCache(cacheKey: string): void {
    try {
        localStorage.removeItem(cacheKey);
    } catch (error) {
        console.error('[FrontendMonitor] 缓存清除失败', error);
    }
}


/**
 * 提取缓存加载逻辑
 */
export function getLocalCache(cacheKey: string): ReportPayload[] {
    try {
        const data = localStorage.getItem(cacheKey);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[FrontendMonitor] 缓存加载失败', error);
        return [];
    }
}

/**
 * 保存单条数据到localStorage
 */
export function saveToCache(cacheKey: string, item: ReportPayload, maxCacheSize: number): void {
    try {
        let cache = getLocalCache(cacheKey);
        cache.push(item);

        // 改进25: 使用负索引简化逻辑
        if (cache.length > maxCacheSize) {
            cache = cache.slice(-maxCacheSize);
        }

        localStorage.setItem(cacheKey, JSON.stringify(cache));
    } catch (error) {
        console.error('[FrontendMonitor] 缓存保存失败', error);
    }
}



