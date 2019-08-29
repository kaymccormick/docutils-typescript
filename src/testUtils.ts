import { newDocument } from './newDocument';
import newReporter    from './newReporter';
import { defaultPublisherOptions } from '../src/constants';
import { getDefaultSettings } from './settingsHelper';
import winston, { format, transports, LoggerOptions, Logger } from 'winston';
import { defaultConsoleLogLevel } from './constants';
import {Publisher} from './Publisher';
import path from 'path';
import StateFactory from './parsers/rst/StateFactory';
import RSTStateMachine from './parsers/rst/RSTStateMachine';
import { LoggerType } from './types';
import process from 'process';

let _logger: LoggerType|undefined;

export function createLogger(options?: LoggerOptions): LoggerType {
    if(_logger !== undefined) {
        return _logger;
    }
    let myOpt = options === undefined ? {} : { ...options};
    if(myOpt.format === undefined) {
        myOpt.format = format.json();
    }
    if(myOpt.transports === undefined) {
        myOpt.transports = [
            new transports.Console({level: defaultConsoleLogLevel}),
            new transports.File({filename: `${path.basename(process.argv[1])}-${process.pid}.log`, level: 'silly'}),
        ];
    }
    _logger = winston.createLogger(myOpt);
    return _logger;
}

export function createPublisher() {
    const publisher = new Publisher({ ...defaultPublisherOptions, logger: createLogger() });
    publisher.setComponents(defaultPublisherOptions.readerName, defaultPublisherOptions.parserName, 'xml');
    return publisher;
}

export function createRSTStateMachine(args: {logger: LoggerType}) {
const sm = new RSTStateMachine({
            stateFactory: new StateFactory({logger: args.logger}),
            initialState: 'Body',
            debugFn: args.logger.debug.bind(args.logger),
            debug: true,
	    logger: args.logger,
        });
	return sm;

}


export function createStateFactory(): StateFactory {
    return new StateFactory({ logger: createLogger() });
}

export function createNewDocument(sourcePath: string='default') {
    return newDocument({sourcePath, logger: createLogger()}, getDefaultSettings());
}
  
export function createNewReporter(sourcePath: string='default') {
    return newReporter({sourcePath}, getDefaultSettings());
}
