/**
 * @uuid 2018f61d-bcc2-43f0-8b9a-3a99d12ab61a
 */
import TransformSpec from '../TransformSpec';

/**
 * @uuid c2feb3a9-517a-473b-826d-de9854a332fe
 */
class Output<T> extends TransformSpec {
    public componentType: string = 'output';
    public supported: string[] = [];
    protected defaultDestinationPath?: string;
    private destinationPath?: string;
    private encoding?: string;
    public destination?: T;
    private errorHandler: string;
    public constructor(destination?: T, destinationPath?: string, encoding?: string, errorHandler?: string) {
        super();
        if(encoding !== undefined) {
            this.encoding = encoding;
        }
        this.errorHandler = errorHandler || 'strict';
        this.destination = destination;
        this.destinationPath = destinationPath;
        if (!destinationPath) {
            this.destinationPath = this.defaultDestinationPath;
        }
    }

    /* istanbul ignore method */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    public write(data: string): void {
    }

    /* istanbul ignore method */
    public encode(data: string): string {
        return data; // fixme?
    }

    /* istanbul ignore method */
    public toString() {
        return `Output<${this.constructor.name}>`;
    }
}
//Output.componentType = 'Output';
//Output.defaultDestinationPath = null;

export default Output;
