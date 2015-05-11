// Copyright 2015 Traceur Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  suite,
  test,
  assert,
  setup,
  teardown
} from '../../unit/unitTestRunner.js';

import {BlockBindingTransformer} from '../../../src/codegeneration/BlockBindingTransformer.js';
import {UniqueIdentifierGenerator} from '../../../src/codegeneration/UniqueIdentifierGenerator.js';
import {TestTempTransformer} from '../../../src/codegeneration/TestTempTransformer.js';
import {Parser} from '../../../src/syntax/Parser.js';
import {SourceFile} from '../../../src/syntax/SourceFile.js';
import {write} from '../../../src/outputgeneration/TreeWriter.js';
import {ParseTreeValidator} from '../../../src/syntax/ParseTreeValidator.js';
import {Options} from '../../../src/Options.js';
import {CollectingErrorReporter as ErrorReporter} from '../../../src/util/CollectingErrorReporter.js';

suite('BlockBindingTransformer.js', function() {

  function parseScript(content) {
    var options = new Options({
      blockBinding: true,
      test: true,
    });
    var file = new SourceFile('test', content);
    var parser = new Parser(file, undefined, options);
    return parser.parseScript();
  }

  function normalize(content) {
    var tree = parseScript(content);
    return write(tree);
  }

  function makeTest(name, code, expected) {
    test(name, function() {
      var tree = parseScript(code);
      var reporter = new ErrorReporter();
      var transformer = new BlockBindingTransformer(
          new UniqueIdentifierGenerator(), reporter, tree);
      var transformed = transformer.transformAny(tree);
      new ParseTreeValidator().visitAny(transformed);
      var testTempTransformer = new TestTempTransformer();
      transformed = testTempTransformer.transformAny(transformed);
      assert.equal(write(transformed), normalize(expected));
      assert.lengthOf(reporter.errors, 0);
    });
  }

  makeTest('Let to Var', 'let x;', 'var x;');
  makeTest('Let to Var In Block',
      '1; { 2; let x; }',
      '1; { 2; var x; }');
//      AssertionError: expected '{\n  1;\n  {\n    2;\n    var $__0;\n  }\n}' to equal
//                               '{\n  1;\n  {\n    2;\n    var x;\n  }\n}'

  makeTest('Let to Var In Block',
      '1; if (true) { 2; let x = 5; }',
      '1; if (true) { 2; var x = 5; }');


  makeTest('Let to Var In ForLoop',
      'for (let i = 0; i < 5; i++);',
      'for (var i = 0; i < 5; i++);');
  makeTest('Let to Var In ForLoop 2',
      'for (let i = 0; i < 5; i++) { log(i); function t(){} }',
      // =======
      'for (var i = 0; i < 5; i++) {' +
      '  var t = function() {};' +
      '  log(i);' +
      '}');


  makeTest('Let to Var In ForLoop with Fn using local var',
      `for (let i = 0; i < 5; i++) {
        function t() {
          alert(i);
          let i = 5;
        }
      }`,
      // =======
      `for (var i = 0; i < 5; i++) {
        var t = function() {
          alert(i);
          var i = 5;
        };
      }`);

  makeTest('Let to Var with name collisions',
     'if (true) { let x = 5; }'+
     'if (true) { let x = 5; }',
     // =======
      'if (true) {' +
      '  var x = 5;' +
      '}' +
      'if (true) {' +
      '  var _x2 = 5;' +
      '}');

/*
 'var $__1 = function(i) {\n  function t() {\n    log(i);\n  }\n};\nfor (var i = 0; i < 5; i++) {\n  $__1(i);\n}\n'
 'var $__0 = function(i) {\n  function t() {\n    log(i);\n  }\n};\nfor (var i = 0; i < 5; i++) {\n  $__0(i);\n}\n'
*/
  suite('Loops with Fns using block variables', function() {
    makeTest('Let to Var in',
        'for (let i = 0; i < 5; i++) { function t(){ log(i); } }',
        // ======
        'var _loop = function(i) {' +
        '  function t() {' +
        '    log(i);' +
        '  }' +
        '};' +
        'for (var i = 0; i < 5; i++) {' +
          '_loop(i);' +
        '}');

    makeTest('Return in Fn',
        `() => {
          for(let i = 0; i < 5; i++) {
            return function t(){
              return i;
            }
          }
        }`,
        // =======
        `() => {
          var _loop = function(i) {
            return {v: function t() {
              return i;
            }};
          }, _ret;
          for (var i = 0; i < 5; i++) {
            _ret = _loop(i);
            if (typeof _ret === "object")
              return _ret.v;
          }
        }`);

    makeTest('Return nothing in Fn',
        `() => {
          for (let i = 0; i < 5; i++) {
            return;
            function t() {
              return i;
            }
          }
        }`,
        // =======
        `() => {
          var _loop = function(i) {
            return {v: (void 0)};
            function t() {
              return i;
            }
          }, _ret;
          for (var i = 0; i < 5; i++) {
            _ret = _loop(i);
            if (typeof _ret === "object")
              return _ret.v;
          }
        }`);

    makeTest('Break and Continue in Fn',
        '"use strict";' +
        'outer: while(true) {' +
        '  for (let i = 0; i < 5; i++) { ' +
        '    inner: while (true) {' +
        '      break;' +
        '      break outer;' +
        '      break inner;' +
        '      continue;' +
        '      continue outer;' +
        '      continue inner;' +
        '      function t() {return i;}' +
        '    }' +
        '  }' +
        '}',
        // ======
        '"use strict";' +
        'outer: while (true) {' +
        '  var _loop = function (i) {' +
        '    inner: while (true) {' +
        '      var t = function() {' +
        '        return i;' +
        '      };' +
        '      break;' +
        '      return 0;' +
        '      break inner;' +
        '      continue;' +
        '      return 1;' +
        '      continue inner;' +
        '    }' +
        '  }, _ret = void 0;' +
        '  for (var i = 0; i < 5; i++) {' +
        '    _ret = _loop(i);' +
        '    switch (_ret) {' +
        '      case 0:' +
        '        break outer;' +
        '      case 1:' +
        '        continue outer;' +
        '    }' +
        '  }' +
        '}');


    makeTest('This and Arguments',
        'for (let i = 0; i < 5; i++) {' +
        '  console.log(this, arguments);' +
        '  function t() { log(i); }' +
        '}',
        // ======
        'var _arguments = arguments,' +
        '    _this = this,' +
        '    _loop = function(i) {' +
        '      console.log(_this, _arguments);' +
        '      function t() { log(i); }' +
        '    };' +
        'for (var i = 0; i < 5; i++) {' +
        '_loop(i);' +
        '}');

    makeTest('Hoist Var Declaration',
        'for(let i = 0; i < 5; i++){ var k = 1; function t(){log(i)} }',
        // ======
        'var k, _loop = function(i) {' +
        '  k = 1;' +
        '  function t() {' +
        '    log(i);' +
        '  }' +
        '};' +
        'for (var i = 0; i < 5; i++) {' +
        '_loop(i);' +
        '}');

    makeTest('Function as Block Binding',
        'for(let i = 0; i < 5; i++){ function k() {} function t(){log(k)} }',
        // ======
        'var _loop = function(i) {' +
        '  function k() {}' +
        '  function t() {' +
        '    log(k);' +
        '  }' +
        '};' +
        'for (var i = 0; i < 5; i++) {' +
        '_loop(i);' +
        '}');

    makeTest('Loop with Var initializer remains untouched',
        'for(var i = 0; i < 5; i++){' +
        '  let x = 10;' +
        '  function t() {console.log(x)}' +
        '}',
        // ======
        'var _loop = function() {' +
        '  var x = 10;' +
        '  function t() {' +
        '    console.log(x);' +
        '  }' +
        '};' +
        'for (var i = 0; i < 5; i++) {' +
        '  _loop();' +
        '}');
  });

  suite('Hoisting', function() {
    makeTest('Function hoist in block',
        'if (true) { f(); function f() { other() } }',
        // ======
        'if (true) {' +
        '  var f = function() {' +
        '    other();' +
        '  };' +
        'f();' +
        '}');

    makeTest('Function are untouched when outside block',
        'f(); function f() { other() }',
        'f(); function f() { other() }');
  });

  makeTest('Rename in destructuring',
      'let x = 1; { let {x, y} = {}; }',
      'var x = 1; { var {x: _x2, y} = {}; }');
  makeTest('Rename in destructuring 2',
      'let x = 1; { let {y, x} = {}; }',
      'var x = 1; { var {y, x: _x2} = {}; }');

  makeTest('Rename in destructuring 3',
      'let x = 1; { let {x: x, y} = {}; }',
      'var x = 1; { var {x: _x2, y} = {}; }');
  makeTest('Rename in destructuring 4',
      'let x = 1; { let {y, x: x} = {}; }',
      'var x = 1; { var {y, x: _x2} = {}; }');

  makeTest('Rename in destructuring with initializer',
      'let x = 1; { let {x, y = x} = {}; }',
      'var x = 1; { var {x: _x2, y = _x2} = {}; }');
  makeTest('Rename in destructuring with initializer with binding',
      'let x = 1; { let {x = function x() {}} = {}; }',
      'var x = 1; { var {x: _x2 = function x() {}} = {}; }');
  makeTest('Rename in destructuring with initializer',
      'let x = 1; { let {x: x = function x() {}} = {}; }',
      'var x = 1; { var {x: _x2 = function x() {}} = {}; }');
  makeTest('Rename in destructuring with reference in initializer',
      'let x = 1; { let {x = () => x} = {}; }',
      'var x = 1; { var {x: _x2 = () => _x2} = {}; }');

  makeTest('Rename in nested destructuring',
      'let x = 1; { let {x: {x}} = {}; }',
      'var x = 1; { var {x: {x: _x2}} = {}; }');
  makeTest('Rename in nested destructuring 2',
      'let x = 1; { let {x: {x = function x() {}}} = {}; }',
      'var x = 1; { var {x: {x: _x2 = function x() {}}} = {}; }');

  makeTest('Rename, make sure function name in initializer is not renamed',
      'let x = 1; { let y = function x() {}; }',
      'var x = 1; { var y = function x() {}; }');

  makeTest('Rename, make sure function name in initializer is not renamed 2',
      'let x = 1; { let y = class x {}; }',
      'var x = 1; { var y = class x {}; }');

  makeTest('Siblings',
      '{ let x = 1; }' +
      '{ let x = 2; }' +
      'x;',
      // ======
      '{ var _x2 = 1; }' +
      '{ var _x3 = 2; }' +
      'x;');

  makeTest('Siblings 2',
      '{ let x = 1; x; }' +
      '{ let x = 2; x; }' +
      'x;',
      // ======
      '{ var _x2 = 1; _x2; }' +
      '{ var _x3 = 2; _x3; }' +
      'x;');

  makeTest('Siblings 3',
      'function g() {' +
      '  var z = 1;' +
      '  function f() {' +
      '    z;' +
      '    {' +
      '      let z = 2;' +
      '      z;' +
      '    }' +
      '    z;' +
      '  }' +
      '}',
      // ======
      'function g() {' +
      '  var z = 1;' +
      '  function f() {' +
      '    z;' +
      '    {' +
      '      var _z2 = 2;' +
      '      _z2;' +
      '    }' +
      '    z;' +
      '  }' +
      '}');

  makeTest('for in',
      'function g() {' +
      '  for (var x in {}) {}' +
      '}',
      // ======
      'function g() {' +
      '  for (var x in {}) {}' +
      '}');

  makeTest('for of',
      'function g() {' +
      '  for (var x of []) {}' +
      '}',
      // ======
      'function g() {' +
      '  for (var x of []) {}' +
      '}');

});
