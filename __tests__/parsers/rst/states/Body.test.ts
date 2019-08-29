import sinon from 'sinon';
import Body from '../../../../src/parsers/rst/states/Body';
import StringList from '../../../../src/StringList';
import RSTStateMachine from '../../../../src/parsers/rst/RSTStateMachine';
import StateFactory from '../../../../src/parsers/rst/StateFactory';
import * as nodes from '../../../../src/nodes';
import { fullyNormalizeName } from "../../../../src/nodeUtils";
import { createRSTStateMachine, createLogger } from '../../../../src/testUtils';


const logger = createLogger();

beforeAll(() => {
    sinon.spy(nodes, 'document');
    sinon.spy(nodes, 'citation');
});
afterEach(() => {
    sinon.restore();
});

beforeEach(() => {
});


function createBody(optSm?: any) {
    const stateMachine = optSm || createRSTStateMachine({logger});
    const body = new Body(stateMachine, true);
    return body;
}

test('Body patterns', () => {
    const body = createBody();
    /* Ensure body state patterns haven't changed. */
    expect(body.patterns).toMatchSnapshot();
});

test('Body constructor',
    () => {
        const body = createBody();
        expect(body).toBeDefined();
    });


// '\\.\\.[ ]+_(?![ ]|$)'
// Regex for reference
// new RegExp(`^(_|(?!_)(\`?)(?![ \`])(.+?)${nonWhitespaceEscapeBefore})
// (?<!(?<!\\x00):)${nonWhitespaceEscapeBefore}[ ]?:([ ]+|$)`),
test.skip('hyperlink_target, no args', () => {
    const body = createBody();
//    expect(() => body.hyperlink_target({})).toThrow();
});

test('explicit hyperlink_target, with arg (malformed)', () => {
    const hyperlinkSource = '.. _myname';
    const rgxp = new RegExp('\\.\\.[ ]+_(?![ ]|$)');
    const body = createBody();
    const match = rgxp.exec(hyperlinkSource);
    // Problem here is that it seeks more input!
//    expect(() => body.hyperlink_target(match)).toThrow();
//    const [[target], blank_finish] = body.hyperlink_target(match);
});


test('explicit citation', () => {
    const source = '.. [myCitation]';
    // fix this in original source
    // we extract the regexp so we can pass in the proper results
    const rgxp = new RegExp('\\.\\.[ ]+\\[(\\w+)\\]([ ]+|$)');
    const sm = createRSTStateMachine({logger});
    const body = createBody(sm);
    console.log(fullyNormalizeName);
    //    console.log(sm);
    //    console.log(sm.getSourceAndLine());

    const match = rgxp.exec(source);
    if(match) {
    body.citation(match);
    }
//    expect(() => body.citation(match)).toThrow();
//    const [[target], blank_finish] = body.hyperlink_target(match);
});

