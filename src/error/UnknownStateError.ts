/** @uuid 6476ee06-84ad-499a-b157-4c2981384cf8
*/
import { StateInterface } from "../types";

/*
 * @uuid 88923510-3c1f-4109-84dd-5f21e2bf352e
*/
class UnknownStateError extends Error {
    state: string;

    // @ts-ignore
    public constructor(state: string, info: string) {
        super();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnknownStateError);
        }

        this.state = state;
        this.message = `Unknown state ${state}${info ? `: ${info}` : ""}`;
    }
}

export default UnknownStateError;