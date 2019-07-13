/** @uuid b3e0be90-9c5c-4ae2-808f-6a3c26fbe463
*/
class IndentationError extends Error {
    public constructor(message: string) {
        super();

        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, IndentationError);
        }

        this.message = message;
    }
}

export default IndentationError;