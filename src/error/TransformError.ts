/** @uuid e7018b90-7f54-4936-8a32-9a506508e45c
*/
/*
 * @uuid 7f2cea53-f436-4d0b-b836-598b94dc7d66
*/
export default class TransformError extends Error {
    public constructor(message: string) {
        super();

        /* instanbul ignore else */
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, TransformError);
        }

        this.message = message;
    }
}