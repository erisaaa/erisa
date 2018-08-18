/* tslint:disable no-unused-expression */

import 'mocha';
import Eris from 'eris';
import {expect} from 'chai';
import {Erisa, Formattable} from 'erisa_';
import {events, mixedHandlers, handlers, tests} from './consts';

type VoidFunc = () => void;

let client = new Erisa('nothing');

function curry(func, ...args) {
    return () => func(...args);
}

beforeEach(() => {
    // Reset client for each test.
    client = new Erisa('nothing');
});

describe('erisa', () => {
    describe('Erisa', () => {
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

        describe('#usePairs', () => {
            it('should return `this`', () => {
                expect(client.usePairs()).to.equal(client);
            });

            it('should register the provided pairs of events and middleware correctly', () => {
                client.usePairs(['foo', handlers[0]]);
                client.usePairs(['bar', handlers[0]], ['bar', handlers[1]], ['foobar', handlers[2]]);

                expect(client.handlers.get('foo')).to.deep.equal([handlers[0]]);
                expect(client.handlers.get('bar')).to.deep.equal([handlers[0], handlers[1]]);
                expect(client.handlers.get('foobar')).to.deep.equal([handlers[2]]);
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

        describe('#handleEvent', () => {
            it('should return a function', () => {
                expect(client.handleEvent('foo')).to.be.a('function');
            });

            describe('returned function', () => {
                it('should fire the assigned event', done => {
                    const func = client.handleEvent('foo');

                    client.use('foo', () => done()); // tslint:disable-line no-unnecessary-callback-wrapper
                    func();
                });

                it("shouldn't fire any other event other than the assigned event", done => {
                    const func = client.handleEvent('foo');

                    client.use('bar', () => done(new Error('This should never be reached.')));
                    func();
                    setTimeout(done, 0);
                });

                describe('star (wildcard)', () => {
                    it('should run any event', done => {
                        const func = client.handleEvent('*');
                        let times = 0;
                        function call() {
                            times++;
                            console.log(times);

                            if (times === 3) done();
                        }

                        client.use('foo', call);
                        client.use('bar', call);
                        client.use('foobar', call);

                        func('foo');
                        func('bar');
                        func('foobar');
                    });

                    it('should match wildcard and regex events', done => {
                        const func = client.handleEvent('*');
                        const badde = () => done(new Error('This should never be reached.'));
                        let times = 0;
                        function call() {
                            times++;

                            if (times === 3) done();
                        }

                        client.use('*', call);
                        client.use(/foo/, call);
                        client.use('f*', call);

                        client.use('bar', badde);
                        client.use(/bar/, badde);
                        client.use('b*', badde);

                        func('foo');
                    });
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

        describe('#format', () => {
            it('should throw an error when given an unknown object', () => {
                const fakeClass = class {};

                expect(curry(client.format, null as any)).to.throw(TypeError, 'Unable to format object: null');
                expect(curry(client.format, undefined as any)).to.throw(TypeError, 'Unable to format object: undefined');
                expect(curry(client.format, false as any)).to.throw(TypeError, 'Unable to format object: false');
                expect(curry(client.format, new fakeClass() as any)).to.throw(TypeError, `Unable to format object: ${fakeClass.name}`);
            });

            describe('formatting objects', () => {
                describe('members', () => {
                    const mem = new Eris.Member({nick: 'Foo'} as any, null as any);
                    mem.user = {username: 'foo', discriminator: '0000'} as any;

                    it("should show the member's nickname", () => {
                        expect(client.format(mem)).to.equal('Foo#0000');
                    });

                    it("should show the member's username", () => {
                        mem.nick = undefined;

                        expect(client.format(mem)).to.equal('foo#0000');
                    });

                    it("shouldn't show the member's discriminator", () => {
                        mem.nick = 'Foo';

                        expect(client.format(mem, true)).to.equal('Foo');
                    });
                });

                describe('users', () => {
                    const user = new Eris.User({username: 'foo', discriminator: '0000'} as any, client);

                    it("should show the user's full tag", () => {
                        expect(client.format(user)).to.equal('foo#0000');
                    });

                    it("shouldn't show the user's discriminator", () => {
                        expect(client.format(user, true)).to.equal('foo');
                    });
                });

                describe('roles', () => {
                    const role = new Eris.Role({id: '1234567890', name: 'foo', mentionable: true}, {} as any);

                    it("should show the role's mention", () => {
                        expect(client.format(role)).to.equal(role.mention);
                    });

                    it("should only show the role's name", () => {
                        role.mentionable = false;

                        expect(client.format(role)).to.equal('foo');
                    });
                });

                describe('channels', () => {
                    const channel = new Eris.Channel({id: '1234567890'});

                    it("should show the channel's mention", () => {
                        expect(client.format(channel)).to.equal(channel.mention);
                    });
                });

                describe('guilds', () => {
                    const guild = new Eris.Guild({name: 'foo'} as any, client);

                    it("should show the guild's name", () => {
                        expect(client.format(guild)).to.equal('foo');
                    });
                });
            });
        });
    });
});
