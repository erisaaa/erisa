import {Command} from '@erisa_/commands';

export default class FakeCommandNoMain extends Command {
    overview: string;
    public async main(): Promise<void>;
}
