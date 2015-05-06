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
import {IdentifierToken} from '../syntax/IdentifierToken.js';
import {ParseTreeTransformer} from './ParseTreeTransformer.js';
import {
  AnonBlock,
  BindingIdentifier,
  ExpressionStatement,
  IdentifierExpression,
} from '../syntax/trees/ParseTrees.js';
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
    this.renames = Object.create(null);
  }

  buildRenameMap_(tree) {
    let scope = this.scopeBuilder_.getScopeForTree(tree);
    let varNames = scope.getAllBindingNames();
    let renames = this.renames;
    this.renames = Object.create(renames);
    let seenNames = new StringSet();
    varNames.forEach((name) => {
      let b = scope.getBindingByName(name);
      let token = b.tree.identifierToken;
      if (token.type !== TEMP_IDENTIFIER) {
        return;
      }

      let wantedName = token.wantedName;
      let varName = wantedName;
      let n = 2;
      while (varNames.has(varName) || scope.hasFreeVariable(varName) ||
             seenNames.has(varName)) {
        varName = wantedName + String(n);
        n++;
      }
      seenNames.add(varName);
      this.renames[name] = varName;

    });
    return renames;
  }

  transformScript(tree) {
    let scopeBuilder = new BuildScopes(null);
    scopeBuilder.visitAny(tree);
    this.scopeBuilder_ = scopeBuilder;

    let renames = this.buildRenameMap_(tree);
    let rv = super.transformScript(tree);
    this.renames = renames;
    return rv;
  }

  transformModules(tree) {
    let scopeBuilder = new BuildScopes(null);
    scopeBuilder.visitAny(tree);
    this.scopeBuilder_ = scopeBuilder;

    let renames = this.buildRenameMap_(tree);
    let rv = super.transformModules(tree);
    this.renames = renames;
    return rv;
  }

  transformFunctionDeclaration(tree) {
    let renames = this.buildRenameMap_(tree);
    let rv = super.transformFunctionDeclaration(tree);
    this.renames = renames;
    return rv;
  }

  transformFunctionExpression(tree) {
    let renames = this.buildRenameMap_(tree);
    let rv = super.transformFunctionExpression(tree);
    this.renames = renames;
    return rv;
  }

  transformPropertyMethodAssignment(tree) {
    let renames = this.buildRenameMap_(tree);
    let rv = super.transformPropertyMethodAssignment(tree);
    this.renames = renames;
    return rv;
  }

  transformGetAccessor(tree) {
    let renames = this.buildRenameMap_(tree);
    let rv = super.transformGetAccessor(tree);
    this.renames = renames;
    return rv;
  }

  transformSetAccessor(tree) {
    let renames = this.buildRenameMap_(tree);
    let rv = super.transformSetAccessor(tree);
    this.renames = renames;
    return rv;
  }

  transformArrowFunctionExpression(tree) {
    let renames = this.buildRenameMap_(tree);
    let rv = super.transformArrowFunctionExpression(tree);
    this.renames = renames;
    return rv;
  }

  transformCatch(tree) {
    let renames = this.buildRenameMap_(tree);
    let rv = super.transformCatch(tree);
    this.renames = renames;
    return rv;
  }

  transformIdentifierExpression(tree) {
    if (tree.identifierToken.type === TEMP_IDENTIFIER) {
      let name = tree.identifierToken.value;
      let token = new IdentifierToken(tree.location,
                                      this.renames[name]);
      return new IdentifierExpression(tree.location, token);
    }
    return super.transformIdentifierExpression(tree);
  }

  transformBindingIdentifier(tree) {
    if (tree.identifierToken.type === TEMP_IDENTIFIER) {
      let name = tree.identifierToken.value;
      let token = new IdentifierToken(tree.location,
                                      this.renames[name]);
      return new BindingIdentifier(tree.location, token);
    }
    return super.transformBindingIdentifier(tree);
  }
}
