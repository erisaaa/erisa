import {Client} from 'eris';
import Command from './Command';
import Context from './Context';

export default class Holder {
    commands: Map<string, Command> = new Map<string, Command>();
    aliases: Map<string, Command> = new Map<string, Command>();

    constructor(readonly client: Client) {}

    handlePermissions(cmd: Command, ctx: Context): boolean {}// private
    async load(mod: string): Promise<void> {}
    unload(mod: string): void {}
    reload(mod: string): void {}
    async run(ctx: Context): Promise<void> {}

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
