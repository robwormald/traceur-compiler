// Options: --types --type-assertions --type-assertion-module=./resources/assert

var a : Array = [];
var b : Array<number> = [];
var c : Array<number> = [0];
var d : Array<number> = [1, 2];

assert.throw(() => {
  var a : Array<number> = ['s'];
});
