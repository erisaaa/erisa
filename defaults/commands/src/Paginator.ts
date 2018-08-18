export default class Paginator {
    public maxLength: number;
    public lines: string[] = [];

    constructor(readonly prefix: string = '```', readonly suffix: string = '```', maxLength: number = 2000) {
        this.maxLength = maxLength - suffix.length;
    }

    addLine(line: string, emptyAfter: boolean = false) {
        this.lines.push(line);
        if (emptyAfter) this.lines.push('');
    }

    addLines(...lines: (string | string[])[]) {
        this.lines = this.lines.concat(...lines);
    }

    clear() {
        this.lines = [];
    }

    get pages() {
        const pages: string[] = [];
        let thisPage = this.prefix;

        for (const line of this.lines)
            if (thisPage.length === this.maxLength) {
                pages.push(thisPage + this.suffix);
                thisPage = this.prefix;
            } else if (thisPage.length > this.maxLength) {
                const split = thisPage.split('\n');
                const last: string[] = [];

                while (split.join('\n').length > this.maxLength) last.push(split.splice(-1, 1)[0]);

                pages.push(split.join('\n') + this.suffix);
                thisPage = this.prefix + last.join('\n');
            } else thisPage += `${line}\n`;

        if (thisPage) pages.push(thisPage + this.suffix);

        return pages;
    }
}
