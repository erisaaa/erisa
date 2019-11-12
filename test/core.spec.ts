import Erisa from '../';

import { events, handlers, tests } from './consts';

type Void = () => void;
const isMultiHandler = (name: string) =>
  name === 'rest handlers' || name === 'mix of handlers and arrays';

let client = new Erisa('');

beforeEach(() => (client = new Erisa('')));

describe('Erisa#use', () => {
  it('returns `this`', () => {
    expect(client.use()).toBe(client);
  });

  describe('registering under one event', () => {
    test.each(tests)('%s', (name, handler) => {
      const useClient = new Erisa('');

      if (isMultiHandler(name)) useClient.use('foo', ...(handler as Void[]));
      else useClient.use('foo', handler as Void);
      // console.log(client.handlers);

      // Everything other than the first test should be equal to `handlers`.
      expect(useClient.handlers.get('foo')).toEqual(
        name === 'single handler' ? [handler] : handlers
      );
    });
  });

  describe('registering under an event array', () => {
    test.each(tests)('%s', (name, handler) => {
      const useClient = new Erisa('');

      if (isMultiHandler(name)) useClient.use(events, ...(handler as Void[]));
      else useClient.use(events, handler as Void);

      for (const event of events)
        expect(useClient.handlers.get(event)).toEqual(
          name === 'single handler' ? [handler] : handlers
        );
    });
  });

  describe('implicitly registering under the `*` (wildcard) event', () => {
    test.each(tests)('%s', (name, handler) => {
      const useClient = new Erisa('');

      if (isMultiHandler(name)) useClient.use(...(handler as Void[]));
      else useClient.use(handler as Void);

      expect(useClient.handlers.get('*')).toEqual(
        name === 'single handler' ? [handler] : handlers
      );
    });
  });

  it('registers pairs of events and middleware correctly', () => {
    client.use([['foo', handlers[0]]]);
    client.use([
      ['bar', handlers[0]],
      ['bar', handlers[1]],
      ['foobar', handlers[2]]
    ]);

    expect(client.handlers.get('foo')).toEqual([handlers[0]]);
    expect(client.handlers.get('bar')).toEqual([handlers[0], handlers[1]]);
    expect(client.handlers.get('foobar')).toEqual([handlers[2]]);
  });
});

describe('Erisa#disuse', () => {
  it('returns `this`', () => {
    expect(client.disuse(() => {})).toBe(client);
  });

  describe('removing from explicitly defined events', () => {
    test.each(tests)('%s', (name, handler) => {
      const disuseClient = new Erisa('');
      const result = isMultiHandler(name)
        ? (handler as Void[])
        : ([handler] as [Void]);

      disuseClient.use('foo', ...result);
      disuseClient.disuse('foo', ...result);
      expect(disuseClient.handlers.get('foo')).toBe(undefined);
    });
  });

  describe('implicitly removing all handlers from explicitly defined events', () => {
    test.each(tests)('%s', (name, handler) => {
      const disuseClient = new Erisa('');
      const result = isMultiHandler(name)
        ? (handler as Void[])
        : ([handler] as [Void]);

      disuseClient.use('foo', ...result);
      disuseClient.disuse('foo');
      expect(disuseClient.handlers.get('foo')).toBe(undefined);
    });
  });

  describe("removing all handlers from existence on any event they're applied on", () => {
    test.each(tests)('%s', (name, handler) => {
      const disuseClient = new Erisa('');
      const result = isMultiHandler(name)
        ? (handler as Void[])
        : ([handler] as [Void]);

      for (const event of events) disuseClient.use(event, ...result);
      disuseClient.disuse(...result);

      for (const event of events)
        expect(disuseClient.handlers.get(event)).toBe(undefined);
    });
  });

  // it('unregisters pairs of events and middleware correctly', () => {
  //   client.disuse([['foo', handlers[0]]] as any);
  //   client.disuse([
  //     ['bar', handlers[0]],
  //     ['bar', handlers[1]],
  //     ['foobar', handlers[2]]
  //   ] as any);

  //   expect(client.handlers.get('foo')).toBe(undefined);
  //   expect(client.handlers.get('bar')).toBe(undefined);
  //   expect(client.handlers.get('foobar')).toBe(undefined);
  // });
});
