import StateMachineWS from "../../StateMachineWS";
import { ContextKind, NodeInterface, Statefactory, Statemachine } from "../../types";
import { Nestedstatemachine, RSTLanguage, RstMemo } from "./types";
import StringList from "../../StringList";
import { InvalidStateError } from "../../Exceptions";

class NestedStateMachine extends StateMachineWS implements Nestedstatemachine {
    public memo?: RstMemo;
    private rstLanguage: RSTLanguage | undefined;
    public run(inputLines: StringList|string|string[],
        inputOffset: number,
        runContext?: ContextKind,
        inputSource?: {},
        initialState?: string,
        node?: NodeInterface,
        matchTitles: boolean = true,
        memo?: RstMemo, ...rest: any[]): (string|{})[] {

        this.logger.debug('run');
        if(initialState !== undefined) {
            this.initialState = initialState;
        }

        /* istanbul ignore if */
        if (matchTitles === undefined) {
            this.matchTitles = true;
        } else {
            this.matchTitles = matchTitles;
        }
        this.memo = memo;
        if(memo === undefined) {
            throw new InvalidStateError('need memo');
        }
        this.document = memo.document;
        /* istanbul ignore if */
        if (!this.document) {
            throw new Error('need document');
        }

        this.attachObserver(this.document.noteSource.bind(this.document));
        this.reporter = memo.reporter;
        this.rstLanguage = memo.language;
        this.node = node;
        const results = super.run(inputLines, inputOffset);
        /* istanbul ignore if */
        if (results === undefined) {
            throw new Error();
        }
        return results;
    }

    public static createStateMachine(stateMachine: Statemachine, initialState: string = 'Body',
        stateFactory: Statefactory|undefined = stateMachine.stateFactory) {
        return new NestedStateMachine({stateFactory,
	    logger: stateMachine.logger,
            initialState,
        });
    }
}


export default NestedStateMachine;
