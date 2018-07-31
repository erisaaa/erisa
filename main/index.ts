import {Erisa} from './src/Erisa';
import {ErisaOptions} from './src/types';

// Exports stuff similar to Eris (exports main function that creates client, which has client and other stuff as properties).
interface ErisaExport {
    (token: string, options: ErisaOptions): Erisa;
    Erisa: typeof Erisa;
}

const _Erisa: ErisaExport = ((token: string, options: ErisaOptions = {}): Erisa =>
    new Erisa(token, options)) as ErisaExport;

_Erisa.Erisa = Erisa;

export = _Erisa;
