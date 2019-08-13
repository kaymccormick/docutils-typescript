#!/usr/bin/env ts-node
import { defaultDescription } from '../src/constants';
import { publishCmdLine } from '../src/Core';

const description = `Generates (X)HTML documents from standalone reStructuredText sources.  ${defaultDescription}`;

publishCmdLine({writerName: 'html', description }, (error: Error, output: any): void => {
    if(error) {
        console.log(error.stack);
        console.log(error.message);
    } else {
        console.log(output);
        process.exit(0);
    }
});
