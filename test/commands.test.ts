/* tslint:disable no-unused-expression */

import 'mocha';
import Eris from 'eris';
import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {Erisa} from 'erisa_';
import commands, {
    Paginator, parseArgs, Holder
} from '@erisa_/commands';
import {FakeCommand} from './commands';

chai.use(chaiAsPromised);

const normalAttach = (c: Erisa) => c.usePairsArray(commands(c, {owner: 'foo', prefixes: ['!', '?', /^foo (.+)/]}));
let client = new Erisa('nothing');
let commandsExt: Holder;

beforeEach(() => {
    // Reset client for each test.
    client = new Erisa('nothing');
});

describe('@erisa/commands', () => {
    describe('Paginator', () => {
        it('should have `maxLength` be the provided length, minus the length of the suffix', () => {
            expect(new Paginator().maxLength).to.equal(1997);
            expect(new Paginator('```', '```', 1000).maxLength).to.equal(997);
            expect(new Paginator('```', 'big ending').maxLength).to.equal(2000 - 'big ending'.length);
            expect(new Paginator('```', 'big ending', 1000).maxLength).to.equal(1000 - 'big ending'.length);
        });

        describe('#addLine', () => {
            let paginator = new Paginator();
            beforeEach(() => paginator = new Paginator());

            it('should add one line', () => {
                paginator.addLine('foo');
                expect(paginator.lines).to.deep.equal(['foo']);
            });

            it('should concat to the existing lines', () => {
                paginator.addLine('foo');
                paginator.addLine('bar');
                expect(paginator.lines).to.deep.equal(['foo', 'bar']);
            });

            it('should add a blank line after the given line', () => {
                paginator.addLine('foo', true);
                expect(paginator.lines).to.deep.equal(['foo', '']);
            });
        });

        describe('#addLines', () => {
            let paginator = new Paginator();
            beforeEach(() => paginator = new Paginator());

            describe('should add one line', () => {
                specify('in an array', () => {
                    paginator.addLines(['foo']);
                    expect(paginator.lines).to.deep.equal(['foo']);
                });

                specify('in rest arguments', () => {
                    paginator.addLines('foo');
                    expect(paginator.lines).to.deep.equal(['foo']);
                });
            });

            describe('should add two lines', () => {
                specify('in an array', () => {
                    paginator.addLines(['foo', 'bar']);
                    expect(paginator.lines).to.deep.equal(['foo', 'bar']);
                });

                specify('in rest arguments', () => {
                    paginator.addLines('foo', 'bar');
                    expect(paginator.lines).to.deep.equal(['foo', 'bar']);
                });

                specify('in rest arguments as separate arrays', () => {
                    paginator.addLines(['foo'], ['bar']);
                    expect(paginator.lines).to.deep.equal(['foo', 'bar']);
                });
            });
        });

        describe('#clear', () => {
            it('should empty the current array', () => {
                const paginator = new Paginator();

                paginator.addLine('foo');
                paginator.clear();

                expect(paginator.lines).to.be.empty;
            });
        });

        // describe('.pages', () => {
        //     let paginator = new Paginator();
        //     beforeEach(() => paginator = new Paginator());

        //     something
        // });
    });

    describe('parseArgs', () => {
        it('should split the provided text along spaces', () => {
            const {cmd, args, suffix} = parseArgs('foo bar foobar fazbaz');

            expect(cmd).to.equal('foo');
            expect(args).to.deep.equal(['bar', 'foobar', 'fazbaz']);
            expect(suffix).to.equal('bar foobar fazbaz');
        });

        it('should split the provided text along spaces, and group quoted text together, ignoring the singular apostrophe', () => {
            const {cmd, args, suffix} = parseArgs(`foo bar "foobar fazbaz" lorem 'ipsum' I'm running out of things to write here.`);

            expect(cmd).to.equal('foo');
            expect(args).to.deep.equal(['bar', 'foobar fazbaz', 'lorem', 'ipsum', "I'm", 'running', 'out', 'of', 'things', 'to', 'write', 'here.']);
            expect(suffix).to.equal(`bar "foobar fazbaz" lorem 'ipsum' I'm running out of things to write here.`);
        });
    });

    describe('middleware', () => {
        it('should set the Holder class onto the client', () => {
            normalAttach(client);
            expect(client.extensions.commands).to.be.instanceof(Holder);
        });

        it('should set the provided prefixes and owner', () => {
            client.usePairsArray(commands(client, {
                owner: '1234567890',
                prefixes: ['foo', /foo/]
            }));

            expect(client.extensions.commands.owner).to.equal('1234567890');
            expect(client.extensions.commands.prefixes).to.deep.equal(['foo', /foo/]);
        });

        it('should add an empty listener to the `rawWS` event', () => {
            normalAttach(client);

            expect(client.eventNames()).to.includes('rawWS');
            expect(client.listeners('rawWS')[0].toString()).to.equal('() => { }');
        });
    });

    describe('Holder', () => {
        beforeEach(() => {
            normalAttach(client);
            commandsExt = client.extensions.commands;
        });

        describe('#testPrefix', () => {
            it("shouldn't match the provided string", () => {
                expect(commandsExt.testPrefix('foo')[0]).to.be.false;
                expect(commandsExt.testPrefix('foobar')[0]).to.be.false;
                expect(commandsExt.testPrefix('foo!')[0]).to.be.false;
                expect(commandsExt.testPrefix('foo?')[0]).to.be.false;
            });

            it('should match the provided string', () => {
                expect(commandsExt.testPrefix('foo bar')[0]).to.be.true;
                expect(commandsExt.testPrefix('!foo')[0]).to.be.true;
                expect(commandsExt.testPrefix('?foo')[0]).to.be.true;
                expect(commandsExt.testPrefix('!foo bar some other stuff')[0]).to.be.true;
                expect(commandsExt.testPrefix('?foo bar some other stuff')[0]).to.be.true;
            });

            it('should return the string without the prefix', () => {
                expect(commandsExt.testPrefix('foo bar')[1]).to.equal('bar');
                expect(commandsExt.testPrefix('!foo')[1]).to.equal('foo');
                expect(commandsExt.testPrefix('?foo')[1]).to.equal('foo');
                expect(commandsExt.testPrefix('!foo bar some other stuff')[1]).to.equal('foo bar some other stuff');
                expect(commandsExt.testPrefix('?foo bar some other stuff')[1]).to.equal('foo bar some other stuff');
            });
        });

        describe('#add', () => {

        });
    });
});
