/** @uuid 654d74d2-3bbb-45d7-a026-b91bdc0f5817
*/
import Directive from "../Directive";

import * as nodes from "../../../nodes";

export class Contents extends Directive {
    run() {
        return [new nodes.comment("", "unimplemented directive contents")];
    }
}

export class Sectnum extends Directive {}