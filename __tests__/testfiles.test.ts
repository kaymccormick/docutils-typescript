import { Publisher } from '../src/Core';
import { StringInput, StringOutput } from '../src/io';
import * as nodes from '../src/nodes';
import { getDefaultSettings } from "../src/";
import {NodeInterface} from "../src/types";
import { createLogger } from '../src/testUtils';

class Visitor extends nodes.GenericNodeVisitor {
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcase,@typescript-eslint/no-unused-vars,no-unused-vars */
    default_departure(node: NodeInterface) {
        /**/
    }
 
    /* eslint-disable-next-line @typescript-eslint/camelcase,camelcae */
    default_visit(node: NodeInterface) {
        if (node.attributes && node.attributes.refuri) {
            //                                console.log(node.attrites.refuri);
            if (!/^https?:\/\//.test(node.attributes.refuri)) {
                const msg = `Invalid refuri ${node.attributes.refuri}`;
                const messages = [node.document!.reporter.warning(msg, [], {})];
                node.add(messages);
            }
        }
    }
}

const path = require('path');
const fs = require('fs');

const testFilesRoot = path.join(__dirname, '../testfiles/forms/');

const table = fs.readdirSync(testFilesRoot, { withFileTypes: true })
    .filter((e: any) => !e.isDirectory())
    .map((e: any) => [e.name,
        fs.readFileSync(path.join(testFilesRoot, e.name), 'utf-8')]);

const defaultArgs = {
    readerName: 'standalone',
    parserName: 'restructuredtext',
    usage: '',
    description: '',
    enableExitStatus: true,
    writerName: 'xml',
};

const defaultSettings = { ...getDefaultSettings() };

test.each(table)('%s', (file, input) => {
    const logger = createLogger();
    const myOpts: any = {};

    const settings = { ...defaultSettings };
    const args = { ...defaultArgs };

    const { readerName, parserName, writerName } = args;
    const source = new StringInput( input, logger);
    const destination = new StringOutput(logger);
    const pub = new Publisher({
        source, destination, settings, logger,
    });
    pub.setComponents(readerName, parserName, writerName);
    return pub.publish({}).then(() => {
        const document = pub.document;
 	const visitor = new Visitor(document!);
 	document!.walkabout(visitor);
        expect(destination.destination!).toMatchSnapshot();
    });

});
