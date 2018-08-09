/* tslint:disable no-unused-expression */

import 'mocha';
import {expect} from 'chai';
import {stdout} from 'test-console';
import {Erisa} from 'erisa_';
import logger, {LoggerLevel} from '@erisa_/logger';
import {testString, customLevel} from './consts';

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

describe('logger', () => {
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
});
