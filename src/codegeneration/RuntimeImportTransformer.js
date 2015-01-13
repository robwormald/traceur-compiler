// Copyright 2014 Traceur Authors.
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
  createBindingIdentifier,
  createStringLiteralToken
} from './ParseTreeFactory.js';
import {ParseTreeTransformer} from './ParseTreeTransformer.js';
import {ParseTreeVisitor} from '../syntax/ParseTreeVisitor.js';
import {
  ImportedBinding,
  ImportDeclaration,
  Module,
  ModuleSpecifier
} from '../syntax/trees/ParseTrees.js';

export class RuntimeImportTransformer extends ParseTreeTransformer {
  constructor(transformOptions) {
    // TODO(arv): Pass options and get the transformOptions off of that.
    this.transformOptions_ = transformOptions;
  }

  transformScript(tree) {
    // Script cannot contain import statements
    return tree;
  }

  transformModule(tree) {
    if (this.transformOptions_.modules !== 'amd' &&
        this.transformOptions_.modules !== 'commonjs') {
      return tree;
    }

    var visitor = new FindRuntimeDependencies(this.transformOptions_);
    visitor.visitAny(tree);
    var runtimeFunctions = visitor.runtimeFunctions;

    var statements = Object.keys(runtimeFunctions).map((name) => {
      var runtimeName = `$traceurRuntime_${name}`;
      var binding = createBindingIdentifier(runtimeName);
      var importClause = new ImportedBinding(null, binding);
      var stringToken = createStringLiteralToken(`traceur-runtime:${name}`);
      var moduleSpecifier = new ModuleSpecifier(null, stringToken);
      return new ImportDeclaration(null, importClause, moduleSpecifier);
    });

    if (statements.length === 0) {
      return tree;
    }

    statements.push(...tree.scriptItemList);
    return new Module(tree.location, statements, tree.moduleName);
  }
}

class FindRuntimeDependencies extends ParseTreeVisitor {
  constructor(transformOptions) {
    // TODO(arv): Pass options and get the transformOptions off of that.
    this.transformOptions_ = transformOptions;
    this.runtimeFunctions = Object.create(null);
  }

  visitClassDeclaration(tree) {
    this.runtimeFunctions['createClass'] = true;
    super.visitClassDeclaration(tree);
  }
  visitClassExpression(tree) {
    this.runtimeFunctions['createClass'] = true;
    super.visitClassExpression(tree);
  }
}