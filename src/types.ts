import Eris from 'eris';

import Erisa from './Erisa';

/** A type that is either just the given types, or a Promise that resolves to them. */
type OptionalAsync<T> = Promise<T> | T;

/** A function that gets passed to Erisa#use to handle incoming events. */
export type MiddlewareHandler = (
  generalArgs: { event: string; erisa: Erisa },
  ...eventArgs: any[]
) => OptionalAsync<Error | void>;
export type Matchable = string | RegExp;

/**
 * Function used in Erisa#format for custom formatting of objects.
 * Should throw FormatError if given a bad object.
 */
export type Formatter<T> = (obj: T, alt?: boolean) => string;

export interface ErisaOptions {
  erisOptions?: Eris.ClientOptions;
}

export interface AwaitMessageOptions {
  timeout?: number;
  filter?(msg: Eris.Message): boolean;
}

/**
 * An object representing a Promise that can be watched and triggered at different places.
 */
export interface DeferredPromise<T, U> {
  promise: Promise<T>;
  resolve(value?: T): void;
  reject(error?: U): void;
}

export interface AwaitingObject {
  p: DeferredPromise<Eris.Message, AwaitTimeout>;
  timer: NodeJS.Timer;
  filter(msg: Eris.Message): boolean;
}

/**
 * An error that is thrown when an `awaitMessage` call expires.
 */
// eslint-disable-next-line import/prefer-default-export
export class AwaitTimeout extends Error {
  /* istanbul ignore next */
  constructor(message) {
    super(message);
    this.name = 'AwaitTimeout';
    this.stack = new Error().stack;
  }
}
