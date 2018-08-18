/* tslint:disable no-unused-expression */

import 'mocha';
import {expect} from 'chai';
import {Erisa} from 'erisa_';
import {events, mixedHandlers, handlers, tests} from './consts';

type VoidFunc = () => void;

let client = new Erisa('nothing');

beforeEach(() => {
    // Reset client for each test.
    client = new Erisa('nothing');
});

describe('Middleware handling', () => {
    describe('#use', () => {
        it('should return `this`', () => {
            expect(client.use()).to.equal(client);
        });

        describe('registering under one event', () => {
            for (const [name, tester] of Object.entries(tests))
                specify(name, () => {
                    if (['rest handlers', 'mix of handlers and arrays'].includes(name)) client.use('foo', ...tester as (VoidFunc | VoidFunc[])[]);
                    else client.use('foo', tester as VoidFunc | (VoidFunc)[]);

                    // Everything other than the first test should be equal to `handlers`.
                    expect(client.handlers.get('foo')).to.deep.equal(name === 'single handler' ? [tester] : handlers);
                });
        });

        describe('registering under an event array', () => {
            for (const [name, tester] of Object.entries(tests))
                specify(name, () => {
                    if (['rest handlers', 'mix of handlers and arrays'].includes(name)) client.use(events, ...tester as (VoidFunc | VoidFunc[])[]);
                    else client.use(events, tester as VoidFunc | (VoidFunc)[]);

                    for (const ev of events) expect(client.handlers.get(ev)).to.deep.equal(name === 'single handler' ? [tester] : handlers);
                });
        });

        describe('implicitly registering under the `*` event', () => {
            for (const [name, tester] of Object.entries(tests))
                specify(name, () => {
                    if (['rest handlers', 'mix of handlers and arrays'].includes(name)) client.use(...tester as (VoidFunc | VoidFunc[])[]);
                    else client.use(tester as VoidFunc | VoidFunc[]);

                    expect(client.handlers.get('*')).to.deep.equal(name === 'single handler' ? [tester] : handlers);
                });
        });
    });

    describe('#disuse', () => {
        it('should return `this`', () => {
            expect(client.disuse(() => {})).to.equal(client);
        });

        describe('removing from explicitly defined events', () => {
            for (const [name, tester] of Object.entries(tests))
                specify(name, () => {
                    const result = ['rest handlers', 'mix of handlers and arrays'].includes(name) ? tester as VoidFunc[] : [tester] as [VoidFunc | VoidFunc[]];

                    client.use('foo', ...result);
                    client.disuse('foo', ...result);
                    expect(client.handlers.get('foo')).to.be.undefined;
                });
        });

        describe('implicitly removing all handlers from explicitly defined events', () => {
            for (const [name, tester] of Object.entries(tests))
                specify(name, () => {
                    const result = ['rest handlers', 'mix of handlers and arrays'].includes(name) ? tester as VoidFunc[] : [tester] as [VoidFunc | VoidFunc[]];

                    client.use('foo', ...result);
                    client.disuse('foo');
                    expect(client.handlers.get('foo')).to.be.undefined;
                });
        });

        describe("removing all handlers from existance on any event they're applied on", () => {
            for (const [name, tester] of Object.entries(tests))
                specify(name, () => {
                    const result = ['rest handlers', 'mix of handlers and arrays'].includes(name) ? tester as VoidFunc[] : [tester] as [VoidFunc | VoidFunc[]];

                    for (const ev of events) client.use(ev, ...result);

                    client.disuse(...result);

                    for (const ev of events) expect(client.handlers.get(ev)).to.be.undefined;
                });
        });
    });

    describe('#emit', () => {
        it('should emit a `*` event on any event, along with the original event', done => {
            let counter = 0;
            function hit() {
                counter++;

                if (counter === 2) done();
            }

            client.on('*', hit);
            client.on('foo', hit);

            client.emit('foo');
        });

        it('should provide the original event name as the first argument to the `*` event', () => {
            client.on('*', ev => expect(ev).to.equal('foo'));

            client.emit('foo');
        });

        it('should provide any provided arguments to the event, to the `*` event after the event name argument', () => {
            client.on('*', (ev, ...args) => expect(args).to.deep.equal([1, 2, 3]));

            client.emit('foo', 1, 2, 3);
        });
    });
});
