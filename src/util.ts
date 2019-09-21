export const flat = <T>(arr: T[]) =>
  arr.flat ? arr.flat() : [].concat.apply([], arr);
