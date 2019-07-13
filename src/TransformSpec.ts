/* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars 
 * @uuid d19ccb1a-43ca-476c-95c4-8c498c594d9c
*/
import SettingsSpec from "./SettingsSpec";

import { TransformType } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const __docformat__ = "reStructuredText";

/**
 * @class
 * Runtime transform specification base class.
 *
 * TransformSpec subclass objects used by `docutils.transforms.Transformer`.
 */
class TransformSpec extends SettingsSpec {
    unknownReferenceResolvers: {}[] = [];

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