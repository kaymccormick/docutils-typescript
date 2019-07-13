/** @uuid 4bc5588a-a754-4a04-939a-5368abf29cc0
*/
import * as en from "./languages/en";

import { RSTLanguage } from "./types";

export function getLanguage(languageCode: string): RSTLanguage | undefined {
    if (languageCode === "en") {
        return en;
    }

    return undefined;
}