// Copyright 2015 Traceur Authors.
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

function spawn(gen) {
  return new Promise((resolve, reject) => {
    gen = gen();  // this and arguments have been alpha renamed.
    function step2(m, v) {
      let res;
      try {
        res = gen[m](v);
      } catch (ex) {
        reject(ex);
        return;
      }
      if (res.done) {
        resolve(res.value);
      } else {
        Promise.resolve(v).then(
            v => { step2('next', v); },
            err => { step2('throw', err); });
      }
    }
    step2('next', undefined);
  });
}

$traceurRuntime.spawn = spawn;
