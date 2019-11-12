/* eslint-disable no-sequences */
import 'jest';

import Eris from 'eris';

import Erisa, {AwaitTimeout, FormatError, Formatter } from '../';

let client = new Erisa('');
const testMockCountLater = (
  fn: jest.Mock<any, any>,
  times: number,
  done: jest.DoneCallback
) =>
  setTimeout(() => {
    try {
      expect(fn).toBeCalledTimes(times);
      done();
    } catch (err) {
      done(err);
    }
  }, 0);
const makeArgumentlessLaterFunc = <F extends (...args: any[]) => any>(
  fn: F,
  ...args: Parameters<F>
): (() => ReturnType<F>) => () => fn(...args);

beforeEach(() => (client = new Erisa('')));

describe('Erisa#handleEvent', () => {
  test('fires the assigned event', done => {
    client.use('foo', () => done());
    client.handleEvent('foo')();
  });

  test("doesn't fire any other event but it's assigned one", done => {
    client.use('bar', () => done(new Error('Invalid call')));
    client.handleEvent('foo')();
    setTimeout(done, 0);
  });

  describe('star (wildcard)', () => {
    test('matches wildcard and regex events', done => {
      const dontCall = () => done(new Error('Invalid call'));
      const call = () => {
        count++;
        if (count === 3) done();
        else if (count > 3) done(new Error('Called too many times'));
      };
      let count = 0;

      client.use('*', call);
      client.use(/foo/, call);
      client.use('f*', call);

      client.use('bar', dontCall);
      client.use(/bar/, dontCall);
      client.use('b*', dontCall);

      client.handleEvent('*')('foo');
    });
  });
});

describe('Erisa#emit', () => {
  test('emits a `*` event alongside the original', done => {
    const hit = jest.fn();

    client.on('*', hit);
    client.on('foo', hit);

    client.emit('foo');

    testMockCountLater(hit, 2, done);
  });

  test('provides the original event name as the first argument for `*` events', done => {
    client.on('*', ev => (expect(ev).toBe('foo'), done()));
    client.emit('foo');
  });

  test('provides any additional arguments to `*` events', done => {
    // this might end up wonky with above test due to polluted events idk
    client.on('*', (ev, ...args) => (expect(args).toEqual([1, 2, 3]), done()));
    client.emit('foo', 1, 2, 3);
  });
});

describe('Erisa#format', () => {
  test('throws an error on unknown object', () => {
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    const FakeClass = class {};
    const format = client.format.bind(client) as typeof client.format;

    expect(makeArgumentlessLaterFunc(format, null as any)).toThrowError(
      FormatError
    );
    expect(makeArgumentlessLaterFunc(format, undefined as any)).toThrowError(
      FormatError
    );
    expect(makeArgumentlessLaterFunc(format, false as any)).toThrowError(
      FormatError
    );
    expect(
      makeArgumentlessLaterFunc(format, new FakeClass() as any)
    ).toThrowError(FormatError);
  });

  describe('formatting `Member`', () => {
    const member = new Eris.Member({ nick: 'Foo' } as any, null as any);
    member.user = { username: 'foo', discriminator: '0000' } as any;

    test("shows the member's nickname", () => {
      expect(client.format(member)).toBe('Foo#0000');
    });

    test("shows the member's username", () => {
      member.nick = undefined;
      expect(client.format(member)).toBe('foo#0000');
    });

    test("doesn't show the member's discriminator", () => {
      member.nick = 'Foo';
      expect(client.format(member, { alt: true })).toBe('Foo');

      member.nick = 'foo';
      expect(client.format(member, { alt: true })).toBe('foo');
    });
  });

  describe('formatting `User`', () => {
    const user = new Eris.User(
      { username: 'foo', discriminator: '0000' } as any,
      client
    );

    test("shows the user's full tag", () => {
      expect(client.format(user)).toBe('foo#0000');
    });

    test("doesn't show the user's discriminator", () => {
      expect(client.format(user, { alt: true })).toBe('foo');
    });
  });

  describe('formating `Role`', () => {
    const role = new Eris.Role(
      { id: '1234567890', name: 'foo', mentionable: true } as any,
      {} as any
    );

    test("shows the role's mention", () => {
      expect(client.format(role)).toBe(role.mention);
    });

    test("shows the role's name", () => {
      role.mentionable = false;
      expect(client.format(role)).toBe('foo');
    });
  });

  describe('formatting `Channel`', () => {
    const channel = new Eris.Channel({ id: '1234567890' });

    test("shows the channel's mention", () => {
      expect(client.format(channel)).toBe(channel.mention);
    });
  });

  describe('formatting `Guild`', () => {
    const guild = new Eris.Guild({ name: 'foo' } as any, client);

    test("shows the guild's name", () => {
      expect(client.format(guild)).toBe('foo');
    });
  });

  describe('custom formatter', () => {
    test('gets called instead of default formatter', () => {
      const formatter: Formatter<Eris.User> = user => user.mention;
      const user = new Eris.User({ id: '1234567890' } as any, client);

      expect(client.format(user, { formatter })).toBe(user.mention);
    });

    test('uses the alt mode', () => {
      const formatter: Formatter<Eris.User> = (user, alt) =>
        alt ? user.id : user.mention;
      const user = new Eris.User({ id: '1234567890' } as any, client);

      expect(client.format(user, { formatter, alt: true })).toBe(user.id);
    });
  });
});

describe('Erisa#awaitMessage', () => {
  test('returns a message from the right location and user', () => {
    const awaiting = client.awaitMessage('1234567890', '0987654321');
    const msg = {
      id: '1234567890',
      channel: { id: '1234567890' },
      author: { id: '0987654321' }
    };

    client.emit('messageCreate', msg);
    return expect(awaiting).resolves.toEqual(msg);
  });

  test('obeys filter given to it', () => {
    const awaiting = client.awaitMessage('1234567890', '0987654321', {
      filter: m => m.content === 'Foobar'
    });
    const badMsg = {
      id: '1234567890',
      content: 'foobar',
      channel: { id: '1234567890' },
      author: { id: '0987654321' }
    };
    const goodMsg = { ...badMsg, content: 'Foobar' };

    client.emit('messageCreate', badMsg);
    client.emit('messageCreate', goodMsg);

    return Promise.all([
      expect(awaiting).resolves.not.toEqual(badMsg),
      expect(awaiting).resolves.toEqual(goodMsg)
    ]);
  });

  test('obeys a given timeout', () => {
    const awaiting = client.awaitMessage('1234567890', '0987654321', {
      timeout: 0
    });
    const msg = {
      id: '1234567890',
      channel: { id: '1234567890' },
      author: { id: '0987654321' }
    };

    // Delay until next cycle (other timeout should've expired by now)
    // TODO: i dont even need this probs
    setTimeout(() => {
      client.emit('messageCreate', msg);
    }, 0);

    return expect(awaiting).rejects.toThrowError(AwaitTimeout);
  });
});
