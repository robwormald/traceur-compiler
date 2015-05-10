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

import {suite, test, assert} from '../../../unit/unitTestRunner.js';

import filePathToBindingName from '../../../../src/codegeneration/module/filePathToBindingName.js';


suite('filePathToBindingName.js', () => {

  test('Test', () => {
    assert.equal('_module', filePathToBindingName(''));
    assert.equal('_module', filePathToBindingName('.'));
    assert.equal('_aaaBbbCcc', filePathToBindingName('../aaa/bbb/ccc.js'));
    assert.equal('_aaa', filePathToBindingName('aaa'));
    assert.equal('_aaaBbb', filePathToBindingName('aaa\\bbb'));
    assert.equal('_aaaBbb', filePathToBindingName('aaa-bbb'));
    assert.equal('_aaaBbb', filePathToBindingName('aaa bbb'));
    assert.equal('_', filePathToBindingName('_'));
    assert.equal('_a', filePathToBindingName('_a'));
    assert.equal('_module', filePathToBindingName('/'));
    assert.equal('_42', filePathToBindingName('42'));
  });

});
