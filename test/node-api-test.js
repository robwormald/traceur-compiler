var readFileSync = require('fs').readFileSync;
var path = require('path');

suite('node public api', function() {
  var traceurAPI = require('../src/node/api.js');
  var filename = path.join(__dirname + '/commonjs/BasicImport.js');
  var contents = readFileSync(filename, 'utf8');

  function bs(s) {
    return s.replace(/\//g, '\\');
  }

  function fs(s) {
    return s.replace(/\\/g, '/');
  }

  test('moduleName from filename with backslashes', function() {
    var compiler = new traceurAPI.NodeCompiler({
      // build ES6 style modules rather then cjs
      modules: 'register',

      // node defaults to moduleName false
      moduleName: true,

      // ensure the source map works
      sourceMaps: true
    });
    // windows-simulation, with .js
    var compiled = compiler.compile(contents, filename);
    assert.ok(compiled, 'can compile');
    assert.include(
      compiled,

      // the module path is relative to the cwd setting when we compile it.
      'commonjs/BasicImport',

      'module name without backslashes'
    );
    assert.ok(compiler.getSourceMap(), 'has sourceMap');
  });

  test('sourceRoot with backslashes', function() {
    var compiler = new traceurAPI.NodeCompiler({
      // build ES6 style modules rather then cjs
      modules: 'register',

      // ensure the source map works
      sourceMaps: true
    });
    // windows-simulation, with .js
    var windowsLikeFilename = bs(filename);
    var windowsLikeDirname  = bs(path.dirname(filename));
    var compiled = compiler.compile(contents, windowsLikeFilename,
        windowsLikeFilename, windowsLikeDirname);
    assert.ok(compiled, 'can compile');
    assert.ok(compiler.getSourceMap(), 'has sourceMap');
    var sourceMap = JSON.parse(compiler.getSourceMap());
    assert.equal(fs(__dirname) + '/commonjs/', sourceMap.sourceRoot,
        'has correct sourceRoot');
    assert(sourceMap.sources.some(function(name) {
      return path.join(sourceMap.sourceRoot, name) === path.normalize(filename);
    }), 'One of the sources is the source');
  });


  test('sourceRoot with full windows path and backslashes', function() {
    var compiler = new traceurAPI.NodeCompiler({
      // build ES6 style modules rather then cjs
      modules: 'register',

      // ensure the source map works
      sourceMaps: true
    });
    // windows-simulation, with .js
    var windowsLikeDirname = 'D:\\traceur\\test\\commonjs\\';
    var windowsLikeFilename = windowsLikeDirname + 'BasicImport.js';
    var compiled = compiler.compile(contents, windowsLikeFilename,
        windowsLikeFilename, windowsLikeDirname);
    assert.ok(compiled, 'can compile');
    assert.ok(compiler.getSourceMap(), 'has sourceMap');
    var sourceMap = JSON.parse(compiler.getSourceMap());
    assert.equal(windowsLikeDirname.replace(/\\/g,'/'), sourceMap.sourceRoot,
        'has correct sourceRoot');
    var forwardSlashedName = windowsLikeFilename.replace(/\\/g,'/');
    assert(sourceMap.sources.some(function(name) {
      return (sourceMap.sourceRoot + name) === forwardSlashedName;
    }), 'One of the sources is the source');
  });

  test('modules: true', function() {
    var compiler = new traceurAPI.NodeCompiler({

      // build ES6 style modules rather then cjs
      modules: 'register',

      // node defaults to moduleName false
      moduleName: true,

      // ensure the source map works
      sourceMaps: true
    });
    var compiled = compiler.compile(contents, filename);
    assert.ok(compiled, 'can compile');
    assert.include(
      compiled,

      // the module path is relative to the cwd setting when we compile it.
      'commonjs/BasicImport',

      'module defines its path'
    );
    assert.ok(compiler.getSourceMap(), 'has sourceMap');
  });

  test('named amd', function() {
    var compiled = traceurAPI.compile(contents, {
      // build ES6 style modules rather then cjs
      modules: 'amd',

      // enforce a module name in the AMD define
      moduleName: 'test-module'
    }, filename);

    assert.ok(compiled, 'can compile');

    var gotName;
    var define = function(name) {
      gotName = name;
    }

    eval(compiled);

    assert.ok(gotName == 'test-module', 'module defines into named AMD');
  });
});
