'use strict';

let fs = require('fs');

let testName = process.argv[2];
let testContent = fs.readFileSync(testName, 'utf-8');

let srcName = process.argv[3];
let srcContent = fs.readFileSync(srcName, 'utf-8');

let print = s => process.stdout.write(String(s));

print(`
const data = {
  name: ${JSON.stringify(testName)},
  contents: ${JSON.stringify(testContent)}
};
`);
print(srcContent);
