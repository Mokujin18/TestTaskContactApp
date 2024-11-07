(function () {
  'use strict';

  /**
   * @param  {*} arg passed in argument value
   * @param  {string} name name of the argument
   * @param  {string} typename i.e. 'string', 'Function' (value is compared to typeof after lowercasing)
   * @return {void}
   * @throws {TypeError}
   */
  function assertArgumentType(arg, name, typename) {
    const type = typeof arg;
    if (type !== typename.toLowerCase()) {
      throw new TypeError(`The "${name}" argument must be of type ${typename}. Received type ${type}`);
    }
  }

  const FORWARD_SLASH = 47; // '/'
  const BACKWARD_SLASH = 92; // '\\'

  /**
   * Is this [a-zA-Z]?
   * @param  {number}  charCode value from String.charCodeAt()
   * @return {Boolean}          [description]
   */
  function isWindowsDeviceName(charCode) {
    return charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122;
  }

  /**
   * [isAbsolute description]
   * @param  {boolean} isPosix whether this impl is for POSIX or not
   * @param  {string} filepath   input file path
   * @return {Boolean}          [description]
   */
  function isAbsolute(isPosix, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const length = filepath.length;
    // empty string special case
    if (length === 0) {
      return false;
    }
    const firstChar = filepath.charCodeAt(0);
    if (firstChar === FORWARD_SLASH) {
      return true;
    }
    // we already did our checks for posix
    if (isPosix) {
      return false;
    }
    // win32 from here on out
    if (firstChar === BACKWARD_SLASH) {
      return true;
    }
    if (length > 2 && isWindowsDeviceName(firstChar) && filepath.charAt(1) === ':') {
      const thirdChar = filepath.charAt(2);
      return thirdChar === '/' || thirdChar === '\\';
    }
    return false;
  }

  /**
   * [dirname description]
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath   input file path
   * @return {string}            [description]
   */
  function dirname(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const length = filepath.length;
    if (length === 0) {
      return '.';
    }

    // ignore trailing separator
    let fromIndex = length - 1;
    const hadTrailing = filepath.endsWith(separator);
    if (hadTrailing) {
      fromIndex--;
    }
    const foundIndex = filepath.lastIndexOf(separator, fromIndex);
    // no separators
    if (foundIndex === -1) {
      // handle special case of root windows paths
      if (length >= 2 && separator === '\\' && filepath.charAt(1) === ':') {
        const firstChar = filepath.charCodeAt(0);
        if (isWindowsDeviceName(firstChar)) {
          return filepath; // it's a root windows path
        }
      }

      return '.';
    }
    // only found root separator
    if (foundIndex === 0) {
      return separator; // if it was '/', return that
    }
    // Handle special case of '//something'
    if (foundIndex === 1 && separator === '/' && filepath.charAt(0) === '/') {
      return '//';
    }
    return filepath.slice(0, foundIndex);
  }

  /**
   * [extname description]
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath   input file path
   * @return {string}            [description]
   */
  function extname(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const index = filepath.lastIndexOf('.');
    if (index === -1 || index === 0) {
      return '';
    }
    // ignore trailing separator
    let endIndex = filepath.length;
    if (filepath.endsWith(separator)) {
      endIndex--;
    }
    return filepath.slice(index, endIndex);
  }
  function lastIndexWin32Separator(filepath, index) {
    for (let i = index; i >= 0; i--) {
      const char = filepath.charCodeAt(i);
      if (char === BACKWARD_SLASH || char === FORWARD_SLASH) {
        return i;
      }
    }
    return -1;
  }

  /**
   * [basename description]
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath   input file path
   * @param  {string} [ext]      file extension to drop if it exists
   * @return {string}            [description]
   */
  function basename(separator, filepath, ext) {
    assertArgumentType(filepath, 'path', 'string');
    if (ext !== undefined) {
      assertArgumentType(ext, 'ext', 'string');
    }
    const length = filepath.length;
    if (length === 0) {
      return '';
    }
    const isPosix = separator === '/';
    let endIndex = length;
    // drop trailing separator (if there is one)
    const lastCharCode = filepath.charCodeAt(length - 1);
    if (lastCharCode === FORWARD_SLASH || !isPosix && lastCharCode === BACKWARD_SLASH) {
      endIndex--;
    }

    // Find last occurence of separator
    let lastIndex = -1;
    if (isPosix) {
      lastIndex = filepath.lastIndexOf(separator, endIndex - 1);
    } else {
      // On win32, handle *either* separator!
      lastIndex = lastIndexWin32Separator(filepath, endIndex - 1);
      // handle special case of root path like 'C:' or 'C:\\'
      if ((lastIndex === 2 || lastIndex === -1) && filepath.charAt(1) === ':' && isWindowsDeviceName(filepath.charCodeAt(0))) {
        return '';
      }
    }

    // Take from last occurrence of separator to end of string (or beginning to end if not found)
    const base = filepath.slice(lastIndex + 1, endIndex);

    // drop trailing extension (if specified)
    if (ext === undefined) {
      return base;
    }
    return base.endsWith(ext) ? base.slice(0, base.length - ext.length) : base;
  }

  /**
   * The `path.normalize()` method normalizes the given path, resolving '..' and '.' segments.
   *
   * When multiple, sequential path segment separation characters are found (e.g.
   * / on POSIX and either \ or / on Windows), they are replaced by a single
   * instance of the platform-specific path segment separator (/ on POSIX and \
   * on Windows). Trailing separators are preserved.
   *
   * If the path is a zero-length string, '.' is returned, representing the
   * current working directory.
   *
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath  input file path
   * @return {string} [description]
   */
  function normalize(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    if (filepath.length === 0) {
      return '.';
    }

    // Windows can handle '/' or '\\' and both should be turned into separator
    const isWindows = separator === '\\';
    if (isWindows) {
      filepath = filepath.replace(/\//g, separator);
    }
    const hadLeading = filepath.startsWith(separator);
    // On Windows, need to handle UNC paths (\\host-name\\resource\\dir) special to retain leading double backslash
    const isUNC = hadLeading && isWindows && filepath.length > 2 && filepath.charAt(1) === '\\';
    const hadTrailing = filepath.endsWith(separator);
    const parts = filepath.split(separator);
    const result = [];
    for (const segment of parts) {
      if (segment.length !== 0 && segment !== '.') {
        if (segment === '..') {
          result.pop(); // FIXME: What if this goes above root? Should we throw an error?
        } else {
          result.push(segment);
        }
      }
    }
    let normalized = hadLeading ? separator : '';
    normalized += result.join(separator);
    if (hadTrailing) {
      normalized += separator;
    }
    if (isUNC) {
      normalized = '\\' + normalized;
    }
    return normalized;
  }

  /**
   * [assertSegment description]
   * @param  {*} segment [description]
   * @return {void}         [description]
   */
  function assertSegment(segment) {
    if (typeof segment !== 'string') {
      throw new TypeError(`Path must be a string. Received ${segment}`);
    }
  }

  /**
   * The `path.join()` method joins all given path segments together using the
   * platform-specific separator as a delimiter, then normalizes the resulting path.
   * Zero-length path segments are ignored. If the joined path string is a zero-
   * length string then '.' will be returned, representing the current working directory.
   * @param  {string} separator platform-specific file separator
   * @param  {string[]} paths [description]
   * @return {string}       The joined filepath
   */
  function join(separator, paths) {
    const result = [];
    // naive impl: just join all the paths with separator
    for (const segment of paths) {
      assertSegment(segment);
      if (segment.length !== 0) {
        result.push(segment);
      }
    }
    return normalize(separator, result.join(separator));
  }

  /**
   * The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.
   *
   * @param  {string} separator platform-specific file separator
   * @param  {string[]} paths [description]
   * @return {string}       [description]
   */
  function resolve(separator, paths) {
    let resolved = '';
    let hitRoot = false;
    const isPosix = separator === '/';
    // go from right to left until we hit absolute path/root
    for (let i = paths.length - 1; i >= 0; i--) {
      const segment = paths[i];
      assertSegment(segment);
      if (segment.length === 0) {
        continue; // skip empty
      }

      resolved = segment + separator + resolved; // prepend new segment
      if (isAbsolute(isPosix, segment)) {
        // have we backed into an absolute path?
        hitRoot = true;
        break;
      }
    }
    // if we didn't hit root, prepend cwd
    if (!hitRoot) {
      resolved = (global.process ? process.cwd() : '/') + separator + resolved;
    }
    const normalized = normalize(separator, resolved);
    if (normalized.charAt(normalized.length - 1) === separator) {
      // FIXME: Handle UNC paths on Windows as well, so we don't trim trailing separator on something like '\\\\host-name\\resource\\'
      // Don't remove trailing separator if this is root path on windows!
      if (!isPosix && normalized.length === 3 && normalized.charAt(1) === ':' && isWindowsDeviceName(normalized.charCodeAt(0))) {
        return normalized;
      }
      // otherwise trim trailing separator
      return normalized.slice(0, normalized.length - 1);
    }
    return normalized;
  }

  /**
   * The `path.relative()` method returns the relative path `from` from to `to` based
   * on the current working directory. If from and to each resolve to the same
   * path (after calling `path.resolve()` on each), a zero-length string is returned.
   *
   * If a zero-length string is passed as `from` or `to`, the current working directory
   * will be used instead of the zero-length strings.
   *
   * @param  {string} separator platform-specific file separator
   * @param  {string} from [description]
   * @param  {string} to   [description]
   * @return {string}      [description]
   */
  function relative(separator, from, to) {
    assertArgumentType(from, 'from', 'string');
    assertArgumentType(to, 'to', 'string');
    if (from === to) {
      return '';
    }
    from = resolve(separator, [from]);
    to = resolve(separator, [to]);
    if (from === to) {
      return '';
    }

    // we now have two absolute paths,
    // lets "go up" from `from` until we reach common base dir of `to`
    // const originalFrom = from;
    let upCount = 0;
    let remainingPath = '';
    while (true) {
      if (to.startsWith(from)) {
        // match! record rest...?
        remainingPath = to.slice(from.length);
        break;
      }
      // FIXME: Break/throw if we hit bad edge case of no common root!
      from = dirname(separator, from);
      upCount++;
    }
    // remove leading separator from remainingPath if there is any
    if (remainingPath.length > 0) {
      remainingPath = remainingPath.slice(1);
    }
    return ('..' + separator).repeat(upCount) + remainingPath;
  }

  /**
   * The `path.parse()` method returns an object whose properties represent
   * significant elements of the path. Trailing directory separators are ignored,
   * see `path.sep`.
   *
   * The returned object will have the following properties:
   *
   * - dir <string>
   * - root <string>
   * - base <string>
   * - name <string>
   * - ext <string>
   * @param  {string} separator platform-specific file separator
   * @param  {string} filepath [description]
   * @return {object}
   */
  function parse(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const result = {
      root: '',
      dir: '',
      base: '',
      ext: '',
      name: ''
    };
    const length = filepath.length;
    if (length === 0) {
      return result;
    }

    // Cheat and just call our other methods for dirname/basename/extname?
    result.base = basename(separator, filepath);
    result.ext = extname(separator, result.base);
    const baseLength = result.base.length;
    result.name = result.base.slice(0, baseLength - result.ext.length);
    const toSubtract = baseLength === 0 ? 0 : baseLength + 1;
    result.dir = filepath.slice(0, filepath.length - toSubtract); // drop trailing separator!
    const firstCharCode = filepath.charCodeAt(0);
    // both win32 and POSIX return '/' root
    if (firstCharCode === FORWARD_SLASH) {
      result.root = '/';
      return result;
    }
    // we're done with POSIX...
    if (separator === '/') {
      return result;
    }
    // for win32...
    if (firstCharCode === BACKWARD_SLASH) {
      // FIXME: Handle UNC paths like '\\\\host-name\\resource\\file_path'
      // need to retain '\\\\host-name\\resource\\' as root in that case!
      result.root = '\\';
      return result;
    }
    // check for C: style root
    if (length > 1 && isWindowsDeviceName(firstCharCode) && filepath.charAt(1) === ':') {
      if (length > 2) {
        // is it like C:\\?
        const thirdCharCode = filepath.charCodeAt(2);
        if (thirdCharCode === FORWARD_SLASH || thirdCharCode === BACKWARD_SLASH) {
          result.root = filepath.slice(0, 3);
          return result;
        }
      }
      // nope, just C:, no trailing separator
      result.root = filepath.slice(0, 2);
    }
    return result;
  }

  /**
   * The `path.format()` method returns a path string from an object. This is the
   * opposite of `path.parse()`.
   *
   * @param  {string} separator platform-specific file separator
   * @param  {object} pathObject object of format returned by `path.parse()`
   * @param  {string} pathObject.dir directory name
   * @param  {string} pathObject.root file root dir, ignored if `pathObject.dir` is provided
   * @param  {string} pathObject.base file basename
   * @param  {string} pathObject.name basename minus extension, ignored if `pathObject.base` exists
   * @param  {string} pathObject.ext file extension, ignored if `pathObject.base` exists
   * @return {string}
   */
  function format(separator, pathObject) {
    assertArgumentType(pathObject, 'pathObject', 'object');
    const base = pathObject.base || `${pathObject.name || ''}${pathObject.ext || ''}`;

    // append base to root if `dir` wasn't specified, or if
    // dir is the root
    if (!pathObject.dir || pathObject.dir === pathObject.root) {
      return `${pathObject.root || ''}${base}`;
    }
    // combine dir + / + base
    return `${pathObject.dir}${separator}${base}`;
  }

  /**
   * On Windows systems only, returns an equivalent namespace-prefixed path for
   * the given path. If path is not a string, path will be returned without modifications.
   * See https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#namespaces
   * @param  {string} filepath [description]
   * @return {string}          [description]
   */
  function toNamespacedPath(filepath) {
    if (typeof filepath !== 'string') {
      return filepath;
    }
    if (filepath.length === 0) {
      return '';
    }
    const resolvedPath = resolve('\\', [filepath]);
    const length = resolvedPath.length;
    if (length < 2) {
      // need '\\\\' or 'C:' minimum
      return filepath;
    }
    const firstCharCode = resolvedPath.charCodeAt(0);
    // if start with '\\\\', prefix with UNC root, drop the slashes
    if (firstCharCode === BACKWARD_SLASH && resolvedPath.charAt(1) === '\\') {
      // return as-is if it's an aready long path ('\\\\?\\' or '\\\\.\\' prefix)
      if (length >= 3) {
        const thirdChar = resolvedPath.charAt(2);
        if (thirdChar === '?' || thirdChar === '.') {
          return filepath;
        }
      }
      return '\\\\?\\UNC\\' + resolvedPath.slice(2);
    } else if (isWindowsDeviceName(firstCharCode) && resolvedPath.charAt(1) === ':') {
      return '\\\\?\\' + resolvedPath;
    }
    return filepath;
  }
  const Win32Path = {
    sep: '\\',
    delimiter: ';',
    basename: function (filepath, ext) {
      return basename(this.sep, filepath, ext);
    },
    normalize: function (filepath) {
      return normalize(this.sep, filepath);
    },
    join: function (...paths) {
      return join(this.sep, paths);
    },
    extname: function (filepath) {
      return extname(this.sep, filepath);
    },
    dirname: function (filepath) {
      return dirname(this.sep, filepath);
    },
    isAbsolute: function (filepath) {
      return isAbsolute(false, filepath);
    },
    relative: function (from, to) {
      return relative(this.sep, from, to);
    },
    resolve: function (...paths) {
      return resolve(this.sep, paths);
    },
    parse: function (filepath) {
      return parse(this.sep, filepath);
    },
    format: function (pathObject) {
      return format(this.sep, pathObject);
    },
    toNamespacedPath: toNamespacedPath
  };
  const PosixPath = {
    sep: '/',
    delimiter: ':',
    basename: function (filepath, ext) {
      return basename(this.sep, filepath, ext);
    },
    normalize: function (filepath) {
      return normalize(this.sep, filepath);
    },
    join: function (...paths) {
      return join(this.sep, paths);
    },
    extname: function (filepath) {
      return extname(this.sep, filepath);
    },
    dirname: function (filepath) {
      return dirname(this.sep, filepath);
    },
    isAbsolute: function (filepath) {
      return isAbsolute(true, filepath);
    },
    relative: function (from, to) {
      return relative(this.sep, from, to);
    },
    resolve: function (...paths) {
      return resolve(this.sep, paths);
    },
    parse: function (filepath) {
      return parse(this.sep, filepath);
    },
    format: function (pathObject) {
      return format(this.sep, pathObject);
    },
    toNamespacedPath: function (filepath) {
      return filepath; // no-op
    }
  };

  const path = PosixPath;
  path.win32 = Win32Path;
  path.posix = PosixPath;

  var invoker = {};

  /**
   * Titanium SDK
   * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
   * Licensed under the terms of the Apache Public License
   * Please see the LICENSE included with this distribution for details.
   */

  /**
   * Generates a wrapped invoker function for a specific API
   * This lets us pass in context-specific data to a function
   * defined in an API namespace (i.e. on a module)
   *
   * We use this for create methods, and other APIs that take
   * a KrollInvocation object as their first argument in Java
   *
   * For example, an invoker for a "create" method might look
   * something like this:
   *
   *     function createView(sourceUrl, options) {
   *         var view = new View(options);
   *         view.sourceUrl = sourceUrl;
   *         return view;
   *     }
   *
   * And the corresponding invoker for app.js would look like:
   *
   *     UI.createView = function() {
   *         return createView("app://app.js", arguments[0]);
   *     }
   *
   * wrapperAPI: The scope specific API (module) wrapper
   * realAPI: The actual module implementation
   * apiName: The top level API name of the root module
   * invocationAPI: The actual API to generate an invoker for
   * scopeVars: A map that is passed into each invoker
   */

  /**
   * @param {object} wrapperAPI e.g. TitaniumWrapper
   * @param {object} realAPI e.g. Titanium
   * @param {string} apiName e.g. 'Titanium'
   * @param {object} invocationAPI details on the api we're wrapping
   * @param {string} invocationAPI.namespace the namespace of the proxy where method hangs (w/o 'Ti.' prefix) e.g. 'Filesystem' or 'UI.Android'
   * @param {string} invocationAPI.api the method name e.g. 'openFile' or 'createSearchView'
   * @param {object} scopeVars holder for context specific values (basically just wraps sourceUrl)
   * @param {string} scopeVars.sourceUrl source URL of js file entry point
   * @param {Module} [scopeVars.module] module
   */
  function genInvoker(wrapperAPI, realAPI, apiName, invocationAPI, scopeVars) {
    let apiNamespace = wrapperAPI;
    const namespace = invocationAPI.namespace;
    if (namespace !== apiName) {
      const names = namespace.split('.');
      for (const name of names) {
        let api;
        // Create a module wrapper only if it hasn't been wrapped already.
        if (Object.prototype.hasOwnProperty.call(apiNamespace, name)) {
          api = apiNamespace[name];
        } else {
          function SandboxAPI() {
            const proto = Object.getPrototypeOf(this);
            Object.defineProperty(this, '_events', {
              get: function () {
                return proto._events;
              },
              set: function (value) {
                proto._events = value;
              }
            });
          }
          SandboxAPI.prototype = apiNamespace[name];
          api = new SandboxAPI();
          apiNamespace[name] = api;
        }
        apiNamespace = api;
        realAPI = realAPI[name];
      }
    }
    let delegate = realAPI[invocationAPI.api];
    // These invokers form a call hierarchy so we need to
    // provide a way back to the actual root Titanium / actual impl.
    while (delegate.__delegate__) {
      delegate = delegate.__delegate__;
    }
    apiNamespace[invocationAPI.api] = createInvoker(realAPI, delegate, scopeVars);
  }
  invoker.genInvoker = genInvoker;

  /**
   * Creates and returns a single invoker function that wraps
   * a delegate function, thisObj, and scopeVars
   * @param {object} thisObj The `this` object to use when invoking the `delegate` function
   * @param {function} delegate The function to wrap/delegate to under the hood
   * @param {object} scopeVars The scope variables to splice into the arguments when calling the delegate
   * @param {string} scopeVars.sourceUrl the only real relevent scope variable!
   * @return {function}
   */
  function createInvoker(thisObj, delegate, scopeVars) {
    const urlInvoker = function invoker(...args) {
      // eslint-disable-line func-style
      args.splice(0, 0, invoker.__scopeVars__);
      return delegate.apply(invoker.__thisObj__, args);
    };
    urlInvoker.__delegate__ = delegate;
    urlInvoker.__thisObj__ = thisObj;
    urlInvoker.__scopeVars__ = scopeVars;
    return urlInvoker;
  }
  invoker.createInvoker = createInvoker;

  /**
   * Titanium SDK
   * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
   * Licensed under the terms of the Apache Public License
   * Please see the LICENSE included with this distribution for details.
   */
  function bootstrap$2(global, kroll) {
    const assets = kroll.binding('assets');
    const Script = kroll.binding('evals').Script;

    /**
     * The loaded index.json file from the app. Used to store the encrypted JS assets'
     * filenames/offsets.
     */
    let fileIndex;
    // FIXME: fix file name parity between platforms
    const INDEX_JSON = 'index.json';
    class Module {
      /**
       * [Module description]
       * @param {string} id      module id
       * @param {Module} parent  parent module
       */
      constructor(id, parent) {
        this.id = id;
        this.exports = {};
        this.parent = parent;
        this.filename = null;
        this.loaded = false;
        this.wrapperCache = {};
        this.isService = false; // toggled on if this module is the service entry point
      }

      /**
       * Attempts to load the module. If no file is found
       * with the provided name an exception will be thrown.
       * Once the contents of the file are read, it is run
       * in the current context. A sandbox is created by
       * executing the code inside a wrapper function.
       * This provides a speed boost vs creating a new context.
       *
       * @param  {String} filename [description]
       * @param  {String} source   [description]
       * @returns {void}
       */
      load(filename, source) {
        if (this.loaded) {
          throw new Error('Module already loaded.');
        }
        this.filename = filename;
        this.path = path.dirname(filename);
        this.paths = this.nodeModulesPaths(this.path);
        if (!source) {
          source = assets.readAsset(`Resources${filename}`);
        }

        // Stick it in the cache
        Module.cache[this.filename] = this;
        this._runScript(source, this.filename);
        this.loaded = true;
      }

      /**
       * Generates a context-specific module wrapper, and wraps
       * each invocation API in an external (3rd party) module
       * See invoker.js for more info
       * @param  {object} externalModule native module proxy
       * @param  {string} sourceUrl      the current js file url
       * @return {object}                wrapper around the externalModule
       */
      createModuleWrapper(externalModule, sourceUrl) {

        // The module wrapper forwards on using the original as a prototype
        function ModuleWrapper() {}
        ModuleWrapper.prototype = externalModule;
        const wrapper = new ModuleWrapper();
        // Here we take the APIs defined in the bootstrap.js
        // and effectively lazily hook them
        // We explicitly guard the code so iOS doesn't even use/include the referenced invoker.js import
        const invocationAPIs = externalModule.invocationAPIs || [];
        for (const api of invocationAPIs) {
          const delegate = externalModule[api];
          if (!delegate) {
            continue;
          }
          wrapper[api] = invoker.createInvoker(externalModule, delegate, new kroll.ScopeVars({
            sourceUrl
          }));
        }
        wrapper.addEventListener = function (...args) {
          externalModule.addEventListener.apply(externalModule, args);
        };
        wrapper.removeEventListener = function (...args) {
          externalModule.removeEventListener.apply(externalModule, args);
        };
        wrapper.fireEvent = function (...args) {
          externalModule.fireEvent.apply(externalModule, args);
        };
        return wrapper;
      }

      /**
       * Takes a CommonJS module and uses it to extend an existing external/native module. The exports are added to the external module.
       * @param  {Object} externalModule The external/native module we're extending
       * @param  {String} id             module id
       */
      extendModuleWithCommonJs(externalModule, id) {
        if (!kroll.isExternalCommonJsModule(id)) {
          return;
        }

        // Load under fake name, or the commonjs side of the native module gets cached in place of the native module!
        // See TIMOB-24932
        const fakeId = `${id}.commonjs`;
        const jsModule = new Module(fakeId, this);
        jsModule.load(fakeId, kroll.getExternalCommonJsModule(id));
        if (jsModule.exports) {
          console.trace(`Extending native module '${id}' with the CommonJS module that was packaged with it.`);
          kroll.extend(externalModule, jsModule.exports);
        }
      }

      /**
       * Loads a native / external (3rd party) module
       * @param  {String} id              module id
       * @param  {object} externalBinding external binding object
       * @return {Object}                 The exported module
       */
      loadExternalModule(id, externalBinding) {
        // try to get the cached module...
        let externalModule = Module.cache[id];
        if (!externalModule) {
          // iOS and Android differ quite a bit here.
          // With ios, we should already have the native module loaded
          // There's no special "bootstrap.js" file packaged within it
          // On Android, we load a bootstrap.js bundled with the module
          {
            // This is the process for Android, first grab the bootstrap source
            const source = externalBinding.bootstrap;

            // Load the native module's bootstrap JS
            const module = new Module(id, this);
            module.load(`${id}/bootstrap.js`, source);

            // Bootstrap and load the module using the native bindings
            const result = module.exports.bootstrap(externalBinding);

            // Cache the external module instance after it's been modified by it's bootstrap script
            externalModule = result;
          }
        }
        if (!externalModule) {
          console.trace(`Unable to load external module: ${id}`);
          return null;
        }

        // cache the loaded native module (before we extend it)
        Module.cache[id] = externalModule;

        // We cache each context-specific module wrapper
        // on the parent module, rather than in the Module.cache
        let wrapper = this.wrapperCache[id];
        if (wrapper) {
          return wrapper;
        }
        const sourceUrl = `app://${this.filename}`; // FIXME: If this.filename starts with '/', we need to drop it, I think?
        wrapper = this.createModuleWrapper(externalModule, sourceUrl);

        // Then we "extend" the API/module using any shipped JS code (assets/<module.id>.js)
        this.extendModuleWithCommonJs(wrapper, id);
        this.wrapperCache[id] = wrapper;
        return wrapper;
      }

      // See https://nodejs.org/api/modules.html#modules_all_together

      /**
       * Require another module as a child of this module.
       * This parent module's path is used as the base for relative paths
       * when loading the child. Returns the exports object
       * of the child module.
       *
       * @param  {String} request  The path to the requested module
       * @return {Object}          The loaded module
       */
      require(request) {
        // 2. If X begins with './' or '/' or '../'
        const start = request.substring(0, 2); // hack up the start of the string to check relative/absolute/"naked" module id
        if (start === './' || start === '..') {
          const loaded = this.loadAsFileOrDirectory(path.normalize(this.path + '/' + request));
          if (loaded) {
            return loaded.exports;
          }
          // Root/absolute path (internally when reading the file, we prepend "Resources/" as root dir)
        } else if (request.substring(0, 1) === '/') {
          const loaded = this.loadAsFileOrDirectory(path.normalize(request));
          if (loaded) {
            return loaded.exports;
          }
        } else {
          // Despite being step 1 in Node.JS psuedo-code, we moved it down here because we don't allow native modules
          // to start with './', '..' or '/' - so this avoids a lot of misses on requires starting that way

          // 1. If X is a core module,
          let loaded = this.loadCoreModule(request);
          if (loaded) {
            // a. return the core module
            // b. STOP
            return loaded;
          }

          // Look for CommonJS module
          if (request.indexOf('/') === -1) {
            // For CommonJS we need to look for module.id/module.id.js first...
            const filename = `/${request}/${request}.js`;
            // Only look for this _exact file_. DO NOT APPEND .js or .json to it!
            if (this.filenameExists(filename)) {
              loaded = this.loadJavascriptText(filename);
              if (loaded) {
                return loaded.exports;
              }
            }

            // Then try module.id as directory
            loaded = this.loadAsDirectory(`/${request}`);
            if (loaded) {
              return loaded.exports;
            }
          }

          // Allow looking through node_modules
          // 3. LOAD_NODE_MODULES(X, dirname(Y))
          loaded = this.loadNodeModules(request, this.paths);
          if (loaded) {
            return loaded.exports;
          }

          // Fallback to old Titanium behavior of assuming it's actually an absolute path

          // We'd like to warn users about legacy style require syntax so they can update, but the new syntax is not backwards compatible.
          // So for now, let's just be quite about it. In future versions of the SDK (7.0?) we should warn (once 5.x is end of life so backwards compat is not necessary)
          // eslint-disable-next-line max-len
          // console.warn(`require called with un-prefixed module id: ${request}, should be a core or CommonJS module. Falling back to old Ti behavior and assuming it's an absolute path: /${request}`);

          loaded = this.loadAsFileOrDirectory(path.normalize(`/${request}`));
          if (loaded) {
            return loaded.exports;
          }
        }

        // 4. THROW "not found"
        throw new Error(`Requested module not found: ${request}`); // TODO Set 'code' property to 'MODULE_NOT_FOUND' to match Node?
      }

      /**
       * Loads the core module if it exists. If not, returns null.
       *
       * @param  {String}  id The request module id
       * @return {Object}    true if the module id matches a native or CommonJS module id, (or it's first path segment does).
       */
      loadCoreModule(id) {
        // skip bad ids, relative ids, absolute ids. "native"/"core" modules should be of form "module.id" or "module.id/sub.file.js"
        if (!id || id.startsWith('.') || id.startsWith('/')) {
          return null;
        }

        // check if we have a cached copy of the wrapper
        if (this.wrapperCache[id]) {
          return this.wrapperCache[id];
        }
        const parts = id.split('/');
        const externalBinding = kroll.externalBinding(parts[0]);
        if (externalBinding) {
          if (parts.length === 1) {
            // This is the "root" of an external module. It can look like:
            // request("com.example.mymodule")
            // We can load and return it right away (caching occurs in the called function).
            return this.loadExternalModule(parts[0], externalBinding);
          }

          // Could be a sub-module (CommonJS) of an external native module.
          // We allow that since TIMOB-9730.
          if (kroll.isExternalCommonJsModule(parts[0])) {
            const externalCommonJsContents = kroll.getExternalCommonJsModule(id);
            if (externalCommonJsContents) {
              // found it
              // FIXME Re-use loadAsJavaScriptText?
              const module = new Module(id, this);
              module.load(id, externalCommonJsContents);
              return module.exports;
            }
          }
        }
        return null; // failed to load
      }

      /**
       * Attempts to load a node module by id from the starting path
       * @param  {string} moduleId       The path of the module to load.
       * @param  {string[]} dirs       paths to search
       * @return {Module|null}      The module, if loaded. null if not.
       */
      loadNodeModules(moduleId, dirs) {
        // 2. for each DIR in DIRS:
        for (const dir of dirs) {
          // a. LOAD_AS_FILE(DIR/X)
          // b. LOAD_AS_DIRECTORY(DIR/X)
          const mod = this.loadAsFileOrDirectory(path.join(dir, moduleId));
          if (mod) {
            return mod;
          }
        }
        return null;
      }

      /**
       * Determine the set of paths to search for node_modules
       * @param  {string} startDir       The starting directory
       * @return {string[]}              The array of paths to search
       */
      nodeModulesPaths(startDir) {
        // Make sure we have an absolute path to start with
        startDir = path.resolve(startDir);

        // Return early if we are at root, this avoids doing a pointless loop
        // and also returning an array with duplicate entries
        // e.g. ["/node_modules", "/node_modules"]
        if (startDir === '/') {
          return ['/node_modules'];
        }
        // 1. let PARTS = path split(START)
        const parts = startDir.split('/');
        // 2. let I = count of PARTS - 1
        let i = parts.length - 1;
        // 3. let DIRS = []
        const dirs = [];

        // 4. while I >= 0,
        while (i >= 0) {
          // a. if PARTS[I] = "node_modules" CONTINUE
          if (parts[i] === 'node_modules' || parts[i] === '') {
            i -= 1;
            continue;
          }
          // b. DIR = path join(PARTS[0 .. I] + "node_modules")
          const dir = path.join(parts.slice(0, i + 1).join('/'), 'node_modules');
          // c. DIRS = DIRS + DIR
          dirs.push(dir);
          // d. let I = I - 1
          i -= 1;
        }
        // Always add /node_modules to the search path
        dirs.push('/node_modules');
        return dirs;
      }

      /**
       * Attempts to load a given path as a file or directory.
       * @param  {string} normalizedPath The path of the module to load.
       * @return {Module|null} The loaded module. null if unable to load.
       */
      loadAsFileOrDirectory(normalizedPath) {
        // a. LOAD_AS_FILE(Y + X)
        let loaded = this.loadAsFile(normalizedPath);
        if (loaded) {
          return loaded;
        }
        // b. LOAD_AS_DIRECTORY(Y + X)
        loaded = this.loadAsDirectory(normalizedPath);
        if (loaded) {
          return loaded;
        }
        return null;
      }

      /**
       * Loads a given file as a Javascript file, returning the module.exports.
       * @param  {string} filename File we're attempting to load
       * @return {Module} the loaded module
       */
      loadJavascriptText(filename) {
        // Look in the cache!
        if (Module.cache[filename]) {
          return Module.cache[filename];
        }
        const module = new Module(filename, this);
        module.load(filename);
        return module;
      }

      /**
       * Loads a JSON file by reading it's contents, doing a JSON.parse and returning the parsed object.
       *
       * @param  {String} filename File we're attempting to load
       * @return {Module} The loaded module instance
       */
      loadJavascriptObject(filename) {
        // Look in the cache!
        if (Module.cache[filename]) {
          return Module.cache[filename];
        }
        const module = new Module(filename, this);
        module.filename = filename;
        module.path = path.dirname(filename);
        const source = assets.readAsset(`Resources${filename}`);

        // Stick it in the cache
        Module.cache[filename] = module;
        module.exports = JSON.parse(source);
        module.loaded = true;
        return module;
      }

      /**
       * Attempts to load a file by it's full filename according to NodeJS rules.
       *
       * @param  {string} id The filename
       * @return {Module|null} Module instance if loaded, null if not found.
       */
      loadAsFile(id) {
        // 1. If X is a file, load X as JavaScript text.  STOP
        let filename = id;
        if (this.filenameExists(filename)) {
          // If the file has a .json extension, load as JavascriptObject
          if (filename.length > 5 && filename.slice(-4) === 'json') {
            return this.loadJavascriptObject(filename);
          }
          return this.loadJavascriptText(filename);
        }
        // 2. If X.js is a file, load X.js as JavaScript text.  STOP
        filename = id + '.js';
        if (this.filenameExists(filename)) {
          return this.loadJavascriptText(filename);
        }
        // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
        filename = id + '.json';
        if (this.filenameExists(filename)) {
          return this.loadJavascriptObject(filename);
        }
        // failed to load anything!
        return null;
      }

      /**
       * Attempts to load a directory according to NodeJS rules.
       *
       * @param  {string} id The directory name
       * @return {Module|null} Loaded module, null if not found.
       */
      loadAsDirectory(id) {
        // 1. If X/package.json is a file,
        let filename = path.resolve(id, 'package.json');
        if (this.filenameExists(filename)) {
          // a. Parse X/package.json, and look for "main" field.
          const object = this.loadJavascriptObject(filename);
          if (object && object.exports && object.exports.main) {
            // b. let M = X + (json main field)
            const m = path.resolve(id, object.exports.main);
            // c. LOAD_AS_FILE(M)
            return this.loadAsFileOrDirectory(m);
          }
        }

        // 2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
        filename = path.resolve(id, 'index.js');
        if (this.filenameExists(filename)) {
          return this.loadJavascriptText(filename);
        }
        // 3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
        filename = path.resolve(id, 'index.json');
        if (this.filenameExists(filename)) {
          return this.loadJavascriptObject(filename);
        }
        return null;
      }

      /**
       * Setup a sandbox and run the module's script inside it.
       * Returns the result of the executed script.
       * @param  {String} source   [description]
       * @param  {String} filename [description]
       * @return {*}          [description]
       */
      _runScript(source, filename) {
        const self = this;
        function require(path) {
          return self.require(path);
        }
        require.main = Module.main;

        // This "first time" run is really only for app.js, AFAICT, and needs
        // an activity. If app was restarted for Service only, we don't want
        // to go this route. So added currentActivity check. (bill)
        if (self.id === '.' && !this.isService) {
          global.require = require;

          // check if we have an inspector binding...
          const inspector = kroll.binding('inspector');
          if (inspector) {
            // If debugger is enabled, load app.js and pause right before we execute it
            const inspectorWrapper = inspector.callAndPauseOnStart;
            if (inspectorWrapper) {
              // FIXME Why can't we do normal Module.wrap(source) here?
              // I get "Uncaught TypeError: Cannot read property 'createTabGroup' of undefined" for "Ti.UI.createTabGroup();"
              // Not sure why app.js is special case and can't be run under normal self-invoking wrapping function that gets passed in global/kroll/Ti/etc
              // Instead, let's use a slightly modified version of callAndPauseOnStart:
              // It will compile the source as-is, schedule a pause and then run the source.
              return inspectorWrapper(source, filename);
            }
          }
          // run app.js "normally" (i.e. not under debugger/inspector)
          return Script.runInThisContext(source, filename, true);
        }

        // In V8, we treat external modules the same as native modules.  First, we wrap the
        // module code and then run it in the current context.  This will allow external modules to
        // access globals as mentioned in TIMOB-11752. This will also help resolve startup slowness that
        // occurs as a result of creating a new context during startup in TIMOB-12286.
        source = Module.wrap(source);
        const f = Script.runInThisContext(source, filename, true);
        return f(this.exports, require, this, filename, path.dirname(filename), Titanium, Ti, global, kroll);
      }

      /**
       * Look up a filename in the app's index.json file
       * @param  {String} filename the file we're looking for
       * @return {Boolean}         true if the filename exists in the index.json
       */
      filenameExists(filename) {
        filename = 'Resources' + filename; // When we actually look for files, assume "Resources/" is the root
        if (!fileIndex) {
          const json = assets.readAsset(INDEX_JSON);
          fileIndex = JSON.parse(json);
        }
        return fileIndex && filename in fileIndex;
      }
    }
    Module.cache = [];
    Module.main = null;
    Module.wrapper = ['(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {', '\n});'];
    Module.wrap = function (script) {
      return Module.wrapper[0] + script + Module.wrapper[1];
    };

    /**
     * [runModule description]
     * @param  {String} source            JS Source code
     * @param  {String} filename          Filename of the module
     * @param  {Titanium.Service|null|Titanium.Android.Activity} activityOrService [description]
     * @return {Module}                   The loaded Module
     */
    Module.runModule = function (source, filename, activityOrService) {
      let id = filename;
      if (!Module.main) {
        id = '.';
      }
      const module = new Module(id, null);
      // FIXME: I don't know why instanceof for Titanium.Service works here!
      // On Android, it's an apiname of Ti.Android.Service
      // On iOS, we don't yet pass in the value, but we do set Ti.App.currentService property beforehand!
      // Can we remove the preload stuff in KrollBridge.m to pass along the service instance into this like we do on Andorid?
      module.isService = activityOrService instanceof Titanium.Service;
      {
        if (module.isService) {
          Object.defineProperty(Ti.Android, 'currentService', {
            value: activityOrService,
            writable: false,
            configurable: true
          });
        } else {
          Object.defineProperty(Ti.Android, 'currentService', {
            value: null,
            writable: false,
            configurable: true
          });
        }
      }
      if (!Module.main) {
        Module.main = module;
      }
      filename = filename.replace('Resources/', '/'); // normalize back to absolute paths (which really are relative to Resources under the hood)
      module.load(filename, source);
      {
        Object.defineProperty(Ti.Android, 'currentService', {
          value: null,
          writable: false,
          configurable: true
        });
      }
      return module;
    };
    return Module;
  }

  /**
   * This hangs the Proxy type off Ti namespace. It also generates a hidden _properties object
   * that is used to store property values on the JS side for java Proxies.
   * Basically these get/set methods are fallbacks for when a Java proxy doesn't have a native method to handle getting/setting the property.
   * (see Proxy.h/ProxyBindingV8.cpp.fm for more info)
   * @param {object} tiBinding the underlying 'Titanium' native binding (see KrollBindings::initTitanium)
   * @param {object} Ti the global.Titanium object
   */
  function ProxyBootstrap(tiBinding, Ti) {
    const Proxy = tiBinding.Proxy;
    Ti.Proxy = Proxy;
    Proxy.defineProperties = function (proxyPrototype, names) {
      const properties = {};
      const len = names.length;
      for (let i = 0; i < len; ++i) {
        const name = names[i];
        properties[name] = {
          get: function () {
            // eslint-disable-line no-loop-func
            return this.getProperty(name);
          },
          set: function (value) {
            // eslint-disable-line no-loop-func
            this.setPropertyAndFire(name, value);
          },
          enumerable: true
        };
      }
      Object.defineProperties(proxyPrototype, properties);
    };
    Object.defineProperty(Proxy.prototype, 'getProperty', {
      value: function (property) {
        return this._properties[property];
      },
      enumerable: false
    });
    Object.defineProperty(Proxy.prototype, 'setProperty', {
      value: function (property, value) {
        return this._properties[property] = value;
      },
      enumerable: false
    });
    Object.defineProperty(Proxy.prototype, 'setPropertiesAndFire', {
      value: function (properties) {
        const ownNames = Object.getOwnPropertyNames(properties);
        const len = ownNames.length;
        const changes = [];
        for (let i = 0; i < len; ++i) {
          const property = ownNames[i];
          const value = properties[property];
          if (!property) {
            continue;
          }
          const oldValue = this._properties[property];
          this._properties[property] = value;
          if (value !== oldValue) {
            changes.push([property, oldValue, value]);
          }
        }
        if (changes.length > 0) {
          this.onPropertiesChanged(changes);
        }
      },
      enumerable: false
    });
  }

  /* globals OS_ANDROID,OS_IOS */
  function bootstrap$1(global, kroll) {
    {
      const tiBinding = kroll.binding('Titanium');
      const Ti = tiBinding.Titanium;
      const bootstrap = kroll.NativeModule.require('bootstrap');
      // The bootstrap defines lazy namespace property tree **and**
      // sets up special APIs that get wrapped to pass along sourceUrl via a KrollInvocation object
      bootstrap.bootstrap(Ti);
      bootstrap.defineLazyBinding(Ti, 'API'); // Basically does the same thing iOS does for API module (lazy property getter)

      // Here, we go through all the specially marked APIs to generate the wrappers to pass in the sourceUrl
      // TODO: This is all insane, and we should just bake it into the Proxy conversion stuff to grab and pass along sourceUrl
      // Rather than carry it all over the place like this!
      // We already need to generate a KrollInvocation object to wrap the sourceUrl!
      function TitaniumWrapper(context) {
        const sourceUrl = this.sourceUrl = context.sourceUrl;
        const scopeVars = new kroll.ScopeVars({
          sourceUrl
        });
        Ti.bindInvocationAPIs(this, scopeVars);
      }
      TitaniumWrapper.prototype = Ti;
      Ti.Wrapper = TitaniumWrapper;

      // -----------------------------------------------------------------------
      // This loops through all known APIs that require an
      // Invocation object and wraps them so we can pass a
      // source URL as the first argument
      Ti.bindInvocationAPIs = function (wrapperTi, scopeVars) {
        for (const api of Ti.invocationAPIs) {
          // separate each invoker into it's own private scope
          invoker.genInvoker(wrapperTi, Ti, 'Titanium', api, scopeVars);
        }
      };
      ProxyBootstrap(tiBinding, Ti);
      return new TitaniumWrapper({
        // Even though the entry point is really ti://kroll.js, that will break resolution of urls under the covers!
        // So basically just assume app.js as the relative file base
        sourceUrl: 'app://app.js'
      });
    }
  }

  // Copyright Joyent, Inc. and other Node contributors.

  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:

  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.

  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  // Modifications Copyright 2011-Present Appcelerator, Inc.
  function EventEmitterBootstrap(global, kroll) {
    const TAG = 'EventEmitter';
    const EventEmitter = kroll.EventEmitter;
    const isArray = Array.isArray;

    // By default EventEmitters will print a warning if more than
    // 10 listeners are added to it. This is a useful default which
    // helps finding memory leaks.

    Object.defineProperty(EventEmitter.prototype, 'callHandler', {
      value: function (handler, type, data) {
        // kroll.log(TAG, "calling event handler: type:" + type + ", data: " + data + ", handler: " + handler);

        var handled = false,
          cancelBubble = data.cancelBubble,
          event;
        if (handler.listener && handler.listener.call) {
          // Create event object, copy any custom event data, and set the "type" and "source" properties.
          event = {
            type: type,
            source: this
          };
          kroll.extend(event, data);
          if (handler.self && event.source == handler.self.view) {
            // eslint-disable-line eqeqeq
            event.source = handler.self;
          }
          handler.listener.call(this, event);

          // The "cancelBubble" property may be reset in the handler.
          if (event.cancelBubble !== cancelBubble) {
            cancelBubble = event.cancelBubble;
          }
          handled = true;
        } else if (kroll.DBG) {
          kroll.log(TAG, 'handler for event \'' + type + '\' is ' + typeof handler.listener + ' and cannot be called.');
        }

        // Bubble the events to the parent view if needed.
        if (data.bubbles && !cancelBubble) {
          handled = this._fireSyncEventToParent(type, data) || handled;
        }
        return handled;
      },
      enumerable: false
    });
    Object.defineProperty(EventEmitter.prototype, 'emit', {
      value: function (type) {
        var handled = false,
          data = arguments[1],
          handler,
          listeners;

        // Set the "bubbles" and "cancelBubble" properties for event data.
        if (data !== null && typeof data === 'object') {
          data.bubbles = !!data.bubbles;
          data.cancelBubble = !!data.cancelBubble;
        } else {
          data = {
            bubbles: false,
            cancelBubble: false
          };
        }
        if (this._hasJavaListener) {
          this._onEventFired(type, data);
        }
        if (!this._events || !this._events[type] || !this.callHandler) {
          if (data.bubbles && !data.cancelBubble) {
            handled = this._fireSyncEventToParent(type, data);
          }
          return handled;
        }
        handler = this._events[type];
        if (typeof handler.listener === 'function') {
          handled = this.callHandler(handler, type, data);
        } else if (isArray(handler)) {
          listeners = handler.slice();
          for (var i = 0, l = listeners.length; i < l; i++) {
            handled = this.callHandler(listeners[i], type, data) || handled;
          }
        } else if (data.bubbles && !data.cancelBubble) {
          handled = this._fireSyncEventToParent(type, data);
        }
        return handled;
      },
      enumerable: false
    });

    // Titanium compatibility
    Object.defineProperty(EventEmitter.prototype, 'fireEvent', {
      value: EventEmitter.prototype.emit,
      enumerable: false,
      writable: true
    });
    Object.defineProperty(EventEmitter.prototype, 'fireSyncEvent', {
      value: EventEmitter.prototype.emit,
      enumerable: false
    });

    // EventEmitter is defined in src/node_events.cc
    // EventEmitter.prototype.emit() is also defined there.
    Object.defineProperty(EventEmitter.prototype, 'addListener', {
      value: function (type, listener, view) {
        if (typeof listener !== 'function') {
          throw new Error('addListener only takes instances of Function. The listener for event "' + type + '" is "' + typeof listener + '"');
        }
        if (!this._events) {
          this._events = {};
        }
        var id;

        // Setup ID first so we can pass count in to "listenerAdded"
        if (!this._events[type]) {
          id = 0;
        } else if (isArray(this._events[type])) {
          id = this._events[type].length;
        } else {
          id = 1;
        }
        var listenerWrapper = {};
        listenerWrapper.listener = listener;
        listenerWrapper.self = view;
        if (!this._events[type]) {
          // Optimize the case of one listener. Don't need the extra array object.
          this._events[type] = listenerWrapper;
        } else if (isArray(this._events[type])) {
          // If we've already got an array, just append.
          this._events[type].push(listenerWrapper);
        } else {
          // Adding the second element, need to change to array.
          this._events[type] = [this._events[type], listenerWrapper];
        }

        // Notify the Java proxy if this is the first listener added.
        if (id === 0) {
          this._hasListenersForEventType(type, true);
        }
        return id;
      },
      enumerable: false
    });

    // The JavaObject prototype will provide a version of this
    // that delegates back to the Java proxy. Non-Java versions
    // of EventEmitter don't care, so this no op is called instead.
    Object.defineProperty(EventEmitter.prototype, '_listenerForEvent', {
      value: function () {},
      enumerable: false
    });
    Object.defineProperty(EventEmitter.prototype, 'on', {
      value: EventEmitter.prototype.addListener,
      enumerable: false
    });

    // Titanium compatibility
    Object.defineProperty(EventEmitter.prototype, 'addEventListener', {
      value: EventEmitter.prototype.addListener,
      enumerable: false,
      writable: true
    });
    Object.defineProperty(EventEmitter.prototype, 'once', {
      value: function (type, listener) {
        var self = this;
        function g() {
          self.removeListener(type, g);
          listener.apply(this, arguments);
        }
        g.listener = listener;
        self.on(type, g);
        return this;
      },
      enumerable: false
    });
    Object.defineProperty(EventEmitter.prototype, 'removeListener', {
      value: function (type, listener) {
        if (typeof listener !== 'function') {
          throw new Error('removeListener only takes instances of Function');
        }

        // does not use listeners(), so no side effect of creating _events[type]
        if (!this._events || !this._events[type]) {
          return this;
        }
        var list = this._events[type];
        var count = 0;
        if (isArray(list)) {
          var position = -1;
          // Also support listener indexes / ids
          if (typeof listener === 'number') {
            position = listener;
            if (position > list.length || position < 0) {
              return this;
            }
          } else {
            for (var i = 0, length = list.length; i < length; i++) {
              if (list[i].listener === listener) {
                position = i;
                break;
              }
            }
          }
          if (position < 0) {
            return this;
          }
          list.splice(position, 1);
          if (list.length === 0) {
            delete this._events[type];
          }
          count = list.length;
        } else if (list.listener === listener || listener == 0) {
          // eslint-disable-line eqeqeq
          delete this._events[type];
        } else {
          return this;
        }
        if (count === 0) {
          this._hasListenersForEventType(type, false);
        }
        return this;
      },
      enumerable: false
    });
    Object.defineProperty(EventEmitter.prototype, 'removeEventListener', {
      value: EventEmitter.prototype.removeListener,
      enumerable: false,
      writable: true
    });
    Object.defineProperty(EventEmitter.prototype, 'removeAllListeners', {
      value: function (type) {
        // does not use listeners(), so no side effect of creating _events[type]
        if (type && this._events && this._events[type]) {
          this._events[type] = null;
          this._hasListenersForEventType(type, false);
        }
        return this;
      },
      enumerable: false
    });
    Object.defineProperty(EventEmitter.prototype, 'listeners', {
      value: function (type) {
        if (!this._events) {
          this._events = {};
        }
        if (!this._events[type]) {
          this._events[type] = [];
        }
        if (!isArray(this._events[type])) {
          this._events[type] = [this._events[type]];
        }
        return this._events[type];
      },
      enumerable: false
    });
    return EventEmitter;
  }

  /**
   * This is used by Android to require "baked-in" source.
   * SDK and module builds will bake in the raw source as c strings, and this will wrap
   * loading that code in via kroll.NativeModule.require(<id>)
   * For more information, see the bootstrap.js.ejs template.
   */
  function NativeModuleBootstrap(global, kroll) {
    const Script = kroll.binding('evals').Script;
    const runInThisContext = Script.runInThisContext;
    function NativeModule(id) {
      this.filename = id + '.js';
      this.id = id;
      this.exports = {};
      this.loaded = false;
    }

    /**
     * This should be an object with string keys (baked in module ids) -> string values (source of the baked in js code)
     */
    NativeModule._source = kroll.binding('natives');
    NativeModule._cache = {};
    NativeModule.require = function (id) {
      if (id === 'native_module') {
        return NativeModule;
      }
      if (id === 'invoker') {
        return invoker; // Android native modules use a bootstrap.js file that assumes there's a builtin 'invoker'
      }

      const cached = NativeModule.getCached(id);
      if (cached) {
        return cached.exports;
      }
      if (!NativeModule.exists(id)) {
        throw new Error('No such native module ' + id);
      }
      const nativeModule = new NativeModule(id);
      nativeModule.compile();
      nativeModule.cache();
      return nativeModule.exports;
    };
    NativeModule.getCached = function (id) {
      return NativeModule._cache[id];
    };
    NativeModule.exists = function (id) {
      return id in NativeModule._source;
    };
    NativeModule.getSource = function (id) {
      return NativeModule._source[id];
    };
    NativeModule.wrap = function (script) {
      return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
    };
    NativeModule.wrapper = ['(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {', '\n});'];
    NativeModule.prototype.compile = function () {
      let source = NativeModule.getSource(this.id);
      source = NativeModule.wrap(source);

      // All native modules have their filename prefixed with ti:/
      const filename = `ti:/${this.filename}`;
      const fn = runInThisContext(source, filename, true);
      fn(this.exports, NativeModule.require, this, this.filename, null, global.Ti, global.Ti, global, kroll);
      this.loaded = true;
    };
    NativeModule.prototype.cache = function () {
      NativeModule._cache[this.id] = this;
    };
    return NativeModule;
  }

  // This is the file each platform loads on boot *before* we launch ti.main.js to insert all our shims/extensions

  /**
   * main bootstrapping function
   * @param {object} global the global object
   * @param {object} kroll; the kroll module/binding
   * @return {void}       [description]
   */
  function bootstrap(global, kroll) {
    // Works identical to Object.hasOwnProperty, except
    // also works if the given object does not have the method
    // on its prototype or it has been masked.
    function hasOwnProperty(object, property) {
      return Object.hasOwnProperty.call(object, property);
    }
    kroll.extend = function (thisObject, otherObject) {
      if (!otherObject) {
        // extend with what?!  denied!
        return;
      }
      for (var name in otherObject) {
        if (hasOwnProperty(otherObject, name)) {
          thisObject[name] = otherObject[name];
        }
      }
      return thisObject;
    };

    /**
     * This is used to shuttle the sourceUrl around to APIs that may need to
     * resolve relative paths based on the invoking file.
     * (see KrollInvocation.java for more)
     * @param {object} vars key/value pairs to store
     * @param {string} vars.sourceUrl the source URL of the file calling the API
     * @constructor
     * @returns {ScopeVars}
     */
    function ScopeVars(vars) {
      if (!vars) {
        return this;
      }
      const keys = Object.keys(vars);
      const length = keys.length;
      for (var i = 0; i < length; ++i) {
        const key = keys[i];
        this[key] = vars[key];
      }
    }
    function startup() {
      global.global = global; // hang the global object off itself
      global.kroll = kroll; // hang our special under the hood kroll object off the global
      {
        kroll.ScopeVars = ScopeVars;
        // external module bootstrap.js expects to call kroll.NativeModule.require directly to load in their own source
        // and to refer to the baked in "bootstrap.js" for the SDK and "invoker.js" to hang lazy APIs/wrap api calls to pass in scope vars
        kroll.NativeModule = NativeModuleBootstrap(global, kroll);
        // Android uses it's own EventEmitter impl, and it's baked right into the proxy class chain
        // It assumes it can call back into java proxies to alert when listeners are added/removed
        // FIXME: Get it to use the events.js impl in the node extension, and get iOS to bake that into it's proxies as well!
        EventEmitterBootstrap(global, kroll);
      }
      global.Ti = global.Titanium = bootstrap$1(global, kroll);
      global.Module = bootstrap$2(global, kroll);
    }
    startup();
  }

  return bootstrap;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q3RDO01BQ0E3RCxNQUFNLENBQUN3SSxFQUFFLEdBQUd4SSxNQUFNLENBQUN1SSxRQUFRLEdBQUcyQixXQUFXLENBQUNsSyxNQUFNLEVBQUU2RCxLQUFLLENBQUM7TUFDeEQ3RCxNQUFNLENBQUNtRSxNQUFNLEdBQUdQLFdBQVcsQ0FBQzVELE1BQU0sRUFBRTZELEtBQUssQ0FBQztJQUM1QztJQUNBNEosT0FBTyxFQUFFO0VBQ1g7O0VBRUEsT0FBT2xILFNBQVM7O0FBRWpCLENBQUMsR0FBRyIsIm5hbWVzIjpbImFzc2VydEFyZ3VtZW50VHlwZSIsImFyZyIsIm5hbWUiLCJ0eXBlbmFtZSIsInR5cGUiLCJ0b0xvd2VyQ2FzZSIsIlR5cGVFcnJvciIsIkZPUldBUkRfU0xBU0giLCJCQUNLV0FSRF9TTEFTSCIsImlzV2luZG93c0RldmljZU5hbWUiLCJjaGFyQ29kZSIsImlzQWJzb2x1dGUiLCJpc1Bvc2l4IiwiZmlsZXBhdGgiLCJsZW5ndGgiLCJmaXJzdENoYXIiLCJjaGFyQ29kZUF0IiwiY2hhckF0IiwidGhpcmRDaGFyIiwiZGlybmFtZSIsInNlcGFyYXRvciIsImZyb21JbmRleCIsImhhZFRyYWlsaW5nIiwiZW5kc1dpdGgiLCJmb3VuZEluZGV4IiwibGFzdEluZGV4T2YiLCJzbGljZSIsImV4dG5hbWUiLCJpbmRleCIsImVuZEluZGV4IiwibGFzdEluZGV4V2luMzJTZXBhcmF0b3IiLCJpIiwiY2hhciIsImJhc2VuYW1lIiwiZXh0IiwidW5kZWZpbmVkIiwibGFzdENoYXJDb2RlIiwibGFzdEluZGV4IiwiYmFzZSIsIm5vcm1hbGl6ZSIsImlzV2luZG93cyIsInJlcGxhY2UiLCJoYWRMZWFkaW5nIiwic3RhcnRzV2l0aCIsImlzVU5DIiwicGFydHMiLCJzcGxpdCIsInJlc3VsdCIsInNlZ21lbnQiLCJwb3AiLCJwdXNoIiwibm9ybWFsaXplZCIsImpvaW4iLCJhc3NlcnRTZWdtZW50IiwicGF0aHMiLCJyZXNvbHZlIiwicmVzb2x2ZWQiLCJoaXRSb290IiwiZ2xvYmFsIiwicHJvY2VzcyIsImN3ZCIsInJlbGF0aXZlIiwiZnJvbSIsInRvIiwidXBDb3VudCIsInJlbWFpbmluZ1BhdGgiLCJyZXBlYXQiLCJwYXJzZSIsInJvb3QiLCJkaXIiLCJiYXNlTGVuZ3RoIiwidG9TdWJ0cmFjdCIsImZpcnN0Q2hhckNvZGUiLCJ0aGlyZENoYXJDb2RlIiwiZm9ybWF0IiwicGF0aE9iamVjdCIsInRvTmFtZXNwYWNlZFBhdGgiLCJyZXNvbHZlZFBhdGgiLCJXaW4zMlBhdGgiLCJzZXAiLCJkZWxpbWl0ZXIiLCJQb3NpeFBhdGgiLCJwYXRoIiwid2luMzIiLCJwb3NpeCIsImludm9rZXIiLCJnZW5JbnZva2VyIiwid3JhcHBlckFQSSIsInJlYWxBUEkiLCJhcGlOYW1lIiwiaW52b2NhdGlvbkFQSSIsInNjb3BlVmFycyIsImFwaU5hbWVzcGFjZSIsIm5hbWVzcGFjZSIsIm5hbWVzIiwiYXBpIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiU2FuZGJveEFQSSIsInByb3RvIiwiZ2V0UHJvdG90eXBlT2YiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsIl9ldmVudHMiLCJzZXQiLCJ2YWx1ZSIsImRlbGVnYXRlIiwiX19kZWxlZ2F0ZV9fIiwiY3JlYXRlSW52b2tlciIsInRoaXNPYmoiLCJ1cmxJbnZva2VyIiwiYXJncyIsInNwbGljZSIsIl9fc2NvcGVWYXJzX18iLCJhcHBseSIsIl9fdGhpc09ial9fIiwiYm9vdHN0cmFwJDIiLCJrcm9sbCIsImFzc2V0cyIsImJpbmRpbmciLCJTY3JpcHQiLCJmaWxlSW5kZXgiLCJJTkRFWF9KU09OIiwiTW9kdWxlIiwiY29uc3RydWN0b3IiLCJpZCIsInBhcmVudCIsImV4cG9ydHMiLCJmaWxlbmFtZSIsImxvYWRlZCIsIndyYXBwZXJDYWNoZSIsImlzU2VydmljZSIsImxvYWQiLCJzb3VyY2UiLCJFcnJvciIsIm5vZGVNb2R1bGVzUGF0aHMiLCJyZWFkQXNzZXQiLCJjYWNoZSIsIl9ydW5TY3JpcHQiLCJjcmVhdGVNb2R1bGVXcmFwcGVyIiwiZXh0ZXJuYWxNb2R1bGUiLCJzb3VyY2VVcmwiLCJNb2R1bGVXcmFwcGVyIiwid3JhcHBlciIsImludm9jYXRpb25BUElzIiwiU2NvcGVWYXJzIiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJmaXJlRXZlbnQiLCJleHRlbmRNb2R1bGVXaXRoQ29tbW9uSnMiLCJpc0V4dGVybmFsQ29tbW9uSnNNb2R1bGUiLCJmYWtlSWQiLCJqc01vZHVsZSIsImdldEV4dGVybmFsQ29tbW9uSnNNb2R1bGUiLCJjb25zb2xlIiwidHJhY2UiLCJleHRlbmQiLCJsb2FkRXh0ZXJuYWxNb2R1bGUiLCJleHRlcm5hbEJpbmRpbmciLCJib290c3RyYXAiLCJtb2R1bGUiLCJyZXF1aXJlIiwicmVxdWVzdCIsInN0YXJ0Iiwic3Vic3RyaW5nIiwibG9hZEFzRmlsZU9yRGlyZWN0b3J5IiwibG9hZENvcmVNb2R1bGUiLCJpbmRleE9mIiwiZmlsZW5hbWVFeGlzdHMiLCJsb2FkSmF2YXNjcmlwdFRleHQiLCJsb2FkQXNEaXJlY3RvcnkiLCJsb2FkTm9kZU1vZHVsZXMiLCJleHRlcm5hbENvbW1vbkpzQ29udGVudHMiLCJtb2R1bGVJZCIsImRpcnMiLCJtb2QiLCJzdGFydERpciIsIm5vcm1hbGl6ZWRQYXRoIiwibG9hZEFzRmlsZSIsImxvYWRKYXZhc2NyaXB0T2JqZWN0IiwiSlNPTiIsIm9iamVjdCIsIm1haW4iLCJtIiwic2VsZiIsImluc3BlY3RvciIsImluc3BlY3RvcldyYXBwZXIiLCJjYWxsQW5kUGF1c2VPblN0YXJ0IiwicnVuSW5UaGlzQ29udGV4dCIsIndyYXAiLCJmIiwiVGl0YW5pdW0iLCJUaSIsImpzb24iLCJzY3JpcHQiLCJydW5Nb2R1bGUiLCJhY3Rpdml0eU9yU2VydmljZSIsIlNlcnZpY2UiLCJBbmRyb2lkIiwid3JpdGFibGUiLCJjb25maWd1cmFibGUiLCJQcm94eUJvb3RzdHJhcCIsInRpQmluZGluZyIsIlByb3h5IiwiZGVmaW5lUHJvcGVydGllcyIsInByb3h5UHJvdG90eXBlIiwicHJvcGVydGllcyIsImxlbiIsImdldFByb3BlcnR5Iiwic2V0UHJvcGVydHlBbmRGaXJlIiwiZW51bWVyYWJsZSIsInByb3BlcnR5IiwiX3Byb3BlcnRpZXMiLCJvd25OYW1lcyIsImdldE93blByb3BlcnR5TmFtZXMiLCJjaGFuZ2VzIiwib2xkVmFsdWUiLCJvblByb3BlcnRpZXNDaGFuZ2VkIiwiYm9vdHN0cmFwJDEiLCJOYXRpdmVNb2R1bGUiLCJkZWZpbmVMYXp5QmluZGluZyIsIlRpdGFuaXVtV3JhcHBlciIsImNvbnRleHQiLCJiaW5kSW52b2NhdGlvbkFQSXMiLCJXcmFwcGVyIiwid3JhcHBlclRpIiwiRXZlbnRFbWl0dGVyQm9vdHN0cmFwIiwiVEFHIiwiRXZlbnRFbWl0dGVyIiwiaXNBcnJheSIsIkFycmF5IiwiaGFuZGxlciIsImRhdGEiLCJoYW5kbGVkIiwiY2FuY2VsQnViYmxlIiwiZXZlbnQiLCJsaXN0ZW5lciIsInZpZXciLCJEQkciLCJsb2ciLCJidWJibGVzIiwiX2ZpcmVTeW5jRXZlbnRUb1BhcmVudCIsImFyZ3VtZW50cyIsImxpc3RlbmVycyIsIl9oYXNKYXZhTGlzdGVuZXIiLCJfb25FdmVudEZpcmVkIiwiY2FsbEhhbmRsZXIiLCJsIiwiZW1pdCIsImxpc3RlbmVyV3JhcHBlciIsIl9oYXNMaXN0ZW5lcnNGb3JFdmVudFR5cGUiLCJhZGRMaXN0ZW5lciIsImciLCJyZW1vdmVMaXN0ZW5lciIsIm9uIiwibGlzdCIsImNvdW50IiwicG9zaXRpb24iLCJOYXRpdmVNb2R1bGVCb290c3RyYXAiLCJfc291cmNlIiwiX2NhY2hlIiwiY2FjaGVkIiwiZ2V0Q2FjaGVkIiwiZXhpc3RzIiwibmF0aXZlTW9kdWxlIiwiY29tcGlsZSIsImdldFNvdXJjZSIsImZuIiwidGhpc09iamVjdCIsIm90aGVyT2JqZWN0IiwidmFycyIsImtleXMiLCJrZXkiLCJzdGFydHVwIl0sInNvdXJjZVJvb3QiOiIvVXNlcnMva3VyeXNoY2h1ay9MaWJyYXJ5L0FwcGxpY2F0aW9uIFN1cHBvcnQvVGl0YW5pdW0vbW9iaWxlc2RrL29zeC8xMi41LjEuR0EvY29tbW9uL1Jlc291cmNlcy9hbmRyb2lkIiwic291cmNlcyI6WyJ0aS5rZXJuZWwuanMiXSwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0gIHsqfSBhcmcgcGFzc2VkIGluIGFyZ3VtZW50IHZhbHVlXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBhcmd1bWVudFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVuYW1lIGkuZS4gJ3N0cmluZycsICdGdW5jdGlvbicgKHZhbHVlIGlzIGNvbXBhcmVkIHRvIHR5cGVvZiBhZnRlciBsb3dlcmNhc2luZylcblx0ICogQHJldHVybiB7dm9pZH1cblx0ICogQHRocm93cyB7VHlwZUVycm9yfVxuXHQgKi9cblx0ZnVuY3Rpb24gYXNzZXJ0QXJndW1lbnRUeXBlKGFyZywgbmFtZSwgdHlwZW5hbWUpIHtcblx0ICBjb25zdCB0eXBlID0gdHlwZW9mIGFyZztcblx0ICBpZiAodHlwZSAhPT0gdHlwZW5hbWUudG9Mb3dlckNhc2UoKSkge1xuXHQgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVGhlIFwiJHtuYW1lfVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSAke3R5cGVuYW1lfS4gUmVjZWl2ZWQgdHlwZSAke3R5cGV9YCk7XG5cdCAgfVxuXHR9XG5cblx0Y29uc3QgRk9SV0FSRF9TTEFTSCA9IDQ3OyAvLyAnLydcblx0Y29uc3QgQkFDS1dBUkRfU0xBU0ggPSA5MjsgLy8gJ1xcXFwnXG5cblx0LyoqXG5cdCAqIElzIHRoaXMgW2EtekEtWl0/XG5cdCAqIEBwYXJhbSAge251bWJlcn0gIGNoYXJDb2RlIHZhbHVlIGZyb20gU3RyaW5nLmNoYXJDb2RlQXQoKVxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRmdW5jdGlvbiBpc1dpbmRvd3NEZXZpY2VOYW1lKGNoYXJDb2RlKSB7XG5cdCAgcmV0dXJuIGNoYXJDb2RlID49IDY1ICYmIGNoYXJDb2RlIDw9IDkwIHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEyMjtcblx0fVxuXG5cdC8qKlxuXHQgKiBbaXNBYnNvbHV0ZSBkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7Ym9vbGVhbn0gaXNQb3NpeCB3aGV0aGVyIHRoaXMgaW1wbCBpcyBmb3IgUE9TSVggb3Igbm90XG5cdCAqIEBwYXJhbSAge3N0cmluZ30gZmlsZXBhdGggICBpbnB1dCBmaWxlIHBhdGhcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0ZnVuY3Rpb24gaXNBYnNvbHV0ZShpc1Bvc2l4LCBmaWxlcGF0aCkge1xuXHQgIGFzc2VydEFyZ3VtZW50VHlwZShmaWxlcGF0aCwgJ3BhdGgnLCAnc3RyaW5nJyk7XG5cdCAgY29uc3QgbGVuZ3RoID0gZmlsZXBhdGgubGVuZ3RoO1xuXHQgIC8vIGVtcHR5IHN0cmluZyBzcGVjaWFsIGNhc2Vcblx0ICBpZiAobGVuZ3RoID09PSAwKSB7XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdCAgfVxuXHQgIGNvbnN0IGZpcnN0Q2hhciA9IGZpbGVwYXRoLmNoYXJDb2RlQXQoMCk7XG5cdCAgaWYgKGZpcnN0Q2hhciA9PT0gRk9SV0FSRF9TTEFTSCkge1xuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfVxuXHQgIC8vIHdlIGFscmVhZHkgZGlkIG91ciBjaGVja3MgZm9yIHBvc2l4XG5cdCAgaWYgKGlzUG9zaXgpIHtcblx0ICAgIHJldHVybiBmYWxzZTtcblx0ICB9XG5cdCAgLy8gd2luMzIgZnJvbSBoZXJlIG9uIG91dFxuXHQgIGlmIChmaXJzdENoYXIgPT09IEJBQ0tXQVJEX1NMQVNIKSB7XG5cdCAgICByZXR1cm4gdHJ1ZTtcblx0ICB9XG5cdCAgaWYgKGxlbmd0aCA+IDIgJiYgaXNXaW5kb3dzRGV2aWNlTmFtZShmaXJzdENoYXIpICYmIGZpbGVwYXRoLmNoYXJBdCgxKSA9PT0gJzonKSB7XG5cdCAgICBjb25zdCB0aGlyZENoYXIgPSBmaWxlcGF0aC5jaGFyQXQoMik7XG5cdCAgICByZXR1cm4gdGhpcmRDaGFyID09PSAnLycgfHwgdGhpcmRDaGFyID09PSAnXFxcXCc7XG5cdCAgfVxuXHQgIHJldHVybiBmYWxzZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBbZGlybmFtZSBkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gZmlsZXBhdGggICBpbnB1dCBmaWxlIHBhdGhcblx0ICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGZ1bmN0aW9uIGRpcm5hbWUoc2VwYXJhdG9yLCBmaWxlcGF0aCkge1xuXHQgIGFzc2VydEFyZ3VtZW50VHlwZShmaWxlcGF0aCwgJ3BhdGgnLCAnc3RyaW5nJyk7XG5cdCAgY29uc3QgbGVuZ3RoID0gZmlsZXBhdGgubGVuZ3RoO1xuXHQgIGlmIChsZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiAnLic7XG5cdCAgfVxuXG5cdCAgLy8gaWdub3JlIHRyYWlsaW5nIHNlcGFyYXRvclxuXHQgIGxldCBmcm9tSW5kZXggPSBsZW5ndGggLSAxO1xuXHQgIGNvbnN0IGhhZFRyYWlsaW5nID0gZmlsZXBhdGguZW5kc1dpdGgoc2VwYXJhdG9yKTtcblx0ICBpZiAoaGFkVHJhaWxpbmcpIHtcblx0ICAgIGZyb21JbmRleC0tO1xuXHQgIH1cblx0ICBjb25zdCBmb3VuZEluZGV4ID0gZmlsZXBhdGgubGFzdEluZGV4T2Yoc2VwYXJhdG9yLCBmcm9tSW5kZXgpO1xuXHQgIC8vIG5vIHNlcGFyYXRvcnNcblx0ICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIHtcblx0ICAgIC8vIGhhbmRsZSBzcGVjaWFsIGNhc2Ugb2Ygcm9vdCB3aW5kb3dzIHBhdGhzXG5cdCAgICBpZiAobGVuZ3RoID49IDIgJiYgc2VwYXJhdG9yID09PSAnXFxcXCcgJiYgZmlsZXBhdGguY2hhckF0KDEpID09PSAnOicpIHtcblx0ICAgICAgY29uc3QgZmlyc3RDaGFyID0gZmlsZXBhdGguY2hhckNvZGVBdCgwKTtcblx0ICAgICAgaWYgKGlzV2luZG93c0RldmljZU5hbWUoZmlyc3RDaGFyKSkge1xuXHQgICAgICAgIHJldHVybiBmaWxlcGF0aDsgLy8gaXQncyBhIHJvb3Qgd2luZG93cyBwYXRoXG5cdCAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgcmV0dXJuICcuJztcblx0ICB9XG5cdCAgLy8gb25seSBmb3VuZCByb290IHNlcGFyYXRvclxuXHQgIGlmIChmb3VuZEluZGV4ID09PSAwKSB7XG5cdCAgICByZXR1cm4gc2VwYXJhdG9yOyAvLyBpZiBpdCB3YXMgJy8nLCByZXR1cm4gdGhhdFxuXHQgIH1cblx0ICAvLyBIYW5kbGUgc3BlY2lhbCBjYXNlIG9mICcvL3NvbWV0aGluZydcblx0ICBpZiAoZm91bmRJbmRleCA9PT0gMSAmJiBzZXBhcmF0b3IgPT09ICcvJyAmJiBmaWxlcGF0aC5jaGFyQXQoMCkgPT09ICcvJykge1xuXHQgICAgcmV0dXJuICcvLyc7XG5cdCAgfVxuXHQgIHJldHVybiBmaWxlcGF0aC5zbGljZSgwLCBmb3VuZEluZGV4KTtcblx0fVxuXG5cdC8qKlxuXHQgKiBbZXh0bmFtZSBkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gZmlsZXBhdGggICBpbnB1dCBmaWxlIHBhdGhcblx0ICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGZ1bmN0aW9uIGV4dG5hbWUoc2VwYXJhdG9yLCBmaWxlcGF0aCkge1xuXHQgIGFzc2VydEFyZ3VtZW50VHlwZShmaWxlcGF0aCwgJ3BhdGgnLCAnc3RyaW5nJyk7XG5cdCAgY29uc3QgaW5kZXggPSBmaWxlcGF0aC5sYXN0SW5kZXhPZignLicpO1xuXHQgIGlmIChpbmRleCA9PT0gLTEgfHwgaW5kZXggPT09IDApIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cdCAgLy8gaWdub3JlIHRyYWlsaW5nIHNlcGFyYXRvclxuXHQgIGxldCBlbmRJbmRleCA9IGZpbGVwYXRoLmxlbmd0aDtcblx0ICBpZiAoZmlsZXBhdGguZW5kc1dpdGgoc2VwYXJhdG9yKSkge1xuXHQgICAgZW5kSW5kZXgtLTtcblx0ICB9XG5cdCAgcmV0dXJuIGZpbGVwYXRoLnNsaWNlKGluZGV4LCBlbmRJbmRleCk7XG5cdH1cblx0ZnVuY3Rpb24gbGFzdEluZGV4V2luMzJTZXBhcmF0b3IoZmlsZXBhdGgsIGluZGV4KSB7XG5cdCAgZm9yIChsZXQgaSA9IGluZGV4OyBpID49IDA7IGktLSkge1xuXHQgICAgY29uc3QgY2hhciA9IGZpbGVwYXRoLmNoYXJDb2RlQXQoaSk7XG5cdCAgICBpZiAoY2hhciA9PT0gQkFDS1dBUkRfU0xBU0ggfHwgY2hhciA9PT0gRk9SV0FSRF9TTEFTSCkge1xuXHQgICAgICByZXR1cm4gaTtcblx0ICAgIH1cblx0ICB9XG5cdCAgcmV0dXJuIC0xO1xuXHR9XG5cblx0LyoqXG5cdCAqIFtiYXNlbmFtZSBkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gZmlsZXBhdGggICBpbnB1dCBmaWxlIHBhdGhcblx0ICogQHBhcmFtICB7c3RyaW5nfSBbZXh0XSAgICAgIGZpbGUgZXh0ZW5zaW9uIHRvIGRyb3AgaWYgaXQgZXhpc3RzXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRmdW5jdGlvbiBiYXNlbmFtZShzZXBhcmF0b3IsIGZpbGVwYXRoLCBleHQpIHtcblx0ICBhc3NlcnRBcmd1bWVudFR5cGUoZmlsZXBhdGgsICdwYXRoJywgJ3N0cmluZycpO1xuXHQgIGlmIChleHQgIT09IHVuZGVmaW5lZCkge1xuXHQgICAgYXNzZXJ0QXJndW1lbnRUeXBlKGV4dCwgJ2V4dCcsICdzdHJpbmcnKTtcblx0ICB9XG5cdCAgY29uc3QgbGVuZ3RoID0gZmlsZXBhdGgubGVuZ3RoO1xuXHQgIGlmIChsZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cdCAgY29uc3QgaXNQb3NpeCA9IHNlcGFyYXRvciA9PT0gJy8nO1xuXHQgIGxldCBlbmRJbmRleCA9IGxlbmd0aDtcblx0ICAvLyBkcm9wIHRyYWlsaW5nIHNlcGFyYXRvciAoaWYgdGhlcmUgaXMgb25lKVxuXHQgIGNvbnN0IGxhc3RDaGFyQ29kZSA9IGZpbGVwYXRoLmNoYXJDb2RlQXQobGVuZ3RoIC0gMSk7XG5cdCAgaWYgKGxhc3RDaGFyQ29kZSA9PT0gRk9SV0FSRF9TTEFTSCB8fCAhaXNQb3NpeCAmJiBsYXN0Q2hhckNvZGUgPT09IEJBQ0tXQVJEX1NMQVNIKSB7XG5cdCAgICBlbmRJbmRleC0tO1xuXHQgIH1cblxuXHQgIC8vIEZpbmQgbGFzdCBvY2N1cmVuY2Ugb2Ygc2VwYXJhdG9yXG5cdCAgbGV0IGxhc3RJbmRleCA9IC0xO1xuXHQgIGlmIChpc1Bvc2l4KSB7XG5cdCAgICBsYXN0SW5kZXggPSBmaWxlcGF0aC5sYXN0SW5kZXhPZihzZXBhcmF0b3IsIGVuZEluZGV4IC0gMSk7XG5cdCAgfSBlbHNlIHtcblx0ICAgIC8vIE9uIHdpbjMyLCBoYW5kbGUgKmVpdGhlciogc2VwYXJhdG9yIVxuXHQgICAgbGFzdEluZGV4ID0gbGFzdEluZGV4V2luMzJTZXBhcmF0b3IoZmlsZXBhdGgsIGVuZEluZGV4IC0gMSk7XG5cdCAgICAvLyBoYW5kbGUgc3BlY2lhbCBjYXNlIG9mIHJvb3QgcGF0aCBsaWtlICdDOicgb3IgJ0M6XFxcXCdcblx0ICAgIGlmICgobGFzdEluZGV4ID09PSAyIHx8IGxhc3RJbmRleCA9PT0gLTEpICYmIGZpbGVwYXRoLmNoYXJBdCgxKSA9PT0gJzonICYmIGlzV2luZG93c0RldmljZU5hbWUoZmlsZXBhdGguY2hhckNvZGVBdCgwKSkpIHtcblx0ICAgICAgcmV0dXJuICcnO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIC8vIFRha2UgZnJvbSBsYXN0IG9jY3VycmVuY2Ugb2Ygc2VwYXJhdG9yIHRvIGVuZCBvZiBzdHJpbmcgKG9yIGJlZ2lubmluZyB0byBlbmQgaWYgbm90IGZvdW5kKVxuXHQgIGNvbnN0IGJhc2UgPSBmaWxlcGF0aC5zbGljZShsYXN0SW5kZXggKyAxLCBlbmRJbmRleCk7XG5cblx0ICAvLyBkcm9wIHRyYWlsaW5nIGV4dGVuc2lvbiAoaWYgc3BlY2lmaWVkKVxuXHQgIGlmIChleHQgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgcmV0dXJuIGJhc2U7XG5cdCAgfVxuXHQgIHJldHVybiBiYXNlLmVuZHNXaXRoKGV4dCkgPyBiYXNlLnNsaWNlKDAsIGJhc2UubGVuZ3RoIC0gZXh0Lmxlbmd0aCkgOiBiYXNlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBgcGF0aC5ub3JtYWxpemUoKWAgbWV0aG9kIG5vcm1hbGl6ZXMgdGhlIGdpdmVuIHBhdGgsIHJlc29sdmluZyAnLi4nIGFuZCAnLicgc2VnbWVudHMuXG5cdCAqXG5cdCAqIFdoZW4gbXVsdGlwbGUsIHNlcXVlbnRpYWwgcGF0aCBzZWdtZW50IHNlcGFyYXRpb24gY2hhcmFjdGVycyBhcmUgZm91bmQgKGUuZy5cblx0ICogLyBvbiBQT1NJWCBhbmQgZWl0aGVyIFxcIG9yIC8gb24gV2luZG93cyksIHRoZXkgYXJlIHJlcGxhY2VkIGJ5IGEgc2luZ2xlXG5cdCAqIGluc3RhbmNlIG9mIHRoZSBwbGF0Zm9ybS1zcGVjaWZpYyBwYXRoIHNlZ21lbnQgc2VwYXJhdG9yICgvIG9uIFBPU0lYIGFuZCBcXFxuXHQgKiBvbiBXaW5kb3dzKS4gVHJhaWxpbmcgc2VwYXJhdG9ycyBhcmUgcHJlc2VydmVkLlxuXHQgKlxuXHQgKiBJZiB0aGUgcGF0aCBpcyBhIHplcm8tbGVuZ3RoIHN0cmluZywgJy4nIGlzIHJldHVybmVkLCByZXByZXNlbnRpbmcgdGhlXG5cdCAqIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXG5cdCAqXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gc2VwYXJhdG9yICBwbGF0Zm9ybS1zcGVjaWZpYyBmaWxlIHNlcGFyYXRvclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGZpbGVwYXRoICBpbnB1dCBmaWxlIHBhdGhcblx0ICogQHJldHVybiB7c3RyaW5nfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRmdW5jdGlvbiBub3JtYWxpemUoc2VwYXJhdG9yLCBmaWxlcGF0aCkge1xuXHQgIGFzc2VydEFyZ3VtZW50VHlwZShmaWxlcGF0aCwgJ3BhdGgnLCAnc3RyaW5nJyk7XG5cdCAgaWYgKGZpbGVwYXRoLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuICcuJztcblx0ICB9XG5cblx0ICAvLyBXaW5kb3dzIGNhbiBoYW5kbGUgJy8nIG9yICdcXFxcJyBhbmQgYm90aCBzaG91bGQgYmUgdHVybmVkIGludG8gc2VwYXJhdG9yXG5cdCAgY29uc3QgaXNXaW5kb3dzID0gc2VwYXJhdG9yID09PSAnXFxcXCc7XG5cdCAgaWYgKGlzV2luZG93cykge1xuXHQgICAgZmlsZXBhdGggPSBmaWxlcGF0aC5yZXBsYWNlKC9cXC8vZywgc2VwYXJhdG9yKTtcblx0ICB9XG5cdCAgY29uc3QgaGFkTGVhZGluZyA9IGZpbGVwYXRoLnN0YXJ0c1dpdGgoc2VwYXJhdG9yKTtcblx0ICAvLyBPbiBXaW5kb3dzLCBuZWVkIHRvIGhhbmRsZSBVTkMgcGF0aHMgKFxcXFxob3N0LW5hbWVcXFxccmVzb3VyY2VcXFxcZGlyKSBzcGVjaWFsIHRvIHJldGFpbiBsZWFkaW5nIGRvdWJsZSBiYWNrc2xhc2hcblx0ICBjb25zdCBpc1VOQyA9IGhhZExlYWRpbmcgJiYgaXNXaW5kb3dzICYmIGZpbGVwYXRoLmxlbmd0aCA+IDIgJiYgZmlsZXBhdGguY2hhckF0KDEpID09PSAnXFxcXCc7XG5cdCAgY29uc3QgaGFkVHJhaWxpbmcgPSBmaWxlcGF0aC5lbmRzV2l0aChzZXBhcmF0b3IpO1xuXHQgIGNvbnN0IHBhcnRzID0gZmlsZXBhdGguc3BsaXQoc2VwYXJhdG9yKTtcblx0ICBjb25zdCByZXN1bHQgPSBbXTtcblx0ICBmb3IgKGNvbnN0IHNlZ21lbnQgb2YgcGFydHMpIHtcblx0ICAgIGlmIChzZWdtZW50Lmxlbmd0aCAhPT0gMCAmJiBzZWdtZW50ICE9PSAnLicpIHtcblx0ICAgICAgaWYgKHNlZ21lbnQgPT09ICcuLicpIHtcblx0ICAgICAgICByZXN1bHQucG9wKCk7IC8vIEZJWE1FOiBXaGF0IGlmIHRoaXMgZ29lcyBhYm92ZSByb290PyBTaG91bGQgd2UgdGhyb3cgYW4gZXJyb3I/XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmVzdWx0LnB1c2goc2VnbWVudCk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9XG5cdCAgbGV0IG5vcm1hbGl6ZWQgPSBoYWRMZWFkaW5nID8gc2VwYXJhdG9yIDogJyc7XG5cdCAgbm9ybWFsaXplZCArPSByZXN1bHQuam9pbihzZXBhcmF0b3IpO1xuXHQgIGlmIChoYWRUcmFpbGluZykge1xuXHQgICAgbm9ybWFsaXplZCArPSBzZXBhcmF0b3I7XG5cdCAgfVxuXHQgIGlmIChpc1VOQykge1xuXHQgICAgbm9ybWFsaXplZCA9ICdcXFxcJyArIG5vcm1hbGl6ZWQ7XG5cdCAgfVxuXHQgIHJldHVybiBub3JtYWxpemVkO1xuXHR9XG5cblx0LyoqXG5cdCAqIFthc3NlcnRTZWdtZW50IGRlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHsqfSBzZWdtZW50IFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7dm9pZH0gICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRmdW5jdGlvbiBhc3NlcnRTZWdtZW50KHNlZ21lbnQpIHtcblx0ICBpZiAodHlwZW9mIHNlZ21lbnQgIT09ICdzdHJpbmcnKSB7XG5cdCAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICR7c2VnbWVudH1gKTtcblx0ICB9XG5cdH1cblxuXHQvKipcblx0ICogVGhlIGBwYXRoLmpvaW4oKWAgbWV0aG9kIGpvaW5zIGFsbCBnaXZlbiBwYXRoIHNlZ21lbnRzIHRvZ2V0aGVyIHVzaW5nIHRoZVxuXHQgKiBwbGF0Zm9ybS1zcGVjaWZpYyBzZXBhcmF0b3IgYXMgYSBkZWxpbWl0ZXIsIHRoZW4gbm9ybWFsaXplcyB0aGUgcmVzdWx0aW5nIHBhdGguXG5cdCAqIFplcm8tbGVuZ3RoIHBhdGggc2VnbWVudHMgYXJlIGlnbm9yZWQuIElmIHRoZSBqb2luZWQgcGF0aCBzdHJpbmcgaXMgYSB6ZXJvLVxuXHQgKiBsZW5ndGggc3RyaW5nIHRoZW4gJy4nIHdpbGwgYmUgcmV0dXJuZWQsIHJlcHJlc2VudGluZyB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgcGxhdGZvcm0tc3BlY2lmaWMgZmlsZSBzZXBhcmF0b3Jcblx0ICogQHBhcmFtICB7c3RyaW5nW119IHBhdGhzIFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7c3RyaW5nfSAgICAgICBUaGUgam9pbmVkIGZpbGVwYXRoXG5cdCAqL1xuXHRmdW5jdGlvbiBqb2luKHNlcGFyYXRvciwgcGF0aHMpIHtcblx0ICBjb25zdCByZXN1bHQgPSBbXTtcblx0ICAvLyBuYWl2ZSBpbXBsOiBqdXN0IGpvaW4gYWxsIHRoZSBwYXRocyB3aXRoIHNlcGFyYXRvclxuXHQgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBwYXRocykge1xuXHQgICAgYXNzZXJ0U2VnbWVudChzZWdtZW50KTtcblx0ICAgIGlmIChzZWdtZW50Lmxlbmd0aCAhPT0gMCkge1xuXHQgICAgICByZXN1bHQucHVzaChzZWdtZW50KTtcblx0ICAgIH1cblx0ICB9XG5cdCAgcmV0dXJuIG5vcm1hbGl6ZShzZXBhcmF0b3IsIHJlc3VsdC5qb2luKHNlcGFyYXRvcikpO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBgcGF0aC5yZXNvbHZlKClgIG1ldGhvZCByZXNvbHZlcyBhIHNlcXVlbmNlIG9mIHBhdGhzIG9yIHBhdGggc2VnbWVudHMgaW50byBhbiBhYnNvbHV0ZSBwYXRoLlxuXHQgKlxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHNlcGFyYXRvciBwbGF0Zm9ybS1zcGVjaWZpYyBmaWxlIHNlcGFyYXRvclxuXHQgKiBAcGFyYW0gIHtzdHJpbmdbXX0gcGF0aHMgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGZ1bmN0aW9uIHJlc29sdmUoc2VwYXJhdG9yLCBwYXRocykge1xuXHQgIGxldCByZXNvbHZlZCA9ICcnO1xuXHQgIGxldCBoaXRSb290ID0gZmFsc2U7XG5cdCAgY29uc3QgaXNQb3NpeCA9IHNlcGFyYXRvciA9PT0gJy8nO1xuXHQgIC8vIGdvIGZyb20gcmlnaHQgdG8gbGVmdCB1bnRpbCB3ZSBoaXQgYWJzb2x1dGUgcGF0aC9yb290XG5cdCAgZm9yIChsZXQgaSA9IHBhdGhzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdCAgICBjb25zdCBzZWdtZW50ID0gcGF0aHNbaV07XG5cdCAgICBhc3NlcnRTZWdtZW50KHNlZ21lbnQpO1xuXHQgICAgaWYgKHNlZ21lbnQubGVuZ3RoID09PSAwKSB7XG5cdCAgICAgIGNvbnRpbnVlOyAvLyBza2lwIGVtcHR5XG5cdCAgICB9XG5cblx0ICAgIHJlc29sdmVkID0gc2VnbWVudCArIHNlcGFyYXRvciArIHJlc29sdmVkOyAvLyBwcmVwZW5kIG5ldyBzZWdtZW50XG5cdCAgICBpZiAoaXNBYnNvbHV0ZShpc1Bvc2l4LCBzZWdtZW50KSkge1xuXHQgICAgICAvLyBoYXZlIHdlIGJhY2tlZCBpbnRvIGFuIGFic29sdXRlIHBhdGg/XG5cdCAgICAgIGhpdFJvb3QgPSB0cnVlO1xuXHQgICAgICBicmVhaztcblx0ICAgIH1cblx0ICB9XG5cdCAgLy8gaWYgd2UgZGlkbid0IGhpdCByb290LCBwcmVwZW5kIGN3ZFxuXHQgIGlmICghaGl0Um9vdCkge1xuXHQgICAgcmVzb2x2ZWQgPSAoZ2xvYmFsLnByb2Nlc3MgPyBwcm9jZXNzLmN3ZCgpIDogJy8nKSArIHNlcGFyYXRvciArIHJlc29sdmVkO1xuXHQgIH1cblx0ICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplKHNlcGFyYXRvciwgcmVzb2x2ZWQpO1xuXHQgIGlmIChub3JtYWxpemVkLmNoYXJBdChub3JtYWxpemVkLmxlbmd0aCAtIDEpID09PSBzZXBhcmF0b3IpIHtcblx0ICAgIC8vIEZJWE1FOiBIYW5kbGUgVU5DIHBhdGhzIG9uIFdpbmRvd3MgYXMgd2VsbCwgc28gd2UgZG9uJ3QgdHJpbSB0cmFpbGluZyBzZXBhcmF0b3Igb24gc29tZXRoaW5nIGxpa2UgJ1xcXFxcXFxcaG9zdC1uYW1lXFxcXHJlc291cmNlXFxcXCdcblx0ICAgIC8vIERvbid0IHJlbW92ZSB0cmFpbGluZyBzZXBhcmF0b3IgaWYgdGhpcyBpcyByb290IHBhdGggb24gd2luZG93cyFcblx0ICAgIGlmICghaXNQb3NpeCAmJiBub3JtYWxpemVkLmxlbmd0aCA9PT0gMyAmJiBub3JtYWxpemVkLmNoYXJBdCgxKSA9PT0gJzonICYmIGlzV2luZG93c0RldmljZU5hbWUobm9ybWFsaXplZC5jaGFyQ29kZUF0KDApKSkge1xuXHQgICAgICByZXR1cm4gbm9ybWFsaXplZDtcblx0ICAgIH1cblx0ICAgIC8vIG90aGVyd2lzZSB0cmltIHRyYWlsaW5nIHNlcGFyYXRvclxuXHQgICAgcmV0dXJuIG5vcm1hbGl6ZWQuc2xpY2UoMCwgbm9ybWFsaXplZC5sZW5ndGggLSAxKTtcblx0ICB9XG5cdCAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG5cdH1cblxuXHQvKipcblx0ICogVGhlIGBwYXRoLnJlbGF0aXZlKClgIG1ldGhvZCByZXR1cm5zIHRoZSByZWxhdGl2ZSBwYXRoIGBmcm9tYCBmcm9tIHRvIGB0b2AgYmFzZWRcblx0ICogb24gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuIElmIGZyb20gYW5kIHRvIGVhY2ggcmVzb2x2ZSB0byB0aGUgc2FtZVxuXHQgKiBwYXRoIChhZnRlciBjYWxsaW5nIGBwYXRoLnJlc29sdmUoKWAgb24gZWFjaCksIGEgemVyby1sZW5ndGggc3RyaW5nIGlzIHJldHVybmVkLlxuXHQgKlxuXHQgKiBJZiBhIHplcm8tbGVuZ3RoIHN0cmluZyBpcyBwYXNzZWQgYXMgYGZyb21gIG9yIGB0b2AsIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5XG5cdCAqIHdpbGwgYmUgdXNlZCBpbnN0ZWFkIG9mIHRoZSB6ZXJvLWxlbmd0aCBzdHJpbmdzLlxuXHQgKlxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHNlcGFyYXRvciBwbGF0Zm9ybS1zcGVjaWZpYyBmaWxlIHNlcGFyYXRvclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGZyb20gW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHRvICAgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0ZnVuY3Rpb24gcmVsYXRpdmUoc2VwYXJhdG9yLCBmcm9tLCB0bykge1xuXHQgIGFzc2VydEFyZ3VtZW50VHlwZShmcm9tLCAnZnJvbScsICdzdHJpbmcnKTtcblx0ICBhc3NlcnRBcmd1bWVudFR5cGUodG8sICd0bycsICdzdHJpbmcnKTtcblx0ICBpZiAoZnJvbSA9PT0gdG8pIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cdCAgZnJvbSA9IHJlc29sdmUoc2VwYXJhdG9yLCBbZnJvbV0pO1xuXHQgIHRvID0gcmVzb2x2ZShzZXBhcmF0b3IsIFt0b10pO1xuXHQgIGlmIChmcm9tID09PSB0bykge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH1cblxuXHQgIC8vIHdlIG5vdyBoYXZlIHR3byBhYnNvbHV0ZSBwYXRocyxcblx0ICAvLyBsZXRzIFwiZ28gdXBcIiBmcm9tIGBmcm9tYCB1bnRpbCB3ZSByZWFjaCBjb21tb24gYmFzZSBkaXIgb2YgYHRvYFxuXHQgIC8vIGNvbnN0IG9yaWdpbmFsRnJvbSA9IGZyb207XG5cdCAgbGV0IHVwQ291bnQgPSAwO1xuXHQgIGxldCByZW1haW5pbmdQYXRoID0gJyc7XG5cdCAgd2hpbGUgKHRydWUpIHtcblx0ICAgIGlmICh0by5zdGFydHNXaXRoKGZyb20pKSB7XG5cdCAgICAgIC8vIG1hdGNoISByZWNvcmQgcmVzdC4uLj9cblx0ICAgICAgcmVtYWluaW5nUGF0aCA9IHRvLnNsaWNlKGZyb20ubGVuZ3RoKTtcblx0ICAgICAgYnJlYWs7XG5cdCAgICB9XG5cdCAgICAvLyBGSVhNRTogQnJlYWsvdGhyb3cgaWYgd2UgaGl0IGJhZCBlZGdlIGNhc2Ugb2Ygbm8gY29tbW9uIHJvb3QhXG5cdCAgICBmcm9tID0gZGlybmFtZShzZXBhcmF0b3IsIGZyb20pO1xuXHQgICAgdXBDb3VudCsrO1xuXHQgIH1cblx0ICAvLyByZW1vdmUgbGVhZGluZyBzZXBhcmF0b3IgZnJvbSByZW1haW5pbmdQYXRoIGlmIHRoZXJlIGlzIGFueVxuXHQgIGlmIChyZW1haW5pbmdQYXRoLmxlbmd0aCA+IDApIHtcblx0ICAgIHJlbWFpbmluZ1BhdGggPSByZW1haW5pbmdQYXRoLnNsaWNlKDEpO1xuXHQgIH1cblx0ICByZXR1cm4gKCcuLicgKyBzZXBhcmF0b3IpLnJlcGVhdCh1cENvdW50KSArIHJlbWFpbmluZ1BhdGg7XG5cdH1cblxuXHQvKipcblx0ICogVGhlIGBwYXRoLnBhcnNlKClgIG1ldGhvZCByZXR1cm5zIGFuIG9iamVjdCB3aG9zZSBwcm9wZXJ0aWVzIHJlcHJlc2VudFxuXHQgKiBzaWduaWZpY2FudCBlbGVtZW50cyBvZiB0aGUgcGF0aC4gVHJhaWxpbmcgZGlyZWN0b3J5IHNlcGFyYXRvcnMgYXJlIGlnbm9yZWQsXG5cdCAqIHNlZSBgcGF0aC5zZXBgLlxuXHQgKlxuXHQgKiBUaGUgcmV0dXJuZWQgb2JqZWN0IHdpbGwgaGF2ZSB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG5cdCAqXG5cdCAqIC0gZGlyIDxzdHJpbmc+XG5cdCAqIC0gcm9vdCA8c3RyaW5nPlxuXHQgKiAtIGJhc2UgPHN0cmluZz5cblx0ICogLSBuYW1lIDxzdHJpbmc+XG5cdCAqIC0gZXh0IDxzdHJpbmc+XG5cdCAqIEBwYXJhbSAge3N0cmluZ30gc2VwYXJhdG9yIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gZmlsZXBhdGggW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtvYmplY3R9XG5cdCAqL1xuXHRmdW5jdGlvbiBwYXJzZShzZXBhcmF0b3IsIGZpbGVwYXRoKSB7XG5cdCAgYXNzZXJ0QXJndW1lbnRUeXBlKGZpbGVwYXRoLCAncGF0aCcsICdzdHJpbmcnKTtcblx0ICBjb25zdCByZXN1bHQgPSB7XG5cdCAgICByb290OiAnJyxcblx0ICAgIGRpcjogJycsXG5cdCAgICBiYXNlOiAnJyxcblx0ICAgIGV4dDogJycsXG5cdCAgICBuYW1lOiAnJ1xuXHQgIH07XG5cdCAgY29uc3QgbGVuZ3RoID0gZmlsZXBhdGgubGVuZ3RoO1xuXHQgIGlmIChsZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdCAgfVxuXG5cdCAgLy8gQ2hlYXQgYW5kIGp1c3QgY2FsbCBvdXIgb3RoZXIgbWV0aG9kcyBmb3IgZGlybmFtZS9iYXNlbmFtZS9leHRuYW1lP1xuXHQgIHJlc3VsdC5iYXNlID0gYmFzZW5hbWUoc2VwYXJhdG9yLCBmaWxlcGF0aCk7XG5cdCAgcmVzdWx0LmV4dCA9IGV4dG5hbWUoc2VwYXJhdG9yLCByZXN1bHQuYmFzZSk7XG5cdCAgY29uc3QgYmFzZUxlbmd0aCA9IHJlc3VsdC5iYXNlLmxlbmd0aDtcblx0ICByZXN1bHQubmFtZSA9IHJlc3VsdC5iYXNlLnNsaWNlKDAsIGJhc2VMZW5ndGggLSByZXN1bHQuZXh0Lmxlbmd0aCk7XG5cdCAgY29uc3QgdG9TdWJ0cmFjdCA9IGJhc2VMZW5ndGggPT09IDAgPyAwIDogYmFzZUxlbmd0aCArIDE7XG5cdCAgcmVzdWx0LmRpciA9IGZpbGVwYXRoLnNsaWNlKDAsIGZpbGVwYXRoLmxlbmd0aCAtIHRvU3VidHJhY3QpOyAvLyBkcm9wIHRyYWlsaW5nIHNlcGFyYXRvciFcblx0ICBjb25zdCBmaXJzdENoYXJDb2RlID0gZmlsZXBhdGguY2hhckNvZGVBdCgwKTtcblx0ICAvLyBib3RoIHdpbjMyIGFuZCBQT1NJWCByZXR1cm4gJy8nIHJvb3Rcblx0ICBpZiAoZmlyc3RDaGFyQ29kZSA9PT0gRk9SV0FSRF9TTEFTSCkge1xuXHQgICAgcmVzdWx0LnJvb3QgPSAnLyc7XG5cdCAgICByZXR1cm4gcmVzdWx0O1xuXHQgIH1cblx0ICAvLyB3ZSdyZSBkb25lIHdpdGggUE9TSVguLi5cblx0ICBpZiAoc2VwYXJhdG9yID09PSAnLycpIHtcblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdCAgfVxuXHQgIC8vIGZvciB3aW4zMi4uLlxuXHQgIGlmIChmaXJzdENoYXJDb2RlID09PSBCQUNLV0FSRF9TTEFTSCkge1xuXHQgICAgLy8gRklYTUU6IEhhbmRsZSBVTkMgcGF0aHMgbGlrZSAnXFxcXFxcXFxob3N0LW5hbWVcXFxccmVzb3VyY2VcXFxcZmlsZV9wYXRoJ1xuXHQgICAgLy8gbmVlZCB0byByZXRhaW4gJ1xcXFxcXFxcaG9zdC1uYW1lXFxcXHJlc291cmNlXFxcXCcgYXMgcm9vdCBpbiB0aGF0IGNhc2UhXG5cdCAgICByZXN1bHQucm9vdCA9ICdcXFxcJztcblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdCAgfVxuXHQgIC8vIGNoZWNrIGZvciBDOiBzdHlsZSByb290XG5cdCAgaWYgKGxlbmd0aCA+IDEgJiYgaXNXaW5kb3dzRGV2aWNlTmFtZShmaXJzdENoYXJDb2RlKSAmJiBmaWxlcGF0aC5jaGFyQXQoMSkgPT09ICc6Jykge1xuXHQgICAgaWYgKGxlbmd0aCA+IDIpIHtcblx0ICAgICAgLy8gaXMgaXQgbGlrZSBDOlxcXFw/XG5cdCAgICAgIGNvbnN0IHRoaXJkQ2hhckNvZGUgPSBmaWxlcGF0aC5jaGFyQ29kZUF0KDIpO1xuXHQgICAgICBpZiAodGhpcmRDaGFyQ29kZSA9PT0gRk9SV0FSRF9TTEFTSCB8fCB0aGlyZENoYXJDb2RlID09PSBCQUNLV0FSRF9TTEFTSCkge1xuXHQgICAgICAgIHJlc3VsdC5yb290ID0gZmlsZXBhdGguc2xpY2UoMCwgMyk7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdDtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgICAgLy8gbm9wZSwganVzdCBDOiwgbm8gdHJhaWxpbmcgc2VwYXJhdG9yXG5cdCAgICByZXN1bHQucm9vdCA9IGZpbGVwYXRoLnNsaWNlKDAsIDIpO1xuXHQgIH1cblx0ICByZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoZSBgcGF0aC5mb3JtYXQoKWAgbWV0aG9kIHJldHVybnMgYSBwYXRoIHN0cmluZyBmcm9tIGFuIG9iamVjdC4gVGhpcyBpcyB0aGVcblx0ICogb3Bwb3NpdGUgb2YgYHBhdGgucGFyc2UoKWAuXG5cdCAqXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gc2VwYXJhdG9yIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge29iamVjdH0gcGF0aE9iamVjdCBvYmplY3Qgb2YgZm9ybWF0IHJldHVybmVkIGJ5IGBwYXRoLnBhcnNlKClgXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gcGF0aE9iamVjdC5kaXIgZGlyZWN0b3J5IG5hbWVcblx0ICogQHBhcmFtICB7c3RyaW5nfSBwYXRoT2JqZWN0LnJvb3QgZmlsZSByb290IGRpciwgaWdub3JlZCBpZiBgcGF0aE9iamVjdC5kaXJgIGlzIHByb3ZpZGVkXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gcGF0aE9iamVjdC5iYXNlIGZpbGUgYmFzZW5hbWVcblx0ICogQHBhcmFtICB7c3RyaW5nfSBwYXRoT2JqZWN0Lm5hbWUgYmFzZW5hbWUgbWludXMgZXh0ZW5zaW9uLCBpZ25vcmVkIGlmIGBwYXRoT2JqZWN0LmJhc2VgIGV4aXN0c1xuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHBhdGhPYmplY3QuZXh0IGZpbGUgZXh0ZW5zaW9uLCBpZ25vcmVkIGlmIGBwYXRoT2JqZWN0LmJhc2VgIGV4aXN0c1xuXHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdCAqL1xuXHRmdW5jdGlvbiBmb3JtYXQoc2VwYXJhdG9yLCBwYXRoT2JqZWN0KSB7XG5cdCAgYXNzZXJ0QXJndW1lbnRUeXBlKHBhdGhPYmplY3QsICdwYXRoT2JqZWN0JywgJ29iamVjdCcpO1xuXHQgIGNvbnN0IGJhc2UgPSBwYXRoT2JqZWN0LmJhc2UgfHwgYCR7cGF0aE9iamVjdC5uYW1lIHx8ICcnfSR7cGF0aE9iamVjdC5leHQgfHwgJyd9YDtcblxuXHQgIC8vIGFwcGVuZCBiYXNlIHRvIHJvb3QgaWYgYGRpcmAgd2Fzbid0IHNwZWNpZmllZCwgb3IgaWZcblx0ICAvLyBkaXIgaXMgdGhlIHJvb3Rcblx0ICBpZiAoIXBhdGhPYmplY3QuZGlyIHx8IHBhdGhPYmplY3QuZGlyID09PSBwYXRoT2JqZWN0LnJvb3QpIHtcblx0ICAgIHJldHVybiBgJHtwYXRoT2JqZWN0LnJvb3QgfHwgJyd9JHtiYXNlfWA7XG5cdCAgfVxuXHQgIC8vIGNvbWJpbmUgZGlyICsgLyArIGJhc2Vcblx0ICByZXR1cm4gYCR7cGF0aE9iamVjdC5kaXJ9JHtzZXBhcmF0b3J9JHtiYXNlfWA7XG5cdH1cblxuXHQvKipcblx0ICogT24gV2luZG93cyBzeXN0ZW1zIG9ubHksIHJldHVybnMgYW4gZXF1aXZhbGVudCBuYW1lc3BhY2UtcHJlZml4ZWQgcGF0aCBmb3Jcblx0ICogdGhlIGdpdmVuIHBhdGguIElmIHBhdGggaXMgbm90IGEgc3RyaW5nLCBwYXRoIHdpbGwgYmUgcmV0dXJuZWQgd2l0aG91dCBtb2RpZmljYXRpb25zLlxuXHQgKiBTZWUgaHR0cHM6Ly9kb2NzLm1pY3Jvc29mdC5jb20vZW4tdXMvd2luZG93cy9kZXNrdG9wL0ZpbGVJTy9uYW1pbmctYS1maWxlI25hbWVzcGFjZXNcblx0ICogQHBhcmFtICB7c3RyaW5nfSBmaWxlcGF0aCBbZGVzY3JpcHRpb25dXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2VkUGF0aChmaWxlcGF0aCkge1xuXHQgIGlmICh0eXBlb2YgZmlsZXBhdGggIT09ICdzdHJpbmcnKSB7XG5cdCAgICByZXR1cm4gZmlsZXBhdGg7XG5cdCAgfVxuXHQgIGlmIChmaWxlcGF0aC5sZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cdCAgY29uc3QgcmVzb2x2ZWRQYXRoID0gcmVzb2x2ZSgnXFxcXCcsIFtmaWxlcGF0aF0pO1xuXHQgIGNvbnN0IGxlbmd0aCA9IHJlc29sdmVkUGF0aC5sZW5ndGg7XG5cdCAgaWYgKGxlbmd0aCA8IDIpIHtcblx0ICAgIC8vIG5lZWQgJ1xcXFxcXFxcJyBvciAnQzonIG1pbmltdW1cblx0ICAgIHJldHVybiBmaWxlcGF0aDtcblx0ICB9XG5cdCAgY29uc3QgZmlyc3RDaGFyQ29kZSA9IHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDApO1xuXHQgIC8vIGlmIHN0YXJ0IHdpdGggJ1xcXFxcXFxcJywgcHJlZml4IHdpdGggVU5DIHJvb3QsIGRyb3AgdGhlIHNsYXNoZXNcblx0ICBpZiAoZmlyc3RDaGFyQ29kZSA9PT0gQkFDS1dBUkRfU0xBU0ggJiYgcmVzb2x2ZWRQYXRoLmNoYXJBdCgxKSA9PT0gJ1xcXFwnKSB7XG5cdCAgICAvLyByZXR1cm4gYXMtaXMgaWYgaXQncyBhbiBhcmVhZHkgbG9uZyBwYXRoICgnXFxcXFxcXFw/XFxcXCcgb3IgJ1xcXFxcXFxcLlxcXFwnIHByZWZpeClcblx0ICAgIGlmIChsZW5ndGggPj0gMykge1xuXHQgICAgICBjb25zdCB0aGlyZENoYXIgPSByZXNvbHZlZFBhdGguY2hhckF0KDIpO1xuXHQgICAgICBpZiAodGhpcmRDaGFyID09PSAnPycgfHwgdGhpcmRDaGFyID09PSAnLicpIHtcblx0ICAgICAgICByZXR1cm4gZmlsZXBhdGg7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICAgIHJldHVybiAnXFxcXFxcXFw/XFxcXFVOQ1xcXFwnICsgcmVzb2x2ZWRQYXRoLnNsaWNlKDIpO1xuXHQgIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlTmFtZShmaXJzdENoYXJDb2RlKSAmJiByZXNvbHZlZFBhdGguY2hhckF0KDEpID09PSAnOicpIHtcblx0ICAgIHJldHVybiAnXFxcXFxcXFw/XFxcXCcgKyByZXNvbHZlZFBhdGg7XG5cdCAgfVxuXHQgIHJldHVybiBmaWxlcGF0aDtcblx0fVxuXHRjb25zdCBXaW4zMlBhdGggPSB7XG5cdCAgc2VwOiAnXFxcXCcsXG5cdCAgZGVsaW1pdGVyOiAnOycsXG5cdCAgYmFzZW5hbWU6IGZ1bmN0aW9uIChmaWxlcGF0aCwgZXh0KSB7XG5cdCAgICByZXR1cm4gYmFzZW5hbWUodGhpcy5zZXAsIGZpbGVwYXRoLCBleHQpO1xuXHQgIH0sXG5cdCAgbm9ybWFsaXplOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBub3JtYWxpemUodGhpcy5zZXAsIGZpbGVwYXRoKTtcblx0ICB9LFxuXHQgIGpvaW46IGZ1bmN0aW9uICguLi5wYXRocykge1xuXHQgICAgcmV0dXJuIGpvaW4odGhpcy5zZXAsIHBhdGhzKTtcblx0ICB9LFxuXHQgIGV4dG5hbWU6IGZ1bmN0aW9uIChmaWxlcGF0aCkge1xuXHQgICAgcmV0dXJuIGV4dG5hbWUodGhpcy5zZXAsIGZpbGVwYXRoKTtcblx0ICB9LFxuXHQgIGRpcm5hbWU6IGZ1bmN0aW9uIChmaWxlcGF0aCkge1xuXHQgICAgcmV0dXJuIGRpcm5hbWUodGhpcy5zZXAsIGZpbGVwYXRoKTtcblx0ICB9LFxuXHQgIGlzQWJzb2x1dGU6IGZ1bmN0aW9uIChmaWxlcGF0aCkge1xuXHQgICAgcmV0dXJuIGlzQWJzb2x1dGUoZmFsc2UsIGZpbGVwYXRoKTtcblx0ICB9LFxuXHQgIHJlbGF0aXZlOiBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcblx0ICAgIHJldHVybiByZWxhdGl2ZSh0aGlzLnNlcCwgZnJvbSwgdG8pO1xuXHQgIH0sXG5cdCAgcmVzb2x2ZTogZnVuY3Rpb24gKC4uLnBhdGhzKSB7XG5cdCAgICByZXR1cm4gcmVzb2x2ZSh0aGlzLnNlcCwgcGF0aHMpO1xuXHQgIH0sXG5cdCAgcGFyc2U6IGZ1bmN0aW9uIChmaWxlcGF0aCkge1xuXHQgICAgcmV0dXJuIHBhcnNlKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBmb3JtYXQ6IGZ1bmN0aW9uIChwYXRoT2JqZWN0KSB7XG5cdCAgICByZXR1cm4gZm9ybWF0KHRoaXMuc2VwLCBwYXRoT2JqZWN0KTtcblx0ICB9LFxuXHQgIHRvTmFtZXNwYWNlZFBhdGg6IHRvTmFtZXNwYWNlZFBhdGhcblx0fTtcblx0Y29uc3QgUG9zaXhQYXRoID0ge1xuXHQgIHNlcDogJy8nLFxuXHQgIGRlbGltaXRlcjogJzonLFxuXHQgIGJhc2VuYW1lOiBmdW5jdGlvbiAoZmlsZXBhdGgsIGV4dCkge1xuXHQgICAgcmV0dXJuIGJhc2VuYW1lKHRoaXMuc2VwLCBmaWxlcGF0aCwgZXh0KTtcblx0ICB9LFxuXHQgIG5vcm1hbGl6ZTogZnVuY3Rpb24gKGZpbGVwYXRoKSB7XG5cdCAgICByZXR1cm4gbm9ybWFsaXplKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBqb2luOiBmdW5jdGlvbiAoLi4ucGF0aHMpIHtcblx0ICAgIHJldHVybiBqb2luKHRoaXMuc2VwLCBwYXRocyk7XG5cdCAgfSxcblx0ICBleHRuYW1lOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBleHRuYW1lKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBkaXJuYW1lOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBkaXJuYW1lKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBpc0Fic29sdXRlOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBpc0Fic29sdXRlKHRydWUsIGZpbGVwYXRoKTtcblx0ICB9LFxuXHQgIHJlbGF0aXZlOiBmdW5jdGlvbiAoZnJvbSwgdG8pIHtcblx0ICAgIHJldHVybiByZWxhdGl2ZSh0aGlzLnNlcCwgZnJvbSwgdG8pO1xuXHQgIH0sXG5cdCAgcmVzb2x2ZTogZnVuY3Rpb24gKC4uLnBhdGhzKSB7XG5cdCAgICByZXR1cm4gcmVzb2x2ZSh0aGlzLnNlcCwgcGF0aHMpO1xuXHQgIH0sXG5cdCAgcGFyc2U6IGZ1bmN0aW9uIChmaWxlcGF0aCkge1xuXHQgICAgcmV0dXJuIHBhcnNlKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBmb3JtYXQ6IGZ1bmN0aW9uIChwYXRoT2JqZWN0KSB7XG5cdCAgICByZXR1cm4gZm9ybWF0KHRoaXMuc2VwLCBwYXRoT2JqZWN0KTtcblx0ICB9LFxuXHQgIHRvTmFtZXNwYWNlZFBhdGg6IGZ1bmN0aW9uIChmaWxlcGF0aCkge1xuXHQgICAgcmV0dXJuIGZpbGVwYXRoOyAvLyBuby1vcFxuXHQgIH1cblx0fTtcblxuXHRjb25zdCBwYXRoID0gUG9zaXhQYXRoO1xuXHRwYXRoLndpbjMyID0gV2luMzJQYXRoO1xuXHRwYXRoLnBvc2l4ID0gUG9zaXhQYXRoO1xuXG5cdHZhciBpbnZva2VyID0ge307XG5cblx0LyoqXG5cdCAqIFRpdGFuaXVtIFNES1xuXHQgKiBDb3B5cmlnaHQgVGlEZXYsIEluYy4gMDQvMDcvMjAyMi1QcmVzZW50LiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuXHQgKiBMaWNlbnNlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEFwYWNoZSBQdWJsaWMgTGljZW5zZVxuXHQgKiBQbGVhc2Ugc2VlIHRoZSBMSUNFTlNFIGluY2x1ZGVkIHdpdGggdGhpcyBkaXN0cmlidXRpb24gZm9yIGRldGFpbHMuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgYSB3cmFwcGVkIGludm9rZXIgZnVuY3Rpb24gZm9yIGEgc3BlY2lmaWMgQVBJXG5cdCAqIFRoaXMgbGV0cyB1cyBwYXNzIGluIGNvbnRleHQtc3BlY2lmaWMgZGF0YSB0byBhIGZ1bmN0aW9uXG5cdCAqIGRlZmluZWQgaW4gYW4gQVBJIG5hbWVzcGFjZSAoaS5lLiBvbiBhIG1vZHVsZSlcblx0ICpcblx0ICogV2UgdXNlIHRoaXMgZm9yIGNyZWF0ZSBtZXRob2RzLCBhbmQgb3RoZXIgQVBJcyB0aGF0IHRha2Vcblx0ICogYSBLcm9sbEludm9jYXRpb24gb2JqZWN0IGFzIHRoZWlyIGZpcnN0IGFyZ3VtZW50IGluIEphdmFcblx0ICpcblx0ICogRm9yIGV4YW1wbGUsIGFuIGludm9rZXIgZm9yIGEgXCJjcmVhdGVcIiBtZXRob2QgbWlnaHQgbG9va1xuXHQgKiBzb21ldGhpbmcgbGlrZSB0aGlzOlxuXHQgKlxuXHQgKiAgICAgZnVuY3Rpb24gY3JlYXRlVmlldyhzb3VyY2VVcmwsIG9wdGlvbnMpIHtcblx0ICogICAgICAgICB2YXIgdmlldyA9IG5ldyBWaWV3KG9wdGlvbnMpO1xuXHQgKiAgICAgICAgIHZpZXcuc291cmNlVXJsID0gc291cmNlVXJsO1xuXHQgKiAgICAgICAgIHJldHVybiB2aWV3O1xuXHQgKiAgICAgfVxuXHQgKlxuXHQgKiBBbmQgdGhlIGNvcnJlc3BvbmRpbmcgaW52b2tlciBmb3IgYXBwLmpzIHdvdWxkIGxvb2sgbGlrZTpcblx0ICpcblx0ICogICAgIFVJLmNyZWF0ZVZpZXcgPSBmdW5jdGlvbigpIHtcblx0ICogICAgICAgICByZXR1cm4gY3JlYXRlVmlldyhcImFwcDovL2FwcC5qc1wiLCBhcmd1bWVudHNbMF0pO1xuXHQgKiAgICAgfVxuXHQgKlxuXHQgKiB3cmFwcGVyQVBJOiBUaGUgc2NvcGUgc3BlY2lmaWMgQVBJIChtb2R1bGUpIHdyYXBwZXJcblx0ICogcmVhbEFQSTogVGhlIGFjdHVhbCBtb2R1bGUgaW1wbGVtZW50YXRpb25cblx0ICogYXBpTmFtZTogVGhlIHRvcCBsZXZlbCBBUEkgbmFtZSBvZiB0aGUgcm9vdCBtb2R1bGVcblx0ICogaW52b2NhdGlvbkFQSTogVGhlIGFjdHVhbCBBUEkgdG8gZ2VuZXJhdGUgYW4gaW52b2tlciBmb3Jcblx0ICogc2NvcGVWYXJzOiBBIG1hcCB0aGF0IGlzIHBhc3NlZCBpbnRvIGVhY2ggaW52b2tlclxuXHQgKi9cblxuXHQvKipcblx0ICogQHBhcmFtIHtvYmplY3R9IHdyYXBwZXJBUEkgZS5nLiBUaXRhbml1bVdyYXBwZXJcblx0ICogQHBhcmFtIHtvYmplY3R9IHJlYWxBUEkgZS5nLiBUaXRhbml1bVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gYXBpTmFtZSBlLmcuICdUaXRhbml1bSdcblx0ICogQHBhcmFtIHtvYmplY3R9IGludm9jYXRpb25BUEkgZGV0YWlscyBvbiB0aGUgYXBpIHdlJ3JlIHdyYXBwaW5nXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpbnZvY2F0aW9uQVBJLm5hbWVzcGFjZSB0aGUgbmFtZXNwYWNlIG9mIHRoZSBwcm94eSB3aGVyZSBtZXRob2QgaGFuZ3MgKHcvbyAnVGkuJyBwcmVmaXgpIGUuZy4gJ0ZpbGVzeXN0ZW0nIG9yICdVSS5BbmRyb2lkJ1xuXHQgKiBAcGFyYW0ge3N0cmluZ30gaW52b2NhdGlvbkFQSS5hcGkgdGhlIG1ldGhvZCBuYW1lIGUuZy4gJ29wZW5GaWxlJyBvciAnY3JlYXRlU2VhcmNoVmlldydcblx0ICogQHBhcmFtIHtvYmplY3R9IHNjb3BlVmFycyBob2xkZXIgZm9yIGNvbnRleHQgc3BlY2lmaWMgdmFsdWVzIChiYXNpY2FsbHkganVzdCB3cmFwcyBzb3VyY2VVcmwpXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzY29wZVZhcnMuc291cmNlVXJsIHNvdXJjZSBVUkwgb2YganMgZmlsZSBlbnRyeSBwb2ludFxuXHQgKiBAcGFyYW0ge01vZHVsZX0gW3Njb3BlVmFycy5tb2R1bGVdIG1vZHVsZVxuXHQgKi9cblx0ZnVuY3Rpb24gZ2VuSW52b2tlcih3cmFwcGVyQVBJLCByZWFsQVBJLCBhcGlOYW1lLCBpbnZvY2F0aW9uQVBJLCBzY29wZVZhcnMpIHtcblx0ICBsZXQgYXBpTmFtZXNwYWNlID0gd3JhcHBlckFQSTtcblx0ICBjb25zdCBuYW1lc3BhY2UgPSBpbnZvY2F0aW9uQVBJLm5hbWVzcGFjZTtcblx0ICBpZiAobmFtZXNwYWNlICE9PSBhcGlOYW1lKSB7XG5cdCAgICBjb25zdCBuYW1lcyA9IG5hbWVzcGFjZS5zcGxpdCgnLicpO1xuXHQgICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG5cdCAgICAgIGxldCBhcGk7XG5cdCAgICAgIC8vIENyZWF0ZSBhIG1vZHVsZSB3cmFwcGVyIG9ubHkgaWYgaXQgaGFzbid0IGJlZW4gd3JhcHBlZCBhbHJlYWR5LlxuXHQgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFwaU5hbWVzcGFjZSwgbmFtZSkpIHtcblx0ICAgICAgICBhcGkgPSBhcGlOYW1lc3BhY2VbbmFtZV07XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgZnVuY3Rpb24gU2FuZGJveEFQSSgpIHtcblx0ICAgICAgICAgIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpO1xuXHQgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsICdfZXZlbnRzJywge1xuXHQgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgICAgICByZXR1cm4gcHJvdG8uX2V2ZW50cztcblx0ICAgICAgICAgICAgfSxcblx0ICAgICAgICAgICAgc2V0OiBmdW5jdGlvbiAodmFsdWUpIHtcblx0ICAgICAgICAgICAgICBwcm90by5fZXZlbnRzID0gdmFsdWU7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgIH0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBTYW5kYm94QVBJLnByb3RvdHlwZSA9IGFwaU5hbWVzcGFjZVtuYW1lXTtcblx0ICAgICAgICBhcGkgPSBuZXcgU2FuZGJveEFQSSgpO1xuXHQgICAgICAgIGFwaU5hbWVzcGFjZVtuYW1lXSA9IGFwaTtcblx0ICAgICAgfVxuXHQgICAgICBhcGlOYW1lc3BhY2UgPSBhcGk7XG5cdCAgICAgIHJlYWxBUEkgPSByZWFsQVBJW25hbWVdO1xuXHQgICAgfVxuXHQgIH1cblx0ICBsZXQgZGVsZWdhdGUgPSByZWFsQVBJW2ludm9jYXRpb25BUEkuYXBpXTtcblx0ICAvLyBUaGVzZSBpbnZva2VycyBmb3JtIGEgY2FsbCBoaWVyYXJjaHkgc28gd2UgbmVlZCB0b1xuXHQgIC8vIHByb3ZpZGUgYSB3YXkgYmFjayB0byB0aGUgYWN0dWFsIHJvb3QgVGl0YW5pdW0gLyBhY3R1YWwgaW1wbC5cblx0ICB3aGlsZSAoZGVsZWdhdGUuX19kZWxlZ2F0ZV9fKSB7XG5cdCAgICBkZWxlZ2F0ZSA9IGRlbGVnYXRlLl9fZGVsZWdhdGVfXztcblx0ICB9XG5cdCAgYXBpTmFtZXNwYWNlW2ludm9jYXRpb25BUEkuYXBpXSA9IGNyZWF0ZUludm9rZXIocmVhbEFQSSwgZGVsZWdhdGUsIHNjb3BlVmFycyk7XG5cdH1cblx0aW52b2tlci5nZW5JbnZva2VyID0gZ2VuSW52b2tlcjtcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhIHNpbmdsZSBpbnZva2VyIGZ1bmN0aW9uIHRoYXQgd3JhcHNcblx0ICogYSBkZWxlZ2F0ZSBmdW5jdGlvbiwgdGhpc09iaiwgYW5kIHNjb3BlVmFyc1xuXHQgKiBAcGFyYW0ge29iamVjdH0gdGhpc09iaiBUaGUgYHRoaXNgIG9iamVjdCB0byB1c2Ugd2hlbiBpbnZva2luZyB0aGUgYGRlbGVnYXRlYCBmdW5jdGlvblxuXHQgKiBAcGFyYW0ge2Z1bmN0aW9ufSBkZWxlZ2F0ZSBUaGUgZnVuY3Rpb24gdG8gd3JhcC9kZWxlZ2F0ZSB0byB1bmRlciB0aGUgaG9vZFxuXHQgKiBAcGFyYW0ge29iamVjdH0gc2NvcGVWYXJzIFRoZSBzY29wZSB2YXJpYWJsZXMgdG8gc3BsaWNlIGludG8gdGhlIGFyZ3VtZW50cyB3aGVuIGNhbGxpbmcgdGhlIGRlbGVnYXRlXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBzY29wZVZhcnMuc291cmNlVXJsIHRoZSBvbmx5IHJlYWwgcmVsZXZlbnQgc2NvcGUgdmFyaWFibGUhXG5cdCAqIEByZXR1cm4ge2Z1bmN0aW9ufVxuXHQgKi9cblx0ZnVuY3Rpb24gY3JlYXRlSW52b2tlcih0aGlzT2JqLCBkZWxlZ2F0ZSwgc2NvcGVWYXJzKSB7XG5cdCAgY29uc3QgdXJsSW52b2tlciA9IGZ1bmN0aW9uIGludm9rZXIoLi4uYXJncykge1xuXHQgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBmdW5jLXN0eWxlXG5cdCAgICBhcmdzLnNwbGljZSgwLCAwLCBpbnZva2VyLl9fc2NvcGVWYXJzX18pO1xuXHQgICAgcmV0dXJuIGRlbGVnYXRlLmFwcGx5KGludm9rZXIuX190aGlzT2JqX18sIGFyZ3MpO1xuXHQgIH07XG5cdCAgdXJsSW52b2tlci5fX2RlbGVnYXRlX18gPSBkZWxlZ2F0ZTtcblx0ICB1cmxJbnZva2VyLl9fdGhpc09ial9fID0gdGhpc09iajtcblx0ICB1cmxJbnZva2VyLl9fc2NvcGVWYXJzX18gPSBzY29wZVZhcnM7XG5cdCAgcmV0dXJuIHVybEludm9rZXI7XG5cdH1cblx0aW52b2tlci5jcmVhdGVJbnZva2VyID0gY3JlYXRlSW52b2tlcjtcblxuXHQvKipcblx0ICogVGl0YW5pdW0gU0RLXG5cdCAqIENvcHlyaWdodCBUaURldiwgSW5jLiAwNC8wNy8yMDIyLVByZXNlbnQuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG5cdCAqIExpY2Vuc2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgQXBhY2hlIFB1YmxpYyBMaWNlbnNlXG5cdCAqIFBsZWFzZSBzZWUgdGhlIExJQ0VOU0UgaW5jbHVkZWQgd2l0aCB0aGlzIGRpc3RyaWJ1dGlvbiBmb3IgZGV0YWlscy5cblx0ICovXG5cdGZ1bmN0aW9uIGJvb3RzdHJhcCQyKGdsb2JhbCwga3JvbGwpIHtcblx0ICBjb25zdCBhc3NldHMgPSBrcm9sbC5iaW5kaW5nKCdhc3NldHMnKTtcblx0ICBjb25zdCBTY3JpcHQgPSBrcm9sbC5iaW5kaW5nKCdldmFscycpLlNjcmlwdCA7XG5cblx0ICAvKipcblx0ICAgKiBUaGUgbG9hZGVkIGluZGV4Lmpzb24gZmlsZSBmcm9tIHRoZSBhcHAuIFVzZWQgdG8gc3RvcmUgdGhlIGVuY3J5cHRlZCBKUyBhc3NldHMnXG5cdCAgICogZmlsZW5hbWVzL29mZnNldHMuXG5cdCAgICovXG5cdCAgbGV0IGZpbGVJbmRleDtcblx0ICAvLyBGSVhNRTogZml4IGZpbGUgbmFtZSBwYXJpdHkgYmV0d2VlbiBwbGF0Zm9ybXNcblx0ICBjb25zdCBJTkRFWF9KU09OID0gJ2luZGV4Lmpzb24nIDtcblx0ICBjbGFzcyBNb2R1bGUge1xuXHQgICAgLyoqXG5cdCAgICAgKiBbTW9kdWxlIGRlc2NyaXB0aW9uXVxuXHQgICAgICogQHBhcmFtIHtzdHJpbmd9IGlkICAgICAgbW9kdWxlIGlkXG5cdCAgICAgKiBAcGFyYW0ge01vZHVsZX0gcGFyZW50ICBwYXJlbnQgbW9kdWxlXG5cdCAgICAgKi9cblx0ICAgIGNvbnN0cnVjdG9yKGlkLCBwYXJlbnQpIHtcblx0ICAgICAgdGhpcy5pZCA9IGlkO1xuXHQgICAgICB0aGlzLmV4cG9ydHMgPSB7fTtcblx0ICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG5cdCAgICAgIHRoaXMuZmlsZW5hbWUgPSBudWxsO1xuXHQgICAgICB0aGlzLmxvYWRlZCA9IGZhbHNlO1xuXHQgICAgICB0aGlzLndyYXBwZXJDYWNoZSA9IHt9O1xuXHQgICAgICB0aGlzLmlzU2VydmljZSA9IGZhbHNlOyAvLyB0b2dnbGVkIG9uIGlmIHRoaXMgbW9kdWxlIGlzIHRoZSBzZXJ2aWNlIGVudHJ5IHBvaW50XG5cdCAgICB9XG5cblx0ICAgIC8qKlxuXHQgICAgICogQXR0ZW1wdHMgdG8gbG9hZCB0aGUgbW9kdWxlLiBJZiBubyBmaWxlIGlzIGZvdW5kXG5cdCAgICAgKiB3aXRoIHRoZSBwcm92aWRlZCBuYW1lIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cblx0ICAgICAqIE9uY2UgdGhlIGNvbnRlbnRzIG9mIHRoZSBmaWxlIGFyZSByZWFkLCBpdCBpcyBydW5cblx0ICAgICAqIGluIHRoZSBjdXJyZW50IGNvbnRleHQuIEEgc2FuZGJveCBpcyBjcmVhdGVkIGJ5XG5cdCAgICAgKiBleGVjdXRpbmcgdGhlIGNvZGUgaW5zaWRlIGEgd3JhcHBlciBmdW5jdGlvbi5cblx0ICAgICAqIFRoaXMgcHJvdmlkZXMgYSBzcGVlZCBib29zdCB2cyBjcmVhdGluZyBhIG5ldyBjb250ZXh0LlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZW5hbWUgW2Rlc2NyaXB0aW9uXVxuXHQgICAgICogQHBhcmFtICB7U3RyaW5nfSBzb3VyY2UgICBbZGVzY3JpcHRpb25dXG5cdCAgICAgKiBAcmV0dXJucyB7dm9pZH1cblx0ICAgICAqL1xuXHQgICAgbG9hZChmaWxlbmFtZSwgc291cmNlKSB7XG5cdCAgICAgIGlmICh0aGlzLmxvYWRlZCkge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignTW9kdWxlIGFscmVhZHkgbG9hZGVkLicpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcblx0ICAgICAgdGhpcy5wYXRoID0gcGF0aC5kaXJuYW1lKGZpbGVuYW1lKTtcblx0ICAgICAgdGhpcy5wYXRocyA9IHRoaXMubm9kZU1vZHVsZXNQYXRocyh0aGlzLnBhdGgpO1xuXHQgICAgICBpZiAoIXNvdXJjZSkge1xuXHQgICAgICAgIHNvdXJjZSA9IGFzc2V0cy5yZWFkQXNzZXQoYFJlc291cmNlcyR7ZmlsZW5hbWV9YCApO1xuXHQgICAgICB9XG5cblx0ICAgICAgLy8gU3RpY2sgaXQgaW4gdGhlIGNhY2hlXG5cdCAgICAgIE1vZHVsZS5jYWNoZVt0aGlzLmZpbGVuYW1lXSA9IHRoaXM7XG5cdCAgICAgIHRoaXMuX3J1blNjcmlwdChzb3VyY2UsIHRoaXMuZmlsZW5hbWUpO1xuXHQgICAgICB0aGlzLmxvYWRlZCA9IHRydWU7XG5cdCAgICB9XG5cblx0ICAgIC8qKlxuXHQgICAgICogR2VuZXJhdGVzIGEgY29udGV4dC1zcGVjaWZpYyBtb2R1bGUgd3JhcHBlciwgYW5kIHdyYXBzXG5cdCAgICAgKiBlYWNoIGludm9jYXRpb24gQVBJIGluIGFuIGV4dGVybmFsICgzcmQgcGFydHkpIG1vZHVsZVxuXHQgICAgICogU2VlIGludm9rZXIuanMgZm9yIG1vcmUgaW5mb1xuXHQgICAgICogQHBhcmFtICB7b2JqZWN0fSBleHRlcm5hbE1vZHVsZSBuYXRpdmUgbW9kdWxlIHByb3h5XG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNvdXJjZVVybCAgICAgIHRoZSBjdXJyZW50IGpzIGZpbGUgdXJsXG5cdCAgICAgKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgICAgICAgICAgIHdyYXBwZXIgYXJvdW5kIHRoZSBleHRlcm5hbE1vZHVsZVxuXHQgICAgICovXG5cdCAgICBjcmVhdGVNb2R1bGVXcmFwcGVyKGV4dGVybmFsTW9kdWxlLCBzb3VyY2VVcmwpIHtcblxuXHQgICAgICAvLyBUaGUgbW9kdWxlIHdyYXBwZXIgZm9yd2FyZHMgb24gdXNpbmcgdGhlIG9yaWdpbmFsIGFzIGEgcHJvdG90eXBlXG5cdCAgICAgIGZ1bmN0aW9uIE1vZHVsZVdyYXBwZXIoKSB7fVxuXHQgICAgICBNb2R1bGVXcmFwcGVyLnByb3RvdHlwZSA9IGV4dGVybmFsTW9kdWxlO1xuXHQgICAgICBjb25zdCB3cmFwcGVyID0gbmV3IE1vZHVsZVdyYXBwZXIoKTtcblx0ICAgICAgLy8gSGVyZSB3ZSB0YWtlIHRoZSBBUElzIGRlZmluZWQgaW4gdGhlIGJvb3RzdHJhcC5qc1xuXHQgICAgICAvLyBhbmQgZWZmZWN0aXZlbHkgbGF6aWx5IGhvb2sgdGhlbVxuXHQgICAgICAvLyBXZSBleHBsaWNpdGx5IGd1YXJkIHRoZSBjb2RlIHNvIGlPUyBkb2Vzbid0IGV2ZW4gdXNlL2luY2x1ZGUgdGhlIHJlZmVyZW5jZWQgaW52b2tlci5qcyBpbXBvcnRcblx0ICAgICAgY29uc3QgaW52b2NhdGlvbkFQSXMgPSBleHRlcm5hbE1vZHVsZS5pbnZvY2F0aW9uQVBJcyB8fCBbXTtcblx0ICAgICAgZm9yIChjb25zdCBhcGkgb2YgaW52b2NhdGlvbkFQSXMpIHtcblx0ICAgICAgICBjb25zdCBkZWxlZ2F0ZSA9IGV4dGVybmFsTW9kdWxlW2FwaV07XG5cdCAgICAgICAgaWYgKCFkZWxlZ2F0ZSkge1xuXHQgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHdyYXBwZXJbYXBpXSA9IGludm9rZXIuY3JlYXRlSW52b2tlcihleHRlcm5hbE1vZHVsZSwgZGVsZWdhdGUsIG5ldyBrcm9sbC5TY29wZVZhcnMoe1xuXHQgICAgICAgICAgc291cmNlVXJsXG5cdCAgICAgICAgfSkpO1xuXHQgICAgICB9XG5cdCAgICAgIHdyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG5cdCAgICAgICAgZXh0ZXJuYWxNb2R1bGUuYWRkRXZlbnRMaXN0ZW5lci5hcHBseShleHRlcm5hbE1vZHVsZSwgYXJncyk7XG5cdCAgICAgIH07XG5cdCAgICAgIHdyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG5cdCAgICAgICAgZXh0ZXJuYWxNb2R1bGUucmVtb3ZlRXZlbnRMaXN0ZW5lci5hcHBseShleHRlcm5hbE1vZHVsZSwgYXJncyk7XG5cdCAgICAgIH07XG5cdCAgICAgIHdyYXBwZXIuZmlyZUV2ZW50ID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcblx0ICAgICAgICBleHRlcm5hbE1vZHVsZS5maXJlRXZlbnQuYXBwbHkoZXh0ZXJuYWxNb2R1bGUsIGFyZ3MpO1xuXHQgICAgICB9O1xuXHQgICAgICByZXR1cm4gd3JhcHBlcjtcblx0ICAgIH1cblxuXHQgICAgLyoqXG5cdCAgICAgKiBUYWtlcyBhIENvbW1vbkpTIG1vZHVsZSBhbmQgdXNlcyBpdCB0byBleHRlbmQgYW4gZXhpc3RpbmcgZXh0ZXJuYWwvbmF0aXZlIG1vZHVsZS4gVGhlIGV4cG9ydHMgYXJlIGFkZGVkIHRvIHRoZSBleHRlcm5hbCBtb2R1bGUuXG5cdCAgICAgKiBAcGFyYW0gIHtPYmplY3R9IGV4dGVybmFsTW9kdWxlIFRoZSBleHRlcm5hbC9uYXRpdmUgbW9kdWxlIHdlJ3JlIGV4dGVuZGluZ1xuXHQgICAgICogQHBhcmFtICB7U3RyaW5nfSBpZCAgICAgICAgICAgICBtb2R1bGUgaWRcblx0ICAgICAqL1xuXHQgICAgZXh0ZW5kTW9kdWxlV2l0aENvbW1vbkpzKGV4dGVybmFsTW9kdWxlLCBpZCkge1xuXHQgICAgICBpZiAoIWtyb2xsLmlzRXh0ZXJuYWxDb21tb25Kc01vZHVsZShpZCkpIHtcblx0ICAgICAgICByZXR1cm47XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBMb2FkIHVuZGVyIGZha2UgbmFtZSwgb3IgdGhlIGNvbW1vbmpzIHNpZGUgb2YgdGhlIG5hdGl2ZSBtb2R1bGUgZ2V0cyBjYWNoZWQgaW4gcGxhY2Ugb2YgdGhlIG5hdGl2ZSBtb2R1bGUhXG5cdCAgICAgIC8vIFNlZSBUSU1PQi0yNDkzMlxuXHQgICAgICBjb25zdCBmYWtlSWQgPSBgJHtpZH0uY29tbW9uanNgO1xuXHQgICAgICBjb25zdCBqc01vZHVsZSA9IG5ldyBNb2R1bGUoZmFrZUlkLCB0aGlzKTtcblx0ICAgICAganNNb2R1bGUubG9hZChmYWtlSWQsIGtyb2xsLmdldEV4dGVybmFsQ29tbW9uSnNNb2R1bGUoaWQpKTtcblx0ICAgICAgaWYgKGpzTW9kdWxlLmV4cG9ydHMpIHtcblx0ICAgICAgICBjb25zb2xlLnRyYWNlKGBFeHRlbmRpbmcgbmF0aXZlIG1vZHVsZSAnJHtpZH0nIHdpdGggdGhlIENvbW1vbkpTIG1vZHVsZSB0aGF0IHdhcyBwYWNrYWdlZCB3aXRoIGl0LmApO1xuXHQgICAgICAgIGtyb2xsLmV4dGVuZChleHRlcm5hbE1vZHVsZSwganNNb2R1bGUuZXhwb3J0cyk7XG5cdCAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgLyoqXG5cdCAgICAgKiBMb2FkcyBhIG5hdGl2ZSAvIGV4dGVybmFsICgzcmQgcGFydHkpIG1vZHVsZVxuXHQgICAgICogQHBhcmFtICB7U3RyaW5nfSBpZCAgICAgICAgICAgICAgbW9kdWxlIGlkXG5cdCAgICAgKiBAcGFyYW0gIHtvYmplY3R9IGV4dGVybmFsQmluZGluZyBleHRlcm5hbCBiaW5kaW5nIG9iamVjdFxuXHQgICAgICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgICAgICAgICAgVGhlIGV4cG9ydGVkIG1vZHVsZVxuXHQgICAgICovXG5cdCAgICBsb2FkRXh0ZXJuYWxNb2R1bGUoaWQsIGV4dGVybmFsQmluZGluZykge1xuXHQgICAgICAvLyB0cnkgdG8gZ2V0IHRoZSBjYWNoZWQgbW9kdWxlLi4uXG5cdCAgICAgIGxldCBleHRlcm5hbE1vZHVsZSA9IE1vZHVsZS5jYWNoZVtpZF07XG5cdCAgICAgIGlmICghZXh0ZXJuYWxNb2R1bGUpIHtcblx0ICAgICAgICAvLyBpT1MgYW5kIEFuZHJvaWQgZGlmZmVyIHF1aXRlIGEgYml0IGhlcmUuXG5cdCAgICAgICAgLy8gV2l0aCBpb3MsIHdlIHNob3VsZCBhbHJlYWR5IGhhdmUgdGhlIG5hdGl2ZSBtb2R1bGUgbG9hZGVkXG5cdCAgICAgICAgLy8gVGhlcmUncyBubyBzcGVjaWFsIFwiYm9vdHN0cmFwLmpzXCIgZmlsZSBwYWNrYWdlZCB3aXRoaW4gaXRcblx0ICAgICAgICAvLyBPbiBBbmRyb2lkLCB3ZSBsb2FkIGEgYm9vdHN0cmFwLmpzIGJ1bmRsZWQgd2l0aCB0aGUgbW9kdWxlXG5cdCAgICAgICAge1xuXHQgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgcHJvY2VzcyBmb3IgQW5kcm9pZCwgZmlyc3QgZ3JhYiB0aGUgYm9vdHN0cmFwIHNvdXJjZVxuXHQgICAgICAgICAgY29uc3Qgc291cmNlID0gZXh0ZXJuYWxCaW5kaW5nLmJvb3RzdHJhcDtcblxuXHQgICAgICAgICAgLy8gTG9hZCB0aGUgbmF0aXZlIG1vZHVsZSdzIGJvb3RzdHJhcCBKU1xuXHQgICAgICAgICAgY29uc3QgbW9kdWxlID0gbmV3IE1vZHVsZShpZCwgdGhpcyk7XG5cdCAgICAgICAgICBtb2R1bGUubG9hZChgJHtpZH0vYm9vdHN0cmFwLmpzYCwgc291cmNlKTtcblxuXHQgICAgICAgICAgLy8gQm9vdHN0cmFwIGFuZCBsb2FkIHRoZSBtb2R1bGUgdXNpbmcgdGhlIG5hdGl2ZSBiaW5kaW5nc1xuXHQgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbW9kdWxlLmV4cG9ydHMuYm9vdHN0cmFwKGV4dGVybmFsQmluZGluZyk7XG5cblx0ICAgICAgICAgIC8vIENhY2hlIHRoZSBleHRlcm5hbCBtb2R1bGUgaW5zdGFuY2UgYWZ0ZXIgaXQncyBiZWVuIG1vZGlmaWVkIGJ5IGl0J3MgYm9vdHN0cmFwIHNjcmlwdFxuXHQgICAgICAgICAgZXh0ZXJuYWxNb2R1bGUgPSByZXN1bHQ7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIGlmICghZXh0ZXJuYWxNb2R1bGUpIHtcblx0ICAgICAgICBjb25zb2xlLnRyYWNlKGBVbmFibGUgdG8gbG9hZCBleHRlcm5hbCBtb2R1bGU6ICR7aWR9YCk7XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBjYWNoZSB0aGUgbG9hZGVkIG5hdGl2ZSBtb2R1bGUgKGJlZm9yZSB3ZSBleHRlbmQgaXQpXG5cdCAgICAgIE1vZHVsZS5jYWNoZVtpZF0gPSBleHRlcm5hbE1vZHVsZTtcblxuXHQgICAgICAvLyBXZSBjYWNoZSBlYWNoIGNvbnRleHQtc3BlY2lmaWMgbW9kdWxlIHdyYXBwZXJcblx0ICAgICAgLy8gb24gdGhlIHBhcmVudCBtb2R1bGUsIHJhdGhlciB0aGFuIGluIHRoZSBNb2R1bGUuY2FjaGVcblx0ICAgICAgbGV0IHdyYXBwZXIgPSB0aGlzLndyYXBwZXJDYWNoZVtpZF07XG5cdCAgICAgIGlmICh3cmFwcGVyKSB7XG5cdCAgICAgICAgcmV0dXJuIHdyYXBwZXI7XG5cdCAgICAgIH1cblx0ICAgICAgY29uc3Qgc291cmNlVXJsID0gYGFwcDovLyR7dGhpcy5maWxlbmFtZX1gOyAvLyBGSVhNRTogSWYgdGhpcy5maWxlbmFtZSBzdGFydHMgd2l0aCAnLycsIHdlIG5lZWQgdG8gZHJvcCBpdCwgSSB0aGluaz9cblx0ICAgICAgd3JhcHBlciA9IHRoaXMuY3JlYXRlTW9kdWxlV3JhcHBlcihleHRlcm5hbE1vZHVsZSwgc291cmNlVXJsKTtcblxuXHQgICAgICAvLyBUaGVuIHdlIFwiZXh0ZW5kXCIgdGhlIEFQSS9tb2R1bGUgdXNpbmcgYW55IHNoaXBwZWQgSlMgY29kZSAoYXNzZXRzLzxtb2R1bGUuaWQ+LmpzKVxuXHQgICAgICB0aGlzLmV4dGVuZE1vZHVsZVdpdGhDb21tb25Kcyh3cmFwcGVyLCBpZCk7XG5cdCAgICAgIHRoaXMud3JhcHBlckNhY2hlW2lkXSA9IHdyYXBwZXI7XG5cdCAgICAgIHJldHVybiB3cmFwcGVyO1xuXHQgICAgfVxuXG5cdCAgICAvLyBTZWUgaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9tb2R1bGVzLmh0bWwjbW9kdWxlc19hbGxfdG9nZXRoZXJcblxuXHQgICAgLyoqXG5cdCAgICAgKiBSZXF1aXJlIGFub3RoZXIgbW9kdWxlIGFzIGEgY2hpbGQgb2YgdGhpcyBtb2R1bGUuXG5cdCAgICAgKiBUaGlzIHBhcmVudCBtb2R1bGUncyBwYXRoIGlzIHVzZWQgYXMgdGhlIGJhc2UgZm9yIHJlbGF0aXZlIHBhdGhzXG5cdCAgICAgKiB3aGVuIGxvYWRpbmcgdGhlIGNoaWxkLiBSZXR1cm5zIHRoZSBleHBvcnRzIG9iamVjdFxuXHQgICAgICogb2YgdGhlIGNoaWxkIG1vZHVsZS5cblx0ICAgICAqXG5cdCAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHJlcXVlc3QgIFRoZSBwYXRoIHRvIHRoZSByZXF1ZXN0ZWQgbW9kdWxlXG5cdCAgICAgKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgIFRoZSBsb2FkZWQgbW9kdWxlXG5cdCAgICAgKi9cblx0ICAgIHJlcXVpcmUocmVxdWVzdCkge1xuXHQgICAgICAvLyAyLiBJZiBYIGJlZ2lucyB3aXRoICcuLycgb3IgJy8nIG9yICcuLi8nXG5cdCAgICAgIGNvbnN0IHN0YXJ0ID0gcmVxdWVzdC5zdWJzdHJpbmcoMCwgMik7IC8vIGhhY2sgdXAgdGhlIHN0YXJ0IG9mIHRoZSBzdHJpbmcgdG8gY2hlY2sgcmVsYXRpdmUvYWJzb2x1dGUvXCJuYWtlZFwiIG1vZHVsZSBpZFxuXHQgICAgICBpZiAoc3RhcnQgPT09ICcuLycgfHwgc3RhcnQgPT09ICcuLicpIHtcblx0ICAgICAgICBjb25zdCBsb2FkZWQgPSB0aGlzLmxvYWRBc0ZpbGVPckRpcmVjdG9yeShwYXRoLm5vcm1hbGl6ZSh0aGlzLnBhdGggKyAnLycgKyByZXF1ZXN0KSk7XG5cdCAgICAgICAgaWYgKGxvYWRlZCkge1xuXHQgICAgICAgICAgcmV0dXJuIGxvYWRlZC5leHBvcnRzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICAvLyBSb290L2Fic29sdXRlIHBhdGggKGludGVybmFsbHkgd2hlbiByZWFkaW5nIHRoZSBmaWxlLCB3ZSBwcmVwZW5kIFwiUmVzb3VyY2VzL1wiIGFzIHJvb3QgZGlyKVxuXHQgICAgICB9IGVsc2UgaWYgKHJlcXVlc3Quc3Vic3RyaW5nKDAsIDEpID09PSAnLycpIHtcblx0ICAgICAgICBjb25zdCBsb2FkZWQgPSB0aGlzLmxvYWRBc0ZpbGVPckRpcmVjdG9yeShwYXRoLm5vcm1hbGl6ZShyZXF1ZXN0KSk7XG5cdCAgICAgICAgaWYgKGxvYWRlZCkge1xuXHQgICAgICAgICAgcmV0dXJuIGxvYWRlZC5leHBvcnRzO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAvLyBEZXNwaXRlIGJlaW5nIHN0ZXAgMSBpbiBOb2RlLkpTIHBzdWVkby1jb2RlLCB3ZSBtb3ZlZCBpdCBkb3duIGhlcmUgYmVjYXVzZSB3ZSBkb24ndCBhbGxvdyBuYXRpdmUgbW9kdWxlc1xuXHQgICAgICAgIC8vIHRvIHN0YXJ0IHdpdGggJy4vJywgJy4uJyBvciAnLycgLSBzbyB0aGlzIGF2b2lkcyBhIGxvdCBvZiBtaXNzZXMgb24gcmVxdWlyZXMgc3RhcnRpbmcgdGhhdCB3YXlcblxuXHQgICAgICAgIC8vIDEuIElmIFggaXMgYSBjb3JlIG1vZHVsZSxcblx0ICAgICAgICBsZXQgbG9hZGVkID0gdGhpcy5sb2FkQ29yZU1vZHVsZShyZXF1ZXN0KTtcblx0ICAgICAgICBpZiAobG9hZGVkKSB7XG5cdCAgICAgICAgICAvLyBhLiByZXR1cm4gdGhlIGNvcmUgbW9kdWxlXG5cdCAgICAgICAgICAvLyBiLiBTVE9QXG5cdCAgICAgICAgICByZXR1cm4gbG9hZGVkO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIExvb2sgZm9yIENvbW1vbkpTIG1vZHVsZVxuXHQgICAgICAgIGlmIChyZXF1ZXN0LmluZGV4T2YoJy8nKSA9PT0gLTEpIHtcblx0ICAgICAgICAgIC8vIEZvciBDb21tb25KUyB3ZSBuZWVkIHRvIGxvb2sgZm9yIG1vZHVsZS5pZC9tb2R1bGUuaWQuanMgZmlyc3QuLi5cblx0ICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gYC8ke3JlcXVlc3R9LyR7cmVxdWVzdH0uanNgO1xuXHQgICAgICAgICAgLy8gT25seSBsb29rIGZvciB0aGlzIF9leGFjdCBmaWxlXy4gRE8gTk9UIEFQUEVORCAuanMgb3IgLmpzb24gdG8gaXQhXG5cdCAgICAgICAgICBpZiAodGhpcy5maWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkpIHtcblx0ICAgICAgICAgICAgbG9hZGVkID0gdGhpcy5sb2FkSmF2YXNjcmlwdFRleHQoZmlsZW5hbWUpO1xuXHQgICAgICAgICAgICBpZiAobG9hZGVkKSB7XG5cdCAgICAgICAgICAgICAgcmV0dXJuIGxvYWRlZC5leHBvcnRzO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIC8vIFRoZW4gdHJ5IG1vZHVsZS5pZCBhcyBkaXJlY3Rvcnlcblx0ICAgICAgICAgIGxvYWRlZCA9IHRoaXMubG9hZEFzRGlyZWN0b3J5KGAvJHtyZXF1ZXN0fWApO1xuXHQgICAgICAgICAgaWYgKGxvYWRlZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gbG9hZGVkLmV4cG9ydHM7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQWxsb3cgbG9va2luZyB0aHJvdWdoIG5vZGVfbW9kdWxlc1xuXHQgICAgICAgIC8vIDMuIExPQURfTk9ERV9NT0RVTEVTKFgsIGRpcm5hbWUoWSkpXG5cdCAgICAgICAgbG9hZGVkID0gdGhpcy5sb2FkTm9kZU1vZHVsZXMocmVxdWVzdCwgdGhpcy5wYXRocyk7XG5cdCAgICAgICAgaWYgKGxvYWRlZCkge1xuXHQgICAgICAgICAgcmV0dXJuIGxvYWRlZC5leHBvcnRzO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIC8vIEZhbGxiYWNrIHRvIG9sZCBUaXRhbml1bSBiZWhhdmlvciBvZiBhc3N1bWluZyBpdCdzIGFjdHVhbGx5IGFuIGFic29sdXRlIHBhdGhcblxuXHQgICAgICAgIC8vIFdlJ2QgbGlrZSB0byB3YXJuIHVzZXJzIGFib3V0IGxlZ2FjeSBzdHlsZSByZXF1aXJlIHN5bnRheCBzbyB0aGV5IGNhbiB1cGRhdGUsIGJ1dCB0aGUgbmV3IHN5bnRheCBpcyBub3QgYmFja3dhcmRzIGNvbXBhdGlibGUuXG5cdCAgICAgICAgLy8gU28gZm9yIG5vdywgbGV0J3MganVzdCBiZSBxdWl0ZSBhYm91dCBpdC4gSW4gZnV0dXJlIHZlcnNpb25zIG9mIHRoZSBTREsgKDcuMD8pIHdlIHNob3VsZCB3YXJuIChvbmNlIDUueCBpcyBlbmQgb2YgbGlmZSBzbyBiYWNrd2FyZHMgY29tcGF0IGlzIG5vdCBuZWNlc3NhcnkpXG5cdCAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG1heC1sZW5cblx0ICAgICAgICAvLyBjb25zb2xlLndhcm4oYHJlcXVpcmUgY2FsbGVkIHdpdGggdW4tcHJlZml4ZWQgbW9kdWxlIGlkOiAke3JlcXVlc3R9LCBzaG91bGQgYmUgYSBjb3JlIG9yIENvbW1vbkpTIG1vZHVsZS4gRmFsbGluZyBiYWNrIHRvIG9sZCBUaSBiZWhhdmlvciBhbmQgYXNzdW1pbmcgaXQncyBhbiBhYnNvbHV0ZSBwYXRoOiAvJHtyZXF1ZXN0fWApO1xuXG5cdCAgICAgICAgbG9hZGVkID0gdGhpcy5sb2FkQXNGaWxlT3JEaXJlY3RvcnkocGF0aC5ub3JtYWxpemUoYC8ke3JlcXVlc3R9YCkpO1xuXHQgICAgICAgIGlmIChsb2FkZWQpIHtcblx0ICAgICAgICAgIHJldHVybiBsb2FkZWQuZXhwb3J0cztcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyA0LiBUSFJPVyBcIm5vdCBmb3VuZFwiXG5cdCAgICAgIHRocm93IG5ldyBFcnJvcihgUmVxdWVzdGVkIG1vZHVsZSBub3QgZm91bmQ6ICR7cmVxdWVzdH1gKTsgLy8gVE9ETyBTZXQgJ2NvZGUnIHByb3BlcnR5IHRvICdNT0RVTEVfTk9UX0ZPVU5EJyB0byBtYXRjaCBOb2RlP1xuXHQgICAgfVxuXG5cdCAgICAvKipcblx0ICAgICAqIExvYWRzIHRoZSBjb3JlIG1vZHVsZSBpZiBpdCBleGlzdHMuIElmIG5vdCwgcmV0dXJucyBudWxsLlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gIGlkIFRoZSByZXF1ZXN0IG1vZHVsZSBpZFxuXHQgICAgICogQHJldHVybiB7T2JqZWN0fSAgICB0cnVlIGlmIHRoZSBtb2R1bGUgaWQgbWF0Y2hlcyBhIG5hdGl2ZSBvciBDb21tb25KUyBtb2R1bGUgaWQsIChvciBpdCdzIGZpcnN0IHBhdGggc2VnbWVudCBkb2VzKS5cblx0ICAgICAqL1xuXHQgICAgbG9hZENvcmVNb2R1bGUoaWQpIHtcblx0ICAgICAgLy8gc2tpcCBiYWQgaWRzLCByZWxhdGl2ZSBpZHMsIGFic29sdXRlIGlkcy4gXCJuYXRpdmVcIi9cImNvcmVcIiBtb2R1bGVzIHNob3VsZCBiZSBvZiBmb3JtIFwibW9kdWxlLmlkXCIgb3IgXCJtb2R1bGUuaWQvc3ViLmZpbGUuanNcIlxuXHQgICAgICBpZiAoIWlkIHx8IGlkLnN0YXJ0c1dpdGgoJy4nKSB8fCBpZC5zdGFydHNXaXRoKCcvJykpIHtcblx0ICAgICAgICByZXR1cm4gbnVsbDtcblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIGNoZWNrIGlmIHdlIGhhdmUgYSBjYWNoZWQgY29weSBvZiB0aGUgd3JhcHBlclxuXHQgICAgICBpZiAodGhpcy53cmFwcGVyQ2FjaGVbaWRdKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMud3JhcHBlckNhY2hlW2lkXTtcblx0ICAgICAgfVxuXHQgICAgICBjb25zdCBwYXJ0cyA9IGlkLnNwbGl0KCcvJyk7XG5cdCAgICAgIGNvbnN0IGV4dGVybmFsQmluZGluZyA9IGtyb2xsLmV4dGVybmFsQmluZGluZyhwYXJ0c1swXSk7XG5cdCAgICAgIGlmIChleHRlcm5hbEJpbmRpbmcpIHtcblx0ICAgICAgICBpZiAocGFydHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBcInJvb3RcIiBvZiBhbiBleHRlcm5hbCBtb2R1bGUuIEl0IGNhbiBsb29rIGxpa2U6XG5cdCAgICAgICAgICAvLyByZXF1ZXN0KFwiY29tLmV4YW1wbGUubXltb2R1bGVcIilcblx0ICAgICAgICAgIC8vIFdlIGNhbiBsb2FkIGFuZCByZXR1cm4gaXQgcmlnaHQgYXdheSAoY2FjaGluZyBvY2N1cnMgaW4gdGhlIGNhbGxlZCBmdW5jdGlvbikuXG5cdCAgICAgICAgICByZXR1cm4gdGhpcy5sb2FkRXh0ZXJuYWxNb2R1bGUocGFydHNbMF0sIGV4dGVybmFsQmluZGluZyk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgLy8gQ291bGQgYmUgYSBzdWItbW9kdWxlIChDb21tb25KUykgb2YgYW4gZXh0ZXJuYWwgbmF0aXZlIG1vZHVsZS5cblx0ICAgICAgICAvLyBXZSBhbGxvdyB0aGF0IHNpbmNlIFRJTU9CLTk3MzAuXG5cdCAgICAgICAgaWYgKGtyb2xsLmlzRXh0ZXJuYWxDb21tb25Kc01vZHVsZShwYXJ0c1swXSkpIHtcblx0ICAgICAgICAgIGNvbnN0IGV4dGVybmFsQ29tbW9uSnNDb250ZW50cyA9IGtyb2xsLmdldEV4dGVybmFsQ29tbW9uSnNNb2R1bGUoaWQpO1xuXHQgICAgICAgICAgaWYgKGV4dGVybmFsQ29tbW9uSnNDb250ZW50cykge1xuXHQgICAgICAgICAgICAvLyBmb3VuZCBpdFxuXHQgICAgICAgICAgICAvLyBGSVhNRSBSZS11c2UgbG9hZEFzSmF2YVNjcmlwdFRleHQ/XG5cdCAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBNb2R1bGUoaWQsIHRoaXMpO1xuXHQgICAgICAgICAgICBtb2R1bGUubG9hZChpZCwgZXh0ZXJuYWxDb21tb25Kc0NvbnRlbnRzKTtcblx0ICAgICAgICAgICAgcmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gbnVsbDsgLy8gZmFpbGVkIHRvIGxvYWRcblx0ICAgIH1cblxuXHQgICAgLyoqXG5cdCAgICAgKiBBdHRlbXB0cyB0byBsb2FkIGEgbm9kZSBtb2R1bGUgYnkgaWQgZnJvbSB0aGUgc3RhcnRpbmcgcGF0aFxuXHQgICAgICogQHBhcmFtICB7c3RyaW5nfSBtb2R1bGVJZCAgICAgICBUaGUgcGF0aCBvZiB0aGUgbW9kdWxlIHRvIGxvYWQuXG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmdbXX0gZGlycyAgICAgICBwYXRocyB0byBzZWFyY2hcblx0ICAgICAqIEByZXR1cm4ge01vZHVsZXxudWxsfSAgICAgIFRoZSBtb2R1bGUsIGlmIGxvYWRlZC4gbnVsbCBpZiBub3QuXG5cdCAgICAgKi9cblx0ICAgIGxvYWROb2RlTW9kdWxlcyhtb2R1bGVJZCwgZGlycykge1xuXHQgICAgICAvLyAyLiBmb3IgZWFjaCBESVIgaW4gRElSUzpcblx0ICAgICAgZm9yIChjb25zdCBkaXIgb2YgZGlycykge1xuXHQgICAgICAgIC8vIGEuIExPQURfQVNfRklMRShESVIvWClcblx0ICAgICAgICAvLyBiLiBMT0FEX0FTX0RJUkVDVE9SWShESVIvWClcblx0ICAgICAgICBjb25zdCBtb2QgPSB0aGlzLmxvYWRBc0ZpbGVPckRpcmVjdG9yeShwYXRoLmpvaW4oZGlyLCBtb2R1bGVJZCkpO1xuXHQgICAgICAgIGlmIChtb2QpIHtcblx0ICAgICAgICAgIHJldHVybiBtb2Q7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfVxuXG5cdCAgICAvKipcblx0ICAgICAqIERldGVybWluZSB0aGUgc2V0IG9mIHBhdGhzIHRvIHNlYXJjaCBmb3Igbm9kZV9tb2R1bGVzXG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHN0YXJ0RGlyICAgICAgIFRoZSBzdGFydGluZyBkaXJlY3Rvcnlcblx0ICAgICAqIEByZXR1cm4ge3N0cmluZ1tdfSAgICAgICAgICAgICAgVGhlIGFycmF5IG9mIHBhdGhzIHRvIHNlYXJjaFxuXHQgICAgICovXG5cdCAgICBub2RlTW9kdWxlc1BhdGhzKHN0YXJ0RGlyKSB7XG5cdCAgICAgIC8vIE1ha2Ugc3VyZSB3ZSBoYXZlIGFuIGFic29sdXRlIHBhdGggdG8gc3RhcnQgd2l0aFxuXHQgICAgICBzdGFydERpciA9IHBhdGgucmVzb2x2ZShzdGFydERpcik7XG5cblx0ICAgICAgLy8gUmV0dXJuIGVhcmx5IGlmIHdlIGFyZSBhdCByb290LCB0aGlzIGF2b2lkcyBkb2luZyBhIHBvaW50bGVzcyBsb29wXG5cdCAgICAgIC8vIGFuZCBhbHNvIHJldHVybmluZyBhbiBhcnJheSB3aXRoIGR1cGxpY2F0ZSBlbnRyaWVzXG5cdCAgICAgIC8vIGUuZy4gW1wiL25vZGVfbW9kdWxlc1wiLCBcIi9ub2RlX21vZHVsZXNcIl1cblx0ICAgICAgaWYgKHN0YXJ0RGlyID09PSAnLycpIHtcblx0ICAgICAgICByZXR1cm4gWycvbm9kZV9tb2R1bGVzJ107XG5cdCAgICAgIH1cblx0ICAgICAgLy8gMS4gbGV0IFBBUlRTID0gcGF0aCBzcGxpdChTVEFSVClcblx0ICAgICAgY29uc3QgcGFydHMgPSBzdGFydERpci5zcGxpdCgnLycpO1xuXHQgICAgICAvLyAyLiBsZXQgSSA9IGNvdW50IG9mIFBBUlRTIC0gMVxuXHQgICAgICBsZXQgaSA9IHBhcnRzLmxlbmd0aCAtIDE7XG5cdCAgICAgIC8vIDMuIGxldCBESVJTID0gW11cblx0ICAgICAgY29uc3QgZGlycyA9IFtdO1xuXG5cdCAgICAgIC8vIDQuIHdoaWxlIEkgPj0gMCxcblx0ICAgICAgd2hpbGUgKGkgPj0gMCkge1xuXHQgICAgICAgIC8vIGEuIGlmIFBBUlRTW0ldID0gXCJub2RlX21vZHVsZXNcIiBDT05USU5VRVxuXHQgICAgICAgIGlmIChwYXJ0c1tpXSA9PT0gJ25vZGVfbW9kdWxlcycgfHwgcGFydHNbaV0gPT09ICcnKSB7XG5cdCAgICAgICAgICBpIC09IDE7XG5cdCAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgLy8gYi4gRElSID0gcGF0aCBqb2luKFBBUlRTWzAgLi4gSV0gKyBcIm5vZGVfbW9kdWxlc1wiKVxuXHQgICAgICAgIGNvbnN0IGRpciA9IHBhdGguam9pbihwYXJ0cy5zbGljZSgwLCBpICsgMSkuam9pbignLycpLCAnbm9kZV9tb2R1bGVzJyk7XG5cdCAgICAgICAgLy8gYy4gRElSUyA9IERJUlMgKyBESVJcblx0ICAgICAgICBkaXJzLnB1c2goZGlyKTtcblx0ICAgICAgICAvLyBkLiBsZXQgSSA9IEkgLSAxXG5cdCAgICAgICAgaSAtPSAxO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIEFsd2F5cyBhZGQgL25vZGVfbW9kdWxlcyB0byB0aGUgc2VhcmNoIHBhdGhcblx0ICAgICAgZGlycy5wdXNoKCcvbm9kZV9tb2R1bGVzJyk7XG5cdCAgICAgIHJldHVybiBkaXJzO1xuXHQgICAgfVxuXG5cdCAgICAvKipcblx0ICAgICAqIEF0dGVtcHRzIHRvIGxvYWQgYSBnaXZlbiBwYXRoIGFzIGEgZmlsZSBvciBkaXJlY3RvcnkuXG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IG5vcm1hbGl6ZWRQYXRoIFRoZSBwYXRoIG9mIHRoZSBtb2R1bGUgdG8gbG9hZC5cblx0ICAgICAqIEByZXR1cm4ge01vZHVsZXxudWxsfSBUaGUgbG9hZGVkIG1vZHVsZS4gbnVsbCBpZiB1bmFibGUgdG8gbG9hZC5cblx0ICAgICAqL1xuXHQgICAgbG9hZEFzRmlsZU9yRGlyZWN0b3J5KG5vcm1hbGl6ZWRQYXRoKSB7XG5cdCAgICAgIC8vIGEuIExPQURfQVNfRklMRShZICsgWClcblx0ICAgICAgbGV0IGxvYWRlZCA9IHRoaXMubG9hZEFzRmlsZShub3JtYWxpemVkUGF0aCk7XG5cdCAgICAgIGlmIChsb2FkZWQpIHtcblx0ICAgICAgICByZXR1cm4gbG9hZGVkO1xuXHQgICAgICB9XG5cdCAgICAgIC8vIGIuIExPQURfQVNfRElSRUNUT1JZKFkgKyBYKVxuXHQgICAgICBsb2FkZWQgPSB0aGlzLmxvYWRBc0RpcmVjdG9yeShub3JtYWxpemVkUGF0aCk7XG5cdCAgICAgIGlmIChsb2FkZWQpIHtcblx0ICAgICAgICByZXR1cm4gbG9hZGVkO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfVxuXG5cdCAgICAvKipcblx0ICAgICAqIExvYWRzIGEgZ2l2ZW4gZmlsZSBhcyBhIEphdmFzY3JpcHQgZmlsZSwgcmV0dXJuaW5nIHRoZSBtb2R1bGUuZXhwb3J0cy5cblx0ICAgICAqIEBwYXJhbSAge3N0cmluZ30gZmlsZW5hbWUgRmlsZSB3ZSdyZSBhdHRlbXB0aW5nIHRvIGxvYWRcblx0ICAgICAqIEByZXR1cm4ge01vZHVsZX0gdGhlIGxvYWRlZCBtb2R1bGVcblx0ICAgICAqL1xuXHQgICAgbG9hZEphdmFzY3JpcHRUZXh0KGZpbGVuYW1lKSB7XG5cdCAgICAgIC8vIExvb2sgaW4gdGhlIGNhY2hlIVxuXHQgICAgICBpZiAoTW9kdWxlLmNhY2hlW2ZpbGVuYW1lXSkge1xuXHQgICAgICAgIHJldHVybiBNb2R1bGUuY2FjaGVbZmlsZW5hbWVdO1xuXHQgICAgICB9XG5cdCAgICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBNb2R1bGUoZmlsZW5hbWUsIHRoaXMpO1xuXHQgICAgICBtb2R1bGUubG9hZChmaWxlbmFtZSk7XG5cdCAgICAgIHJldHVybiBtb2R1bGU7XG5cdCAgICB9XG5cblx0ICAgIC8qKlxuXHQgICAgICogTG9hZHMgYSBKU09OIGZpbGUgYnkgcmVhZGluZyBpdCdzIGNvbnRlbnRzLCBkb2luZyBhIEpTT04ucGFyc2UgYW5kIHJldHVybmluZyB0aGUgcGFyc2VkIG9iamVjdC5cblx0ICAgICAqXG5cdCAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVuYW1lIEZpbGUgd2UncmUgYXR0ZW1wdGluZyB0byBsb2FkXG5cdCAgICAgKiBAcmV0dXJuIHtNb2R1bGV9IFRoZSBsb2FkZWQgbW9kdWxlIGluc3RhbmNlXG5cdCAgICAgKi9cblx0ICAgIGxvYWRKYXZhc2NyaXB0T2JqZWN0KGZpbGVuYW1lKSB7XG5cdCAgICAgIC8vIExvb2sgaW4gdGhlIGNhY2hlIVxuXHQgICAgICBpZiAoTW9kdWxlLmNhY2hlW2ZpbGVuYW1lXSkge1xuXHQgICAgICAgIHJldHVybiBNb2R1bGUuY2FjaGVbZmlsZW5hbWVdO1xuXHQgICAgICB9XG5cdCAgICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBNb2R1bGUoZmlsZW5hbWUsIHRoaXMpO1xuXHQgICAgICBtb2R1bGUuZmlsZW5hbWUgPSBmaWxlbmFtZTtcblx0ICAgICAgbW9kdWxlLnBhdGggPSBwYXRoLmRpcm5hbWUoZmlsZW5hbWUpO1xuXHQgICAgICBjb25zdCBzb3VyY2UgPSBhc3NldHMucmVhZEFzc2V0KGBSZXNvdXJjZXMke2ZpbGVuYW1lfWAgKTtcblxuXHQgICAgICAvLyBTdGljayBpdCBpbiB0aGUgY2FjaGVcblx0ICAgICAgTW9kdWxlLmNhY2hlW2ZpbGVuYW1lXSA9IG1vZHVsZTtcblx0ICAgICAgbW9kdWxlLmV4cG9ydHMgPSBKU09OLnBhcnNlKHNvdXJjZSk7XG5cdCAgICAgIG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXHQgICAgICByZXR1cm4gbW9kdWxlO1xuXHQgICAgfVxuXG5cdCAgICAvKipcblx0ICAgICAqIEF0dGVtcHRzIHRvIGxvYWQgYSBmaWxlIGJ5IGl0J3MgZnVsbCBmaWxlbmFtZSBhY2NvcmRpbmcgdG8gTm9kZUpTIHJ1bGVzLlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge3N0cmluZ30gaWQgVGhlIGZpbGVuYW1lXG5cdCAgICAgKiBAcmV0dXJuIHtNb2R1bGV8bnVsbH0gTW9kdWxlIGluc3RhbmNlIGlmIGxvYWRlZCwgbnVsbCBpZiBub3QgZm91bmQuXG5cdCAgICAgKi9cblx0ICAgIGxvYWRBc0ZpbGUoaWQpIHtcblx0ICAgICAgLy8gMS4gSWYgWCBpcyBhIGZpbGUsIGxvYWQgWCBhcyBKYXZhU2NyaXB0IHRleHQuICBTVE9QXG5cdCAgICAgIGxldCBmaWxlbmFtZSA9IGlkO1xuXHQgICAgICBpZiAodGhpcy5maWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkpIHtcblx0ICAgICAgICAvLyBJZiB0aGUgZmlsZSBoYXMgYSAuanNvbiBleHRlbnNpb24sIGxvYWQgYXMgSmF2YXNjcmlwdE9iamVjdFxuXHQgICAgICAgIGlmIChmaWxlbmFtZS5sZW5ndGggPiA1ICYmIGZpbGVuYW1lLnNsaWNlKC00KSA9PT0gJ2pzb24nKSB7XG5cdCAgICAgICAgICByZXR1cm4gdGhpcy5sb2FkSmF2YXNjcmlwdE9iamVjdChmaWxlbmFtZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJldHVybiB0aGlzLmxvYWRKYXZhc2NyaXB0VGV4dChmaWxlbmFtZSk7XG5cdCAgICAgIH1cblx0ICAgICAgLy8gMi4gSWYgWC5qcyBpcyBhIGZpbGUsIGxvYWQgWC5qcyBhcyBKYXZhU2NyaXB0IHRleHQuICBTVE9QXG5cdCAgICAgIGZpbGVuYW1lID0gaWQgKyAnLmpzJztcblx0ICAgICAgaWYgKHRoaXMuZmlsZW5hbWVFeGlzdHMoZmlsZW5hbWUpKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMubG9hZEphdmFzY3JpcHRUZXh0KGZpbGVuYW1lKTtcblx0ICAgICAgfVxuXHQgICAgICAvLyAzLiBJZiBYLmpzb24gaXMgYSBmaWxlLCBwYXJzZSBYLmpzb24gdG8gYSBKYXZhU2NyaXB0IE9iamVjdC4gIFNUT1Bcblx0ICAgICAgZmlsZW5hbWUgPSBpZCArICcuanNvbic7XG5cdCAgICAgIGlmICh0aGlzLmZpbGVuYW1lRXhpc3RzKGZpbGVuYW1lKSkge1xuXHQgICAgICAgIHJldHVybiB0aGlzLmxvYWRKYXZhc2NyaXB0T2JqZWN0KGZpbGVuYW1lKTtcblx0ICAgICAgfVxuXHQgICAgICAvLyBmYWlsZWQgdG8gbG9hZCBhbnl0aGluZyFcblx0ICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9XG5cblx0ICAgIC8qKlxuXHQgICAgICogQXR0ZW1wdHMgdG8gbG9hZCBhIGRpcmVjdG9yeSBhY2NvcmRpbmcgdG8gTm9kZUpTIHJ1bGVzLlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge3N0cmluZ30gaWQgVGhlIGRpcmVjdG9yeSBuYW1lXG5cdCAgICAgKiBAcmV0dXJuIHtNb2R1bGV8bnVsbH0gTG9hZGVkIG1vZHVsZSwgbnVsbCBpZiBub3QgZm91bmQuXG5cdCAgICAgKi9cblx0ICAgIGxvYWRBc0RpcmVjdG9yeShpZCkge1xuXHQgICAgICAvLyAxLiBJZiBYL3BhY2thZ2UuanNvbiBpcyBhIGZpbGUsXG5cdCAgICAgIGxldCBmaWxlbmFtZSA9IHBhdGgucmVzb2x2ZShpZCwgJ3BhY2thZ2UuanNvbicpO1xuXHQgICAgICBpZiAodGhpcy5maWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkpIHtcblx0ICAgICAgICAvLyBhLiBQYXJzZSBYL3BhY2thZ2UuanNvbiwgYW5kIGxvb2sgZm9yIFwibWFpblwiIGZpZWxkLlxuXHQgICAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMubG9hZEphdmFzY3JpcHRPYmplY3QoZmlsZW5hbWUpO1xuXHQgICAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LmV4cG9ydHMgJiYgb2JqZWN0LmV4cG9ydHMubWFpbikge1xuXHQgICAgICAgICAgLy8gYi4gbGV0IE0gPSBYICsgKGpzb24gbWFpbiBmaWVsZClcblx0ICAgICAgICAgIGNvbnN0IG0gPSBwYXRoLnJlc29sdmUoaWQsIG9iamVjdC5leHBvcnRzLm1haW4pO1xuXHQgICAgICAgICAgLy8gYy4gTE9BRF9BU19GSUxFKE0pXG5cdCAgICAgICAgICByZXR1cm4gdGhpcy5sb2FkQXNGaWxlT3JEaXJlY3RvcnkobSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgLy8gMi4gSWYgWC9pbmRleC5qcyBpcyBhIGZpbGUsIGxvYWQgWC9pbmRleC5qcyBhcyBKYXZhU2NyaXB0IHRleHQuICBTVE9QXG5cdCAgICAgIGZpbGVuYW1lID0gcGF0aC5yZXNvbHZlKGlkLCAnaW5kZXguanMnKTtcblx0ICAgICAgaWYgKHRoaXMuZmlsZW5hbWVFeGlzdHMoZmlsZW5hbWUpKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMubG9hZEphdmFzY3JpcHRUZXh0KGZpbGVuYW1lKTtcblx0ICAgICAgfVxuXHQgICAgICAvLyAzLiBJZiBYL2luZGV4Lmpzb24gaXMgYSBmaWxlLCBwYXJzZSBYL2luZGV4Lmpzb24gdG8gYSBKYXZhU2NyaXB0IG9iamVjdC4gU1RPUFxuXHQgICAgICBmaWxlbmFtZSA9IHBhdGgucmVzb2x2ZShpZCwgJ2luZGV4Lmpzb24nKTtcblx0ICAgICAgaWYgKHRoaXMuZmlsZW5hbWVFeGlzdHMoZmlsZW5hbWUpKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMubG9hZEphdmFzY3JpcHRPYmplY3QoZmlsZW5hbWUpO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfVxuXG5cdCAgICAvKipcblx0ICAgICAqIFNldHVwIGEgc2FuZGJveCBhbmQgcnVuIHRoZSBtb2R1bGUncyBzY3JpcHQgaW5zaWRlIGl0LlxuXHQgICAgICogUmV0dXJucyB0aGUgcmVzdWx0IG9mIHRoZSBleGVjdXRlZCBzY3JpcHQuXG5cdCAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHNvdXJjZSAgIFtkZXNjcmlwdGlvbl1cblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZW5hbWUgW2Rlc2NyaXB0aW9uXVxuXHQgICAgICogQHJldHVybiB7Kn0gICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgICAgICovXG5cdCAgICBfcnVuU2NyaXB0KHNvdXJjZSwgZmlsZW5hbWUpIHtcblx0ICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cdCAgICAgIGZ1bmN0aW9uIHJlcXVpcmUocGF0aCkge1xuXHQgICAgICAgIHJldHVybiBzZWxmLnJlcXVpcmUocGF0aCk7XG5cdCAgICAgIH1cblx0ICAgICAgcmVxdWlyZS5tYWluID0gTW9kdWxlLm1haW47XG5cblx0ICAgICAgLy8gVGhpcyBcImZpcnN0IHRpbWVcIiBydW4gaXMgcmVhbGx5IG9ubHkgZm9yIGFwcC5qcywgQUZBSUNULCBhbmQgbmVlZHNcblx0ICAgICAgLy8gYW4gYWN0aXZpdHkuIElmIGFwcCB3YXMgcmVzdGFydGVkIGZvciBTZXJ2aWNlIG9ubHksIHdlIGRvbid0IHdhbnRcblx0ICAgICAgLy8gdG8gZ28gdGhpcyByb3V0ZS4gU28gYWRkZWQgY3VycmVudEFjdGl2aXR5IGNoZWNrLiAoYmlsbClcblx0ICAgICAgaWYgKHNlbGYuaWQgPT09ICcuJyAmJiAhdGhpcy5pc1NlcnZpY2UpIHtcblx0ICAgICAgICBnbG9iYWwucmVxdWlyZSA9IHJlcXVpcmU7XG5cblx0ICAgICAgICAvLyBjaGVjayBpZiB3ZSBoYXZlIGFuIGluc3BlY3RvciBiaW5kaW5nLi4uXG5cdCAgICAgICAgY29uc3QgaW5zcGVjdG9yID0ga3JvbGwuYmluZGluZygnaW5zcGVjdG9yJyk7XG5cdCAgICAgICAgaWYgKGluc3BlY3Rvcikge1xuXHQgICAgICAgICAgLy8gSWYgZGVidWdnZXIgaXMgZW5hYmxlZCwgbG9hZCBhcHAuanMgYW5kIHBhdXNlIHJpZ2h0IGJlZm9yZSB3ZSBleGVjdXRlIGl0XG5cdCAgICAgICAgICBjb25zdCBpbnNwZWN0b3JXcmFwcGVyID0gaW5zcGVjdG9yLmNhbGxBbmRQYXVzZU9uU3RhcnQ7XG5cdCAgICAgICAgICBpZiAoaW5zcGVjdG9yV3JhcHBlcikge1xuXHQgICAgICAgICAgICAvLyBGSVhNRSBXaHkgY2FuJ3Qgd2UgZG8gbm9ybWFsIE1vZHVsZS53cmFwKHNvdXJjZSkgaGVyZT9cblx0ICAgICAgICAgICAgLy8gSSBnZXQgXCJVbmNhdWdodCBUeXBlRXJyb3I6IENhbm5vdCByZWFkIHByb3BlcnR5ICdjcmVhdGVUYWJHcm91cCcgb2YgdW5kZWZpbmVkXCIgZm9yIFwiVGkuVUkuY3JlYXRlVGFiR3JvdXAoKTtcIlxuXHQgICAgICAgICAgICAvLyBOb3Qgc3VyZSB3aHkgYXBwLmpzIGlzIHNwZWNpYWwgY2FzZSBhbmQgY2FuJ3QgYmUgcnVuIHVuZGVyIG5vcm1hbCBzZWxmLWludm9raW5nIHdyYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZ2V0cyBwYXNzZWQgaW4gZ2xvYmFsL2tyb2xsL1RpL2V0Y1xuXHQgICAgICAgICAgICAvLyBJbnN0ZWFkLCBsZXQncyB1c2UgYSBzbGlnaHRseSBtb2RpZmllZCB2ZXJzaW9uIG9mIGNhbGxBbmRQYXVzZU9uU3RhcnQ6XG5cdCAgICAgICAgICAgIC8vIEl0IHdpbGwgY29tcGlsZSB0aGUgc291cmNlIGFzLWlzLCBzY2hlZHVsZSBhIHBhdXNlIGFuZCB0aGVuIHJ1biB0aGUgc291cmNlLlxuXHQgICAgICAgICAgICByZXR1cm4gaW5zcGVjdG9yV3JhcHBlcihzb3VyY2UsIGZpbGVuYW1lKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgLy8gcnVuIGFwcC5qcyBcIm5vcm1hbGx5XCIgKGkuZS4gbm90IHVuZGVyIGRlYnVnZ2VyL2luc3BlY3Rvcilcblx0ICAgICAgICByZXR1cm4gU2NyaXB0LnJ1bkluVGhpc0NvbnRleHQoc291cmNlLCBmaWxlbmFtZSwgdHJ1ZSk7XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBJbiBWOCwgd2UgdHJlYXQgZXh0ZXJuYWwgbW9kdWxlcyB0aGUgc2FtZSBhcyBuYXRpdmUgbW9kdWxlcy4gIEZpcnN0LCB3ZSB3cmFwIHRoZVxuXHQgICAgICAvLyBtb2R1bGUgY29kZSBhbmQgdGhlbiBydW4gaXQgaW4gdGhlIGN1cnJlbnQgY29udGV4dC4gIFRoaXMgd2lsbCBhbGxvdyBleHRlcm5hbCBtb2R1bGVzIHRvXG5cdCAgICAgIC8vIGFjY2VzcyBnbG9iYWxzIGFzIG1lbnRpb25lZCBpbiBUSU1PQi0xMTc1Mi4gVGhpcyB3aWxsIGFsc28gaGVscCByZXNvbHZlIHN0YXJ0dXAgc2xvd25lc3MgdGhhdFxuXHQgICAgICAvLyBvY2N1cnMgYXMgYSByZXN1bHQgb2YgY3JlYXRpbmcgYSBuZXcgY29udGV4dCBkdXJpbmcgc3RhcnR1cCBpbiBUSU1PQi0xMjI4Ni5cblx0ICAgICAgc291cmNlID0gTW9kdWxlLndyYXAoc291cmNlKTtcblx0ICAgICAgY29uc3QgZiA9IFNjcmlwdC5ydW5JblRoaXNDb250ZXh0KHNvdXJjZSwgZmlsZW5hbWUsIHRydWUpO1xuXHQgICAgICByZXR1cm4gZih0aGlzLmV4cG9ydHMsIHJlcXVpcmUsIHRoaXMsIGZpbGVuYW1lLCBwYXRoLmRpcm5hbWUoZmlsZW5hbWUpLCBUaXRhbml1bSwgVGksIGdsb2JhbCwga3JvbGwpO1xuXHQgICAgfVxuXG5cdCAgICAvKipcblx0ICAgICAqIExvb2sgdXAgYSBmaWxlbmFtZSBpbiB0aGUgYXBwJ3MgaW5kZXguanNvbiBmaWxlXG5cdCAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVuYW1lIHRoZSBmaWxlIHdlJ3JlIGxvb2tpbmcgZm9yXG5cdCAgICAgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgICAgIHRydWUgaWYgdGhlIGZpbGVuYW1lIGV4aXN0cyBpbiB0aGUgaW5kZXguanNvblxuXHQgICAgICovXG5cdCAgICBmaWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkge1xuXHQgICAgICBmaWxlbmFtZSA9ICdSZXNvdXJjZXMnICsgZmlsZW5hbWU7IC8vIFdoZW4gd2UgYWN0dWFsbHkgbG9vayBmb3IgZmlsZXMsIGFzc3VtZSBcIlJlc291cmNlcy9cIiBpcyB0aGUgcm9vdFxuXHQgICAgICBpZiAoIWZpbGVJbmRleCkge1xuXHQgICAgICAgIGNvbnN0IGpzb24gPSBhc3NldHMucmVhZEFzc2V0KElOREVYX0pTT04pO1xuXHQgICAgICAgIGZpbGVJbmRleCA9IEpTT04ucGFyc2UoanNvbik7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIGZpbGVJbmRleCAmJiBmaWxlbmFtZSBpbiBmaWxlSW5kZXg7XG5cdCAgICB9XG5cdCAgfVxuXHQgIE1vZHVsZS5jYWNoZSA9IFtdO1xuXHQgIE1vZHVsZS5tYWluID0gbnVsbDtcblx0ICBNb2R1bGUud3JhcHBlciA9IFsnKGZ1bmN0aW9uIChleHBvcnRzLCByZXF1aXJlLCBtb2R1bGUsIF9fZmlsZW5hbWUsIF9fZGlybmFtZSwgVGl0YW5pdW0sIFRpLCBnbG9iYWwsIGtyb2xsKSB7JywgJ1xcbn0pOyddO1xuXHQgIE1vZHVsZS53cmFwID0gZnVuY3Rpb24gKHNjcmlwdCkge1xuXHQgICAgcmV0dXJuIE1vZHVsZS53cmFwcGVyWzBdICsgc2NyaXB0ICsgTW9kdWxlLndyYXBwZXJbMV07XG5cdCAgfTtcblxuXHQgIC8qKlxuXHQgICAqIFtydW5Nb2R1bGUgZGVzY3JpcHRpb25dXG5cdCAgICogQHBhcmFtICB7U3RyaW5nfSBzb3VyY2UgICAgICAgICAgICBKUyBTb3VyY2UgY29kZVxuXHQgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZW5hbWUgICAgICAgICAgRmlsZW5hbWUgb2YgdGhlIG1vZHVsZVxuXHQgICAqIEBwYXJhbSAge1RpdGFuaXVtLlNlcnZpY2V8bnVsbHxUaXRhbml1bS5BbmRyb2lkLkFjdGl2aXR5fSBhY3Rpdml0eU9yU2VydmljZSBbZGVzY3JpcHRpb25dXG5cdCAgICogQHJldHVybiB7TW9kdWxlfSAgICAgICAgICAgICAgICAgICBUaGUgbG9hZGVkIE1vZHVsZVxuXHQgICAqL1xuXHQgIE1vZHVsZS5ydW5Nb2R1bGUgPSBmdW5jdGlvbiAoc291cmNlLCBmaWxlbmFtZSwgYWN0aXZpdHlPclNlcnZpY2UpIHtcblx0ICAgIGxldCBpZCA9IGZpbGVuYW1lO1xuXHQgICAgaWYgKCFNb2R1bGUubWFpbikge1xuXHQgICAgICBpZCA9ICcuJztcblx0ICAgIH1cblx0ICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBNb2R1bGUoaWQsIG51bGwpO1xuXHQgICAgLy8gRklYTUU6IEkgZG9uJ3Qga25vdyB3aHkgaW5zdGFuY2VvZiBmb3IgVGl0YW5pdW0uU2VydmljZSB3b3JrcyBoZXJlIVxuXHQgICAgLy8gT24gQW5kcm9pZCwgaXQncyBhbiBhcGluYW1lIG9mIFRpLkFuZHJvaWQuU2VydmljZVxuXHQgICAgLy8gT24gaU9TLCB3ZSBkb24ndCB5ZXQgcGFzcyBpbiB0aGUgdmFsdWUsIGJ1dCB3ZSBkbyBzZXQgVGkuQXBwLmN1cnJlbnRTZXJ2aWNlIHByb3BlcnR5IGJlZm9yZWhhbmQhXG5cdCAgICAvLyBDYW4gd2UgcmVtb3ZlIHRoZSBwcmVsb2FkIHN0dWZmIGluIEtyb2xsQnJpZGdlLm0gdG8gcGFzcyBhbG9uZyB0aGUgc2VydmljZSBpbnN0YW5jZSBpbnRvIHRoaXMgbGlrZSB3ZSBkbyBvbiBBbmRvcmlkP1xuXHQgICAgbW9kdWxlLmlzU2VydmljZSA9IGFjdGl2aXR5T3JTZXJ2aWNlIGluc3RhbmNlb2YgVGl0YW5pdW0uU2VydmljZSA7XG5cdCAgICB7XG5cdCAgICAgIGlmIChtb2R1bGUuaXNTZXJ2aWNlKSB7XG5cdCAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFRpLkFuZHJvaWQsICdjdXJyZW50U2VydmljZScsIHtcblx0ICAgICAgICAgIHZhbHVlOiBhY3Rpdml0eU9yU2VydmljZSxcblx0ICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcblx0ICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHQgICAgICAgIH0pO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaS5BbmRyb2lkLCAnY3VycmVudFNlcnZpY2UnLCB7XG5cdCAgICAgICAgICB2YWx1ZTogbnVsbCxcblx0ICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcblx0ICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHQgICAgICAgIH0pO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgICBpZiAoIU1vZHVsZS5tYWluKSB7XG5cdCAgICAgIE1vZHVsZS5tYWluID0gbW9kdWxlO1xuXHQgICAgfVxuXHQgICAgZmlsZW5hbWUgPSBmaWxlbmFtZS5yZXBsYWNlKCdSZXNvdXJjZXMvJywgJy8nKTsgLy8gbm9ybWFsaXplIGJhY2sgdG8gYWJzb2x1dGUgcGF0aHMgKHdoaWNoIHJlYWxseSBhcmUgcmVsYXRpdmUgdG8gUmVzb3VyY2VzIHVuZGVyIHRoZSBob29kKVxuXHQgICAgbW9kdWxlLmxvYWQoZmlsZW5hbWUsIHNvdXJjZSk7XG5cdCAgICB7XG5cdCAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaS5BbmRyb2lkLCAnY3VycmVudFNlcnZpY2UnLCB7XG5cdCAgICAgICAgdmFsdWU6IG51bGwsXG5cdCAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuXHQgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHQgICAgICB9KTtcblx0ICAgIH1cblx0ICAgIHJldHVybiBtb2R1bGU7XG5cdCAgfTtcblx0ICByZXR1cm4gTW9kdWxlO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgaGFuZ3MgdGhlIFByb3h5IHR5cGUgb2ZmIFRpIG5hbWVzcGFjZS4gSXQgYWxzbyBnZW5lcmF0ZXMgYSBoaWRkZW4gX3Byb3BlcnRpZXMgb2JqZWN0XG5cdCAqIHRoYXQgaXMgdXNlZCB0byBzdG9yZSBwcm9wZXJ0eSB2YWx1ZXMgb24gdGhlIEpTIHNpZGUgZm9yIGphdmEgUHJveGllcy5cblx0ICogQmFzaWNhbGx5IHRoZXNlIGdldC9zZXQgbWV0aG9kcyBhcmUgZmFsbGJhY2tzIGZvciB3aGVuIGEgSmF2YSBwcm94eSBkb2Vzbid0IGhhdmUgYSBuYXRpdmUgbWV0aG9kIHRvIGhhbmRsZSBnZXR0aW5nL3NldHRpbmcgdGhlIHByb3BlcnR5LlxuXHQgKiAoc2VlIFByb3h5LmgvUHJveHlCaW5kaW5nVjguY3BwLmZtIGZvciBtb3JlIGluZm8pXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0aUJpbmRpbmcgdGhlIHVuZGVybHlpbmcgJ1RpdGFuaXVtJyBuYXRpdmUgYmluZGluZyAoc2VlIEtyb2xsQmluZGluZ3M6OmluaXRUaXRhbml1bSlcblx0ICogQHBhcmFtIHtvYmplY3R9IFRpIHRoZSBnbG9iYWwuVGl0YW5pdW0gb2JqZWN0XG5cdCAqL1xuXHRmdW5jdGlvbiBQcm94eUJvb3RzdHJhcCh0aUJpbmRpbmcsIFRpKSB7XG5cdCAgY29uc3QgUHJveHkgPSB0aUJpbmRpbmcuUHJveHk7XG5cdCAgVGkuUHJveHkgPSBQcm94eTtcblx0ICBQcm94eS5kZWZpbmVQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKHByb3h5UHJvdG90eXBlLCBuYW1lcykge1xuXHQgICAgY29uc3QgcHJvcGVydGllcyA9IHt9O1xuXHQgICAgY29uc3QgbGVuID0gbmFtZXMubGVuZ3RoO1xuXHQgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuXHQgICAgICBjb25zdCBuYW1lID0gbmFtZXNbaV07XG5cdCAgICAgIHByb3BlcnRpZXNbbmFtZV0gPSB7XG5cdCAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG5cdCAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvb3AtZnVuY1xuXHQgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvcGVydHkobmFtZSk7XG5cdCAgICAgICAgfSxcblx0ICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb29wLWZ1bmNcblx0ICAgICAgICAgIHRoaXMuc2V0UHJvcGVydHlBbmRGaXJlKG5hbWUsIHZhbHVlKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIGVudW1lcmFibGU6IHRydWVcblx0ICAgICAgfTtcblx0ICAgIH1cblx0ICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHByb3h5UHJvdG90eXBlLCBwcm9wZXJ0aWVzKTtcblx0ICB9O1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eS5wcm90b3R5cGUsICdnZXRQcm9wZXJ0eScsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuX3Byb3BlcnRpZXNbcHJvcGVydHldO1xuXHQgICAgfSxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7XG5cdCAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3h5LnByb3RvdHlwZSwgJ3NldFByb3BlcnR5Jywge1xuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIChwcm9wZXJ0eSwgdmFsdWUpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuX3Byb3BlcnRpZXNbcHJvcGVydHldID0gdmFsdWU7XG5cdCAgICB9LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTtcblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHkucHJvdG90eXBlLCAnc2V0UHJvcGVydGllc0FuZEZpcmUnLCB7XG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcblx0ICAgICAgY29uc3Qgb3duTmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm9wZXJ0aWVzKTtcblx0ICAgICAgY29uc3QgbGVuID0gb3duTmFtZXMubGVuZ3RoO1xuXHQgICAgICBjb25zdCBjaGFuZ2VzID0gW107XG5cdCAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcblx0ICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG93bk5hbWVzW2ldO1xuXHQgICAgICAgIGNvbnN0IHZhbHVlID0gcHJvcGVydGllc1twcm9wZXJ0eV07XG5cdCAgICAgICAgaWYgKCFwcm9wZXJ0eSkge1xuXHQgICAgICAgICAgY29udGludWU7XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy5fcHJvcGVydGllc1twcm9wZXJ0eV07XG5cdCAgICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wZXJ0eV0gPSB2YWx1ZTtcblx0ICAgICAgICBpZiAodmFsdWUgIT09IG9sZFZhbHVlKSB7XG5cdCAgICAgICAgICBjaGFuZ2VzLnB1c2goW3Byb3BlcnR5LCBvbGRWYWx1ZSwgdmFsdWVdKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKGNoYW5nZXMubGVuZ3RoID4gMCkge1xuXHQgICAgICAgIHRoaXMub25Qcm9wZXJ0aWVzQ2hhbmdlZChjaGFuZ2VzKTtcblx0ICAgICAgfVxuXHQgICAgfSxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7XG5cdH1cblxuXHQvKiBnbG9iYWxzIE9TX0FORFJPSUQsT1NfSU9TICovXG5cdGZ1bmN0aW9uIGJvb3RzdHJhcCQxKGdsb2JhbCwga3JvbGwpIHtcblx0ICB7XG5cdCAgICBjb25zdCB0aUJpbmRpbmcgPSBrcm9sbC5iaW5kaW5nKCdUaXRhbml1bScpO1xuXHQgICAgY29uc3QgVGkgPSB0aUJpbmRpbmcuVGl0YW5pdW07XG5cdCAgICBjb25zdCBib290c3RyYXAgPSBrcm9sbC5OYXRpdmVNb2R1bGUucmVxdWlyZSgnYm9vdHN0cmFwJyk7XG5cdCAgICAvLyBUaGUgYm9vdHN0cmFwIGRlZmluZXMgbGF6eSBuYW1lc3BhY2UgcHJvcGVydHkgdHJlZSAqKmFuZCoqXG5cdCAgICAvLyBzZXRzIHVwIHNwZWNpYWwgQVBJcyB0aGF0IGdldCB3cmFwcGVkIHRvIHBhc3MgYWxvbmcgc291cmNlVXJsIHZpYSBhIEtyb2xsSW52b2NhdGlvbiBvYmplY3Rcblx0ICAgIGJvb3RzdHJhcC5ib290c3RyYXAoVGkpO1xuXHQgICAgYm9vdHN0cmFwLmRlZmluZUxhenlCaW5kaW5nKFRpLCAnQVBJJyk7IC8vIEJhc2ljYWxseSBkb2VzIHRoZSBzYW1lIHRoaW5nIGlPUyBkb2VzIGZvciBBUEkgbW9kdWxlIChsYXp5IHByb3BlcnR5IGdldHRlcilcblxuXHQgICAgLy8gSGVyZSwgd2UgZ28gdGhyb3VnaCBhbGwgdGhlIHNwZWNpYWxseSBtYXJrZWQgQVBJcyB0byBnZW5lcmF0ZSB0aGUgd3JhcHBlcnMgdG8gcGFzcyBpbiB0aGUgc291cmNlVXJsXG5cdCAgICAvLyBUT0RPOiBUaGlzIGlzIGFsbCBpbnNhbmUsIGFuZCB3ZSBzaG91bGQganVzdCBiYWtlIGl0IGludG8gdGhlIFByb3h5IGNvbnZlcnNpb24gc3R1ZmYgdG8gZ3JhYiBhbmQgcGFzcyBhbG9uZyBzb3VyY2VVcmxcblx0ICAgIC8vIFJhdGhlciB0aGFuIGNhcnJ5IGl0IGFsbCBvdmVyIHRoZSBwbGFjZSBsaWtlIHRoaXMhXG5cdCAgICAvLyBXZSBhbHJlYWR5IG5lZWQgdG8gZ2VuZXJhdGUgYSBLcm9sbEludm9jYXRpb24gb2JqZWN0IHRvIHdyYXAgdGhlIHNvdXJjZVVybCFcblx0ICAgIGZ1bmN0aW9uIFRpdGFuaXVtV3JhcHBlcihjb250ZXh0KSB7XG5cdCAgICAgIGNvbnN0IHNvdXJjZVVybCA9IHRoaXMuc291cmNlVXJsID0gY29udGV4dC5zb3VyY2VVcmw7XG5cdCAgICAgIGNvbnN0IHNjb3BlVmFycyA9IG5ldyBrcm9sbC5TY29wZVZhcnMoe1xuXHQgICAgICAgIHNvdXJjZVVybFxuXHQgICAgICB9KTtcblx0ICAgICAgVGkuYmluZEludm9jYXRpb25BUElzKHRoaXMsIHNjb3BlVmFycyk7XG5cdCAgICB9XG5cdCAgICBUaXRhbml1bVdyYXBwZXIucHJvdG90eXBlID0gVGk7XG5cdCAgICBUaS5XcmFwcGVyID0gVGl0YW5pdW1XcmFwcGVyO1xuXG5cdCAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHQgICAgLy8gVGhpcyBsb29wcyB0aHJvdWdoIGFsbCBrbm93biBBUElzIHRoYXQgcmVxdWlyZSBhblxuXHQgICAgLy8gSW52b2NhdGlvbiBvYmplY3QgYW5kIHdyYXBzIHRoZW0gc28gd2UgY2FuIHBhc3MgYVxuXHQgICAgLy8gc291cmNlIFVSTCBhcyB0aGUgZmlyc3QgYXJndW1lbnRcblx0ICAgIFRpLmJpbmRJbnZvY2F0aW9uQVBJcyA9IGZ1bmN0aW9uICh3cmFwcGVyVGksIHNjb3BlVmFycykge1xuXHQgICAgICBmb3IgKGNvbnN0IGFwaSBvZiBUaS5pbnZvY2F0aW9uQVBJcykge1xuXHQgICAgICAgIC8vIHNlcGFyYXRlIGVhY2ggaW52b2tlciBpbnRvIGl0J3Mgb3duIHByaXZhdGUgc2NvcGVcblx0ICAgICAgICBpbnZva2VyLmdlbkludm9rZXIod3JhcHBlclRpLCBUaSwgJ1RpdGFuaXVtJywgYXBpLCBzY29wZVZhcnMpO1xuXHQgICAgICB9XG5cdCAgICB9O1xuXHQgICAgUHJveHlCb290c3RyYXAodGlCaW5kaW5nLCBUaSk7XG5cdCAgICByZXR1cm4gbmV3IFRpdGFuaXVtV3JhcHBlcih7XG5cdCAgICAgIC8vIEV2ZW4gdGhvdWdoIHRoZSBlbnRyeSBwb2ludCBpcyByZWFsbHkgdGk6Ly9rcm9sbC5qcywgdGhhdCB3aWxsIGJyZWFrIHJlc29sdXRpb24gb2YgdXJscyB1bmRlciB0aGUgY292ZXJzIVxuXHQgICAgICAvLyBTbyBiYXNpY2FsbHkganVzdCBhc3N1bWUgYXBwLmpzIGFzIHRoZSByZWxhdGl2ZSBmaWxlIGJhc2Vcblx0ICAgICAgc291cmNlVXJsOiAnYXBwOi8vYXBwLmpzJ1xuXHQgICAgfSk7XG5cdCAgfVxuXHR9XG5cblx0Ly8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG5cblx0Ly8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcblx0Ly8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuXHQvLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcblx0Ly8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuXHQvLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG5cdC8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuXHQvLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuXHQvLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuXHQvLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuXHQvLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG5cdC8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcblx0Ly8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuXHQvLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcblx0Ly8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG5cdC8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcblx0Ly8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuXHQvLyBNb2RpZmljYXRpb25zIENvcHlyaWdodCAyMDExLVByZXNlbnQgQXBwY2VsZXJhdG9yLCBJbmMuXG5cdGZ1bmN0aW9uIEV2ZW50RW1pdHRlckJvb3RzdHJhcChnbG9iYWwsIGtyb2xsKSB7XG5cdCAgY29uc3QgVEFHID0gJ0V2ZW50RW1pdHRlcic7XG5cdCAgY29uc3QgRXZlbnRFbWl0dGVyID0ga3JvbGwuRXZlbnRFbWl0dGVyO1xuXHQgIGNvbnN0IGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG5cdCAgLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuXHQgIC8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuXHQgIC8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuXG5cdCAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlci5wcm90b3R5cGUsICdjYWxsSGFuZGxlcicsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAoaGFuZGxlciwgdHlwZSwgZGF0YSkge1xuXHQgICAgICAvLyBrcm9sbC5sb2coVEFHLCBcImNhbGxpbmcgZXZlbnQgaGFuZGxlcjogdHlwZTpcIiArIHR5cGUgKyBcIiwgZGF0YTogXCIgKyBkYXRhICsgXCIsIGhhbmRsZXI6IFwiICsgaGFuZGxlcik7XG5cblx0ICAgICAgdmFyIGhhbmRsZWQgPSBmYWxzZSxcblx0ICAgICAgICBjYW5jZWxCdWJibGUgPSBkYXRhLmNhbmNlbEJ1YmJsZSxcblx0ICAgICAgICBldmVudDtcblx0ICAgICAgaWYgKGhhbmRsZXIubGlzdGVuZXIgJiYgaGFuZGxlci5saXN0ZW5lci5jYWxsKSB7XG5cdCAgICAgICAgLy8gQ3JlYXRlIGV2ZW50IG9iamVjdCwgY29weSBhbnkgY3VzdG9tIGV2ZW50IGRhdGEsIGFuZCBzZXQgdGhlIFwidHlwZVwiIGFuZCBcInNvdXJjZVwiIHByb3BlcnRpZXMuXG5cdCAgICAgICAgZXZlbnQgPSB7XG5cdCAgICAgICAgICB0eXBlOiB0eXBlLFxuXHQgICAgICAgICAgc291cmNlOiB0aGlzXG5cdCAgICAgICAgfTtcblx0ICAgICAgICBrcm9sbC5leHRlbmQoZXZlbnQsIGRhdGEpO1xuXHQgICAgICAgIGlmIChoYW5kbGVyLnNlbGYgJiYgZXZlbnQuc291cmNlID09IGhhbmRsZXIuc2VsZi52aWV3KSB7XG5cdCAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuXHQgICAgICAgICAgZXZlbnQuc291cmNlID0gaGFuZGxlci5zZWxmO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBoYW5kbGVyLmxpc3RlbmVyLmNhbGwodGhpcywgZXZlbnQpO1xuXG5cdCAgICAgICAgLy8gVGhlIFwiY2FuY2VsQnViYmxlXCIgcHJvcGVydHkgbWF5IGJlIHJlc2V0IGluIHRoZSBoYW5kbGVyLlxuXHQgICAgICAgIGlmIChldmVudC5jYW5jZWxCdWJibGUgIT09IGNhbmNlbEJ1YmJsZSkge1xuXHQgICAgICAgICAgY2FuY2VsQnViYmxlID0gZXZlbnQuY2FuY2VsQnViYmxlO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBoYW5kbGVkID0gdHJ1ZTtcblx0ICAgICAgfSBlbHNlIGlmIChrcm9sbC5EQkcpIHtcblx0ICAgICAgICBrcm9sbC5sb2coVEFHLCAnaGFuZGxlciBmb3IgZXZlbnQgXFwnJyArIHR5cGUgKyAnXFwnIGlzICcgKyB0eXBlb2YgaGFuZGxlci5saXN0ZW5lciArICcgYW5kIGNhbm5vdCBiZSBjYWxsZWQuJyk7XG5cdCAgICAgIH1cblxuXHQgICAgICAvLyBCdWJibGUgdGhlIGV2ZW50cyB0byB0aGUgcGFyZW50IHZpZXcgaWYgbmVlZGVkLlxuXHQgICAgICBpZiAoZGF0YS5idWJibGVzICYmICFjYW5jZWxCdWJibGUpIHtcblx0ICAgICAgICBoYW5kbGVkID0gdGhpcy5fZmlyZVN5bmNFdmVudFRvUGFyZW50KHR5cGUsIGRhdGEpIHx8IGhhbmRsZWQ7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIGhhbmRsZWQ7XG5cdCAgICB9LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTtcblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwgJ2VtaXQnLCB7XG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gKHR5cGUpIHtcblx0ICAgICAgdmFyIGhhbmRsZWQgPSBmYWxzZSxcblx0ICAgICAgICBkYXRhID0gYXJndW1lbnRzWzFdLFxuXHQgICAgICAgIGhhbmRsZXIsXG5cdCAgICAgICAgbGlzdGVuZXJzO1xuXG5cdCAgICAgIC8vIFNldCB0aGUgXCJidWJibGVzXCIgYW5kIFwiY2FuY2VsQnViYmxlXCIgcHJvcGVydGllcyBmb3IgZXZlbnQgZGF0YS5cblx0ICAgICAgaWYgKGRhdGEgIT09IG51bGwgJiYgdHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgZGF0YS5idWJibGVzID0gISFkYXRhLmJ1YmJsZXM7XG5cdCAgICAgICAgZGF0YS5jYW5jZWxCdWJibGUgPSAhIWRhdGEuY2FuY2VsQnViYmxlO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIGRhdGEgPSB7XG5cdCAgICAgICAgICBidWJibGVzOiBmYWxzZSxcblx0ICAgICAgICAgIGNhbmNlbEJ1YmJsZTogZmFsc2Vcblx0ICAgICAgICB9O1xuXHQgICAgICB9XG5cdCAgICAgIGlmICh0aGlzLl9oYXNKYXZhTGlzdGVuZXIpIHtcblx0ICAgICAgICB0aGlzLl9vbkV2ZW50RmlyZWQodHlwZSwgZGF0YSk7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSB8fCAhdGhpcy5jYWxsSGFuZGxlcikge1xuXHQgICAgICAgIGlmIChkYXRhLmJ1YmJsZXMgJiYgIWRhdGEuY2FuY2VsQnViYmxlKSB7XG5cdCAgICAgICAgICBoYW5kbGVkID0gdGhpcy5fZmlyZVN5bmNFdmVudFRvUGFyZW50KHR5cGUsIGRhdGEpO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXR1cm4gaGFuZGxlZDtcblx0ICAgICAgfVxuXHQgICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXHQgICAgICBpZiAodHlwZW9mIGhhbmRsZXIubGlzdGVuZXIgPT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICBoYW5kbGVkID0gdGhpcy5jYWxsSGFuZGxlcihoYW5kbGVyLCB0eXBlLCBkYXRhKTtcblx0ICAgICAgfSBlbHNlIGlmIChpc0FycmF5KGhhbmRsZXIpKSB7XG5cdCAgICAgICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuXHQgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHQgICAgICAgICAgaGFuZGxlZCA9IHRoaXMuY2FsbEhhbmRsZXIobGlzdGVuZXJzW2ldLCB0eXBlLCBkYXRhKSB8fCBoYW5kbGVkO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSBlbHNlIGlmIChkYXRhLmJ1YmJsZXMgJiYgIWRhdGEuY2FuY2VsQnViYmxlKSB7XG5cdCAgICAgICAgaGFuZGxlZCA9IHRoaXMuX2ZpcmVTeW5jRXZlbnRUb1BhcmVudCh0eXBlLCBkYXRhKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gaGFuZGxlZDtcblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXG5cdCAgLy8gVGl0YW5pdW0gY29tcGF0aWJpbGl0eVxuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnZmlyZUV2ZW50Jywge1xuXHQgICAgdmFsdWU6IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlLFxuXHQgICAgd3JpdGFibGU6IHRydWVcblx0ICB9KTtcblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwgJ2ZpcmVTeW5jRXZlbnQnLCB7XG5cdCAgICB2YWx1ZTogRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTtcblxuXHQgIC8vIEV2ZW50RW1pdHRlciBpcyBkZWZpbmVkIGluIHNyYy9ub2RlX2V2ZW50cy5jY1xuXHQgIC8vIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCgpIGlzIGFsc28gZGVmaW5lZCB0aGVyZS5cblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwgJ2FkZExpc3RlbmVyJywge1xuXHQgICAgdmFsdWU6IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lciwgdmlldykge1xuXHQgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdhZGRMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbi4gVGhlIGxpc3RlbmVyIGZvciBldmVudCBcIicgKyB0eXBlICsgJ1wiIGlzIFwiJyArIHR5cGVvZiBsaXN0ZW5lciArICdcIicpO1xuXHQgICAgICB9XG5cdCAgICAgIGlmICghdGhpcy5fZXZlbnRzKSB7XG5cdCAgICAgICAgdGhpcy5fZXZlbnRzID0ge307XG5cdCAgICAgIH1cblx0ICAgICAgdmFyIGlkO1xuXG5cdCAgICAgIC8vIFNldHVwIElEIGZpcnN0IHNvIHdlIGNhbiBwYXNzIGNvdW50IGluIHRvIFwibGlzdGVuZXJBZGRlZFwiXG5cdCAgICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG5cdCAgICAgICAgaWQgPSAwO1xuXHQgICAgICB9IGVsc2UgaWYgKGlzQXJyYXkodGhpcy5fZXZlbnRzW3R5cGVdKSkge1xuXHQgICAgICAgIGlkID0gdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBpZCA9IDE7XG5cdCAgICAgIH1cblx0ICAgICAgdmFyIGxpc3RlbmVyV3JhcHBlciA9IHt9O1xuXHQgICAgICBsaXN0ZW5lcldyYXBwZXIubGlzdGVuZXIgPSBsaXN0ZW5lcjtcblx0ICAgICAgbGlzdGVuZXJXcmFwcGVyLnNlbGYgPSB2aWV3O1xuXHQgICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuXHQgICAgICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuXHQgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyV3JhcHBlcjtcblx0ICAgICAgfSBlbHNlIGlmIChpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcblx0ICAgICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG5cdCAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXJXcmFwcGVyKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cblx0ICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcldyYXBwZXJdO1xuXHQgICAgICB9XG5cblx0ICAgICAgLy8gTm90aWZ5IHRoZSBKYXZhIHByb3h5IGlmIHRoaXMgaXMgdGhlIGZpcnN0IGxpc3RlbmVyIGFkZGVkLlxuXHQgICAgICBpZiAoaWQgPT09IDApIHtcblx0ICAgICAgICB0aGlzLl9oYXNMaXN0ZW5lcnNGb3JFdmVudFR5cGUodHlwZSwgdHJ1ZSk7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIGlkO1xuXHQgICAgfSxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7XG5cblx0ICAvLyBUaGUgSmF2YU9iamVjdCBwcm90b3R5cGUgd2lsbCBwcm92aWRlIGEgdmVyc2lvbiBvZiB0aGlzXG5cdCAgLy8gdGhhdCBkZWxlZ2F0ZXMgYmFjayB0byB0aGUgSmF2YSBwcm94eS4gTm9uLUphdmEgdmVyc2lvbnNcblx0ICAvLyBvZiBFdmVudEVtaXR0ZXIgZG9uJ3QgY2FyZSwgc28gdGhpcyBubyBvcCBpcyBjYWxsZWQgaW5zdGVhZC5cblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwgJ19saXN0ZW5lckZvckV2ZW50Jywge1xuXHQgICAgdmFsdWU6IGZ1bmN0aW9uICgpIHt9LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTtcblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwgJ29uJywge1xuXHQgICAgdmFsdWU6IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIsXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXG5cdCAgLy8gVGl0YW5pdW0gY29tcGF0aWJpbGl0eVxuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnYWRkRXZlbnRMaXN0ZW5lcicsIHtcblx0ICAgIHZhbHVlOiBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyLFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2UsXG5cdCAgICB3cml0YWJsZTogdHJ1ZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnb25jZScsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0ICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXHQgICAgICBmdW5jdGlvbiBnKCkge1xuXHQgICAgICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cdCAgICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblx0ICAgICAgfVxuXHQgICAgICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG5cdCAgICAgIHNlbGYub24odHlwZSwgZyk7XG5cdCAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7XG5cdCAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlci5wcm90b3R5cGUsICdyZW1vdmVMaXN0ZW5lcicsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0ICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcigncmVtb3ZlTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuXHQgICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgIH1cblx0ICAgICAgdmFyIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cdCAgICAgIHZhciBjb3VudCA9IDA7XG5cdCAgICAgIGlmIChpc0FycmF5KGxpc3QpKSB7XG5cdCAgICAgICAgdmFyIHBvc2l0aW9uID0gLTE7XG5cdCAgICAgICAgLy8gQWxzbyBzdXBwb3J0IGxpc3RlbmVyIGluZGV4ZXMgLyBpZHNcblx0ICAgICAgICBpZiAodHlwZW9mIGxpc3RlbmVyID09PSAnbnVtYmVyJykge1xuXHQgICAgICAgICAgcG9zaXRpb24gPSBsaXN0ZW5lcjtcblx0ICAgICAgICAgIGlmIChwb3NpdGlvbiA+IGxpc3QubGVuZ3RoIHx8IHBvc2l0aW9uIDwgMCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYgKGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG5cdCAgICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuXHQgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHtcblx0ICAgICAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG5cdCAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG5cdCAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgICBjb3VudCA9IGxpc3QubGVuZ3RoO1xuXHQgICAgICB9IGVsc2UgaWYgKGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyIHx8IGxpc3RlbmVyID09IDApIHtcblx0ICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuXHQgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgIH1cblx0ICAgICAgaWYgKGNvdW50ID09PSAwKSB7XG5cdCAgICAgICAgdGhpcy5faGFzTGlzdGVuZXJzRm9yRXZlbnRUeXBlKHR5cGUsIGZhbHNlKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAncmVtb3ZlRXZlbnRMaXN0ZW5lcicsIHtcblx0ICAgIHZhbHVlOiBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyLFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2UsXG5cdCAgICB3cml0YWJsZTogdHJ1ZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAncmVtb3ZlQWxsTGlzdGVuZXJzJywge1xuXHQgICAgdmFsdWU6IGZ1bmN0aW9uICh0eXBlKSB7XG5cdCAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuXHQgICAgICBpZiAodHlwZSAmJiB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG5cdCAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcblx0ICAgICAgICB0aGlzLl9oYXNMaXN0ZW5lcnNGb3JFdmVudFR5cGUodHlwZSwgZmFsc2UpO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiB0aGlzO1xuXHQgICAgfSxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7XG5cdCAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlci5wcm90b3R5cGUsICdsaXN0ZW5lcnMnLCB7XG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gKHR5cGUpIHtcblx0ICAgICAgaWYgKCF0aGlzLl9ldmVudHMpIHtcblx0ICAgICAgICB0aGlzLl9ldmVudHMgPSB7fTtcblx0ICAgICAgfVxuXHQgICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuXHQgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuXHQgICAgICB9XG5cdCAgICAgIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cdCAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXHQgIHJldHVybiBFdmVudEVtaXR0ZXI7XG5cdH1cblxuXHQvKipcblx0ICogVGhpcyBpcyB1c2VkIGJ5IEFuZHJvaWQgdG8gcmVxdWlyZSBcImJha2VkLWluXCIgc291cmNlLlxuXHQgKiBTREsgYW5kIG1vZHVsZSBidWlsZHMgd2lsbCBiYWtlIGluIHRoZSByYXcgc291cmNlIGFzIGMgc3RyaW5ncywgYW5kIHRoaXMgd2lsbCB3cmFwXG5cdCAqIGxvYWRpbmcgdGhhdCBjb2RlIGluIHZpYSBrcm9sbC5OYXRpdmVNb2R1bGUucmVxdWlyZSg8aWQ+KVxuXHQgKiBGb3IgbW9yZSBpbmZvcm1hdGlvbiwgc2VlIHRoZSBib290c3RyYXAuanMuZWpzIHRlbXBsYXRlLlxuXHQgKi9cblx0ZnVuY3Rpb24gTmF0aXZlTW9kdWxlQm9vdHN0cmFwKGdsb2JhbCwga3JvbGwpIHtcblx0ICBjb25zdCBTY3JpcHQgPSBrcm9sbC5iaW5kaW5nKCdldmFscycpLlNjcmlwdDtcblx0ICBjb25zdCBydW5JblRoaXNDb250ZXh0ID0gU2NyaXB0LnJ1bkluVGhpc0NvbnRleHQ7XG5cdCAgZnVuY3Rpb24gTmF0aXZlTW9kdWxlKGlkKSB7XG5cdCAgICB0aGlzLmZpbGVuYW1lID0gaWQgKyAnLmpzJztcblx0ICAgIHRoaXMuaWQgPSBpZDtcblx0ICAgIHRoaXMuZXhwb3J0cyA9IHt9O1xuXHQgICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcblx0ICB9XG5cblx0ICAvKipcblx0ICAgKiBUaGlzIHNob3VsZCBiZSBhbiBvYmplY3Qgd2l0aCBzdHJpbmcga2V5cyAoYmFrZWQgaW4gbW9kdWxlIGlkcykgLT4gc3RyaW5nIHZhbHVlcyAoc291cmNlIG9mIHRoZSBiYWtlZCBpbiBqcyBjb2RlKVxuXHQgICAqL1xuXHQgIE5hdGl2ZU1vZHVsZS5fc291cmNlID0ga3JvbGwuYmluZGluZygnbmF0aXZlcycpO1xuXHQgIE5hdGl2ZU1vZHVsZS5fY2FjaGUgPSB7fTtcblx0ICBOYXRpdmVNb2R1bGUucmVxdWlyZSA9IGZ1bmN0aW9uIChpZCkge1xuXHQgICAgaWYgKGlkID09PSAnbmF0aXZlX21vZHVsZScpIHtcblx0ICAgICAgcmV0dXJuIE5hdGl2ZU1vZHVsZTtcblx0ICAgIH1cblx0ICAgIGlmIChpZCA9PT0gJ2ludm9rZXInKSB7XG5cdCAgICAgIHJldHVybiBpbnZva2VyOyAvLyBBbmRyb2lkIG5hdGl2ZSBtb2R1bGVzIHVzZSBhIGJvb3RzdHJhcC5qcyBmaWxlIHRoYXQgYXNzdW1lcyB0aGVyZSdzIGEgYnVpbHRpbiAnaW52b2tlcidcblx0ICAgIH1cblxuXHQgICAgY29uc3QgY2FjaGVkID0gTmF0aXZlTW9kdWxlLmdldENhY2hlZChpZCk7XG5cdCAgICBpZiAoY2FjaGVkKSB7XG5cdCAgICAgIHJldHVybiBjYWNoZWQuZXhwb3J0cztcblx0ICAgIH1cblx0ICAgIGlmICghTmF0aXZlTW9kdWxlLmV4aXN0cyhpZCkpIHtcblx0ICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBzdWNoIG5hdGl2ZSBtb2R1bGUgJyArIGlkKTtcblx0ICAgIH1cblx0ICAgIGNvbnN0IG5hdGl2ZU1vZHVsZSA9IG5ldyBOYXRpdmVNb2R1bGUoaWQpO1xuXHQgICAgbmF0aXZlTW9kdWxlLmNvbXBpbGUoKTtcblx0ICAgIG5hdGl2ZU1vZHVsZS5jYWNoZSgpO1xuXHQgICAgcmV0dXJuIG5hdGl2ZU1vZHVsZS5leHBvcnRzO1xuXHQgIH07XG5cdCAgTmF0aXZlTW9kdWxlLmdldENhY2hlZCA9IGZ1bmN0aW9uIChpZCkge1xuXHQgICAgcmV0dXJuIE5hdGl2ZU1vZHVsZS5fY2FjaGVbaWRdO1xuXHQgIH07XG5cdCAgTmF0aXZlTW9kdWxlLmV4aXN0cyA9IGZ1bmN0aW9uIChpZCkge1xuXHQgICAgcmV0dXJuIGlkIGluIE5hdGl2ZU1vZHVsZS5fc291cmNlO1xuXHQgIH07XG5cdCAgTmF0aXZlTW9kdWxlLmdldFNvdXJjZSA9IGZ1bmN0aW9uIChpZCkge1xuXHQgICAgcmV0dXJuIE5hdGl2ZU1vZHVsZS5fc291cmNlW2lkXTtcblx0ICB9O1xuXHQgIE5hdGl2ZU1vZHVsZS53cmFwID0gZnVuY3Rpb24gKHNjcmlwdCkge1xuXHQgICAgcmV0dXJuIE5hdGl2ZU1vZHVsZS53cmFwcGVyWzBdICsgc2NyaXB0ICsgTmF0aXZlTW9kdWxlLndyYXBwZXJbMV07XG5cdCAgfTtcblx0ICBOYXRpdmVNb2R1bGUud3JhcHBlciA9IFsnKGZ1bmN0aW9uIChleHBvcnRzLCByZXF1aXJlLCBtb2R1bGUsIF9fZmlsZW5hbWUsIF9fZGlybmFtZSwgVGl0YW5pdW0sIFRpLCBnbG9iYWwsIGtyb2xsKSB7JywgJ1xcbn0pOyddO1xuXHQgIE5hdGl2ZU1vZHVsZS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIGxldCBzb3VyY2UgPSBOYXRpdmVNb2R1bGUuZ2V0U291cmNlKHRoaXMuaWQpO1xuXHQgICAgc291cmNlID0gTmF0aXZlTW9kdWxlLndyYXAoc291cmNlKTtcblxuXHQgICAgLy8gQWxsIG5hdGl2ZSBtb2R1bGVzIGhhdmUgdGhlaXIgZmlsZW5hbWUgcHJlZml4ZWQgd2l0aCB0aTovXG5cdCAgICBjb25zdCBmaWxlbmFtZSA9IGB0aTovJHt0aGlzLmZpbGVuYW1lfWA7XG5cdCAgICBjb25zdCBmbiA9IHJ1bkluVGhpc0NvbnRleHQoc291cmNlLCBmaWxlbmFtZSwgdHJ1ZSk7XG5cdCAgICBmbih0aGlzLmV4cG9ydHMsIE5hdGl2ZU1vZHVsZS5yZXF1aXJlLCB0aGlzLCB0aGlzLmZpbGVuYW1lLCBudWxsLCBnbG9iYWwuVGksIGdsb2JhbC5UaSwgZ2xvYmFsLCBrcm9sbCk7XG5cdCAgICB0aGlzLmxvYWRlZCA9IHRydWU7XG5cdCAgfTtcblx0ICBOYXRpdmVNb2R1bGUucHJvdG90eXBlLmNhY2hlID0gZnVuY3Rpb24gKCkge1xuXHQgICAgTmF0aXZlTW9kdWxlLl9jYWNoZVt0aGlzLmlkXSA9IHRoaXM7XG5cdCAgfTtcblx0ICByZXR1cm4gTmF0aXZlTW9kdWxlO1xuXHR9XG5cblx0Ly8gVGhpcyBpcyB0aGUgZmlsZSBlYWNoIHBsYXRmb3JtIGxvYWRzIG9uIGJvb3QgKmJlZm9yZSogd2UgbGF1bmNoIHRpLm1haW4uanMgdG8gaW5zZXJ0IGFsbCBvdXIgc2hpbXMvZXh0ZW5zaW9uc1xuXG5cdC8qKlxuXHQgKiBtYWluIGJvb3RzdHJhcHBpbmcgZnVuY3Rpb25cblx0ICogQHBhcmFtIHtvYmplY3R9IGdsb2JhbCB0aGUgZ2xvYmFsIG9iamVjdFxuXHQgKiBAcGFyYW0ge29iamVjdH0ga3JvbGw7IHRoZSBrcm9sbCBtb2R1bGUvYmluZGluZ1xuXHQgKiBAcmV0dXJuIHt2b2lkfSAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRmdW5jdGlvbiBib290c3RyYXAoZ2xvYmFsLCBrcm9sbCkge1xuXHQgIC8vIFdvcmtzIGlkZW50aWNhbCB0byBPYmplY3QuaGFzT3duUHJvcGVydHksIGV4Y2VwdFxuXHQgIC8vIGFsc28gd29ya3MgaWYgdGhlIGdpdmVuIG9iamVjdCBkb2VzIG5vdCBoYXZlIHRoZSBtZXRob2Rcblx0ICAvLyBvbiBpdHMgcHJvdG90eXBlIG9yIGl0IGhhcyBiZWVuIG1hc2tlZC5cblx0ICBmdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5KSB7XG5cdCAgICByZXR1cm4gT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7XG5cdCAgfVxuXHQgIGtyb2xsLmV4dGVuZCA9IGZ1bmN0aW9uICh0aGlzT2JqZWN0LCBvdGhlck9iamVjdCkge1xuXHQgICAgaWYgKCFvdGhlck9iamVjdCkge1xuXHQgICAgICAvLyBleHRlbmQgd2l0aCB3aGF0PyEgIGRlbmllZCFcblx0ICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXHQgICAgZm9yICh2YXIgbmFtZSBpbiBvdGhlck9iamVjdCkge1xuXHQgICAgICBpZiAoaGFzT3duUHJvcGVydHkob3RoZXJPYmplY3QsIG5hbWUpKSB7XG5cdCAgICAgICAgdGhpc09iamVjdFtuYW1lXSA9IG90aGVyT2JqZWN0W25hbWVdO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgICByZXR1cm4gdGhpc09iamVjdDtcblx0ICB9O1xuXG5cdCAgLyoqXG5cdCAgICogVGhpcyBpcyB1c2VkIHRvIHNodXR0bGUgdGhlIHNvdXJjZVVybCBhcm91bmQgdG8gQVBJcyB0aGF0IG1heSBuZWVkIHRvXG5cdCAgICogcmVzb2x2ZSByZWxhdGl2ZSBwYXRocyBiYXNlZCBvbiB0aGUgaW52b2tpbmcgZmlsZS5cblx0ICAgKiAoc2VlIEtyb2xsSW52b2NhdGlvbi5qYXZhIGZvciBtb3JlKVxuXHQgICAqIEBwYXJhbSB7b2JqZWN0fSB2YXJzIGtleS92YWx1ZSBwYWlycyB0byBzdG9yZVxuXHQgICAqIEBwYXJhbSB7c3RyaW5nfSB2YXJzLnNvdXJjZVVybCB0aGUgc291cmNlIFVSTCBvZiB0aGUgZmlsZSBjYWxsaW5nIHRoZSBBUElcblx0ICAgKiBAY29uc3RydWN0b3Jcblx0ICAgKiBAcmV0dXJucyB7U2NvcGVWYXJzfVxuXHQgICAqL1xuXHQgIGZ1bmN0aW9uIFNjb3BlVmFycyh2YXJzKSB7XG5cdCAgICBpZiAoIXZhcnMpIHtcblx0ICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICB9XG5cdCAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXModmFycyk7XG5cdCAgICBjb25zdCBsZW5ndGggPSBrZXlzLmxlbmd0aDtcblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0ICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcblx0ICAgICAgdGhpc1trZXldID0gdmFyc1trZXldO1xuXHQgICAgfVxuXHQgIH1cblx0ICBmdW5jdGlvbiBzdGFydHVwKCkge1xuXHQgICAgZ2xvYmFsLmdsb2JhbCA9IGdsb2JhbDsgLy8gaGFuZyB0aGUgZ2xvYmFsIG9iamVjdCBvZmYgaXRzZWxmXG5cdCAgICBnbG9iYWwua3JvbGwgPSBrcm9sbDsgLy8gaGFuZyBvdXIgc3BlY2lhbCB1bmRlciB0aGUgaG9vZCBrcm9sbCBvYmplY3Qgb2ZmIHRoZSBnbG9iYWxcblx0ICAgIHtcblx0ICAgICAga3JvbGwuU2NvcGVWYXJzID0gU2NvcGVWYXJzO1xuXHQgICAgICAvLyBleHRlcm5hbCBtb2R1bGUgYm9vdHN0cmFwLmpzIGV4cGVjdHMgdG8gY2FsbCBrcm9sbC5OYXRpdmVNb2R1bGUucmVxdWlyZSBkaXJlY3RseSB0byBsb2FkIGluIHRoZWlyIG93biBzb3VyY2Vcblx0ICAgICAgLy8gYW5kIHRvIHJlZmVyIHRvIHRoZSBiYWtlZCBpbiBcImJvb3RzdHJhcC5qc1wiIGZvciB0aGUgU0RLIGFuZCBcImludm9rZXIuanNcIiB0byBoYW5nIGxhenkgQVBJcy93cmFwIGFwaSBjYWxscyB0byBwYXNzIGluIHNjb3BlIHZhcnNcblx0ICAgICAga3JvbGwuTmF0aXZlTW9kdWxlID0gTmF0aXZlTW9kdWxlQm9vdHN0cmFwKGdsb2JhbCwga3JvbGwpO1xuXHQgICAgICAvLyBBbmRyb2lkIHVzZXMgaXQncyBvd24gRXZlbnRFbWl0dGVyIGltcGwsIGFuZCBpdCdzIGJha2VkIHJpZ2h0IGludG8gdGhlIHByb3h5IGNsYXNzIGNoYWluXG5cdCAgICAgIC8vIEl0IGFzc3VtZXMgaXQgY2FuIGNhbGwgYmFjayBpbnRvIGphdmEgcHJveGllcyB0byBhbGVydCB3aGVuIGxpc3RlbmVycyBhcmUgYWRkZWQvcmVtb3ZlZFxuXHQgICAgICAvLyBGSVhNRTogR2V0IGl0IHRvIHVzZSB0aGUgZXZlbnRzLmpzIGltcGwgaW4gdGhlIG5vZGUgZXh0ZW5zaW9uLCBhbmQgZ2V0IGlPUyB0byBiYWtlIHRoYXQgaW50byBpdCdzIHByb3hpZXMgYXMgd2VsbCFcblx0ICAgICAgRXZlbnRFbWl0dGVyQm9vdHN0cmFwKGdsb2JhbCwga3JvbGwpO1xuXHQgICAgfVxuXHQgICAgZ2xvYmFsLlRpID0gZ2xvYmFsLlRpdGFuaXVtID0gYm9vdHN0cmFwJDEoZ2xvYmFsLCBrcm9sbCk7XG5cdCAgICBnbG9iYWwuTW9kdWxlID0gYm9vdHN0cmFwJDIoZ2xvYmFsLCBrcm9sbCk7XG5cdCAgfVxuXHQgIHN0YXJ0dXAoKTtcblx0fVxuXG5cdHJldHVybiBib290c3RyYXA7XG5cbn0pKCk7XG4iXSwidmVyc2lvbiI6M30=
