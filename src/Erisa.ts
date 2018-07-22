import Eris from 'eris';
import {default as minimatch} from 'minimatch';
import awaitMessageHandler from './awaitMessageHandler';
import {AwaitTimeout, AwaitingObject, AwaitMessageOptions, ErisaOptions, Matchable, MiddlewareHandler} from './types';

export default class Erisa extends Eris.Client {
    public handlers: Map<Matchable, MiddlewareHandler[]>;
    public currentlyAwaiting: Map<string, AwaitingObject>;

    constructor(token: string, options: ErisaOptions = {}) {
        super(token, options.erisOptions);

        this.handlers = new Map();
        this.currentlyAwaiting = new Map();

        this.on('*', this.handleEvent('*'));
        this.use('createMessage', awaitMessageHandler);
    }

    use(...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;
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

    disuse(events: Matchable | Matchable[], ...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;
    disuse(events: Matchable | Matchable[]): this;
    disuse(...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;

    disuse(...args) {
        const flattenedArgs = [].concat.apply([], args);
        const removeHandlers = (ev: Matchable, handlers: MiddlewareHandler[]) => {
            if (!this.handlers.get(ev)) return;
            if (!handlers.length) handlers = this.handlers.get(ev)!;

            for (const handler of handlers) {
                const ourHandlers: [Matchable, MiddlewareHandler[]][] = ev === '*'
                    ? Array.from(this.handlers).filter(([_, hndlrs]) => hndlrs.includes(handler))
                    : [[ev, this.handlers.get(ev)!]] as [Matchable, MiddlewareHandler[]][]; // tslint:disable-line

                for (const [event, hndlrs] of ourHandlers) this.handlers.set(event, hndlrs.splice(hndlrs.indexOf(handler), 1));
            }

            if (!this.handlers.get(ev)!.length) {
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
        const deferred = {promise, resolve, reject};
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

    emit(event: string | symbol, ...args: any[]): boolean {
        super.emit('*', event, args);

        return super.emit(event, ...args);
    }

    private handleEvent(ev: string): (...args: any[]) => void {
        if (ev === '*') return function(event, ...args) {
            const matchingEvents = Array.from(this.handlers.keys()).filter(k => k instanceof RegExp ? k.test(event) : minimatch(event, k as string));
            const handlers = Array.from(this.handlers.entries()).filter(([k]) => matchingEvents.includes(k)).map(v => v[1]);

            for (const handler of handlers) handler({event, erisa: this}, ...args);
        }.bind(this);

        return function(...args) {
            if (!this.handlers.get(ev)) return;

            for (const handler of this.handlers.get(ev)) handler(ev, ...args);
        }.bind(this);
    }
}
