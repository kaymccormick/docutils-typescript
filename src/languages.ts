/** @uuid 10bfaf36-9321-43dd-8836-1628123c51f8
*/
import * as en from "./languages/en";

import { CoreLanguage, ReporterInterface } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getLanguage(languageCode: string, reporter: ReporterInterface): CoreLanguage | undefined {
    if (languageCode === "en") {
        return en;
    }

    return undefined;
}