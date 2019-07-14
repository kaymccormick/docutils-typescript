/**
 * @uuid 04f69a18-afb7-4ab2-8a6f-263748f85eef
 */
import FieldList from './FieldList';
import * as nodes from '../../../nodes';
import {NodeInterface} from "../../../types";

/**
 * @uuid 8a7db806-c36e-471c-aab8-28719118eef7
 */
class ExtensionOptions extends FieldList {
    /* Parse field_list fields for extension options. */
    /* No nested parsing is done (including inline markup parsing). */

    /** Override `Body.parse_field_body` for simpler parsing. */
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public parse_field_body(indented: string[], offset: number, node: NodeInterface) {
        const lines = [];
        /* eslint-disable-next-line no-restricted-syntax */
        for (const line of [...indented, '']) {
            if (line.trim()) {
                lines.push(line);
            } else if (lines.length) {
                const text = lines.join('\n');
                node.add(new nodes.paragraph(text, text));
                lines.length = 0;
            }
        }
    }
}

ExtensionOptions.stateName = 'ExtensionOptions';
//ExtensionOptions//.constructor.stateName = 'ExtensionOptions';
export default ExtensionOptions;
