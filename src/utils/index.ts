export * from './localCache'
export * from './hash'

/**
 * 通配符匹配工具
 * 支持 * 通配符，例如 /product/* 可以匹配 /product/123
 */
export function matchPattern(pattern: string, value: string): boolean {
    if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(value);
    }
    return pattern === value;
}

/**
 * 获取当前页面URL（不含hash）
 */
export function getCurrentUrl(): string {
    return location.pathname + location.search;
}

/**
 * 打印调试日志（仅在非生产环境）
 */
export function logDebug(message: string, ...args: any[]) {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[FrontendMonitor] ${message}`, ...args);
    }
}
