# Erisa
[![Build Status](https://travis-ci.org/erisaaa/erisa.svg?branch=master)](https://travis-ci.org/erisaaa/erisa)
[![Maintainability](https://api.codeclimate.com/v1/badges/2edb44b50b742786f6f0/maintainability)](https://codeclimate.com/github/erisaaa/erisa/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/2edb44b50b742786f6f0/test_coverage)](https://codeclimate.com/github/erisaaa/erisa/test_coverage)

Erisa is a Discord bot framework built upon [Eris](https://github.com/abalabahaha/eris) using TypeScript.

This is currently a heavy work-in-progress and nothing is guarenteed to be consistent and stable until v1.

## Installation
```
npm install erisa
```

## Basic Usage
Instead of using conventional `.on` listeners, Erisa provides a `.use` function for listening to events, (sort of similar to Express' [.use](http://expressjs.com/en/4x/api.html#app.use) middleware function), which allows wildcard listeners among other things.

#### TypeScript (recommended)
```ts
import {Erisa} from 'erisa';
import {Message} from 'eris'; // For types

const bot = new Erisa('token');

bot.use('ready', () => console.log('Erisa online!'));

bot.use('createMessage', (_, msg: Message) => {
    if (msg.content === '!ping') {
        msg.channel.createMessage('Pong!');
    }
});

bot.connect();
```

#### JavaScript
```js
const {Erisa} = require('erisa');

const bot = new Erisa('token');

bot.use('createMessage', (_, msg) => {
    if (msg.content === '!ping') {
        msg.channel.createMessage('Pong!');
    }
});

bot.connect();
```

## I found a bug or want to request a feature
Open an issue [here](https://github.com/Ovyerus/erisa/issues), making sure that no duplicate issues exist already (unless you believe your situation to be different enough to warrant a new issue).

## Contributing
For further contribution, guidelines see [CONTRIBUTING](.github/CONTRIBUTING.md).

## License
This repository is licensed under the MIT license. More info can be found in the [LICENSE file](/LICENSE).
