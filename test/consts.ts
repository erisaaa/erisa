/*
 * Export variables for the various tests in order to have them cleaned up a bit.
 */
import tc from 'turbocolor';

// index.test.ts
export const events = ['foo', 'bar', 'foobar'];
export const handlers = [
    'foo',
    'bar',
    'foobar',
    'faz',
    'baz',
    'fazbaz',
    'foobaz'
].map(v => () => {v}); // tslint:disable-line
export const mixedHandlers = [...handlers.slice(0, 3), [handlers[3], handlers[4]], handlers[5], [handlers[6]]];
export const tests = {
    'single handler': handlers[0],
    'handler array': handlers,
    'rest handlers': handlers,
    'mix of handlers and arrays': mixedHandlers
};

// logger.test.ts
export const testString = 'This is a test.';
export const customLevel = {
    tagText: tc.bgCyan('[FOO]'),
    textFunc: str => tc.cyan.bold(testString)
};
