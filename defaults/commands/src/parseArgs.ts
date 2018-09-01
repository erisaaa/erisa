const QUOTE_REGEX = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
const IS_QUOTED = /^("').*\1$/;

interface ParsedArguments {
    args: string[];
    cmd: string;
    suffix: string;
}

export default function parseArgs(text: string): ParsedArguments {
    const [cmd, ...tmp] = text.split(' ');
    const suffix = tmp.join(' ').trim();
    let args = suffix.match(QUOTE_REGEX);
    args = args ? args.map(v => IS_QUOTED.test(v) ? v.slice(1, -1) : v).filter(v => v.trim()) : [];

    return {
        args,
        cmd,
        suffix
    };
}
