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

import {
  FunctionBody,
  FunctionDeclaration,
  FunctionExpression,
  Method,
  YieldExpression
} from '../syntax/trees/ParseTrees.js';
import {ParenTrait} from './ParenTrait.js';
import {parseStatement} from './PlaceholderParser.js';
import {STAR} from '../syntax/TokenType.js';
import {TempVarTransformer} from './TempVarTransformer.js';
import alphaRenameThisAndArguments from './alphaRenameThisAndArguments.js';

export class AsyncToGeneratorTransformer extends ParenTrait(TempVarTransformer) {
  constructor(identifierGenerator, reporter, options) {
    super(identifierGenerator, reporter, options);
    this.inAsyncFunction_ = false;
  }

  transformFunctionDeclaration(tree) {
    if (tree.isAsyncFunction()) {
      return this.transformFunctionShared_(tree, FunctionDeclaration);
    }
    return super.transformFunctionDeclaration(tree);
  }

  transformFunctionExpression(tree) {
    if (tree.isAsyncFunction()) {
      return this.transformFunctionShared_(tree, FunctionExpression);
    }
    return super.transformFunctionDeclaration(tree);
  }

  transformFunctionShared_(tree, ctor) {
    let parameterList = this.transformAny(tree.parameterList);
    let typeAnnotation = this.transformAny(tree.typeAnnotation);
    let annotations = this.transformList(tree.annotations);
    let inAsyncFunction = this.inAsyncFunction_;
    let body = this.transformAsyncBody_(tree.body);
    return new ctor(tree.location, tree.name, null,
        parameterList, typeAnnotation, annotations, body);
  }

  transformAsyncBody_(body) {
    let inAsyncFunction = this.inAsyncFunction_;
    this.inAsyncFunction_ = true;
    body = alphaRenameThisAndArguments(this, body);
    body = this.transformAny(body);
    body = wrapBodyInSpawn(body);
    this.inAsyncFunction_ = inAsyncFunction;
    return body;
  }

  transformMethod(tree) {
    if (tree.isAsyncFunction()) {
      let name = this.transformAny(tree.name);
      let parameterList = this.transformAny(tree.parameterList);
      let typeAnnotation = this.transformAny(tree.typeAnnotation);
      let annotations = this.transformList(tree.annotations);
      let body = this.transformAsyncBody_(tree.body);
      return new Method(tree.location, tree.isStatic, null, name, parameterList,
          typeAnnotation, annotations, body, tree.debugName);
    }
    return super.transformMethod(tree);
  }

  transformAwaitExpression(tree) {
    if (this.inAsyncFunction_) {
      return new YieldExpression(tree.location, tree.expression, false);
    }
    return super.transformAwaitExpression(tree);
  }
}

function wrapBodyInSpawn(body) {
  let statement = parseStatement
      `return $traceurRuntime.spawn(function*() { ${body} });`
  return new FunctionBody(body.location, [statement])
}
