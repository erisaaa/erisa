import 'mocha';
import {expect} from 'chai';
import Erisa from '..';

let client = new Erisa('nothing');
const events = ['foo', 'bar', 'foobar'];
const handlers = [
    'foo',
    'bar',
    'foobar',
    'faz',
    'baz',
    'fazbaz',
    'foobaz'
].map(v => () => {v}); // tslint:disable-line
const mixedHandlers = [...handlers.slice(0, 3), [handlers[3], handlers[4]], handlers[5], [handlers[6]]];

beforeEach(() => {
    // Reset client for each test.
    client = new Erisa('nothing');
});

describe('Middleware loader and unloader', () => {
    describe('#use', () => {
        it('should register the handler under the correct event', () => {
            client.use('foo', handlers[0]);
            expect(client.handlers.get('foo')).to.deep.equal([handlers[0]]);
        });

        it('should register the handler array under the correct event', () => {
            client.use('foo', handlers);
            expect(client.handlers.get('foo')).to.deep.equal(handlers);
        });

        it('should register the rest values of handlers under the correct event', () => {
            client.use('foo', ...handlers);
            expect(client.handlers.get('foo')).to.deep.equal(handlers);
        });

        it('should register the mix of handlers and arrays of handlers under the correct event', () => {
            client.use('foo', ...mixedHandlers);
            expect(client.handlers.get('foo')).to.deep.equal(handlers);
        });

        it('should register the handler under all the events provided', () => {
            client.use(events, handlers[0]);

            for (const ev of events) expect(client.handlers.get(ev)).to.deep.equal([handlers[0]]);
        });

        it('should register the handler array under all the events provided', () => {
            client.use(events, handlers);

            for (const ev of events) expect(client.handlers.get(ev)).to.deep.equal(handlers);
        });

        it('should register the rest values of handlers under all the events provided', () => {
            client.use(events, ...handlers);

            for (const ev of events) expect(client.handlers.get(ev)).to.deep.equal(handlers);
        });

        it('should register the mix of handlers and arays of handlers under all the events provided', () => {
            client.use(events, ...mixedHandlers);

            for (const ev of events) expect(client.handlers.get(ev)).to.deep.equal(handlers);
        });

        it('should register the handler under the `*` event', () => {
            client.use(handlers[0]);
            expect(client.handlers.get('*')).to.deep.equal([handlers[0]]);
        });

        it('should register the handler array under the `*` event', () => {
            client.use(handlers);
            expect(client.handlers.get('*')).to.deep.equal(handlers);
        });

        it('should register the rest value of handlers under the `*` event', () => {
            client.use(...handlers);
            expect(client.handlers.get('*')).to.deep.equal(handlers);
        });

        it('should register the mix of handlers and arrays of handlers under the `*` event', () => {
            client.use(...mixedHandlers);
            expect(client.handlers.get('*')).to.deep.equal(handlers);
        });
    });
});
