export const events = ['foo', 'bar', 'foobar'];
export const handlers = [
  'foo',
  'bar',
  'foobar',
  'faz',
  'baz',
  'fazbaz',
  'foobaz'
].map(v => () => {
  v; // eslint-disable-line no-unused-expressions
});
export const mixedHandlers = [
  ...handlers.slice(0, 3),
  [handlers[3], handlers[4]],
  handlers[5],
  [handlers[6]]
];
export const tests = Object.entries({
  'single handler': handlers[0],
  'handler array': handlers,
  'rest handlers': handlers,
  'mix of handlers and arrays': mixedHandlers
});
