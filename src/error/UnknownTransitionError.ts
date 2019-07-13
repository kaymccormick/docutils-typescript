/** @uuid 150e5b44-1dfe-4a5a-be57-d6720d9732e7
*/
class UnknownTransitionError extends Error {
    transition: string;

    public constructor(transition: string) {
        super();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnknownTransitionError);
        }

        this.transition = transition;
        this.message = `Unknown transition ${transition}`;
    }
}

export default UnknownTransitionError;