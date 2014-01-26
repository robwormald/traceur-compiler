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

import {FallThroughState} from './FallThroughState';
import {State} from './State';
import {assert} from '../../util/assert';

import {
  createBlock,
  createIfStatement
} from '../ParseTreeFactory';

export class ConditionalState extends State {
  /**
   * @param {number} id
   * @param {number} ifState
   * @param {number} elseState
   * @param {ParseTree} condition
   * @param {Array.<ParseTree>} statements
   */
  constructor(id, ifState, elseState, condition, statements = []) {
    super(id);
    this.statements = statements;
    this.ifState = ifState;
    this.elseState = elseState;
    this.condition = condition;
  }

  /**
   * Represents the dispatch portion of an if/else block.
   * ConditionalStates are immutable.
   *
   * @param {number} oldState
   * @param {number} newState
   * @return {ConditionalState}
   */
  replaceState(oldState, newState) {
    return new ConditionalState(
        State.replaceStateId(this.id, oldState, newState),
        State.replaceStateId(this.ifState, oldState, newState),
        State.replaceStateId(this.elseState, oldState, newState),
        this.condition,
        this.statements);
  }

  /**
   * @param {FinallyState} enclosingFinally
   * @param {number} machineEndState
   * @param {ErrorReporter} reporter
   * @return {Array.<ParseTree>}
   */
  transform(enclosingFinally, machineEndState, reporter) {
    return [
      ...this.statements,
      createIfStatement(this.condition,
          createBlock(State.generateJump(enclosingFinally, this.ifState)),
          createBlock(State.generateJump(enclosingFinally, this.elseState)))];
  }

  getDestinations() {
    return [this.ifState, this.elseState];
  }

  reverseMerge(first) {
    return new ConditionalState(first.id,
        this.ifState, this.elseState, this.condition,
        [...first.statements, ...this.statements]);
  }
}
