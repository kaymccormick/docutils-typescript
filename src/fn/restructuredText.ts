/** @uuid 3f9ba731-1b1d-4369-ab19-e47ad8991d00
*/
import * as statemachine from "../StateMachine";

import RSTStateMachine from "../parsers/rst/RSTStateMachine";
import StateFactory from "../parsers/rst/StateFactory";
import { Document } from "../types";

/**
 *
 * @param inputstring
 * @param document
 */
function parse(inputstring: string, document: Document): Document {
    const initialState = "Body";

    const stateMachine = new RSTStateMachine({
        stateFactory: new StateFactory(),

        // fixme
        initialState/*        debugFn: this.debugFn,
                                debug: document.reporter.debugFlag, */
    });

    let tabWidth;

    if (document.settings.docutilsParsersRstParser !== undefined) {
        tabWidth = document.settings.docutilsParsersRstParser.tabWidth;
    }

    const inputLines = statemachine.string2lines(inputstring, {
        tabWidth,
        convertWhitespace: true
    });

    stateMachine.run(inputLines, 0, undefined, undefined, undefined, document);
    return document;
}

export default parse;