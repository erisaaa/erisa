/** @private */
export const flat = <T>(arr: T[]) =>
  arr.flat ? arr.flat() : [].concat.apply([], arr); // eslint-disable-line prefer-spread

export class FormatError<T extends {}> extends Error {
  constructor(obj: T) {
    super(
      `Unable to format ${obj && obj.constructor ? obj.constructor.name : obj}`
    );
    this.name = 'FormatError';
  }
}
