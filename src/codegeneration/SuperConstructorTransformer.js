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

import {TempVarTransformer} from './TempVarTransformer.js';
import {ParenTrait} from './ParenTrait.js';
import {parseExpression} from './PlaceholderParser.js';
import {SUPER_EXPRESSION} from '../syntax/trees/ParseTreeType.js';

/**
 * Transforms a derived constructor to enforce that this has been initialized.
 *

constructor() {
  super(x);
  this.x;
  if (false) return;
  return 42;
}

=>

constructor() {
  var $this;
  function $getThis() { return $this || $traceurRuntime.throwSuperError(); }
  $this = $traceurRuntime.superCall(C, $this, x);
  $getThis().x;
  if (false) return $traceurRuntime.exitDerivedConstructor($this);
  return 42;
  return $traceurRuntime.exitDerivedConstructor($this);
}


 */
export class SuperConstructorTransformer extends ParenTrait(TempVarTransformer) {
  constructor(identifierGenerator, reporter, options) {
    super(identifierGenerator, reporter, options);
  }

  transformCallExpression(tree) {
    if (tree.operand.type !== SUPER_EXPRESSION) {
      return super.transformCallExpression(tree);
    }

    let tempName = this.addTempVar();
    let getThisNameFunction = parseExpression `function() {
      return ${tempName} || $traceurRuntime.throwUninitializedThis();
    }`;
    this.getThisName_ = this.addTempVar(getThisNameFunction);
    return parseExpression
        `${tempName} = $traceurRuntime.superCall(C, ${tempName})`;
  }

  // transformPropertyMethodAssignment(tree) {
  //
  //
  // }



  transformFunctionExpression(tree) { return tree; }
  transformFunctionDeclaration(tree) { return tree; }

  transformThisExpression(tree) {
    return parseExpression `${this.getThisName_}()`;
  }
}
