/** @uuid 2362fa8e-300e-4aa4-b2d5-ab12d3cfa6ac
*/
import TransformSpec from "../TransformSpec";

import { ReadCallback, ReadInputCallback } from "../types";

class Input extends TransformSpec {
    componentType: string = "input";
    supported: string[] = [];
    successfulEncoding: string | undefined;
    defaultSourcePath: string;
    encoding: string;
    errorHandler: string;
    sourcePath: string;
    source: {};

    public constructor(
        args: {
            source?: {},
            sourcePath?: string,
            encoding?: string,
            errorHandler?: string
        }
    ) {
        super();

        const {
            source,
            sourcePath,
            encoding,
            errorHandler
        } = args;

        this.encoding = encoding;
        this.errorHandler = errorHandler;
        this.source = source;
        this.sourcePath = sourcePath;

        if (!sourcePath) {
            this.sourcePath = this.defaultSourcePath;
        }

        this.successfulEncoding = undefined;
    }

    /* istanbul ignore method */
    abstract read(cb: ReadInputCallback<string | string[] | {}>): void;

    /* istanbul ignore method */
    public decode(data: string): string {
        return data;
    }

    /* istanbul ignore method */
    public toString(): string {
        return `Input<${this.constructor.name}>`;
    }
}

export default Input;