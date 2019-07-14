/**
 * @uuid 2afdc5fd-85c2-4a2f-827c-abe96d2d1076
 */
import { NodeInterface } from "./types";

/*
 * @uuid eb912b7c-0983-4271-863b-23130cecd528
*/
export class UnimplementedError extends Error {
    // @ts-ignore
    public constructor(message?: string) {
        super(message);
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnimplementedError);
        }
        this.message = message || '';
    }
}


/*
 * @uuid b3a69d18-caac-4a4e-9bba-25868c870b5c
*/
export class InvalidStateError extends Error {
    // @ts-ignore
    public constructor(message?: string) {
        super(message);
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidStateError);
        }
        this.message = message || '';
    }
}

/*
 * @uuid 432e6258-f2df-4af3-8add-33431b3d5275
*/
export class EOFError extends Error {
    public constructor() {
        super();
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, EOFError);
        }
    }
}


/*
 * @uuid 2988a140-c2ec-43e7-a293-cb00de925fe6
*/
export class InvalidArgumentsError extends Error {
    public constructor(message: string) {
        super();
        this.message = message;
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidArgumentsError);
        }
    }
}

export const InvalidArgumentError = InvalidArgumentsError;


/*
 * @uuid 418c8fbe-01d1-4fbc-892f-8a4397479528
*/
export class SystemMessage extends Error {
    public msg: NodeInterface;
    public level: number;
    public constructor(msg: NodeInterface, level: number, ...params: []) {
        super(...params);
        this.message = msg.astext();
        this.msg = msg;
        this.level = level;
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SystemMessage);
        }
    }
}
interface ErrorArgs {
    error?: Error | undefined;
}

/*
 * @uuid f57f1c08-f562-4427-b460-6901eb9a4bdb
*/
export class ApplicationError extends Error {
    public error: Error | undefined;
    public args: ErrorArgs;
    public constructor(message: string, args: ErrorArgs={}) {
        super(message);
        this.args = args;
        if(args !== undefined) {
            this.error = args.error;
        }
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApplicationError);
        }
    }
}

/*
 * @uuid cca9cf0f-f4d9-4514-ad0a-d35d35aea8a0
*/
export class DataError extends ApplicationError {
    public constructor(message: string, args?: ErrorArgs) {
        super(message, args);
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DataError);
        }
    }
}

/*
 * @uuid aabf8730-b3d3-4d6e-a550-9ff63bf96dd0
*/
export class AssertError extends Error {
    public constructor(message: string) {
        super(message);
        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AssertError);
        }
        this.message = message;
    }
}
