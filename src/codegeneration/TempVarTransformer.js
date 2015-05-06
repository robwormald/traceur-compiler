// Copyright 2012 Traceur Authors.
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

import {ParseTreeTransformer} from './ParseTreeTransformer.js';
import {
  BindingIdentifier,
  Module,
  Script,
  VariableDeclaration,
  VariableDeclarationList,
  VariableStatement,
} from '../syntax/trees/ParseTrees.js';
import {ARGUMENTS} from '../syntax/PredefinedName.js';
import {StringSet} from '../util/StringSet.js';
import {LET, VAR} from '../syntax/TokenType.js';
import {TempIdentifierToken} from '../syntax/TempIdentifierToken.js';
import {
  createFunctionBody,
  createThisExpression,
  createIdentifierExpression,
  createVariableDeclaration,
  createVariableDeclarationList,
  createVariableStatement
} from './ParseTreeFactory.js';
import {prependStatements} from './PrependStatements.js';

class TempVarStatement {
  constructor(token, initializer) {
    this.token = token;
    this.initializer = initializer;
  }
}

class TempScope {
  constructor() {
    this.identifiers = [];
  }

  push(identifier) {
    this.identifiers.push(identifier);
  }

  pop() {
    return this.identifiers.pop();
  }

  release(obj) {
    for (let i = this.identifiers.length - 1; i >= 0; i--) {
      obj.release_(this.identifiers[i]);
    }
  }
}

class VarScope {
  constructor(options) {
    this.thisName = null;
    this.argumentsName = null;
    this.tempVarStatements = [];
    this.declarationType_ =
        options.blockBinding && !options.transformOptions.blockBinding ?
            LET : VAR;
  }

  push(tempVarStatement) {
    this.tempVarStatements.push(tempVarStatement);
  }

  pop() {
    return this.tempVarStatements.pop();
  }

  release(obj) {
    // for (let i = this.tempVarStatements.length - 1; i >= 0; i--) {
    //   obj.release_(this.tempVarStatements[i].name);
    // }
  }

  isEmpty() {
    return !this.tempVarStatements.length;
  }

  createVariableStatement() {
    let declarations = [];
    let seenNames = new StringSet();
    for (let i = 0; i < this.tempVarStatements.length; i++) {
      let {token, initializer} = this.tempVarStatements[i];
      let name = token.value;
      if (seenNames.has(name)) {
        if (initializer)
          throw new Error('Invalid use of TempVarTransformer');
        continue;
      }
      seenNames.add(name);
      let d = new VariableDeclaration(null,
          new BindingIdentifier(null, token),
          null,  // typeAnnotation
          initializer)
      declarations.push(d);
    }

    return new VariableStatement(null,
        new VariableDeclarationList(null, this.declarationType_, declarations));
  }
}

/**
 * A generic transformer that allows you to easily create a expression with
 * temporary variables.
 */
export class TempVarTransformer extends ParseTreeTransformer {
  /**
   * @param {UniqueIdentifierGenerator} identifierGenerator
   * @param {ErrorReporter} reporter
   * @param {Options} options
   */
  constructor(identifierGenerator, reporter, options) {
    super();
    this.identifierGenerator = identifierGenerator;
    this.reporter = reporter;
    this.options = options;

    // Stack used for variable declarations.
    this.tempVarStack_ = [new VarScope(this.options)];

    // Stack used for the temp scopes. Temp scopes can be used to allow
    // temporary names to used sooner than after leaving the currently function
    // body.
    // this.tempScopeStack_ = [new TempScope()];

    // Names that can be reused.
    // this.namePool_ = [];
  }

  /**
   * Transforms a an array of statements and adds a new temp var scope.
   * @param {Array.<ParseTree>} statements
   * @return {Array.<ParseTree>}
   * @private
   */
  transformStatements_(statements) {
    this.tempVarStack_.push(new VarScope(this.options));

    let transformedStatements = this.transformList(statements);

    let vars = this.tempVarStack_.pop();
    if (vars.isEmpty())
      return transformedStatements;

    let variableStatement = vars.createVariableStatement();
    vars.release(this);

    return prependStatements(transformedStatements, variableStatement);
  }

  transformScript(tree) {
    let scriptItemList = this.transformStatements_(tree.scriptItemList);
    if (scriptItemList === tree.scriptItemList) {
      return tree;
    }
    return new Script(tree.location, scriptItemList, tree.moduleName);
  }

  transformModule(tree) {
    let scriptItemList = this.transformStatements_(tree.scriptItemList);
    if (scriptItemList === tree.scriptItemList) {
      return tree;
    }
    return new Module(tree.location, scriptItemList, tree.moduleName);
  }

  transformFunctionBody(tree) {
    this.pushTempScope();
    let statements = this.transformStatements_(tree.statements);
    this.popTempScope();
    if (statements === tree.statements)
      return tree;
    return createFunctionBody(statements);
  }

  /**
   * @return {TempIdentifierToken} An identifier token that can may be reused after the
   *     current temp scope has been exited.
   */
  getTempIdentifierToken(wantedName = '_ref') {
    let name = this.getName_();
    return new TempIdentifierToken(null, name, wantedName);

  }

  getName_() {
    return this.identifierGenerator.generateUniqueIdentifier();
  }

  /**
   * Adds a new temporary variable to the current function scope.
   * @param {ParseTree=} initializer If present then the variable will
   *     have this as the initializer expression.
   * @return {string} The name of the temporary variable.
   */
  // addTempVar(wantedName = '_ref', initializer = null) {
  //   return this.addTempVarToken(wantedName, initializer).value;
  // }

  addTempVarToken(wantedName = '_ref', initializer = null) {
    if (typeof wantedName !== 'string') {
      throw new TypeError();
    }

    let vars = this.tempVarStack_[this.tempVarStack_.length - 1];
    let name = this.getName_();
    let token = new TempIdentifierToken(null, name, wantedName);
    vars.push(new TempVarStatement(token, initializer));
    return token;
  }

  addTempVarForThis() {
    return this.addTempVarForThisToken().value;
  }

  addTempVarForThisToken() {
    let varScope = this.tempVarStack_[this.tempVarStack_.length - 1];
    if (varScope.thisName !== null) {
      return varScope.thisName;
    }
    return varScope.thisName =
        this.addTempVarToken('_this', createThisExpression());
  }

  addTempVarForArguments() {
    return this.addTempVarForArgumentsToken().value;
  }

  addTempVarForArgumentsToken() {
    let varScope = this.tempVarStack_[this.tempVarStack_.length - 1];
    if (varScope.argumentsName !== null) {
      return varScope.argumentsName;
    }
    return varScope.argumentsName = this.addTempVarToken('_arguments',
        createIdentifierExpression(ARGUMENTS));
  }


  /**
   * Pushes a new temporary name scope. This is useful if you know that
   * your temporary variable can be reused sooner than after the current
   * lexical scope has been exited.
   */
  pushTempScope() {
    // this.tempScopeStack_.push(new TempScope());
  }

  popTempScope() {
    // this.tempScopeStack_.pop().release(this);
  }

  /**
   * Put back the |name| into the pool of reusable temporary varible names.
   * @param {string} name
   * @private
   */
  release_(name) {
    // this.namePool_.push(name);
  }
}
