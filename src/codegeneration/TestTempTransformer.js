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
  ObjectPatternField,
} from '../syntax/trees/ParseTrees.js';
import {ScopeChainBuilderWithReferences} from '../semantics/ScopeChainBuilderWithReferences.js';
import {TEMP_IDENTIFIER} from '../syntax/TokenType.js';
import {StringSet} from '../util/StringSet.js';
import {
  BINDING_ELEMENT,
  BINDING_IDENTIFIER,
  LITERAL_PROPERTY_NAME,
} from '../syntax/trees/ParseTreeType.js';

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

class State {
  constructor(oldState) {
    if (oldState !== null) {
      this.renames = Object.create(oldState.renames);
      this.usedNames = Object.create(oldState.usedNames);
    } else {
      this.renames = Object.create(null);
      this.usedNames = Object.create(null);
    }
  }
}

export class TestTempTransformer extends ParseTreeTransformer {
  constructor() {
    super();
    this.scopeBuilder_ = null;
    this.state_ = new State(null);
  }

  buildRenameMap_(tree) {
    let scope = this.scopeBuilder_.getScopeForTree(tree);
    let varNames = scope.getAllBindingNames();
    let state = this.state_;
    this.state_ = new State(state);

    varNames.forEach((name) => {
      let b = scope.getBindingByName(name);
      let token = b.tree.identifierToken;
      if (token.type !== TEMP_IDENTIFIER) {
        return;
      }

      let preferredName = token.preferredName;
      let varName = preferredName;
      let n = 2;
      let prepend = preferredName[0] === '_' ? '' : '_';
      while (this.state_.usedNames[varName] || varNames.has(varName) ||
             scope.hasFreeVariable(varName)) {
        varName = prepend + preferredName + String(n);
        n++;
      }
      this.state_.renames[name] = varName;
      this.state_.usedNames[varName] = true;

    });
    return state;
  }

/*
  var $__0 // _ref;
  function f() {
    var $__1 // _ref
    $__0
  }
}
*/

  transformScript(tree) {
    let scopeBuilder = new BuildScopes(null);
    scopeBuilder.visitAny(tree);
    this.scopeBuilder_ = scopeBuilder;

    let state = this.buildRenameMap_(tree);
    let rv = super.transformScript(tree);
    this.state_ = state;
    return rv;
  }

  transformModules(tree) {
    let scopeBuilder = new BuildScopes(null);
    scopeBuilder.visitAny(tree);
    this.scopeBuilder_ = scopeBuilder;

    let state = this.buildRenameMap_(tree);
    let rv = super.transformModules(tree);
    this.state_ = state;
    return rv;
  }

  transformFunctionDeclaration(tree) {
    let state = this.buildRenameMap_(tree);
    let rv = super.transformFunctionDeclaration(tree);
    this.state_ = state;
    return rv;
  }

  transformFunctionExpression(tree) {
    let state = this.buildRenameMap_(tree);
    let rv = super.transformFunctionExpression(tree);
    this.state_ = state;
    return rv;
  }

  transformPropertyMethodAssignment(tree) {
    let state = this.buildRenameMap_(tree);
    let rv = super.transformPropertyMethodAssignment(tree);
    this.state_ = state;
    return rv;
  }

  transformGetAccessor(tree) {
    let state = this.buildRenameMap_(tree);
    let rv = super.transformGetAccessor(tree);
    this.state_ = state;
    return rv;
  }

  transformSetAccessor(tree) {
    let state = this.buildRenameMap_(tree);
    let rv = super.transformSetAccessor(tree);
    this.state_ = state;
    return rv;
  }

  transformArrowFunctionExpression(tree) {
    let state = this.buildRenameMap_(tree);
    let rv = super.transformArrowFunctionExpression(tree);
    this.state_ = state;
    return rv;
  }

  transformCatch(tree) {
    let state = this.buildRenameMap_(tree);
    let rv = super.transformCatch(tree);
    this.state_ = state;
    return rv;
  }

  transformIdentifierExpression(tree) {
    if (tree.identifierToken.type === TEMP_IDENTIFIER) {
      let name = tree.identifierToken.value;
      let token = new IdentifierToken(tree.location,
                                      this.state_.renames[name]);
      return new IdentifierExpression(tree.location, token);
    }
    return super.transformIdentifierExpression(tree);
  }

  transformBindingIdentifier(tree) {
    if (tree.identifierToken.type === TEMP_IDENTIFIER) {
      let name = tree.identifierToken.value;
      console.assert(typeof this.state_.renames[name] == 'string', name, tree.identifierToken.preferredName, this.state_.renames);
      let token = new IdentifierToken(tree.location,
                                      this.state_.renames[name]);
      return new BindingIdentifier(tree.location, token);
    }
    return super.transformBindingIdentifier(tree);
  }

  transformObjectPatternField(tree) {
    // We might have renamed {x} into {x: temp} but end up renaming temp back to
    // x.
    let name = this.transformAny(tree.name);
    let element = this.transformAny(tree.element);
    if (name === tree.name && element === tree.element) {
      return tree;
    }
    if (name.type === LITERAL_PROPERTY_NAME &&
        element.type === BINDING_ELEMENT &&
        element.binding.type === BINDING_IDENTIFIER  &&
        element.binding.identifierToken.value === name.literalToken.value) {
      return element;
    }
    return new ObjectPatternField(tree.location, name, element);

  }
}
