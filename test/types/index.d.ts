declare module 'test-console' {
    type Callback = (output: string) => void;
    type Output = string[];
    type Options = {
      [key: string]: any;
      isTTY?: boolean;
    };
    type Inspector = {
      output: Output;
      restore(): void;
    };

    export const stdout: {
      inspect(options?: Options): Inspector,
      inspectSync(fn: Callback): Output;
      inspectSync(options: Options, fn?: Callback): Output,
      ignore(options?: Options): void,
      ignoreSync(fn: Callback): void,
      ignoreSync(options: Options, fn?: Callback): void,
    };

    export const stderr: {
      inspect(options?: Options): Inspector,
      inspectSync(fn: Callback): Output,
      inspectSync(options: Options, fn?: Callback): Output,
      ignore(options?: Options): void,
      ignoreSync(fn: Callback): string,
      ignoreSync(options: Options, fn?: Callback): string,
    };
  }
