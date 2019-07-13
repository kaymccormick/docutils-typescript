/** @uuid 926cc2ab-a551-48d1-9706-7598d2eb556e
*/
/*
 * @uuid 6fb5e325-09c7-476d-afee-ab43fb48ee5f
*/
export default class StateCorrection extends Error {
    args: string[];

    public constructor(arg1: string, arg2: string) {
        // @ts-ignore
        super();

        this.args = [arg1, arg2];

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, StateCorrection);
        }
    }
}