import {Erisa} from 'erisa';
import Command from './Command';
import Context from './Context';
import Paginator from './Paginator';

export default class Help extends Command {
    public overview = 'Get help for commands.';
    public aliases = ['commands'];

    constructor(readonly client: Erisa) {
        super();
    }

    async main(ctx: Context) {
        if (!ctx.args.length) {
            const categories = this.client.extensions.commands.commandsByCategory.sort((a, b) => a.category < b.category ? -1 : 1)
                .map(({category, commands}) => ({
                    category,
                    commands: commands.filter(c => (c.ownerOnly || c.hidden) ? ctx.isBotOwner : true)
                }))
                .filter(cat => cat.commands.length);
            const paginator = new Paginator('```yaml\n');

            for (const {category, commands} of categories) {
                if (!paginator.lines.length) paginator.addLine(`┍━ # ${category} ━`);
                else paginator.addLine(`┝━ # ${category} ━`);

                for (const command of commands.sort((a, b) => a.name < b.name ? -1 : 1))
                    paginator.addLine(`│ ${command.name}: ${command.overview.slice(0, 80)}`);
            }

            try {
                for (const page of paginator.pages) await ctx.send(page, 'author');
            } catch {
                await ctx.send('I am unable to send you DMs. Perhaps you have me blocked or have DMs disabled?');
            }
        } else {
            const command: Command | undefined = this.client.extensions.commands.get(ctx.args[0].toLowerCase());

            if (!command || (command.ownerOnly && !ctx.isBotOwner))
                return ctx.send(`Unknown command **${ctx.args[0].toLowerCase()}**.`);

            const paginator = new Paginator('```yaml\n');

            paginator.addLine(`# ${command.name}`);

            if (command.usage) paginator.addLine(`Usage: ${command.usage}`);
            if (command.aliases && command.aliases.length) paginator.addLine(`Aliases: ${command.aliases.join(', ')}`);

            paginator.addLine('');
            paginator.addLine(`  ${command.overview}`, true);

            if (command.subcommands.length) {
                paginator.addLine('Subcommands:');

                for (const sub of command.subcommands)
                    paginator.addLine(` - ${sub.name} -: ${sub.overview}`);
            }

            if (command.description) paginator.addLines(command.description.split('\n'));

            for (const page of paginator.pages)
                await ctx.send(page);
        }
    }
}
