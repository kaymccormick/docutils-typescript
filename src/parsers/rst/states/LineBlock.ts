import SpecializedBody from './SpecializedBody';

/**
 * Second and subsequent lines of a line_block. 
 */
class LineBlock extends SpecializedBody {
    // @ts-ignore
    public blank() {
        // @ts-ignore
        this.invalid_input();
    }

    /** New line of line block. */
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase,@typescript-eslint/no-unused-vars,no-unused-vars */
    // @ts-ignore
    public line_block(match, context, nextState) {
        const lineno = this.rstStateMachine.absLineNumber();
        const [line, messages, blankFinish] = this.line_block_line(match, lineno);
        this.parent!.add(line);
        this.parent!.parent!.add(messages);
        this.blankFinish = blankFinish;
        return [[], nextState, []];
    }
}
LineBlock.stateName = 'LineBlock';
//LineBlock.constructor.stateName = 'LineBlock';
export default LineBlock;
