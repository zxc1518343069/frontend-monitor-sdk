import { ErrorType } from "../core/reportTypes";


/**
 * @description 移除 payload 中的易变字段
 * 这些字段不应该影响错误的唯一性判断
 */
function removeVolatileFields(obj: any): any {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(removeVolatileFields);
    }

    const { timestamp, time, count, events, ...stable } = obj;

    // 递归处理嵌套对象
    const result: any = {};
    for (const key of Object.keys(stable).sort()) {
        result[key] = removeVolatileFields(stable[key]);
    }

    return result;
}

/**
 * @description 计算错误唯一标识的hash值
 * 通过移除易变字段和排序键来确保相同错误产生相同的hash
 */
export function computeHash(type: ErrorType, payload: unknown): string {
    // 移除易变字段
    const stablePayload = removeVolatileFields(payload);

    // 对象键排序后序列化，确保相同对象产生相同字符串
    const normalized = JSON.stringify(stablePayload);

    return safeBtoa(`${type}-${normalized}`);
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