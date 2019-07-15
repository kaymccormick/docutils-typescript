/**
 * @uuid 88bc1bb3-e5dc-4202-b198-f928f56e7bb1
 */
import SpecializedBody from './SpecializedBody';

/**
 * @uuid 84b1ac6d-f1d4-4001-bc87-ae39265da287
 */
class DefinitionList extends SpecializedBody {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    // @ts-ignore
    public text(match, context, nextState) {
        return [[match.result.input], "Definition", []];
    }
}

DefinitionList.stateName = "DefinitionList";

//DefinitionList.constructor.stateName = 'DefinitionList';
export default DefinitionList;