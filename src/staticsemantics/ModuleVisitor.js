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

import {ParseTreeVisitor} from '../syntax/ParseTreeVisitor';
import {
  MODULE_DECLARATION,
  EXPORT_DECLARATION,
  IMPORT_DECLARATION
} from '../syntax/trees/ParseTreeType';

/**
 * A specialized parse tree visitor for use with modules.
 */
export class ModuleVisitor extends ParseTreeVisitor {

  // ExportDeclaration can contain large trees. Limit the scope of this visitor.
  // This list does not have to be complete. It is purely an optimization to
  // reduce the search scope.
  visitArrayComprehension(tree) {}
  visitArrayLiteral(tree) {}
  visitBlock(tree) {}
  visitClassDeclaration(tree) {}
  visitClassExpression(tree) {}
  visitFunctionBody(tree) {}
  visitFunctionDeclaration(tree) {}
  visitFunctionExpression(tree) {}
  visitGeneratorComprehension(tree) {}
  visitObjectLiteral(tree) {}

  visitModuleElement_(element) {
    switch (element.type) {
      case EXPORT_DECLARATION:
      case IMPORT_DECLARATION:
      case MODULE_DECLARATION:
        this.visitAny(element);
    }
  }

  visitScript(tree) {
    tree.scriptItemList.forEach(this.visitModuleElement_, this);
  }

  visitModule(tree) {
    tree.scriptItemList.forEach(this.visitModuleElement_, this);
  }
}
