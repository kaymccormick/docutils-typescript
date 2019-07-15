/**
 * @uuid 8f3b52f8-3c07-4e97-982c-983c426074c5
 */
import Parser from '../Parser';
import RestructuredTextParser from './restructuredtext';
import { ParserConsructor } from "../types";

function getParserClass(parserName: string): ParserConsructor {
    if (parserName === "restructuredtext") {
        return RestructuredTextParser;
    }

    throw new Error("");//    return require(`./${parserName}.js`).default;
}

export default {
    getParserClass,
    Parser
};