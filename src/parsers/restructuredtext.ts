/** @uuid 94897fb9-c6b8-448d-8d4c-b6d0a56f47b8
*/
import BaseParser from "../Parser";

import * as statemachine from "../StateMachine";
import RSTStateMachine from "./rst/RSTStateMachine";
import StateFactory from "./rst/StateFactory";
import { Document, ParserArgs } from "../types";
import { InlinerInterface } from "./rst/types";
import { InvalidStateError } from "../Exceptions";

/*
 * @uuid 69b4a3d2-65cb-4423-84bb-6bc447bf3431
*/
class Parser extends BaseParser {
    inliner: InlinerInterface;
    initialState: string;
    stateMachine: RSTStateMachine;

    public constructor(args: ParserArgs = {}) {
        super(args);
        this.configSection = "restructuredtext parser";
        this.configSectionDependencies = ["parsers"];

        if (args.rfc2822) {
            this.initialState = "RFC2822Body";
        } else {
            this.initialState = "Body";
        }

        if (args.inliner !== undefined) {
            this.inliner = args.inliner;
        }
    }

    public parse(inputstring: string, document: Document): void {
        if (!inputstring.split) {
            throw new Error("not a string");
        }

        if (!inputstring) {
            throw new Error("need input for rst parser");
        }

        this.setupParse(inputstring, document);

        this.stateMachine = new RSTStateMachine({
            stateFactory: new StateFactory(),
            initialState: this.initialState,
            debugFn: this.debugFn,
            debug: document.reporter.debugFlag
        });

        if (document.settings.docutilsParsersRstParser === undefined) {
            throw new InvalidStateError("need config for rstparser");
        }

        let tabWidth = document.settings.docutilsParsersRstParser.tabWidth;

        const inputLines = statemachine.string2lines(inputstring, {
            tabWidth: tabWidth,
            convertWhitespace: true
        });

        //      console.log(`initial state is ${this.initialState}`);
        this.stateMachine.run(
            inputLines,
            0,
            undefined,
            undefined,
            undefined,
            document,
            true,
            this.inliner
        );

        this.finishParse();
    }

    public finishParse(): void {}
}

export { Parser as RSTParser };
export default Parser;