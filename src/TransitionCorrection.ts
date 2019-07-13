/** @uuid 397564c5-a9ff-4a50-b5eb-fcfa3da546ec
*/
export default class TransitionCorrection extends Error {
    stateName: string;

    // @ts-ignore
    public constructor(stateName: string) {
        super();
        this.stateName = stateName;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TransitionCorrection);
        }
    }
}