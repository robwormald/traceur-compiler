rollup --format=iife --output=intermediate.js --name=test -- inlined.js

./traceur --modules=inline \
  --arrow-functions=parse \
  --block-binding=parse \
  --classes=parse \
  --computed-property-names=parse \
  --for-of=parse \
  --generators=parse \
  --numeric-literals=parse \
  --property-methods=parse \
  --property-name-shorthand=parse \
  --spread=parse \
  --symbols=parse \
  --template-literals=parse \
  --out tmp.js --script intermediate.js
  
node build/build-inline-test.js intermediate.js tmp.js > out.js

# rm -f tmp.js
