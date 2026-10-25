import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { C as getWindow, a as useRenderElement, b as useRefWithInit, d as useMergedRefs, f as useButton, g as formatErrorMessage, o as resolveStyle, v as useIsoLayoutEffect, y as useStableCallback } from "./createLucideIcon-BmtKeUIw.js";
import { A as triggerPress, M as useBaseUiId, N as useControlled, j as createChangeEventDetails, k as none, w as Timeout } from "./common-BEruSkQj.js";
import { a as startingStyle$1, n as useAnimationsFinished, o as useTransitionStatus, r as transitionStatusMapping, s as AnimationFrame, t as useOpenChangeComplete } from "./useOpenChangeComplete-Dw8iSJgJ.js";
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/root/useCollapsibleRoot.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function useCollapsibleRoot(parameters) {
	const { open: openParam, defaultOpen = false, onOpenChange, disabled } = parameters;
	const [open, setOpen] = useControlled({
		controlled: openParam,
		default: defaultOpen,
		name: "Collapsible",
		state: "open"
	});
	const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, true, true);
	const defaultPanelId = useBaseUiId();
	const [registeredPanelId, setPanelIdState] = import_react.useState();
	const panelId = registeredPanelId === null ? void 0 : registeredPanelId ?? defaultPanelId;
	const handleTrigger = useStableCallback((event) => {
		const nextOpen = !open;
		const eventDetails = createChangeEventDetails(triggerPress, event.nativeEvent);
		onOpenChange(nextOpen, eventDetails);
		if (eventDetails.isCanceled) return;
		setOpen(nextOpen);
	});
	return import_react.useMemo(() => ({
		defaultPanelId,
		disabled,
		handleTrigger,
		mounted,
		open,
		panelId,
		setMounted,
		setOpen,
		setPanelIdState,
		transitionStatus
	}), [
		defaultPanelId,
		disabled,
		handleTrigger,
		mounted,
		open,
		panelId,
		setMounted,
		setOpen,
		setPanelIdState,
		transitionStatus
	]);
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/root/CollapsibleRootContext.mjs
var CollapsibleRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useCollapsibleRootContext() {
	const context = import_react.useContext(CollapsibleRootContext);
	if (context === void 0) throw new Error(formatErrorMessage(15));
	return context;
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/panel/CollapsiblePanelDataAttributes.mjs
/**
* Present when the collapsible panel is open.
*/
var open = "data-open";
/**
* Present when the collapsible panel is closed.
*/
var closed = "data-closed";
/**
* Present when the panel begins animating in.
*/
var startingStyle = startingStyle$1;
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/trigger/CollapsibleTriggerDataAttributes.mjs
/**
* Present when the collapsible panel is open.
*/
var panelOpen = "data-panel-open";
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/utils/collapsibleOpenStateMapping.mjs
var PANEL_OPEN_HOOK = { [open]: "" };
var PANEL_CLOSED_HOOK = { [closed]: "" };
var triggerOpenStateMapping = { open(value) {
	if (value) return { [panelOpen]: "" };
	return null;
} };
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/root/stateAttributesMapping.mjs
var collapsibleStateAttributesMapping = {
	open(value) {
		if (value) return PANEL_OPEN_HOOK;
		return PANEL_CLOSED_HOOK;
	},
	...transitionStatusMapping
};
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/root/CollapsibleRoot.mjs
var import_jsx_runtime = require_jsx_runtime();
/**
* Groups all parts of the collapsible.
* Renders a `<div>` element.
*
* Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
*/
var CollapsibleRoot = /*#__PURE__*/ import_react.forwardRef(function CollapsibleRoot(componentProps, forwardedRef) {
	const { render, className, defaultOpen = false, disabled = false, onOpenChange: onOpenChangeProp, open, style, ...elementProps } = componentProps;
	const onOpenChange = useStableCallback(onOpenChangeProp);
	const collapsible = useCollapsibleRoot({
		open,
		defaultOpen,
		onOpenChange,
		disabled
	});
	const state = import_react.useMemo(() => ({
		open: collapsible.open,
		disabled: collapsible.disabled,
		transitionStatus: collapsible.transitionStatus
	}), [
		collapsible.open,
		collapsible.disabled,
		collapsible.transitionStatus
	]);
	const contextValue = import_react.useMemo(() => ({
		...collapsible,
		onOpenChange,
		state
	}), [
		collapsible,
		onOpenChange,
		state
	]);
	const element = useRenderElement("div", componentProps, {
		state,
		ref: forwardedRef,
		props: elementProps,
		stateAttributesMapping: collapsibleStateAttributesMapping
	});
	return /*#__PURE__*/ (0, import_jsx_runtime.jsx)(CollapsibleRootContext.Provider, {
		value: contextValue,
		children: element
	});
});
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/trigger/CollapsibleTrigger.mjs
var stateAttributesMapping = {
	...triggerOpenStateMapping,
	...transitionStatusMapping
};
/**
* A button that opens and closes the collapsible panel.
* Renders a `<button>` element.
*
* Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
*/
var CollapsibleTrigger$1 = /*#__PURE__*/ import_react.forwardRef(function CollapsibleTrigger(componentProps, forwardedRef) {
	const { panelId, open, handleTrigger, state, disabled: contextDisabled } = useCollapsibleRootContext();
	const { className, disabled = contextDisabled, render, nativeButton = true, style, ...elementProps } = componentProps;
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	return useRenderElement("button", componentProps, {
		state,
		ref: [forwardedRef, buttonRef],
		props: [
			{
				"aria-controls": open ? panelId : void 0,
				"aria-expanded": open,
				onClick: handleTrigger
			},
			elementProps,
			getButtonProps
		],
		stateAttributesMapping
	});
});
// ../../node_modules/.pnpm/@base-ui+utils@0.5.0_@types_6b1c5c30254f04ccfc8f12b63d1f3b80/node_modules/@base-ui/utils/addEventListener.mjs
/**
* Adds an event listener and returns a cleanup function to remove it.
*/
function addEventListener(target, type, listener, options) {
	target.addEventListener(type, listener, options);
	return () => {
		target.removeEventListener(type, listener, options);
	};
}
// ../../node_modules/.pnpm/@base-ui+utils@0.5.0_@types_6b1c5c30254f04ccfc8f12b63d1f3b80/node_modules/@base-ui/utils/useValueAsRef.mjs
/**
* Untracks the provided value by turning it into a ref to remove its reactivity.
*
* Used to access the passed value inside `React.useEffect` without causing the effect to re-run when the value changes.
*/
function useValueAsRef(value) {
	const latest = useRefWithInit(createLatestRef, value).current;
	latest.next = value;
	useIsoLayoutEffect(latest.effect);
	return latest;
}
function createLatestRef(value) {
	const latest = {
		current: value,
		next: value,
		effect: () => {
			latest.current = latest.next;
		}
	};
	return latest;
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/panel/useCollapsiblePanel.mjs
var EMPTY_DIMENSIONS = {
	height: void 0,
	width: void 0
};
function useCollapsiblePanel(parameters) {
	const { externalRef, hiddenUntilFound, id: idParam, keepMounted, mounted, onOpenChange, open, setMounted, setOpen, transitionStatus } = parameters;
	const panelRef = import_react.useRef(null);
	const animationTypeRef = import_react.useRef(null);
	const [dimensions, setDimensionsUnwrapped] = import_react.useState(EMPTY_DIMENSIONS);
	const lastMeasuredDimensionsRef = import_react.useRef(EMPTY_DIMENSIONS);
	const shouldSkipNextOpenRef = import_react.useRef(false);
	const shouldPreventMountAnimationRef = import_react.useRef(open);
	const shouldPreventActivityResumeAnimationRef = import_react.useRef(false);
	const [forcePanelIdle, setForcePanelIdle] = import_react.useState(false);
	const pendingTemporaryStyleRestoreRef = import_react.useRef(null);
	const mergedPanelRef = useMergedRefs(externalRef, panelRef);
	const latestOpenRef = useValueAsRef(open);
	const runOnceCloseAnimationsFinish = useAnimationsFinished(panelRef);
	const hidden = !open && !mounted;
	const panelTransitionStatus = forcePanelIdle ? "idle" : transitionStatus;
	const shouldPreventOpenAnimation = open && (shouldPreventMountAnimationRef.current || shouldPreventActivityResumeAnimationRef.current);
	const renderedDimensions = !open && mounted && animationTypeRef.current === "css-animation" && dimensions.height === void 0 && dimensions.width === void 0 ? lastMeasuredDimensionsRef.current : dimensions;
	const shouldPersistHiddenTransitionStyles = hiddenUntilFound && hidden && animationTypeRef.current !== "css-animation";
	const setDimensions = useStableCallback((nextDimensions, shouldCacheMeasurement = true) => {
		if (shouldCacheMeasurement) lastMeasuredDimensionsRef.current = nextDimensions;
		setDimensionsUnwrapped(nextDimensions);
	});
	const restorePendingTemporaryStyle = useStableCallback(() => {
		pendingTemporaryStyleRestoreRef.current?.();
		pendingTemporaryStyleRestoreRef.current = null;
	});
	const setPendingTemporaryStyleRestore = useStableCallback((restore) => {
		restorePendingTemporaryStyle();
		pendingTemporaryStyleRestoreRef.current = () => {
			pendingTemporaryStyleRestoreRef.current = null;
			restore();
		};
	});
	const markActivityResumeAnimationSuppressed = useStableCallback(() => {
		if (open && mounted && animationTypeRef.current === "css-animation") shouldPreventActivityResumeAnimationRef.current = true;
	});
	useIsoLayoutEffect(() => {
		if (!forcePanelIdle || transitionStatus === "starting") return;
		setForcePanelIdle(false);
	}, [forcePanelIdle, transitionStatus]);
	import_react.useEffect(() => {
		return () => {
			markActivityResumeAnimationSuppressed();
			restorePendingTemporaryStyle();
		};
	}, [markActivityResumeAnimationSuppressed, restorePendingTemporaryStyle]);
	useIsoLayoutEffect(() => {
		if (!open) {
			shouldPreventMountAnimationRef.current = false;
			shouldPreventActivityResumeAnimationRef.current = false;
		}
		const panel = panelRef.current;
		if (!panel) return;
		if (!open && pendingTemporaryStyleRestoreRef.current) restorePendingTemporaryStyle();
		const animationType = getAnimationType(panel, shouldPreventOpenAnimation);
		animationTypeRef.current = animationType;
		if (open && transitionStatus === "idle" && shouldPreventMountAnimationRef.current && animationType === "css-animation") {
			lastMeasuredDimensionsRef.current = getDimensions(panel);
			return;
		}
		if (open && transitionStatus === "starting") {
			const skipNextOpen = shouldSkipNextOpenRef.current;
			shouldSkipNextOpenRef.current = false;
			if (animationType === "none") {
				setDimensions(getDimensions(panel));
				setForcePanelIdle(true);
				return;
			}
			if (animationType === "css-transition") {
				const restoreLayoutStyles = resetLayoutStyles(panel);
				setDimensions(getDimensions(panel));
				if (!skipNextOpen) return restoreLayoutStyles;
				const restoreTransitionDuration = setTemporaryStyle(panel, "transition-duration", "0s");
				setPendingTemporaryStyleRestore(restoreTransitionDuration);
				setForcePanelIdle(true);
				return restoreLayoutStyles;
			}
			setDimensions(getDimensions(panel));
			const restoreAnimationName = setTemporaryStyle(panel, "animation-name", "none");
			if (!skipNextOpen) {
				restoreAnimationName();
				return;
			}
			const restoreAnimationDuration = setTemporaryStyle(panel, "animation-duration", "0s");
			restoreAnimationName();
			setPendingTemporaryStyleRestore(restoreAnimationDuration);
			setForcePanelIdle(true);
			return;
		}
		if (!open && mounted && (transitionStatus === "idle" || transitionStatus === "starting")) {
			if (animationType === "none") {
				setDimensions(EMPTY_DIMENSIONS, false);
				setMounted(false);
				return;
			}
			setDimensions(getDimensions(panel));
			return;
		}
		if (transitionStatus !== "ending") return;
		if (animationType === "none") {
			setMounted(false);
			return;
		}
		const nextDimensions = getDimensions(panel);
		if (!(nextDimensions.height > 0 || nextDimensions.width > 0)) {
			setMounted(false);
			return;
		}
		setDimensions(nextDimensions);
		if (animationType === "css-animation") setTemporaryStyle(panel, "animation-name", "none")();
	}, [
		mounted,
		open,
		restorePendingTemporaryStyle,
		setDimensions,
		setMounted,
		setPendingTemporaryStyleRestore,
		shouldPreventOpenAnimation,
		transitionStatus
	]);
	useOpenChangeComplete({
		enabled: open && mounted && panelTransitionStatus === "idle",
		open: true,
		ref: panelRef,
		onComplete() {
			if (!open) return;
			setDimensions(EMPTY_DIMENSIONS, false);
		}
	});
	import_react.useEffect(() => {
		if (open || !mounted || panelTransitionStatus !== "ending") return;
		if (!panelRef.current) {
			setMounted(false);
			setDimensions(EMPTY_DIMENSIONS, false);
			return;
		}
		const abortController = new AbortController();
		let endingStyleFrame = -1;
		function handleComplete() {
			if (latestOpenRef.current) return;
			setMounted(false);
			setDimensions(EMPTY_DIMENSIONS, false);
		}
		endingStyleFrame = AnimationFrame.request(() => {
			runOnceCloseAnimationsFinish(handleComplete, abortController.signal);
		});
		return () => {
			AnimationFrame.cancel(endingStyleFrame);
			abortController.abort();
		};
	}, [
		latestOpenRef,
		mounted,
		open,
		panelTransitionStatus,
		runOnceCloseAnimationsFinish,
		setDimensions,
		setMounted
	]);
	useIsoLayoutEffect(() => {
		const panel = panelRef.current;
		if (!panel || !hiddenUntilFound || !hidden) return;
		panel.setAttribute("hidden", "until-found");
	}, [hidden, hiddenUntilFound]);
	import_react.useEffect(function registerBeforeMatchListener() {
		const panel = panelRef.current;
		if (!panel) return;
		const revealDecisionTimeout = Timeout.create();
		let revertRevealFrame = -1;
		const scheduleRevealRevert = (revertSkippedMotion, restoreStartingStyle) => {
			revealDecisionTimeout.start(0, () => {
				if (latestOpenRef.current) return;
				revertRevealFrame = AnimationFrame.request(() => {
					if (latestOpenRef.current) return;
					if (revertSkippedMotion) shouldSkipNextOpenRef.current = false;
					if (restoreStartingStyle) panel.setAttribute(startingStyle, "");
					panel.setAttribute("hidden", "until-found");
				});
			});
		};
		const handleBeforeMatch = (event) => {
			const eventDetails = createChangeEventDetails(none, event);
			onOpenChange(true, eventDetails);
			if (eventDetails.isCanceled) {
				scheduleRevealRevert(false, false);
				return;
			}
			shouldSkipNextOpenRef.current = true;
			const hadStartingStyle = panel.hasAttribute(startingStyle);
			panel.removeAttribute(startingStyle);
			setOpen(true);
			scheduleRevealRevert(true, hadStartingStyle);
		};
		const cleanupBeforeMatchListener = addEventListener(panel, "beforematch", handleBeforeMatch);
		return () => {
			revealDecisionTimeout.clear();
			AnimationFrame.cancel(revertRevealFrame);
			cleanupBeforeMatchListener();
		};
	}, [
		latestOpenRef,
		onOpenChange,
		setOpen
	]);
	const shouldRender = keepMounted || hiddenUntilFound || mounted || open;
	return {
		height: renderedDimensions.height,
		props: {
			...shouldPersistHiddenTransitionStyles ? { [startingStyle]: "" } : void 0,
			hidden,
			id: idParam
		},
		ref: mergedPanelRef,
		shouldPreventOpenAnimation,
		shouldRender,
		transitionStatus: panelTransitionStatus,
		width: renderedDimensions.width
	};
}
function getDimensions(element) {
	return {
		height: element.scrollHeight,
		width: element.scrollWidth
	};
}
function getAnimationType(element, hasSuppressedMountAnimation) {
	const panelStyles = getWindow(element).getComputedStyle(element);
	const hasAnimation = (panelStyles.animationName.split(",").map((name) => name.trim()).some((name) => name !== "" && name !== "none") || hasSuppressedMountAnimation) && hasNonZeroDuration(panelStyles.animationDuration);
	const hasTransition = hasNonZeroDuration(panelStyles.transitionDuration);
	if (hasAnimation && hasTransition) return "css-transition";
	if (hasTransition) return "css-transition";
	if (hasAnimation) return "css-animation";
	return "none";
}
function hasNonZeroDuration(value) {
	return value.split(",").map((part) => part.trim()).some((part) => part !== "" && Number.parseFloat(part) > 0);
}
/**
* Temporarily overrides an inline style property and returns a cleanup that
* restores the previous inline value and priority.
* @param element - The element whose inline style should be updated.
* @param property - The CSS property name to override.
* @param value - The temporary value to assign.
* @returns A cleanup function that restores the original inline style state.
*/
function setTemporaryStyle(element, property, value) {
	const previousValue = element.style.getPropertyValue(property);
	const previousPriority = element.style.getPropertyPriority(property);
	element.style.setProperty(property, value);
	return () => {
		if (previousValue === "") {
			element.style.removeProperty(property);
			return;
		}
		element.style.setProperty(property, previousValue, previousPriority);
	};
}
/**
* Temporarily resets inline alignment styles that can distort scroll-based
* size measurements, then restores them on the next animation frame.
* @param element - The panel element being measured.
* @returns A cleanup function that cancels the scheduled restore and reapplies
* the original inline layout styles immediately.
*/
function resetLayoutStyles(element) {
	const originalLayoutStyles = {
		"justify-content": element.style.justifyContent,
		"align-items": element.style.alignItems,
		"align-content": element.style.alignContent,
		"justify-items": element.style.justifyItems
	};
	Object.keys(originalLayoutStyles).forEach((key) => {
		element.style.setProperty(key, "initial", "important");
	});
	function restoreLayoutStyles() {
		Object.entries(originalLayoutStyles).forEach(([key, value]) => {
			if (value === "") {
				element.style.removeProperty(key);
				return;
			}
			element.style.setProperty(key, value);
		});
	}
	const frame = AnimationFrame.request(restoreLayoutStyles);
	return () => {
		AnimationFrame.cancel(frame);
		restoreLayoutStyles();
	};
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/panel/CollapsiblePanelCssVars.mjs
/**
* The collapsible panel's height.
* @type {number}
*/
var collapsiblePanelHeight = "--collapsible-panel-height";
/**
* The collapsible panel's width.
* @type {number}
*/
var collapsiblePanelWidth = "--collapsible-panel-width";
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/collapsible/panel/CollapsiblePanel.mjs
/**
* A panel with the collapsible contents.
* Renders a `<div>` element.
*
* Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
*/
var CollapsiblePanel = /*#__PURE__*/ import_react.forwardRef(function CollapsiblePanel(componentProps, forwardedRef) {
	const { className, hiddenUntilFound: hiddenUntilFoundProp, keepMounted: keepMountedProp, render, id: idProp, style, ...elementProps } = componentProps;
	const { defaultPanelId, mounted, onOpenChange, open, setMounted, setPanelIdState, setOpen, state, transitionStatus } = useCollapsibleRootContext();
	const hiddenUntilFound = hiddenUntilFoundProp ?? false;
	const keepMounted = keepMountedProp ?? false;
	const registeredId = idProp || void 0;
	const id = registeredId ?? defaultPanelId;
	useIsoLayoutEffect(() => {
		setPanelIdState((currentId) => registeredId ?? (currentId === null ? void 0 : currentId));
		return () => {
			setPanelIdState((currentId) => currentId === registeredId ? null : currentId);
		};
	}, [registeredId, setPanelIdState]);
	const { height, props, ref, shouldPreventOpenAnimation, shouldRender, transitionStatus: panelTransitionStatus, width } = useCollapsiblePanel({
		externalRef: forwardedRef,
		hiddenUntilFound,
		id,
		keepMounted,
		mounted,
		onOpenChange,
		open,
		setMounted,
		setOpen,
		transitionStatus
	});
	const panelState = {
		...state,
		transitionStatus: panelTransitionStatus
	};
	const resolvedStyle = resolveStyle(style, panelState);
	const element = useRenderElement("div", {
		...componentProps,
		style: void 0
	}, {
		state: panelState,
		ref,
		props: [
			props,
			{ style: {
				[collapsiblePanelHeight]: height === void 0 ? "auto" : `${height}px`,
				[collapsiblePanelWidth]: width === void 0 ? "auto" : `${width}px`
			} },
			elementProps,
			resolvedStyle ? { style: resolvedStyle } : void 0,
			shouldPreventOpenAnimation ? { style: { animationName: "none" } } : void 0
		],
		stateAttributesMapping: collapsibleStateAttributesMapping
	});
	if (!shouldRender) return null;
	return element;
});
// src/components/ui/collapsible.tsx
function Collapsible({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleRoot, {
		"data-slot": "collapsible",
		...props
	});
}
function CollapsibleTrigger({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsibleTrigger$1, {
		"data-slot": "collapsible-trigger",
		...props
	});
}
function CollapsibleContent({ ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CollapsiblePanel, {
		"data-slot": "collapsible-content",
		...props
	});
}
export { CollapsibleContent as n, CollapsibleTrigger as r, Collapsible as t };
