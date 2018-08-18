import {Constants} from 'eris';
import {Erisa, Matchable, MiddlewareHandler} from 'erisa';
import Context from './Context';
import Holder from './Holder';
import {default as defaultHelp} from './defaultHelp';

export {default as SubCommand, decorator as subcommand} from './SubCommand';
export {default as Context, ContextDestinations, PermissionTargets} from './Context';
export {default as Command} from './Command';
export {default as Holder} from './Holder';

export interface ICommandPermissions {
    self: string | string[];
    author: string | string[];
    both: string | string[];
}

interface Ctor<T> {
    new(...args: any[]): T;
}

interface RawPacket {
    op: number;
    t?: string;
    d?: any;
    s?: number;
}

interface CommandHandlerOptions {
    commandDirectory?: string;
    autoLoad?: boolean;
    defaultHelp?: boolean;
    contextClass?: Ctor<Context>;
    owner: string;
    prefixes: (string | RegExp)[];
}

const defaults = {
    commandDirectory: './commands',
    autoLoad: true,
    defaultHelp: true,
    contextClass: Context
};

export default function setup(erisa: Erisa, options: CommandHandlerOptions): [Matchable, MiddlewareHandler][] {
    const mergedOpts = {
        commandDirectory: options.commandDirectory || defaults.commandDirectory,
        autoLoad: options.autoLoad !== undefined ? options.autoLoad : defaults.autoLoad,
        defaultHelp: options.defaultHelp !== undefined ? options.defaultHelp : defaults.defaultHelp,
        contextClass: options.contextClass || defaults.contextClass,
        owner: options.owner,
        prefixes: options.prefixes
    };
    const holder = erisa.extensions.commands = new Holder(erisa, mergedOpts.prefixes, mergedOpts.owner);

    if (!erisa.eventNames().includes('rawWS')) erisa.on('rawWS', () => {}); // Needed so that Eris fires rawWS events at all.
    if (mergedOpts.defaultHelp) holder.add(defaultHelp, 'help');

    return [
        [
            'rawWS',
            async function handler({erisa: client, event}, packet: RawPacket) {
                if (packet.op !== Constants.GatewayOPCodes.EVENT || packet.t !== 'MESSAGE_CREATE' ||
                    !packet.d.content || !holder.testPrefix(packet.d.content)[0]) return;

                const ctx = new mergedOpts.contextClass(packet.d, client);

                try {
                    await holder.run(ctx);
                    client.emit('erisa.commands.run', ctx);
                } catch (err) {
                    await ctx.send(`There was an error when trying to run your command:\n${err}`);
                }
            }
        ],
        [
            'ready',
            async function handler({erisa: client}) {
                await holder.loadAll(mergedOpts.commandDirectory, true);
                client.emit('erisa.commands.loaded');
            }
        ]
    ];
}
