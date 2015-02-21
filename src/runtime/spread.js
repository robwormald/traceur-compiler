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

function spread() {
  var rv = [], j = 0, iterResult;

  for (var i = 0; i < arguments.length; i++) {
    var valueToSpread = $traceurRuntime.checkObjectCoercible(arguments[i]);

    if (typeof valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)] !== 'function') {
      throw new TypeError('Cannot spread non-iterable object.');
    }

    var iter = valueToSpread[$traceurRuntime.toProperty(Symbol.iterator)]();
    while (!(iterResult = iter.next()).done) {
      rv[j++] = iterResult.value;
    }
  }

  return rv;
}


// f(a, b, ...cs, d, ...es, f)
//
// f.apply((void 0), $traceurRuntime.spread(7, a, b, cs, d, es, f, 3, 5));
unction spread2(spreadIndex) {
  var rv = [];
  var j = 0;
  var endIndex = spreadIndex;
  var length = arguments.length;
  for (var i = 1; i < endIndex; i++) {
    var spread = spreadIndex === length ? endIndex : arguments[spreadIndex];
    for (; i < spread; i++) {
      rv[j++] = arguments[i];
    }

    if (spreadIndex++ === length) break
    var valueToSpread = arguments[i];
    var iter = valueToSpread[Symbol.iterator]();
    while (!(iterResult = iter.next()).done) {
      rv[j++] = iterResult.value;
    }
  }
  return rv;
}

$traceurRuntime.spread = spread;
