// Copyright 2015 Traceur Authors.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {TempIdentifierToken} from '../syntax/TempIdentifierToken.js';
import {ParseTreeTransformer} from './ParseTreeTransformer.js';
import {
  AnonBlock,
  BindingIdentifier,
  ExpressionStatement,
  IdentifierExpression,
  VariableDeclaration,
  VariableDeclarationList,
  VariableStatement,
} from '../syntax/trees/ParseTrees.js';
import {VAR} from '../syntax/TokenType.js';

export class TestTransformer extends ParseTreeTransformer {

  transformReturnStatement(tree) {
    let t = new TempIdentifierToken(null, 'abc');
    let vs = new VariableStatement(null,
        new VariableDeclarationList(null, VAR, [
            new VariableDeclaration(null,
                new BindingIdentifier(null, t),
                null,  // typeAnnotation
                null)
      ]));
    let e = new IdentifierExpression(null, t);
    let s = new ExpressionStatement(null, e);
    return new AnonBlock(null, [vs, s, tree]);
  }
}
