import {Command} from '@erisa_/commands';

export default class FakeCommandNoOverview extends Command {
    overview: string;

    async main(ctx) {}
}
