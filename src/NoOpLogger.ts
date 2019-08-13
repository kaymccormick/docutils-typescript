import { LoggerType, LeveledLogMethod } from './types';

export class NoOpLogger implements LoggerType {
    debug: LeveledLogMethod;
    silly: LeveledLogMethod;
    error: LeveledLogMethod;
    warn: LeveledLogMethod;
    info: LeveledLogMethod;
    public constructor() {
        const f = (): LoggerType => { return this; };
        //@ts-ignore
        this.debug = f;
        //@ts-ignore
        this.info = f;
        //@ts-ignore
        this.silly = f;
        //@ts-ignore
        this.error = f;
        //@ts-ignore
        this.warn = f;
    }
}
