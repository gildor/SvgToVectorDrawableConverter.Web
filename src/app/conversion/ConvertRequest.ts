import { EventEmitter } from '@angular/core';
import * as shortid from 'shortid';

export class ConvertRequest {
    readonly id = shortid.generate();
    lib: string;
    fixFillType: boolean;

    readonly abort = new EventEmitter();

    readonly response = new EventEmitter<{ output: string, warnings: string[] }>();
    readonly error = new EventEmitter<string>();

    constructor(readonly inputFile: File) { }

    svgName(): string {
        return this.inputFile.name;
    }

    xmlName(): string {
        let name = this.svgName();
        name = name.slice(0, name.lastIndexOf('.'));
        name = name.toLowerCase();
        name = name.replace(/\W/g, '_');
        if (/^\d/.test(name)) {
            name = '_' + name;
        }
        name += '.xml';
        return name;
    }
}
