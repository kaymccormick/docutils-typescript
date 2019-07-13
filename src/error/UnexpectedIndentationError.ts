/** @uuid dd4db0a0-92aa-4379-8fcc-7f058e8ee545
*/
import StringList from "../StringList";

/** @uuid 21b42b90-a549-42d5-a13e-b40053e9c853
*/
export default class UnexpectedIndentationError extends Error {
    block: StringList;
    source: string | undefined;
    lineno: number | undefined;

    public constructor(block: StringList, source?: string, lineno?: number) {
        // @ts-ignore
        super();

        this.block = block;
        this.source = source;
        this.lineno = lineno;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnexpectedIndentationError);
        }

        this.message = `Unexpected indentation error.`;
    }
}