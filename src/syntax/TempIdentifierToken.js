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

import {Token} from './Token.js';
import {TEMP_IDENTIFIER} from './TokenType.js';

/**
 * A token representing an identifier.
 */
export class TempIdentifierToken extends Token {
  /**
   * @param {SourceRange} location
   * @param {string} value
   */
  constructor(location, value, preferredName) {
    super(TEMP_IDENTIFIER, location);
    this.value = value;
    this.preferredName = preferredName;
  }

  toString() {
    return this.value;
  }
}
// 
// let counter = Math.random() * 1e6 | 0;
//
// export function createTempIdentifierToken(origToken = undefined) {
//   let location = null, value = '_ref';
//   if (origToken !== undefined) {
//     ({location, value} = origToken);
//   }
//   let name = `_t${counter++}`;
//   return new TempIdentifierToken(location, name, value);
// }
