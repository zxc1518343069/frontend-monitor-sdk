import { ErrorType } from "../core/reportTypes";


/**
 * @description 计算错误唯一标识的hash值
 */
export function computeHash(type: ErrorType, payload: unknown): string {
    return safeBtoa(`${type}-${JSON.stringify(payload)}`);
}


/**
 * @description 安全的Base64编码函数
 */
export function safeBtoa(str: string): string {
    try {
        return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
        console.warn('[FrontendMonitor] Base64编码失败，使用原始字符串', error);
        return str;
    }
}