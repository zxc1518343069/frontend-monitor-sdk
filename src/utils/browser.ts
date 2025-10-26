// utils/browser.ts
import { ERROR_MESSAGES } from "src/core/constants";

export function isPerformanceObserverSupported(): boolean {
    return 'PerformanceObserver' in window;
}

export function warnIfNotSupported(feature: string): boolean {
    if (!isPerformanceObserverSupported()) {
        console.warn(ERROR_MESSAGES.NOT_SUPPORTED(feature));
        return false;
    }
    return true;
}
