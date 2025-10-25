import { ReporterOptions } from "src/core/reporter";
import { PluginName, PluginOptionsMap } from "src/plugins/enum";

export type UpdateConfigEnum = PluginName | 'reportOptions';

export interface UpdateConfigOptions extends PluginOptionsMap {
    reportOptions: Partial<ReporterOptions>;
}
