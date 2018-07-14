import {ClientOptions} from 'eris';

export type MiddlewareHandler = (eventName: string, , ...eventArgs: any[]) => Error?;

export interface AwaitMessageOptions {
    timeout: number;
    filter(msg: Eris.Message): boolean;
}

export interface ErisaOptions {
    erisOptions: ClientOptions;
}
