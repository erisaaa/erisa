import Erisa from '../../../dist';
import Command from './Command';
import Context, {PermissionTargets} from './Context';
import SubCommand from './SubCommand';
import {default as fs_, promises as fs} from 'fs';

interface Ctor<T> {
    new(...args: any[]): T;
}

async function walk(dir: string): string[] {
    const files = await fs.readdir(dir);
    let ret: string[] = [];

    for (const f of files)
        if ((await fs.stat(dir + f)).isDirectory()) ret = ret.concat(await walk(`${dir}${f}/`));
        else ret.push(dir + f);

    return ret;
}

export default class Holder {
    readonly commands: Map<string, Command> = new Map<string, Command>();
    readonly aliases: Map<string, Command> = new Map<string, Command>();
    readonly modules: Map<string, string[]> = new Map<string, string[]>();
    public loadCommands: boolean = true;
    public useCommands: boolean = false;

    constructor(readonly client: Erisa, public prefixes: string[]) {}

    async loadAll(directory: string, deep: boolean = false): Promise<void> {
        const files: string[] = await Promise.all(await (deep ? walk(dir) : fs.readdir(dir)))
            .filter(async f => (await fs.stat(f)).isDirectory()));

        for (const f of files)
            try {
                await this.load(f);
            } catch(err) {
                // TODO: integrate with the logger module if it exists.
            }
    }

    async load(mod: string): Promise<void> {
        if (this.modules.get(mod)) throw new Error(`Command module '${mod}' is already loaded.`);

        let module: Ctor<Command>[] | Ctor<Command> = (await import(mod)).default;

        if (!Array.isArray(module)) module = [module];

        for (const command of module) {
            const cmd = new command(this.client);

            if (cmd.init) await cmd.init();

            cmd.name = cmd.name ? cmd.name.toLowerCase() : command.name.toLowerCase();

            if (!cmd.overview) throw new Error(`Command '${cmd.name}' in module '${mod}' is missing 'overview' property`);
            if (!cmd.main) throw new Error(`Command '${cmd.name}' in module '${mod}' is missing 'main' method.`);

            const cmdMethods = Object.getOwnPropertyNames(cmd.constructor.prototype)
                .filter(v => !['constructor', 'main', 'init'].includes(v));

            for (const subcommand of cmdMethods) {
                const result = cmd[subcommand]();

                if (!(result instanceof SubCommand)) continue;

                cmd.subcommands.push(result);
            }

            this.commands.set(cmd.name, cmd);

            if (!this.modules.get(mod)) this.modules.set(mod, [cmd.name]);
            else this.modules.set(mod, this.modules.get(mod)!.concat(cmd.name));

            if (cmd.aliases) for (const alias of cmd.aliases) {
                this.aliases.set(alias, this.commands.get(cmd.name)!);
                this.modules.set(mod, this.modules.get(mod)!.concat(alias));
            }
        }

        if (!this.modules.get(mod)) {
            this.modules.delete(mod);
            delete require.cache[require.resolve(mod)];
        }
    }

    unload(mod: string): void {
        if (!this.modules.get(mod)) throw new Error(`Command module '${mod} isn't loaded.`);

        for (const cmd of this.modules.get(mod)!) {
            if (this.aliases.get(cmd)) this.aliases.delete(cmd);
            if (this.commands.get(cmd)) this.commands.delete(cmd);
        }

        this.modules.delete(mod);
        delete require.cache[require.resolve(mod)];
    }

    reload(mod: string): void {
        // Will implicitly load the module if it hasn't been so already (this if will be false and fall through).
        if (this.modules.get(mod)) this.unload(mod);

        this.load(mod);
    }

    async run(ctx: Context): Promise<void> {
        let cmd = this.commands.get(ctx.cmd);

        if (!cmd) return;

        if (ctx.args.length) for (const arg of ctx.args)
            if (cmd.subcommands.length && cmd.subcommands.find(sub => sub.name === arg))
                cmd = cmd.subcommands.find(sub => sub.name === arg)!;

        if (cmd.ownerOnly && ctx.author.id === this.client.extras.owner)
            await cmd.main(ctx);
        else if (!cmd.ownerOnly && this.handlePermissions(cmd, ctx))
            await cmd.main(ctx);
    }

    handlePermissions(cmd: Command, ctx: Context): [boolean] | [boolean, string, string] {
        if (!cmd.permissions) return [true];

        const permChecks = {
            both: [] as string[],
            author: [] as string[],
            self: [] as string[]
        };

        for (const type of ['both', 'author', 'self']) {
            const target = type === 'both'
                ? PermissionTargets.Both
                : type === 'author'
                    ? PermissionTargets.Author
                    : PermissionTargets.Self;

            if (Array.isArray(cmd.permissions[type]))
                permChecks[type] = cmd.permissions[type].filter(perm => ctx.hasPermission(perm, target));
            else if (ctx.hasPermission(cmd.permissions[type], target))
                permChecks[type].push(cmd.permissions[type]);
        }

        const zip = rows => rows[0].map((_, c) => rows.map(row => row[c]));
        const zipped = [0, 1, 2].map(v => zip([Object.values(cmd.permissions)[v], Object.values(permChecks)[v]]));
        const allEqual = zipped.reduce((m, v) => m && v.reduce((n, [x, y]) => n && x === y));

        if (allEqual) return [true];
        else {
            const unequalField = zipped.find(v => v.find(([x, y]) => x !== y));
            const missingPermission = unequalField.find(([x, y]) => x !== y);
            const missingField = Object.keys(cmd.permissions)[zipped.indexOf(unequalField)];

            return [false, missingField, missingPermission];
        }
    }

    get(mod: string): Command | undefined {
        return this.aliases.get(mod) || this.commands.get(mod);
    }

    forEach(cb: (value: Command, key: string, map: Map<string, Command>) => void): void {
        this.commands.forEach(cb);
    }

    filter(cb: (value: Command, key: string, map: Map<string, Command>) => boolean): Command[] {
        const filtered: Command[] = [];

        for (const [name, cmd] of this) if (cb(cmd, name, this.commands)) filtered.push(cmd);

        return filtered;
    }

    [Symbol.iterator](): IterableIterator<[string, Command]> {
        return this.commands[Symbol.iterator]();
    }
}
