/** @uuid a894d025-cca4-4314-862a-66cc2f5c7a00
*/
import Component from "./Component";

import { DebugFunction, Document, ParserArgs } from "./types";

/*
 * @uuid ff90034f-a6c0-44e7-ad43-9961608d510c
*/
class Parser extends Component {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    debugFn: DebugFunction = (msg: string): void => {};

    debug: boolean;

    public constructor(args: ParserArgs = {}) {
        super();
        this.componentType = "parser";
        this.configSection = "parsers";
        this.debug = args.debug || false;

        if (args.debugFn !== undefined) {
            this.debugFn = args.debugFn;
        }
    }

    /* istanbul ignore function */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    abstract parse(inputstring: string, document: Document): void;

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    public setupParse(inputstring: string, document: Document): void {}

    abstract finishParse(): void;
}

export default Parser;