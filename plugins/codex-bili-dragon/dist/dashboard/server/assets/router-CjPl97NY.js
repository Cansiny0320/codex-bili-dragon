import { i as __toESM, n as __exportAll } from "./rolldown-runtime-DYf_mQCB.js";
import { A as isModuleNotFoundError, F as rootRouteId, L as require_react, P as redirect, S as trimPathRight, T as escapeHtml, _ as invariant, c as _getAssetMatches, i as useRouter, m as createNonReactiveReadonlyStore, n as dummyMatchContext, o as require_jsx_runtime, p as createNonReactiveMutableStore, r as matchContext, u as RouterCore, x as trimPathLeft, y as cleanPath } from "./matchContext-Bm7-ArXH.js";
import { n as reactUse } from "./useSelector-BCP1FA1M.js";
import { E as DashboardProvider, O as useDashboard, j as Link, n as Button, t as createLucideIcon } from "./createLucideIcon-BmtKeUIw.js";
import { a as getAssetCrossOrigin, i as appendUniqueUserTags, n as Outlet, o as getScriptPreloadAttrs, r as useHydrated, s as resolveManifestCssLink } from "../server.js";
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/ssr/bodyScripts.js
function getSsrBodyScriptParts(matches, manifest, nonce, routeScriptAttrs) {
	const assetMatches = _getAssetMatches(matches);
	const routeScripts = [];
	const manifestScripts = [];
	for (const match of assetMatches) for (const script of Array.isArray(match.scripts) ? match.scripts : []) {
		if (!script) continue;
		const { children, ...attrs } = script;
		routeScripts.push({
			tag: "script",
			attrs: {
				...attrs,
				...routeScriptAttrs,
				nonce
			},
			children
		});
	}
	if (manifest) for (const match of assetMatches) for (const asset of manifest.routes[match.routeId]?.scripts ?? []) manifestScripts.push({
		tag: "script",
		attrs: {
			...asset.attrs,
			nonce
		},
		children: asset.children
	});
	return [routeScripts, manifestScripts];
}
function composeSsrBodyScripts([routeScripts, manifestScripts], initialHydrationScripts) {
	if (!initialHydrationScripts) return [...routeScripts, ...manifestScripts];
	return [
		...initialHydrationScripts.before,
		...routeScripts,
		...manifestScripts,
		initialHydrationScripts.boundary
	];
}
// ../../node_modules/.pnpm/@tanstack+router-core@1.171.39/node_modules/@tanstack/router-core/dist/esm/route.js
var BaseRoute = class {
	get to() {
		return this._to;
	}
	get id() {
		return this._id;
	}
	get path() {
		return this._path;
	}
	get fullPath() {
		return this._fullPath;
	}
	constructor(options) {
		this.init = (originalIndex) => {
			this.originalIndex = originalIndex;
			this._branch = void 0;
			const options = this.options;
			const isRoot = !options?.path && !options?.id;
			this.parentRoute = this.options.getParentRoute?.();
			if (isRoot) this._path = rootRouteId;
			else if (!this.parentRoute) invariant();
			let path = isRoot ? rootRouteId : options?.path;
			if (path && path !== "/") path = trimPathLeft(path);
			const customId = options?.id || path;
			const id = isRoot ? rootRouteId : cleanPath((this.parentRoute.id === "__root__" ? "" : this.parentRoute.id) + "/" + (customId ?? ""));
			if (path === "__root__") path = "/";
			const fullPath = id === "__root__" ? "/" : path === void 0 ? this.parentRoute.fullPath : cleanPath(this.parentRoute.fullPath + "/" + path);
			this._path = path;
			this._id = id;
			this._fullPath = fullPath;
			this._to = trimPathRight(fullPath);
		};
		this.addChildren = (children) => {
			return this._addFileChildren(children);
		};
		this._addFileChildren = (children) => {
			if (Array.isArray(children)) this.children = children;
			if (typeof children === "object" && children !== null) this.children = Object.values(children);
			return this;
		};
		this._addFileTypes = () => {
			return this;
		};
		this.updateLoader = (options) => {
			Object.assign(this.options, options);
			return this;
		};
		this.update = (options) => {
			Object.assign(this.options, options);
			return this;
		};
		this.lazy = (lazyFn) => {
			this.lazyFn = lazyFn;
			return this;
		};
		this.redirect = (opts) => redirect({
			from: this.fullPath,
			...opts
		});
		this.options = options || {};
		this.isRoot = !options?.getParentRoute;
		if (options?.id && options?.path) throw new Error(`Route cannot have both an 'id' and a 'path' option.`);
	}
};
var BaseRootRoute = class extends BaseRoute {
	constructor(options) {
		super(options);
	}
};
// ../../node_modules/.pnpm/@tanstack+store@0.11.2/node_modules/@tanstack/store/dist/alien.js
/* @__NO_SIDE_EFFECTS__ */
function createReactiveSystem({ update, notify, unwatched }) {
	return {
		link,
		unlink,
		propagate,
		checkDirty,
		shallowPropagate
	};
	function link(dep, sub, version) {
		const prevDep = sub.depsTail;
		if (prevDep !== void 0 && prevDep.dep === dep) return;
		const nextDep = prevDep !== void 0 ? prevDep.nextDep : sub.deps;
		if (nextDep !== void 0 && nextDep.dep === dep) {
			nextDep.version = version;
			sub.depsTail = nextDep;
			return;
		}
		const prevSub = dep.subsTail;
		if (prevSub !== void 0 && prevSub.version === version && prevSub.sub === sub) return;
		const newLink = sub.depsTail = dep.subsTail = {
			version,
			dep,
			sub,
			prevDep,
			nextDep,
			prevSub,
			nextSub: void 0
		};
		if (nextDep !== void 0) nextDep.prevDep = newLink;
		if (prevDep !== void 0) prevDep.nextDep = newLink;
		else sub.deps = newLink;
		if (prevSub !== void 0) prevSub.nextSub = newLink;
		else dep.subs = newLink;
	}
	function unlink(link, sub = link.sub) {
		const dep = link.dep;
		const prevDep = link.prevDep;
		const nextDep = link.nextDep;
		const nextSub = link.nextSub;
		const prevSub = link.prevSub;
		if (nextDep !== void 0) nextDep.prevDep = prevDep;
		else sub.depsTail = prevDep;
		if (prevDep !== void 0) prevDep.nextDep = nextDep;
		else sub.deps = nextDep;
		if (nextSub !== void 0) nextSub.prevSub = prevSub;
		else dep.subsTail = prevSub;
		if (prevSub !== void 0) prevSub.nextSub = nextSub;
		else if ((dep.subs = nextSub) === void 0) unwatched(dep);
		return nextDep;
	}
	function propagate(link) {
		let next = link.nextSub;
		let stack;
		top: do {
			const sub = link.sub;
			let flags = sub.flags;
			if (!(flags & 60)) sub.flags = flags | 32;
			else if (!(flags & 12)) flags = 0;
			else if (!(flags & 4)) sub.flags = flags & -9 | 32;
			else if (!(flags & 48) && isValidLink(link, sub)) {
				sub.flags = flags | 40;
				flags &= 1;
			} else flags = 0;
			if (flags & 2) notify(sub);
			if (flags & 1) {
				const subSubs = sub.subs;
				if (subSubs !== void 0) {
					const nextSub = (link = subSubs).nextSub;
					if (nextSub !== void 0) {
						stack = {
							value: next,
							prev: stack
						};
						next = nextSub;
					}
					continue;
				}
			}
			if ((link = next) !== void 0) {
				next = link.nextSub;
				continue;
			}
			while (stack !== void 0) {
				link = stack.value;
				stack = stack.prev;
				if (link !== void 0) {
					next = link.nextSub;
					continue top;
				}
			}
			break;
		} while (true);
	}
	function checkDirty(link, sub) {
		let stack;
		let checkDepth = 0;
		let dirty = false;
		top: do {
			const dep = link.dep;
			const flags = dep.flags;
			if (sub.flags & 16) dirty = true;
			else if ((flags & 17) === 17) {
				if (update(dep)) {
					const subs = dep.subs;
					if (subs.nextSub !== void 0) shallowPropagate(subs);
					dirty = true;
				}
			} else if ((flags & 33) === 33) {
				if (link.nextSub !== void 0 || link.prevSub !== void 0) stack = {
					value: link,
					prev: stack
				};
				link = dep.deps;
				sub = dep;
				++checkDepth;
				continue;
			}
			if (!dirty) {
				const nextDep = link.nextDep;
				if (nextDep !== void 0) {
					link = nextDep;
					continue;
				}
			}
			while (checkDepth--) {
				const firstSub = sub.subs;
				const hasMultipleSubs = firstSub.nextSub !== void 0;
				if (hasMultipleSubs) {
					link = stack.value;
					stack = stack.prev;
				} else link = firstSub;
				if (dirty) {
					if (update(sub)) {
						if (hasMultipleSubs) shallowPropagate(firstSub);
						sub = link.sub;
						continue;
					}
					dirty = false;
				} else sub.flags &= -33;
				sub = link.sub;
				const nextDep = link.nextDep;
				if (nextDep !== void 0) {
					link = nextDep;
					continue top;
				}
			}
			return dirty;
		} while (true);
	}
	function shallowPropagate(link) {
		do {
			const sub = link.sub;
			const flags = sub.flags;
			if ((flags & 48) === 32) {
				sub.flags = flags | 16;
				if ((flags & 6) === 2) notify(sub);
			}
		} while ((link = link.nextSub) !== void 0);
	}
	function isValidLink(checkLink, sub) {
		let link = sub.depsTail;
		while (link !== void 0) {
			if (link === checkLink) return true;
			link = link.prevDep;
		}
		return false;
	}
}
var queuedEffects = [];
var { link, unlink, propagate, checkDirty, shallowPropagate } = /* @__PURE__ */ createReactiveSystem({
	update(atom) {
		return atom._update();
	},
	notify(effect) {
		queuedEffects[queuedEffectsLength++] = effect;
		effect.flags &= -3;
	},
	unwatched(atom) {
		if (atom.depsTail !== void 0) {
			atom.depsTail = void 0;
			atom.flags = 17;
			purgeDeps(atom);
		}
	}
});
var queuedEffectsLength = 0;
function purgeDeps(sub) {
	const depsTail = sub.depsTail;
	let dep = depsTail !== void 0 ? depsTail.nextDep : sub.deps;
	while (dep !== void 0) dep = unlink(dep, sub);
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useMatch.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* Read and select the nearest or targeted route match.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useMatchHook
*/
function useMatch(opts) {
	const router = useRouter();
	const nearestRouteId = import_react.useContext(opts.from ? dummyMatchContext : matchContext);
	const routeId = opts.from ?? nearestRouteId;
	const matchStore = router.stores.getMatchStore(routeId);
	{
		const match = matchStore.get();
		if (!match) {
			if (opts.shouldThrow ?? true) invariant();
			return;
		}
		return opts.select ? opts.select(match) : match;
	}
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useLoaderData.js
/**
* Read and select the current route's loader data with type‑safety.
*
* Options:
* - `from`/`strict`: Choose which route's data to read and strictness
* - `select`: Map the loader data to a derived value
* - `structuralSharing`: Enable structural sharing for stable references
*
* @returns The loader data (or selected value) for the matched route.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useLoaderDataHook
*/
function useLoaderData(opts) {
	return useMatch({
		from: opts.from,
		strict: opts.strict,
		structuralSharing: opts.structuralSharing,
		select: (match) => {
			return opts.select ? opts.select(match.loaderData) : match.loaderData;
		}
	});
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useLoaderDeps.js
/**
* Read and select the current route's loader dependencies object.
*
* Options:
* - `from`: Choose which route's loader deps to read
* - `select`: Map the deps to a derived value
* - `structuralSharing`: Enable structural sharing for stable references
*
* @returns The loader deps (or selected value) for the matched route.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useLoaderDepsHook
*/
function useLoaderDeps(opts) {
	const { select, ...rest } = opts;
	return useMatch({
		...rest,
		select: (match) => {
			return select ? select(match.loaderDeps) : match.loaderDeps;
		}
	});
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useParams.js
/**
* Access the current route's path parameters with type-safety.
*
* Options:
* - `from`/`strict`: Specify the matched route and whether to enforce strict typing
* - `select`: Project the params object to a derived value for memoized renders
* - `structuralSharing`: Enable structural sharing for stable references
* - `shouldThrow`: Throw if the route is not found in strict contexts
*
* @returns The params object (or selected value) for the matched route.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useParamsHook
*/
function useParams(opts) {
	return useMatch({
		from: opts.from,
		shouldThrow: opts.shouldThrow,
		structuralSharing: opts.structuralSharing,
		strict: opts.strict,
		select: (match) => {
			const params = opts.strict === false ? match.params : match._strictParams;
			return opts.select ? opts.select(params) : params;
		}
	});
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useSearch.js
/**
* Read and select the current route's search parameters with type-safety.
*
* Options:
* - `from`/`strict`: Control which route's search is read and how strictly it's typed
* - `select`: Map the search object to a derived value for render optimization
* - `structuralSharing`: Enable structural sharing for stable references
* - `shouldThrow`: Throw when the route is not found (strict contexts)
*
* @returns The search object (or selected value) for the matched route.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useSearchHook
*/
function useSearch(opts) {
	return useMatch({
		from: opts.from,
		strict: opts.strict,
		shouldThrow: opts.shouldThrow,
		structuralSharing: opts.structuralSharing,
		select: (match) => {
			return opts.select ? opts.select(match.search) : match.search;
		}
	});
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useNavigate.js
/**
* Imperative navigation hook.
*
* Returns a stable `navigate(options)` function to change the current location
* programmatically. Prefer the `Link` component for user-initiated navigation,
* and use this hook from effects, callbacks, or handlers where imperative
* navigation is required.
*
* Options:
* - `from`: Optional route base used to resolve relative `to` paths.
*
* @returns A function that accepts `NavigateOptions`.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useNavigateHook
*/
function useNavigate(_defaultOpts) {
	const router = useRouter();
	return import_react.useCallback((options) => {
		return router.navigate({
			...options,
			from: options.from ?? _defaultOpts?.from
		});
	}, [_defaultOpts?.from, router]);
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useRouteContext.js
function useRouteContext(opts) {
	return useMatch({
		...opts,
		select: (match) => opts.select ? opts.select(match.context) : match.context
	});
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/route.js
var import_jsx_runtime = require_jsx_runtime();
var Route$10 = class extends BaseRoute {
	/**
	* @deprecated Use the `createRoute` function instead.
	*/
	constructor(options) {
		super(options);
		this.useMatch = (opts) => {
			return useMatch({
				...opts,
				from: this.id
			});
		};
		this.useRouteContext = (opts) => {
			return useRouteContext({
				...opts,
				from: this.id
			});
		};
		this.useSearch = (opts) => {
			return useSearch({
				...opts,
				from: this.id
			});
		};
		this.useParams = (opts) => {
			return useParams({
				...opts,
				from: this.id
			});
		};
		this.useLoaderDeps = (opts) => {
			return useLoaderDeps({
				...opts,
				from: this.id
			});
		};
		this.useLoaderData = (opts) => {
			return useLoaderData({
				...opts,
				from: this.id
			});
		};
		this.useNavigate = () => {
			return useNavigate({ from: this.fullPath });
		};
		this.Link = import_react.forwardRef((props, ref) => {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				ref,
				from: this.fullPath,
				...props
			});
		});
	}
};
/**
* Creates a non-root Route instance for code-based routing.
*
* Use this to define a route that will be composed into a route tree
* (typically via a parent route's `addChildren`). If you're using file-based
* routing, prefer `createFileRoute`.
*
* @param options Route options (path, component, loader, context, etc.).
* @returns A Route instance to be attached to the route tree.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/createRouteFunction
*/
function createRoute(options) {
	return new Route$10(options);
}
var RootRoute = class extends BaseRootRoute {
	/**
	* @deprecated `RootRoute` is now an internal implementation detail. Use `createRootRoute()` instead.
	*/
	constructor(options) {
		super(options);
		this.useMatch = (opts) => {
			return useMatch({
				...opts,
				from: this.id
			});
		};
		this.useRouteContext = (opts) => {
			return useRouteContext({
				...opts,
				from: this.id
			});
		};
		this.useSearch = (opts) => {
			return useSearch({
				...opts,
				from: this.id
			});
		};
		this.useParams = (opts) => {
			return useParams({
				...opts,
				from: this.id
			});
		};
		this.useLoaderDeps = (opts) => {
			return useLoaderDeps({
				...opts,
				from: this.id
			});
		};
		this.useLoaderData = (opts) => {
			return useLoaderData({
				...opts,
				from: this.id
			});
		};
		this.useNavigate = () => {
			return useNavigate({ from: this.fullPath });
		};
		this.Link = import_react.forwardRef((props, ref) => {
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				ref,
				from: this.fullPath,
				...props
			});
		});
	}
};
/**
* Creates a root Route instance used to build your route tree.
*
* Typically paired with `createRouter({ routeTree })`. If you need to require
* a typed router context, use `createRootRouteWithContext` instead.
*
* @param options Root route options (component, error, pending, etc.).
* @returns A root route instance.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/createRootRouteFunction
*/
function createRootRoute(options) {
	return new RootRoute(options);
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/fileRoute.js
/**
* Creates a file-based Route factory for a given path.
*
* Used by TanStack Router's file-based routing to associate a file with a
* route. The returned function accepts standard route options. In normal usage
* the `path` string is inserted and maintained by the `tsr` generator.
*
* @param path File path literal for the route (usually auto-generated).
* @returns A function that accepts Route options and returns a Route instance.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/createFileRouteFunction
*/
function createFileRoute(path) {
	return (options) => {
		const route = createRoute(options);
		route.isRoot = false;
		return route;
	};
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/lazyRouteComponent.js
/**
* Wrap a dynamic import to create a route component that supports
* `.preload()` and friendly reload-on-module-missing behavior.
*
* @param importer Function returning a module promise
* @param exportName Named export to use (default: `default`)
* @returns A lazy route component compatible with TanStack Router
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/lazyRouteComponentFunction
*/
function lazyRouteComponent(importer, exportName) {
	let loadPromise;
	let comp;
	let error;
	const load = () => {
		if (!loadPromise) {
			error = void 0;
			loadPromise = importer().then((res) => {
				comp = res[exportName ?? "default"];
			}).catch((err) => {
				loadPromise = void 0;
				error = err;
			});
		}
		return loadPromise;
	};
	const lazyComp = function Lazy(props) {
		if (error) {
			if (isModuleNotFoundError(error) && false);
			throw error;
		}
		if (!comp) {
			if (reactUse) reactUse(load());
			else throw load();
		}
		return import_react.createElement(comp, props);
	};
	lazyComp.preload = load;
	return lazyComp;
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/routerStores.js
var getStoreFactory = (opts) => {
	return {
		createMutableStore: createNonReactiveMutableStore,
		createReadonlyStore: createNonReactiveReadonlyStore,
		batch: (fn) => fn()
	};
};
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/router.js
/**
* Creates a new Router instance for React.
*
* Pass the returned router to `RouterProvider` to enable routing.
* Notable options: `routeTree` (your route definitions) and `context`
* (required if the root route was created with `createRootRouteWithContext`).
*
* @param options Router options used to configure the router.
* @returns A Router instance to be provided to `RouterProvider`.
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/createRouterFunction
*/
var createRouter = (options) => {
	return new Router(options);
};
var Router = class extends RouterCore {
	constructor(options) {
		super(options, getStoreFactory);
	}
};
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/useRouterState.js
/**
* Subscribe to the router's state store with optional selection and
* structural sharing for render optimization.
*
* Options:
* - `select`: Project the full router state to a derived slice
* - `structuralSharing`: Replace-equal semantics for stable references
* - `router`: Read state from a specific router instance instead of context
*
* @returns The selected router state (or the full state by default).
* @link https://tanstack.com/router/latest/docs/framework/react/api/router/useRouterStateHook
*/
function useRouterState(opts) {
	const contextRouter = useRouter({ warn: opts?.router === void 0 });
	const router = opts?.router || contextRouter;
	{
		const state = router.stores.__store.get();
		return opts?.select ? opts.select(state) : state;
	}
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/Asset.js
var noopScriptHandler = () => {};
function setScriptAttrs(script, attrs) {
	if (!attrs) return;
	for (const [key, value] of Object.entries(attrs)) if (key !== "suppressHydrationWarning" && value !== void 0 && value !== false) script.setAttribute(key, typeof value === "boolean" ? "" : String(value));
}
function Asset(asset) {
	const { attrs, children, nonce, preventScriptHoist } = asset;
	const innerHTML = import_react.useMemo(() => children === void 0 ? void 0 : { __html: children }, [children]);
	switch (asset.tag) {
		case "title": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", {
			...attrs,
			suppressHydrationWarning: true,
			children
		});
		case "meta": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meta", {
			...attrs,
			suppressHydrationWarning: true
		});
		case "link": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("link", {
			...attrs,
			precedence: attrs?.precedence ?? (attrs?.rel === "stylesheet" ? "default" : void 0),
			nonce,
			suppressHydrationWarning: true
		});
		case "style":
			if (asset.inlineCss && false);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", {
				...attrs,
				dangerouslySetInnerHTML: innerHTML,
				nonce
			});
		case "script": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Script, {
			attrs,
			preventScriptHoist,
			children
		});
		default: return null;
	}
}
function Script({ attrs, children, preventScriptHoist }) {
	useRouter();
	useHydrated();
	const innerHTML = import_react.useMemo(() => children === void 0 ? void 0 : { __html: children }, [children]);
	const dataScript = typeof attrs?.type === "string" && attrs.type !== "" && attrs.type !== "text/javascript" && attrs.type !== "module";
	import_react.useEffect(() => {
		if (dataScript) return;
		if (attrs?.src) {
			const link = document.createElement("a");
			link.href = attrs.src;
			const normSrc = link.href;
			for (const el of document.scripts) if (el.src === normSrc) return;
			const script = document.createElement("script");
			setScriptAttrs(script, attrs);
			document.head.appendChild(script);
			return () => script.remove();
		}
		if (typeof children === "string") {
			const typeAttr = typeof attrs?.type === "string" ? attrs.type : "text/javascript";
			const nonceAttr = typeof attrs?.nonce === "string" ? attrs.nonce : void 0;
			for (const el of document.scripts) {
				if (el.hasAttribute("src")) continue;
				const sType = el.getAttribute("type") ?? "text/javascript";
				const sNonce = el.getAttribute("nonce") ?? void 0;
				if (el.textContent === children && sType === typeAttr && sNonce === nonceAttr) return;
			}
			const script = document.createElement("script");
			script.textContent = children;
			setScriptAttrs(script, attrs);
			document.head.appendChild(script);
			return () => script.remove();
		}
	}, [
		attrs,
		children,
		dataScript
	]);
	if (attrs?.src) {
		if (!preventScriptHoist) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
			...attrs,
			suppressHydrationWarning: true
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
			...attrs,
			onLoad: noopScriptHandler,
			suppressHydrationWarning: true
		});
	}
	if (typeof children === "string") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("script", {
		...attrs,
		dangerouslySetInnerHTML: innerHTML,
		suppressHydrationWarning: true
	});
	return null;
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/headContentUtils.js
function buildTagsFromMatches(router, nonce, matches, assetCrossOrigin) {
	matches = _getAssetMatches(matches);
	const routeMeta = matches.map((match) => match.meta).filter((meta) => meta !== void 0);
	const resultMeta = [];
	const metaByAttribute = {};
	let title;
	for (let i = routeMeta.length - 1; i >= 0; i--) {
		const metas = routeMeta[i];
		for (let j = metas.length - 1; j >= 0; j--) {
			const m = metas[j];
			if (!m) continue;
			if (m.title) {
				if (!title) title = {
					tag: "title",
					children: m.title
				};
			} else if ("script:ld+json" in m) try {
				const json = JSON.stringify(m["script:ld+json"]);
				resultMeta.push({
					tag: "script",
					attrs: { type: "application/ld+json" },
					children: escapeHtml(json)
				});
			} catch {}
			else {
				const attribute = m.name ?? m.property;
				if (attribute) {
					if (metaByAttribute[attribute]) continue;
					else metaByAttribute[attribute] = true;
				}
				resultMeta.push({
					tag: "meta",
					attrs: {
						...m,
						nonce
					}
				});
			}
		}
	}
	if (title) resultMeta.push(title);
	if (nonce) resultMeta.push({
		tag: "meta",
		attrs: {
			property: "csp-nonce",
			content: nonce
		}
	});
	resultMeta.reverse();
	const constructedLinks = matches.flatMap((match) => match.links ?? []).filter((link) => link !== void 0).map((link) => ({
		tag: "link",
		attrs: {
			...link,
			nonce
		}
	}));
	const manifest = router.ssr?.manifest;
	const manifestCssTags = [];
	if (manifest) {
		matches.forEach((match) => {
			(manifest.routes[match.routeId]?.css)?.forEach((link) => {
				const resolvedLink = resolveManifestCssLink(link);
				manifestCssTags.push({
					tag: "link",
					attrs: {
						rel: "stylesheet",
						...resolvedLink,
						crossOrigin: getAssetCrossOrigin(assetCrossOrigin, "stylesheet") ?? resolvedLink.crossOrigin,
						suppressHydrationWarning: true,
						nonce
					}
				});
			});
		});
		if (manifest.inlineStyle) manifestCssTags.push({
			tag: "style",
			attrs: {
				...manifest.inlineStyle.attrs,
				nonce
			},
			children: manifest.inlineStyle.children,
			inlineCss: true
		});
	}
	const preloadLinks = [];
	if (manifest) matches.forEach((match) => {
		manifest.routes[match.routeId]?.preloads?.forEach((preload) => {
			preloadLinks.push({
				tag: "link",
				attrs: {
					...getScriptPreloadAttrs(manifest, preload, assetCrossOrigin),
					nonce
				}
			});
		});
	});
	const styles = matches.flatMap((match) => match.styles ?? []).filter((style) => style !== void 0).map(({ children, ...attrs }) => ({
		tag: "style",
		attrs: {
			...attrs,
			nonce
		},
		children
	}));
	const headScripts = matches.flatMap((match) => match.headScripts ?? []).filter((script) => script !== void 0).map(({ children, ...script }) => ({
		tag: "script",
		attrs: {
			...script,
			nonce
		},
		children
	}));
	const tags = [];
	appendUniqueUserTags(tags, resultMeta);
	tags.push(...preloadLinks);
	appendUniqueUserTags(tags, constructedLinks);
	tags.push(...manifestCssTags);
	appendUniqueUserTags(tags, styles);
	appendUniqueUserTags(tags, headScripts);
	return tags;
}
/**
* Build the head/link/meta/script tags from the renderable presented prefix.
* Used internally by `HeadContent`.
*/
var useTags = (assetCrossOrigin) => {
	const router = useRouter();
	const nonce = router.options.ssr?.nonce;
	return buildTagsFromMatches(router, nonce, router.stores.matches.get(), assetCrossOrigin);
};
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/HeadContent.js
/**
* Render route-managed head tags (title, meta, links, styles, head scripts).
* Place inside the document head of your app shell.
* @link https://tanstack.com/router/latest/docs/framework/react/guide/document-head-management
*/
function HeadContent(props) {
	const tags = useTags(props.assetCrossOrigin);
	const nonce = useRouter().options.ssr?.nonce;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: tags.map((tag) => /* @__PURE__ */ (0, import_react.createElement)(Asset, {
		...tag,
		key: `tsr-meta-${JSON.stringify(tag)}`,
		nonce
	})) });
}
// ../../node_modules/.pnpm/@tanstack+react-router@1.17_e16e07e4fd54e4e259681370207791aa/node_modules/@tanstack/react-router/dist/esm/Scripts.js
var routeScriptAttrs = { suppressHydrationWarning: true };
/**
* Render body script tags collected from route matches and SSR manifests.
* During streaming SSR, `<Scripts>` marks where late hydration scripts may
* begin to be inserted.
*/
var Scripts = () => {
	const router = useRouter();
	const nonce = router.options.ssr?.nonce;
	const getParts = (matches) => {
		const parts = getSsrBodyScriptParts(matches, router.ssr?.manifest, nonce, routeScriptAttrs);
		for (const script of parts[1]) if (typeof script.attrs?.src === "string") {
			const scriptWithHoist = script;
			scriptWithHoist.preventScriptHoist = true;
		}
		return parts;
	};
	return renderScripts(composeSsrBodyScripts(getParts(router.stores.matches.get()), router.serverSsr?.takeInitialHydrationScriptTags()));
};
function renderScripts(scripts) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: scripts.map((asset, i) => /* @__PURE__ */ (0, import_react.createElement)(Asset, {
		...asset,
		key: `tsr-scripts-${asset.tag}-${i}`
	})) });
}
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/circle-alert.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$11 = {
	name: "circle-alert",
	size: 24,
	node: [
		["circle", {
			cx: "12",
			cy: "12",
			r: "10",
			key: "1mglay"
		}],
		["line", {
			x1: "12",
			x2: "12",
			y1: "8",
			y2: "12",
			key: "1pkeuh"
		}],
		["line", {
			x1: "12",
			x2: "12.01",
			y1: "16",
			y2: "16",
			key: "4dfq90"
		}]
	],
	aliases: ["alert-circle"]
};
__iconData$11.node;
var CircleAlert = createLucideIcon(__iconData$11);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/circle-play.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$10 = {
	name: "circle-play",
	size: 24,
	node: [["path", {
		d: "M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z",
		key: "kmsa83"
	}], ["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}]],
	aliases: ["play-circle"]
};
__iconData$10.node;
var CirclePlay = createLucideIcon(__iconData$10);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/clock.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$9 = {
	name: "clock",
	size: 24,
	node: [["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}], ["path", {
		d: "M12 6v6l4 2",
		key: "mmk7yg"
	}]]
};
__iconData$9.node;
var Clock = createLucideIcon(__iconData$9);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/heart.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$8 = {
	name: "heart",
	size: 24,
	node: [["path", {
		d: "M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5",
		key: "mvr1a0"
	}]]
};
__iconData$8.node;
var Heart = createLucideIcon(__iconData$8);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/house.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$7 = {
	name: "house",
	size: 24,
	node: [["path", {
		d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
		key: "5wwlr5"
	}], ["path", {
		d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
		key: "r6nss1"
	}]],
	aliases: ["home"]
};
__iconData$7.node;
var House = createLucideIcon(__iconData$7);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/link-2.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$6 = {
	name: "link-2",
	size: 24,
	node: [
		["path", {
			d: "M9 17H7A5 5 0 0 1 7 7h2",
			key: "8i5ue5"
		}],
		["path", {
			d: "M15 7h2a5 5 0 1 1 0 10h-2",
			key: "1b9ql8"
		}],
		["line", {
			x1: "8",
			x2: "16",
			y1: "12",
			y2: "12",
			key: "1jonct"
		}]
	]
};
__iconData$6.node;
var Link2 = createLucideIcon(__iconData$6);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/menu.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$5 = {
	name: "menu",
	size: 24,
	node: [
		["path", {
			d: "M4 5h16",
			key: "1tepv9"
		}],
		["path", {
			d: "M4 12h16",
			key: "1lakjw"
		}],
		["path", {
			d: "M4 19h16",
			key: "1djgab"
		}]
	]
};
__iconData$5.node;
var Menu = createLucideIcon(__iconData$5);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/notebook-text.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$4 = {
	name: "notebook-text",
	size: 24,
	node: [
		["path", {
			d: "M2 6h4",
			key: "aawbzj"
		}],
		["path", {
			d: "M2 10h4",
			key: "l0bgd4"
		}],
		["path", {
			d: "M2 14h4",
			key: "1gsvsf"
		}],
		["path", {
			d: "M2 18h4",
			key: "1bu2t1"
		}],
		["rect", {
			width: "16",
			height: "20",
			x: "4",
			y: "2",
			rx: "2",
			key: "1nb95v"
		}],
		["path", {
			d: "M9.5 8h5",
			key: "11mslq"
		}],
		["path", {
			d: "M9.5 12H16",
			key: "ktog6x"
		}],
		["path", {
			d: "M9.5 16H14",
			key: "p1seyn"
		}]
	]
};
__iconData$4.node;
var NotebookText = createLucideIcon(__iconData$4);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/rotate-ccw-clock.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$3 = {
	name: "rotate-ccw-clock",
	size: 24,
	node: [
		["path", {
			d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
			key: "1357e3"
		}],
		["path", {
			d: "M3 3v5h5",
			key: "1xhq8a"
		}],
		["path", {
			d: "M12 7v5l4 2",
			key: "1fdv2h"
		}]
	],
	aliases: ["history"]
};
__iconData$3.node;
var RotateCcwClock = createLucideIcon(__iconData$3);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/shield-check.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$2 = {
	name: "shield-check",
	size: 24,
	node: [["path", {
		d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
		key: "oel41y"
	}], ["path", {
		d: "m9 12 2 2 4-4",
		key: "dzmm74"
	}]]
};
__iconData$2.node;
var ShieldCheck = createLucideIcon(__iconData$2);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/square-check.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$1 = {
	name: "square-check",
	size: 24,
	node: [["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "3",
		rx: "2",
		key: "afitv7"
	}], ["path", {
		d: "m16 9-5.5 5.5L8 12",
		key: "xofnsj"
	}]],
	aliases: ["check-square-2"]
};
__iconData$1.node;
var SquareCheck = createLucideIcon(__iconData$1);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/x.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "x",
	size: 24,
	node: [["path", {
		d: "M18 6 6 18",
		key: "1bl5f8"
	}], ["path", {
		d: "m6 6 12 12",
		key: "d8bk6v"
	}]]
};
__iconData.node;
var X = createLucideIcon(__iconData);
// ../../assets/avatar.png?inline
var avatar_default = "data:image/png;base64,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";
// src/components/shell.tsx
var items = [
	[
		"/",
		"首页",
		House
	],
	[
		"/videos",
		"观看记录",
		CirclePlay
	],
	[
		"/activity",
		"行动记录",
		RotateCcwClock
	],
	[
		"/diary",
		"日记",
		NotebookText
	],
	[
		"/review",
		"待我审核",
		SquareCheck
	],
	[
		"/personality",
		"个性与兴趣",
		Heart
	],
	[
		"/schedule",
		"活动时间",
		Clock
	],
	[
		"/permissions",
		"操作权限",
		ShieldCheck
	],
	[
		"/account",
		"账号连接",
		Link2
	]
];
function Shell({ children }) {
	const { state, error, notice, clearError } = useDashboard((s) => ({
		state: s.state,
		error: s.error,
		notice: s.notice,
		clearError: s.clearError
	}));
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = (0, import_react.useState)(false);
	const count = state?.drafts.filter((d) => d.state === "draft").length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "app-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mobile-header",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					"aria-label": "打开导航",
					onClick: () => setOpen(!open),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "mobile-brand",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: avatar_default,
						alt: ""
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "B 站小白龙" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "sidebar " + (open ? "is-open" : ""),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "brand",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: avatar_default,
						alt: ""
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "B 站小白龙" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					"aria-label": "主导航",
					children: items.map(([to, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to,
						className: "nav-item " + (pathname === to ? "active" : ""),
						onClick: () => setOpen(false),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { strokeWidth: 1.7 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }),
							to === "/review" && count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", {
								className: "count-badge",
								children: count
							})
						]
					}, to))
				})]
			}),
			open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				className: "nav-backdrop",
				"aria-label": "关闭导航",
				onClick: () => setOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "main-content",
				children: [
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "error-banner",
						role: "alert",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 20 }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								"aria-label": "关闭提示",
								onClick: clearError,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 18 })
							})
						]
					}),
					notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "save-notice",
						role: "status",
						children: notice
					}),
					children
				]
			})
		]
	});
}
// src/styles.css?url
var styles_default = "/assets/styles-amjbsLXf.css";
// src/routes/__root.tsx
var Route$9 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Codex Bili Dragon · B 站小白龙" }
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	component: () => typeof window !== "undefined" && window.dragonApp ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-CN",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DashboardProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	})
});
// src/routes/index.tsx
var $$splitComponentImporter$8 = () => import("./routes-7hRrLklc.js");
var Route$8 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
// src/routes/account.tsx
var $$splitComponentImporter$7 = () => import("./account-BSRrPWpV.js");
var Route$7 = createFileRoute("/account")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
// src/routes/activity.tsx
var $$splitComponentImporter$6 = () => import("./activity-BJ8YZdBO.js");
var Route$6 = createFileRoute("/activity")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
// src/routes/diary.tsx
var $$splitComponentImporter$5 = () => import("./diary-DGDBIv3a.js");
var Route$5 = createFileRoute("/diary")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
// src/routes/permissions.tsx
var $$splitComponentImporter$4 = () => import("./permissions-tfjZSW_k.js");
var Route$4 = createFileRoute("/permissions")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
// src/routes/personality.tsx
var $$splitComponentImporter$3 = () => import("./personality-BFKAb03m.js");
var Route$3 = createFileRoute("/personality")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
// src/routes/review.tsx
var $$splitComponentImporter$2 = () => import("./review-Dj0QbqNW.js");
var Route$2 = createFileRoute("/review")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
// src/routes/schedule.tsx
var $$splitComponentImporter$1 = () => import("./schedule-WOpo4tJs.js");
var Route$1 = createFileRoute("/schedule")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
// src/routes/videos.tsx
var $$splitComponentImporter = () => import("./videos--v9CNMi9.js");
var Route = createFileRoute("/videos")({
	validateSearch: (search) => ({ bv: typeof search.bv === "string" ? search.bv : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
// src/routeTree.gen.ts
var rootRouteChildren = {
	IndexRoute: Route$8.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$9
	}),
	AccountRoute: Route$7.update({
		id: "/account",
		path: "/account",
		getParentRoute: () => Route$9
	}),
	ActivityRoute: Route$6.update({
		id: "/activity",
		path: "/activity",
		getParentRoute: () => Route$9
	}),
	DiaryRoute: Route$5.update({
		id: "/diary",
		path: "/diary",
		getParentRoute: () => Route$9
	}),
	PermissionsRoute: Route$4.update({
		id: "/permissions",
		path: "/permissions",
		getParentRoute: () => Route$9
	}),
	PersonalityRoute: Route$3.update({
		id: "/personality",
		path: "/personality",
		getParentRoute: () => Route$9
	}),
	ReviewRoute: Route$2.update({
		id: "/review",
		path: "/review",
		getParentRoute: () => Route$9
	}),
	ScheduleRoute: Route$1.update({
		id: "/schedule",
		path: "/schedule",
		getParentRoute: () => Route$9
	}),
	VideosRoute: Route.update({
		id: "/videos",
		path: "/videos",
		getParentRoute: () => Route$9
	})
};
var routeTree = Route$9._addFileChildren(rootRouteChildren)._addFileTypes();
// src/router.tsx
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true
	});
}
export { Link2 as a, CircleAlert as c, getRouter, NotebookText as i, Route as n, Clock as o, X as r, CirclePlay as s, router_exports as t };
