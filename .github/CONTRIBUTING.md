# Contribution Guide
## Issues
### Bug Reports
If you're reporting a bug with the library, first make sure to search for existing issues to make sure that it hasn't been reported before.
If you find that your bug hasn't yet been reported, [create an issue](https://github.com/Ovyerus/erisa/issues/new/choose), selecting the "Bug Report" template, and filling it out as specified, with a clear description of what is happening, as well as a minimal reproduction of the error. Attaching any stack traces that appear would also be handy.

### Pull Requests
Pull requests - either for fixing bugs or new additions - to Erisa are welcome, provided that the following stuff is (mostly) adhered to.

- Pull request is made from an aptly named branch for that specific feature/fix (more of a "best practices" thing more than anything).
- Pull request is also appropriately named.
- The pull request template is properly filled out/added to if neccessary.
- "Garbage files" are cleaned up (gitignore'd), e.g. package-lock.json, surplus folders used by development packages.
- The code is linted properly, and the tests pass.

## Commit Messages
(Stolen from https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716)

Ideally, commit messages to this repository should be in the format of: `<type>(<scope>): <subject>`, with `<scope>` being optional.
This is to make sure that commit history is easily readable, and can be operated on easily if needed.

Basic commit messages should ideally be under 70 characters long, but can be slightly longer if required.
Other information should be added as a secondary message, done with chaining `-m` when commiting (`git commit -m "feat: do a thing" -m "Longer description of the thing I did"`).

### Example
```
feat: add hat wobble
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.
```

More Examples:

- `feat`: (new feature for the user, not a new feature for build script)
- `fix`: (bug fix for the user, not a fix to a build script)
- `docs`: (changes to the documentation)
- `style`: (formatting, missing semi colons, etc; no production code change)
- `refactor`: (refactoring production code, eg. renaming a variable)
- `test`: (adding missing tests, refactoring tests; no production code change)
- `chore`: (updating grunt tasks etc; no production code change)

## Code Style
All code in this repository should follow the style guides set forth by the linter files at the root directory (currently `tslint.json` and `.eslint.json`).
This is to ensure a consistent coding style throughout everything.
It is recommended to use the TSLint and ESLint plugins for your IDE/editor of choice (if any are available), as they lint in real time, making it easier to adhere to the provided guidelines. 
