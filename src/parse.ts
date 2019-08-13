import newDocument from './newDocument';
import restParse from './fn/restructuredText';
import {Settings} from "../gen/Settings";
import {getDefaultSettings} from "./settingsHelper";
import { Document, LoggerType } from "./types";
import { NoOpLogger } from './NoOpLogger';

export interface ParseOptions {
    logger?: LoggerType;
    settings?: Settings;
}
  
/**
 * Parse a REST document. This function uses getDefaualtSettings if settings parameter
 * is undefined.
 */
function parse(
    docSource: string,
    options: ParseOptions,
): Document {
    const opt = { ...(options || {}) };
    const logger = opt.logger || new NoOpLogger();
    const lSettings: Settings = opt.settings || { ...getDefaultSettings() };
    const document = newDocument({ logger, sourcePath: '' }, lSettings);
    return restParse(docSource, document, logger);
}

export { parse };
export default parse;
