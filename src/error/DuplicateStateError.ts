/**/
/**
 * @uuid daf0f97d-846c-4ab0-a8d8-304f840a5a61
 */
class DuplicateStateError extends Error {
    public state: string;
    public message: string;
    public constructor(stateName: string) {
        super();
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DuplicateStateError);
        }
        this.state = stateName;
        this.message = `Duplicate state ${stateName}`;
    }
}

/**
 * @uuid 58d8de68-8936-4dcb-9576-fa8851144c14
 */
export default DuplicateStateError;
