import Eris from 'eris';
import pkg from '../package.json';
import {AwaitingObject, AwaitMessageOptions, ErisaOptions, MiddlewareHandler} from './typedefs';

export default class Erisa extends Eris.Client {
    public erisaVersion: string;
    protected handlers: Map<string, MiddlewareHandler[]>;
    private currentlyAwaiting: Map<string, AwaitingObject>;

    constructor(token: string, options: ErisaOptions) {
        super(token, options.erisOptions);

        this.erisaVersion = pkg.version;
        this.handlers = new Map();
        this.currentlyAwaiting = new Map();
    }

    use(events: string | string[], ...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;
    use(...handlers: (MiddlewareHandler | MiddlewareHandler[])[]): this;

    use(...args) {
        const flattenedArgs = [].concat.apply(args);

        function setHandlers(ev, handlers) {
            if (!this.handlers.get(ev)) this.handlers.set(ev, handlers);
            else this.handlers.set(ev, this.handlers.get(ev).concat(handlers));

            if (!this.eventNames().includes(ev)) this.on(ev, this.handleEvent(ev));
        }

        if (typeof args[0] === 'function' || flattenedArgs.reduce((m, v) => m && typeof v === 'function', true)) setHandlers('*', flattenedArgs);
        else {
            let [events, ...handlers] = args;
            handlers = [].concat.apply(handlers);
            events = typeof events === 'string' ? [events] : events;

            for (const ev of events) setHandlers(ev, handlers);
        }

        return this;
    }

    handleEvent(ev: string): (...args: any[]) => void {
        return function(...args) { // tslint:disable-line
            if (!this.handlers.get(ev)) return;

            for (const handler of this.handlers.get(ev)) handler(ev, ...args);
        };
    }

    awaitMessage(channelID: string, userID: string, options?: AwaitMessageOptions): Promise<Eris.Message> {
        let resolve, reject;
        const id = channelID + userID;
        const {timeout = 15000, filter = () => true} = options || {};
        const promise = new Promise((...args) => {
            [resolve, reject] = args;
        });

        const deferred = {promise, resolve, reject};
        const timer = setTimeout(() => {
            if (deferred.promise.isPending) {
                deferred.reject(new Error('Message await expired.'));
                this.currentlyAwaiting.delete(id);
            }
        }, timeout);

        this.currentlyAwaiting.set(id, {
            p: deferred,
            filter,
            timer
        });

        return deferred.promise;
    }
}
