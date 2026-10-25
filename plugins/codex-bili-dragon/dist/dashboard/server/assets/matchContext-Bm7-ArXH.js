import { i as __toESM, t as __commonJSMin } from "./rolldown-runtime-DYf_mQCB.js";
// ../../node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react.production.js
/**
* @license React
* react.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_PORTAL_TYPE = Symbol.for("react.portal");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
	var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
	var REACT_CONSUMER_TYPE = Symbol.for("react.consumer");
	var REACT_CONTEXT_TYPE = Symbol.for("react.context");
	var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
	var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
	var REACT_MEMO_TYPE = Symbol.for("react.memo");
	var REACT_LAZY_TYPE = Symbol.for("react.lazy");
	var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
	var REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition");
	var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
	function getIteratorFn(maybeIterable) {
		if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
		maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
		return "function" === typeof maybeIterable ? maybeIterable : null;
	}
	var ReactNoopUpdateQueue = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	};
	var assign = Object.assign;
	var emptyObject = {};
	function Component(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	Component.prototype.isReactComponent = {};
	Component.prototype.setState = function(partialState, callback) {
		if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, partialState, callback, "setState");
	};
	Component.prototype.forceUpdate = function(callback) {
		this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
	};
	function ComponentDummy() {}
	ComponentDummy.prototype = Component.prototype;
	function PureComponent(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater || ReactNoopUpdateQueue;
	}
	var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
	pureComponentPrototype.constructor = PureComponent;
	assign(pureComponentPrototype, Component.prototype);
	pureComponentPrototype.isPureReactComponent = !0;
	var isArrayImpl = Array.isArray;
	function noop() {}
	var ReactSharedInternals = {
		H: null,
		A: null,
		T: null,
		S: null
	};
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function ReactElement(type, key, props) {
		var refProp = props.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== refProp ? refProp : null,
			props
		};
	}
	function cloneAndReplaceKey(oldElement, newKey) {
		return ReactElement(oldElement.type, newKey, oldElement.props);
	}
	function isValidElement(object) {
		return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
	}
	function escape(key) {
		var escaperLookup = {
			"=": "=0",
			":": "=2"
		};
		return "$" + key.replace(/[=:]/g, function(match) {
			return escaperLookup[match];
		});
	}
	var userProvidedKeyEscapeRegex = /\/+/g;
	function getElementKey(element, index) {
		return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index.toString(36);
	}
	function resolveThenable(thenable) {
		switch (thenable.status) {
			case "fulfilled": return thenable.value;
			case "rejected": throw thenable.reason;
			default: switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
				"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
			}, function(error) {
				"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			})), thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
			}
		}
		throw thenable;
	}
	function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
		var type = typeof children;
		if ("undefined" === type || "boolean" === type) children = null;
		var invokeCallback = !1;
		if (null === children) invokeCallback = !0;
		else switch (type) {
			case "bigint":
			case "string":
			case "number":
				invokeCallback = !0;
				break;
			case "object": switch (children.$$typeof) {
				case REACT_ELEMENT_TYPE:
				case REACT_PORTAL_TYPE:
					invokeCallback = !0;
					break;
				case REACT_LAZY_TYPE: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
			}
		}
		if (invokeCallback) return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
			return c;
		})) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
		invokeCallback = 0;
		var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
		if (isArrayImpl(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if (i = getIteratorFn(children), "function" === typeof i) for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
		else if ("object" === type) {
			if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
			array = String(children);
			throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
		}
		return invokeCallback;
	}
	function mapChildren(children, func, context) {
		if (null == children) return children;
		var result = [], count = 0;
		mapIntoArray(children, result, "", "", function(child) {
			return func.call(context, child, count++);
		});
		return result;
	}
	function lazyInitializer(payload) {
		if (-1 === payload._status) {
			var ctor = payload._result, thenable = ctor();
			thenable.then(function(moduleObject) {
				if (0 === payload._status || -1 === payload._status) payload._status = 1, payload._result = moduleObject, void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
			}, function(error) {
				if (0 === payload._status || -1 === payload._status) payload._status = 2, payload._result = error, void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
			});
			-1 === payload._status && (payload._status = 0, payload._result = thenable);
		}
		if (1 === payload._status) return payload._result.default;
		throw payload._result;
	}
	var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
		if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
			var event = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
				error
			});
			if (!window.dispatchEvent(event)) return;
		} else if ("object" === typeof process && "function" === typeof process.emit) {
			process.emit("uncaughtException", error);
			return;
		}
		console.error(error);
	};
	function startTransition(scope) {
		var prevTransition = ReactSharedInternals.T, currentTransition = {};
		currentTransition.types = null !== prevTransition ? prevTransition.types : null;
		ReactSharedInternals.T = currentTransition;
		try {
			var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
			null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
			"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop, reportGlobalError);
		} catch (error) {
			reportGlobalError(error);
		} finally {
			null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
		}
	}
	function addTransitionType(type) {
		var transition = ReactSharedInternals.T;
		if (null !== transition) {
			var transitionTypes = transition.types;
			null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
		} else startTransition(addTransitionType.bind(null, type));
	}
	var Children = {
		map: mapChildren,
		forEach: function(children, forEachFunc, forEachContext) {
			mapChildren(children, function() {
				forEachFunc.apply(this, arguments);
			}, forEachContext);
		},
		count: function(children) {
			var n = 0;
			mapChildren(children, function() {
				n++;
			});
			return n;
		},
		toArray: function(children) {
			return mapChildren(children, function(child) {
				return child;
			}) || [];
		},
		only: function(children) {
			if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
			return children;
		}
	};
	exports.Activity = REACT_ACTIVITY_TYPE;
	exports.Children = Children;
	exports.Component = Component;
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.Profiler = REACT_PROFILER_TYPE;
	exports.PureComponent = PureComponent;
	exports.StrictMode = REACT_STRICT_MODE_TYPE;
	exports.Suspense = REACT_SUSPENSE_TYPE;
	exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
	exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
	exports.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(size) {
			return ReactSharedInternals.H.useMemoCache(size);
		}
	};
	exports.addTransitionType = addTransitionType;
	exports.cache = function(fn) {
		return function() {
			return fn.apply(null, arguments);
		};
	};
	exports.cacheSignal = function() {
		return null;
	};
	exports.cloneElement = function(element, config, children) {
		if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
		var props = assign({}, element.props), key = element.key;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
		var propName = arguments.length - 2;
		if (1 === propName) props.children = children;
		else if (1 < propName) {
			for (var childArray = Array(propName), i = 0; i < propName; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		return ReactElement(element.type, key, props);
	};
	exports.createContext = function(defaultValue) {
		defaultValue = {
			$$typeof: REACT_CONTEXT_TYPE,
			_currentValue: defaultValue,
			_currentValue2: defaultValue,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		};
		defaultValue.Provider = defaultValue;
		defaultValue.Consumer = {
			$$typeof: REACT_CONSUMER_TYPE,
			_context: defaultValue
		};
		return defaultValue;
	};
	exports.createElement = function(type, config, children) {
		var propName, props = {}, key = null;
		if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
		var childrenLength = arguments.length - 2;
		if (1 === childrenLength) props.children = children;
		else if (1 < childrenLength) {
			for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 2];
			props.children = childArray;
		}
		if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === props[propName] && (props[propName] = childrenLength[propName]);
		return ReactElement(type, key, props);
	};
	exports.createRef = function() {
		return { current: null };
	};
	exports.forwardRef = function(render) {
		return {
			$$typeof: REACT_FORWARD_REF_TYPE,
			render
		};
	};
	exports.isValidElement = isValidElement;
	exports.lazy = function(ctor) {
		return {
			$$typeof: REACT_LAZY_TYPE,
			_payload: {
				_status: -1,
				_result: ctor
			},
			_init: lazyInitializer
		};
	};
	exports.memo = function(type, compare) {
		return {
			$$typeof: REACT_MEMO_TYPE,
			type,
			compare: void 0 === compare ? null : compare
		};
	};
	exports.startTransition = startTransition;
	exports.unstable_useCacheRefresh = function() {
		return ReactSharedInternals.H.useCacheRefresh();
	};
	exports.use = function(usable) {
		return ReactSharedInternals.H.use(usable);
	};
	exports.useActionState = function(action, initialState, permalink) {
		return ReactSharedInternals.H.useActionState(action, initialState, permalink);
	};
	exports.useCallback = function(callback, deps) {
		return ReactSharedInternals.H.useCallback(callback, deps);
	};
	exports.useContext = function(Context) {
		return ReactSharedInternals.H.useContext(Context);
	};
	exports.useDebugValue = function() {};
	exports.useDeferredValue = function(value, initialValue) {
		return ReactSharedInternals.H.useDeferredValue(value, initialValue);
	};
	exports.useEffect = function(create, deps) {
		return ReactSharedInternals.H.useEffect(create, deps);
	};
	exports.useEffectEvent = function(callback) {
		return ReactSharedInternals.H.useEffectEvent(callback);
	};
	exports.useId = function() {
		return ReactSharedInternals.H.useId();
	};
	exports.useImperativeHandle = function(ref, create, deps) {
		return ReactSharedInternals.H.useImperativeHandle(ref, create, deps);
	};
	exports.useInsertionEffect = function(create, deps) {
		return ReactSharedInternals.H.useInsertionEffect(create, deps);
	};
	exports.useLayoutEffect = function(create, deps) {
		return ReactSharedInternals.H.useLayoutEffect(create, deps);
	};
	exports.useMemo = function(create, deps) {
		return ReactSharedInternals.H.useMemo(create, deps);
	};
	exports.useOptimistic = function(passthrough, reducer) {
		return ReactSharedInternals.H.useOptimistic(passthrough, reducer);
	};
	exports.useReducer = function(reducer, initialArg, init) {
		return ReactSharedInternals.H.useReducer(reducer, initialArg, init);
	};
	exports.useRef = function(initialValue) {
		return ReactSharedInternals.H.useRef(initialValue);
	};
	exports.useState = function(initialState) {
		return ReactSharedInternals.H.useState(initialState);
	};
	exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
		return ReactSharedInternals.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
	};
	exports.useTransition = function() {
		return ReactSharedInternals.H.useTransition();
	};
	exports.version = "19.3.1";
}));
// ../../node_modules/.pnpm/react@19.3.1/node_modules/react/index.js
var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_production();
}));
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/not-found.js
/** Determine if a value is a TanStack Router not-found error. */
function isNotFound(obj) {
	return obj?.isNotFound === true;
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/root.js
/** Stable identifier used for the root route in a route tree. */
var rootRouteId = "__root__";
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/redirect.js
/**
* Create a redirect Response understood by TanStack Router.
*
* Use from route `loader`/`beforeLoad` or server functions to trigger a
* navigation. If `throw: true` is set, the redirect is thrown instead of
* returned. External `href` values are classified as full-document
* navigations when the router resolves the redirect.
*
* @param opts Options for the redirect. Common fields:
* - `href`: absolute URL for external redirects.
* - `statusCode`: HTTP status code to use (defaults to 307).
* - `headers`: additional headers to include on the Response.
* - Standard navigation options like `to`, `params`, `search`, `replace`,
*   and `reloadDocument` for internal redirects.
* @returns A Response augmented with router navigation options.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/redirectFunction
*/
function redirect(opts) {
	opts.statusCode = opts.statusCode || opts.code || 307;
	const headers = new Headers(opts.headers);
	if (opts.href && headers.get("Location") === null) headers.set("Location", opts.href);
	const response = new Response(null, {
		status: opts.statusCode,
		headers
	});
	response.options = opts;
	if (opts.throw) throw response;
	return response;
}
/** Check whether a value is a TanStack Router redirect Response. */
function isRedirect(obj) {
	return obj instanceof Response && !!obj.options;
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/utils.js
/**
* Return the last element of an array.
* Intended for non-empty arrays used within router internals.
*/
function last(arr) {
	return arr[arr.length - 1];
}
/**
* Apply a value-or-updater to a previous value.
* Accepts either a literal value or a function of the previous value.
*/
function functionalUpdate(updater, previous) {
	if (typeof updater === "function") return updater(previous);
	return updater;
}
var hasOwn = Object.prototype.hasOwnProperty;
function hasKeys(obj) {
	for (const key in obj) if (hasOwn.call(obj, key)) return true;
	return false;
}
var createNull = () => Object.create(null);
var nullReplaceEqualDeep = (prev, next) => replaceEqualDeep(prev, next, true);
function replaceEqualDeep(prev, next, _nullProto, _depth = 0) {
	return next;
}
function isPlainObject(o) {
	if (!o || typeof o !== "object") return false;
	return (Object.getPrototypeOf(o)?.constructor ?? Object) === Object;
}
/**
* Perform a deep equality check optimized for router state comparisons.
*
* - `partial`: `b` may omit keys that `a` has (arrays stay length-exact).
* - `explicitUndefined`: keys holding `undefined` take part in the comparison
*   instead of being ignored.
*
* Internal: the flags are positional so hot callers pass no options object.
*/
function deepEqual(a, b, partial, explicitUndefined) {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0, l = a.length; i < l; i++) {
			const av = a[i];
			const bv = b[i];
			if (av !== bv && !deepEqual(av, bv, partial, explicitUndefined)) return false;
		}
		return true;
	}
	if (isPlainObject(a) && isPlainObject(b)) {
		if (partial) {
			for (const k in b) if (explicitUndefined || b[k] !== void 0) {
				if (!deepEqual(a[k], b[k], partial, explicitUndefined)) return false;
			}
			return true;
		}
		let aCount = 0;
		if (explicitUndefined) aCount = Object.keys(a).length;
		else for (const k in a) if (a[k] !== void 0) aCount++;
		for (const k in b) if (explicitUndefined || b[k] !== void 0) {
			if (aCount-- === 0 || !deepEqual(a[k], b[k], partial, explicitUndefined)) return false;
		}
		return aCount === 0;
	}
	return false;
}
/**
* Heuristically detect dynamic import "module not found" errors
* across major browsers for lazy route component handling.
*/
function isModuleNotFoundError(error) {
	if (typeof error?.message !== "string") return false;
	return error.message.startsWith("Failed to fetch dynamically imported module") || error.message.startsWith("error loading dynamically imported module") || error.message.startsWith("Importing a module script failed");
}
function isPromise(value) {
	return Boolean(value && typeof value === "object" && typeof value.then === "function");
}
/**
* Re-encode characters that are unsafe in URL paths.
* Includes ASCII control characters (0x00-0x1F, 0x7F) and a subset of the
* WHATWG URL "path percent-encode set" (", <, >, `, {, }).
*
* Space (0x20) is intentionally excluded — decodeURI decodes %20 to space
* and the router stores decoded spaces in location.pathname. The existing
* encodePathLikeUrl already handles re-encoding spaces for outgoing URLs.
*
* These characters are decoded by decodeURI but must remain percent-encoded
* in paths to match how upstream layers (CDNs, edge middleware, browsers)
* interpret the URL, preventing infinite redirect loops and path mismatches.
*/
var PATH_UNSAFE_RE = /[\x00-\x1f\x7f"<>`{}]/g;
function sanitizePathSegment(segment) {
	return segment.replace(PATH_UNSAFE_RE, (ch) => "%" + ch.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
}
function decodeSegment(segment) {
	let decoded;
	try {
		decoded = decodeURI(segment);
	} catch {
		decoded = segment.replaceAll(/%[0-9A-F]{2}/gi, (match) => {
			try {
				return decodeURI(match);
			} catch {
				return match;
			}
		});
	}
	return sanitizePathSegment(decoded);
}
/**
* Default list of URL protocols to allow in links, redirects, and navigation.
* Any absolute URL protocol not in this list is treated as dangerous by default.
*/
var DEFAULT_PROTOCOL_ALLOWLIST = [
	"http:",
	"https:",
	"mailto:",
	"tel:"
];
/**
* Extract the explicit URL scheme, including its colon, using WHATWG
* normalization rules. This does not validate the rest of the URL.
*
* Returning `undefined` means "no explicit scheme", not "safe URL";
* protocol-relative URLs such as "//evil.example" require a separate check.
*/
function getUrlScheme(url) {
	if (url[0] === "/") return;
	if (!url.includes(":")) return;
	return /^[\x00-\x20]*([a-z][a-z\d+.\t\n\r-]*:)/i.exec(url)?.[1]?.replace(/[\t\n\r]/g, "").toLowerCase();
}
var protocolRelativePrefixRegex = /^[\x00-\x20]*[\\/][\t\n\r]*[\\/]/;
/**
* Check if a URL string uses a protocol that is not in the allowlist or is
* protocol-relative (e.g. "//evil.example"), which can navigate to another host.
* Returns true for blocked protocols like javascript:, blob:, and data:, as
* well as slash/backslash variants of protocol-relative URLs.
*
* Scheme parsing normalizes:
* - Mixed case (JavaScript: → javascript:)
* - Whitespace/control characters (java\nscript: → javascript:)
* - Leading whitespace
*
* For relative URLs without a protocol-relative prefix, returns false.
*
* @param url - The URL string to check
* @param allowlist - Set of protocols to allow
* @returns true if the URL uses a protocol that is not allowed or can escape
* the current origin through a protocol-relative URL
*/
function isDangerousProtocol(url, allowlist) {
	if (!url) return false;
	if (protocolRelativePrefixRegex.test(url)) return true;
	const scheme = getUrlScheme(url);
	return scheme ? !allowlist.has(scheme) : false;
}
var HTML_ESCAPE_LOOKUP = {
	"&": "\\u0026",
	">": "\\u003e",
	"<": "\\u003c",
	"\u2028": "\\u2028",
	"\u2029": "\\u2029"
};
var HTML_ESCAPE_REGEX = /[&><\u2028\u2029]/g;
/**
* Escape HTML special characters in a string to prevent XSS attacks
* when embedding strings in script tags during SSR.
*
* This is essential for preventing XSS vulnerabilities when user-controlled
* content is embedded in inline scripts.
*/
function escapeHtml(str) {
	return str.replace(HTML_ESCAPE_REGEX, (match) => HTML_ESCAPE_LOOKUP[match]);
}
function decodePath(path) {
	if (!path) return path;
	let result = path;
	if (/[%\\\x00-\x1f\x7f]/.test(path)) {
		const re = /%25|%5C/gi;
		let cursor = 0;
		let match;
		result = "";
		while (null !== (match = re.exec(path))) {
			result += decodeSegment(path.slice(cursor, match.index)) + match[0];
			cursor = re.lastIndex;
		}
		result += decodeSegment(cursor ? path.slice(cursor) : path);
	}
	return result;
}
/**
* Encodes a path the same way `new URL()` would, but without the overhead of full URL parsing.
*
* This function encodes:
* - Whitespace characters (spaces → %20, tabs → %09, etc.)
* - Non-ASCII/Unicode characters (emojis, accented characters, etc.)
*
* It preserves:
* - Already percent-encoded sequences (won't double-encode %2F, %25, etc.)
* - ASCII special characters valid in URL paths (@, $, &, +, etc.)
* - Forward slashes as path separators
*
* Used to generate proper href values for SSR without constructing URL objects.
*
* @example
* encodePathLikeUrl('/path/file name.pdf') // '/path/file%20name.pdf'
* encodePathLikeUrl('/path/日本語') // '/path/%E6%97%A5%E6%9C%AC%E8%AA%9E'
* encodePathLikeUrl('/path/already%20encoded') // '/path/already%20encoded' (preserved)
*/
function encodePathLikeUrl(path) {
	if (!/[\s\u0080-\uFFFF]/.test(path)) return path;
	return path.replace(/\s|[^\u0000-\u007F]/gu, encodeURIComponent);
}
function arraysEqual(a, b) {
	if (a === b) return true;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/path.js
/** Remove repeated slashes from a path string. */
function cleanPath(path) {
	return path.replace(/\/{2,}/g, "/");
}
/** Trim leading slashes (except preserving root '/'). */
function trimPathLeft(path) {
	return path === "/" ? path : path.replace(/^\/+/, "");
}
/** Trim trailing slashes (except preserving root '/'). */
function trimPathRight(path) {
	const len = path.length;
	return len > 1 && path[len - 1] === "/" ? path.replace(/\/+$/, "") : path;
}
/** Trim both leading and trailing slashes. */
function trimPath(path) {
	return trimPathRight(trimPathLeft(path));
}
/** Remove a trailing slash from value when appropriate for comparisons. */
function removeTrailingSlash(value, basepath) {
	if (value?.endsWith("/") && value !== "/" && value !== `${basepath}/`) return value.slice(0, -1);
	return value;
}
/**
* Resolve a destination path against a base, honoring trailing-slash policy
* and supporting relative segments (`.`/`..`) and absolute `to` values.
*
* Internal: parameters are positional so the router's hot callers pass no
* options object.
*/
function resolvePath(base, to, trailingSlash = "never", cache) {
	if (to.includes("//")) to = cleanPath(to);
	if (to.startsWith("/")) {
		if (to.length === 1 || trailingSlash === "preserve") return to;
		if (trailingSlash === "always") return to.endsWith("/") ? to : `${to}/`;
		return to.endsWith("/") ? to.slice(0, -1) : to;
	}
	const isBase = to === ".";
	let key;
	if (cache) {
		key = isBase ? base : base + "\0" + to;
		const cached = cache.get(key);
		if (cached) return cached;
	}
	let baseSegments;
	if (isBase) baseSegments = base.split("/");
	else {
		if (base.includes("//")) base = cleanPath(base);
		baseSegments = base.split("/");
		while (baseSegments.length > 1 && last(baseSegments) === "") baseSegments.pop();
		const toSegments = to.split("/");
		for (let index = 0, length = toSegments.length; index < length; index++) {
			const value = toSegments[index];
			if (value === "") {
				if (!index) baseSegments = [value];
				else if (index === length - 1) baseSegments.push(value);
			} else if (value === "..") {
				if (baseSegments.length > 1) baseSegments.pop();
				else baseSegments = [""];
			} else if (value === ".") {} else baseSegments.push(value);
		}
	}
	if (baseSegments.length > 1) {
		if (last(baseSegments) === "") {
			if (trailingSlash === "never") baseSegments.pop();
		} else if (trailingSlash === "always") baseSegments.push("");
	}
	const joined = baseSegments.join("/");
	const result = (isBase ? cleanPath(joined) : joined) || "/";
	if (key && cache) cache.set(key, result);
	return result;
}
/**
* Create a pre-compiled decode config from allowed characters.
* Created once for the router's fixed encoding configuration.
*/
function compileDecodeCharMap(pathParamsAllowedCharacters) {
	const charMap = new Map(pathParamsAllowedCharacters.map((char) => [encodeURIComponent(char), char]));
	const regex = new RegExp([...charMap.keys()].join("|").replace(/[.*()]/g, "\\$&"), "g");
	return (encoded) => encoded.replace(regex, (match) => charMap.get(match) ?? match);
}
/** A splat is missing when it has no value; `0` and `false` are stringified like any other param. */
function isMissingSplat(value) {
	return value == null || value === "";
}
function encodeParam(key, value, decoder) {
	if (typeof value !== "string") return "" + (value ?? void 0);
	const splat = key === "_splat";
	if (splat && (!value || /^[a-zA-Z0-9\-._~!/]*$/.test(value))) return value;
	let encoded = encodeURIComponent(value);
	if (splat) encoded = encoded.replaceAll("%2F", "/");
	return decoder ? decoder(encoded) : encoded;
}
/** Substitute current values into parsed segments, optionally collecting raw params. */
function interpolatePath(path, segments, params, decoder, usedParams) {
	const trailingSlash = path.endsWith("/") ? "/" : "";
	let joined = "";
	for (const part of segments) {
		if (typeof part === "string") {
			joined += part;
			continue;
		}
		const [kind, key, prefix, rawSuffix] = part;
		const splat = kind === 2;
		const suffix = splat && rawSuffix !== void 0 ? rawSuffix + trailingSlash : rawSuffix;
		let paramValue = params[key];
		if (kind === 3 && paramValue == null) continue;
		if (usedParams) {
			usedParams[key] = paramValue;
			if (splat) usedParams["*"] = paramValue;
		}
		if (splat && isMissingSplat(paramValue)) {
			if (prefix === "/" && !suffix) continue;
			paramValue = "";
		}
		joined += prefix + encodeParam(key, paramValue, decoder) + (suffix || "");
	}
	return joined + trailingSlash || "/";
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/sieve-cache.js
/**
* A fixed-capacity cache using the SIEVE eviction algorithm
* (https://cachemon.github.io/SIEVE-website/).
*
* Entries live in the Map's FIFO insertion order; a hit only flips a `visited`
* bit instead of relinking the entry, which makes `get` (by far the hottest
* operation here) one `Map.get` plus a boolean store. Eviction sweeps a `hand`
* from the oldest entry towards the newest, clearing `visited` bits until it
* finds an unvisited entry to drop, so entries touched since the last sweep
* survive one more round. This keeps LRU-like hit ratios while being
* scan-resistant.
*/
function createSieveCache(max) {
	const cache = /* @__PURE__ */ new Map();
	let hand;
	let newest;
	return {
		get(key) {
			const entry = cache.get(key);
			if (!entry) return;
			entry.visited = true;
			return entry.value;
		},
		set(key, value) {
			const existing = cache.get(key);
			if (existing) {
				existing.value = value;
				return;
			}
			if (cache.size >= max) {
				let node = hand?.next().value;
				while (!node || node.visited) {
					if (node) node.visited = false;
					else hand = cache.values();
					node = hand.next().value;
				}
				if (node === newest) hand = void 0;
				cache.delete(node.key);
			}
			const entry = {
				key,
				value,
				visited: false
			};
			newest = entry;
			cache.set(key, entry);
		},
		clear() {
			cache.clear();
			hand = void 0;
			newest = void 0;
		}
	};
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/invariant.js
function invariant() {
	throw new Error("Invariant failed");
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/new-process-route-tree.js
var SEGMENT_TYPE_INDEX = 4;
var SEGMENT_TYPE_PATHLESS = 5;
function getParamNames(data) {
	const cached = data.names;
	if (cached) return cached;
	const keys = [];
	for (const segment of data) if (typeof segment !== "string") keys.push(segment[1]);
	return data.names = keys;
}
/** Parse one segment for matching and retain the same record for interpolation. */
function parseSegment(path, start, end) {
	const part = path.slice(start, end);
	if (part.charCodeAt(0) === 36) return part.length === 1 ? [
		2,
		"_splat",
		"",
		void 0
	] : [
		1,
		part.slice(1),
		"",
		""
	];
	const open = part.indexOf("{");
	if (open >= 0) {
		const close = part.indexOf("}", open);
		const optional = part.charCodeAt(open + 1) === 45;
		const nameStart = open + (optional ? 3 : 2);
		if (close >= 0 && part.charCodeAt(nameStart - 1) === 36 && (!optional || nameStart < close)) {
			const key = part.slice(nameStart, close);
			return [
				optional ? 3 : key ? 1 : 2,
				key || "_splat",
				part.slice(0, open),
				path.slice(start + close + 1, key ? end : path.length)
			];
		}
	}
	return part;
}
function parseSegments(defaultCaseSensitive, route, start, node, dynamicListsToSort, parentInterpolation) {
	let cursor = start;
	const path = route.fullPath ?? route.from;
	const options = route.options;
	const length = path.length;
	const literalEnd = path.endsWith("/") ? length - 1 : length;
	const caseSensitive = options?.caseSensitive ?? defaultCaseSensitive;
	const parseParams = options?.params?.parse ?? options?.parseParams;
	let interpolation;
	let literalStart = parentInterpolation ? start - 1 : 0;
	if (!node || path.includes("$")) {
		interpolation = parentInterpolation?.slice() ?? [];
		const tail = last(interpolation);
		if (tail && typeof tail !== "string" && tail[0] === 2) {
			interpolation[interpolation.length - 1] = [
				tail[0],
				tail[1],
				tail[2],
				tail[3] === void 0 ? void 0 : tail[3] + path.substring(start - (path[start - 2] === "/" ? 2 : 1), literalEnd)
			];
			literalStart = length;
		}
	}
	while (cursor < length) {
		const start = cursor;
		const next = path.indexOf("/", start);
		let end = next === -1 ? length : next;
		const segment = parseSegment(path, start, end);
		cursor = end + 1;
		let nextNode;
		if (typeof segment === "string") {
			if (!node) continue;
			let name = segment;
			let staticChildren;
			if (caseSensitive) staticChildren = node.static ??= /* @__PURE__ */ new Map();
			else {
				name = segment.toLowerCase();
				staticChildren = node.staticInsensitive ??= /* @__PURE__ */ new Map();
			}
			const existingNode = staticChildren.get(name);
			if (existingNode) nextNode = existingNode;
			else {
				const next = createSegmentNode(node);
				nextNode = next;
				staticChildren.set(name, next);
			}
		} else {
			const kind = segment[0];
			let prefix = segment[2];
			let suffix = segment[3] ?? "";
			if (kind === 2) {
				end = length;
				cursor = end + 1;
			}
			if (interpolation && literalStart < end) {
				if (literalStart < start - 1) interpolation.push(path.slice(literalStart, start - 1));
				segment[2] = "/" + prefix;
				if (kind === 2 && segment[3] !== void 0 && literalEnd < length) segment[3] = suffix.slice(0, -1);
				interpolation.push(segment);
				literalStart = end;
			}
			if (!node) continue;
			const actuallyCaseSensitive = caseSensitive && !!(prefix || suffix);
			if (!caseSensitive) {
				prefix = prefix.toLowerCase();
				suffix = suffix.toLowerCase();
			}
			const siblings = kind === 1 ? node.dynamic ??= [] : kind === 3 ? node.optional ??= [] : node.wildcard ??= [];
			const existingNode = kind !== 2 && !parseParams && siblings.find((s) => !s.parse && s.caseSensitive === actuallyCaseSensitive && s.prefix === prefix && s.suffix === suffix);
			if (existingNode) nextNode = existingNode;
			else {
				const next = createSegmentNode(node, kind, actuallyCaseSensitive, prefix, suffix);
				nextNode = next;
				siblings.push(next);
				if (siblings.length === 2) dynamicListsToSort?.push(siblings);
			}
		}
		node = nextNode;
	}
	if (interpolation && literalStart < literalEnd) interpolation.push(path.slice(literalStart, literalEnd));
	const segmentData = interpolation?.slice();
	if (!node) return segmentData;
	if (parseParams && route.children && !route.isRoot && route.id && route.id.charCodeAt(route.id.lastIndexOf("/") + 1) === 95) {
		const pathlessNode = createSegmentNode(node, SEGMENT_TYPE_PATHLESS);
		(node.pathless ??= []).push(pathlessNode);
		node = pathlessNode;
	}
	const isLeaf = (route.path || !route.children) && !route.isRoot;
	if (isLeaf && literalEnd < length) {
		const indexNode = createSegmentNode(node, SEGMENT_TYPE_INDEX);
		node.index = indexNode;
		node = indexNode;
	}
	node.parse = parseParams ?? null;
	node.priority = options?.params?.priority ?? 0;
	if (!node.route) {
		node.data = segmentData;
		if (isLeaf) node.route = route;
	}
	return [
		node,
		cursor,
		segmentData
	];
}
function sortDynamic(a, b) {
	if (a.parse && !b.parse) return -1;
	if (!a.parse && b.parse) return 1;
	if (a.parse && b.parse && (a.priority || b.priority)) return b.priority - a.priority;
	if (a.prefix && b.prefix && a.prefix !== b.prefix) {
		if (a.prefix.startsWith(b.prefix)) return -1;
		if (b.prefix.startsWith(a.prefix)) return 1;
	}
	if (a.suffix && b.suffix && a.suffix !== b.suffix) {
		if (a.suffix.endsWith(b.suffix)) return -1;
		if (b.suffix.endsWith(a.suffix)) return 1;
	}
	if (a.prefix && !b.prefix) return -1;
	if (!a.prefix && b.prefix) return 1;
	if (a.suffix && !b.suffix) return -1;
	if (!a.suffix && b.suffix) return 1;
	if (a.caseSensitive && !b.caseSensitive) return -1;
	if (!a.caseSensitive && b.caseSensitive) return 1;
	return 0;
}
function createSegmentNode(parent, kind = 0, caseSensitive, prefix, suffix) {
	return {
		kind,
		depth: parent ? parent.depth + 1 : 0,
		pathless: null,
		index: null,
		static: null,
		staticInsensitive: null,
		dynamic: null,
		optional: null,
		wildcard: null,
		route: null,
		data: void 0,
		parent,
		parse: null,
		priority: 0,
		caseSensitive,
		prefix,
		suffix
	};
}
function processRouteMasks(routeList, processedTree) {
	const segmentTree = createSegmentNode();
	const dynamicListsToSort = [];
	function visit(route, start, parentNode, parentInterpolation) {
		const [node, cursor, segments] = parseSegments(false, route, start, parentNode, dynamicListsToSort, parentInterpolation);
		if (route.children) for (const child of route.children) visit(child, cursor, node, segments);
	}
	for (const route of routeList) visit(route, 1, segmentTree);
	for (const nodes of dynamicListsToSort) nodes.sort(sortDynamic);
	processedTree.masksTree = segmentTree;
	processedTree.flatCache = createSieveCache(1e3);
}
/**
* Take an arbitrary list of routes, create a tree from them (if it hasn't been created already), and match a path against it.
*/
function findFlatMatch(path, processedTree) {
	path ||= "/";
	const cached = processedTree.flatCache.get(path);
	if (cached !== void 0) return cached;
	const result = findMatch(path, processedTree.masksTree);
	processedTree.flatCache.set(path, result);
	return result;
}
/**
* @deprecated keep until v2 so that `router.matchRoute` can keep not caring about the actual route tree
*/
function findSingleMatch(from, caseSensitive, fuzzy, path, processedTree) {
	from ||= "/";
	path ||= "/";
	const key = caseSensitive ? `case\0${from}` : from;
	let tree = processedTree.singleCache.get(key);
	if (!tree) {
		tree = createSegmentNode();
		parseSegments(caseSensitive, { from }, 1, tree);
		processedTree.singleCache.set(key, tree);
	}
	return findMatch(path, tree, fuzzy);
}
function findRouteMatch(path, processedTree, fuzzy = false) {
	const key = fuzzy ? path : `nofuzz\0${path}`;
	const cached = processedTree.matchCache.get(key);
	if (cached !== void 0) return cached;
	path ||= "/";
	let result;
	try {
		result = findMatch(path, processedTree.segmentTree, fuzzy);
	} catch (err) {
		if (err instanceof URIError) result = null;
		else throw err;
	}
	if (result) result.branch = buildRouteBranch(result.route);
	processedTree.matchCache.set(key, result);
	return result;
}
/**
* Processes a route tree into a segment trie for efficient path matching.
* Also builds lookup maps for routes by ID and by trimmed full path.
*/
function processRouteTree(routeTree, caseSensitive = false) {
	const segmentTree = createSegmentNode();
	const dynamicListsToSort = [];
	const routesById = {};
	const routesByPath = {};
	let index = 0;
	function visit(route, start, parentNode, parentInterpolation) {
		route.init(index);
		if (route.id in routesById) invariant();
		routesById[route.id] = route;
		if (index !== 0 && route.path) {
			const trimmedFullPath = trimPathRight(route.fullPath);
			if (!routesByPath[trimmedFullPath] || route.fullPath.endsWith("/")) routesByPath[trimmedFullPath] = route;
		}
		index++;
		const [node, cursor, segments] = parseSegments(caseSensitive, route, start, parentNode, dynamicListsToSort, parentInterpolation);
		route._interpolation = segments;
		if (route.children) for (const child of route.children) visit(child, cursor, node, segments);
	}
	visit(routeTree, 1, segmentTree);
	for (const nodes of dynamicListsToSort) nodes.sort(sortDynamic);
	return {
		processedTree: {
			segmentTree,
			singleCache: createSieveCache(1e3),
			matchCache: createSieveCache(1e3),
			flatCache: null,
			masksTree: null
		},
		routesById,
		routesByPath
	};
}
function findMatch(path, segmentTree, fuzzy = false) {
	const parts = path.split("/");
	const leaf = getNodeMatch(path, parts, segmentTree, fuzzy);
	if (!leaf) return null;
	const [rawParams] = extractParams(path, parts, leaf);
	return {
		route: leaf.node.route,
		rawParams
	};
}
/**
* This function is "resumable":
* - the `leaf` input can contain `extract` and `rawParams` properties from a previous `extractParams` call
* - the returned `state` can be passed back as `extract` in a future call to continue extracting params from where we left off
*
* Inputs are *not* mutated.
*/
function extractParams(path, parts, leaf) {
	const list = buildBranch(leaf.node);
	const names = leaf.node.data && getParamNames(leaf.node.data);
	const rawParams = Object.create(null);
	/** which segment of the path we're currently processing */
	let partIndex = leaf.extract?.part ?? 0;
	/** which node of the route tree branch we're currently processing */
	let nodeIndex = leaf.extract?.node ?? 0;
	/** index of the 1st character of the segment we're processing in the path string */
	let pathIndex = leaf.extract?.path ?? 0;
	/** Next original parameter name, independent of pathless/static nodes. */
	let paramIndex = leaf.extract?.param ?? 0;
	for (; nodeIndex < list.length; partIndex++, nodeIndex++, pathIndex++) {
		const node = list[nodeIndex];
		if (node.kind === SEGMENT_TYPE_INDEX) break;
		if (node.kind === SEGMENT_TYPE_PATHLESS) {
			partIndex--;
			pathIndex--;
			continue;
		}
		const part = parts[partIndex];
		const currentPathIndex = pathIndex;
		if (part) pathIndex += part.length;
		if (node.kind === 1 || node.kind === 3) {
			const name = names[paramIndex++];
			if (node.kind === 3 && leaf.skipped & 1 << nodeIndex) {
				partIndex--;
				pathIndex = currentPathIndex - 1;
				continue;
			}
			const value = node.suffix || node.prefix ? part.substring(node.prefix.length, part.length - node.suffix.length) : part;
			if (value || node.kind === 1) rawParams[name] = decodeURIComponent(value);
		} else if (node.kind === 2) {
			const n = node;
			const value = path.substring(currentPathIndex + n.prefix.length, path.length - n.suffix.length);
			const splat = decodeURIComponent(value);
			rawParams["*"] = splat;
			rawParams._splat = splat;
			break;
		}
	}
	if (leaf.rawParams) Object.assign(rawParams, leaf.rawParams);
	return [rawParams, {
		part: partIndex,
		node: nodeIndex,
		path: pathIndex,
		param: paramIndex
	}];
}
function buildRouteBranch(route) {
	const list = [route];
	while (route.parentRoute) {
		route = route.parentRoute;
		list.push(route);
	}
	list.reverse();
	return list;
}
function buildBranch(node) {
	const list = Array(node.depth + 1);
	do {
		list[node.depth] = node;
		node = node.parent;
	} while (node);
	return list;
}
function getNodeMatch(path, parts, segmentTree, fuzzy) {
	if (path === "/" && segmentTree.index) return {
		node: segmentTree.index,
		skipped: 0
	};
	const trailingSlash = !last(parts);
	const pathIsIndex = trailingSlash && path !== "/";
	const partsLength = parts.length - (trailingSlash ? 1 : 0);
	const stack = [{
		node: segmentTree,
		index: 1,
		skipped: 0,
		statics: 0,
		dynamics: 0,
		optionals: 0
	}];
	let bestFuzzy = null;
	let bestMatch = null;
	while (stack.length) {
		const frame = stack.pop();
		const { node, index, skipped, statics, dynamics, optionals } = frame;
		let { extract, rawParams } = frame;
		if (node.kind === 2 && node.route && !isFrameMoreSpecific(bestMatch, frame)) continue;
		if (node.parse) {
			if (!validateParseParams(path, parts, frame)) continue;
			rawParams = frame.rawParams;
			extract = frame.extract;
		}
		if (fuzzy && node.route && node.kind !== SEGMENT_TYPE_INDEX && isFrameMoreSpecific(bestFuzzy, frame)) bestFuzzy = frame;
		const isBeyondPath = index === partsLength;
		if (isBeyondPath) {
			if (node.route && (!pathIsIndex || node.kind === SEGMENT_TYPE_INDEX || node.kind === 2) && isFrameMoreSpecific(bestMatch, frame)) bestMatch = frame;
			if (!node.optional && !node.wildcard && !node.index && !node.pathless) continue;
		}
		const part = isBeyondPath ? void 0 : parts[index];
		let lowerPart;
		if (isBeyondPath && node.index) {
			const indexFrame = {
				node: node.index,
				index,
				skipped,
				statics,
				dynamics,
				optionals,
				extract,
				rawParams
			};
			let indexValid = true;
			if (node.index.parse) {
				if (!validateParseParams(path, parts, indexFrame)) indexValid = false;
			}
			if (indexValid) {
				if (!dynamics && !optionals && !skipped && isPerfectStaticMatch(statics, partsLength)) return indexFrame;
				if (isFrameMoreSpecific(bestMatch, indexFrame)) bestMatch = indexFrame;
			}
		}
		if (node.wildcard) for (let i = node.wildcard.length - 1; i >= 0; i--) {
			const segment = node.wildcard[i];
			const { prefix, suffix } = segment;
			if (prefix) {
				if (isBeyondPath) continue;
				if (!(segment.caseSensitive ? part : lowerPart ??= part.toLowerCase()).startsWith(prefix)) continue;
			}
			if (suffix) {
				if (isBeyondPath) continue;
				const end = parts.slice(index).join("/");
				const suffixPart = end.slice(-suffix.length);
				if ((segment.caseSensitive ? suffixPart : suffixPart.toLowerCase()) !== suffix || end.length - suffix.length < prefix.length) continue;
			}
			stack.push({
				node: segment,
				index: partsLength,
				skipped,
				statics,
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
		if (node.optional) {
			const nextSkipped = skipped | 1 << node.depth + 1;
			for (let i = node.optional.length - 1; i >= 0; i--) {
				const segment = node.optional[i];
				stack.push({
					node: segment,
					index,
					skipped: nextSkipped,
					statics,
					dynamics,
					optionals,
					extract,
					rawParams
				});
			}
			if (!isBeyondPath) for (let i = node.optional.length - 1; i >= 0; i--) {
				const segment = node.optional[i];
				const { prefix, suffix } = segment;
				if (prefix || suffix) {
					const casePart = segment.caseSensitive ? part : lowerPart ??= part.toLowerCase();
					if (prefix && !casePart.startsWith(prefix)) continue;
					if (suffix && casePart.indexOf(suffix, casePart.length - suffix.length) < prefix.length) continue;
				}
				stack.push({
					node: segment,
					index: index + 1,
					skipped,
					statics,
					dynamics,
					optionals: optionals + segmentScore(partsLength, index),
					extract,
					rawParams
				});
			}
		}
		if (!isBeyondPath && node.dynamic && part) for (let i = node.dynamic.length - 1; i >= 0; i--) {
			const segment = node.dynamic[i];
			const { prefix, suffix } = segment;
			if (prefix || suffix) {
				const casePart = segment.caseSensitive ? part : lowerPart ??= part.toLowerCase();
				if (prefix && !casePart.startsWith(prefix)) continue;
				if (suffix && casePart.indexOf(suffix, casePart.length - suffix.length) < prefix.length) continue;
			}
			stack.push({
				node: segment,
				index: index + 1,
				skipped,
				statics,
				dynamics: dynamics + segmentScore(partsLength, index),
				optionals,
				extract,
				rawParams
			});
		}
		if (!isBeyondPath && node.staticInsensitive) {
			const match = node.staticInsensitive.get(lowerPart ??= part.toLowerCase());
			if (match) stack.push({
				node: match,
				index: index + 1,
				skipped,
				statics: statics + segmentScore(partsLength, index),
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
		if (!isBeyondPath && node.static) {
			const match = node.static.get(part);
			if (match) stack.push({
				node: match,
				index: index + 1,
				skipped,
				statics: statics + segmentScore(partsLength, index),
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
		if (node.pathless) for (let i = node.pathless.length - 1; i >= 0; i--) {
			const segment = node.pathless[i];
			stack.push({
				node: segment,
				index,
				skipped,
				statics,
				dynamics,
				optionals,
				extract,
				rawParams
			});
		}
	}
	if (bestMatch) return bestMatch;
	if (fuzzy && bestFuzzy) {
		let sliceIndex = bestFuzzy.index;
		for (let i = 0; i < bestFuzzy.index; i++) sliceIndex += parts[i].length;
		const splat = sliceIndex === path.length ? "/" : path.slice(sliceIndex);
		bestFuzzy.rawParams ??= Object.create(null);
		bestFuzzy.rawParams["**"] = decodeURIComponent(splat);
		return bestFuzzy;
	}
	return null;
}
function segmentScore(partsLength, index) {
	return 2 ** (partsLength - index - 1);
}
function isPerfectStaticMatch(statics, partsLength) {
	return statics === 2 ** (partsLength - 1) - 1;
}
function validateParseParams(path, parts, frame) {
	let rawParams;
	let state;
	try {
		[rawParams, state] = extractParams(path, parts, frame);
	} catch {
		return null;
	}
	frame.rawParams = rawParams;
	frame.extract = state;
	if (!frame.node.parse) return true;
	try {
		if (frame.node.parse(rawParams) === false) return null;
	} catch {}
	return true;
}
function isFrameMoreSpecific(prev, next) {
	if (!prev) return true;
	return next.statics > prev.statics || next.statics === prev.statics && (next.dynamics > prev.dynamics || next.dynamics === prev.dynamics && (next.optionals > prev.optionals || next.optionals === prev.optionals && ((next.node.kind === SEGMENT_TYPE_INDEX) > (prev.node.kind === SEGMENT_TYPE_INDEX) || next.node.kind === SEGMENT_TYPE_INDEX === (prev.node.kind === SEGMENT_TYPE_INDEX) && next.node.depth > prev.node.depth)));
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/scroll-restoration.js
function getSafeSessionStorage() {
	try {
		return sessionStorage;
	} catch {
		return;
	}
}
var storageKey = "tsr-scroll-restoration-v1_3";
getSafeSessionStorage();
/**
* The default `getKey` function for `useScrollRestoration`.
* It returns the `key` from the location state or the `href` of the location.
*
* The `location.href` is used as a fallback to support the use case where the location state is not available like the initial render.
*/
var defaultGetScrollRestorationKey = (location) => {
	return location.state.__TSR_key || location.href;
};
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/qss.js
/**
* Program is a reimplementation of the `qss` package:
* Copyright (c) Luke Edwards luke.edwards05@gmail.com, MIT License
* https://github.com/lukeed/qss/blob/master/license.md
*
* This reimplementation uses modern browser APIs
* (namely URLSearchParams) and TypeScript while still
* maintaining the original functionality and interface.
*
* Update: this implementation has also been mangled to
* fit exactly our use-case (single value per key in encoding).
*/
/**
* Encodes an object into a query string.
* @param obj - The object to encode into a query string.
* @param stringify - An optional custom stringify function.
* @returns The encoded query string.
* @example
* ```
* // Example input: encode({ token: 'foo', key: 'value' })
* // Expected output: "token=foo&key=value"
* ```
*/
function encode(obj, stringify = String) {
	let result;
	for (const key in obj) {
		const val = obj[key];
		if (val !== void 0) (result ||= new URLSearchParams()).set(key, stringify(val));
	}
	return result ? result.toString() : "";
}
/**
* Converts a string value to its appropriate type (string, number, boolean).
* @param mix - The string value to convert.
* @returns The converted value.
* @example
* // Example input: toValue("123")
* // Expected output: 123
*/
function toValue(str) {
	if (!str) return "";
	if (str === "false") return false;
	if (str === "true") return true;
	return +str * 0 === 0 && +str + "" === str ? +str : str;
}
/**
* Decodes a query string into an object.
* @param str - The query string to decode.
* @returns The decoded key-value pairs in an object format.
* @example
* // Example input: decode("token=foo&key=value")
* // Expected output: { "token": "foo", "key": "value" }
*/
function decode(str) {
	const searchParams = new URLSearchParams(str);
	const result = Object.create(null);
	for (const [key, value] of searchParams.entries()) {
		const previousValue = result[key];
		if (previousValue == null) result[key] = toValue(value);
		else if (Array.isArray(previousValue)) previousValue.push(toValue(value));
		else result[key] = [previousValue, toValue(value)];
	}
	return result;
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/searchParams.js
var jsonStart = /^(?:\s|["[{\d-]|fa|nu|tr)/;
/** Default `parseSearch` that strips leading '?' and JSON-parses values. */
var defaultParseSearch = parseSearchWith(JSON.parse);
/** Default `stringifySearch` using JSON.stringify for complex values. */
var defaultStringifySearch = stringifySearchWith(JSON.stringify, JSON.parse);
/**
* Build a `parseSearch` function using a provided JSON-like parser.
*
* The returned function strips a leading `?`, decodes values, and attempts to
* JSON-parse string values using the given `parser`.
*
* @param parser Function to parse a string value (e.g. `JSON.parse`).
* @returns A `parseSearch` function compatible with `Router` options.
* @link https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization
*/
function parseSearchWith(parser) {
	const isJsonParser = parser === JSON.parse;
	return (searchStr) => {
		if (searchStr[0] === "?") searchStr = searchStr.slice(1);
		const query = decode(searchStr);
		for (const key in query) {
			const value = query[key];
			if (typeof value === "string") {
				if (isJsonParser && !jsonStart.test(value)) continue;
				try {
					query[key] = parser(value);
				} catch (_err) {}
			}
		}
		return query;
	};
}
/**
* Build a `stringifySearch` function using a provided serializer.
*
* Non-primitive values are serialized with `stringify`. If a `parser` is
* supplied, string values that are parseable are re-serialized to ensure
* symmetry with `parseSearch`.
*
* @param stringify Function to serialize a value (e.g. `JSON.stringify`).
* @param parser Optional parser to detect parseable strings.
* @returns A `stringifySearch` function compatible with `Router` options.
* @link https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization
*/
function stringifySearchWith(stringify, parser) {
	const isJsonParser = parser === JSON.parse;
	function stringifyValue(val) {
		if (val && typeof val === "object") try {
			return stringify(val);
		} catch (_err) {}
		else if (parser && typeof val === "string") {
			if (isJsonParser && !jsonStart.test(val)) return val;
			try {
				parser(val);
				return stringify(val);
			} catch (_err) {}
		}
		return val;
	}
	return (search) => {
		const searchStr = encode(search, stringifyValue);
		return searchStr ? `?${searchStr}` : "";
	};
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/rewrite.js
/** Create a rewrite pair that strips/adds a basepath on input/output. */
function rewriteBasepath(basepath, caseSensitive, rewrite) {
	const trimmedBasepath = trimPath(basepath);
	const normalizedBasepath = `/${trimmedBasepath}`;
	const checkBasepath = caseSensitive ? normalizedBasepath : normalizedBasepath.toLowerCase();
	const checkBasepathWithSlash = `${checkBasepath}/`;
	const basepathRewrite = {
		input: ({ url }) => {
			const pathname = caseSensitive ? url.pathname : url.pathname.toLowerCase();
			if (pathname === checkBasepath) url.pathname = "/";
			else if (pathname.startsWith(checkBasepathWithSlash)) url.pathname = url.pathname.slice(normalizedBasepath.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = cleanPath(`/${trimmedBasepath}${url.pathname}`);
			return url;
		}
	};
	return rewrite ? {
		input: ({ url }) => executeRewriteInput(rewrite, basepathRewrite.input({ url })),
		output: ({ url }) => basepathRewrite.output({ url: executeRewriteOutput(rewrite, url) })
	} : basepathRewrite;
}
/** Execute a location input rewrite if provided. */
function executeRewriteInput(rewrite, url) {
	const res = rewrite?.input?.({ url });
	if (res) {
		if (typeof res === "string") return new URL(res);
		else if (res instanceof URL) return res;
	}
	return url;
}
/** Execute a location output rewrite if provided. */
function executeRewriteOutput(rewrite, url) {
	const res = rewrite?.output?.({ url });
	if (res) {
		if (typeof res === "string") return new URL(res);
		else if (res instanceof URL) return res;
	}
	return url;
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/stores.js
/** SSR non-reactive createMutableStore */
function createNonReactiveMutableStore(initialValue) {
	let value = initialValue;
	return {
		get() {
			return value;
		},
		set(nextOrUpdater) {
			value = functionalUpdate(nextOrUpdater, value);
		}
	};
}
/** SSR non-reactive createReadonlyStore */
function createNonReactiveReadonlyStore(read) {
	return { get() {
		return read();
	} };
}
function createRouterStores(initialLocation, config) {
	const { createMutableStore, createReadonlyStore, batch } = config;
	const byRoute = /* @__PURE__ */ new Map();
	const status = createMutableStore("idle");
	const location = createMutableStore(initialLocation);
	const resolvedLocation = createMutableStore(void 0);
	const ids = createMutableStore([]);
	const matches = createReadonlyStore(() => ids.get().map((id) => byRoute.get(id).get()));
	const __store = createReadonlyStore(() => ({
		status: status.get(),
		isLoading: status.get() === "pending",
		matches: matches.get(),
		location: location.get(),
		resolvedLocation: resolvedLocation.get()
	}));
	function getMatchStore(routeId) {
		let matchStore = byRoute.get(routeId);
		if (!matchStore) {
			matchStore = createMutableStore(void 0);
			byRoute.set(routeId, matchStore);
		}
		return matchStore;
	}
	const store = {
		status,
		location,
		resolvedLocation,
		ids,
		matches,
		byRoute,
		__store,
		getMatchStore,
		setMatches
	};
	function setMatches(nextMatches) {
		const previousIds = ids.get();
		const nextIds = nextMatches.map((match) => match.routeId);
		batch(() => {
			if (!arraysEqual(previousIds, nextIds)) ids.set(nextIds);
			for (const id of previousIds) if (!nextIds.includes(id)) byRoute.get(id).set(() => void 0);
			for (const nextMatch of nextMatches) {
				const matchStore = getMatchStore(nextMatch.routeId);
				if (matchStore.get() !== nextMatch) matchStore.set(nextMatch);
			}
		});
	}
	return store;
}
// ../../node_modules/.pnpm/@tanstack+history@1.162.5/node_modules/@tanstack/history/dist/esm/index.js
var stateIndexKey = "__TSR_index";
/**
* Turn protocol-relative inputs such as "//evil.example" into paths
* such as "/evil.example", keeping navigation on the current origin.
*
* For HTTP(S) URLs, WHATWG parsing ignores leading C0 controls and spaces,
* removes tabs/newlines, and treats backslashes as slashes, so inputs like
* "/\evil.example" also need normalization. This only allocates when those
* rules would make the input protocol-relative.
*/
var protocolRelativePrefix = /^[\x00-\x20]*(?:[\\/][\t\n\r]*){2,}/;
function normalizeProtocolRelative(url) {
	const match = protocolRelativePrefix.exec(url);
	return match ? "/" + url.slice(match[0].length) : url;
}
function normalizeHref(href) {
	if (/[\x00-\x1f\x7f]/.test(href)) href = href.replace(/[\x00-\x1f\x7f]/g, (character) => "	\n\r".includes(character) ? "" : encodeURIComponent(character));
	return normalizeProtocolRelative(href);
}
var noop = () => {};
var ServerHistory = class {
	constructor(location) {
		this.location = location;
	}
	get length() {
		return 1;
	}
	get subscribers() {
		return this._subscribers ??= /* @__PURE__ */ new Set();
	}
	subscribe() {
		return noop;
	}
	push() {}
	replace() {}
	go() {}
	back() {}
	forward() {}
	canGoBack() {
		return false;
	}
	createHref(href) {
		return normalizeHref(href);
	}
	block() {
		return noop;
	}
	flush() {}
	destroy() {}
	notify() {}
	_getBlockers() {
		return [];
	}
};
/** A fixed request location; server navigation is a no-op. */
function createServerHistory(href) {
	return new ServerHistory(parseHref(href, void 0));
}
function parseHref(href, state) {
	const sanitizedHref = normalizeHref(href);
	const hashIndex = sanitizedHref.indexOf("#");
	const searchIndex = sanitizedHref.indexOf("?");
	if (!state) {
		const key = createRandomKey();
		state = {
			[stateIndexKey]: 0,
			key,
			__TSR_key: key
		};
	}
	return {
		href: sanitizedHref,
		pathname: sanitizedHref.slice(0, hashIndex > -1 ? searchIndex > -1 ? Math.min(hashIndex, searchIndex) : hashIndex : searchIndex > -1 ? searchIndex : sanitizedHref.length),
		hash: hashIndex > -1 ? sanitizedHref.slice(hashIndex) : "",
		search: searchIndex > -1 ? sanitizedHref.slice(searchIndex, hashIndex === -1 ? void 0 : hashIndex) : "",
		state
	};
}
function createRandomKey() {
	return (Math.random() + 1).toString(36).slice(7);
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/router.js
function isExternalUrl(url, origin) {
	return url.protocol !== "http:" && url.protocol !== "https:" || url.origin !== origin || !!url.username || !!url.password;
}
function getUrlPath(url) {
	return url.pathname + url.search + url.hash;
}
function routeNeedsLoad(route) {
	return route.options.loader || route.options.beforeLoad || route.lazyFn || route.options.component?.preload || route.options.pendingComponent?.preload;
}
/**
* Compute whether path, href or hash changed between previous and current
* resolved locations.
*/
function getLocationChangeInfo(location, resolvedLocation) {
	return {
		fromLocation: resolvedLocation,
		toLocation: location,
		pathChanged: resolvedLocation?.pathname !== location.pathname,
		hrefChanged: resolvedLocation?.href !== location.href,
		hashChanged: resolvedLocation?.hash !== location.hash
	};
}
function lifecycleEnd(matches) {
	return matches.findIndex((match) => match.status === "error" || match.status === "notFound" || match._notFound) + 1;
}
/** Run route lifecycle callbacks in leave/enter/stay phases. */
function runRouteLifecycle(router, previous, matches, previousEnd, nextEnd, owner) {
	if (previousEnd) previous = previous.slice(0, previousEnd);
	if (nextEnd) matches = matches.slice(0, nextEnd);
	for (const match of previous) {
		if (owner && router._tx !== owner) return;
		if (!matches.some((candidate) => candidate.routeId === match.routeId)) router.routesById[match.routeId].options.onLeave?.(match);
	}
	for (const match of matches) {
		if (owner && router._tx !== owner) return;
		router.routesById[match.routeId].options[previous.some((candidate) => candidate.routeId === match.routeId) ? "onStay" : "onEnter"]?.(match);
	}
}
/**
* Core, framework-agnostic router engine that powers TanStack Router.
*
* Provides navigation, matching, loading, preloading, caching and event APIs
* used by framework adapters (React/Solid). Prefer framework helpers like
* `createRouter` in app code.
*
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/RouterType
*/
var RouterCore = class {
	/**
	* @deprecated Use the `createRouter` function instead
	*/
	constructor(options, getStoreConfig) {
		this.tempLocationKey = `${Math.round(Math.random() * 1e7)}`;
		this._scroll = { n: true };
		this.subscribers = /* @__PURE__ */ new Set();
		this._cache = /* @__PURE__ */ new Map();
		this._committed = [];
		this.startTransition = async (fn) => {
			fn();
			return false;
		};
		this.update = (newOptions) => {
			const prevOptions = this.options;
			this.options = {
				...prevOptions,
				...newOptions
			};
			this.isServer = this.options.isServer ?? true ?? typeof document === "undefined";
			this.protocolAllowlist = new Set(this.options.protocolAllowlist);
			if (!this.history || this.options.history && this.options.history !== this.history) {
				if (!this.options.history) {} else this.history = this.options.history;
			}
			this.origin = this.options.origin;
			if (!this.origin) this.origin = "http://localhost";
			const nextBasepath = this.options.basepath ?? "/";
			const nextRewriteOption = this.options.rewrite;
			const rewriteChanged = this.basepath !== nextBasepath || prevOptions?.rewrite !== nextRewriteOption || prevOptions?.caseSensitive !== this.options.caseSensitive;
			if (rewriteChanged) {
				this.basepath = nextBasepath;
				this.rewrite = nextBasepath !== "/" && trimPath(nextBasepath) ? rewriteBasepath(nextBasepath, this.options.caseSensitive, nextRewriteOption) : nextRewriteOption;
			}
			if (this.history) this.updateLatestLocation();
			if (this.options.routeTree !== this.routeTree || prevOptions?.caseSensitive !== this.options.caseSensitive) {
				this.routeTree = this.options.routeTree;
				let processRouteTreeResult;
				if (globalThis.__TSR_CACHE__ && globalThis.__TSR_CACHE__.routeTree === this.routeTree && globalThis.__TSR_CACHE__.caseSensitive === this.options.caseSensitive) processRouteTreeResult = globalThis.__TSR_CACHE__.processRouteTreeResult;
				else {
					processRouteTreeResult = this.buildRouteTree();
					if (globalThis.__TSR_CACHE__ === void 0) globalThis.__TSR_CACHE__ = {
						routeTree: this.routeTree,
						caseSensitive: this.options.caseSensitive,
						processRouteTreeResult
					};
				}
				this.setRoutes(processRouteTreeResult);
			}
			if (!this.stores) {
				if (this.latestLocation) {
					const config = this.getStoreConfig(this);
					this.batch = config.batch;
					this.stores = createRouterStores(this.latestLocation, config);
				}
			} else if (rewriteChanged) this.stores.location.set(this.latestLocation);
		};
		this.updateLatestLocation = () => {
			this.latestLocation = this.parseLocation(this.history.location, this.latestLocation);
		};
		this.buildRouteTree = () => {
			const result = processRouteTree(this.routeTree, this.options.caseSensitive);
			if (this.options.routeMasks) processRouteMasks(this.options.routeMasks, result.processedTree);
			return {
				...result,
				resolvePathCache: createSieveCache(1e3)
			};
		};
		this.subscribe = (eventType, fn) => {
			const listener = {
				eventType,
				fn
			};
			this.subscribers.add(listener);
			return () => {
				this.subscribers.delete(listener);
			};
		};
		this.emit = (routerEvent) => {
			for (const listener of this.subscribers) if (listener.eventType === routerEvent.type) try {
				listener.fn(routerEvent);
			} catch (e) {
				console.error(e);
			}
		};
		this.parseLocation = (locationToParse, previousLocation) => {
			const parse = ({ pathname, search, hash, href }, state) => {
				if (!this.rewrite && !/[ \x00-\x1f\x7f\u0080-\uffff]/.test(pathname)) {
					const parsedSearch = this.options.parseSearch(search);
					const searchStr = this.options.stringifySearch(parsedSearch);
					return {
						href: pathname + searchStr + hash,
						publicHref: pathname + searchStr + hash,
						pathname: decodePath(pathname),
						external: false,
						searchStr,
						search: nullReplaceEqualDeep(previousLocation?.search, parsedSearch),
						hash: decodePath(hash.slice(1)),
						state: replaceEqualDeep(previousLocation?.state, state)
					};
				}
				const url = executeRewriteInput(this.rewrite, new URL(href, this.origin));
				const parsedSearch = this.options.parseSearch(url.search);
				const searchStr = this.options.stringifySearch(parsedSearch);
				url.search = searchStr;
				return {
					href: url.href.replace(url.origin, ""),
					publicHref: href,
					pathname: decodePath(normalizeProtocolRelative(url.pathname)),
					external: !!this.rewrite && isExternalUrl(url, this.origin),
					searchStr,
					search: nullReplaceEqualDeep(previousLocation?.search, parsedSearch),
					hash: decodePath(url.hash.slice(1)),
					state: replaceEqualDeep(previousLocation?.state, state)
				};
			};
			const location = parse(locationToParse, locationToParse.state);
			const { __tempLocation, __tempKey } = location.state;
			if (__tempLocation && (!__tempKey || __tempKey === this.tempLocationKey)) {
				const parsedTempLocation = parse(__tempLocation, {
					...__tempLocation.state,
					__tempLocation: void 0,
					key: location.state.key,
					__TSR_key: location.state.__TSR_key
				});
				parsedTempLocation.maskedLocation = location;
				return parsedTempLocation;
			}
			return location;
		};
		this.matchRoutes = (pathnameOrNext, locationSearchOrOpts, opts) => {
			if (typeof pathnameOrNext === "string") return this.matchRoutesInternal({
				pathname: pathnameOrNext,
				search: locationSearchOrOpts
			}, opts);
			return this.matchRoutesInternal(pathnameOrNext, locationSearchOrOpts);
		};
		this.getMatchedRoutes = (pathname) => {
			const rawParams = Object.create(null);
			const match = findRouteMatch(trimPathRight(pathname), this.processedTree, true);
			if (match) Object.assign(rawParams, match.rawParams);
			return [
				match?.branch || [this.routesById["__root__"]],
				rawParams,
				match?.route
			];
		};
		this.buildLocation = (opts) => {
			const build = (dest = {}) => {
				if (dest.href) {
					const parsed = parseHref(dest.href, {});
					dest = {
						...dest,
						to: executeRewriteInput(this.rewrite, new URL(parsed.pathname, this.origin)).pathname,
						search: this.options.parseSearch(parsed.search),
						hash: parsed.hash.slice(1)
					};
				}
				const currentLocation = opts._fromLocation || this._pendingLocation || this.latestLocation;
				let lightweight;
				const current = () => {
					return currentLocation;
				};
				const currentMatch = () => lightweight ??= this.matchRoutesLightweight(current());
				const to = dest.to ? `${dest.to}` : ".";
				const nextTo = resolvePath(to[0] === "/" ? "" : dest.unsafeRelative === "path" ? current().pathname : dest.from ?? currentMatch()[1], to, this.options.trailingSlash, this.resolvePathCache);
				const destRoute = this.routesByPath[trimPathRight(nextTo)];
				const isTemplate = nextTo.includes("$");
				let destRoutes;
				if (destRoute) destRoutes = destRoute._branch ??= buildRouteBranch(destRoute);
				else if (isTemplate) destRoutes = [];
				else {
					const [matchedRoutes, rawParams, foundRoute] = this.getMatchedRoutes(nextTo);
					destRoutes = matchedRoutes;
					if (this.options.notFoundRoute && (!foundRoute || foundRoute.path !== "/" && rawParams["**"])) destRoutes = [...destRoutes, this.options.notFoundRoute];
				}
				const interpolation = isTemplate ? destRoute?._interpolation ?? parseSegments(false, { fullPath: nextTo }, 0) : void 0;
				let nextParams;
				for (const route of destRoutes) {
					const fn = route.options.params?.stringify ?? route.options.stringifyParams;
					if (fn) {
						const fromParams = currentMatch()[3];
						nextParams ??= resolveNextParams(dest.params, fromParams);
						if (!hasKeys(nextParams)) break;
						if (nextParams === fromParams) nextParams = Object.assign(createNull(), nextParams);
						try {
							Object.assign(nextParams, fn(nextParams));
						} catch {}
					}
				}
				nextParams ??= resolveNextParams(dest.params, needsInheritedParams(dest.params, interpolation) ? currentMatch()[3] : EMPTY_RECORD);
				const nextPathname = opts.leaveParams ? nextTo : normalizeProtocolRelative(decodePath(interpolation ? interpolatePath(nextTo, interpolation, nextParams, this.pathParamsDecoder) : nextTo));
				const middlewares = getSearchMiddlewares(destRoutes, opts._includeValidateSearch);
				const fromSearch = () => {
					let search = currentMatch()[2];
					if (opts._includeValidateSearch && this.options.search?.strict) {
						const validatedSearch = {};
						destRoutes.forEach((route) => {
							if (route.options.validateSearch) try {
								Object.assign(validatedSearch, validateSearch(route.options.validateSearch, {
									...validatedSearch,
									...search
								}));
							} catch {}
						});
						search = validatedSearch;
					}
					return search;
				};
				const nextSearch = middlewares.length ? applySearchMiddleware(middlewares, fromSearch(), dest) : dest.search === true ? fromSearch() : typeof dest.search === "function" ? dest.search(fromSearch()) : dest.search || EMPTY_RECORD;
				const searchStr = this.options.stringifySearch(nextSearch);
				const hash = dest.hash === true ? current().hash : typeof dest.hash === "function" ? dest.hash(current().hash) : dest.hash || void 0;
				const hashStr = hash ? `#${hash}` : "";
				const nextState = !dest.state ? EMPTY_RECORD : dest.state === true ? current().state : typeof dest.state === "function" ? dest.state(current().state) : dest.state;
				const fullPath = `${nextPathname}${searchStr}${hashStr}`;
				let href;
				let publicHref;
				let external = false;
				if (this.rewrite) {
					const url = new URL(fullPath, this.origin);
					const origin = url.origin;
					const rewrittenUrl = executeRewriteOutput(this.rewrite, url);
					href = getUrlPath(url);
					if (isExternalUrl(rewrittenUrl, origin)) {
						publicHref = rewrittenUrl.href;
						external = true;
					} else publicHref = normalizeProtocolRelative(getUrlPath(rewrittenUrl));
				} else {
					href = encodePathLikeUrl(fullPath);
					publicHref = href;
				}
				return {
					publicHref,
					href,
					pathname: nextPathname,
					search: nextSearch,
					searchStr,
					state: nextState,
					hash: hash ?? "",
					external,
					unmaskOnReload: dest.unmaskOnReload
				};
			};
			const next = build(opts);
			if (opts.mask) next.maskedLocation = build({
				from: opts.from,
				...opts.mask
			});
			else if (this.options.routeMasks) {
				const match = findFlatMatch(next.pathname, this.processedTree);
				if (match) {
					const params = Object.assign(createNull(), match.rawParams);
					const { from: _from, params: maskParams, ...maskProps } = match.route;
					const nextParams = resolveNextParams(maskParams, params);
					next.maskedLocation = build({
						from: opts.from,
						...maskProps,
						params: nextParams
					});
				}
			}
			return next;
		};
		this.commitLocation = async ({ viewTransition, ignoreBlocker, ...next }) => {};
		this.buildAndCommitLocation = ({ replace, resetScroll, hashScrollIntoView, viewTransition, ignoreBlocker, ...rest } = {}) => {
			return Promise.resolve();
		};
		this.navigate = async ({ to, reloadDocument, href, publicHref, ...rest }) => {};
		this.load = async (opts) => {
			return loadServerRoute(this, opts);
		};
		this.startViewTransition = (fn) => {
			this.shouldViewTransition ?? this.options.defaultViewTransition;
			this.shouldViewTransition = void 0;
			return fn();
		};
		this.invalidate = (opts) => {
			const committedMatches = this._committed;
			const filter = opts?.filter;
			const preloads = this._preloads;
			const invalidIds = /* @__PURE__ */ new Set();
			const consider = (match) => {
				if (!filter || filter(match)) invalidIds.add(match.id);
			};
			committedMatches.forEach(consider);
			this._cache.forEach(consider);
			preloads?.forEach((matches) => matches.forEach(consider));
			this._tx?.[3].forEach(consider);
			const abort = [];
			for (const [controller, matches] of preloads ?? []) if (matches.some((match) => invalidIds.has(match.id))) {
				preloads.delete(controller);
				abort.push(controller);
			}
			const invalidate = (d) => {
				if (invalidIds.has(d.id)) {
					const route = this.routesById[d.routeId];
					const next = {
						...d,
						invalid: true,
						...(opts?.forcePending || d.status === "error" || d.status === "notFound") && routeNeedsLoad(route) ? {
							status: "pending",
							error: void 0
						} : void 0
					};
					d._flight = void 0;
					return next;
				}
				return d;
			};
			this._committed = committedMatches.map(invalidate);
			for (const [id, match] of this._cache) if (invalidIds.has(id)) {
				match.invalid = true;
				if (opts?.forcePending) match.status = "pending";
			}
			for (const id of invalidIds) {
				const flight = this._flights?.get(id);
				this._flights?.delete(id);
				if (flight && !flight[2]) abort.push(flight[1]);
			}
			for (const controller of abort) controller.abort();
			this.shouldViewTransition = false;
			return this.load({ sync: opts?.sync });
		};
		this.resolveRedirect = (redirect) => {
			const options = redirect.options;
			let href = redirect.headers.get("Location") || options.href;
			if (!href) {
				const location = this.buildLocation(options);
				href = (location.maskedLocation ?? location).publicHref || "/";
			}
			let scheme;
			if (protocolRelativePrefixRegex.test(href) || (scheme = getUrlScheme(href)) && !this.protocolAllowlist.has(scheme)) throw new Error("Redirect blocked: unsafe protocol");
			if (scheme === "http:" || scheme === "https:") {
				const url = new URL(href);
				if (url.pathname.startsWith("//")) href = url.href;
				else if (!isExternalUrl(url, this.origin)) {
					href = getUrlPath(url);
					scheme = void 0;
				}
			}
			if (scheme) options.reloadDocument = true;
			options.href = href;
			redirect.headers.set("Location", href);
			return redirect;
		};
		this.clearCache = (opts) => {
			const cached = this._cache;
			const preloads = this._preloads;
			const filter = opts?.filter;
			const discarded = [];
			const discardedIds = [];
			for (const [id, match] of cached) if (!filter || filter(match)) {
				discardedIds.push(id);
				discarded.push(match);
			}
			const abort = [];
			for (const [controller, matches] of preloads ?? []) if (!filter || matches.some(filter)) {
				abort.push(controller);
				discarded.push(...matches);
			}
			for (const id of discardedIds) cached.delete(id);
			for (const controller of abort) preloads.delete(controller);
			for (const match of discarded) {
				const flight = match._flight;
				match._flight = void 0;
				if (flight && !--flight[2]) {
					if (this._flights?.get(match.id) === flight) this._flights.delete(match.id);
					abort.push(flight[1]);
				}
			}
			for (const controller of abort) controller.abort();
		};
		this.loadRouteChunk = loadRouteChunk;
		this.preloadRoute = (opts) => preloadClientRoute(this, opts);
		this.matchRoute = (location, opts) => {
			const matchLocation = {
				...location,
				to: location.to ? resolvePath(location.from || "", location.to, this.options.trailingSlash, this.resolvePathCache) : void 0,
				params: location.params || {},
				leaveParams: true
			};
			const next = this.buildLocation(matchLocation);
			const isPending = this.stores.status.get() === "pending";
			if (opts?.pending && !isPending) return false;
			const baseLocation = opts?.pending ?? !isPending ? this.latestLocation : this.stores.resolvedLocation.get() || this.stores.location.get();
			const match = findSingleMatch(next.pathname, opts?.caseSensitive ?? false, opts?.fuzzy ?? false, baseLocation.pathname, this.processedTree);
			if (!match) return false;
			if (location.params) {
				if (!deepEqual(match.rawParams, location.params, true)) return false;
			}
			if (opts?.includeSearch ?? true) return deepEqual(baseLocation.search, next.search, true) ? match.rawParams : false;
			return match.rawParams;
		};
		this.getStoreConfig = getStoreConfig;
		if (options.pathParamsAllowedCharacters?.length) this.pathParamsDecoder = compileDecodeCharMap(options.pathParamsAllowedCharacters);
		this.update({
			defaultPreloadDelay: 50,
			defaultPendingMs: 1e3,
			defaultPendingMinMs: 500,
			context: void 0,
			...options,
			caseSensitive: options.caseSensitive ?? false,
			notFoundMode: options.notFoundMode ?? "fuzzy",
			stringifySearch: options.stringifySearch ?? defaultStringifySearch,
			parseSearch: options.parseSearch ?? defaultParseSearch,
			protocolAllowlist: options.protocolAllowlist ?? DEFAULT_PROTOCOL_ALLOWLIST
		});
	}
	isShell() {
		return !!this.options.isShell;
	}
	get state() {
		return this.stores.__store.get();
	}
	setRoutes(caches) {
		Object.assign(this, caches);
		this.lightweightCache = /* @__PURE__ */ new WeakMap();
		const notFoundRoute = this.options.notFoundRoute;
		if (notFoundRoute) {
			notFoundRoute.init(99999999999);
			if (this.routesById[notFoundRoute.id] !== notFoundRoute) notFoundRoute._interpolation = parseSegments(false, notFoundRoute, 0);
			this.routesById[notFoundRoute.id] = notFoundRoute;
		}
	}
	matchRoutesInternal(next, opts) {
		const [initialMatchedRoutes, rawParams, foundRoute] = this.getMatchedRoutes(next.pathname);
		let matchedRoutes = initialMatchedRoutes;
		let isGlobalNotFound = false;
		if (foundRoute ? foundRoute.path !== "/" && rawParams["**"] : trimPathRight(next.pathname)) {
			if (this.options.notFoundRoute) matchedRoutes = [...matchedRoutes, this.options.notFoundRoute];
			else isGlobalNotFound = true;
		}
		const _notFoundRouteId = isGlobalNotFound ? findGlobalNotFoundRouteId(this.options.notFoundMode, matchedRoutes) : void 0;
		const matches = new Array(matchedRoutes.length);
		const committed = this._committed;
		const previousAt = (route, index) => {
			const match = committed[index];
			return match?.routeId === route.id ? match : route === this.options.notFoundRoute ? committed.find((candidate) => candidate.routeId === route.id) : void 0;
		};
		let strictParams;
		for (let index = 0; index < matchedRoutes.length; index++) {
			const route = matchedRoutes[index];
			const parentMatch = matches[index - 1];
			let preMatchSearch;
			let strictMatchSearch;
			let searchError;
			{
				const parentSearch = parentMatch?.search ?? next.search;
				const parentStrictSearch = parentMatch?._strictSearch ?? void 0;
				try {
					const strictSearch = validateSearch(route.options.validateSearch, { ...parentSearch }) ?? void 0;
					preMatchSearch = {
						...parentSearch,
						...strictSearch
					};
					strictMatchSearch = {
						...parentStrictSearch,
						...strictSearch
					};
				} catch (err) {
					let searchParamError = err;
					if (!(err instanceof SearchParamError)) searchParamError = new SearchParamError(err.message, { cause: err });
					if (opts?.throwOnError) throw searchParamError;
					preMatchSearch = parentSearch;
					strictMatchSearch = {};
					searchError = searchParamError;
				}
			}
			let loaderDeps = "";
			let loaderDepsHash = "";
			try {
				loaderDeps = route.options.loaderDeps?.({ search: preMatchSearch }) ?? "";
				loaderDepsHash = loaderDeps ? JSON.stringify(loaderDeps) || "" : "";
			} catch (cause) {
				if (opts?.throwOnError) throw cause;
				searchError ??= cause;
			}
			const usedParams = createNull();
			const interpolatedPath = route._interpolation ? interpolatePath(route.fullPath, route._interpolation, rawParams, this.pathParamsDecoder, usedParams) : route.fullPath;
			const matchId = route.id + interpolatedPath + loaderDepsHash;
			const previousMatch = previousAt(route, index);
			const existingMatch = this._cache.get(matchId) ?? (previousMatch?.id === matchId ? previousMatch : void 0);
			strictParams = existingMatch?._strictParams ?? Object.assign(usedParams, strictParams);
			let paramsError;
			if (!existingMatch) try {
				extractStrictParams(route, strictParams);
			} catch (err) {
				if (isNotFound(err) || isRedirect(err)) paramsError = err;
				else paramsError = new PathParamError(err.message, { cause: err });
				if (opts?.throwOnError) throw paramsError;
			}
			const cause = previousMatch ? "stay" : "enter";
			let match;
			if (existingMatch) match = {
				...existingMatch,
				cause,
				search: previousMatch ? nullReplaceEqualDeep(previousMatch.search, preMatchSearch) : nullReplaceEqualDeep(existingMatch.search, preMatchSearch),
				_strictSearch: strictMatchSearch,
				searchError
			};
			else {
				const status = routeNeedsLoad(route) ? "pending" : "success";
				match = {
					id: matchId,
					ssr: void 0,
					index,
					routeId: route.id,
					params: previousMatch?.params ?? strictParams,
					_strictParams: strictParams,
					pathname: interpolatedPath,
					updatedAt: Date.now(),
					search: previousMatch ? nullReplaceEqualDeep(previousMatch.search, preMatchSearch) : preMatchSearch,
					_strictSearch: strictMatchSearch,
					searchError,
					status,
					isFetching: false,
					error: void 0,
					paramsError,
					context: {},
					abortController: opts?._controller ?? new AbortController(),
					cause,
					loaderDeps: previousMatch ? replaceEqualDeep(previousMatch.loaderDeps, loaderDeps) : loaderDeps,
					invalid: false,
					preload: false,
					staticData: route.options.staticData || {},
					fullPath: route.fullPath
				};
			}
			const _notFound = _notFoundRouteId === route.id;
			if (match._notFound && !_notFound) match.error = void 0;
			match._notFound = _notFound;
			matches[index] = match;
		}
		for (let index = 0; index < matches.length; index++) {
			const match = matches[index];
			match.params = match.cause === "stay" ? nullReplaceEqualDeep(match.params, strictParams) : strictParams;
			if (opts?._controller) match.context = {};
		}
		return matches;
	}
	/**
	* Lightweight route matching for buildLocation.
	* Only computes fullPath, accumulated search, and params - skipping expensive
	* operations like AbortController, loaderDeps, and full match objects.
	*/
	matchRoutesLightweight(location) {
		const lastRouteId = last(this.stores.ids.get());
		const lastStateMatch = lastRouteId ? this.stores.byRoute.get(lastRouteId).get() : void 0;
		const lastStateMatchId = lastStateMatch?.id;
		const cached = this.lightweightCache.get(location);
		if (cached && cached[0] === lastStateMatchId) return cached[1];
		const [matchedRoutes, rawParams] = this.getMatchedRoutes(location.pathname);
		const lastRoute = last(matchedRoutes);
		const accumulatedSearch = { ...location.search };
		for (const route of matchedRoutes) try {
			Object.assign(accumulatedSearch, validateSearch(route.options.validateSearch, accumulatedSearch));
		} catch {}
		const canReuseParams = lastStateMatch && lastStateMatch.routeId === lastRoute.id && lastStateMatch.pathname === location.pathname;
		let params;
		if (canReuseParams) params = lastStateMatch.params;
		else {
			const strictParams = rawParams;
			for (const route of matchedRoutes) try {
				extractStrictParams(route, strictParams);
			} catch {}
			params = strictParams;
		}
		const result = [
			matchedRoutes,
			lastRoute.fullPath,
			accumulatedSearch,
			params
		];
		this.lightweightCache.set(location, [lastStateMatchId, result]);
		return result;
	}
};
/** Error thrown when search parameter validation fails. */
var SearchParamError = class extends Error {};
/** Error thrown when path parameter parsing/validation fails. */
var PathParamError = class extends Error {};
function validateSearch(validateSearch, input) {
	if (validateSearch == null) return {};
	if ("~standard" in validateSearch) {
		const result = validateSearch["~standard"].validate(input);
		if (result instanceof Promise) throw new SearchParamError("Async validation not supported");
		if (result.issues) throw new SearchParamError(JSON.stringify(result.issues, void 0, 2), { cause: result });
		return result.value;
	}
	if ("parse" in validateSearch) return validateSearch.parse(input);
	if (typeof validateSearch === "function") return validateSearch(input);
	return {};
}
function resolveNextParams(spec, base) {
	if (spec === void 0 || spec === true) return base;
	const next = Object.create(null);
	if (spec === false || spec === null) return next;
	if (typeof spec === "function") {
		Object.assign(next, base);
		return Object.assign(next, spec(next));
	}
	return Object.assign(next, base, spec);
}
function needsInheritedParams(spec, interpolation) {
	if (typeof spec === "function") return true;
	if (!interpolation || spec === false || spec === null) return false;
	return spec === void 0 || spec === true || interpolation.some((part) => typeof part !== "string" && !hasOwn.call(spec, part[1]));
}
var EMPTY_RECORD = Object.freeze({});
function getSearchMiddlewares(destRoutes, includeValidateSearch) {
	const middlewares = [];
	for (let i = 0; i < destRoutes.length; i++) {
		const routeOptions = destRoutes[i].options;
		if ("search" in routeOptions) {
			if (routeOptions.search?.middlewares) middlewares.push(...routeOptions.search.middlewares);
		} else if (routeOptions.preSearchFilters || routeOptions.postSearchFilters) {
			const legacyMiddleware = ({ search, next }) => {
				const result = next(routeOptions.preSearchFilters ? routeOptions.preSearchFilters.reduce((prev, next) => next(prev), search) : search);
				return routeOptions.postSearchFilters ? routeOptions.postSearchFilters.reduce((prev, next) => next(prev), result) : result;
			};
			middlewares.push(legacyMiddleware);
		}
		const routeValidateSearch = routeOptions.validateSearch;
		if (includeValidateSearch && routeValidateSearch) {
			const validate = ({ search, next, meta }) => {
				const result = next(search);
				try {
					const validated = validateSearch(routeValidateSearch, result);
					if (meta && validated) {
						for (const key in validated) if (!(key in result)) (meta.defaulted ||= /* @__PURE__ */ new Map()).set(key, validated[key]);
					}
					return {
						...result,
						...validated
					};
				} catch {}
				return result;
			};
			middlewares.push(validate);
		}
	}
	return middlewares;
}
function applySearchMiddleware(middlewares, search, dest) {
	const applyNext = (index, currentSearch, meta) => {
		if (index >= middlewares.length) {
			if (!dest.search) return {};
			if (dest.search === true) return currentSearch;
			const result = functionalUpdate(dest.search, currentSearch);
			if (meta) meta.explicit = result;
			return result;
		}
		const next = (newSearch, collectMeta) => {
			if (collectMeta) {
				const nextMeta = meta || {};
				return {
					search: applyNext(index + 1, newSearch, nextMeta),
					meta: nextMeta
				};
			}
			return applyNext(index + 1, newSearch, meta);
		};
		return middlewares[index]({
			search: currentSearch,
			next,
			meta
		});
	};
	return applyNext(0, search);
}
function findGlobalNotFoundRouteId(notFoundMode, routes) {
	if (notFoundMode !== "root") {
		let fallback;
		for (let i = routes.length - 1; i >= 0; i--) {
			const route = routes[i];
			if (route.options.notFoundComponent) return route.id;
			fallback ||= route.children && route.id;
		}
		if (fallback) return fallback;
	}
	return rootRouteId;
}
function extractStrictParams(route, accumulatedParams) {
	const parseParams = route.options.params?.parse ?? route.options.parseParams;
	if (parseParams) Object.assign(accumulatedParams, parseParams(accumulatedParams));
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/load-client.js
function preloadComponent(route, type) {
	return route.options[type]?.preload?.();
}
function loadComponents(route, onPendingReady) {
	const component = preloadComponent(route, "component");
	let pending = preloadComponent(route, "pendingComponent");
	if (onPendingReady) {
		if (pending) pending = pending.then(onPendingReady);
		else onPendingReady();
	}
	if (component && pending) return Promise.all([component, pending]).then(() => {});
	return component ?? pending;
}
function loadRouteChunk(route, componentType, onPendingReady) {
	const afterLazy = () => componentType === false ? void 0 : componentType ? preloadComponent(route, componentType) : loadComponents(route, onPendingReady);
	const current = route._lazy;
	if (current) return current === true ? afterLazy() : current.then(afterLazy);
	if (!route.lazyFn) return afterLazy();
	const promise = route.lazyFn().then((lazyRoute) => {
		{
			const { id: _id, ...options } = lazyRoute.options;
			Object.assign(route.options, options);
			route._lazy = true;
		}
	}, (error) => {
		route._lazy = void 0;
		throw error;
	});
	route._lazy = promise;
	return promise.then(afterLazy);
}
/** Return the structural lane through the first terminal render boundary. */
function _getRenderedMatches(matches) {
	const end = matches.findIndex((match) => match.status !== "success" || match._notFound) + 1;
	return end && end < matches.length ? matches.slice(0, end) : matches;
}
/**
* Truthy when the transaction publishing `location` leaves `routeId` out of its
* matches, so subscribers scoped to that route can skip the publication: the
* route unmounts when the transaction commits, and a transaction that ends
* otherwise is superseded or redirected by a newer publication. Only valid
* synchronously inside the publication: the transaction's matches are emptied
* at commit and before following a redirect. Publications without a matching
* transaction (hydration) and scopes without a route never depart.
*/
function _isRouteDeparting(router, routeId, location) {
	const tx = router._tx;
	return routeId && tx?.[2] === location && !tx[3].some((match) => match.routeId === routeId);
}
/** Return the lane whose document assets belong to the current presentation. */
function _getAssetMatches(matches) {
	let end = matches.length;
	for (let index = 0; index < end; index++) {
		const match = matches[index];
		if (match._assetEnd !== void 0) {
			end = Math.min(end, Math.max(index + 1, match._assetEnd));
			continue;
		}
		if (match.status !== "success" || match._notFound) {
			end = index + 1;
			break;
		}
	}
	return end < matches.length ? matches.slice(0, end) : matches;
}
var SUCCESS$1 = 0;
var ERROR$1 = 1;
var NOT_FOUND$1 = 2;
var REDIRECTED$1 = 3;
var CANCELED_OUTCOME = [4];
function isControl(result) {
	return typeof result[0] === "number";
}
function waitFor$1(value, signal) {
	if (signal.aborted) return Promise.race([Promise.reject(signal), value]);
	return new Promise((resolve, reject) => {
		const abort = () => reject(signal);
		signal.addEventListener("abort", abort, { once: true });
		Promise.resolve(value).then(resolve, reject).then(() => signal.removeEventListener("abort", abort));
	});
}
function getRoute$1(router, match) {
	return router.routesById[match.routeId];
}
function normalize$1(value, rejected, routeId) {
	if (isRedirect(value)) return [REDIRECTED$1, value];
	if (isNotFound(value)) {
		value.routeId ||= routeId;
		return [NOT_FOUND$1, value];
	}
	if (!rejected) return [SUCCESS$1, value];
	if (typeof value?.then === "function") value = new Error("A Promise was thrown", { cause: value });
	return [ERROR$1, value];
}
function normalizeError$1(route, cause) {
	let outcome = normalize$1(cause, true, route.id);
	if (outcome[0] !== ERROR$1) return outcome;
	try {
		route.options.onError?.(outcome[1]);
	} catch (onErrorCause) {
		outcome = normalize$1(onErrorCause, true, route.id);
	}
	return outcome;
}
function normalizeLaneError(router, lane, route, cause, options) {
	if (options[0].signal.aborted) return CANCELED_OUTCOME;
	return materializeRedirect$1(router, lane, route, normalizeError$1(route, cause), options);
}
async function contextualize$1(router, lane, options, end, planSuccessfulLane, retainedEnd) {
	const [location, matches] = lane;
	const signal = options[0].signal;
	const preload = !!options[3];
	for (let index = options[6] ?? 0; index < end; index++) {
		const match = matches[index];
		const route = getRoute$1(router, match);
		match.abortController = options[0];
		const parentContext = matches[index - 1]?.context ?? router.options.context ?? {};
		const common = {
			params: match.params,
			location,
			navigate: (opts) => router.navigate({
				...opts,
				_fromLocation: location
			}),
			buildLocation: router.buildLocation,
			cause: preload ? "preload" : match.cause,
			abortController: options[0],
			preload,
			matches,
			routeId: route.id
		};
		try {
			const routeContext = match._ctx ||= route.options.context ? route.options.context({
				...common,
				deps: match.loaderDeps,
				context: parentContext
			}) || {} : void 0;
			match.context = {
				...parentContext,
				...routeContext
			};
		} catch (cause) {
			releaseFlight(router, match);
			return [index, normalizeLaneError(router, lane, route, cause, options)];
		}
		if (signal.aborted) return [index, CANCELED_OUTCOME];
		const validationError = match.paramsError ?? match.searchError;
		if (validationError !== void 0) {
			releaseFlight(router, match);
			return [index, normalizeLaneError(router, lane, route, validationError, options)];
		}
		const beforeLoad = route.options.beforeLoad;
		if (!beforeLoad) continue;
		const previousStatus = match.status;
		if (index >= retainedEnd) {
			match.status = "pending";
			options[7]?.();
		}
		try {
			setFetching(router, match, "beforeLoad", options[0]);
			const value = beforeLoad({
				...common,
				search: match.search,
				context: match.context,
				...router.options.additionalContext
			});
			const result = await (typeof value?.then === "function" ? waitFor$1(value, signal) : value);
			if (signal.aborted) return [index, CANCELED_OUTCOME];
			const outcome = materializeRedirect$1(router, lane, route, normalize$1(result, false, route.id), options);
			if (outcome[0] !== SUCCESS$1) {
				releaseFlight(router, match);
				return [index, outcome];
			}
			match.context = {
				...match.context,
				...result
			};
		} catch (cause) {
			releaseFlight(router, match);
			return [index, normalizeLaneError(router, lane, route, cause, options)];
		} finally {
			match.status = previousStatus;
			setFetching(router, match, false, options[0]);
		}
	}
	planSuccessfulLane();
}
function releaseOwnedFlight(router, match, flight) {
	if (!flight || --flight[2]) return;
	if (router._flights?.get(match.id) === flight) {
		const current = router._tx;
		if (current && !current[0].signal.aborted && !current[3].includes(match) && current[3].some((candidate) => candidate.id === match.id) && current[3].some((candidate) => candidate.isFetching === "beforeLoad")) return;
		router._flights.delete(match.id);
	}
	return flight[1];
}
function releaseFlight(router, match) {
	const flight = match._flight;
	match._flight = void 0;
	releaseOwnedFlight(router, match, flight)?.abort();
}
/**
* Not passing in a `next` ownership recipient
* is equivalent to discarding the match resources
*/
function transferMatchResources(router, previous, next, deferSameIdFlight) {
	const abort = [];
	for (const match of previous) if (!next?.includes(match)) {
		const flight = match._flight;
		match._flight = void 0;
		if (deferSameIdFlight && flight?.[2] === 1 && router._flights?.get(match.id) === flight && next?.some((candidate) => candidate.id === match.id)) flight[2] = 0;
		else {
			const controller = releaseOwnedFlight(router, match, flight);
			if (controller) abort.push(controller);
		}
	}
	for (const controller of abort) controller.abort();
}
function acquireMatchResources(matches) {
	for (const match of matches) {
		const flight = match._flight;
		if (flight) flight[2]++;
	}
}
function setFetching(router, match, value, owner) {
	match.isFetching = value;
	if (owner && router._tx?.[0] !== owner) return;
	const store = router.stores.byRoute.get(match.routeId);
	const presented = store?.get();
	if (presented?.id === match.id) store.set({
		...presented,
		isFetching: value
	});
}
function getLoaderContext$1(router, lane, match, route, controller, parentMatchPromise, preload) {
	const location = lane[0];
	return {
		params: match.params,
		location,
		navigate: (opts) => router.navigate({
			...opts,
			_fromLocation: location
		}),
		cause: preload ? "preload" : match.cause,
		abortController: controller,
		preload,
		deps: match.loaderDeps,
		parentMatchPromise,
		context: match.context,
		route,
		...router.options.additionalContext
	};
}
async function loadResource(router, lane, match, route, loader, parentMatchPromise, options) {
	const owner = options[0];
	const signal = owner.signal;
	if (signal.aborted) return CANCELED_OUTCOME;
	if (!loader) return [SUCCESS$1, void 0];
	let flight = match._flight;
	setFetching(router, match, "loader", owner);
	try {
		if (!flight) {
			const controller = new AbortController();
			flight = [
				Promise.resolve().then(() => loader(getLoaderContext$1(router, lane, match, route, controller, parentMatchPromise, !!options[3]))).then((value) => normalize$1(value, false, route.id), (cause) => normalize$1(cause, true, route.id)).then((result) => {
					if (result[0] !== SUCCESS$1 && router._flights?.get(match.id) === flight) {
						router._flights.delete(match.id);
						if (!flight[2]) controller.abort();
					}
					return result[0] === ERROR$1 && flight[2] ? normalizeError$1(route, result[1]) : result;
				}),
				controller,
				1
			];
			(router._flights ??= /* @__PURE__ */ new Map()).set(match.id, flight);
		}
		match._flight = flight;
		match.abortController = flight[1];
		return materializeRedirect$1(router, lane, route, await waitFor$1(flight[0], signal), options);
	} catch (cause) {
		if (cause !== signal || !signal.aborted) throw cause;
		releaseFlight(router, match);
		return CANCELED_OUTCOME;
	} finally {
		setFetching(router, match, false, owner);
	}
}
function settleInto(match, result, preload) {
	if (result[0] === REDIRECTED$1) return;
	match.status = "success";
	match.error = void 0;
	if (result[0] === SUCCESS$1) {
		match.loaderData = result[1];
		match.invalid = false;
		match.updatedAt = Date.now();
		match.preload = preload;
	} else match.invalid = true;
}
function cacheLoaderMatch(router, match, planned) {
	const current = router._cache.get(match.id);
	if (current !== planned || router._committed.some((candidate) => candidate.id === match.id && candidate._flight === match._flight)) return;
	const cached = {
		...match,
		_notFound: void 0,
		context: {}
	};
	if (cached._flight) cached._flight[2]++;
	router._cache.set(match.id, cached);
	if (current) releaseFlight(router, current);
}
function getParentSnapshot(match, outcome) {
	if (outcome[0] === ERROR$1 || outcome[0] === NOT_FOUND$1) return {
		...match,
		status: outcome[0] === ERROR$1 ? "error" : "notFound",
		error: outcome[1],
		_flight: void 0
	};
	return match;
}
function createLoaderTask$1(router, lane, index, tasks, semanticParent, options, retainedEnd) {
	const match = lane[1][index];
	const route = getRoute$1(router, match);
	const preload = !!options[3];
	const plannedCacheMatch = router._cache.get(match.id);
	let configured;
	let reload = false;
	let reloadFailure;
	try {
		if (match.status === "success") {
			configured = route.options.shouldReload;
			if (typeof configured === "function") configured = configured(getLoaderContext$1(router, lane, match, route, options[0], semanticParent, preload));
			if (options[0].signal.aborted) reloadFailure = CANCELED_OUTCOME;
		}
		if (!reloadFailure) {
			if (match.status !== "success") reload = true;
			else {
				const staleAge = preload || match.preload ? route.options.preloadStaleTime ?? router.options.defaultPreloadStaleTime ?? 3e4 : route.options.staleTime ?? router.options.defaultStaleTime ?? 0;
				reload = !!(match.invalid || configured || configured === void 0 && Date.now() - match.updatedAt >= staleAge && (options[5] || match.cause === "enter" || options[2].some((candidate) => candidate.routeId === match.routeId && candidate.id !== match.id)));
			}
		}
	} catch (cause) {
		match.invalid = true;
		releaseFlight(router, match);
		reloadFailure = normalizeLaneError(router, lane, route, cause, options);
	}
	const routeLoader = route.options.loader;
	const isLoaderFn = typeof routeLoader === "function";
	const loader = isLoaderFn ? routeLoader : routeLoader?.handler;
	const preloadable = !preload || route.options.preload !== false;
	let donor = preloadable && routeLoader && true ? router._flights?.get(match.id) : void 0;
	if (donor === match._flight || reloadFailure) donor = void 0;
	else if (donor && !reload && !preload && configured === void 0) reload = true;
	else if (!reload) donor = void 0;
	const background = !!(routeLoader && reload && match.status === "success" && !preload && !options[4] && ((isLoaderFn ? void 0 : routeLoader.staleReloadMode) ?? router.options.defaultStaleReloadMode) !== "blocking");
	const loaded = reload && preloadable;
	const blocking = loaded && !background && (match.status !== "success" || !!routeLoader);
	const onReady = index >= retainedEnd ? options[7] : void 0;
	const onLazyReady = route.lazyFn && route._lazy !== true ? onReady : void 0;
	if (loaded && !routeLoader) {
		match.invalid = false;
		match.updatedAt = Date.now();
	}
	if (donor) donor[2]++;
	if (blocking) {
		const acceptedFlight = match._flight;
		match._flight = donor;
		releaseOwnedFlight(router, match, acceptedFlight)?.abort();
		if (index >= retainedEnd) match.status = "pending";
		onReady?.();
	}
	if (!loaded) match.isFetching = false;
	const outcome = !reloadFailure && blocking ? loadResource(router, lane, match, route, loader, semanticParent, options).then((result) => {
		settleInto(match, result, preload);
		if (result[0] === SUCCESS$1) {
			if (routeLoader && !options[0].signal.aborted) cacheLoaderMatch(router, match, plannedCacheMatch);
			if (index >= retainedEnd) match.status = "pending";
		}
		return result;
	}) : Promise.resolve(reloadFailure ?? [SUCCESS$1, match.loaderData]);
	const chunkFailure = (async () => {
		try {
			const chunk = loadRouteChunk(route, void 0, onLazyReady);
			if (chunk) await waitFor$1(chunk, options[0].signal);
		} catch (cause) {
			if (!lane[1].some((candidate, candidateIndex) => candidateIndex <= index && (candidate.status === "error" || candidate.status === "notFound" || candidate._notFound))) return [index, normalizeLaneError(router, lane, route, cause, options)];
		}
		const result = await outcome;
		if (blocking && result[0] === SUCCESS$1 && match.status === "pending" && !options[0].signal.aborted) {
			match.status = "success";
			onReady?.();
		}
	})();
	tasks.push([
		index,
		outcome,
		chunkFailure
	]);
	if (!background) return outcome.then((result) => getParentSnapshot(match, result));
	const candidate = {
		...match,
		status: "pending",
		preload: false,
		_flight: donor
	};
	match.invalid = false;
	match.isFetching = "loader";
	const backgroundOutcome = loadResource(router, lane, candidate, route, loader, semanticParent, options).then((result) => {
		match.isFetching = false;
		settleInto(candidate, result, false);
		return result;
	});
	(lane[2] ??= []).push([
		index,
		backgroundOutcome,
		chunkFailure,
		candidate
	]);
	return backgroundOutcome.then((result) => getParentSnapshot(candidate, result));
}
async function getNotFoundBoundary$1(router, matches, indexed, signal, fallback = 0) {
	const cause = indexed?.[1][1];
	let index = cause?.routeId ? matches.findIndex((match) => match.routeId === cause.routeId) : indexed?.[0] ?? matches.length - 1;
	if (index < 0) index = 0;
	for (let i = index; i >= 0; i--) {
		const route = getRoute$1(router, matches[i]);
		try {
			const loading = loadRouteChunk(route, false);
			if (loading) await waitFor$1(loading, signal);
		} catch (cause) {
			if (cause === signal && signal.aborted) throw cause;
		}
		if (route.options.notFoundComponent) return i;
	}
	return cause?.routeId ? index : fallback;
}
function discardBackground(router, lane) {
	if (lane[2]) {
		transferMatchResources(router, lane[2].map((task) => task[3]));
		lane[2] = void 0;
	}
}
async function settleTasks(tasks, serialFailure, redirectTasks, gate) {
	let loaderFailure;
	try {
		await Promise.all(tasks.map((task) => task[1].then(async (outcome) => {
			const taskIndex = task[0];
			if (gate && taskIndex >= await gate) return;
			if (outcome[0] >= REDIRECTED$1) throw [taskIndex, outcome];
			if (!loaderFailure && outcome[0] !== SUCCESS$1) {
				loaderFailure = [taskIndex, outcome];
				await Promise.all((redirectTasks ?? []).map((nextTask) => {
					if (nextTask[0] <= taskIndex) return;
					return nextTask[1].then((nextOutcome) => {
						if (nextOutcome[0] === REDIRECTED$1) throw [nextTask[0], nextOutcome];
					});
				}));
			}
		})));
	} catch (cause) {
		return cause;
	}
	return serialFailure ?? loaderFailure;
}
function materializeRedirect$1(router, lane, route, outcome, options, failed) {
	while (outcome[0] === REDIRECTED$1) {
		const redirect = outcome[1];
		const redirectOptions = redirect.options;
		try {
			if (redirectOptions.href || redirect.headers.has("Location")) {
				router.resolveRedirect(redirect);
				if (redirectOptions.reloadDocument) return outcome;
			}
			if (redirectOptions.reloadDocument ? options[3] : options[1] >= 20) return outcome;
			const location = router.buildLocation({
				...redirectOptions,
				_fromLocation: lane[0],
				_includeValidateSearch: true
			});
			const publicLocation = location.maskedLocation ?? location;
			if (publicLocation.external) {
				const resolved = redirect.clone();
				resolved.options = { ...redirectOptions };
				resolved.headers.set("Location", publicLocation.publicHref);
				router.resolveRedirect(resolved);
				return options[3] ? [REDIRECTED$1, resolved] : [
					REDIRECTED$1,
					resolved,
					publicLocation
				];
			}
			return [
				REDIRECTED$1,
				redirect,
				location
			];
		} catch (cause) {
			outcome = failed ? [ERROR$1, cause] : normalizeError$1(route, cause);
			failed = true;
		}
	}
	return outcome;
}
async function reduceLane(router, lane, tasks, controller, settlement, onReady) {
	const matches = lane[1];
	let failure = await settlement;
	let redirectLimitExceeded = false;
	const plannedBoundary = matches.findIndex((match) => match._notFound);
	const boundaryOf = (found) => found[1][0] === NOT_FOUND$1 ? getNotFoundBoundary$1(router, matches, found, controller.signal) : found[0];
	let readinessEnd = plannedBoundary < 0 ? matches.length : plannedBoundary;
	if ((failure?.[1][0] ?? 0) >= REDIRECTED$1) readinessEnd = 0;
	else if (failure) {
		readinessEnd = failure[2] ??= await boundaryOf(failure);
		for (const task of tasks) {
			if (task[0] >= readinessEnd) break;
			const outcome = await task[1];
			if (outcome[0] !== SUCCESS$1 && outcome[0] < REDIRECTED$1 && !("loaderData" in matches[task[0]])) {
				failure = [task[0], outcome];
				readinessEnd = failure[2] = await boundaryOf(failure);
				break;
			}
		}
	}
	for (const task of tasks) {
		if (task[0] >= readinessEnd) break;
		const chunkFailure = await task[2];
		if (!chunkFailure) continue;
		failure = chunkFailure;
		break;
	}
	if ((failure?.[1][0] ?? 0) >= REDIRECTED$1) {
		const outcome = failure[1];
		if (outcome[0] !== REDIRECTED$1 || outcome[1].options.reloadDocument || outcome[2]) {
			discardBackground(router, lane);
			return outcome;
		}
		redirectLimitExceeded = true;
		failure = [0, [ERROR$1, /* @__PURE__ */ new Error("Too many redirects")]];
	}
	const boundary = failure ? failure[2] ?? await boundaryOf(failure) : plannedBoundary;
	if (boundary >= 0) {
		const outcome = failure?.[1];
		const kind = outcome?.[0];
		const match = matches[boundary];
		const cause = outcome?.[1];
		const install = () => {
			if (outcome) {
				match._notFound = void 0;
				if (kind === ERROR$1) match.status = "error";
				else {
					cause.routeId = match.routeId;
					if (match.routeId === router.routeTree.id) {
						match.status = "success";
						match._notFound = true;
					} else match.status = "notFound";
				}
				match.error = cause;
				match.isFetching = false;
			}
		};
		install();
		if (!outcome) onReady?.();
		const route = getRoute$1(router, match);
		try {
			await waitFor$1(outcome ? Promise.resolve().then(() => loadRouteChunk(route, kind === ERROR$1 ? "errorComponent" : "notFoundComponent")) : Promise.all([loadRouteChunk(route), loadRouteChunk(route, "notFoundComponent")]), controller.signal);
		} catch (cause) {
			if (cause === controller.signal && controller.signal.aborted) {
				discardBackground(router, lane);
				return CANCELED_OUTCOME;
			}
		}
		if (!outcome) match.status = "success";
		else if (redirectLimitExceeded) {
			controller.abort();
			await Promise.all([
				...tasks.map((task) => task[1]),
				...tasks.map((task) => task[2]),
				...(lane[2] ?? []).map((task) => task[1])
			]);
			discardBackground(router, lane);
			transferMatchResources(router, matches);
			install();
		}
	}
	return lane;
}
async function projectLane$1(router, lane, signal, start = 0, end = lane[1].length) {
	const matches = lane[1];
	for (let index = start; index < end; index++) {
		const match = matches[index];
		const routeOptions = getRoute$1(router, match).options;
		if (routeOptions.head || routeOptions.scripts) try {
			const context = {
				ssr: router.options.ssr,
				matches,
				match,
				params: match.params,
				loaderData: match.loaderData
			};
			const [head, scripts] = await waitFor$1(Promise.all([routeOptions.head?.(context), routeOptions.scripts?.(context)]), signal);
			match.meta = head?.meta;
			match.links = head?.links;
			match.headScripts = head?.scripts;
			match.styles = head?.styles;
			match.scripts = scripts;
		} catch (cause) {
			if (cause === signal && signal.aborted) break;
			console.error(cause);
		}
		if (match.status !== "success" || match._notFound) break;
	}
	return lane;
}
async function executeClientLane(router, location, matches, options) {
	const matched = [location, matches];
	const signal = options[0].signal;
	let reduced;
	try {
		const presented = router.stores.matches.get();
		let plannedBoundary = matches.findIndex((match) => match._notFound);
		if (router.options.notFoundMode !== "root" && plannedBoundary >= 0) {
			const boundary = await getNotFoundBoundary$1(router, matches, void 0, signal, plannedBoundary);
			matches[plannedBoundary]._notFound = void 0;
			matches[boundary]._notFound = true;
			plannedBoundary = boundary;
		}
		let end = plannedBoundary < 0 ? matches.length : plannedBoundary + 1;
		let retainedEnd = 0;
		while (retainedEnd < end && retainedEnd !== plannedBoundary) {
			const match = matches[retainedEnd];
			const committed = options[2][retainedEnd];
			const visible = presented[retainedEnd];
			if (committed?.id !== match.id || committed.status !== "success" || match.preload || visible?.id !== match.id || visible.status !== "success") break;
			retainedEnd++;
			if (committed._notFound || visible._notFound) break;
		}
		const tasks = [];
		const start = options[6] ?? 0;
		let semanticParent = start ? Promise.resolve(matches[start - 1]) : void 0;
		const planSuccessfulLane = () => {
			for (let index = start; index < end; index++) {
				if (signal.aborted) break;
				semanticParent = createLoaderTask$1(router, matched, index, tasks, semanticParent, options, retainedEnd);
			}
		};
		const failure = await contextualize$1(router, matched, options, end, planSuccessfulLane, retainedEnd);
		if (failure) {
			options[4] = true;
			end = failure[0];
			if (failure[1][0] === NOT_FOUND$1) {
				const boundary = await getNotFoundBoundary$1(router, matches, failure, signal);
				failure[2] = boundary;
				end = Math.min(end, boundary + 1);
			} else if (failure[1][0] >= REDIRECTED$1) end = 0;
			planSuccessfulLane();
		}
		if (!signal.aborted && !options[3]) {
			const abort = [];
			for (const [id, flight] of router._flights ?? []) if (!flight[2]) {
				router._flights.delete(id);
				abort.push(flight[1]);
			}
			for (const controller of abort) controller.abort();
		}
		const reduction = reduceLane(router, matched, tasks, options[0], settleTasks(tasks, failure, matched[2]), options[7]);
		if (matched[2]?.length) matched[3] = settleTasks(matched[2], void 0, void 0, reduction.then((foreground) => isControl(foreground) ? 0 : _getRenderedMatches(matches).length, () => 0));
		reduced = await reduction;
	} catch (cause) {
		discardBackground(router, matched);
		if (cause === signal && signal.aborted) return CANCELED_OUTCOME;
		throw cause;
	}
	if (isControl(reduced)) return reduced;
	return projectLane$1(router, reduced, signal, options[6] === matches.length ? options[6] : 0);
}
async function preloadClientRoute(router, opts) {
	let location = router.buildLocation(opts);
	for (let redirects = 0;; redirects++) {
		const base = router._committed;
		const controller = new AbortController();
		let matches;
		let active;
		let result;
		try {
			try {
				matches = router.matchRoutes(location, { _controller: controller });
				acquireMatchResources(matches);
				active = (router._preloads ??= /* @__PURE__ */ new Map()).set(controller, matches);
				result = await executeClientLane(router, location, matches, [
					controller,
					redirects,
					base,
					true
				]);
			} finally {
				if (active) {
					active = active.delete(controller);
					transferMatchResources(router, matches);
				}
				controller.abort();
			}
			if (!isControl(result)) return result[1];
			if (!active || result.length < 3 || false) return;
			location = result[2];
		} catch (cause) {
			if (!isNotFound(cause)) console.error(cause);
			return;
		}
	}
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/await-signal.js
function observeLate(callback, value) {
	if (!callback) return;
	try {
		const result = callback(value);
		if (result !== void 0) Promise.resolve(result).catch(() => {});
	} catch {}
}
/**
* Await `value` unless `signal` aborts first. A result that settles after the
* abort is passed to `onLate` / `onLateError` instead.
*
* One abort listener per wait: SSR requests nest at most a few waits on one
* signal, so pooling them was measurably slower than this.
*/
function waitForReason(value, signal, onLate, onLateError) {
	const promise = Promise.resolve(value);
	if (signal.aborted) {
		promise.then((result) => observeLate(onLate, result), (error) => observeLate(onLateError, error));
		return Promise.reject(signal.reason);
	}
	return new Promise((resolve, reject) => {
		const abort = () => reject(signal.reason);
		signal.addEventListener("abort", abort, { once: true });
		promise.then((result) => {
			signal.removeEventListener("abort", abort);
			if (signal.aborted) observeLate(onLate, result);
			else resolve(result);
		}, (error) => {
			signal.removeEventListener("abort", abort);
			if (signal.aborted) observeLate(onLateError, error);
			else reject(error);
		});
	});
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/load-server.js
var SUCCESS = 0;
var ERROR = 1;
var NOT_FOUND = 2;
var REDIRECTED = 3;
var SKIPPED = 4;
var MATCH_SETTLED_ABORT_REASON = Object.freeze({
	name: "AbortError",
	message: "TanStack Router aborted this server match because it settled."
});
var REDIRECT_ABORT_REASON = Object.freeze({
	name: "AbortError",
	message: "TanStack Router aborted this server match because of a redirect."
});
function getRoute(router, match) {
	return router.routesById[match.routeId];
}
function normalize(value, rejected) {
	if (isRedirect(value)) return [REDIRECTED, value];
	if (isNotFound(value)) return [NOT_FOUND, value];
	if (rejected && typeof value?.then === "function") value = new Error("A Promise was thrown", { cause: value });
	return rejected ? [ERROR, value] : [SUCCESS, value];
}
function normalizeError(router, lane, route, cause, signal, notify = true) {
	signal?.throwIfAborted();
	let outcome = normalize(cause, true);
	if (outcome[0] !== ERROR) return materializeRedirect(router, lane, route, outcome, signal, notify);
	try {
		route.options.onError?.(outcome[1]);
	} catch (onErrorCause) {
		outcome = normalize(onErrorCause, true);
	}
	signal?.throwIfAborted();
	return materializeRedirect(router, lane, route, outcome, signal, notify);
}
function materializeRedirect(router, lane, route, outcome, signal, notify = true) {
	if (outcome[0] !== REDIRECTED) return outcome;
	signal?.throwIfAborted();
	try {
		outcome[1].options._fromLocation = lane.location;
		router.resolveRedirect(outcome[1]);
		signal?.throwIfAborted();
		return outcome;
	} catch (cause) {
		signal?.throwIfAborted();
		return notify ? normalizeError(router, lane, route, cause, signal, false) : [ERROR, cause];
	}
}
function maybe(value, cause) {
	if (cause !== void 0) return {
		status: "error",
		error: cause
	};
	return {
		status: "success",
		value
	};
}
function navigateFrom(router, location) {
	return (options) => router.navigate({
		...options,
		_fromLocation: location
	});
}
function waitFor(value, signal) {
	return signal ? waitForReason(value, signal) : value;
}
function resolveSsr(router, lane, index) {
	const match = lane.matches[index];
	const route = getRoute(router, match);
	const parentSsr = lane.matches[index - 1]?.ssr;
	if (router.isShell()) return route.id === rootRouteId;
	if (parentSsr === false) return false;
	const inherit = (value) => {
		return value === true && parentSsr === "data-only" ? "data-only" : value;
	};
	const defaultSsr = router.options.defaultSsr ?? true;
	const inheritedDefault = inherit(defaultSsr);
	match.ssr = inheritedDefault;
	const option = route.options.ssr;
	if (option === void 0) return inheritedDefault;
	if (typeof option !== "function") return inherit(option);
	const context = {
		search: maybe(match.search, match.searchError),
		params: maybe(match.params, match.paramsError),
		location: lane.location,
		matches: lane.matches.map((candidate) => ({
			index: candidate.index,
			pathname: candidate.pathname,
			fullPath: candidate.fullPath,
			staticData: candidate.staticData,
			id: candidate.id,
			routeId: candidate.routeId,
			search: maybe(candidate.search, candidate.searchError),
			params: maybe(candidate.params, candidate.paramsError),
			ssr: candidate.ssr
		}))
	};
	try {
		return Promise.resolve(option(context)).then((value) => inherit(value ?? defaultSsr));
	} catch (cause) {
		return Promise.reject(cause);
	}
}
function stampNotFound(match, outcome) {
	if (outcome[0] === NOT_FOUND && !outcome[1].routeId) outcome[1].routeId = match.routeId;
	return outcome;
}
async function contextualize(router, lane, signal) {
	const globalBoundary = lane.matches.findIndex((match) => match._notFound);
	let end = globalBoundary < 0 ? lane.matches.length : globalBoundary + 1;
	let failure;
	let parentContext = { ...router.options.context ?? {} };
	for (let index = 0; index < end; index++) {
		const match = lane.matches[index];
		const route = getRoute(router, match);
		try {
			const ssr = resolveSsr(router, lane, index);
			match.ssr = ssr instanceof Promise ? await ssr : ssr;
		} catch (cause) {
			signal?.throwIfAborted();
			failure = [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
			end = index;
		}
		signal?.throwIfAborted();
		if (failure?.[1][0] === REDIRECTED) break;
		match.__beforeLoadContext = void 0;
		let context = parentContext;
		try {
			let routeContext;
			if (route.options.context) {
				const routeContextOptions = {
					deps: match.loaderDeps,
					params: match.params,
					context: parentContext,
					location: lane.location,
					navigate: navigateFrom(router, lane.location),
					buildLocation: router.buildLocation,
					cause: match.cause,
					abortController: match.abortController,
					preload: false,
					matches: lane.matches,
					routeId: route.id
				};
				routeContext = route.options.context(routeContextOptions) ?? void 0;
			}
			context = {
				...parentContext,
				...routeContext
			};
			match.context = context;
		} catch (cause) {
			signal?.throwIfAborted();
			if (!failure) failure = [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
			end = index;
			break;
		}
		signal?.throwIfAborted();
		if (failure) break;
		const validationError = match.paramsError ?? match.searchError;
		if (validationError !== void 0) {
			failure = [index, stampNotFound(match, normalizeError(router, lane, route, validationError, signal))];
			end = index;
			break;
		}
		signal?.throwIfAborted();
		if (match.ssr === false || !route.options.beforeLoad) {
			parentContext = context;
			continue;
		}
		const abortController = match.abortController;
		const options = {
			search: match.search,
			abortController,
			params: match.params,
			preload: false,
			context,
			location: lane.location,
			navigate: navigateFrom(router, lane.location),
			buildLocation: router.buildLocation,
			cause: match.cause,
			matches: lane.matches,
			routeId: route.id,
			...router.options.additionalContext
		};
		try {
			const beforeLoadContext = await route.options.beforeLoad(options);
			signal?.throwIfAborted();
			const outcome = stampNotFound(match, materializeRedirect(router, lane, route, normalize(beforeLoadContext, false), signal));
			if (outcome[0] !== SUCCESS) {
				failure = [index, outcome];
				end = index;
				break;
			}
			match.__beforeLoadContext = beforeLoadContext;
			match.context = {
				...context,
				...beforeLoadContext
			};
			parentContext = match.context;
		} catch (cause) {
			signal?.throwIfAborted();
			failure = [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
			end = index;
			break;
		}
	}
	return {
		location: lane.location,
		matches: lane.matches,
		end,
		failure
	};
}
function getLoaderContext(router, lane, match, route, index, tasks) {
	return {
		params: match.params,
		deps: match.loaderDeps,
		preload: false,
		parentMatchPromise: tasks[index - 1]?.match,
		abortController: match.abortController,
		context: match.context,
		location: lane.location,
		navigate: navigateFrom(router, lane.location),
		cause: match.cause,
		route,
		...router.options.additionalContext
	};
}
function createLoaderTask(router, lane, index, tasks, signal) {
	const match = lane.matches[index];
	const route = getRoute(router, match);
	let outcome;
	if (match.ssr === false) outcome = Promise.resolve([SKIPPED]);
	else {
		const routeLoader = route.options.loader;
		const loader = typeof routeLoader === "function" ? routeLoader : routeLoader?.handler;
		if (!loader) outcome = Promise.resolve([SUCCESS, void 0]);
		else outcome = Promise.resolve().then(() => loader(getLoaderContext(router, lane, match, route, index, tasks))).then((result) => normalize(result, false), (cause) => normalize(cause, true)).then((result) => {
			if (signal?.aborted || match.abortController.signal.reason === REDIRECT_ABORT_REASON) return [SKIPPED];
			if (result[0] === ERROR) result = normalizeError(router, lane, route, result[1], signal);
			else result = materializeRedirect(router, lane, route, result, signal);
			return stampNotFound(match, result);
		});
	}
	const parentMatch = outcome.then((result) => {
		const snapshot = { ...match };
		if (result[0] === SUCCESS) {
			snapshot.loaderData = result[1];
			snapshot.status = "success";
			snapshot.error = void 0;
			snapshot.invalid = false;
			snapshot.isFetching = false;
		} else if (result[0] === ERROR) {
			snapshot.status = "error";
			snapshot.error = result[1];
		} else if (result[0] === NOT_FOUND) {
			snapshot.status = "notFound";
			snapshot.error = result[1];
		}
		return snapshot;
	});
	return {
		index,
		outcome,
		match: parentMatch
	};
}
async function getNotFoundBoundary(router, matches, indexed, signal, fallback = 0) {
	const cause = indexed?.[1][1];
	let index = cause?.routeId ? matches.findIndex((match) => match.routeId === cause.routeId) : indexed?.[0] ?? matches.length - 1;
	if (index < 0) index = 0;
	for (let candidate = index; candidate >= 0; candidate--) {
		const route = getRoute(router, matches[candidate]);
		try {
			const loading = loadRouteChunk(route, false);
			if (loading) await loading;
		} catch {
			signal?.throwIfAborted();
		}
		signal?.throwIfAborted();
		if (route.options.notFoundComponent) return candidate;
	}
	return cause?.routeId ? index : fallback;
}
function abortMatches(matches, start = 0, reason = MATCH_SETTLED_ABORT_REASON) {
	for (let index = start; index < matches.length; index++) matches[index].abortController.abort(reason);
}
async function applyFailure(router, lane, indexed, signal) {
	if (!indexed) {
		const boundary = lane.matches.findIndex((match) => match._notFound);
		if (boundary >= 0) {
			abortMatches(lane.matches, boundary + 1);
			return {
				status: 404,
				boundary,
				kind: NOT_FOUND
			};
		}
		return { status: 200 };
	}
	const [index, outcome] = indexed;
	if (outcome[0] === ERROR) {
		const match = lane.matches[index];
		match._notFound = void 0;
		match.status = "error";
		match.error = outcome[1];
		match.isFetching = false;
		abortMatches(lane.matches, index + 1);
		return {
			status: 500,
			boundary: index,
			kind: ERROR
		};
	}
	const boundary = indexed[2] ?? await getNotFoundBoundary(router, lane.matches, indexed, signal);
	const match = lane.matches[boundary];
	const cause = outcome[1];
	cause.routeId = match.routeId;
	match._notFound = void 0;
	if (match.routeId === router.routeTree.id) {
		match.status = "success";
		match._notFound = true;
		match.error = cause;
	} else {
		match.status = "notFound";
		match.error = cause;
	}
	match.isFetching = false;
	abortMatches(lane.matches, boundary + 1);
	return {
		status: 404,
		boundary,
		kind: NOT_FOUND
	};
}
async function loadNormalChunks(router, lane, end, signal) {
	const chunks = [];
	for (let index = 0; index < lane.matches.length; index++) {
		const match = lane.matches[index];
		if (index >= end || match.ssr !== true || match.status !== "success") continue;
		const route = getRoute(router, match);
		try {
			const loading = loadRouteChunk(route);
			if (loading) {
				const chunk = loading.then(() => {
					signal?.throwIfAborted();
				}, (cause) => {
					signal?.throwIfAborted();
					return [index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))];
				});
				chunk.catch(() => {});
				chunks.push(chunk);
			}
		} catch (cause) {
			signal?.throwIfAborted();
			chunks.push([index, stampNotFound(match, normalizeError(router, lane, route, cause, signal))]);
		}
	}
	for (const chunk of chunks) {
		const indexed = Array.isArray(chunk) ? chunk : await chunk;
		if (indexed) return indexed;
	}
}
async function projectLane(router, lane, signal) {
	for (const match of lane.matches) {
		const routeOptions = getRoute(router, match).options;
		if (routeOptions.head || routeOptions.scripts || routeOptions.headers) {
			const context = {
				ssr: router.options.ssr,
				matches: lane.matches,
				match,
				params: match.params,
				loaderData: match.loaderData
			};
			try {
				const [head, scripts, headers] = await Promise.all([
					routeOptions.head?.(context),
					routeOptions.scripts?.(context),
					routeOptions.headers?.(context)
				]);
				signal?.throwIfAborted();
				match.meta = head?.meta;
				match.links = head?.links;
				match.headScripts = head?.scripts;
				match.styles = head?.styles;
				match.scripts = scripts;
				match.headers = headers;
			} catch (cause) {
				signal?.throwIfAborted();
				console.error(cause);
			}
		}
		if (match.ssr === false || match.status !== "success" || match._notFound) break;
	}
}
async function executeServerLane(router, location, matchedMatches, signal) {
	const matched = {
		location,
		matches: matchedMatches.map((match) => ({
			...match,
			__beforeLoadContext: void 0,
			context: {},
			isFetching: false,
			abortController: new AbortController()
		}))
	};
	const abortLane = () => abortMatches(matched.matches, 0, signal?.reason ?? MATCH_SETTLED_ABORT_REASON);
	if (signal?.aborted) {
		abortLane();
		signal.throwIfAborted();
	}
	signal?.addEventListener("abort", abortLane, { once: true });
	try {
		const plannedGlobalBoundary = matched.matches.findIndex((match) => match._notFound);
		if (router.options.notFoundMode !== "root" && plannedGlobalBoundary >= 0) {
			const boundary = await getNotFoundBoundary(router, matched.matches, void 0, signal, plannedGlobalBoundary);
			if (boundary !== plannedGlobalBoundary) {
				matched.matches[plannedGlobalBoundary]._notFound = void 0;
				matched.matches[boundary]._notFound = true;
			}
		}
		const lane = await contextualize(router, matched, signal);
		signal?.throwIfAborted();
		let loaderEnd = lane.end;
		if (lane.failure?.[1][0] === REDIRECTED) loaderEnd = 0;
		else if (lane.failure?.[1][0] === NOT_FOUND) {
			lane.failure[2] = await getNotFoundBoundary(router, lane.matches, lane.failure, signal);
			loaderEnd = Math.min(loaderEnd, lane.failure[2] + 1);
		}
		const tasks = [];
		for (let index = 0; index < loaderEnd; index++) {
			const task = createLoaderTask(router, lane, index, tasks, signal);
			tasks.push(task);
		}
		let loaderFailure;
		let control = lane.failure?.[1][0] === REDIRECTED ? lane.failure : void 0;
		try {
			await Promise.all(tasks.map((task) => task.outcome.then((loadedOutcome) => {
				const match = lane.matches[task.index];
				const outcome = loadedOutcome;
				if (outcome[0] === SUCCESS) {
					match.loaderData = outcome[1];
					match.status = "success";
					match.error = void 0;
					match.invalid = false;
					match.isFetching = false;
					match.updatedAt = Date.now();
				} else if (outcome[0] === REDIRECTED) {
					control = [task.index, outcome];
					throw control;
				} else {
					if (match.ssr !== false) {
						match.status = "success";
						match.error = void 0;
						match.invalid = true;
						match.isFetching = false;
					}
					if (!loaderFailure && outcome[0] !== SKIPPED) loaderFailure = [task.index, outcome];
				}
			})));
		} catch (cause) {
			if (!Array.isArray(cause)) throw cause;
			control = cause;
		}
		signal?.throwIfAborted();
		if (control?.[1][0] === REDIRECTED) {
			abortMatches(lane.matches, 0, REDIRECT_ABORT_REASON);
			return {
				type: "redirect",
				redirect: control[1][1]
			};
		}
		let failure = lane.failure ?? loaderFailure;
		const plannedBoundary = lane.matches.findIndex((match) => match._notFound);
		let readinessEnd;
		if (failure) {
			const outcomeEnd = failure[2] ??= failure[1][0] === NOT_FOUND ? await getNotFoundBoundary(router, lane.matches, failure, signal) : failure[0];
			for (const task of tasks) {
				if (task.index >= outcomeEnd) break;
				const outcome = await task.outcome;
				if (outcome[0] !== SUCCESS && outcome[0] < REDIRECTED && !("loaderData" in lane.matches[task.index])) {
					failure = [task.index, outcome];
					failure[2] = outcome[0] === NOT_FOUND ? await getNotFoundBoundary(router, lane.matches, failure, signal) : task.index;
					break;
				}
			}
			readinessEnd = failure[2];
		} else readinessEnd = plannedBoundary < 0 ? lane.matches.length : plannedBoundary;
		const requiredFailure = await loadNormalChunks(router, lane, readinessEnd, signal);
		signal?.throwIfAborted();
		if (requiredFailure) {
			if (requiredFailure[1][0] === REDIRECTED) {
				abortMatches(lane.matches, 0, REDIRECT_ABORT_REASON);
				return {
					type: "redirect",
					redirect: requiredFailure[1][1]
				};
			}
			failure = requiredFailure;
		}
		const terminal = await applyFailure(router, lane, failure, signal);
		if (terminal.boundary !== void 0) {
			const match = lane.matches[terminal.boundary];
			if (match.ssr === true) {
				const route = getRoute(router, match);
				try {
					if (terminal.kind === ERROR) await loadRouteChunk(route, "errorComponent");
					else if (match._notFound) await Promise.all([loadRouteChunk(route), loadRouteChunk(route, "notFoundComponent")]);
					else await loadRouteChunk(route, "notFoundComponent");
				} catch {}
				signal?.throwIfAborted();
			}
		}
		signal?.throwIfAborted();
		await projectLane(router, {
			location: lane.location,
			matches: lane.matches
		}, signal);
		signal?.throwIfAborted();
		router.serverSsr?.onCleanup((settled) => {
			if (!settled) abortLane();
		});
		return {
			type: "render",
			status: terminal.status,
			matches: lane.matches
		};
	} finally {
		signal?.removeEventListener("abort", abortLane);
	}
}
async function loadServerRoute(router, opts) {
	if (!opts?._skipLocationUpdate) router.updateLatestLocation();
	const next = router.latestLocation;
	const previous = router._committed;
	const previousEnd = router._lifecycleEnd;
	let result;
	try {
		const canonical = router.buildLocation({
			to: next.pathname,
			search: true,
			params: true,
			hash: true,
			state: true,
			_includeValidateSearch: true
		});
		if (next.publicHref !== canonical.publicHref) throw redirect({ href: canonical.publicHref || "/" });
		const changeInfo = getLocationChangeInfo(next, router.stores.resolvedLocation.get());
		router.emit({
			type: "onBeforeNavigate",
			...changeInfo
		});
		router.emit({
			type: "onBeforeLoad",
			...changeInfo
		});
		opts?._signal?.throwIfAborted();
		result = await waitFor(executeServerLane(router, next, router.matchRoutes(next), opts?._signal), opts?._signal);
		opts?._signal?.throwIfAborted();
	} catch (cause) {
		opts?._signal?.throwIfAborted();
		if (!isRedirect(cause)) throw cause;
		cause.options._fromLocation = next;
		result = {
			type: "redirect",
			redirect: router.resolveRedirect(cause)
		};
	}
	router._serverResult = result;
	let nextEnd = 0;
	router.batch(() => {
		router.stores.location.set(next);
		router.stores.status.set("idle");
		if (result.type === "render") {
			router._committed = result.matches;
			nextEnd = router._lifecycleEnd = lifecycleEnd(result.matches);
			router.stores.setMatches(result.matches);
			router.stores.resolvedLocation.set(next);
		}
	});
	if (result.type === "render") runRouteLifecycle(router, previous, result.matches, previousEnd, nextEnd);
	router._commitPromise?.resolve();
	router._commitPromise = void 0;
}
// ../../node_modules/.pnpm/react@19.3.1/node_modules/react/cjs/react-jsx-runtime.production.js
/**
* @license React
* react-jsx-runtime.production.js
*
* Copyright (c) Meta Platforms, Inc. and affiliates.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/
var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
	var REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element");
	var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
	function jsxProd(type, config, maybeKey) {
		var key = null;
		void 0 !== maybeKey && (key = "" + maybeKey);
		void 0 !== config.key && (key = "" + config.key);
		if ("key" in config) {
			maybeKey = {};
			for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
		} else maybeKey = config;
		config = maybeKey.ref;
		return {
			$$typeof: REACT_ELEMENT_TYPE,
			type,
			key,
			ref: void 0 !== config ? config : null,
			props: maybeKey
		};
	}
	exports.Fragment = REACT_FRAGMENT_TYPE;
	exports.jsx = jsxProd;
	exports.jsxs = jsxProd;
}));
// ../../node_modules/.pnpm/react@19.3.1/node_modules/react/jsx-runtime.js
var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_react_jsx_runtime_production();
}));
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/routerContext.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var routerContext = import_react.createContext(null);
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useRouter.js
/**
* Access the current TanStack Router instance from React context.
* Must be used within a `RouterProvider`.
*
* Options:
* - `warn`: Log a warning if no router context is found (default: true).
*
* @returns The registered router instance.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useRouterHook
*/
function useRouter(opts) {
	const value = import_react.useContext(routerContext);
	if (!value);
	return value;
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/matchContext.js
function createLinkScope(router, routeId) {
	const store = router.stores.location;
	const listeners = /* @__PURE__ */ new Set();
	let source;
	let unsubscribe;
	const update = (location) => {
		if (!_isRouteDeparting(router, routeId, location)) {
			source = location;
			listeners.forEach((listener) => listener());
		}
	};
	return [() => source ?? store.get(), (listener) => {
		if (!listeners.size) {
			source = store.get();
			unsubscribe = store.subscribe(update).unsubscribe;
		}
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
			if (!listeners.size) {
				unsubscribe();
				source = void 0;
			}
		};
	}];
}
var matchContext = import_react.createContext(void 0);
var dummyMatchContext = import_react.createContext(void 0);
export { isModuleNotFoundError as A, decodePath as C, getUrlScheme as D, functionalUpdate as E, rootRouteId as F, isNotFound as I, require_react as L, replaceEqualDeep as M, isRedirect as N, hasKeys as O, redirect as P, trimPathRight as S, escapeHtml as T, invariant as _, routerContext as a, removeTrailingSlash as b, _getAssetMatches as c, getLocationChangeInfo as d, createServerHistory as f, storageKey as g, defaultGetScrollRestorationKey as h, useRouter as i, isPromise as j, isDangerousProtocol as k, _getRenderedMatches as l, createNonReactiveReadonlyStore as m, dummyMatchContext as n, require_jsx_runtime as o, createNonReactiveMutableStore as p, matchContext as r, waitForReason as s, createLinkScope as t, RouterCore as u, createSieveCache as v, deepEqual as w, trimPathLeft as x, cleanPath as y };
