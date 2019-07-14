/**/
/**
 * @uuid ae4c58e6-8c85-44ae-b72b-26d9ff43d229
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
/**
 * @uuid b3e0be90-9c5c-4ae2-808f-6a3c26fbe463
 */
export default IndentationError;
