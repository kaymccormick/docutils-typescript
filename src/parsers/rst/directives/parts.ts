/**
 * @uuid 654d74d2-3bbb-45d7-a026-b91bdc0f5817
 */
import Directive from '../Directive';
import * as nodes from '../../../nodes';

/*
 * @uuid 992143a4-449b-45f3-be01-8db18386bc5f
*/
export class Contents extends Directive {
    run() {
        return [new nodes.comment('', 'unimplemented directive contents')];
    }
}
/*
 * @uuid 9d31b036-ff70-495a-b1fb-9eab3454666d
*/
export class Sectnum extends Directive {
}
