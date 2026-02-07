// src/plugins/pluginOptionsMap.ts
import type { TrackingPluginOptions } from 'src/core/pluginTypes';
import type { RrwebPluginOptions } from './rrwebPlugin';
import type { NotifyPluginOptions } from './notifyPlugin';
import type { ResourcePerformanceOptions } from './resourcePerformance';
import type { WhiteScreenOptions } from './whiteScreen';

// src/plugins/pluginEnums.ts
export enum PluginName {
    JS_ERROR = 'jsError',
    PROMISE_ERROR = 'promiseError',
    RESOURCE_ERROR = 'resourceError',
    RESOURCE_PERFORMANCE = 'resourcePerformance',
    PERFORMANCE_METRICS = 'performanceMetrics',
    WHITE_SCREEN = 'whiteScreen',
    TRACKING_PLUGIN = 'trackingPlugin',
    RRWEB_PLUGIN = 'rrwebPlugin',
    NOTIFY_PLUGIN = 'notifyPlugin'
}

export interface PluginOptionsMap {
    [PluginName.JS_ERROR]: undefined;
    [PluginName.PROMISE_ERROR]: undefined;
    [PluginName.RESOURCE_ERROR]: undefined;
    [PluginName.RESOURCE_PERFORMANCE]: Partial<ResourcePerformanceOptions>;
    [PluginName.PERFORMANCE_METRICS]: undefined;
    [PluginName.WHITE_SCREEN]: Partial<WhiteScreenOptions>;
    [PluginName.TRACKING_PLUGIN]: Partial<TrackingPluginOptions>;
    [PluginName.RRWEB_PLUGIN]: RrwebPluginOptions;
    [PluginName.NOTIFY_PLUGIN]: Partial<NotifyPluginOptions>;
}