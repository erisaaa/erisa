import {Command} from '@erisa_/commands';

export default function(done) {
    return class FakeCommandWithInit extends Command {
        overview: string = 'Foo bar.';

        async init() {
            done();
        }
        async main(ctx) {}
    };
}
