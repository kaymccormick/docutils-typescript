/** @uuid 58d8de68-8936-4dcb-9576-fa8851144c14
*/
class DuplicateStateError extends Error {
    state: string;
    message: string;

    public constructor(stateName: string) {
        super();

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DuplicateStateError);
        }

        this.state = stateName;
        this.message = `Duplicate state ${stateName}`;
    }
}

export default DuplicateStateError;