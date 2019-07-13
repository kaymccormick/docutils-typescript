/** @uuid 39f93cec-e7cd-47da-8a74-2410e5a76f21
*/
import Text from "./Text";

import { EOFError } from "../../../Exceptions";
import State from "../../../states/State";
import RSTStateMachine from "../RSTStateMachine";
import { RSTStateArgs } from "../types";

class SpecializedText extends Text {
    /* istanbul ignore next */
    // @ts-ignore
    blank() {
        this.invalidInput();
    }

    /* istanbul ignore next */
    // @ts-ignore
    underline() {
        this.invalidInput();
    }

    /* istanbul ignore next */
    indent(match: any, context: string[], nextState: State): any[] {
        this.invalidInput();
        return [];
    }

    /* istanbul ignore next */
    text(match: any, context: string[], nextState: State): any[] {
        this.invalidInput();
        return [];
    }

    /* istanbul ignore next */
    eof() {
        return [];
    }

    /* istanbul ignore next */
    invalidInput() {
        throw new EOFError();
    }
}

SpecializedText.stateName = "SpecializedText";

//SpecializedText.constructor.stateName = 'SpecializedText';
export default SpecializedText;