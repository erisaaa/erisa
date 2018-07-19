import Eris from 'eris';
import Erisa from './erisa';

export default function awaitMessageHandler({erisa}: {erisa: Erisa}, msg: Eris.Message): void {
    const id = msg.channel.id + msg.author.id;
    const awaiting = erisa.currentlyAwaiting.get(id);

    // Test if something is being awaited, if it does, try the filter and return if it doesnt evaluate to true.
    if (!awaiting || !awaiting.filter(msg)) return;

    // Resolve the promise and clean up.
    awaiting.p.resolve(msg);
    clearTimeout(awaiting.timer);
    erisa.currentlyAwaiting.delete(id);
}
