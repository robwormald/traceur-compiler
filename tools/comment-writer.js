// var fs = require('fs');
var System = require('../src/node/System');

System.baseURL = __filename;
System.import('./CommentWriter').then(function(m) {
  process.exit(0);
}).catch(function(err) {
  console.error(err);
  process.exit(1);
});
