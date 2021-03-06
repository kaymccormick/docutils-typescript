import RSTState from "./RSTState";
import * as RegExps from "../RegExps";
import nodesFactory from '../../../nodesFactory';
import * as nodes from "../../../nodes";
import MarkupError from "../MarkupError";
import { escape2null, extractExtensionOptions, isIterable, pySplit, splitEscapedWhitespace } from "../../../utils";
import StringList from "../../../StringList";
import * as tableparser from "../tableparser";
/* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
import { ApplicationError, InvalidStateError } from "../../../Exceptions";
import TransitionCorrection from "../../../TransitionCorrection";
import * as directives from "../directives";
import UnexpectedIndentationError from "../../../error/UnexpectedIndentationError";
import RSTStateMachine from "../RSTStateMachine";
import {
    Options,
    OptionSpec,
    ContextArray,
    NodeInterface,
    ParseMethodReturnType,
    ParseResult,
    RegexpResult,
    StateInterface,
    StateType,
    IsolateTableResult,
} from "../../../types";
import {     BodyState,
    ParserConstructor, DirectiveConstructor, TableData} from '../types';
import { fullyNormalizeName } from "../../../nodeUtils";

const nonWhitespaceEscapeBefore = RegExps.nonWhitespaceEscapeBefore;
const simplename = RegExps.simplename;

export type RowData = [number, number, number, number, StringList];

function _LoweralphaToInt(input: string): number {
// @ts-ignore
    return input[0] - 'a';
}

function _UpperalphaToInt(): number {
// @ts-ignore
    return input[0] - 'A';
}

/* istanbul ignore next */
function _LowerromanToInt(): number|never {
    throw new Error('');
}

/* istanbul ignore next */
function _UpperromanToInt(): number|never {
    throw new Error('');
}
export interface ExplicitConstructFunction {
    (match: RegExpExecArray): ParseResult;
}

type BlockMessagesBlankFinish = [StringList|string[], NodeInterface[], boolean];

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type ExplicitConstructTuple = [ExplicitConstructFunction, RegExp, RegExpExecArray];

export interface BodyPats {
    nonalphanum7bit?: string;
    alpha?: string;
    alphanum?: string;
    alphanumplus?: string;
    enum?: string;
    optname?: string;
    optarg?: string;
    shortopt?: string;
    longopt?: string;
    option?: string;
    rparen?: string;
    parens?: string;
    period?: string;
}

export interface EnumFormatInfo {
    prefix: string;
    suffix: string;
    start: number;
    end: number;
}

export interface EnumFormatInfos {
    parens: EnumFormatInfo;
    rparen: EnumFormatInfo;
    period: EnumFormatInfo;
    [name: string]: EnumFormatInfo;
}
export interface EnumSequencePats {
    arabic: string;
    loweralpha: string;
    upperalpha: string;
    lowerroman: string;
    upperroman: string;
    [name: string]: string;
}
export interface EnumConverters {
    arabic: (input: string) => number;
    loweralpha: (input: string) => number;
    upperalpha: (input: string) => number;
    lowerroman: (input: string) => number;
    upperroman: (input: string) => number;
}

export interface SequenceRegexps {
    arabic: (input: string) => RegExp;
    loweralpha: (input: string) => RegExp;
    upperalpha: (input: string) => RegExp;
    lowerroman: (input: string) => RegExp;
    upperroman: (input: string) => RegExp;
};

export interface EnumParseInfo {
    formatinfo?: EnumFormatInfos;
    formats?: string[];
    sequences?: string[];
    sequencepats?: EnumSequencePats;
    converters?: EnumConverters;
    sequenceregexps?: SequenceRegexps;
}

/**
 * Generic classifier of the first line of a block.
 */
class Body extends RSTState implements BodyState {
    private gridTableTopPat?: RegExp;
    /** Enumerated list parsing information. */
    private enum?: EnumParseInfo;
    private attribution_pattern?: RegExp;
    private simpleTableTopPat?: RegExp;
    private pats: BodyPats;
    protected initialTransitions?: (string | string[])[] = ["bullet", "enumerator", "field_marker", "option_marker", "doctest", "line_block", "grid_table_top", "simple_table_top", "explicit_markup", "anonymous", "line", "text"];

    public constructor(stateMachine: RSTStateMachine, debug: boolean = false) {
        super(stateMachine, debug);

        // this.doubleWidthPadChar = tableparser.TableParser.doubleWidthPadChar

        const enum_: EnumParseInfo = {};
        // @ts-ignore
        enum_.formatinfo = {
            parens: {
                prefix: "\\(", suffix: "\\)", start: 1, end: 1
            },
            rparen: {
                prefix: "", suffix: "\\)", start: 0, end: -1
            },
            period: {
                prefix: "", suffix: "\\.", start: 0, end: -1
            }
        };
        // @ts-ignore
        enum_.formats = Object.keys(enum_.formatinfo);
        // @ts-ignore
        enum_.sequences = ["arabic", "loweralpha", "upperalpha",
            "lowerroman", "upperroman"];
        // @ts-ignore
        enum_.sequencepats = {
            arabic: "[0-9]+",
            loweralpha: "[a-z]",
            upperalpha: "[A-Z]",
            lowerroman: "[ivxlcdm]+",
            upperroman: "[IVXLCDM]+"
        };
        // @ts-ignore
        enum_.converters = {
            arabic: parseInt,
            loweralpha: _LoweralphaToInt,

            upperalpha: _UpperalphaToInt,
            lowerroman: _LowerromanToInt,
            upperroman: _UpperromanToInt
        };

        // @ts-ignore
        enum_.sequenceregexps = {};
        // @ts-ignore
        enum_.sequences.forEach((sequence): void => {
            // @ts-ignore
            enum_.sequenceregexps[sequence] = new RegExp(`${enum_.sequencepats[sequence]}$`);
        });
        this.enum = enum_;

        this.gridTableTopPat = new RegExp("\\+-[-+]+-\\+ *$");
        this.simpleTableTopPat = new RegExp("=+( +=+)+ *$");

        const pats: BodyPats = { }
        pats.nonalphanum7bit = "[!-/:-@[-`{-~]";
        pats.alpha = "[a-zA-Z]";
        pats.alphanum = "[a-zA-Z0-9]";
        pats.alphanumplus = "[a-zA-Z0-9_-]";
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pats.enum = `^(${enum_.sequences.filter((name): boolean => name !== undefined).map((name): string => enum_.sequencepats![name!]).join('|')}|#)`;
        pats.optname = `${pats.alphanum}${pats.alphanumplus}*`;
        pats.optarg = `(${pats.alpha}${pats.alphanumplus}*|<[^<>]+>)`;
        pats.shortopt = `(-|\\+)${pats.alphanum}( ?${pats.optarg})?`;
        pats.longopt = `(--|/)${pats.optname}([ =]${pats.optarg})?`;
        pats.option = `(${pats.shortopt}|${pats.longopt})`;
        this.pats = pats;

        // @ts-ignore
        enum_.formats.forEach((format): void => {
            // @ts-ignore
            pats[format] = `(${
                // @ts-ignore

                [enum_.formatinfo[format].prefix,
                    // @ts-ignore
                    pats.enum,
                    // @ts-ignore
                    enum_.formatinfo[format].suffix].join("")})`;
        });

        this.patterns = {
            bullet: new RegExp("^[-+*\\u2022\\u2023\\u2043]( +|$)"),
            enumerator: new RegExp(`^(${pats.parens}|${pats.rparen}|${pats.period})( +|$)`),
            // eslint-disable-next-line @typescript-eslint/camelcase
            field_marker: new RegExp("^:(?![: ])([^:\\\\]|\\\\.|:(?!([ `]|$)))*(?<! ):( +|$)"),
            // eslint-disable-next-line @typescript-eslint/camelcase
            grid_table_top: this.gridTableTopPat,
            // eslint-disable-next-line @typescript-eslint/camelcase
            option_marker: new RegExp(`^${pats.option}(, ${pats.option})*(  +| ?$)`),
            // eslint-disable-next-line @typescript-eslint/camelcase
            doctest: new RegExp("^>>>( +|$)"),
            // eslint-disable-next-line @typescript-eslint/camelcase
            line_block: new RegExp("^\\|( +|$)"),
            // eslint-disable-next-line @typescript-eslint/camelcase
            simple_table_top: this.simpleTableTopPat,
            // eslint-disable-next-line @typescript-eslint/camelcase
            explicit_markup: new RegExp("^\\.\\.( +|$)"),
            // eslint-disable-next-line @typescript-eslint/camelcase
            anonymous: new RegExp("^__( +|)"),
            line: new RegExp(`^(${pats.nonalphanum7bit})\\1* *$`),
            text: new RegExp(""),
        };

        this.explicit = { patterns: {
            target: new RegExp(`^(_|(?!_)(\`?)(?![ \`])(.+?)${nonWhitespaceEscapeBefore})(?<!(?<!\\x00):)${nonWhitespaceEscapeBefore}[ ]?:([ ]+|$)`),
            reference: new RegExp(`^((${simplename})_|\`(?![ ])(.+?)${nonWhitespaceEscapeBefore}\`_)$`), // ((?P<simple>%(simplename)s)_|`(?![ ])(?P<phrase>.+?)%(non_whitespace_escape_before)s`_)$'),
            substitution: new RegExp(`((?![ ])(.+?)${nonWhitespaceEscapeBefore}\\|)([ ]+|$)`)
        }, constructs: [
            [this.footnote.bind(this), new RegExp(`\\.\\.[ ]+\\[([0-9]+|\\#|\\#${simplename}|\\*)\\]([ ]+|$)`)],
            [this.citation.bind(this),
                new RegExp(`\\.\\.[ ]+\\[(${simplename})\\]([ ]+|$)`)],
            [this.hyperlink_target.bind(this),
                new RegExp("\\.\\.[ ]+_(?![ ]|$)")],
            [this.substitution_def.bind(this),
                new RegExp("\\.\\.[ ]+\\|(?![ ]|$)")],
            // @ts-ignore
            [this.directive.bind(this),
                new RegExp(`\\.\\.[ ]+(${simplename})[ ]?::([ ]+|$)`)]
        ]};
    }

    public footnote(match: RegExpExecArray): ParseResult {
        const [src, srcline] = this.rstStateMachine.getSourceAndLine();
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [indented, indent, offset, blankFinish] = this.rstStateMachine.getFirstKnownIndented(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            { indent: match.index! + match[0].length }
        );
        const label = match[1];
        let name = fullyNormalizeName(label);
        const footnote = nodesFactory.footnote(indented.join("\n"));
        if(src !== undefined) {
            footnote.source = src;
        }
        if(srcline !== undefined) {
            footnote.line = srcline;
        }
        if (name[0] === "#") { // auto-numbered
            name = name.substring(1); // autonumber label
            footnote.attributes.auto = 1;
            if (name) {
                footnote.attributes.names.push(name);
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.noteAutofootnote(footnote);
        } else if (name === "*") { // auto-symbol
            name = "";
            footnote.attributes.auto = "*";
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.noteSymbolFootnote(footnote);
        } else {
            // manually numbered
            footnote.add(nodesFactory.label("", label));
            footnote.attributes.names.push(name);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.noteFootnote(footnote);
        }
        if (name) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.noteExplicitTarget(footnote, footnote);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.setId(footnote, footnote);
        }

        /* istanbul ignore else */
        if (indented && indented.length) {
            this.nestedParse(indented, offset, footnote );
        }
        return [[footnote], blankFinish];
    }

    public citation(match: RegExpExecArray): ParseResult {
        const [src, srcline] = this.rstStateMachine.getSourceAndLine();
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [indented, indent, offset, blankFinish] = this.rstStateMachine.getFirstKnownIndented({
            indent: match.index + match[0].length
        });
        const label = match[1];
        const name = fullyNormalizeName(label);
        const citation = nodesFactory.citation(indented.join("\n"));

        citation.source = src;
        if(srcline !== undefined) {
            citation.line = srcline;
        }
        citation.add(nodesFactory.label("", label));
        citation.attributes.names.push(name);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-non-null-assertion
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.document!.noteCitation(citation);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.document!.noteExplicitTarget(citation, citation);
        /* istanbul ignore else */
        if (indented && indented.length) {
            this.nestedParse(indented, offset, citation );
        }
        return [[citation], blankFinish];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public hyperlink_target(match: RegExpExecArray): ParseResult {
        if(this.explicit === undefined) {
            throw new InvalidStateError('explicit undefined');
        }
        const pattern = this.explicit.patterns.target;
        const lineno = this.rstStateMachine.absLineNumber();
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [block, indent, offset, blankFinish] = this.rstStateMachine.getFirstKnownIndented(
            {
                indent: match.index + match[0].length,
                untilBlank: true,
                stripIndent: false
            }
        );
        const blocktext = match.input.substring(0, match.index + match[0].length) + block.join("\n");
        const block2 = new StringList([]);
        block.forEach((line: string): void => {
            block2.push(escape2null(line));
        });
        let escaped = block2[0];
        let blockindex = 0;
        let targetmatch;
        /* eslint-disable-next-line no-constant-condition */
        while (true) {
            targetmatch = pattern.exec(escaped);
            if (targetmatch) {
                break;
            }
            blockindex += 1;
            if (blockindex === block2.length) {
                throw new MarkupError("malformed hyperlink target.");
            }
            escaped += block2[blockindex];
        }
        block2.splice(0, blockindex);
        block2[0] = (`${block2[0]} `).substring(targetmatch.index + targetmatch[0].length - escape.length + 1).trim();
        const target = this.make_target(block2, blocktext, lineno,
            targetmatch[3]);
        if(target === undefined) {
            throw new InvalidStateError('target should be defined');
        }
        return [[target], blankFinish];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public make_target(block: StringList, blockText: string, lineno: number, target_name: string): NodeInterface|undefined {
        const [targetType, data, node] = this.parse_target(block, blockText, lineno);
        // console.log(`target type if ${targetType} and data is ${data}`);
        if (targetType === "refname") {
            const target = nodesFactory.target(blockText, "", [], { refname: fullyNormalizeName(data) });
            target.indirectReferenceName = data;
            this.add_target(target_name, "", target, lineno);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.noteIndirectTarget(target);
            return target;
        }
        if (targetType === "refuri") {
            const target = nodesFactory.target(blockText, "");
            this.add_target(target_name, data, target, lineno);
            return target;
        }
        return node;
    }

    /**
   Determine the type of reference of a target.

   :Return: A 2-tuple, one of:

   - 'refname' and the indirect reference name
   - 'refuri' and the URI
   - 'malformed' and a system_message node
   */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase,@typescript-eslint/no-unused-vars,no-unused-vars */
    public parse_target(block: StringList, blockText: string, lineno: number): [string, string, NodeInterface?] {
        if (block.length && block[block.length - 1].trim().endsWith("_")) {
	    const reference = splitEscapedWhitespace(block.join(' ')).map((part): string => pySplit(unescape(part)).join('')).join(' ');
            const refname = this.is_reference(reference);
            if (refname) {
                return ["refname", refname];
            }
        }
        const refParts = splitEscapedWhitespace(block.join(" "));
        const reference = refParts.map((part): string => pySplit(unescape(part)).join("")).join(" ");
        return ["refuri", reference];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public is_reference(reference: string): string|undefined {
        if(this.explicit === undefined) {
            throw new InvalidStateError('explicit undefined');

        }
        const match = this.explicit.patterns.reference.exec(
            `^${nodes.whitespaceNormalizeName(reference)}`
        );
        if (!match) {
            return undefined;
        }
        return unescape(match[2] ? match[2] : match[3]);
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public add_target(targetname: string, refuri: string, target: NodeInterface, lineno: number): void {
        target.line = lineno;
        if (targetname) {
            const name = fullyNormalizeName(unescape(targetname));
            target.attributes.names.push(name);
            if (refuri) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const uri = this.inliner!.adjustUri(refuri);
                /* istanbul ignore else */
                if (uri) {
                    target.attributes.refuri = uri;
                } else {
                    throw new ApplicationError(`problem with URI: ${refuri}`);
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.noteExplicitTarget(target, this.parent);
        } else {
            // # anonymous target
            // istanbul ignore else
            if (refuri) {
                target.attributes.refuri = refuri;
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            target.attributes.anonymous = 1;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.document!.noteAnonymousTarget(target);
        }
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public substitution_def(match: RegExpExecArray): ParseResult {
        if(this.explicit === undefined) {
            throw new InvalidStateError('explicit undefined');
        }
        const pattern = this.explicit.patterns.substitution;
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [src, srcline] = this.rstStateMachine.getSourceAndLine();
        const matchEnd = match.index + match[0].length;
        let myBlankFinish;
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [block, indent,
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
            offset, blankFinish] = this.rstStateMachine.getFirstKnownIndented(
            { indent: matchEnd, stripIndent: false }
        );

        myBlankFinish = blankFinish;
        let myOffset = offset;
        // unuseD? fixme
        const blockText = (match.input.substring(0, matchEnd) + block.join("\n"));
        block.disconnect();
        let escaped = escape2null(block[0].trimRight());
        let blockIndex = 0;
        let subDefMatch;
        let done = false;
        while (!done) {
            subDefMatch = pattern.exec(escaped);
            if (subDefMatch) {
                done = true;
            } else {
                blockIndex += 1;
                try {
                    escaped = `${escaped} ${escape2null(block[blockIndex].trim())}`;
                } catch (error) {
                    throw new MarkupError("malformed substitution definition.");
                }
            }
        }

        // @ts-ignore
        const subDefMatchEnd = subDefMatch.index + subDefMatch[0].length;
        block.splice(0, blockIndex);// strip out the substitution marker
        const tmpLine = `${block[0].trim()} `;
        block[0] = tmpLine.substring(subDefMatchEnd - escaped.length - 1, tmpLine.length - 1);
        if (!block[0]) {
            block.splice(0, 1);
            myOffset += 1;
        }
        while (block.length && !block[block.length - 1].trim()) {
            block.pop();
        }
        // @ts-ignore
        const subname = subDefMatch[2];
        // eslint-disable-next-line @typescript-eslint/camelcase
        const substitutionNode: nodes.substitution_definition =  nodesFactory.substitution_definition(blockText);
        substitutionNode.source = src;
        if(srcline !== undefined) {
            substitutionNode.line = srcline;
        }
        if (!block.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const msg = this.reporter!.warning(
                `Substitution definition "${subname}" missing contents.`,
                [nodesFactory.literal_block(blockText, blockText)],
                { source: src, line: srcline }
            );
            return [[msg], myBlankFinish];
        }
        block[0] = block[0].trim();
        substitutionNode.attributes.names.push(
            nodes.whitespaceNormalizeName(subname)
        );
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [newAbsOffset, blankFinish2] = this.nestedListParse(block, { inputOffset: myOffset, node: substitutionNode, initialState: "SubstitutionDef", blankFinish: myBlankFinish });
        myBlankFinish = blankFinish2;
        let i = 0;
        substitutionNode.getChildren().slice().forEach((node): void => {
            // this is a mixin check!!
            if (!(node.isInline()
        || node instanceof nodes.Text)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.parent!.add(substitutionNode.getChild(0));
                substitutionNode.removeChild(i);
            } else {
                i += 1;
            }
        });
        const result = substitutionNode.traverse({ condition:nodes.Element}).map((node: NodeInterface): ParseResult|undefined => {
            if (this.disallowedInsideSubstitutionDefinitions(node)) {
	    // @ts-ignore fixme
                const pformat = nodesFactory.literal_block("", node.pformat().trimRight());
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const msg = this.reporter!.error(
                    `Substitution definition contains illegal element <${node.tagname}>:`,
                    [pformat, nodesFactory.literal_block(blockText, blockText)],
                    { source: src, line: srcline }
                );
                return [[msg], blankFinish];
            }
            return undefined;
        }).filter((x: ParseResult|undefined): boolean => x !== undefined);
        if (result.length) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return result[0]!;
        }
        if (!substitutionNode.hasChildren()) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const msg = this.reporter!.warning(
                `Substitution definition "${subname}" empty or invalid.`,
                [nodesFactory.literal_block(blockText, blockText)],
                { source: src, line: srcline }
            );
            return [[msg], blankFinish];
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.document!.noteSubstitutionDef(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            substitutionNode, subname, this.parent!
        );
        return [[substitutionNode], blankFinish];
    }

    public disallowedInsideSubstitutionDefinitions(node: NodeInterface): boolean {

        if (((node.attributes && node.attributes.ids && node.attributes.ids.length) || node instanceof nodes.reference
      || node instanceof nodes.footnote_reference) && node.attributes.auto) {
            return true;
        }
        return false;
    }

    /** Returns a 2-tuple: list of nodes, and a "blank finish" boolean. */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    public directive(match: RegExpExecArray, optionPresets: any): ParseResult {
        const typeName = match[1];
        if (typeof typeName === "undefined") {
            throw new Error("need typename");
        }

        let language = this.memo && this.memo.language;
        const [directiveClass, messages] = directives.directive(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            typeName, this.document!, language
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(messages);
        if (directiveClass) {
            return this.runDirective(
                directiveClass, match, typeName, optionPresets
            );
        }
        return this.unknown_directive(typeName);
    }

    /**
   * Parse a directive then run its directive function.
   *
   * Parameters:
   *
   * - `directive`: The class implementing the directive.  Must be
   * a subclass of `rst.Directive`.
   *
   * - `match`: A regular expression match object which matched the first
   * line of the directive.
   *
   * - `typeName`: The directive name, as used in the source text.
   *
   * - `option_presets`: A dictionary of preset options, defaults for the
   * directive options.  Currently, only an "alt" option is passed by
   * substitution definitions (value: the substitution name), which may
   * be used by an embedded image directive.
   *
   * Returns a 2-tuple: list of nodes, and a "blank finish" boolean.
   **/

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase,@typescript-eslint/no-explicit-any */
    public runDirective(directiveClass: DirectiveConstructor, match: RegExpExecArray, typeName: string, option_presets: any): ParseResult {
    /*        if isinstance(directive, (FunctionType, MethodType)):
              from docutils.parsers.rst import convert_directive_function
              directive = convert_directive_function(directive)
    */
        const lineno = this.rstStateMachine.absLineNumber();
        const initialLineOffset = this.rstStateMachine.lineOffset;
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [indented, indent, lineOffset, blankFinish] = this.rstStateMachine.getFirstKnownIndented(
            {
                indent: match.index + match[0].length,
                stripTop: false
            }
        );
        const blockText = this.rstStateMachine.inputLines.slice(
            initialLineOffset, this.rstStateMachine.lineOffset + 1
        ).join('\n');
        let args: string[] = [];
        let options: Options|undefined;
        let content: StringList|undefined;
        let
            contentOffset: number;
        /*        try {*/
        // @ts-ignore
        [args, options, content, contentOffset] = this.parseDirectiveBlock(
            indented,
            lineOffset,
            directiveClass,
            option_presets
        );
        /*        } catch (error) {
                if (error instanceof MarkupError) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const err = this.reporter!.error(`Error in "${typeName}" directive:\n${error.args.join(' ')}`,
                                                    [nodesFactory.literal_block(blockText, blockText)],
                                                    { line: lineno });
                    return [[err], blankFinish];
                }
            }
            */
        const directiveInstance = new directiveClass(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            typeName!, args, options!, content!, lineno,
            contentOffset, blockText, this, this.rstStateMachine
        );
        let result;
        try {
            result = directiveInstance.run();
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const msgNode = this.reporter!.systemMessage(
                error.level, error.msg, [], { line: lineno }
            );
            msgNode.add(nodesFactory.literal_block(blockText, blockText));
            result = [msgNode];
        }
        /*        assert isinstance(result, list), \
              'Directive "%s" must return a list of nodes.' % typeName
              for i in range(len(result)):
              assert isinstance(result[i], nodes.Node), \
              ('Directive "%s" returned non-Node object (index %s): %r'
              % (typeName, i, result[i]))
    */
        return [result,
            blankFinish || this.rstStateMachine.isNextLineBlank()];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public unknown_directive(typeName: string): ParseResult {
        const lineno = this.rstStateMachine.absLineNumber();
        const [indented,
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
            indent,
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
            offset,
            blankFinish] = this.rstStateMachine
            .getFirstKnownIndented({ indent: 0, stripIndent: false });
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const text = indented.join("\n");
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const error = this.reporter!.error(
            `Unknown directive type "${typeName}".`,
            [nodesFactory.literal_block(text, text)], { line: lineno }
        );
        return [[error], blankFinish];
    }

    public comment(match: RegexpResult): ParseResult {
        const matchEnd = match.result.index + match.result[0].length;
        if (!match.result.input.substring(matchEnd).trim()
      && this.rstStateMachine.isNextLineBlank()) { // # an empty comment?
            return [[nodesFactory.comment()], true]; // "A tiny but practical wart."
        }
        const [indented,
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
            indent, offset,
            blankFinish] = this.rstStateMachine.getFirstKnownIndented(
            { indent: matchEnd }
        );
        while (indented && indented.length && !indented[indented.length - 1].trim()) {
            indented.trimEnd();
        }
        const text = indented.join("\n");
        return [[nodesFactory.comment(text, text)], blankFinish];
    }

    /** Footnotes, hyperlink targets, directives, comments. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public explicit_markup(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        const r = this.explicit_construct(match);
        /* istanbul ignore if */
        if (!isIterable(r)) {
            throw new Error("");
        }
        const [nodelist, blankFinish] = r;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(nodelist);
        this.explicit_list(blankFinish);
        return [[], nextState, []];
    }

    /** Determine which explicit construct this is, parse & return it. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public explicit_construct(match: RegexpResult): ParseResult {
        if(this.explicit === undefined) {
            throw new InvalidStateError('explicit undefined');
        }
        const errors = [];
        if(Object.keys(this.explicit).length === 0) {
            throw new Error(`invalid state!`);
        }
        if(this.explicit.constructs === undefined
	|| this.explicit.constructs.map === undefined) {
            throw new Error('invalid state');
        }
        const r = this.explicit.constructs.map(
            // @ts-ignore
            ([method, pattern]): ExplicitConstructTuple => [method, pattern, pattern.exec(match.result.input)]
        );
        const r2 = r
            .find((x: ExplicitConstructTuple): boolean => x[2] && x[0] !== undefined);
        if (r2) {
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
            const [method, pattern, expmatch] = r2;
            try {
	     // direct return of method result - returns ParseResult
                // @ts-ignore
                return method(expmatch);
            } catch (error) {
                if (error instanceof MarkupError) {
                    const lineno = this.rstStateMachine.absLineNumber();
                    const message = error.message;//args ? error.args.join(" ") : "";
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    errors.push(this.reporter!.warning(message, [], { line: lineno }));
                } else {
                    throw error;
                }
            }
        }

        const [nodelist, blankFinish] = this.comment(match);
        return [[...nodelist, ...errors], blankFinish];
    }

    /**
     * Create a nested state machine for a series of explicit markup
     * constructs (including anonymous hyperlink targets).
     */
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public explicit_list(blankFinish: boolean): void {
        const offset = this.rstStateMachine.lineOffset + 1; // next line
        const [newlineOffset, blankFinish1] = this.nestedListParse(
            this.rstStateMachine.inputLines.slice(offset),
            { inputOffset: this.rstStateMachine.absLineOffset() + 1,
                node: this.parent,
                initialState: "Explicit",
                blankFinish,
                matchTitles: this.rstStateMachine.matchTitles,
            } );
        this.gotoLine(newlineOffset);
        if (!blankFinish1) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(this.unindentWarning("Explicit markup"));
        }
    }

    /** Anonymous hyperlink targets. */
    public anonymous(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        const [nodelist, blankFinish] = this.anonymous_target(match);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(nodelist);
        this.explicit_list(blankFinish);
        return [[], nextState, []];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public anonymous_target(match: RegexpResult): ParseResult {
        const lineno = this.rstStateMachine.absLineNumber();
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [block, indent, offset, blankFinish] = this.rstStateMachine.getFirstKnownIndented({
            indent: match.result.index + match.result[0].length,
            untilBlank: true
        });
        const blocktext = match.result.input.substring(0, match.result.index + match.result[0].length) + block.join("\n");
        const blockLines: string[] = [];
        block.forEach((line: string): void => {
            blockLines.push(escape2null(line));
        });
        const block2 = new StringList(blockLines);

        const target = this.make_target(block2, blocktext, lineno, "");
        return [target !== undefined ? [target] : [], blankFinish];
    }

    public indent(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [indented, indent, lineOffset, blankFinish] = this.rstStateMachine.getIndented({});
        /* istanbul ignore if */
        if (indented === undefined) {
            throw new Error();
        }
        const elements = this.block_quote(indented, lineOffset);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(elements);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (!blankFinish) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(this.unindentWarning("Block quote"));
        }
        return [context, nextState, []];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public block_quote(indented: StringList, lineOffset: number): NodeInterface[] {
    /* istanbul ignore if */
        if (!indented) {
            throw new Error();
        }
        const elements = [];
        while (indented && indented.length) {
            const [blockquoteLines,
                attributionLines,
                attributionOffset,
                outIndented,
                newLineOffset] = this.split_attribution(indented, lineOffset);
            const blockquote = nodesFactory.block_quote();
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            indented = outIndented!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.nestedParse(blockquoteLines!, lineOffset, blockquote );
            elements.push(blockquote);
            if (attributionLines) { // fixme
                // @ts-ignore
                const [attribution, messages] = this.parse_attribution(attributionLines,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    attributionOffset!);
                blockquote.add(attribution);
                // @ts-ignore
                elements.push(...messages);
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            lineOffset = newLineOffset!;
            while (indented && indented.length && !indented[0]) {
                indented = indented.slice(1) as StringList;
                lineOffset += 1;
            }
        }
        return elements;
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public split_attribution(indented: StringList, lineOffset: number): [StringList|undefined, StringList|undefined, number|undefined, StringList|undefined, number|undefined] {
        // eslint-disable-next-line @typescript-eslint/camelcase
        this.attribution_pattern = new RegExp("(---?(?!-)|\\u2014) *(?=[^ \\n])");
        let blank;
        let nonblankSeen = false;
        for (let i = 0; i < indented.length; i += 1) {
            const line = indented[i].trimRight();
            if (line) {
                if (nonblankSeen && blank === i - 1) {
                    const match = this.attribution_pattern.exec(line);
                    if (match) {
                        const [attributionEnd, indent] = this.check_attribution(indented, i);
                        if (attributionEnd) {
                            const aLines = indented.slice(i, attributionEnd) as StringList;
                            aLines.trimLeft(match.index + match[0].length, undefined, 1);
                            aLines.trimLeft(indent, 1);
                            return [indented.slice(0, i), aLines,
                                i, indented.slice(attributionEnd),
                                lineOffset + attributionEnd];
                        }
                    }
                }
                nonblankSeen = true;
            } else {
                blank = i;
            }
        }
        return [indented, undefined, undefined, undefined, undefined];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,@typescript-eslint/no-explicit-any,camelcase */
    public check_attribution(indented: StringList, attributionStart: any): any {
        let indent = null;
        let i;
        for (i = attributionStart + 1; i < indented.length; i += 1) {
            const line = indented[i].trimRight();
            if (!line) {
                break;
            }
            if (indent == null) {
                indent = line.length - line.trimLeft().length;
            } else if ((line.length - line.lstrip().length) !== indent) {
                return [null, null]; // bad shape; not an attribution
            }
        }
        if (i === indented.length) {
            i += 1;
        }
        return [i, indent || 0];
    }

    /** Enumerated List Item */
    public enumerator(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        // @ts-ignore
        const [format, sequence, text, ordinal]: [string, string, string, number] = this.parseEnumerator(match);
        // @ts-ignore
        if (!this.isEnumeratedListItem(ordinal, sequence, format)) {
            throw new TransitionCorrection("text");
        }
        const enumlist = nodesFactory.enumerated_list();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(enumlist);
        if (sequence === "#") {
            enumlist.enumtype = "arabic";
        } else {
            enumlist.enumtype = sequence;
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        enumlist.prefix = this.enum!.formatinfo![format].prefix;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        enumlist.suffix = this.enum!.formatinfo![format].suffix;
        if (ordinal !== 1) {
            enumlist.start = ordinal;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const msg = this.reporter!.info(
                `Enumerated list start value not ordinal-1: "${text}" (ordinal ${ordinal})`
            );
            /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
            this.parent!.add(msg);
        }
        const [listitem, blankFinish1] = this.list_item(match.result.index + match.result[0].length);
        let blankFinish = blankFinish1;
        enumlist.add(listitem);
        const offset = this.rstStateMachine.lineOffset + 1; // next line
        const [newlineOffset, blankFinish2] = this.nestedListParse( this.rstStateMachine.inputLines.slice(offset), { inputOffset: this.rstStateMachine.absLineOffset() + 1, node: enumlist, initialState: "EnumeratedList", blankFinish, extraSettings: { lastordinal: ordinal, format, auto: sequence === "#" } } );
        blankFinish = blankFinish2;
        this.gotoLine(newlineOffset);
        if (!blankFinish) {
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
            this.parent!.add(this.unindentWarning("Enumerated list"));
        }
        return [[], nextState, []];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public parse_attribution(indented: string[], lineOffset: number): [NodeInterface, NodeInterface[]] {
        const text = indented.join("\n").trimRight();
        const lineno = this.rstStateMachine.absLineNumber() + lineOffset;
        const [textnodes, messages] = this.inline_text(text, lineno);
        const anode = nodesFactory.attribution(text, "", textnodes);
        const [source, line] = this.rstStateMachine.getSourceAndLine(lineno);
        anode.source = source;
        if(line !== undefined) {
            anode.line = line;
        }
        return [anode, messages];
    }

    public bullet(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        const bulletlist = nodesFactory.bullet_list();
        let sourceAndLine = this.rstStateMachine.getSourceAndLine();
        bulletlist.source = sourceAndLine[0];
        if(sourceAndLine[1] !== undefined) {
            bulletlist.line = sourceAndLine[1];
        }
        /* istanbul ignore if */
        if (!this.parent) {
            throw new Error("no parent");
        }

        this.parent.add(bulletlist);
        bulletlist.attributes.bullet = match.result[0].substring(0, 1);

        const [i, blankFinish1] = this.list_item(
            match.pattern.lastIndex + match.result[0].length
        ); /* -1 ? */
        let blankFinish = blankFinish1;
        /* istanbul ignore if */
        if (!i) {
            throw new Error("no node");
        }

        bulletlist.append(i);
        const offset = this.rstStateMachine.lineOffset + 1;
        const [newLineOffset, blankFinish2] = this.nestedListParse( this.rstStateMachine.inputLines.slice(offset), { inputOffset: this.rstStateMachine.absLineOffset() + 1, node: bulletlist, initialState: "BulletList", blankFinish } );
        blankFinish = blankFinish2;
        this.gotoLine(newLineOffset);
        if (!blankFinish) {
            this.parent.add(this.unindentWarning("Bullet list"));
        }
        return [[], nextState, []];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public list_item(indent: number): [NodeInterface, boolean] {
    //      console.log(`in list_item (indent=${indent})`);
    /* istanbul ignore if */
        if (indent == null) {
            throw new Error("Need indent");
        }

        let indented;
        let lineOffset;
        let blankFinish;
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        let outIndent;
        if (this.rstStateMachine.line.length > indent) {
            //          console.log(`get known indentd`);
            [indented, lineOffset, blankFinish] = this.rstStateMachine.getKnownIndented({ indent });
        } else {
            [indented, outIndent, lineOffset, blankFinish] = (
                this.rstStateMachine.getFirstKnownIndented({ indent }));
        }
        const listitem = nodesFactory.list_item(indented.join("\n"));
        if (indented && indented.length) { // fixme equivalent?
            this.nestedParse(indented,
                lineOffset,
                listitem
            );
        }
        return [listitem, blankFinish];
    }

    /**         Construct and return the next enumerated list item marker, and an
        auto-enumerator ("#" instead of the regular enumerator).

        Return ``None`` for invalid (out of range) ordinals.
*/
    // eslint-disable-next-line @typescript-eslint/camelcase
    public make_enumerator(ordinal: number, sequence: string, format: string): [string, string]|undefined {
    /*
    let enumerator: string|undefined;
        if(sequence === '#') {
            enumerator = '#'
        else if(sequence === 'arabic') {
            enumerator = ordinal.toString();
	    }else {
            if(sequence.endsWith('alpha')) {
                if(ordinal > 26) {
		return undefined;
		}
//                enumerator = chr(ordinal + ord('a') - 1)
} else if(sequence.endsWith('roman')) {
try {
                try:
                    enumerator = roman.toRoman(ordinal)
                except roman.RomanError:
                    return None
            else:                       # shouldn't happen
                raise ParserError('unknown enumerator sequence: "%s"'
                                  % sequence)
            if sequence.startswith('lower'):
                enumerator = enumerator.lower()
            elif sequence.startswith('upper'):
                enumerator = enumerator.upper()
            else:                       # shouldn't happen
                raise ParserError('unknown enumerator sequence: "%s"'
                                  % sequence)
        formatinfo = self.enum.formatinfo[format]
        next_enumerator = (formatinfo.prefix + enumerator + formatinfo.suffix
                           + ' ')
        auto_enumerator = formatinfo.prefix + '#' + formatinfo.suffix + ' '
        return next_enumerator, auto_enumerator
	*/
        return undefined;
    }

    /**
     * Transition function for field_maker. Performs a nested list parse.
     */
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public field_marker(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        const fieldList = nodesFactory.field_list();
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        this.parent!.add(fieldList);
        const [field, blankFinish1] = this.field(match);
        let blankFinish = blankFinish1;
        fieldList.add(field);
        const offset = this.rstStateMachine.lineOffset + 1;
        const [newlineOffset, blankFinish2] = this.nestedListParse(
            this.rstStateMachine.inputLines.slice(offset),
            { inputOffset: this.rstStateMachine.absLineOffset() + 1,
                node: fieldList,
                initialState: "FieldList",
                blankFinish,
            } );
        blankFinish = blankFinish2;
        this.gotoLine(newlineOffset);
        if (!blankFinish) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(this.unindentWarning("Field list"));
        }
        return [[], nextState, []];
    }

    public field(match: RegexpResult): [NodeInterface, boolean] {
        const name = this.parse_field_marker(match);
        const [src, srcline] = this.rstStateMachine.getSourceAndLine();
        const lineno = this.rstStateMachine.absLineNumber();
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [indented, indent, lineOffset, blankFinish] = this.rstStateMachine.getFirstKnownIndented(
            { indent: match.result.index + match.result[0].length }
        );
        const fieldNode = nodesFactory.field();
        fieldNode.source = src;
        if(srcline !== undefined) {
            fieldNode.line = srcline;

        }
        const [nameNodes, nameMessages] = this.inline_text(name, lineno);
        fieldNode.add(nodesFactory.field_name(name, "", nameNodes, {}));
        const fieldBody = nodesFactory.field_body(
            indented.join("\n"), nameMessages, {}
        );
        fieldNode.add(fieldBody);
        if (indented && indented.length) {
            this.parse_field_body(indented, lineOffset, fieldBody);
        }
        return [fieldNode, blankFinish];
    }

    /** Extract & return field name from a field marker match. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public parse_field_marker(match: RegexpResult): string {
        let field = match.result[0].substring(1);
        field = field.substring(0, field.lastIndexOf(":"));
        return field;
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public parse_field_body(indented: StringList, offset: number, node: NodeInterface): void {
        this.nestedParse( indented, offset, node );
    }

    /** Option list item. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public option_marker(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        const optionlist = nodesFactory.option_list();
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */// fixme
        const [source, line] = this.rstStateMachine.getSourceAndLine();
        let listitem: NodeInterface;
        let blankFinish;
        try {
            [listitem, blankFinish] = this.option_list_item(match);
        } catch (error) {
            if (error instanceof MarkupError) {
                // This shouldn't happen; pattern won't match.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const msg = this.reporter!.error(`Invalid option list marker: ${error}`);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.parent!.add(msg);
                const [indented,
                    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
                    indent,
                    lineOffset, blankFinish2] = this.rstStateMachine.getFirstKnownIndented(
                    { indent: match.result.index + match.result[0].length }
                );
                blankFinish = blankFinish2;
                const elements = this.block_quote(indented, lineOffset);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.parent!.add(elements);
                if (!blankFinish) {
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.parent!.add(this.unindentWarning("Option list"));
                }
                return [[], nextState, []];
            }
            throw error;
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(optionlist);
        optionlist.add(listitem);
        const offset = this.rstStateMachine.lineOffset + 1; // next line
        const [newlineOffset, blankFinish3] = this.nestedListParse( this.rstStateMachine.inputLines.slice(offset), { inputOffset: this.rstStateMachine.absLineOffset() + 1, node: optionlist, initialState: "OptionList", blankFinish } );
        blankFinish = blankFinish3;
        this.gotoLine(newlineOffset);
        if (!blankFinish) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(this.unindentWarning("Option list"));
        }
        return [[], nextState, []];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public option_list_item(match: RegexpResult): [NodeInterface, boolean] {
        const offset = this.rstStateMachine.absLineOffset();
        const options = this.parse_option_marker(match);
        const [indented,
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
            indent,
            lineOffset,
            blankFinish] = this.rstStateMachine.getFirstKnownIndented(
            { indent: match.result.index + match.result[0].length }
        );
        if (!indented || !indented.length) { //  not an option list item
            this.gotoLine(offset);
            throw new TransitionCorrection("text");
        }
        const optionGroup = nodesFactory.option_group("", options);
        const description = nodesFactory.description(indented.join("\n"));
        const optionListItem = nodesFactory.option_list_item("", [optionGroup,
            description]);
        if (indented && indented.length) {
            this.nestedParse(indented,
                lineOffset,
                description
            );
        }
        return [optionListItem, blankFinish];
    }

    /**
     * Return a list of `node.option` and `node.option_argument` objects,
     * parsed from an option marker match.
     *
     * :Exception: `MarkupError` for invalid option markers.
     */
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public parse_option_marker(match: RegexpResult): NodeInterface[] {
        const optlist: NodeInterface[] = [];
        const optionstrings: string[] = match.result[0].trimRight().split(", ");
        optionstrings.forEach((optionstring): void => {
            const tokens = optionstring.split(/s+/);
            let delimiter = " ";
            const firstopt = tokens[0].split("=", 2);
            if (firstopt.length > 1) {
                // "--opt=value" form
                tokens.splice(0, 1, ...firstopt); // fixme check
                delimiter = "=";
            } else if (tokens[0].length > 2
        && ((tokens[0].indexOf("-") === 0
          && tokens[0].indexOf("--") !== 0)
          || tokens[0].indexOf("+") === 0)) {
                // "-ovalue" form
                tokens.splice(0, 1, tokens[0].substring(0, 2), tokens[0].substring(2));
                delimiter = "";
            }
            if ((tokens.length > 1) && (tokens[1].startsWith("<")
        && tokens[-1].endsWith(">"))) {
                // "-o <value1 value2>" form; join all values into one token
                tokens.splice(1, tokens.length, tokens.slice(1).join(""));
            }
            if ((tokens.length > 0) && (tokens.length <= 2)) {
                const option = nodesFactory.option(optionstring);
                option.add(nodesFactory.option_string(tokens[0], tokens[0]));
                if (tokens.length > 1) {
                    option.add(nodesFactory.option_argument(tokens[1], tokens[1],
                        [], { delimiter }));
                }
                optlist.push(option);
            } else {
                throw new MarkupError(`wrong number of option tokens (=${tokens.length}), should be 1 or 2: "${optionstring}"`);
            }
        });
        return optlist;
    }

    public doctest(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        const data = this.rstStateMachine.getTextBlock().join("\n");
        // TODO: prepend class value ['pycon'] (Python Console)
        // parse with `directives.body.CodeBlock` (returns literal-block
        // with class "code" and syntax highlight markup).
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(nodesFactory.doctest_block(data, data));
        return [[], nextState, []];
    }

    /** First line of a line block. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public line_block(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        const block = nodesFactory.line_block();
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(block);
        const lineno = this.rstStateMachine.absLineNumber();
        const [line, messages, blankFinish1] = this.line_block_line(match, lineno);
        let blankFinish = blankFinish1;
        block.add(line);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(messages);
        if (!blankFinish) {
            const offset = this.rstStateMachine.lineOffset + 1; // next line
            const [newLineOffset, blankFinish2] = this.nestedListParse( this.rstStateMachine.inputLines.slice(offset), { inputOffset: this.rstStateMachine.absLineOffset() + 1, node: block, initialState: "LineBlock", blankFinish: false } );
            blankFinish = blankFinish2;
            this.gotoLine(newLineOffset);
        }
        if (!blankFinish) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(this.reporter!.warning(
                "Line block ends without a blank line.", [],
                { line: lineno + 1 }
            ));
        }
        if (block.hasChildren()) {
            const child = block.getChild(0);
            // is null something we'll get here?? fixme
            if (child.attributes.indent == null) {
                child.attributes.indent = 0;
            }
            this.nest_line_block_lines(block);
        }
        return [[], nextState, []];
    }

    /** Return one line element of a line_block. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public line_block_line(match: RegexpResult, lineno: number):  [NodeInterface, NodeInterface[], boolean]  {
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [indented, indent, lineOffset, blankFinish] = this
            .rstStateMachine.getFirstKnownIndented(
                {
                    indent: match.result.index + match.result[0].length,
                    untilBlank: true
                }
            );
        const text = indented.join("\n");
        const [textNodes, messages] = this.inline_text(text, lineno);
        const line = nodesFactory.line(text, "", textNodes);
        if (match.result.input.trimRight() !== "|") {
            line.indent = match.result[1].length - 1;
        }

        return [line, messages, blankFinish];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public nest_line_block_lines(block: NodeInterface): void {
        for (let i = 1; i < block.getNumChildren(); i += 1) {
            const child = block.getChild(i) as nodes.line;
            if (child.indent === undefined && i !== 0) {
                child.indent = (block.getChild(i - 1) as nodes.line).indent;
            }
        }
        this.nest_line_block_segment(block);
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public nest_line_block_segment(block: NodeInterface): void {
        const indents: number[] = [];
        let least: number|undefined;
        for (let i = 0; i < block.getNumChildren(); i += 1) {
            const child = block.getChild(i) as nodes.line;
            const indent = child.indent;
            if (least === undefined || indent < least) {
                least = indent;
            }
            indents.push(child.indent);
        }
        const newItems: NodeInterface[] = [];
        let newBlock = nodesFactory.line_block();
        for (let i = 0; i < block.getNumChildren(); i += 1) {
            const item = block.getChild(i) as nodes.line;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (item.indent > least!) {
                newBlock.add(item);
            } else {
                if (newBlock.hasChildren()) {
                    this.nest_line_block_segment(newBlock);
                    newItems.push(newBlock);
                    newBlock = nodesFactory.line_block();
                }
                newItems.push(item);
            }
        }
        if (newBlock.hasChildren()) {
            this.nest_line_block_segment(newBlock);
            newItems.push(newBlock);
        }

        for (let i = 0; i < newItems.length; i += 1) {
            block.append(newItems[i]);
        }
    }

    /** Top border of a full table. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public grid_table_top(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        return this.table_top(match, context, nextState,
            this.isolate_grid_table.bind(this),
            tableparser.GridTableParser);
    }

    /** Top border of a simple table. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public simple_table_top(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        return this.table_top(match, context, nextState,
            this.isolate_simple_table.bind(this),
            tableparser.SimpleTableParser);
    }

    /* Top border of a generic table. */

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public table_top(
        match: RegexpResult,
        context: ContextArray,
        nextState: StateType,
        /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
        isolate_function: () => IsolateTableResult,
        /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
        parser_class: ParserConstructor
    ): ParseMethodReturnType {
        const [nodelist, blankFinish] = this.table(isolate_function, parser_class);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.parent!.add(nodelist);
        if (!blankFinish) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const msg = this.reporter!.warning(
                "Blank line required after table.", [],
                { line: this.rstStateMachine.absLineNumber() + 1 }
            );
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(msg);
        }
        return [[], nextState, []];
    }

    /** Parse a table. */
    public table(isolateFunction: () => IsolateTableResult,
        parserClass: ParserConstructor): ParseResult {
        const r = isolateFunction();
        if (!isIterable(r)) {
            throw new Error();
        }
        const [block, messages, blankFinish]: IsolateTableResult = r;
        let nodelist;
        if (block && block.length) {
            try {
                const parser = new parserClass();
                const tabledata = parser.parse(block);
                const tableline = (this.rstStateMachine.absLineNumber() - block.length + 1);
                const table = this.build_table(tabledata, tableline);
                nodelist = [table, ...messages];
            } catch (error) {
                if (error instanceof tableparser.TableMarkupError) {
                    nodelist = [...this.malformed_table(block, error.message,
                        error.offset), ...messages];
                } else {
                    throw error;
                }
            }
        } else {
            nodelist = messages;
        }
        return [nodelist, blankFinish];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public isolate_grid_table(): IsolateTableResult {
        const messages = [];
        let block;
        let blankFinish = 1;
        try {
            block = this.rstStateMachine.getTextBlock(true);
        } catch (error) {
            if (error instanceof UnexpectedIndentationError) {
                //                const block2 = error.block;
                const src = error.source;
                const srcline = error.lineno;
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                messages.push(this.reporter!.error("Unexpected indentation.", [],
                    { source: src, line: srcline }));
                blankFinish = 0;
            }
        }

        if (!block) {
            throw new Error();
        }

        block.disconnect();
        // for East Asian chars:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        block.padDoubleWidth(this.doubleWidthPadChar!);
        const width = block[0].trim().length;
        for (let i = 0; i < block.length; i += 1) {
            block[i] = block[i].trim();
            if (block[i][0] !== "+" && block[i][0] !== "|") { // check left edge
                blankFinish = 0;
                this.rstStateMachine.previousLine(block.length - i);
                block.splice(i, block.length - i);
                break;
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (!this.gridTableTopPat!.test(block[block.length - 1])) { // find bottom
            blankFinish = 0;
            // from second-last to third line of table:
            let myBreak = false;
            for (let i = block.length - 2; i >= 1; i -= 1) { // fixme test
                // for i in range(len(block) - 2, 1, -1):
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                if (this.gridTableTopPat!.test(block[i])) {
                    this.rstStateMachine.previousLine(block.length - i + 1);
                    block.splice(i + 1, block.length - (i + 1));
                    myBreak = true;
                    break;
                }
            }
            if (!myBreak) {
                messages.push(...this.malformed_table(block));
                return [new StringList([]), messages, blankFinish? true : false];
            }
        }

        for (let i = 0; i < block.length; i += 1) { // check right edge
            if (block[i].length !== width || !/[+|]/.test(block[i][block[i].length - 1])) {
                messages.push(...this.malformed_table(block));
                return [new StringList([]), messages, blankFinish? true :false];
            }
        }
        return [block, messages, blankFinish? true : false];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public isolate_simple_table(): IsolateTableResult {
        const start = this.rstStateMachine.lineOffset;
        const lines = this.rstStateMachine.inputLines;
        const limit = lines.length - 1;
        const toplen = lines[start].trim().length;
        const patternMatch = RegExps.simpleTableBorderPat.exec.bind(RegExps.simpleTableBorderPat);
        let found = 0;
        let foundAt: number;
        let i = start + 1;
        let myBreak = false;
        let end = 0;
        while (i <= limit) {
            const line = lines[i];
            const match = patternMatch(line);
            if (match) {
                if (line.trim().length !== toplen) {
                    this.rstStateMachine.nextLine(i - start);
                    const messages = this.malformed_table(
                        lines.slice(start, i + 1),
                        "Bottom/header table border does not match top border."
                    );
                    return [new StringList([]), messages, i === limit || !lines[i + 1].trim()];
                }
                found += 1;
                foundAt = i;
                if (found === 2 || i === limit || !lines[i + 1].trim()) {
                    end = i;
                    myBreak = true;
                }
            }
            i += 1;
        }
        let block;
        if (!myBreak) {
            // reached end of input_lines
            let extra;
            if (found) {
                extra = " or no blank line after table bottom";
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.rstStateMachine.nextLine(foundAt! - start);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                block = lines.slice(start, foundAt! + 1);
            } else {
                extra = "";
                this.rstStateMachine.nextLine(i - start - 1);
                block = lines.slice(start);
            }
            const messages = this.malformed_table(
                block, `No bottom table border found${extra}`
            );
            return [new StringList([]), messages, !extra];
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.rstStateMachine.nextLine(end! - start);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        block = lines.slice(start, end! + 1) as StringList;
        // for East Asian chars:
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        block.padDoubleWidth(this.doubleWidthPadChar!);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return [block, [], end === limit || !lines[end! + 1].trim()];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public malformed_table(block: StringList, detail: string = "", offset: number  = 0): NodeInterface[] {
        block.replace(this.doubleWidthPadChar, "");
        const data = block.join("\n");
        let message = "Malformed table.";
        const startline = this.rstStateMachine.absLineNumber() - block.length + 1;
        if (detail) {
            message += `\n${detail}`;
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const error = this.reporter!.error(
            message,
            [nodesFactory.literal_block(data, data)],
            { line: startline + offset }
        );
        return [error];
    }

    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase */
    public build_table(tabledata: TableData, tableline: number, stubColumns: number = 0, widths?: string): nodes.table {
        const [colwidths, headRows, bodyrows] = tabledata;
        console.log(headRows);
        const table = nodesFactory.table();
        if (widths === "auto") {
            table.attributes.classes.push("colwidths-auto");
        } else if (widths) { // : # "grid" or list of integers
            table.attributes.classes.push(["colwidths-given"]);
        }
        const tgroup = nodesFactory.tgroup("", [], { cols: colwidths.length });
        table.add(tgroup);
        colwidths.forEach((colwidth: number): void => {
            const colspec = nodesFactory.colspec("", [], { colwidth });
            if (stubColumns) {
                colspec.attributes.stub = 1;
                stubColumns -= 1;
            }
            tgroup.add(colspec);
        });
        if (headRows && headRows.length) {
            const thead = nodesFactory.thead("", [], {});
            tgroup.add(thead);
	    //@ts-ignore
            headRows.map((row: RowData): nodes.row => this.buildTableRow(row, tableline))
	    //@ts-ignore
                .forEach((row: nodes.row): void => thead.add(row));
        }
        const tbody = nodesFactory.tbody();
        tgroup.add(tbody);
        // @ts-ignore
        bodyrows.forEach((row: RowData): void => {
            console.log(row);
        });
        // @ts-ignore
        bodyrows.map((row: RowData): nodes.row => this.buildTableRow(row, tableline))
        // @ts-ignore
            .forEach((row: nodes.row): void => tbody.add(row));
        return table;
    }

    public buildTableRow(rowdata: RowData, tableline: number): nodes.row {
        const row = nodesFactory.row("", [], {});
        // @ts-ignore
        rowdata.filter((x): boolean => x !== undefined).forEach(([morerows, morecols, offset, cellblock]): void => {
            const attributes = {};
            if (morerows) {
                // @ts-ignore
                attributes.morerows = morerows;
            }
            if (morecols) {
                // @ts-ignore
                attributes.morecols = morecols;
            }
            const entry = nodesFactory.entry("", [], attributes);
            row.add(entry);
            if (cellblock.join("")) {
                this.nestedParse(
                    cellblock,
                    tableline + offset,
                    entry
                );
            }
        });
        return row;
    }

    public line(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
        if (this.rstStateMachine.matchTitles) {
            return [[match.input], "Line", []];
        }
        if (match.result.input.trim() === "::") {
            throw new TransitionCorrection("text");
        } else if (match.result.input.trim().length < 4) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const msg = this.reporter!.info(
                "Unexpected possible title overline or transition.\n"
        + "Treating it as ordinary text because it's so short.", [],
                { line: this.rstStateMachine.absLineNumber() }
            );
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(msg);
            throw new TransitionCorrection("text");
        } else {
            const blocktext = this.rstStateMachine.line;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const msg = this.reporter!.severe(
                "Unexpected section title or transition.",
                [nodesFactory.literal_block(blocktext, blocktext)],
                { line: this.rstStateMachine.absLineNumber() }
            );
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.parent!.add(msg);
            return [[], nextState, []];
        }
    }


    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    public text(match: RegexpResult, context: ContextArray, nextState: StateInterface): ParseMethodReturnType {
    /* istanbul ignore if */
        if (match.input === undefined) {
            throw new Error("");
        }

        return [[match.input], "Text", []];
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    private isEnumeratedListItem(ordinal: number, sequence: string, format: string): boolean {
        return false;
    }

    /**
 *         Analyze an enumerator and return the results.

        :Return:
            - the enumerator format ('period', 'parens', or 'rparen'),
            - the sequence used ('arabic', 'loweralpha', 'upperroman', etc.),
            - the text of the enumerator, stripped of formatting, and
            - the ordinal value of the enumerator ('a' -> 1, 'ii' -> 2, etc.;
              ``None`` is returned for invalid enumerator text).

        The enumerator format has already been determined by the regular
        expression match. If `expected_sequence` is given, that sequence is
        tried first. If not, we check for Roman numeral 1. This way,
        single-character Roman numerals (which are also alphabetical) can be
        matched. If no sequence has been matched, all sequences are checked in
        order.
 */
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
    private parseEnumerator(match: RegexpResult): [string, string, string, number] {

        return ['','','', 0];
    }

    private parseDirectiveBlock(indented: StringList,
        lineOffset: number,
        directive: DirectiveConstructor,
        // eslint-disable-next-line @typescript-eslint/camelcase
        option_presets: Options): [string[], Options, StringList, number] | undefined {
        const optionSpec = directive.optionSpec;
        const hasContent = directive.hasContent;
        if (indented && indented.length && !indented[0].trim()) {
            indented.trimStart();
        }
        while (indented && indented.length && !indented[indented.length - 1].trim()) {
            indented.trimEnd();
        }
        let argBlock: StringList = new StringList([]);
        let content: StringList;
        let contentOffset: number;
        let i = 0;
        if (indented && indented.length && (!directive.requiredArguments
      || directive.optionalArguments
      || optionSpec)) {
            i = indented.findIndex((line): boolean => !(!line.trim()));
            if (i === -1) {
                i = indented.length;
            }
            argBlock = indented.slice(0, i) as StringList;
            content = indented.slice(i + 1, 0) as StringList;
            contentOffset = lineOffset + i + 1;
        } else {
            content = indented;
            contentOffset = lineOffset;
        }
        let options: Options|undefined;
        if (optionSpec && Object.keys(optionSpec).length) {
            [options, argBlock] = this.parseDirectiveOptions(option_presets,
                optionSpec, argBlock);
        } else {
            options = {};
        }
        if(argBlock.length && !(directive.requiredArguments || directive.optionalArguments)) {
            content = new StringList([...argBlock, ...indented.slice(i)]);
            contentOffset = lineOffset;
            argBlock = new StringList([]);
        }
        while(content.length && !content[0].trim()) {
            content.trimStart();
            contentOffset += 1;
        }

        let args: string[] = [];
        if(directive.requiredArguments || directive.optionalArguments) {
            args = this.parseDirectiveArguments(directive, argBlock);
        }
        if(content.length && !hasContent) {
            throw new MarkupError('no content permitted');
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return [args, options!, content, contentOffset];
    }

    // eslint-disable-next-line @typescript-eslint/camelcase
    private parseDirectiveOptions(option_presets: Options, optionSpec: OptionSpec, argBlock: StringList): [Options|undefined, StringList] {
    // eslint-disable-next-line @typescript-eslint/camelcase
        let options: Options = { ...option_presets };
        let optBlock: StringList;
        // @ts-ignore
        let i = argBlock.findIndex((line): boolean => this.patterns.field_marker.test(line));
        if (i !== -1) {
            optBlock = argBlock.slice(i) as StringList;
            argBlock = argBlock.slice(0) as StringList;
        } else {
            i = argBlock.length;
            optBlock = new StringList([]);
        }
        if (optBlock.length) {
            const [success, data] = this.parseExtensionOptions(optionSpec, optBlock);
            if (success) {
                options = { ...options, data };
            } else {
                throw new MarkupError(data.toString());
            }
            return [options, argBlock];
        }
        return [undefined, new StringList([])];
    }

    /**
   Parse `datalines` for a field list containing extension options
   matching `option_spec`.

   :Parameters:
   - `option_spec`: a mapping of option name to conversion
   function, which should raise an exception on bad input.
   - `datalines`: a list of input strings.

   :Return:
   - Success value, 1 or 0.
   - An option dictionary on success, an error string on failure.
   */
    private parseExtensionOptions(optionSpec: OptionSpec, datalines: StringList): [boolean, Options|string] {
        const node = nodesFactory.field_list();
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
        const [newlineOffset, blankFinish] = this.nestedListParse(datalines, { inputOffset: 0, node, initialState: "ExtensionOptions", blankFinish: true });
        if (newlineOffset !== datalines.length) { // incomplete parse of block
            return [false, "invalid option block"];
        }
        let options: Options|undefined;
        try {
            options = extractExtensionOptions(node, optionSpec);
        } catch (error) {
        }

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return [true, options!];
        /*          return 0, 'option data incompletely parsed'

   */

        return [false, {}];
    }

    private parseDirectiveArguments(directive: DirectiveConstructor, argBlock: StringList): string[] {
        const required = directive.requiredArguments;
        const optional = directive.optionalArguments;
        const argText = argBlock.join('\n');
        let args: string[] = pySplit(argText);
        if (args.length < required) {
            throw new MarkupError(`${required} argument(s) required, ${args.length} supplied`);
        } else if (args.length > required + optional) {
            if (directive.finalArgumentWhitespace) {
                args = pySplit(argText, required + optional - 1);
            } else {
                throw new MarkupError(
                    `maximum ${required + optional} argument(s) allowed, ${args.length} supplied`);
            }
        }
        return args;
    }



}

Body.stateName = "Body";
export default Body;
