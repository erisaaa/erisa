import * as Eris from 'eris';
import {AwaitingObject, AwaitMessageOptions, ErisaOptions, MiddlewareHandler} from './typedefs';

export default class Erisa extends Eris.Client {
    public handlers: Map<string, MiddlewareHandler[]>;
    public currentlyAwaiting: Map<string, AwaitingObject>;

    constructor(token: string, options: ErisaOptions = {}) {
        super(token, options.erisOptions);

        this.handlers = new Map();
        this.currentlyAwaiting = new Map();
    }

    use(...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;
    use(events: string | string[], ...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;

    use(...args) {
        const flattenedArgs = [].concat.apply([], args);
        const setHandlers = (ev: string, handlers: MiddlewareHandler[]) => {
            if (!this.handlers.get(ev)) this.handlers.set(ev, handlers);
            else this.handlers.set(ev, this.handlers.get(ev)!.concat([], handlers)); // typescript is dumb here :(

            if (!this.eventNames().includes(ev)) this.on(ev, this.handleEvent(ev));
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

    awaitMessage(channelID: string, userID: string, options?: AwaitMessageOptions): Promise<Eris.Message> {
        let resolve, reject;
        const id = channelID + userID;
        const {timeout = 15000, filter = () => true} = options || {};
        const promise = new Promise<Eris.Message>((...args) => {
            [resolve, reject] = args;
        });

        const deferred = {promise, resolve, reject};
        const timer = setTimeout(() => {
            deferred.reject(new Error('Message await expired.'));
            this.currentlyAwaiting.delete(id);
        }, timeout);

        this.currentlyAwaiting.set(id, {
            p: deferred,
            filter,
            timer
        });

        return deferred.promise;
    }

    private handleEvent(ev: string): (...args: any[]) => void {
        return function(...args) { // tslint:disable-line
            if (!this.handlers.get(ev)) return;

            for (const handler of this.handlers.get(ev)) handler(ev, ...args);
        };
    }
}
