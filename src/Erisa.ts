import Eris from 'eris';
import { default as minimatch } from 'minimatch';

import awaitMessageHandler from './awaitMessageHandler';
import {
  AwaitingObject,
  AwaitMessageOptions,
  AwaitTimeout,
  DeferredPromise,
  ErisaOptions,
  Formattable,
  Matchable,
  MiddlewareHandler
} from './types';

type MiddlewareEvent = Matchable | Matchable[];
type MiddlewareFunction = MiddlewareHandler | MiddlewareHandler[] | void;

/**
 * The main Erisa client.
 */
export default class Erisa extends Eris.Client {
  /** Collection containing the functions used to handle events. */
  handlers: Map<Matchable, MiddlewareHandler[]> = new Map();
  /** Collection containing objects for messages that are currently being waited for. */
  currentlyAwaiting: Map<string, AwaitingObject> = new Map();
  /** A regular object intended to store extensions from middleware, such as a command container. */
  extensions: { [x: string]: any } = {};

  constructor(token: string, options: ErisaOptions = {}) {
    super(token, options.erisOptions);

    this.on('*', this.handleEvent('*'));
    this.use('messageCreate', awaitMessageHandler);
  }

  /**
   * Registers global middleware to the client.
   *
   * @param handlers An array of functions to run on any event.
   * @returns The current client instance.
   */
  use(...handlers: MiddlewareFunction[]): this;

  /**
   * Registers middleware for specific events to the client.
   *
   * @param events The events to apply the handlers to.
   * @param handlers An array of functions to run for the provided events.
   * @returns The current client instance.
   */
  use(events: MiddlewareEvent, ...handlers: MiddlewareFunction[]): this;

  /**
   * Registers pairs of middleware functions and event names. Intended for modules to utilise.
   *
   * @param pairs Array of pairs of middleware functions and events, or just functions.
   * @returns The current client instance.
   */
  use(
    pairs: Array<
      [MiddlewareEvent, MiddlewareFunction] | [MiddlewareFunction]
    > | void
  ): this;

  use(...args) {
    const flattenedArgs = args.flat().filter(v => v);
    const setHandlers = (ev: Matchable, handlers: MiddlewareHandler[]) => {
      if (!this.handlers.get(ev)) this.handlers.set(ev, handlers);
      else this.handlers.set(ev, this.handlers.get(ev)!.concat([], handlers)); // typescript is dumb here :(

      if (typeof ev === 'string' && !this.eventNames().includes(ev))
        this.on(ev, this.handleEvent(ev));
    };

    // Handle multi-registration (passing an array of pairs to #use).
    if (
      args.length === 1 &&
      Array.isArray(args[0]) &&
      Array.isArray(args[0][0])
    )
      for (const pair of args[0] as Array<
        [MiddlewareFunction] | [MiddlewareEvent, MiddlewareFunction]
      >)
        this.use(...(pair as any));
    // Handle only functions passed (register to *).
    else if (
      typeof args[0] === 'function' ||
      flattenedArgs.reduce((m, v) => m && typeof v === 'function', true)
    )
      setHandlers('*', flattenedArgs);
    else {
      let [events, ...handlers] = args;
      handlers = handlers.flat().filter(v => v); // Clean out void functions.
      events = !Array.isArray(events) ? [events] : events;

      for (const ev of events) setHandlers(ev, handlers);
    }

    return this;
  }

  /**
   * Remove middleware from events.
   *
   * @param events The events to remove the middleware from.
   * @param handlers The specific middleware to remove.
   * @returns The current client instance.
   */
  disuse(
    events: Matchable | Matchable[],
    ...handlers: Array<MiddlewareHandler | MiddlewareHandler[]>
  ): this;

  disuse(...handlers: Array<MiddlewareHandler | MiddlewareHandler[]>): this;

  disuse(...args) {
    const flattenedArgs = args.flat();
    const removeHandlers = (ev: Matchable, handlers_: MiddlewareHandler[]) => {
      if (!this.handlers.get(ev) && ev !== '*') return;
      const handlers = handlers_.length ? handlers_ : this.handlers.get(ev)!;

      for (const handler of handlers) {
        const ourHandlers: Array<[Matchable, MiddlewareHandler[]]> =
          ev === '*'
            ? Array.from(this.handlers).filter(([, hndlrs]) =>
                hndlrs.includes(handler)
              )
            : [[ev, this.handlers.get(ev)!]]; // tslint:disable-line

        for (const [event, handlers__] of ourHandlers) {
          const copied = handlers__.slice(); // Copies `handlers` to a brand new object, instead of operating on the reference.

          copied.splice(copied.indexOf(handler), 1);

          // Clean up as we go, especially when removing `*`.
          if (!copied.length) this.handlers.delete(event);
          else this.handlers.set(event, copied);
        }
      }

      if (this.handlers.get(ev) && !this.handlers.get(ev)!.length) {
        if (typeof ev === 'string') this.removeAllListeners(ev);
        this.handlers.delete(ev);
      }
    };

    if (
      typeof args[0] === 'function' ||
      flattenedArgs.reduce((m, v) => m && typeof v === 'function', true)
    )
      removeHandlers('*', flattenedArgs);
    else {
      let [events, ...handlers] = args;
      handlers = handlers.flat();
      events = typeof events === 'string' ? [events] : events;

      for (const ev of events) removeHandlers(ev, handlers);
    }

    return this;
  }

  awaitMessage(
    channelID: string,
    userID: string,
    options?: AwaitMessageOptions
  ): Promise<Eris.Message> {
    let resolve, reject;
    const id = channelID + userID;
    const { timeout = 15000, filter = () => true } = options || {};
    const promise = new Promise<Eris.Message>((...args) => {
      [resolve, reject] = args;
    });

    // Composes an object that resembles a semi-deconstructed promise, so that it can be returned now, and resolved/rejected at a later time.
    const deferred: DeferredPromise<Eris.Message, AwaitTimeout> = {
      promise,
      resolve,
      reject
    };
    const timer = setTimeout(() => {
      deferred.reject(new AwaitTimeout('Message await expired.'));
      this.currentlyAwaiting.delete(id);
    }, timeout);

    this.currentlyAwaiting.set(id, {
      p: deferred,
      filter,
      timer
    });

    return deferred.promise;
  }

  /**
   * Emits the provided event with the provided arguments, if any.
   * Also emits a wildcard "*" event for internal use.
   *
   * @param event Event to emit.
   * @param args Arguments for the event.
   * @returns `true` if the event had listeners, `false` otherwise.
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    super.emit('*', event, ...args);

    return super.emit(event, ...args);
  }

  /**
   * Creates a function applied to `client.on` in order to prevent overload of event listeners.
   *
   * @param ev Event to create a handler function for.
   * @returns Handler function.
   */
  handleEvent(ev: string): (...args: any[]) => Promise<void> {
    if (ev === '*')
      return async function(this: Erisa, event, ...args) {
        const matchingEvents = Array.from(this.handlers.keys()).filter(
          k =>
            (k instanceof RegExp ? k.test(event) : minimatch(event, k)) &&
            k !== event
        );
        const handlers = Array.from(this.handlers.entries())
          .filter(([event]) => matchingEvents.includes(event))
          .flatMap(([, handler]) => handler);

        for (const handler of handlers) // eslint-disable-next-line no-await-in-loop
          await handler({ event, erisa: this }, ...args);
      }.bind(this);

    return async function(this: Erisa, ...args) {
      if (!this.handlers.get(ev)) return;

      for (const handler of this.handlers.get(ev)!) // eslint-disable-next-line no-await-in-loop
        await handler({ event: ev, erisa: this }, ...args);
    }.bind(this);
  }

  /**
   * Formats a provided Eris object into a string form, since they don't have `.toString` methods.
   *
   * @param obj Object to format.
   * @param noDiscrim If formatting a user, whether to not include their discriminator in the resultant string.
   * @returns The formatted string.
   */
  format(obj: Formattable, noDiscrim?: boolean): string {
    let ret: string;

    if (obj instanceof Eris.Member)
      ret = `${obj.nick || obj.username}${
        !noDiscrim ? `#${obj.discriminator}` : ''
      }`;
    else if (obj instanceof Eris.User)
      ret = `${obj.username}${!noDiscrim ? `#${obj.discriminator}` : ''}`;
    else if (obj instanceof Eris.Role)
      ret = obj.mentionable ? obj.mention : obj.name;
    else if (obj instanceof Eris.Channel) ret = obj.mention;
    else if (obj instanceof Eris.Guild) ret = obj.name;
    else
      throw new TypeError(
        `Unable to format object: ${
          // @ts-ignore
          obj && obj.constructor ? obj.constructor.name : obj
        }`
      ); // tslint:disable-line

    return ret;
  }
}
