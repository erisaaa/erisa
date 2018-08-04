import {Constants} from 'eris';
import {Erisa, MiddlewareHandler} from 'erisa';
import Context from './Context';
import Holder from './Holder';

export {default as SubCommand, decorator as DecoSubCommand} from './SubCommand';
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
    prefixes: string[];
}

const defaults = {
    commandDirectory: './commands',
    autoLoad: true,
    defaultHelp: true,
    contextClass: Context
};

export default function setup(erisa: Erisa, options: CommandHandlerOptions): MiddlewareHandler {
    const contextClass = options.contextClass || defaults.contextClass;
    erisa.locals.commands = new Holder(erisa, options.prefixes);

    if (!erisa.eventNames().includes('rawWS')) erisa.on('rawWS', () => {}); // Needed so that Eris fires rawWS events at all.

    return function handler({erisa: client, event}, ...args) {
        // if (event === 'rawWS') {
        //     const [packet]: [RawPacket, any] = args;

        //     if (packet.op !== Constants.GatewayOPCodes.EVENT || packet.t !== 'MESSAGE_CREATE') return;

        //     const ctx = new contextClass(packet.d, client);
        // }

        if (event === 'ready' && erisa.locals.commands.loadCommands) {

        }
    };
}
