/**/
/**
 * @uuid fbbf52aa-dbdf-4123-aa9e-c24ab3f26486
 */
class DuplicateTransitionError extends Error {
    message: string;
    transition: string;

    public constructor(transition: string) {
        super();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DuplicateTransitionError);
        }

        this.transition = transition;
        this.message = `Duplicate transition ${transition}`;
    }
}

/**
 * @uuid 0201a231-4a03-43d0-84b8-fdf48ef42432
 */
export default DuplicateTransitionError;
