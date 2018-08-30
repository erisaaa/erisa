import {Command} from '@erisa_/commands';

export default class FakeCommand extends Command {
    overview: string = 'Foo bar.';

    async main(ctx) {}
}
