/**
 * @uuid a8a36cfb-b320-483b-bb60-a25713d94074
 */
import Component from "./Component";
import * as universal from "./transforms/universal";
import parsers from "./parsers";
import newDocument from "./newDocument";
import { DebugFunction, Document, ParserConsructor, TransformType } from "./types";
import { Settings } from "../gen/Settings";
import Parser from "./Parser";
import Input from "./io/Input";
import { InvalidStateError } from "./Exceptions";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
const __docformat__ = 'reStructuredText';

interface ParseFunction {
    (source: string, settings?: Settings): Document;
}

interface TransformClass {
    apply(): void;
}

interface HandleDocumentCallback {
    (error: Error | undefined | {}, document: Document|undefined): void;
}

/*
 * @uuid 6e328f57-396a-45fa-b73d-83a9d65223fb
*/
export default class Reader extends Component {
    public componentType: string = 'reader';
    public  document?: Document;
    protected parseFn?: ParseFunction;
    private settings?: Settings;
    protected source: Input|undefined;
    protected input: string|string[] = '';
    public parser?: Parser;
    private debug: boolean = false;
    private debugFn?: DebugFunction;
    public getTransforms(): TransformType[] {
        return [...super.getTransforms(), universal.Decorations]; // fixme
        //               universal.ExportInternals, universal.StripComments ];
    }

    public constructor(
        args: { parser?: Parser; parseFn?: ParseFunction; parserName?: string;
            debugFn?: DebugFunction;
            debug?: boolean; }
    ) {
        super();
        const { parser, parseFn, parserName } = args;
        this.componentType = 'reader';
        this.configSection = 'readers';
        if(parser !== undefined) {
            this.parser = parser;
        }
        if(parseFn !== undefined) {
            this.parseFn = parseFn;
        }

        if(args.debugFn) {
            this.debugFn = args.debugFn;
        }
        if(args.debug) {
            this.debug = args.debug || false;
        }
        if (parser === undefined) {
            if (parserName) {
                this.setParser(parserName);
            }
        }
        this.source = undefined;
        this.input = '';
    }

    public setParser(parserName: string): void {
        const ParserClass: ParserConsructor = parsers.getParserClass(parserName);
        this.parser = new ParserClass({
            debug: this.debug,
            debugFn: this.debugFn,
        });
    }

    /**
      * Magic read method::
      *
      *   test123
      *
      */
    public read(source: Input, parser: Parser, settings: Settings, cb: HandleDocumentCallback): void {
        this.source = source;
        if (!this.parser) {
            this.parser = parser;
        }
        this.settings = settings;
        if (!this.source) {
            throw new Error('Need source');
        }

        this.source.read((error: Error | undefined | {}, output: string | {}  | string[] | undefined): void => {
            if (error) {
                cb(error, undefined);
                return;
            }
            if(output !== undefined && (Array.isArray(output) || typeof output === 'string')) {
                this.input = output;
            }
            this.parse();
            cb(undefined, this.document);
        });
    }

    /* read method without callbcks and other junk */
    public read2(input: string, settings: Settings): Document|undefined {
        this.input = input;
        this.settings = settings;
        this.parse();
        return this.document;
    }


    /* Delegates to this.parser, providing arguments
       based on instance variables */
    public parse(): void {
        const input = Array.isArray(this.input) ? this.input.join('') : this.input;

        if (this.parser) {
            const document = this.newDocument();
            this.parser.parse(input, document);
            this.document = document;
            if (this.input === undefined) {
                throw new Error(`need input, i have ${this.input}`);
            }
        } else if(this.parseFn !== undefined) {
            const document = this.parseFn(input);
            this.document = document;
        } else {
            throw new InvalidStateError();
        }
        //this.document!.currentSource = '';
        //this.document!.currentLine = 0;
    }

    public newDocument(): Document {
        if(!this.settings) {
            throw new InvalidStateError("need settings");
        }
        const document = newDocument({
            sourcePath:
                                       this.source && this.source.sourcePath || '',
        },
        this.settings);
        return document;
    }
}

export { Reader }
