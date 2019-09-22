export const flat = <T>(arr: T[]) =>
  arr.flat ? arr.flat() : [].concat.apply([], arr); // eslint-disable-line prefer-spread
