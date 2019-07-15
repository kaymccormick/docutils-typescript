/**
 * @uuid 23a16779-9dc4-4c87-ac08-227ce9edc081
 */
import SpecializedBody from './SpecializedBody';

/**
 * Second and subsequent field_list fields. 
 * @uuid 1d3c0f52-5124-494a-9193-d37900126109
 */
class FieldList extends SpecializedBody {
    /** Field list field. */
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    // @ts-ignore
    public field_marker(match, context, nextState) {
        const [field, blankFinish] = this.field(match);
        this.parent!.add(field);
        this.blankFinish = blankFinish;
        return [[], nextState, []];
    }
}

FieldList.stateName = "FieldList";

//FieldList.constructor.stateName = 'FieldList';
export default FieldList;