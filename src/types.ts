import {ClientOptions} from 'eris';

export type MiddlewareHandler = (eventName?: string, , ...eventArgs?: any[]) => (Error | void)?;

export interface ErisaOptions {
    erisOptions?: ClientOptions;
}

export interface AwaitMessageOptions {
    timeout: number;
    filter(msg: Eris.Message): boolean;
}

export interface DeferredPromise {
    promise: Promise;
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
