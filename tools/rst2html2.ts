#!/usr/bin/env ts-node
import { defaultDescription } from '../src/constants';
import { publishCmdLine } from '../src/Core';

const description = `Generates (X)HTML documents from standalone reStructuredText sources.  ${defaultDescription}`;

publishCmdLine({ writerName: "html", description });
