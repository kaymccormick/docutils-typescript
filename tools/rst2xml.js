#!/usr/bin/node

require("@babel/polyfill")

var path = require('path')
function _getCallerFile() {
    var originalFunc = Error.prepareStackTrace;

    	let callerfile;
		let callerlineno;
    try {
        var err = new Error();

        Error.prepareStackTrace = function (err, stack) { return stack; };

	const x = err.stack.shift();
 	const currentfile = x.getFileName();
	const currentlineno = x.getLineNumber();
//	process.stderr.write(`${currentfile} ${currentlineno}\n`);

        while (err.stack.length) {
	const x2 = err.stack.shift();
        callerfile = x2.getFileName();
	callerlineno = x2.getLineNumber();

            if(currentfile !== callerfile) break;
            }
    } catch (e) {
        console.log(e);
    }

    Error.prepareStackTrace = originalFunc; 

    return [callerfile, callerlineno];
}

var _Core = require("../lib/Core");

function log(...args) {
process.stderr.write(path.relative(__dirname,  _getCallerFile().join(':')) + ": " +args.map(x => typeof x == 'string' ? x : JSON.stringify(x)).join(' ') + "\n");
}
console.log = log;

const description = 'Generates Docutils-native XML from standalone ' + 'reStructuredText sources.  ' + _Core.defaultDescription;
(0, _Core.publishCmdLine)({
  argv: ['in.rst'],
  writerName: 'xml',
  description
}, (...args) => {
});
