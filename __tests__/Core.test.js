import { Publisher, publishCmdLine, defaultDescription } from '../src/Core';
import { Source } from '../src/Sources';
import { StringInput, StringOutput } from '../src/io';

const currentLogLines = [];

afterEach(() => {
    if(currentLogLines.length) {
	console.log(currentLogLines.join('\n') + '\n');
	currentLogLines.length = 0;
    }
});

const defaultArgs = {
    readerName: 'standalone',
    parserName: 'restructuredtext',
    usage: '',
    description: '',
    enableExitStatus: true,
    writerName: 'xml',
};

const defaultSettings = {
    debug: true,
    autoIdPrefix: 'auto',
    idPrefix: '',
};

test('full rst2xml pipeline with specific input', () => {
    const settings = { ...defaultSettings };
    const args = { ...defaultArgs };

    const debugLog = [];
    const debugFn = (msg) => {
	console.log(msg);
//	currentLogLines.push(msg);
    };

    const { readerName, parserName, writerName } = args;
    const source = new StringInput({ source: `
Want to learn about \`my favorite programming language\`_?

.. _my favorite programming language: http://www.python.org` });
        const destination = new StringOutput({});
    const pub = new Publisher({
 source, destination, settings, debug: true, debugFn
});
    pub.setComponents(readerName, parserName, writerName);
    return new Promise((resolve, reject) => {
	pub.publish({}, (error, ...args) => {
	    if (error) {
		reject(error);
		return;
	    }
	    expect(destination.destination).toMatchSnapshot();
	    currentLogLines.length = 0;
	    resolve();
	});
    });
});

test.each([['Title', 'Title\n=====\nParagraph.'],
	   ['Short overline', '===\nTitle\n===\n'],
	   ['Short overline 2', '===\nTitle\n'],
	   ['Incomplete title', '=====\nTitle\n'],
	   ['bullet from spec', `- This is a bullet list.

- Bullets can be "*", "+", or "-".`],
	   ['Bullet no unindent', '* bullet'],
	   ['Nested bullets', '* bullet\n\n + bullet\n\n + bullet\n\n* bullet\n'],
	   ['Transition correction', '====::\n'],
	   ['Mixed bullets', '* bullet\n+ bullet\n'],
	   ['Transition marker', '-------\n\n'],
	   ['Bullet list, invalid input', '* bullet\ninvalid'],
	   ['Bullet list, invalid input line', '* bullet\n-----------'],
	   ['Bullet list, invalid input field marker', '* bullet\n:Hello: foo\n'],
	   ['Bullet list, invalid input doctest', '* bullet\n>>> foo\n'],
	   ['Field list', `:Author: David Goodger
:Contact: docutils-develop@lists.sourceforge.net
:Revision: $Revision: 8205 $
:Date: $Date: 2017-11-27 03:07:28 -0800 (Mon, 27 Nov 2017) $
:Copyright: This document has been placed in the public domain.
`],
	   ['option list', `         -a            command-line option "a"
         -b file       options can have arguments
                       and long descriptions
         --long        options can be long also
         --input=file  long options can also have
                       arguments
         /V            DOS/VMS-style options too
`],
	   ['literal block', `      Literal blocks are either indented or line-prefix-quoted blocks,
      and indicated with a double-colon ("::") at the end of the
      preceding paragraph (right here -->)::

          if literal_block:
              text = 'is left as-is'
              spaces_and_linebreaks = 'are preserved'
              markup_processing = None
`],
	   ['literal block without blank finish', `      Literal blocks are either indented or line-prefix-quoted blocks,
      and indicated with a double-colon ("::") at the end of the
      preceding paragraph (right here -->)::

          if literal_block:
              text = 'is left as-is'
              spaces_and_linebreaks = 'are preserved'
              markup_processing = None`],
	   ['block quote', `      Block quotes consist of indented body elements:

          This theory, that is mine, is mine.

          -- Anne Elk (Miss)
`],
	   ['doctest block', `      >>> print 'Python-specific usage examples; begun with ">>>"'
      Python-specific usage examples; begun with ">>>"
      >>> print '(cut and pasted from interactive Python sessions)'
      (cut and pasted from interactive Python sessions)
`],
	   ['substitution definition', `.. |symbol here| image:: symbol.png\n`],
	   ['definition list', `what
    Definition lists associate a term with a definition.

how
    The term is a one-line phrase, and the definition is one
    or more paragraphs or body elements, indented relative to
    the term.
`],
	   ['definition list with classifier term', `term : classifier\n   test\n\nwhat
    Definition lists associate a term with a definition.

how
    The term is a one-line phrase, and the definition is one
    or more paragraphs or body elements, indented relative to
    the term.
`],

	   ['Random', '* bullet\n* bullet\n\n '],
	   ['Random 2', 'Header 1\n========\nText\n\nHeader 2\n-------'],
	   ['Random 2', 'Test.\nTest2\nTest3\n-----'],
	   ['Random 4', `Test3
-----

This is a test.

* BUllet list 1
* The emacs rst editor is weird.`],
	   ['Emphasis', '*hello*'],
	   ['Emphasis surrounded by text', 'stuff *hello* things'],
	   ['Emphasis preceded by text', 'stuff *hello*'],
	   ['Emphasis followed by text', '*hello* test'],
	   ['Strong', '**hello**'],
	   ['Emphasis and inline', '*hello* and **goodbye**'],
	   ['Inline followed by emphasis', '**hello** and *goodbye*'],
	   ['docutils title', '==========================================\n Docutils_ Project Documentation Overview\n==========================================\n'],
	   ['Paragraph ending in ::', 'This is my paragraph ending in::\n'],
	  ])('%s', (a, raw) => {
	      const settings = { ...defaultSettings };
	      const args = { ...defaultArgs };
	      const debugLog = [];
	      const debugFn = (msg) => {
		  currentLogLines.push(msg);
	      };

	      const { readerName, parserName, writerName } = args;
//	      console.log(raw);
	      const source = new StringInput({ source: raw });
	      const destination = new StringOutput({});
	      const pub = new Publisher({
		  source, destination, settings, debug: true, debugFn
});
	      pub.setComponents(readerName, parserName, writerName);
	      return new Promise((resolve, reject) => {
		  /* {argv, usage, description, settingsSpec, settingsOverrides, configSection, enableExitStatus } */
		  pub.publish({}, (error, ...args) => {
		      if (error) {
			  reject(error);
			  return;
		      }
		      expect(destination.destination).toMatchSnapshot();
		      currentLogLines.length = 0;
		      resolve();
		  });
	      });
	  });
