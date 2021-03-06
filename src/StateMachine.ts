import { isIterable } from "./utils";
import { defaultDebugFlag } from './constants';

import {
    ApplicationError,
    EOFError,
    InvalidArgumentsError,
    InvalidStateError,
    UnimplementedError as Unimp
} from "./Exceptions";
import StateCorrection from "./StateCorrection";
import StringList from "./StringList";
import {
    ContextKind,
    CoreLanguage,
    DebugFunction,
    NodeInterface,
    ObserverCallback,
    ReporterInterface,
    Statefactory,
    StateInterface,
    Statemachine,
    StateMachineConstructorArgs,
    States,
    TransitionsArray,
    StateConstructor,
    LoggerType,
} from "./types";
import State from "./states/State";
import TransitionCorrection from "./TransitionCorrection";
import UnexpectedIndentationError from "./error/UnexpectedIndentationError";
import RSTStateMachine from "./parsers/rst/RSTStateMachine";

export class StateMachineError extends Error { }
export class UnknownStateError extends StateMachineError { }

export class TransitionPatternNotFound extends StateMachineError { }
export class TransitionMethodNotFound extends StateMachineError { }
//export class UnexpectedIndentationError extends StateMachineError { }
//export class TransitionCorrection extends Error { }

/**
 * A finite state machine for text filters using regular expressions.
 * 
 * The input is provided in the form of a list of one-line strings (no
 * newlines). States are subclasses of the `State` class. Transitions consist
 * of regular expression patterns and transition methods, and are defined in
 * each state.
 * 
 * The state machine is started with the `run()` method, which returns the
 * results of processing in a list.
 *  
 */
class StateMachine implements Statemachine {
    public hasState(stateName: string): boolean {
        return stateName in this.states;
    }

    public getState2(stateName: string): StateInterface {
        if (!this.hasState(stateName)) {
            throw new InvalidStateError(`Invalid state ${stateName}`);
        }
        return this.states[stateName];
    }

    private states: States = {};

    public inputLines: StringList = new StringList([]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public debugFn: DebugFunction = ((line: string): void => { this.logger.debug(line); }).bind(this);

    public debug: boolean;

    /*
     * Initialize a `StateMachine` object; add state objects.
     *
     * Parameters:
     *
     *  - `stateClasses`: a list of `State` (sub)classes.
     *  - `initialState`: a string, the class name of the initial state.
     *  - `debug`: a boolean; produce verbose output if true (nonzero).
     **/
    public stateFactory?: Statefactory;

    public lineOffset: number = -1;

    public line: string = '';

    public inputOffset: number = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
    public node?: NodeInterface;

    public language?: CoreLanguage;

    public reporter?: ReporterInterface;

    private observers: ObserverCallback[];

    protected currentState?: string;

    protected initialState?: string;

    public logger: LoggerType;

    /*    def __init__(self, state_classes, initial_state, debug=False): */
    /* export interface StateMachineConstructorArgs { stateFactory?: Statefactory; initialState?: string; debug?: boolean; debugFn?: DebugFunction; } */

    public constructor(
        args: StateMachineConstructorArgs
    ) {
        const cArgs = { ... args };
        this.logger = cArgs.logger;
        /* Initialize instance junk that we can't do except through
           this method. */
        if (cArgs.debug === undefined) {
            cArgs.debug = defaultDebugFlag;
        }
        if (cArgs.debug && !cArgs.debugFn) {
            // make this unexpected error?
            // throw new Error("unexpected lack of debug function");
            /* eslint-disable-next-line no-console */
            cArgs.debugFn = this.logger.debug.bind(this.logger);
        }
        if(cArgs.stateFactory !== undefined) {
            this.stateFactory = cArgs.stateFactory;
        }
        if(cArgs.debugFn !== undefined) {
            this.debugFn = cArgs.debugFn;
        }
        this.lineOffset = -1;
        this.debug = cArgs.debug;
        this.initialState = cArgs.initialState;
        this.currentState = cArgs.initialState;
        this.states = {};
        if (!cArgs.stateFactory) {
            throw new Error('need statefactory');
        }

        const stateClasses = cArgs.stateFactory.getStateClasses();
        if (!isIterable(stateClasses)) {
            throw new Error(`expecting iterable, got ${stateClasses}`);
        }
        this.addStates(stateClasses);
        this.observers = [];
    }


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public createStateMachine(rstStateMachine: RSTStateMachine, initialState?: string, stateFactory: Statefactory|undefined=rstStateMachine.stateFactory): Statemachine {

        // @ts-ignore
        let stateMachine = new this.constructor(
            {
                initialState,
                stateFactory: this.stateFactory,
                debug: this.debug, debugFn: this.debugFn });
        return stateMachine;
    }

    public forEachState(cb: (state: State) => void): void {
        // @ts-ignore
        Object.values(this.states).forEach(cb);
    }

    public unlink(): void {
        this.forEachState((s): void =>s.unlink());
        this.states = {};
    }

    /**
     * Run the state machine on `input_lines`. Return results (a list).
     *
     * Reset `self.line_offset` and `self.current_state`. Run the
     * beginning-of-file transition. Input one line at a time and check for a
     * matching transition. If a match is found, call the transition method
     * and possibly change the state. Store the context returned by the
     * transition method to be passed on to the next transition matched.
     * Accumulate the results returned by the transition methods in a list.
     * Run the end-of-file transition. Finally, return the accumulated
     * results.
     *
     * Parameters:
     *
     * - `input_lines`: a list of strings without newlines, or `StringList`.
     * - `input_offset`: the line offset of `input_lines` from the beginning
     *   of the file.
     * - `context`: application-specific storage.
     * - `input_source`: name or path of source of `input_lines`.
     * - `initial_state`: name of initial state.
     */
    public run(inputLines: StringList|string|string[],
        inputOffset: number,
        runContext?: ContextKind,
        inputSource?: {},
        // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any
        initialState?: string, ...rest: any[]):
        (string|{})[] {
        this.logger.debug('run');
        // RUNTIMEINIT
        let lines: string | string[] | StringList = inputLines;
        this.runtimeInit();
        if (lines instanceof StringList) {
            this.inputLines = lines;
        } else if (lines == null) {
            throw new InvalidArgumentsError('inputLines should not be null or undefined');
        } else {
            if (!Array.isArray(lines)) {
                lines = [lines];
            }
            // @ts-ignore
            this.inputLines = new StringList(inputLines, inputSource || '');
        }
        this.inputOffset = inputOffset;
        this.lineOffset = -1;
        this.currentState = initialState || this.initialState;
        if (this.debug && this.debugFn !== undefined) {
            this.debugFn(`\nStateMachine.run: input_lines (line_offset=${this.lineOffset}):\n| ${this.inputLines.join('\n| ')}`);
        }
        let transitions: TransitionsArray | undefined
        const results: (string|{})[] = [];
        let state = this.getState();
        let nextStateName: string;
        let nextStateReturn: string | StateInterface | undefined;
        let nextStateVar: string | undefined;
        let nextState: StateInterface | undefined;
        let result: (string|{})[] = [];
        let context: (string|{})[] = [];
        try {
            if (this.debug) {
                this.debugFn('\nStateMachine.run: bof transition');
            }
            [context, result] = state.bof(context);
            if (!Array.isArray(context)) {
                throw new Error('expecting array');
            }
            results.push(...result);
            /* eslint-disable-next-line no-constant-condition */
            while (true) {
                try {
                    try {
                        this.nextLine();
                        this.logger.debug('line', {value: this.line});
                        if (this.debug) {
                            if (Number.isNaN(this.lineOffset)) {
                                /* istanbul ignore if */
                                throw new Error();
                            }

                            const [source, offset] = this.inputLines.info(
                                this.lineOffset,
                            );

                            this.debugFn(`\nStateMachine.run: line (source=${source}, offset=${offset}):\n| ${this.line}`);
                        }
                        /* istanbul ignore if */
                        if (!Array.isArray(context)) {
                            throw new Error('context should be array');
                        }

                        const r = this.checkLine(context, state, transitions);
                        /* istanbul ignore if */
                        if (!isIterable(r)) {
                            throw new Error(`Expect iterable result, got: ${r}`);
                        }
                        [context, nextStateReturn, result] = r;
                        nextStateVar = (nextStateReturn as StateInterface).stateName || (nextStateReturn as string);;
                        /* istanbul ignore if */
                        if (!Array.isArray(context)) {
                            throw new Error('context should be array');
                        }
                        /* istanbul ignore if */
                        if (!isIterable(result)) {
                            throw new Error(`Expect iterable result, got: ${result}`);
                        }
                        results.push(...result);
                    } catch (error) {
                        if (error instanceof EOFError) {
                            if (this.debug) {
                                this.debugFn(`\nStateMachine.run: ${state.constructor.name}.eof transition`);
                            }
                            result = state.eof(context);
                            results.push(...result);
                            break;
                        } else {
                            throw error;
                        }
                    }
                } catch (error) {
                    if (error instanceof TransitionCorrection) {
                        this.previousLine();
                        transitions = [error.stateName];
                        if(this.debug) {
                            this.debugFn(`\nStateMachine.run: TransitionCorrection to `
                            + `state "${state.stateName}", transition ${transitions[0]}.`);
                        }
                        /* Cant continue, makes no sense? ??  */
                        /* eslint-disable-next-line no-continue */
                        continue;
                    } else if (error instanceof StateCorrection) {
                        this.previousLine();
                        nextStateName = error.args[0];
                        nextStateVar = nextStateName;
                        let tstr;
                        if (error.args.length === 1) {
                            transitions = undefined;
                            tstr = '';
                        } else {
                            transitions = [error.args[1]];
                            tstr = error.args[1].toString();
                        }
                        if(this.debug) {
                            this.debugFn(`\nStateMachine.run: StateCorrection to state `+
                                  `"${nextState}", transition ${tstr}.`);
                        }
                    } else {
                        throw error;
                    }
                }
                /* we need this somehow, its part of a try, except, else */
                // transitions = undefined

                state = this.getState(nextStateVar);
            }
        } catch (error) {
            throw error;
        }
        this.observers = [];
        return results;
    }

    /**
     * Return current state object; set it first if
     * `next_state` given.  Parameter `next_state`: a string,
     * the name of the next state.  Exception:
     * `UnknownStateError` raised if `next_state` unknown.
     */
    public getState(nextState?:  string): StateInterface {
        if (nextState) {
            if (this.debug && nextState !== this.currentState) {
                this.debugFn(`StateMachine.getState: ` +
                  `changing state from "${this.currentState}"` +
                  `to "${nextState}" (input line ${this.absLineNumber()})`);
            }
            this.currentState = nextState;
        }
        if(this.currentState === undefined) {
            throw new InvalidStateError();
        }
        if (this.states[this.currentState] === undefined) {
            throw new UnknownStateError(this.currentState);
        }
        return this.states[this.currentState];
    }

    /** Load `self.line` with the `n`'th next line and return it. */
    public nextLine(n = 1): string | undefined{
        // console.log('*** advancing to next line');
        this.lineOffset += n;
        if (this.lineOffset >= this.inputLines.length) {
            this.line = '';
            this.notifyObservers();
            throw new EOFError();
        }

        this.line = this.inputLines[this.lineOffset];
        this.notifyObservers();
        // console.log(`line is "${this.line}"`);
        return this.line;
    }

    public isNextLineBlank(): boolean {
        return this.inputLines.length > this.lineOffset + 1 ? !this.inputLines[this.lineOffset + 1].trim() : true;
    }

    public atEof(): boolean {
        return this.lineOffset >= this.inputLines.length - 1;
    }

    public atBof(): boolean {
        return this.lineOffset <= 0;
    }

    public previousLine(n = 1): string {
        this.lineOffset -= n;
        if (this.lineOffset < 0) {
            this.line = '';
        } else {
            this.line = this.inputLines[this.lineOffset];
        }
        this.notifyObservers();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.line!;
    }

    public gotoLine(lineOffset: number): string  | undefined {
        this.lineOffset = lineOffset - this.inputOffset;
        this.line = this.inputLines[this.lineOffset];
        this.notifyObservers();
        return this.line;
    }

    public getSource(lineOffset: number): string | undefined  {
        return this.inputLines.source(lineOffset - this.inputOffset);
    }

    public absLineOffset(): number {

        return this.lineOffset + this.inputOffset;
    }

    public absLineNumber(): number {
        return this.lineOffset + this.inputOffset + 1;
    }

    public getSourceAndLine(lineno?: number): [string | undefined, number|undefined] {
        let offset;
        let srcoffset;
        let srcline;
        let
            src;
        if (lineno === undefined) {
            offset = this.lineOffset;
        } else {
            offset = lineno - this.inputOffset - 1;
        }
        try {
            [src, srcoffset] = this.inputLines.info(offset);
            if(srcoffset !== undefined) {
                srcline = srcoffset + 1;
            }
        } catch (error) {
        // fixme code smell
        }
        return [src, srcline];
    }


    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    public insertInput(inputLines: StringList, source: string): void {
        // self.input_lines.insert(self.line_offset + 1, '',
        //     source='internal padding after '+source,
        //     offset=len(input_lines))
        // self.input_lines.insert(self.line_offset + 1, '',
        //     source='internal padding before '+source,
        //     offset=-1)
        // self.input_lines.insert(self.line_offset + 2,
        //     StringList(input_lines, source))

        throw new Unimp();
    }

    public getTextBlock(flushLeft = false): StringList {
        let block: StringList|undefined;
        try {
            block = this.inputLines.getTextBlock(this.lineOffset,
                flushLeft);
            this.nextLine(block.length - 1);
            return block;
        } catch (error) {
            if (error instanceof UnexpectedIndentationError) {
                block = error.block;
                this.nextLine(block.length - 1); // advance to last line of block
            }
            throw error;
        }
    }
    /*
     * Examine one line of input for a transition match & execute its method.
     *
     * Parameters:
     *
     * - `context`: application-dependent storage.
     * - `state`: a `State` object, the current state.
     * - `transitions`: an optional ordered list of transition names to try,
     *   instead of ``state.transition_order``.
     *
     * Return the values returned by the transition method:
     *
     * - context: possibly modified from the parameter `context`;
     * - next state name (`State` subclass name);
     * - the result output of the transition, a list.
     *
     * When there is no match, ``state.no_match()`` is called and its return
     * value is returned.
     */
    public checkLine(context: {}[], state: StateInterface,
        transitions?: TransitionsArray):  [{}[], (string | StateInterface | undefined), {}[]] {
        this.logger.silly({kind: 'enterFunction', function: 'checkLine'});
        /* istanbul ignore if */
        if (!Array.isArray(context)) {
            throw new Error('context should be array');
        }
        if (transitions === undefined) {
            transitions = state.transitionOrder;
        }
        if (this.debug) {
            this.debugFn(`\nStateMachine.check_line: ` +
              `state="${state.constructor.name}", transitions=${transitions}.`);
        }
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const stateCorrection = true;

        /* eslint-disable-next-line no-restricted-syntax */
        // @ts-ignore
        for(let i = 0; i < transitions.length; i++) {
            // @ts-ignore
            let t = transitions[i];
            // @ts-ignore
            const v = state.transitions[t];

            const [pattern, method, nextState] = v;
            if(!pattern.exec){
                throw new InvalidStateError(`unexpected pattern ${v}`);
            }
	    this.logger.silly(`executing for ${t} pattern ${pattern} on line ${this.line}`);
            const result = pattern.exec(this.line);
            if (result) {
	    this.logger.debug(`line matched transition ${t}`, { value: t});
                if (this.debug) {
                    this.debugFn(`\nStateMachine.checkLine: `
                      + `Matched transition '"${t}"`
                      + `in state "${state.constructor.name}`);
                }
                const r = method.bind(state)({ pattern, result, input: this.line },
                    context, nextState);
                // istanbul ignore if
                if (r === undefined) {
                    throw new Error();
                }
                // console.log(`return is >>> `);
                // console.log(r);
                return r;
            }
        }

        return state.noMatch(context, transitions);
    }

    public addState(stateClass: StateConstructor): void {
        let stateName;
        if (typeof stateClass === 'string') {
            stateName = stateClass;
        } else {
            stateName = stateClass.stateName;
        }
        //this.logger.silly(`adding state ${stateName}`, { stateName });

        if(this.hasState(stateName!)) {
            throw new DuplicateStateError(stateName);
        }
        if (!stateName) {
            throw new Error(`need statename for ${stateClass}`);
        }

        if(this.stateFactory === undefined) {
            throw new InvalidStateError('stateFacory');
        }
        const r = this.stateFactory.createState(stateName, this as Statemachine);
        this.states[stateName] = r;
    }

    public addStates(stateClasses: StateConstructor[]): void {
        if (!stateClasses) {
            throw new Error('');
        }
        stateClasses.forEach(this.addState.bind(this));
    }

    public runtimeInit(): void {
        // @ts-ignore
        Object.values(this.states).forEach((s: StateInterface): void => s.runtimeInit());
    }


    public error(): void {
        //fixme
    }

    public attachObserver(observer: ObserverCallback   ): void {
        this.observers.push(observer);
    }

    public detachObserver(observer: ObserverCallback): void {
        this.observers.splice(this.observers.indexOf(observer), 1);
    }

    public notifyObservers(): void {
        /* eslint-disable-next-line no-restricted-syntax */
        for (const observer of this.observers) {
        /* istanbul ignore if */
            if (observer === undefined) {
                throw new ApplicationError('undefined observer');
            }
            try {
                let info: [string | undefined, number | undefined] | undefined;
                try {
                    info = this.inputLines.info(this.lineOffset);
                } catch (err) {
                    /* Empty */
                }
                /* istanbul ignore if */
                if (info === undefined) {
                    // throw new Error("undefined info");
                    /* eslint-disable-next-line no-continue */
                    continue;
                }
                if (!isIterable(info)) {
                    throw new Error('isIterable');
                }
                observer(info[0], info[1]);
            } catch (err) {
                /* eslint-disable-next-line no-console */
                console.log(err.stack);
            }
        }
    }
}


function expandtabs(strVal: string): string {
    let tabIndex;
    /* eslint-disable-next-line no-cond-assign */
    while ((tabIndex = strVal.indexOf('\t')) !== -1) {
        strVal = strVal.substring(0, tabIndex) +
          Array(8 - (tabIndex % 8)).fill(' ').join('')
          + strVal.substring(tabIndex + 1);
    }
    return strVal;
}
export function string2lines(astring?: string, args?:
{ tabWidth?: number; convertWhitespace?: boolean;
    whitespace?: RegExp | string; }): string[] {
    if (!astring) {
        astring = '';
    }
    if (!args) {
        args = {};
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars,prefer-const */
    let { tabWidth, convertWhitespace, whitespace } = args;
    /* eslint-disable-next-line no-empty */
    if (whitespace === undefined) {
    }
    if (tabWidth === undefined) {
        tabWidth = 8;
    }
    const result = astring.split('\n');
    if (astring[astring.length - 1] === '\n') {
        result.pop();
    }
    return result.map(expandtabs);
}

export { StateMachine };
