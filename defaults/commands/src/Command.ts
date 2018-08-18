import Context from './Context';
import SubCommand from './SubCommand';
import {ICommandPermissions} from './';

export default abstract class Command {
    name?: string;
    abstract overview: string;
    description?: string;
    usage?: string;
    ownerOnly?: boolean;
    guildOnly?: boolean;
    hidden?: boolean;
    aliases?: string[];
    category?: string;
    permissions?: ICommandPermissions;
    readonly subcommands: SubCommand[] = [];

    // constructor(readonly client: Erisa) {}
    async init?(): Promise<void>;
    abstract async main(ctx: Context): Promise<void>;
}
