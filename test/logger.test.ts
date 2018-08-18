/* tslint:disable no-unused-expression */

import 'mocha';
import {expect} from 'chai';
import {stdout} from 'test-console';
import {Erisa, MiddlewareHandler} from 'erisa_';
import logger, {LoggerLevel} from '@erisa_/logger';
import {testString, customLevel, logEvents} from './consts';

let client: Erisa = new Erisa('nothing');

client.use(logger(client));

let loggerExt: {
    levels: {[x: string]: LoggerLevel};
    dispatch(level: string, ...msgs: any[]): void;
} = client.extensions.logger;

beforeEach(() => {
    // Reset client for each test.
    client = new Erisa('nothing');
    client.use(logger(client));
    loggerExt = client.extensions.logger;
});

describe('@erisa/logger', () => {
    describe('printing the in-built levels', () => {
        for (const level of Object.keys(loggerExt.levels))
            specify(level, () => {
                const lvl = loggerExt.levels[level];
                const result = stdout.inspectSync(() => loggerExt.dispatch(level, testString));

                expect(result.length).to.equal(1);
                expect(result[0].trim()).to.equal(`${lvl.tagText} ${lvl.textFunc(testString)}`);
            });
    });

    it('should print regular text when a non-existant level is passed', () => {
        const result = stdout.inspectSync(() => loggerExt.dispatch('foo', testString));

        expect(result[0].trim()).to.equal(testString);
    });

    it('should run any levels that get added afterwords', () => {
        loggerExt.levels.foo = customLevel;
        const lvl = loggerExt.levels.foo;
        const result = stdout.inspectSync(() => loggerExt.dispatch('foo', testString));

        expect(result[0].trim()).to.equal(`${lvl.tagText} ${lvl.textFunc(testString)}`);
    });

    it('should not override the original logger extension when reapplied', () => {
        loggerExt.levels.foo = customLevel;

        client.use(logger(client));
        expect(client.extensions.logger).to.equal(loggerExt);
    });

    describe('defaultListeners', () => {
        it('should not return a middleware-function when false', () => {
            expect(logger(new Erisa('nothing'), false)).to.be.undefined;
        });

        describe('logging events', () => {
            const client2 = new Erisa('nothing');
            const eventFunc = logger(client2) as MiddlewareHandler; // Type assertion is needed because TypeScript doesn't understand the below call is a check, so the call below fails.

            expect(eventFunc).to.be.a('function');

            for (const [event, [before, args, expected, level]] of Object.entries(logEvents))
                specify(event, () => {
                    const lvl = client2.extensions.logger.levels[level];
                    const result = stdout.inspectSync(() => {
                        before(client2);
                        eventFunc({erisa: client2, event}, ...args);
                    });

                    expect(result.length).to.equal(1);
                    expect(result[0].trim()).to.equal(`${lvl.tagText} ${lvl.textFunc(expected)}`);
                });

            it("shouldn't log anything when given an event that isn't a default one", () => {
                const result = stdout.inspectSync(() => eventFunc({erisa: client2, event: 'foo'}));

                expect(result.length).to.equal(0);
            });

            const client3 = new Erisa('nothing');
            const eventFunc2 = logger(client3, ['ready']) as MiddlewareHandler;

            it('should only log the `ready` event, and not do anything on other ones', () => {
                const [before, args, expected, level] = logEvents.ready;
                const lvl = client3.extensions.logger.levels.info;
                const result = stdout.inspectSync(() => {
                    before(client3);
                    eventFunc2({erisa: client3, event: 'ready'}, ...args);
                    eventFunc2({erisa: client3, event: 'guildCreate'});
                });

                expect(result.length).to.equal(1);
                expect(result[0].trim()).to.equal(`${lvl.tagText} ${lvl.textFunc(expected)}`);
            });
        });
    });
});
