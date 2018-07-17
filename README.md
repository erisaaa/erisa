# Erisa
[![Build Status](https://travis-ci.org/Ovyerus/erisa.svg?branch=master)](https://travis-ci.org/Ovyerus/erisa)

Erisa is a Discord bot framework built upon [Eris](https://github.com/abalabahaha/eris) using TypeScript.

This is currently a heavy work-in-progress and nothing is guarenteed to be consistent and stable until v1.

## Basic Example
```ts
import Erisa from 'erisa';

const bot = new Erisa('token');

bot.use('createMessage', (_, msg) => {
    if (msg.content === '!ping') {
        msg.channel.createMessage('Pong!');
    }
});

bot.connect();
```

## TODO
- Try to overwrite `.emit` so people can do globbed/regex events. (e.g. global logging)
- Built in optional stuff, like logger and command system.
