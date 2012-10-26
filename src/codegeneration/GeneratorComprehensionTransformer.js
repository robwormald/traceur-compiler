// Copyright 2012 Google Inc.
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

import ComprehensionTransformer from 'ComprehensionTransformer.js';
import createObject from '../util/util.js';
import createYieldStatement from 'ParseTreeFactory.js';

/**
 * Generator Comprehension Transformer:
 *
 * The desugaring is defined at
 * http://wiki.ecmascript.org/doku.php?id=harmony:generator_expressions#translation
 * as something like this:
 *
 * ( Expression0 for LHSExpression1 of Expression1 ...
 *               for LHSExpressionn of Expressionn if ( Expression )opt )
 *
 * =>
 *
 * (function () {
 *     for (let LHSExpression1 of Expression1 ) {
 *         ...
 *         for (let LHSExpressionn of Expressionn ) {
 *             if ( Expression )opt
 *                 yield (Expression0);
 *             }
 *         }
 *     }
 * })()
 *
 * with alpha renaming of this and arguments of course.
 */
export class GeneratorComprehensionTransformer extends
    ComprehensionTransformer {

  transformGeneratorComprehension(tree) {
    var expression = this.transformAny(tree.expression);
    var statement = createYieldStatement(expression);
    var isGenerator = true;
    return this.transformComprehension(tree, statement, isGenerator);
  }
}

/**
 * @param {UniqueIdentifierGenerator} identifierGenerator
 * @param {ParseTree} tree
 * @return {ParseTree}
 */
GeneratorComprehensionTransformer.transformTree =
    function(identifierGenerator, tree) {
  return new GeneratorComprehensionTransformer(identifierGenerator).
      transformAny(tree);
};