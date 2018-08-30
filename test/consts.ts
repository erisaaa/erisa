/*
 * Export variables for the various tests in order to have them cleaned up a bit.
 */
import Eris from 'eris';
import tc from 'turbocolor';
import {Erisa} from 'erisa_';

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
export const logEvents: {
    [x: string]: [(client: Erisa) => any, any[], any, string];
} = {
    ready: [
        client => {
            const tmp = new Eris.ExtendedUser({id: '420blazeit'}, client);
            tmp.username = 'Test';
            client.user = tmp;
        },
        [],
        'Logged in as Test',
        'info'
    ],
    error: [
        () => void 0,
        [new Error('Test error'), 5],
        `Discord error for shard 5: ${new Error('Test error')}`,
        'error'
    ],
    warn: [
        () => void 0,
        ['Test warning', 5],
        'Discord warning for shard 5: Test warning',
        'warn'
    ],
    guildCreate: [
        () => void 0,
        [{name: 'Test', id: '1234567890'}],
        'Joined guild Test (1234567890)',
        'info'
    ],
    guildDelete: [
        () => void 0,
        [{name: 'Test', id: '1234567890'}],
        'Left guild Test (1234567890)',
        'info'
    ]
};

// commands.test.ts
export function mockMessageD(content, mID, uID, cID) {
    return {
        id: mID,
        timestamp: new Date().toString(),
        channel_id: cID,
        author: {
            id: uID,
            discriminator: '0000',
            name: 'foo'
        },
        content,
        mentions: []
    };
}
