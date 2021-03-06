import { ApplicationError, InvalidStateError } from "./Exceptions";
import { ArgumentParser } from 'argparse';
import { OptionParser, OptionParserArgs } from "./Frontend";
import * as readers from './Readers';
import * as writers from './Writers';
import SettingsSpec from './SettingsSpec';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
import pojoTranslate from './fn/pojoTranslate';
import {Settings} from "../gen/Settings";
import Parser from "./Parser";
import Writer from "./Writer";
import Reader from "./Reader";
import Output from "./io/Output";
import FileInput from "./io/FileInput";
import FileOutput from "./io/FileOutput";
import Input from "./io/Input";
import { DebugFunction, Document, InputConstructor, LoggerType } from "./types";

export interface SetupOptionParserArgs
{
    usage?: string;
    description?: string;
    settingsSpec?: SettingsSpec;
    configSection?: string;
    defaults?: {};
}

export interface ProcessCommandLineArgs {
    argv: string[];
    usage?: string;
    description?: string;
    settingsSpec?: SettingsSpec;
    configSection?: string;
    settingsOverrides?: {};
}

export interface PublisherArgs {
    reader?: Reader;
    parser?: Parser;
    writer?: Writer;
    source?: Input;
    sourceClass?: InputConstructor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    destination?: Output<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    destinationClass?: OutputConstructor<any>;
    settings?: Settings;
    debugFn?: DebugFunction;
    debug?: boolean;
    logger: LoggerType;
}

interface OutputConstructor<T> {
    new (destination?: T, destinationPath?: string, encoding?: string, errorHandler?: string): Output<T>;
}

/*interface InputConstructor {
    new (): Input;
}
*/

/**
 * A facade encapsulating the high-level logic of a Docutils system.
 */

export class Publisher {
    public get document(): Document | undefined {
        return this._document;
    }
    private sourceClass?: InputConstructor;
    public settings?: Settings;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private debugFn: DebugFunction;
    private reader?: Reader;
    private _document: Document | undefined;
    private parser?: Parser;
    private writer?: Writer;
    private source?: Input;
    //KM1 private sourceClass?: InputConstructor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private destination?: Output<string>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private destinationClass?: OutputConstructor<any>;
    private debug: boolean = false;

    /**
     * Create a publisher instance.
     * @param {Object} args - arguments
     * @param {Reader} args.reader - instance of StandaloneReader
     * @param {Parser} args.parser - instance of Parser
     * @param {Writer} args.writer - instance of Writer
     * @param {Source} args.source - instance of Source
     * @param {function} args.sourceClass - class for source, mutually exclusive with souce paramter
     * @param {Destination} args.destination - where the output should be written
     * @param {function} args.destinationClass - Class for destination, mutually
     *                                           exclusive with destination paramter.
     * @param {object} args.settings - Settings for docutils engine.
     * @param {function} args.debugFn - Debug function.
     */

    /* reader=None, parser=None, writer=None, source=None,
   source_class=io.FileInput, destination=None,
   destination_class=io.FileOutput, settings=None */

    private logger: LoggerType;

    public constructor(args: PublisherArgs) {
        const {
            reader, parser, writer, source, destination,
            settings, debugFn, sourceClass, destinationClass, logger,
        } = args;

        this.logger = logger;

        if(debugFn !== undefined) {
            this.debugFn = debugFn;
        } else {
            this.debugFn = this.logger.debug.bind(this.logger);

        }
        this._document = undefined;
        this.reader = reader;
        this.parser = parser;
        this.writer = writer;
        this.source = source;
        this.destination = destination;
        // @ts-ignore
        this.sourceClass = sourceClass || FileInput;
        // @ts-ignore
        this.destinationClass = destinationClass || FileOutput;
        this.settings = settings;
    }

    public setReader(readerName: string|undefined, parser?: Parser, parserName?: string): void {
        if(readerName === undefined) {
            return;
        }
        const ReaderClass = readers.getReaderClass(readerName);
        this.reader = new ReaderClass({
            parser, parserName, debug: this.debug, debugFn: this.debugFn,
	    logger: this.logger,
        });
        if(this.reader !== undefined) {
            this.parser = this.reader.parser;
        }
    }

    public setWriter(writerName: string|undefined): void {
        if(writerName === undefined) {
            return;
        }
        const WriterClass = writers.getWriterClass(writerName);
        /* not setting document here, the write method takes it, which
         * is confusing */
        this.writer = new WriterClass({ logger: this.logger});
    }

    public setComponents(readerName?: string, parserName?: string, writerName?: string): void {
        if (!this.reader) {
            this.setReader(readerName, this.parser, parserName);
        }
        if (!this.parser && this.reader !== undefined) {
            if(!this.reader.parser && parserName !== undefined) {
                this.reader.setParser(parserName);
            }
            this.parser = this.reader.parser;
        }
        if (!this.writer) {
            this.setWriter(writerName);
        }
    }

    public setupOptionParser(
        args: SetupOptionParserArgs,
    ): ArgumentParser {
        const { usage, description, settingsSpec, configSection, defaults } = args;
        let settingsSpec2 = settingsSpec;
        if (configSection) {
            if (!settingsSpec2) {
                settingsSpec2 = new SettingsSpec();
            }
            settingsSpec2.configSection = configSection;
            const parts = configSection.split(' ');//fixme check split
            if (parts.length > 1 && parts[parts.length - 1] === 'application') {
                settingsSpec2.configSectionDependencies = ['applications'];
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        settingsSpec2 = settingsSpec2!;
        if(!this.parser) {
            throw new ApplicationError('no parser');
        }
        if(!this.reader) {
            throw new ApplicationError('no reader');
        }
        if(!this.writer) {
            throw new ApplicationError('no writer');
        }
        if(!settingsSpec2) {
            //throw new Error('no settingsSpec');
        }

        const components: SettingsSpec[] = [this.parser, this.reader,this.writer]
        if(settingsSpec2 !== undefined) {
            components.push(settingsSpec2);
        }
        const oArgs: OptionParserArgs = {logger: this.logger, components, defaults, readConfigFiles:true, usage,description}
        const optionParser = new OptionParser(oArgs);
        return optionParser;
    }

    public processCommandLine(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        args: ProcessCommandLineArgs,
    ): void {
        try {
            const argParser: ArgumentParser = this.setupOptionParser({
                usage: args.usage,
                description: args.description,
	    });
            let argv = args.argv;
            if (argv === undefined) {
                argv = process.argv.slice(2);
            }
	    this.logger.silly('calling argParser.parseKnownArgs', { argv });
            const [settings, restArgs] = argParser.parseKnownArgs(argv);
            // @ts-ignore
            this.settings = argParser.checkValues(settings, restArgs);
        } catch(error) {
            console.log(error.stack);
            console.log(error.message);
            throw error;
        }
    }

    public setIO(sourcePath?: string, destinationPath?: string): void {
        this.logger.silly('setIO');
        if (this.source === undefined) {
            this.setSource({ sourcePath });
        }
        if (this.destination === undefined) {
            this.setDestination({ destinationPath });
        }
        this.logger.silly('departing setIO');
    }

    public setSource(args: { source?: {}; sourcePath?: string }): void {
        this.logger.silly('setSource');
        let sourcePath = args.sourcePath;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let source = args.source;
        if (typeof sourcePath === 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            sourcePath = this.settings!._source;
        } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.settings!._source = sourcePath;
        }

        try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const SourceClass: InputConstructor = this.sourceClass!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            let inputEncoding: string | undefined = this.settings!.inputEncoding;

            if(SourceClass !== undefined) {
                this.source = new SourceClass({
                    source,
                    sourcePath,
                    encoding:
                    inputEncoding,
		    logger: this.logger,
                });
            }
        } catch (error) {
            this.logger.error(error);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            throw new ApplicationError(`Unable to instantiate Source class ${this.sourceClass!.constructor.name}: ${error.message}`, { error });
        }
    }

    public setDestination(args: { destination?: Output<{}>; destinationPath?: string }): void {
        this.logger.silly('setDestination');
        try {
            let destinationPath = args.destinationPath;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            let destination = args.destination;
            if (destinationPath === undefined) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                destinationPath = this.settings!._destination;
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.settings!._destination = destinationPath;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const DestinationClass = this.destinationClass!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-unused-vars
            const outputEncoding = this.settings!.outputEncoding;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-unused-vars
            let outputEncodingErrorHandler = this.settings!.outputEncodingErrorHandler;
            this.destination = new DestinationClass(
                destination,
                destinationPath,
                outputEncoding,
                outputEncodingErrorHandler,
            );
        } catch(error) {
            console.log(error.message);
            this.logger.error(`Got error ${error.message}`, { stack: error.stack});
        }
    }

    public applyTransforms(): void {
        this.logger.silly('Publisher.applyTransforms');
        const document1 = this.document;
        if(document1 === undefined) {
            throw new InvalidStateError('Document undefined');
        }
        if(this.source === undefined ||
        this.reader === undefined ||
        this.reader.parser === undefined
        || this.writer === undefined|| this.destination === undefined) {
            throw new InvalidStateError('Component undefined');
        }
        document1.transformer.populateFromComponents(
            this.source, this.reader, this.reader.parser,
            this.writer, this.destination,
        );
        document1.transformer.applyTransforms();
    }

    /* This doesnt seem to return anything ? */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public publish(args: any): Promise<any> {
        this.logger.silly('Publisher.publish');

        const {
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
            argv, usage, description, settingsSpec, settingsOverrides, configSection, enableExitStatus,
        } = args;
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */

        if (this.settings === undefined) {
            this.processCommandLine({
                argv, usage, description, settingsSpec, configSection, settingsOverrides,
            });
        }
        this.setIO();

        if (this.reader === undefined) {
            throw new ApplicationError('Need defined reader with "read" method');
        }
        if(this.writer === undefined || this.source === undefined || this.parser === undefined) {
            throw new InvalidStateError('need Writer and source');
        }
        const writer = this.writer;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if(this.settings! === undefined) {
            throw new InvalidStateError('need serttings');
        }
        this.logger.silly('calling read');
        return this.reader.read(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.source, this.parser, this.settings!).then((result: any) => {
            this._document = result;
            if (this._document === undefined) {
                throw new InvalidStateError('need document');
            }
            if (this.destination === undefined) {
                throw new InvalidStateError('need destination');
            }
            this.applyTransforms();

            const output = writer.write(this._document!, this.destination);
            writer.assembleParts();
            this.debuggingDumps();
            return writer.output;
        });
    }

    public debuggingDumps(): void {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if(this.settings!.dumpSettings) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            process.stderr.write(JSON.stringify(this.settings!, null, 4));
        }
    }
}
