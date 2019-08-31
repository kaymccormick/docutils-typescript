import BaseWriter from '../Writer';
import * as docutils from '../index';
import * as nodes from '../nodes';
import { Document, NodeClass, NodeInterface } from "../types";
import {Settings} from "../../gen/Settings";
import { InvalidArgumentsError } from "../Exceptions";

export function escapeXml(unsafe: string): string {
    if (typeof unsafe === 'undefined') {
        throw new Error('need unsafE');
    }
    return unsafe.replace(/[<>&'"]/g, (c): string => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}
class XMLTranslator extends nodes.GenericNodeVisitor {
    public output: string[];
    private indent: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private warn: (...args: any[]) => NodeInterface;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private error: (...args: any[]) => NodeInterface;
    private settings: Settings;
    private generator: string;
    private newline: string;
    private level: number;
    private inSimple: number;
    private fixedText: number;
    private simple_nodes: NodeClass[] = [];
    private doctype: string = '';

    public constructor(document: Document) {
        super(document);
        this.generator = `<!-- generated by Docutils ${docutils.__version__} -->\n`;
        this.document = document;
        this.warn = this.document.reporter.warning;
        this.error = this.document.reporter.error;
        this.output = [];

        this.settings = document.settings;

        const settings: Settings = this.settings;
        this.newline = '';
        this.indent = '';
        const core = this.settings;
        const outputEncoding = core.outputEncoding;
        let xmlWriter = settings;
        if(xmlWriter !== undefined) {
            if (xmlWriter.newlines) {
                this.newline = '\n';
            }
            if (xmlWriter.indents) {
                this.newline = '\n';
                this.indent = '    ';
            }
            if (xmlWriter.xmlDeclaration && outputEncoding !== undefined) {
                this.output.push(this.xmlDeclaration(outputEncoding));
            }
            if (xmlWriter.doctypeDeclaration) {
                this.output.push(this.doctype);
            }
        }
        this.level = 0;
        this.inSimple = 0;
        this.fixedText = 0;

        this.output.push(this.generator);
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public default_visit(node: NodeInterface): void {
        // eslint-disable-next-line @typescript-eslint/camelcase
        this.simple_nodes = [nodes.TextElement];// nodes.image, nodes.colspec, nodes.transition]
        if (!this.inSimple) {
            this.output.push(Array(this.level + 1).join(this.indent));
        }
        this.output.push(node.starttag());
        this.level += 1;
        // fixme should probably pick this code up
        /* eslint-disable-next-line no-constant-condition */
        if (false) { // node instanceof nodes.FixedTextElement || node instanceof nodes.literal) {
            this.fixedText += 1;
        } else {
            /* eslint-disable-next-line no-restricted-syntax */
            if(this.simple_nodes.findIndex((nt: NodeClass): boolean => node instanceof nt) !== -1) {
                this.inSimple++;
            }

        }
        if (!this.inSimple) {
            this.output.push('\n');
        }
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public default_departure(node: NodeInterface): void {
        this.level -= 1;
        if (!this.inSimple) {
            this.output.push(Array(this.level + 1).join(this.indent));
        }
        this.output.push(node.endtag());
        //      if(node instanceof nodes['FixedTextElement'] || node instanceof nodes.literal) {
        //          this.fixedText -= 1;
        //      }
        // bla
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public visit_Text(node: NodeInterface): void {
        const text = escapeXml(node.astext());
        this.output.push(text);
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase,@typescript-eslint/no-unused-vars,no-unused-vars */
    public depart_Text(node: NodeInterface): void {
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public xmlDeclaration(outputEncoding: string): string {
        return '';

    }
}

export default class XMLWriter extends BaseWriter {
    private visitor?: XMLTranslator;
    private translatorClass: typeof XMLTranslator = XMLTranslator;

    public translate(): void | never {
        if(this.document === undefined) {
            throw new InvalidArgumentsError('');
        }
        const TranslatorClass = this.translatorClass;

        const visitor = new TranslatorClass(this.document);
        this.visitor = visitor;
        this.document.walkabout(visitor);

        this.output = visitor.output.join('');
        if (process.stderr) {
            // process.stderr.write(this.output);
        }
    }
}
/*
Writer.settingsSpec = [
    '"Docutils XML" Writer Options',
    null,
    [['Generate XML with newlines before and after tags.',
      ['--newlines'],
      { action: 'store_true', validator: 'frontend.validate_boolean' }],
     ['Generate XML with indents and newlines.',
      ['--indents'], // #@ TODO use integer value for number of spaces?
      { action: 'store_true', validator: 'frontend.validate_boolean' }],
     ['Omit the XML declaration.  Use with caution.',
      ['--no-xml-declaration'],
      {
dest: 'xml_declaration',
default: 1,
action: 'store_false',
       validator: 'frontend.validate_boolean',
}],
     ['Omit the DOCTYPE declaration.',
      ['--no-doctype'],
      {
 dest: 'doctype_declaration',
default: 1,
       action: 'store_false',
validator: 'frontend.validate_boolean',
}]]];

 */

export {  XMLWriter };
