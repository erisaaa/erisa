# Erisa
[![Build Status](https://travis-ci.org/Ovyerus/erisa.svg?branch=master)](https://travis-ci.org/Ovyerus/erisa)

Erisa is a Discord bot framework built upon [Eris](https://github.com/abalabahaha/eris) using TypeScript.

This is currently a heavy work-in-progress and nothing is guarenteed to be consistent and stable until v1.

## Basic Example
#### TypeScript (recommended)
```ts
import Erisa from 'erisa';
import {Message} from 'eris'; // For typing

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
const Erisa = require('erisa');

const bot = new Erisa('token');

bot.use('createMessage', (_, msg) => {
    if (msg.content === '!ping') {
        msg.channel.createMessage('Pong!');
    }
});

bot.connect();
```

## TODO
- Built in optional stuff, like logger and command system.
- Finish tests.
