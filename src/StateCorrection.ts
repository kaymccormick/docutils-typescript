/** @uuid 926cc2ab-a551-48d1-9706-7598d2eb556e
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