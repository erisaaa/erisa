export {default as SubCommand, decorator as DecoSubCommand} from './SubCommand';
export {default as Context} from './Context';
export {default as Command} from './Command';
export {default as Holder} from './Holder';

export interface ICommandPermissions {
    self: string | string[];
    author: string | string[];
    both: string | string[];
}
