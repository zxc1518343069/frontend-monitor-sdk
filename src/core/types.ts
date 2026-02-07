import { ReporterOptions } from "./reporter";
import { PluginName, PluginOptionsMap } from "../plugins/enum";

export type UpdateConfigEnum = PluginName | 'reportOptions';

export interface UpdateConfigOptions extends PluginOptionsMap {
    reportOptions: Partial<ReporterOptions>;
}
