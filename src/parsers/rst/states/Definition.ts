/**
 * @uuid 77ba679b-73fa-4bee-a2da-5df047a1f110
 */
import SpecializedText from './SpecializedText';

/**
 * @uuid 55e1c9ed-81b6-4f82-89f7-6238f9fdbdec
 */
class Definition extends SpecializedText {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    // @ts-ignore
    public eof(context) {
        this.rstStateMachine.previousLine(2);
        return [];
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    public indent(match: any, context: any[], nextState: any) {
        const [itemNode, blankFinish] = this.definition_list_item(context);
        this.parent!.add(itemNode);
        this.blankFinish = blankFinish;
        return [[], "DefinitionList", []];
    }
}

Definition.stateName = "Definition";

//Definition.constructor.stateName = 'Definition';
export default Definition;