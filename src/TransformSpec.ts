import SettingsSpec from "./SettingsSpec";
import { TransformType, LoggerType } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __docformat__ = 'reStructuredText';

/**
 * @class
 * Runtime transform specification base class.
 * 
 * TransformSpec subclass objects used by `docutils.transforms.Transformer`.
 */

class TransformSpec extends SettingsSpec {
    public unknownReferenceResolvers: {}[] = [];
    protected logger: LoggerType;
    constructor(args: { logger: LoggerType}) {
        super();
        this.logger = args.logger;
    }

    /**
     * Get the transforms associated with the instance.
     * @returns {Array} array of Transform classes (not instances)
     */
    // eslint-disable-next-line class-methods-use-this
    public getTransforms(): TransformType[] {
        return [];
    }

    public toString(): string {
        return `TransformSpec<${this.constructor.name}>`;
    }
}
export default TransformSpec;
