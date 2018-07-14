import {ClientOptions} from 'eris';

export type MiddlewareHandler = (eventName: string, , ...eventArgs: any[]) => Error?;

export interface ErisaOptions {
    erisOptions: ClientOptions;
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
