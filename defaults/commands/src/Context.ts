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

    async send(content: MessageContent, destination?: ContextDestinations): Promise<Message>;
    async send(file: MessageFile, destination?: ContextDestinations): Promise<Message>;
    async send(content: MessageContent, file: MessageFile, destination?: ContextDestinations): Promise<Message>;

    async send(...args) {
        const potentialDest = args[2] || args[1] ;
        const dest: (content: MessageContent, file?: MessageFile) => Promise<Message> = typeof potentialDest === 'string' ? (
            potentialDest === ContextDestinations.Author
                ? await this.author.getDMChannel()
                : this.channel
        ) : this.channel;
        let ret;

        if (typeof args[0] === 'string' || args[0].content) // tslint:disable-line prefer-conditional-expression
            ret = dest(args[0], typeof args[1] !== 'string' ? args[1] : null);
        else if (args[0].file)
            ret = dest(null, args[0]);
        else
            ret = dest(args[0], args[1]);

        return ret;
    }

    hasPermission(permission: string, target: PermissionTargets = PermissionTargets.Self): boolean {
        if (!Object.keys(Constants.Permissions).includes(permission)) {
            if (this._client.extensions.logger) this._client.extensions.logger.dispatch('warn', `Unknown permission "${permission}"`);
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

    get isBotOwner() {
        return this.author.id === this._client.extensions.holder.owner;
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
