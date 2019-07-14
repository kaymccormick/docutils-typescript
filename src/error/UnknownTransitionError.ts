/**/
/**
 * @uuid 780bb874-9030-4840-b873-b5887a5c7528
 */
class UnknownTransitionError extends Error {
    private transition: string
    public constructor(transition: string) {
        super();
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UnknownTransitionError);
        }
        this.transition = transition;
        this.message = `Unknown transition ${transition}`;
    }
}

/**
 * @uuid 150e5b44-1dfe-4a5a-be57-d6720d9732e7
 */
export default UnknownTransitionError;
