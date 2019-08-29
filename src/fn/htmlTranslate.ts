/**
 * @uuid aecafe81-a466-487f-b7ce-f3928e78d892
 */
import Writer from '../writers/HtmlBase';
import {Document} from "../types";

function htmlTranslate(document: Document): string {
    const writer = new Writer({ logger:document.logger});
    // @ts-ignore
    const output = writer.write(document, (r: {}): {} => r);
    if (typeof output === 'undefined') {
        throw new Error('undefined output');
    }
    // @ts-ignore
    return output;
}

export { htmlTranslate };

export default htmlTranslate;
