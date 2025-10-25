// utils/browser.ts
export function isPerformanceObserverSupported(): boolean {
    return 'PerformanceObserver' in window;
}

export function warnIfNotSupported(feature: string): boolean {
    if (!isPerformanceObserverSupported()) {
        console.warn(`[FrontendMonitor] 当前浏览器不支持 ${feature}`);
        return false;
    }
    return true;
}
