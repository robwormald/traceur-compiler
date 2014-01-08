// Copyright 2014 Traceur Authors.
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

// TODO(arv): This should be automatically generated just like we generate ParseTrees today.

import {ParseTree} from './ParseTree';
module ParseTreeType from './ParseTreeType';


var FUNCTION_DECLARATION = ParseTreeType.FUNCTION_DECLARATION;
export class FunctionDeclaration extends ParseTree {
  /**
   * @param {SourceRange} location
   * @param {BindingIdentifier} name
   * @param {boolean} isGenerator
   * @param {FormalParameterList} formalParameterList
   * @param {ParseTree} typeAnnotation
   * @param {FunctionBody} functionBody
   */
  constructor(location, name, isGenerator, formalParameterList, typeAnnotation, functionBody) {
    this.location = location;
    this.children = [
      null,  // Token "function"
      isGenerator,
      name,
      null,  // Token "("
      formalParameterList,
      null,  // Token ")"
      typeAnnotation,
      functionBody
    ];
  }

  /**
   * @param {ParseTreeTransformer} transformer
   */
  transform(transformer) {
    return transformer.transformFunctionDeclaration(this);
  }

  /**
   * @param {ParseTreeVisitor} visitor
   */
  visit(visitor) {
    visitor.visitFunctionDeclaration(this);
  }

  /**
   * @type {ParseTreeType}
   */
  get type() {
    return FUNCTION_DECLARATION;
  }

  get isGenerator() {
    return this.children[1];
  }

  get name() {
    return this.children[2];
  }

  get formalParameterList() {
    return this.children[4];
  }

  get typeAnnotation() {
    return this.children[6];
  }

  get functionBody() {
    return this.children[7];
  }
}

var FUNCTION_EXPRESSION = ParseTreeType.FUNCTION_EXPRESSION;
export class FunctionExpression extends ParseTree {
  /**
   * @param {SourceRange} location
   * @param {BindingIdentifier} name
   * @param {boolean} isGenerator
   * @param {FormalParameterList} formalParameterList
   * @param {ParseTree} typeAnnotation
   * @param {FunctionBody} functionBody
   */
  constructor(location, name, isGenerator, formalParameterList, typeAnnotation, functionBody) {
    this.location = location;
    this.children = [
      null,  // Token "function"
      isGenerator,
      name,
      null,  // Token "("
      formalParameterList,
      null,  // Token ")"
      typeAnnotation,
      functionBody
    ];
  }

  /**
   * @param {ParseTreeTransformer} transformer
   */
  transform(transformer) {
    return transformer.transformFunctionExpression(this);
  }

  /**
   * @param {ParseTreeVisitor} visitor
   */
  visit(visitor) {
    visitor.visitFunctionExpression(this);
  }

  /**
   * @type {ParseTreeType}
   */
  get type() {
    return FUNCTION_EXPRESSION;
  }

  get isGenerator() {
    return this.children[1];
  }

  get name() {
    return this.children[2];
  }

  get formalParameterList() {
    return this.children[4];
  }

  get typeAnnotation() {
    return this.children[6];
  }

  get functionBody() {
    return this.children[7];
  }
}