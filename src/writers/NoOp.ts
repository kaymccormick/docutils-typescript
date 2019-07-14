/**
 * @uuid 36d1d319-211d-40c4-9f3b-653d5bbc1b74
 */
import BaseWriter from '../Writer';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars */
const __docformat__ = 'reStructuredText';

/**
 * Writer class for POJOWriter
 *  
 * @uuid ac6fce10-ab92-4c34-abaa-cff81acae222
 */
class NoOpWriter extends BaseWriter {
    /**
     * Translate the document to plain old javascript object
     */
    public translate(): void {
        this.output = this.document;
    }
}

// NoOpWriter.settingsSpec = [
//     '"Docutils-js POJO" Writer Options',
//     null,
//     []];
export default NoOpWriter;
