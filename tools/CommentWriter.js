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

import {Compiler} from '../src/Compiler';
import {ParseTreeWriter} from '../src/outputgeneration/ParseTreeWriter';
import {
  isWhitespace,
  isLineTerminator
} from '../src/syntax/Scanner';

function getPreceeding(location) {
  var sourcePos = location.start;
  var contents = sourcePos.source.contents;
  var i = sourcePos.offset - 1;
  var currentCharCode = contents.charCodeAt(i);

  function isAtEnd() {
    return i === -1;
  }

  function next() {
    currentCharCode = contents.charCodeAt([i--]);
  }

  function peekWhitespace() {
    return isWhitespace(currentCharCode);
  }

  function skipWhitespace() {
    while (!isAtEnd() && peekWhitespace()) {
      next();
    }
  }

  function skipBlockComment() {
    if (currentCharCode === 47 && contents.charCodeAt(i) === 42) {
      i = contents.lastIndexOf('/*', i);
      if (i !== -1) {
        i -= 2;
      }
    }
  }

  skipWhitespace();
  skipBlockComment();

  return contents.slice(i + 2, sourcePos.offset).trim();
}

class CommentWriter extends ParseTreeWriter {
  visitFunctionDeclaration(tree) {
    if (tree.location) {
      var comment = getPreceeding(tree.location);
      if (comment) {
        this.writeln_();
        this.write_(comment);
        this.writeln_();
      }
    }
    super(tree);
  }
}

var content = `{
  /* comment */
  function f()
  {
    return /* comment */ 42;
  }function g() {}

}`;

var {tree, errors} = new Compiler().stringToTree({content});

var w = new CommentWriter();
w.visitAny(tree);
console.log(w.toString());
