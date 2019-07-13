/** @uuid 134a5ce2-e9e9-4368-8ee3-331b81ca69c6
*/
import StateMachineWS from "../../StateMachineWS";

import { ContextKind, NodeInterface, Statefactory, Statemachine } from "../../types";
import { Nestedstatemachine, RSTLanguage, RstMemo } from "./types";
import StringList from "../../StringList";
import { InvalidStateError } from "../../Exceptions";

/*
 * @uuid f9a7cf1a-2da7-42f7-8a78-1ac97d72386a
*/
class NestedStateMachine extends StateMachineWS implements Nestedstatemachine {
    memo: RstMemo;
    rstLanguage: RSTLanguage | undefined;

    public run(
        inputLines: StringList | string | string[],
        inputOffset: number,
        runContext?: ContextKind,
        inputSource?: {},
        initialState?: string,
        node?: NodeInterface,
        matchTitles: boolean = true,
        memo?: RstMemo,
        ...rest: any[]
    ): (string | {})[] {
        /* istanbul ignore if */
        if (matchTitles === undefined) {
            this.matchTitles = true;
        } else {
            this.matchTitles = matchTitles;
        }

        this.memo = memo;

        if (memo === undefined) {
            throw new InvalidStateError("need memo");
        }

        this.document = memo.document;

        /* istanbul ignore if */
        if (!this.document) {
            throw new Error("need document");
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

    public static createStateMachine(
        stateMachine: Statemachine,
        initialState: string = "Body",
        stateFactory: Statefactory | undefined = stateMachine.stateFactory
    ) {
        return new NestedStateMachine({
            stateFactory,
            initialState
        });
    }
}

export default NestedStateMachine;