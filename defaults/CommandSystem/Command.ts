class Context {}
class Erisa {}
interface ICommandPermissions {
    self: string | string[];
    user: string | string[];
    both: string | string[];
}

export default abstract class Command {
    abstract name?: string;
    abstract overview: string;
    abstract description?: string;
    abstract ownerOnly?: boolean;
    abstract guildOnly?: boolean;
    abstract hidden?: boolean;
    abstract aliases?: string[];
    abstract permissions?: ICommandPermissions;

    abstract async init?(): Promise<void>;
    abstract async main(ctx: Context): Promise<void>;
}
