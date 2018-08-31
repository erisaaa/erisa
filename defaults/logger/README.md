# @erisa/logger

The default logging system for the [Erisa](/erisa) framework.

## Basic Usage
```ts
import {Erisa} from 'erisa';
import logger from '@erisa/logger';

const bot = new Erisa('token');

bot.use(logger(erisa));
```
