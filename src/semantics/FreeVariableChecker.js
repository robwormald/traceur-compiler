// Copyright 2012 Traceur Authors.
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

import {ScopeChainBuilder} from './ScopeChainBuilder.js';
import {ScopeVisitor} from './ScopeVisitor.js';
import {
  FUNCTION_DECLARATION,
  FUNCTION_EXPRESSION,
  GET_ACCESSOR,
  MODULE,
  PROPERTY_METHOD_ASSIGNMENT,
  SET_ACCESSOR
} from '../syntax/trees/ParseTreeType.js';

function hasArgumentsInScope(scope) {
  for (; scope; scope = scope.parent) {
    switch (scope.tree.type) {
      case FUNCTION_DECLARATION:
      case FUNCTION_EXPRESSION:
      case GET_ACCESSOR:
      case PROPERTY_METHOD_ASSIGNMENT:
      case SET_ACCESSOR:
        return true;
    }
  }
  return false;
}

function inModuleScope(scope) {
  for (; scope; scope = scope.parent) {
    if (scope.tree.type === MODULE) {
      return true;
    }
  }
  return false;
}

class FreeVariableChecker extends ScopeVisitor {
  /**
   * @param {ScopeVisitor} scopeBuilder
   * @param {Object} global
   * @param {ErrorReporter} reporter
   */
  constructor(scopeBuilder, global, reporter) {
    super();
    this.scopeBuilder_ = scopeBuilder;
    this.reporter = reporter;
    this.global_ = global;
  }

  pushScope(tree) {
    // Override to return the cached scope.
    return this.scope = this.scopeBuilder_.getScopeForTree(tree);
  }

  visitIdentifierExpression(tree) {
    this.candidateFound_(tree.identifierToken);
  }

  visitPropertyNameShorthand(tree) {
    this.candidateFound_(tree.name);
  }

  candidateFound_(token) {
    if (this.inWithBlock) return;
    let scope = this.scope;
    let {value} = token;
    if (value === 'arguments' && hasArgumentsInScope(scope)) {
      return;
    }

    if (value === '__moduleName' && inModuleScope(scope)) {
      return;
    }

    this.referenceFound(token);
  }

  /**
   * Override to report an error instead of adding the reference to the scope.
   */
  referenceFound(token) {
    if (this.scope.getBinding(token)) return;
    let {location, value} = token;
    if (!(value in this.global_)) {
      this.reporter.reportError(location.start, `${value} is not defined`);
    }
  }

}

/**
 * Validates that there are no free variables in a tree.
 */
export function validate(tree, reporter, global = Reflect.global) {
  let builder = new ScopeChainBuilder(reporter);
  builder.visitAny(tree);
  let checker = new FreeVariableChecker(builder, global, reporter);
  checker.visitAny(tree);
}
