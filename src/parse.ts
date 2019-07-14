/**
 * @uuid 1e58369d-8dd2-471d-9e98-98c3c101ae6e
 */
import newDocument from './newDocument';
import restParse from './fn/restructuredText';
import {Settings} from "../gen/Settings";
import {getDefaultSettings} from "./settingsHelper";
import { Document } from "./types";

/**
 * Parse a REST document. This function uses getDefaualtSettings if settings parameter
 * is undefined.
 */
function parse(docSource: string, settings?: Settings): Document {
    const lSettings: Settings = settings || getDefaultSettings();
    const document = newDocument({ sourcePath: '' }, lSettings);
    return restParse(docSource, document);
}

export { parse };
export default parse;
