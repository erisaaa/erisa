# Erisa
[![Build Status](https://travis-ci.org/Ovyerus/erisa.svg?branch=master)](https://travis-ci.org/Ovyerus/erisa)

Erisa is a Discord bot framework built upon [Eris](https://github.com/abalabahaha/eris) using TypeScript.

This is currently a heavy work-in-progress and nothing is guarenteed to be consistent and stable until v1.

## Where's the code?
This repository is managed as a [monorepo](https://danluu.com/monorepo/) in order to make managing the various parts a bit simpler. As such, the various packages for Erisa is distributed around the place sorta. Here's a list of the current packages managed by this repository, and their locations.

- `erisa`: Found in `/main`. This contains the code for the core package.
- `@erisa/commands`: Found in `/defaults/commands`. This contains the code for the command system package.

## Ok, how do I do things?
I recommened installing [yarn](https://yarnpkg.com) if you haven't already, as this repository has stuff setup for its workspace feature already, and it's also just better than NPM in general.

0. Clone this repository to somewhere on your computer.
1. Install the main packages. Make sure that you're installing the development dependencies (NODE_ENV != production, or the install command is run with `--dev`), otherwise basically nothing will happen.
```
$ yarn (install isn't needed)
 or
$ npm install
```
2. Run `npx lerna bootstrap`. This will install dependencies for the individual packages, and link them if necessary.
3. Make your changes to what you want.
4. Run `yarn lint` to make sure that everything's styled properly, and also run `yarn test` to make sure that the tests pass.
5. ???
6. Profit.

## I found a bug or want to request a feature
Open an issue [here](https://github.com/Ovyerus/erisa/issues), making sure that no duplicate issues exist already (unless you believe your situation to be different enough to warrant a new issue).

## License
This repository is licensed under the MIT license. More info can be found in the [LICENSE file](/LICENSE).
