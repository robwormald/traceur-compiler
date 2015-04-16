import {write} from './src/outputgeneration/TreeWriter.js';
import {Options} from './src/Options.js';
import {InlineLoaderCompiler} from './src/runtime/InlineLoaderCompiler.js';
import {TraceurLoader} from './src/runtime/TraceurLoader.js';

let path = require('path');
let nodeLoader = require('./src/node/nodeLoader.js');

// This is very similar to what we use for compiling Traceur itself. It
// uses a sub class of the module loader which makes it validate all the
// imports and exports.
//
// The  InlineLoaderCompiler is a subclass of the standard loader which
// instead of evaluating the code it just concats the code into one file.

function recursiveModuleCompile(filenames, options, callback, errback) {
  var basePath = path.resolve('./') + '/';
  var loadCount = 0;
  var elements = [];
  var loaderCompiler = new InlineLoaderCompiler(elements);

  var loader = new TraceurLoader(nodeLoader, basePath, loaderCompiler);

  function loadNext() {
    var name = filenames[loadCount];
    var loadOptions = {
      referrerName: './',
      metadata: {traceurOptions: options}
    };
    loader.import(name, loadOptions).then(
        () => {
          loadCount++;
          if (loadCount < filenames.length) {
            loadNext();
          } else {
            var tree = loaderCompiler.toTree(basePath, elements);
            callback(tree);
          }
        }, (err) => {
          errback(err);
        }).catch((ex) => {
          console.error('Internal error ' + (ex.stack || ex));
        });
  }

  loadNext();
}

recursiveModuleCompile(process.argv.slice(2), new Options({modules: 'amd'}),
    (tree) => {
      console.log(write(tree));
    }, (err) => {
      console.error(err);
    });
