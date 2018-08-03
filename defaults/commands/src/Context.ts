import {Constants, Member, Message, MessageContent, MessageFile} from 'eris';
import parseArgs from './parseArgs';

export default class Context extends Message {
    args: string[];
    cmd: string;
    suffix: string;
    me?: Member;

    constructor(data, client) {
        super(data, client);

        const {args, cmd, suffix} = parseArgs(this.content);
        this.args = args;
        this.cmd = cmd;
        this.suffix = suffix;

        this.me = this.guild ? this.guild.members.get(client.user.id) : null;
    }

    get guild() {
        return this.channel.guild;
    }

    async send(content: MessageContent, file?: MessageFile, destination: ContextDestinations = ContextDestinations.Channel): Promise<Message> {
        if (destination === 'channel') return this.channel.createMessage(content, file);
        else if (destination === 'author') return this.author.getDMChannel().then(dm => dm.createMessage(content, file));
        else throw new Error(`Unknown destination: ${where}`);
    }

    hasPermission(permission: string, target: PermissionTargets = PermissionTargets.Self): boolean {
        if (!Object.keys(Constants.Permissions).includes(permission)) {
            if (this.client.extensions.logger) this.client.extensions.logger.dispatch('warn', `Unknown permission "${permission}"`);
            return true;
        }

        switch (target) {
            case PermissionTargets.Self:
                return this.channel.permissionsOf(this._client.user.id).has(permission);
            case PermissionTargets.Author:
                return this.channel.permissionsOf(this.author.id).has(permission);
            case PermissionTargets.Both:
                return this.hasPermission(permission) && this.hasPermission(permission, PermissionTargets.Author);
            default:
                throw new Error(`Unknown target: ${target}`);
        }
    }
}

export enum ContextDestinations {
    Channel = 'channel',
    Author = 'author'
}

export enum PermissionTargets {
    Self = 'self',
    Author = 'author',
    Both = 'both'
}
