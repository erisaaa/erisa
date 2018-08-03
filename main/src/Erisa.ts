import Eris from 'eris';
import {default as minimatch} from 'minimatch';
import awaitMessageHandler from './awaitMessageHandler';
import {AwaitTimeout, AwaitingObject, AwaitMessageOptions, ErisaOptions, Matchable, MiddlewareHandler, DeferredPromise} from './types';

/**
 * The main Erisa client.
 */
export class Erisa extends Eris.Client {
    /** Collection containing the functions used to handle events. */
    public handlers: Map<Matchable, MiddlewareHandler[]> = new Map();
    /** Collection containing objects for messages that are currently being waited for. */
    public currentlyAwaiting: Map<string, AwaitingObject> = new Map();
    /** A regular object intended to store extensions from middleware, such as a command container. */
    public extensions: {[x: string]: any} = {};

    constructor(token: string, options: ErisaOptions = {}) {
        super(token, options.erisOptions);

        this.on('*', this.handleEvent('*'));
        this.use('createMessage', awaitMessageHandler);
    }

    /**
     * Registers global middleware to the client.
     *
     * @param handlers An array of functions to run on any event.
     * @returns The current client instance.
     */
    use(...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;

    /**
     * Registers middleware for specific events to the client.
     *
     * @param events The events to apply the handlers to.
     * @param handlers An array of functions to run for the provided events.
     * @returns The current client instance.
     */
    use(events: Matchable | Matchable[], ...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;

    use(...args) {
        const flattenedArgs = [].concat.apply([], args);
        const setHandlers = (ev: Matchable, handlers: MiddlewareHandler[]) => {
            if (!this.handlers.get(ev)) this.handlers.set(ev, handlers);
            else this.handlers.set(ev, this.handlers.get(ev)!.concat([], handlers)); // typescript is dumb here :(

            if (typeof ev === 'string' && !this.eventNames().includes(ev)) this.on(ev, this.handleEvent(ev));
        };

        if (typeof args[0] === 'function' || flattenedArgs.reduce((m, v) => m && typeof v === 'function', true)) setHandlers('*', flattenedArgs);
        else {
            let [events, ...handlers] = args;
            handlers = [].concat.apply([], handlers);
            events = typeof events === 'string' ? [events] : events;

            for (const ev of events) setHandlers(ev, handlers);
        }

        return this;
    }

    /**
     * Removes the provided middleware from the events given.
     *
     * @param events The events to remove the middleware from.
     * @param handlers The specific middleware to remove.
     * @returns The current client instance.
     */
    disuse(events: Matchable | Matchable[], ...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;

    /**
     * Removes all middleware from the events given.
     *
     * @param events The events to clear middleware from.
     * @returns The current client instance.
     */
    disuse(events: Matchable | Matchable[]): this;

    /**
     * Removes the provided middleware from all events they exist on.
     *
     * @param handlers The middleware functions to remove.
     * @returns The current client instance.
     */
    disuse(...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;

    disuse(...args) {
        const flattenedArgs = [].concat.apply([], args);
        const removeHandlers = (ev: Matchable, handlers: MiddlewareHandler[]) => {
            if (!this.handlers.get(ev) && ev !== '*') return;
            if (!handlers.length) handlers = this.handlers.get(ev)!;

            for (const handler of handlers) {
                const ourHandlers: [Matchable, MiddlewareHandler[]][] = ev === '*'
                    ? Array.from(this.handlers).filter(([_, hndlrs]) => hndlrs.includes(handler))
                    : [[ev, this.handlers.get(ev)!]] as [Matchable, MiddlewareHandler[]][]; // tslint:disable-line

                for (const [event, handlers_] of ourHandlers) {
                    const copied = handlers_.slice(); // Copies `handlers_` to a brand new object, instead of operating on the reference.

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

        if (typeof args[0] === 'function' || flattenedArgs.reduce((m, v) => m && typeof v === 'function', true)) removeHandlers('*', flattenedArgs);
        else {
            let [events, ...handlers] = args;
            handlers = [].concat.apply([], handlers);
            events = typeof events === 'string' ? [events] : events;

            for (const ev of events) removeHandlers(ev, handlers);
        }

        return this;
    }

    awaitMessage(channelID: string, userID: string, options?: AwaitMessageOptions): Promise<Eris.Message> {
        let resolve, reject;
        const id = channelID + userID;
        const {timeout = 15000, filter = () => true} = options || {};
        const promise = new Promise<Eris.Message>((...args) => {
            [resolve, reject] = args;
        });

        // Composes an object that resembles a semi-deconstructed promise, so that it can be returned now, and resolved/rejected at a later time.
        const deferred: DeferredPromise<Eris.Message, AwaitTimeout> = {promise, resolve, reject};
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
    handleEvent(ev: string): (...args: any[]) => void {
        if (ev === '*') return function(event, ...args) {
            const matchingEvents = Array.from(this.handlers.keys()).filter(k => (k instanceof RegExp ? k.test(event) : minimatch(event, k as string)) && event !== k);
            const handlers = [].concat.apply([], Array.from(this.handlers.entries()).filter(([k]) => matchingEvents.includes(k)).map(v => v[1]));

            for (const handler of handlers) handler({event, erisa: this}, ...args);
        }.bind(this);

        return function(...args) {
            if (!this.handlers.get(ev)) return;

            for (const handler of this.handlers.get(ev)) handler(ev, ...args);
        }.bind(this);
    }
}
