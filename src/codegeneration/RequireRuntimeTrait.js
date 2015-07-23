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

import {CONST, VAR} from '../syntax/TokenType.js';
import {Script} from '../syntax/trees/ParseTrees.js';
import {StringSet} from '../util/StringSet.js';
import {
  createBindingIdentifier,
  createIdentifierExpression,
  createMemberExpression,
  createStringLiteral,
  createVariableStatement,
} from './ParseTreeFactory.js';
import {parseExpression} from './PlaceholderParser.js';
import {prependStatements} from './PrependStatements.js';

function toTempName(name) {
  return `$__${name}`;
}

function getDeclarationType(options) {
  return options.parseOptions.blockBinding &&
      !options.transformOptions.blockBinding ? CONST : VAR;
}

export default function RequireRuntimeTrait(ParseTreeTransformerClass) {
  return class extends ParseTreeTransformerClass {
    constructor(...args) {
      super(...args);
      this.requiredNames_ = new StringSet();
    }

    getRuntimeExpression(name) {
      if (this.options.requireRuntime) {
        this.requiredNames_.add(name);
        return createIdentifierExpression(toTempName(name));
      }
      return createMemberExpression('$traceurRuntime', name);
    }

    transformScript(tree) {
      let transformed = super.transformScript(tree);
      if (tree === transformed) {
        return tree;
      }

      let scriptItemList = transformed.scriptItemList;

      if (this.options.requireRuntime) {
        var requires = this.requiredNames_.valuesAsArray().map((name) => {
          let moduleId = createStringLiteral(`traceur/runtime/${name}`);
          let require = parseExpression `require(${moduleId}).default`;
          let declarationType = getDeclarationType(this.options);
          return createVariableStatement(
              declarationType, toTempName(name), require);
        });
        scriptItemList = prependStatements(scriptItemList, ...requires);
      }

      return new Script(tree.location, scriptItemList, tree.moduleName);
    }
  }
}
