/**
 * @uuid 2b0c8f26-be6e-45a6-951b-96c70f71f55b
 */
import Input from './io/Input';
import Output from './io/Output';
import { ReadInputCallback } from "./types";

/** Direct string input. 
 * @uuid ae2c2dd1-3766-4ae6-a68c-a3a4a0b71cb3
*/
export class StringInput extends Input {

    public constructor(source: string, sourcePath?: string, encoding?: string, errorHandler?: string) {
        super({source, sourcePath, encoding, errorHandler});
        this.sourcePath = '<string>';
    }

    public read(cb: ReadInputCallback<string|string[]|{}>): void {
        cb(undefined, this.source);
    }
}

/*
 * @uuid 11de15d8-c529-4ddd-830c-6254641c53dd
*/
export class StringOutput extends Output<string> {
    public constructor(
        destination?: string,
        destinationPath?: string,
        encoding?: string,
        errorHandler?: string
    ) {
        super(destination, destinationPath, encoding, errorHandler);
        this.defaultDestinationPath = '<string>';

    }

    public write(data: string): string {
        // self.destination = self.encode(data) // fixme encoding
        if (Array.isArray(data)) {
            data = JSON.stringify(data);
        }
        this.destination = data;
        return this.destination;
    }
}

