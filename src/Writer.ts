/** @uuid edf0afc7-818f-47e9-aa14-7a41d7006d8c
*/
import Component from "./Component";

import { getLanguage } from "./languages";
import { Destination, Document, WriterParts } from "./types";
import Output from "./io/Output";
import { InvalidStateError } from "./Exceptions";
const __version__ = "";

/**
 * Base class for all writers.
 
 * @uuid 7c403eae-30e5-4349-be6f-1b3918c58ff6
*/
export default class Writer extends Component {
    parts: WriterParts;
    document: Document;
    language: {};

    /**
                 * Final translated form of `document` (Unicode string for text, binary
                 * string for other forms); set by `translate`.
                 */
    output: string | {};

    /**
                 * `docutils.io` Output object; where to write the document.
                 * Set by `write`.
                 */
    destination: Output<string>;

    /*
                 * @constructor
                 *
                 */
    public constructor() {
        super();
        this.parts = {};
    }

    public write(document: Document, destination: Destination | undefined): string | {} | undefined {
        this.document = document;

        if (document !== undefined) {
            // @ts-ignore
            this.language = getLanguage(document.settings.docutilsCoreOptionParser.languageCode, document.reporter);
        }

        this.destination = destination;
        this.translate();
        let fn;

        if (this.destination) {
            if (typeof this.destination === "function") {
                fn = this.destination;
            } else if (typeof this.destination.write === "function") {
                fn = this.destination.write.bind(this.destination);
            }
        }

        if (fn !== undefined && this.output !== undefined) {
            // @ts-ignore
            return fn(this.output);
        } else {
            return this.output;
        }
    }

    public abstract translate(): void;

    public assembleParts(): void {
        if (this.document === undefined) {
            throw new InvalidStateError();
        }

        // @ts-ignore
        this.parts.whole = this.output;

        this.parts.encoding = this.document.settings.docutilsCoreOptionParser.outputEncoding;
        this.parts.version = __version__;
    }
}