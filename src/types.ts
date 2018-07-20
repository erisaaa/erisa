import * as Eris from 'eris';
import Erisa from './Erisa';

export type MiddlewareHandler = (generalArgs: {event: string; erisa: Erisa}, ...eventArgs: any[]) => Error | void;
export type Matchable = string | RegExp;

export interface ErisaOptions {
    erisOptions?: Eris.ClientOptions;
}

export interface AwaitMessageOptions {
    timeout: number;
    filter(msg: Eris.Message): boolean;
}

export interface DeferredPromise {
    promise: Promise<any>;
    resolve(value?: any): Promise<any>;
    reject(error?: any): Promise<any>;
}

export interface AwaitingObject {
    p: DeferredPromise;
    timer: NodeJS.Timer;
    filter(msg: Eris.Message): boolean;
}

/**
 * An error that is thrown when an `awaitMessage` call expires.
 */
export class AwaitTimeout extends Error {
    constructor(message) {
        super(message);
        this.name = 'AwaitTimeout';
        this.stack = new Error().stack;
    }
}
