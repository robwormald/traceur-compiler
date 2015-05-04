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
import {AnonBlock, ExpressionStatement, IdentifierExpression} from '../syntax/trees/ParseTrees.js';
import {ScopeChainBuilderWithReferences} from '../semantics/ScopeChainBuilderWithReferences.js';
import {TEMP_IDENTIFIER} from '../syntax/TokenType.js';
import {StringSet} from '../util/StringSet.js';

/*

Build scopes
Keep a map from ParseTree to Scope
Keep a map from ParseTree to temp identifiers used in the tree

Transformer
set scope when entering functions
When entering functions

*/

class BuildScopes extends ScopeChainBuilderWithReferences {
  // constructor(reporter) {
  //   super(reporter);
  // }
  //
  // visitIdentifierExpression(tree) {
  //   if (tree.identifierToken.type === TEMP_IDENTIFIER) {
  //     debugger;
  //     console.log(tree.identifierToken.value);
  //     return;
  //   }
  // }
  //
  // /**
  //  * Override to report an error instead of adding the reference to the scope.
  //  */
  // referenceFound(tree, name) {
  //   console.log(tree, name);
  //   super.referenceFound(tree, name);
  // }

}

export class TestTempTransformer extends ParseTreeTransformer {
  constructor() {
    super();
    this.scopeBuilder_ = null;
  }

  transformScript(tree) {
    let scopeBuilder = new BuildScopes(null);
    scopeBuilder.visitAny(tree);
    this.scopeBuilder_ = scopeBuilder;
    return super.transformScript(tree);
  }

  transformFunctionDeclaration(tree) {
    let scope = this.scopeBuilder_.getScopeForTree(tree);
    let varNames = scope.getAllBindingNames();
    let varsToRename = new StringSet();
    varNames.forEach((name) => {
      if (/^\$__/.test(name)) {
        let wantedName = 'x';
        let varName = wantedName;
        let n = 2;
        while (varNames.has(varName) || scope.hasFreeVariable(varName)) {
          varName = wantedName + n;
          n++;
        }
        console.log(varName);
      }
    });

    return super.transformFunctionDeclaration(tree);
  }

  // transformIdentifierExpression(tree) {
  //   if (tree.identifierToken.type === TEMP_IDENTIFIER) {
  //     debugger;
  //     let name = tree.identifierToken.value;
  //     // this.scopeBuilder_.scope.hasBindingName(name);
  //   }
  //   return super.transformIdentifierExpression(tree);
  // }
}
