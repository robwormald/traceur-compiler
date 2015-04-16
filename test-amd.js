import {ErrorReporter} from './src/util/ErrorReporter.js';
import {FromOptionsTransformer} from './src/codegeneration/FromOptionsTransformer.js'
import {ModuleSpecifierVisitor} from './src/codegeneration/module/ModuleSpecifierVisitor.js';
import {Options} from './src/Options.js';
import {Parser} from './src/syntax/Parser.js';
import {SourceFile} from './src/syntax/SourceFile.js';
import {write} from './src/outputgeneration/TreeWriter.js';

let {readFile} = require('fs');
let path = require('path');

let options = new Options({modules: 'amd'});
let reporter = new ErrorReporter();

function readSourceFileP(path) {
  return new Promise((resolve, reject) => {
    readFile(path, {encoding: 'utf8'}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(new SourceFile(path, data));
      }
    });
  });
}

function sourceFileToModuleTree(file) {
  return new Parser(file, reporter, options).parseModule();
}

function getModuleSpecifiers(tree) {
  let visitor = new ModuleSpecifierVisitor(options);
  visitor.visitAny(tree);
  return visitor.moduleSpecifiers;
}

let print = (...args) => console.log(...args);

function getDependenciesP(filename, dependencies = new Map()) {
  if (!dependencies.has(filename)) {
    return readSourceFileP(filename).then(sourceFileToModuleTree).
        then((tree) => {
          dependencies.set(filename, tree);
          return tree;
        }).
        then(getModuleSpecifiers).then((ms) => {
          if (ms.length === 0) return;
          return Promise.all(ms.map((name) => {
            let resolvedName = path.join(path.dirname(filename), name);
            // name is relative to the file importing it.
            return getDependenciesP(resolvedName, dependencies);
          }));
        });
  }
  return Promise.resolve();
}

let filename = path.resolve(process.argv[2]);
let map = new Map();
let transformer = new FromOptionsTransformer(reporter, options);

getDependenciesP(filename, map).then(() => {
  for (let [filename, tree] of map) {
    print(`// ${filename}`);
    let transformed = transformer.transform(tree);
    print(write(transformed));
  }
}).catch((err) => {
  console.error(err.stack);
});