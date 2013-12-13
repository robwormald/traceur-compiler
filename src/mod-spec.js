// Copyright 2013 Traceur Authors.
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

'use strict';

import {ArrayMap} from './util/ArrayMap';
import {SyntaxErrorReporter} from './util/SyntaxErrorReporter';
import {Parser} from './syntax/Parser';
import {Promise} from './runtime/polyfills/Promise';
import {SourceFile} from './syntax/SourceFile';

import moduleRequests from './staticsemantics/moduleRequests';

function LoadRecord(name) {
  this.name = name;
  this.status = 'loading';
  this.linkSets = [];
  this.metadata = {};
  this.address = undefined;
  this.source = undefined;
  this.kind = undefined;
  this.body = undefined;
  this.execute = undefined;
  this.exception = undefined;
  this.module = undefined;
}

// 1.1.1.1
function CreateLoad(name) {
  return new LoadRecord(name);
}

// 1.1.1.2
// With [[Load]]
function LoadFailed(ex) {
  var load = TODO
  console.assert(load === 'loading');
  load.exception = ex;
  var linkSets = load.linkSets.slice();
  for (var i = 0; i < linkSets.length; i++) {
    LinkSetFailed(linkSets[i], ex);
  }
  console.assert(load.linkSets.length === 0);
}

// 1.1.1.3
function RequestLoad(loader, request, refererName, refererAddress) {
  var f = createCallNormalizeFunction(loader, request, refererName,
                                      refererAddress);
  var p = new Promise(f);
  var g = createGetOrCreateLoad(loader);
  p.then(g);
  return p;
}

// 1.1.1.4
function createCallNormalizeFunction(loader, request, refererName,
                                     refererAddress) {
  return function(resolve) {
    var name = loader.normalize(request, refererName, refererAddress);
    resolve(name);
  };
}

function arrayFind(array, predicate) {
  for (var i = 0; i < array.length; i++) {
    if (predicate(array[i]))
      return array[i];
  }
  return undefined;
}

// 1.1.1.5
function createGetOrCreateLoad(loader) {
  return function(name) {
    name = String(name);
    var existingModule = arrayFind(loader.modules, (r) => r.key === name);
    if (existingModule) {
      var load = CreateLoad(name);
      load.status = 'linked';
      load.module = existingModule;
      return load;
    }

    var load = arrayFind(loader.loads, (r) => r.name === name);
    if (load) {
      console.assert(load.status === 'loading' || load.status === 'loaded');
      return load;
    }
    load = CreateLoad(name);
    loader.loads.push(load);
    ProceedToLocate(loader, load);
    return load;
  };
}

// 1.1.1.6
function ProceedToLocate(loader, load, p) {
  var p = Promise.resolve(undefined);
  var f = createCallLocate(loader, load);
  p.then(f);
  return ProceedToFetch(loader, load, p);
}

// 1.1.1.10
function createCallLocate(loader, load) {
  return function(resolve, reject) {
    return loader.locate({
      name: load.name,
      metadata: load.metadata
    });
  };
}

// 1.1.1.7
function ProceedToFetch(loader, load, p) {
  var f = createCallFetch(loader, load, p);
  p.then(f);
  return ProceedToTranslate(loader, load, p);
}

// 1.1.1.11
function createCallFetch(loader, load) {
  return function(adress) {
    if (load.linkSets.length === 0)
      return undefined;
    load.address = address;
    return loader.fetch({
      name: load.name,
      metadata: load.metadata,
      address: address
    });
  }
};

// 1.1.1.8
function ProceedToTranslate(loader, load, p) {
  var f = createCallTranslate(loader, load);
  p = p.then(f);
  f = createCallInstantiate(loader, load);
  p = p.then(f);
  f = createInstantiateSucceeded(loader, load);
  p = p.then(f);
  f = createLoadFailed(load);
  p = p.catch(f);
}

function createCallTranslate(loader, load) {
  return function(source) {
    if (load.linkSets.length === 0)
      return undefined;
    return loader.translate({
      name: load.name,
      metadata: load.metadata,
      address: load.address,
      source: source
    });
  };
}

function createCallInstantiate(loader, load) {
  return function(source) {
    if (load.linkSets.length === 0)
      return undefined;
    load.source = source;
    return loader.instantiate({
      name: load.name,
      metadata: load.metadata,
      address: load.address,
      source: source
    });
  };
}

function createInstantiateSucceeded(loader, load) {
  return function(instantiateResult) {
    if (load.linkSets.length === 0)
      return undefined;

    var depsList;

    if (instantiateResult === undefined) {
      var errorReporter = new SyntaxErrorReporter();
      var sourceFile = new SourceFile(load.name, load.source);
      var parser = new Parser(errorReporter, sourceFile)
      var body = parser.parseModule();
      load.body = body;
      load.kind = 'declarative';
      depsList = moduleRequests(body);
    } else if (typeof instantiateResult === 'object') {
      depsList = instantiateResult.deps;
      if (!depsList)
        depsList = [];
      // else IterableToArray
      load.execute = instantiateResult.execute;
      load.kind = 'dynamic'
    } else {
      throw new TypeError();
    }

    return ProcessLoadDependencies(load, loader, depsList);
  };
}

function createLoadFailed(load) {
  return function(TODO) {
    TODO
  };
}

// 1.1.1.9
function SimpleDefine(obj, name, value) {
  return Object.defineOwnProperty(obj, name, {
    value: value,
    configurable: true,
    enumerable: true,
    writable: true
  });
}

// 1.1.1.15
function ProcessLoadDependencies(load, loader, depsList) {
  debugger; // Check what load is!

  var refererName = load.name;
  // TODO(arv): SPEC_BUG? load was a LoadRecord and not a Module
  load.dependencies = [];
  var loadPromises = [];
  var p, f;
  for (var i = 0; i < depsList.length; i++) {
    var request = depsList[i];
    p = RequestLoad(loader, request, refererName, load.address);
    f = createAddDependencyLoad(load, request);
    p = p.then(f);
    loadPromises.push(p);
  }
  p = Promise.all(loadPromises);
  f = createLoadSucceeded(load);
  return p.then(f);
}

// 1.1.1.16
function createAddDependencyLoad(parentLoad, request) {
  return function AddDependencyLoad(depLoad) {
    for (var i = 0; i < parentLoad.dependencies.length; i++) {
      console.assert(parentLoad.dependencies[i].key !== request);
    }
    parentLoad.dependencies.push({key: request, value: depLoad.name});
    if (depLoad.status !== 'linked') {
      var linkSets = parentLoad.linkSets.slice();
      for (var i = 0; i < linkSets.length; i++) {
        AddLoadToLinkSet(linkSets[i], depLoad);
      }
    }
  };
}

// 1.1.1.17
function createLoadSucceeded(load) {
  return function LoadSucceeded() {
    console.assert(load.status === 'loading');
    load.status = 'loaded';
    var linkSets = load.linkSets.slice();
    // TODO(arv): This should be in creation order. Might be different from
    // insertion order to the list?
    for (var i = 0; i < linkSets.length; i++) {
        UpdateLinkSetOnLoad(linkSets[i], load);
      }
  };
}

// 1.1.2
function LinkSetRecord() {
  this.loader = undefined;
  this.loads = undefined;
  this.done = undefined;
  this.resolve = undefined;
  this.reject = undefined;
}

// 1.1.2.1
function CreateLinkSet(loader, startingLoad) {
  // TODO(arv): Funcion is an Object.
  if (!loader || typeof loader !== 'object')
    throw new TypeError();
  // if loader is not a Loader Instance throw new TypeError()

  var linkSet = new LinkSetRecord();
  linkSet.loader = loader;
  linkSet.loads = [];
  linkSet.done = new Promise((resolve, reject) => {
    linkSet.resolve = resolve;
    linkSet.reject = reject;
  });
  AddLoadToLinkSet(linkSet, startingLoad);
  return linkSet;
}

// 1.1.2.2
function AddLoadToLinkSet(linkSet, load) {
  console.assert(load.status === 'loading' || load.status === 'loaded');
  var loader = linkSet.loader;
  if (linkSet.loads.indexOf(load) === -1) {
    linkSet.loads.push(load);
    load.linkSets.push(linkSet);
    if (load.status === 'loaded') {
      for (var i = 0; i < load.dependencies.length; i++) {
        var name = load.dependencies[i];
        if (!arrayFind(loader.modules, (r) => r.key === name)) {
          var depLoad = arrayFind(loader.loads, (r) => r.name === name);
          if (depLoad)
            AddLoadToLinkSet(linkSet, depLoad);
        }
      }
    }
  }
}

// 1.1.2.3
function UpdateLinkSetOnLoad(linkSet, load) {
  console.assert(linkSet.loads.indexOf(load) !== -1);
  console.assert(load.status === 'loaded' || load.status === 'linked');
  for (var i = 0; i < linkSet.loads.length; i++) {
    if (linkSet.loads[i].status === 'loading')
      return;
  }
  var startingLoad = linkSet.loads[0];
  var status;
  try {
    Link(linkSet.loads, linkSet.loader);
  } catch (ex) {
    LinkSetFailed(linkSet, ex);
    return;
  }
  console.assert(linkSet.loads.length === 0);
  (0, linkSet.resolve)(startingLoad);
}

// 1.1.2.4
function LinkSetFailed(linkSet, ex) {
  var loader = linkSet.loader;
  var loads = linkSet.loads.slice();
  for (var i = 0; i < loads.length; i++) {
    var load = loads[i];
    var index = load.linkSets.indexOf(linkSet);
    console.assert(index !== -1);
    load.linkSets.splice(index, 1);
    if (load.linkSets.length === 0 &&
        (index = loader.loads.indexOf(load)) !== -1) {
      loader.loads.splice(index, 1);
    }
  }
  (0, linkSet.reject)(ex);
}

// 1.1.2.5
function FinishLoad(loader, load) {
  var name = load.name;
  if (name !== undefined) {
    console.assert(!arrayFind(loader.modules, (r) => r.key === name));
    loader.modules.push({
      key: name,
      value: load.module
    });
  }
  var index;
  if ((index = loader.loads.indexOf(load)) !== -1)
    loader.loads.splice(index, 1);
  for (var i = 0; i < load.linkSets.length; i++) {
    index = linkSet.loads.indexOf(load);
    linkSet.loads.splice(index, 1);
  }
  load.linkSets.length = 0;
}

// 1.1.2.6
function LoadModule(loader, name, options) {
  name = String(name);
  var address = options.address;
  var step = address === undefined ? 'locate' : 'fetch';
  var metadata = {};
  debugger; // where did source come from?
  var source = TODO
  var f = createAsyncStartLoadPartwayThrough(loader, name, step,
                                             metadata, source, address);
  return new Prmoise(f);
}

// 1.1.3
function createAsyncStartLoadPartwayThrough(loader, name, step,
                                            metadata, source, address) {
  return function AsyncStartLoadPartwayThrough(resolve, reject) {
    if (arrayFind(loader.modules, (r) => r.key === name))
      throw new TypeError();
    if (arrayFind(loader.loads, (r) => r.name === name))
      throw new TypeError();
    var load = CreateLoad(name);
    load.metadata = metadata;
    var linkSet = CreateLinkSet(loader, load);
    loader.loads.push(load);
    resolve(linkSet.done);
    if (step === 'locate') {
      ProceedToLocate(loader, load);
    } else if (step === 'fetch') {
      var addressPromise = Promise.cast(address);
      ProceedToFetch(loader, load, addressPromise);
    } else {
      console.assert(step === 'translate');
      load.address = address;
      var sourcePromise = Promise.cast(source);
      ProceedToTranslate(loader, load, sourcePromise);
    }
  };
}

// 1.1.4
function createEvaluateLoadedModule(loader, load) {
  return function EvaluateLoadedModule() {
    debugger;
    console.assert(load.status === 'linked');
    var module = load.module;
    // TODO(arv): Use a set for seen.
    EnsureEvaluated(module, [], loader);
    return module;
  };
}

function evaluateBody(body) {
  // TODO(arv): Implement
  console.log(body);
}

// 1.3.1
function EnsureEvaluated(mod, seen, loader) {
  seen.push(mod);
  var deps = mod.dependencies;
  for (var i = 0; i < deps.length; i++) {
    var dep = deps[i].value;
    if (seen.indexOf(dep) === -1)
      EnsureEvaluated(dep, seen, loader);
  }
  // TODO(arv): Initialize [[Evaluated]] to false somewhere.
  if (mod.body !== undefined && !mod.evaluated) {
    mod.evaluated = true;
    return evaluateBody(mod.body);
  }
}

// 1.6.1
function GetOption(options, name) {
  if (options === undefined)
    return undefined;
  // TODO(arv): Use isObject
  if (options == null || typeof options !== 'object')
    throw new TypeError();
  return options[name];
}

var hooks = ['normalize', 'locate', 'fetch', 'translate', 'instantiate'];

class Loader {

  constructor(options) {
    var loader = this;
    // If Type(loader) is not Object, throw a TypeError exception.

    // If loader does not have all of the internal properties of a Loader
    // Instance, throw a TypeError exception

    // If loader.[[Modules]] is not undefined, throw a TypeError exception.

    // If Type(options) is not Object, throw a TypeError exception.

    // Ignore realm stuff for now.

    for (var i = 0; i < hooks.length; i++) {
      var name = hooks[i];
      var hook = options[name];
      if (hook !== undefined)
        SimpleDefine(loader, name, hook);
    }

    // TODO(arv): Rename these two to make them "private"
    loader.modules = [];
    loader.loads = [];
  }

  // 1.6.3.3
  define(name, source, options = undefined) {
    var loader = this;
    name = String(name);
    var address = GetOption(options, 'address');
    var metadata = GetOption(options, 'metadata') || {};
    var f = createAsyncStartLoadPartwayThrough(this, name, 'translate',
                                               metadata, source, address);
    var p = new Promise(f);
    var g = () => undefined;
    return p.then(g);
  }

  // 1.6.3.5
  load(request, options = undefined) {
    var loader = this;
    var p = LoadModule(loader, name, options);
    var f = () => undefined;
    return p.then(f);
  }

  // 1.6.3.6
  module(source, options) {
    var loader = this;
    var address = GetOption(options, 'address');
    var load = CreateLoad(undefined);
    load.address = address;
    var linkSet = CreateLinkSet(loader, load);
    var successCallback = createEvaluateLoadedModule(loader, load);
    var p = linkSet.done.then(successCallback);
    var sourcePromise = Promise.cast(source);
    ProceedToTranslate(loader, load, sourcePromise);
    return p;
  }

  // 1.6.3.7
  import(name, options) {
    var loader = this;
    var p = LoadModule(loader, name, options);
    // TODO(arv): What about load?
    var f = createEvaluateLoadedModule(loader);
    return p.then(f);
  }

  // 1.6.3.8
  eval(source) {
    // TODO(arv): Transform Script.
    var loader = this;
    (0, eval)(source);
  }

  // 1.6.3.9
  get(name) {
    var loader = this;
    name = String(name);
    for (var i = 0; i < loader.modules.length; i++) {
      var p = loader.modules[i];
      if (p.key === name) {
        var module = p.value;
        // TODO(arv): Use a set for seen.
        EnsureEvaluated(module, [], loader);
        return p.value;  // p is mutated
      }
    }
    return undefined;
  }

  // 1.6.3.10
  has(name) {
    var loader = this;
    name = String(name);
    for (var i = 0; i < loader.modules.length; i++) {
      if (p.key === name)
        return true;
    }
    return false;
  }

  // 1.6.3.11
  set(name, module) {
    var loader = this;
    name = String(name);
    // If module does not have all the internal slots of a Module instance,
    // throw a TypeError exception.
    for (var i = 0; i < loader.modules.length; i++) {
      if (p.key === name) {
        p.value = module;
        return loader;
      }
    }
    loader.modules.push({
      key: name,
      value: module
    });
    return loader;
  }

  // 1.6.3.12
  delete(name) {
    throw Error('Not Implemented');
  }

  // 1.6.3.13
  entries() {
    throw Error('Not Implemented');
  }

  // 1.6.3.14
  keys() {
    throw Error('Not Implemented');
  }

  // 1.6.3.15
  values() {
    throw Error('Not Implemented');
  }

  // 1.6.3.16
  normalize(name, refererName, refererAddress) {
    return name;
  }

  // 1.6.3.17
  locate(load) {
    return load.name;
  }

  // 1.6.3.18
  fetch(load) {
    throw new TypeError();
  }

  // 1.6.3.19
  translate(load) {
    return load.source;
  }

  // 1.6.3.20
  instantiate(load) {
    return undefined;
  }

  // 1.6.3.21
  // [@@iterator] () { }
}


function CreateUnlinkedModuleInstance(body, boundNames, knownExports,
    unknownExports, imports) {
  var m = Object.create(null);
  m.body = body;
  m.boundNames = boundNames;
  m.knownExportEntries = knownExports;
  m.unknownExportEntries = unknownExports;
  m.exportDefinitions = undefined;
  m.exports = undefined;
  m.dependencies = undefined;
  m.unlinkedDependencies = undefined;
  m.importEntries = imports;
  m.importDefinitions = undefined;
  m.linkErrors = [];
  return m;
}

function LookupModuleDependency(m, requestName) {
  if (requestName === null)
    return m;
  var pair = arrayFind(m.dependencies, (r) => r.key === requestName);
  return pair.module;
}

function LookupExport(m, exportName) {
  var exp = arrayFind(m.exports, (r) => r.exportName === exportName);
  if (!exp)
    return undefined;
  return exp.binding;
}

function ResolveExportEntries(m, visited) {
  if (m.exportDefinitions !== undefined)
    return m.exportDefinitions;
  var defs = [];
  var boundNames = m.boundNames;
  for (var i = 0; i < m.knownExportEntries.length; i++) {
    var entry = m.knownExportEntries[i];
    var modReq = entry.moduleRequests;
    var otherMod = LookupModuleDependency(m, modReq);
    if (entry.module === null && entry.localName !== null &&
        boundNames.indexOf(entry.localName) === -1) {
      var error = new ReferenceError();
      m.linkErrors.push(error);
    }
    defs.push({
      module: otherMod,
      importName: entry.importName,
      localName: entry.localName,
      exportName: entry.exportName,
      explicit: true
    });
  }
  for (var i = 0; i < m.unknownExportEntries.length; i++) {
    var modReq = m.unknownExportEntries[i];
    var otherMod = LookupModuleDependency(m, modReq);
    if (visited.indexOf(otherMod) !== -1) {
      var error = new SyntaxError();
      m.linkErrors.push(error);
    } else {
      visited.push(otherMod);
      var otherDefs = ResolveExportEntries(otherMod, visited);
      for (var j = 0; j < otherDefs.length; j++) {
        var def = otherDefs[j];
        defs.push({
          module: otherMod,
          importName: def.exportName,
          localName: null,
          exportName: def.exportName,
          explicit: false
        });
      }
    }
  }
  m.exportDefinitions = defs;
  return defs;
}

function ResolveExports(m) {
  for (var i = 0; i < m.exportDefinitions.length; i++) {
    var def = m.exportDefinitions[i];
    ResolveExport(m, def.exportName, []);
  };
}

function ResolveExport(m, exportName, visited) {
  var exports = m.exports;
  var exp = arrayFind(exports, (r) => r.exportName === exportName);
  if (exp)
    return exp.binding;

  var ref = {module: m, exportName: exportName};
  if (arrayFind(visited, (r) => {
    return r.module === ref.module && r.exportName === ref.exportName;
  })) {
    var error = new SyntaxError();
    m.linkErrors.push(error);
    return error;
  }

  var defs = m.exportDefinitions;
  var overlappingDefs = defs.filter((def) => def.exportName === exportName);
  if (overlappingDefs.length === 0) {
    var error = new ReferenceError();
    m.linkErrors.push(error);
    return error;
  }

  var explicitCount = 0;
  for (var i = 0; i < overlappingDefs.length; i++) {
    var def = overlappingDefs[i];
    if (def.explicit)
      explicitCount++;
  }
  if (explicitCount > 1 || overlappingDefs.length > 1 && explicitCount === 0) {
    var error = new SyntaxError();
    m.linkErrors.push(error);
    return error;
  }

  var def = arrayFind(overlappingDefs, (r) => r.explicit);
  if (!def)
    def = overlappingDefs[0];

  if (def.localName !== null) {
    var binding = {module: m, localName: def.localName};
    var exp = {exportName: exportName, binding: binding};
    exports.push(exp);
  }
  visited.push(ref);
  var binding = ResolveExport(def.module, def.importName, visited);
  return binding;
}

function ResolveImportEntries(m) {
  var entries = m.entries;
  var defs = [];
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var modReq = entry.moduleRequests;
    var otherMod = LookupModuleDependency(m, modReq);
    defs.push({
      module: otherMod,
      importName: entry.importName,
      localName: entry.localName
    });
  }
  return defs;
}

function LinkImports(m) {
  // environment...
  var defs = m.importDefinitions;
  for (var i = 0; i < defs.length; i++) {
    var def = defs[i];
    if (def.importName === 'module') {
      // environment related stuff
      throw new Error('Not Implemented');
    } else {
      var binding = ResolveExports(def.module, def.importName, []);
      if (binding === undefined) {
        var error = new ReferenceError();
        m.linkErrors.push(error);
      } else {
        throw new Error('Not Implemented');
        // CreateImportBinding(envRec, def.localName, binding);
      }

    }
  };
}

function LinkDeclarativeModules(loads, loader) {
  var unlinked = [];
  for (var i = 0; i < loads.length; i++) {
    var load = loads[i];
    if (load.status !== 'linked') {
      var body = load.body;
      var boundNames = BoundNames(body);
      var knownExports = KnownExportEntries(body);
      var unknownExports = UnknownExportEntries(body);
      var imports = ImportEntries(body);
      var module = CreateUnlinkedModuleInstance(body, boundNames, knownExports,
                                                unknownExports, imports);
      unlinked.push({module: module, load: load});
    }
  }

  for (var i = 0; i < unlinked.length; i++) {
    var pair = unlinked[i];
    var resolvedDeps = [];
    var unlinkedDeps = [];
    for (var j = 0; j < pair.load.dependencies.length; j++) {
      var dep = pair.load.dependencies[j];
      var requestName = dep.key;
      var normalizedName = dep.value;
      if (arrayFind(loads, (r) => r.name === normalizedName)) {
        if (load.status === 'linked') {
          resolvedDeps.push({key: requestName, value: load.module});
        } else {
          var otherPair = arrayFind(unlinked,
                                    (r) => r.load.name === normalizedName);
          resolvedDeps.push({key: requestName, value: otherPair.module});
          unlinkedDeps.push(otherPair.load);
        }

      // 3.c.iv
      } else {
        var module = LoaderRegistryLookup(loader, normalizedName);
      }
    }
  }


  throw new Error('Not Implemented');
}

function BoundNames(tree) {
  throw new Error('Not Implemented');
}

function KnownExportEntries(tree) {
  throw new Error('Not Implemented');
}

function UnknownExportEntries(tree) {
  throw new Error('Not Implemented');
}

function ImportEntries(tree) {
  throw new Error('Not Implemented');
}


function LinkDynamicModules (loads, loader) {
  throw new Error('Not Implemented');
}

function Link(start, loader) {
  var groups = LinkageGroups(start);
  for (var i = 0; i < groups.length; i++) {
    var group = groups[i];
    if (group.every((el) => el.kind === 'declarative')) {
      LinkDeclarativeModules(group, loader);
    } else {
      LinkDynamicModules(group, loader);
    }
  }
}

function LinkageGroups(start) {
  var g = start;
  if (hasMixedDependencyCycles(g))
    throw new SyntaxError();
  for (var i = 0; i < g.length; i++) {
    var load = g[i];
    var n = largestDependencyGroupCount(g, load);
    load.groupIndex = n;
  }

  var declarativeGroupCount =
      largestGroupIndex(g, (load) => load.kind === 'declarative');
  var declarativeGroups = [];
  for (var i = 0; i < declarativeGroupCount; i++) {
    declarativeGroups[i] = [];
  }

  var dynamicGroupCount =
      largestGroupIndex(g, (load) => load.kind === 'dynamic');
  var dynamicGroups = [];
  for (var i = 0; i < dynamicGroupCount; i++) {
    dynamicGroups[i] = [];
  }

  var visited = [];
  for (var i = 0; i < start.length; i++) {
    var load = start[i];
    BuildLinkageGroups(load, declarativeGroups, dynamicGroups, visited);
  }

  // Step 10
  var groups = [];
  throw new Error('Not Implemented');

  return groups;
}

function hasMixedDependencyCycles(group) {
  // TODO(arv): Implement
  return false;
}

function largestDependencyGroupCount(group, load) {
  // TODO(arv): Implement
  return 0;
}

// TODO(arv): Pass kind instead?
function largestGroupIndex(group, filter) {
  var max = -Infinity;
  for (var i = 0; i < group.length; i++) {
    var load = group[i];
    if (filter(load) && load.groupIndex > max)
      max = load.groupIndex;
  }
  return max;
}

function BuildLinkageGroups(load, declarativeGroups, dynamicGroups, visited) {
  if (arrayFind(visited, (el) => el.name === load.name))
    return;
  visited.push(load);
  for (var i = 0; i < load.unlinkedDependencies.length; i++) {
    var dep = load.unlinkedDependencies[i];
    BuildLinkageGroups(dep, declarativeGroups, dynamicGroups, visited);
  }

  var i = load.groupIndex;
  var groups = load.kind === 'declarative' ? declarativeGroups : dynamicGroups;
  var group = groups[i];
  group.push(load);
}
