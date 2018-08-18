# @erisa/commands

The command system module built for the [Erisa](/erisa) framework.

## Basic Usage
```ts
import {Erisa} from 'erisa';
import commands from '@erisa/commands';

const bot = new Erisa('token');

bot.useTuples(commands(erisa, {
    owner: 'your id',
    prefixes: []
}))
```