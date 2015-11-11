import {Parser} from './src/syntax/Parser.js';
import {SourceFile} from './src/syntax/SourceFile.js';
import {write} from './src/outputgeneration/TreeWriter.js';

import {name, contents} from 'data';

let f = new SourceFile(name, contents);
let p = new Parser(f);
let tree = p.parseScript();
console.log(write(tree));
