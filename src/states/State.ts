/** @uuid 1986b10f-d579-420a-a26c-7bc5b5b9782d
*/
import { InvalidArgumentsError } from "../Exceptions";

import UnknownTransitionError from "../error/UnknownTransitionError";
import DuplicateTransitionError from "../error/DuplicateTransitionError";

import {
    CreateStateMachineFunction,
    ReporterInterface,
    StateInterface,
    Statemachine,
    StateMachineFactoryFunction,
    TransitionFunction,
    Transitions,
    TransitionsArray,
} from "../types";

import { StateMachine } from "../StateMachine";
import { RSTStateArgs, Rststatemachine, StatemachineConstructor } from "../parsers/rst/types";
import NestedStateMachine from "../parsers/rst/NestedStateMachine";

/**
 * State superclass. Contains a list of transitions, and transition methods.
 *
 * Transition methods all have the same signature. They take 3 parameters:
 *
 * - An `re` match object. ``match.string`` contains the matched input line,
 *   ``match.start()`` gives the start index of the match, and
 *   ``match.end()`` gives the end index.
 * - A context object, whose meaning is application-defined (initial value
 *   ``None``). It can be used to store any information required by the state
 *   machine, and the retured context is passed on to the next transition
 *   method unchanged.
 * - The name of the next state, a string, taken from the transitions list;
 *   normally it is returned unchanged, but it may be altered by the
 *   transition method if necessary.
 *
 * Transition methods all return a 3-tuple:
 *
 * - A context object, as (potentially) modified by the transition method.
 * - The next state name (a return value of ``None`` means no state change).
 * - The processing result, a list, which is accumulated by the state
 *   machine.
 *
 * Transition methods may raise an `EOFError` to cut processing short.
 *
 * There are two implicit transitions, and corresponding transition methods
 * are defined: `bof()` handles the beginning-of-file, and `eof()` handles
 * the end-of-file. These methods have non-standard signatures and return
 * values. `bof()` returns the initial context and results, and may be used
 * to return a header string, or do any other processing needed. `eof()`
 * should handle any remaining context and wrap things up; it returns the
 * final processing result.
 *
 * Typical applications need only subclass `State` (or a subclass), set the
 * `patterns` and `initial_transitions` class attributes, and provide
 * corresponding transition methods. The default object initialization will
 * take care of constructing the list of transitions.
 */
class State implements StateInterface {
    uuid: string;

    /**
          * {Name: pattern} mapping, used by `make_transition()`. Each pattern may
          * be a string or a compiled `re` pattern. Override in subclasses.
         */
    patterns: {} = {};

    /**
         * A list of transitions to initialize when a `State` is instantiated.
         * Each entry is either a transition name string, or a (transition name, next
         * state name) pair. See `make_transitions()`. Override in subclasses.
         */
    initialTransitions: (string | string[])[];

    //protected nestedSm?: StatemachineConstructor<Statemachine> ;
    //protected nestedSmKwargs?: any;
    createNestedStateMachine: StateMachineFactoryFunction<Statemachine>;

    createKnownIndentStateMachine: StateMachineFactoryFunction<Statemachine>;
    createIndentStateMachine: StateMachineFactoryFunction<Statemachine>;

    //protected knownIndentSm: StatemachineConstructor<Statemachine> | undefined;
    debug: boolean;

    //protected knownIndentSmKwargs: any;
    //protected indentSmKwargs: any;
    transitionOrder: string[] = [];

    transitions: Transitions = {};
    reporter: ReporterInterface;
    stateMachine: StateMachine;

    public constructor(stateMachine: StateMachine, debug: boolean = false) {
        this.stateMachine = stateMachine;
        this.debug = debug;
        this._init(stateMachine, debug);
        this.addInitialTransitions();

        /* istanbul ignore if */
        if (!stateMachine) {
            throw new Error("Need state machine");
        }

        if (this.createNestedStateMachine === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.createNestedStateMachine = () => NestedStateMachine.createStateMachine(
                this.stateMachine!,
                undefined,
                this.stateMachine!.stateFactory!.withStateClasses(["QuotedLiteralBlock"])
            );
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
    public _init(stateMachine: StateMachine, debug: boolean): void {
        /* empty */
        this.patterns = {};

        this.initialTransitions = undefined;//this.nestedSm = undefined;
    }

    public runtimeInit(): void {}

    public unlink(): void {
        this.stateMachine = undefined;
    }

    public addInitialTransitions(): void {
        if (this.initialTransitions) {
            const [names, transitions] = this.makeTransitions(this.initialTransitions);
            this.addTransitions(names as string[], transitions);
        }
    }

    public addTransitions(names: string[], transitions: Transitions): void {
        names.forEach(name => {
            if (name in this.transitions) {
                throw new DuplicateTransitionError(name);
            }

            if (!(name in transitions)) {
                throw new UnknownTransitionError(name);
            }
        });

        this.transitionOrder.splice(0, 0, ...names);

        Object.keys(transitions).forEach((key: string): void => {
            this.transitions[key] = transitions[key];
        });
    }

    public addTransition(name: string, transition: any) {
        this.transitionOrder.splice(0, 0, name);
        this.transitions[name] = transition;
    }

    public removeTransition(name: string) {
        delete this.transitions[name];
        this.transitionOrder.splice(this.transitionOrder.indexOf(name), 1);
    }

    public makeTransition(name: string, nextState?: any): [RegExp, TransitionFunction, string] {
        if (name == null) {
            throw new InvalidArgumentsError("need transition name");
        }

        if (nextState === undefined) {
            nextState = this.constructor.name;
        }

        // @ts-ignore
        let pattern = this.patterns[name];

        if (!(pattern instanceof RegExp)) {
            try {
                pattern = new RegExp(`^${pattern}`);
            } catch (error) {
                throw error;
            }
        }

        // @ts-ignore
        if (typeof this[name] !== "function") {
            throw new Error(`cant find method ${name} on ${this.constructor.name}`);
        }

        // @ts-ignore
        const method = this[name];

        return [pattern, method, nextState];
    }

    public makeTransitions(nameList: (string | string[])[]): [string[], Transitions] {
        const names: string[] = [];
        const transitions: Transitions = {};

        /* istanbul ignore if */
        if (!Array.isArray(nameList)) {
            // console.log('warning, not an array');
            throw new Error(`not array ${nameList}`);
        }

        /* check what happens with throw inside here */
        nameList.forEach((namestate: any | any[]) => {
            if (namestate == null) {
                /* istanbul ignore if */
                throw new InvalidArgumentsError("nameList contains null");
            }

            if (!Array.isArray(namestate)) {
                transitions[namestate.toString()] = this.makeTransition(namestate);
                names.push(namestate);
            } else {
                transitions[namestate[0]] = this.makeTransition(namestate[0], namestate[1]);
                names.push(namestate[0]);
            }
        });

        return [names, transitions];
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars,@typescript-eslint/no-explicit-any */
    public noMatch(context: any[], transitions: TransitionsArray | undefined): [{}[], (string | StateInterface | undefined), {}[]] {
        return [context, undefined, []];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public bof(context: string[]): string[][] {
        return [context, []];
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars,@typescript-eslint/no-explicit-any */
    public eof(context: any): any[] {
        return [];
    }

    public nop(match: {}, context: {}[], nextState: {}): {}[] {
        return [context, nextState, []];
    }

    stateName: string = "";
}

export default State;