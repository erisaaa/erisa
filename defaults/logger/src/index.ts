import {Erisa, MiddlewareHandler} from 'erisa';

type DefaultListeners = 'ready' | 'error' | 'warn' | 'guildCreate' | 'guildDelete';
interface LoggerLevel {
    tagText: string;
    textFunc(text: string): string;
}

/**
 * Register's a logger under Erisa, and optionally makes default listeners.
 *
 * @param erisa An Erisa instance to define extensions for..
 * @param defaultListeners Whether or not to register a listener for some default events. If an array, it is an array of events to log, with the values being a `DefaultListeners`.
 */
export function logger(erisa: Erisa, defaultListeners: boolean | DefaultListeners[] = true): MiddlewareHandler | void {
    if (erisa.extensions.logger) return;

    erisa.extensions.logger = {
        dispatch(level: string, ...msgs: any[]) {
            if (!this.levels[level]) console.log(...msgs);
            else {
                const lvl: LoggerLevel = this.levels[level];

                console.log(lvl.tagText, ...msgs.map(m => lvl.textFunc(m)));
            }
        },
        levels: {
            error: {
                tagText: tc.bgRed('[ERROR]'),
                textFunc: tc.red.bold
            },
            warn: {
                tagText: tc.black.bgYellow('[WARN]'),
                textFunc: tc.yellow.bold
            },
            info: {
                tagText: tc.black.bgGreen('[INFO]'),
                textFunc: tc.green.bold
            }
        } as {[x: string]: LoggerLevel}
    };

    if (!defaultListeners) return;
    else return function handler({erisa: client, event}, ...args) {
        if (!defaultListeners.includes(event)) return;

        const logger_ = client.extensions.logger;

        switch (event) {
            case 'ready':
                logger_.dispatch('info', `Logged in as ${client.user.username}`);
                break;
            case 'error':
                logger_.dispatch('error', `Discord error for shard ${args[1]}:`, args[0]);
                break;
            case 'warn':
                logger_.dispatch('warn', `Discord warning for shard ${args[1]}: ${args[0]}`);
                break;
            case 'guildCreate':
                logger_.dispatch('info', `Joined guild ${args[0].name} (${args[0].id})`);
                break;
            case 'guildDelete':
                logger_.dispatch('info', `Left guild ${args[0].name} (${args[0].id})`);
                break;
            default:
                break;
        }
    };
}