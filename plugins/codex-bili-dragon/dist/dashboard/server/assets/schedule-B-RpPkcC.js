import { i as __toESM } from "./rolldown-runtime-DYf_mQCB.js";
import { L as require_react, o as require_jsx_runtime } from "./matchContext-Bm7-ArXH.js";
import { C as getWindow, _ as mergeProps, a as useRenderElement, c as EMPTY_OBJECT, d as useMergedRefs, f as useButton, g as formatErrorMessage, k as useSettings, n as Button, p as dispatchClickWithModifiers, r as cn, t as createLucideIcon, v as useIsoLayoutEffect } from "./createLucideIcon-BmtKeUIw.js";
import { n as NativeSelectOption, t as NativeSelect } from "./native-select-DbcBliUc.js";
import { C as visuallyHiddenInput, M as useBaseUiId, N as useControlled, S as visuallyHidden, _ as useFormContext, a as Loading, b as useFieldRootContext, f as Input, g as useLabelableContext, h as useAriaLabelledBy, i as Field, j as createChangeEventDetails, k as none, m as useLabelableId, o as Panel, p as useValueChanged, s as SaveBar, v as useRegisterFieldControl, x as fieldValidityMapping, y as useSetFieldFocused } from "./common-BEruSkQj.js";
import { t as Plus } from "./plus-Bggrmnyj.js";
import { o as useTransitionStatus, r as transitionStatusMapping, t as useOpenChangeComplete } from "./useOpenChangeComplete-Dw8iSJgJ.js";
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/check.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData$1 = {
	name: "check",
	size: 24,
	node: [["path", {
		d: "M20 6 9 17l-5-5",
		key: "1gmf2c"
	}]]
};
__iconData$1.node;
var Check = createLucideIcon(__iconData$1);
// ../../node_modules/.pnpm/lucide-react@1.61.0_@types+react@19.3.0_react@19.3.1/node_modules/lucide-react/dist/esm/icons/trash.mjs
/**
* @license lucide-react v1.61.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var __iconData = {
	name: "trash",
	size: 24,
	node: [
		["path", {
			d: "M10 11v6",
			key: "nco0om"
		}],
		["path", {
			d: "M14 11v6",
			key: "outv1u"
		}],
		["path", {
			d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6",
			key: "miytrc"
		}],
		["path", {
			d: "M3 6h18",
			key: "d0wm0j"
		}],
		["path", {
			d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
			key: "e791ji"
		}]
	],
	aliases: ["trash-2"]
};
__iconData.node;
var Trash = createLucideIcon(__iconData);
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/field/item/FieldItemContext.mjs
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var FieldItemContext = /*#__PURE__*/ import_react.createContext({ disabled: false });
function useFieldItemContext() {
	return import_react.useContext(FieldItemContext);
}
// ../../node_modules/.pnpm/@base-ui+utils@0.5.0_@types_6b1c5c30254f04ccfc8f12b63d1f3b80/node_modules/@base-ui/utils/getDefaultFormSubmitter.mjs
/**
* Returns the default button a browser uses for implicit form submission.
*
* This is useful for custom form controls that need to mirror native Enter key behavior.
* Clicking the returned submitter preserves browser semantics such as the submitter's click
* event, `SubmitEvent.submitter`, and submitter-specific attributes.
*
* The function follows the controls exposed by `form.elements`, which includes controls associated
* through the `form` attribute. Disabled submitters can be returned because the default button is
* determined before disabled state is considered; clicking a disabled submitter is a no-op.
*/
function getDefaultFormSubmitter(form) {
	if (!form) return null;
	for (const candidate of form.elements) {
		const tagName = candidate.tagName;
		if (tagName === "BUTTON" || tagName === "INPUT") {
			const button = candidate;
			if (button.type === "submit") return button;
		}
	}
	return null;
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/checkbox/root/CheckboxRootDataAttributes.mjs
/**
* Present when the checkbox is checked.
*/
var checked = "data-checked";
/**
* Present when the checkbox is not checked.
*/
var unchecked = "data-unchecked";
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/checkbox/utils/getCheckboxStateAttributesMapping.mjs
function getCheckboxStateAttributesMapping(state) {
	return {
		checked(value) {
			if (state.indeterminate) return {};
			if (value) return { [checked]: "" };
			return { [unchecked]: "" };
		},
		...fieldValidityMapping
	};
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/checkbox-group/CheckboxGroupContext.mjs
var CheckboxGroupContext = /*#__PURE__*/ import_react.createContext(void 0);
function useCheckboxGroupContext() {
	return import_react.useContext(CheckboxGroupContext);
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/checkbox/root/CheckboxRootContext.mjs
var CheckboxRootContext = /*#__PURE__*/ import_react.createContext(void 0);
function useCheckboxRootContext() {
	const context = import_react.useContext(CheckboxRootContext);
	if (context === void 0) throw new Error(formatErrorMessage(14));
	return context;
}
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/checkbox/root/CheckboxRoot.mjs
var import_jsx_runtime = require_jsx_runtime();
var PARENT_CHECKBOX = "data-parent";
/**
* Represents the checkbox itself.
* Renders a `<span>` element and a hidden `<input>` beside.
*
* Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
*/
var CheckboxRoot = /*#__PURE__*/ import_react.forwardRef(function CheckboxRoot(componentProps, forwardedRef) {
	const { checked: checkedProp, className, defaultChecked = false, "aria-labelledby": ariaLabelledByProp, disabled: disabledProp = false, form, id: idProp, indeterminate = false, inputRef: inputRefProp, name: nameProp, onCheckedChange, parent = false, readOnly = false, render, required = false, uncheckedValue, value: valueProp, nativeButton = false, style, ...elementProps } = componentProps;
	const { clearErrors } = useFormContext();
	const { disabled: rootDisabled, name: fieldName, setDirty, setFilled, setTouched, state: fieldState, validationMode, validityData, validation: localValidation } = useFieldRootContext();
	const fieldItemContext = useFieldItemContext();
	const { labelId, registerControlId, getDescriptionProps } = useLabelableContext();
	const groupContext = useCheckboxGroupContext();
	const parentContext = groupContext?.allValues === void 0 ? void 0 : groupContext.parent;
	const isGroupedWithParent = parentContext !== void 0;
	const disabled = rootDisabled || fieldItemContext.disabled || groupContext?.disabled || disabledProp;
	const name = fieldName ?? nameProp;
	const value = valueProp ?? name;
	const id = useBaseUiId();
	const ownsControlId = groupContext?.registerControlId !== registerControlId;
	const controlId = useLabelableId({
		id: idProp || void 0,
		enabled: ownsControlId
	});
	const rootId = nativeButton ? controlId : id;
	let groupProps = {};
	if (isGroupedWithParent) {
		if (parent) groupProps = parentContext.getParentProps();
		else if (value !== void 0) groupProps = parentContext.getChildProps(value);
	}
	const { checked: groupChecked = checkedProp, indeterminate: groupIndeterminate = indeterminate, onCheckedChange: groupOnChange, ...otherGroupProps } = groupProps;
	const groupValue = groupContext?.value;
	const controlRef = import_react.useRef(null);
	const setFocused = useSetFieldFocused(disabled, controlRef);
	const { getButtonProps, buttonRef } = useButton({
		disabled,
		native: nativeButton
	});
	const validation = groupContext?.validation ?? localValidation;
	const [checked, setCheckedState] = useControlled({
		controlled: value !== void 0 && groupValue !== void 0 && !parent ? groupValue.includes(value) : groupChecked,
		default: defaultChecked,
		name: "Checkbox",
		state: "checked"
	});
	const computedChecked = isGroupedWithParent ? Boolean(groupChecked) : checked;
	const computedIndeterminate = isGroupedWithParent ? groupIndeterminate || indeterminate : indeterminate;
	useRegisterFieldControl(controlRef, id, checked, void 0, !groupContext && !disabled, nameProp);
	const registerChildId = parentContext?.registerChildId;
	const inputRef = import_react.useRef(null);
	const registerFieldInput = validation.registerInput;
	const registeredInputValue = groupContext ? value : void 0;
	const registerInput = import_react.useCallback((element) => registerFieldInput(element, {
		controlRef,
		value: registeredInputValue
	}), [registerFieldInput, registeredInputValue]);
	const mergedInputRef = useMergedRefs(inputRefProp, inputRef, parent ? void 0 : registerInput);
	const ariaLabelledBy = useAriaLabelledBy(ariaLabelledByProp, labelId, inputRef, !nativeButton, controlId, elementProps["aria-label"]);
	useIsoLayoutEffect(() => {
		if (inputRef.current) inputRef.current.indeterminate = computedIndeterminate;
		if (!groupContext) setFilled(checked);
	}, [
		checked,
		computedIndeterminate,
		groupContext,
		setFilled
	]);
	useValueChanged(checked, () => {
		if (groupContext) return;
		clearErrors(name);
		setDirty(checked !== validityData.initialValue);
		validation.change(checked);
	});
	const inputProps = mergeProps({
		checked,
		disabled,
		form,
		name: parent ? void 0 : name,
		id: nativeButton ? void 0 : controlId,
		required,
		ref: mergedInputRef,
		style: name ? visuallyHiddenInput : visuallyHidden,
		tabIndex: -1,
		type: "checkbox",
		"aria-hidden": true,
		onChange(event) {
			if (event.nativeEvent.defaultPrevented) return;
			if (readOnly) {
				event.preventDefault();
				return;
			}
			const nextChecked = event.currentTarget.checked;
			const details = createChangeEventDetails(none, event.nativeEvent);
			onCheckedChange?.(nextChecked, details);
			if (details.isCanceled) return;
			groupOnChange?.(nextChecked, details);
			if (details.isCanceled) return;
			setCheckedState(nextChecked);
			if (value !== void 0 && groupContext !== void 0 && !parent && !isGroupedWithParent) {
				const nextGroupValue = nextChecked ? [...groupContext.value, value] : groupContext.value.filter((item) => item !== value);
				groupContext.setValue(nextGroupValue, details);
			}
		},
		onClick(event) {
			event.stopPropagation();
		},
		onFocus() {
			controlRef.current?.focus();
		}
	}, valueProp !== void 0 ? { value: (groupContext ? checked && valueProp : valueProp) || "" } : EMPTY_OBJECT, getDescriptionProps, (props) => validation.getValidationProps(disabled, props));
	import_react.useEffect(() => {
		if (!parentContext || value === void 0) return;
		const disabledStates = parentContext.disabledStatesRef.current;
		disabledStates.set(value, disabled);
		return () => {
			disabledStates.delete(value);
		};
	}, [
		parentContext,
		disabled,
		value
	]);
	const state = import_react.useMemo(() => ({
		...fieldState,
		checked: computedChecked,
		disabled,
		readOnly,
		required,
		indeterminate: computedIndeterminate
	}), [
		fieldState,
		computedChecked,
		disabled,
		readOnly,
		required,
		computedIndeterminate
	]);
	const stateAttributesMapping = getCheckboxStateAttributesMapping(state);
	const element = useRenderElement("span", componentProps, {
		state,
		ref: [
			buttonRef,
			controlRef,
			forwardedRef
		],
		props: [
			{
				id: rootId,
				role: "checkbox",
				"aria-checked": computedIndeterminate ? "mixed" : computedChecked,
				"aria-readonly": readOnly || void 0,
				"aria-required": required || void 0,
				"aria-labelledby": ariaLabelledBy,
				[PARENT_CHECKBOX]: parent ? "" : void 0,
				onFocus() {
					setFocused(true);
				},
				onBlur() {
					const inputEl = inputRef.current;
					if (!inputEl) return;
					setTouched(true);
					setFocused(false);
					if (validationMode === "onBlur") validation.commit(groupContext ? groupValue : inputEl.checked);
				},
				onKeyDown(event) {
					if (event.key !== "Enter") return;
					event.preventBaseUIHandler();
					if (event.defaultPrevented) return;
					const formToSubmit = inputRef.current?.form ?? null;
					const currentTarget = event.currentTarget;
					const nativeEvent = event.nativeEvent;
					const originalPreventDefault = event.preventDefault;
					const originalNativePreventDefault = nativeEvent.preventDefault;
					let preventDefaultCalledAfterPropagation = false;
					event.preventDefault = () => {
						preventDefaultCalledAfterPropagation = true;
						originalPreventDefault.call(event);
					};
					nativeEvent.preventDefault = () => {
						preventDefaultCalledAfterPropagation = true;
						originalNativePreventDefault.call(nativeEvent);
					};
					originalNativePreventDefault.call(nativeEvent);
					getWindow(currentTarget).queueMicrotask(() => {
						event.preventDefault = originalPreventDefault;
						nativeEvent.preventDefault = originalNativePreventDefault;
						if (!preventDefaultCalledAfterPropagation) getDefaultFormSubmitter(formToSubmit)?.click();
					});
				},
				onClick(event) {
					if (readOnly || disabled) return;
					event.preventDefault();
					const input = inputRef.current;
					if (!input) return;
					dispatchClickWithModifiers(input, event);
				}
			},
			elementProps,
			otherGroupProps,
			getButtonProps,
			getDescriptionProps,
			(props) => validation.getValidationProps(disabled, props)
		],
		stateAttributesMapping
	});
	const renderedId = element.props.id;
	useIsoLayoutEffect(() => {
		if (!registerChildId || parent || value === void 0 || renderedId === void 0) return;
		return registerChildId(value, renderedId);
	}, [
		registerChildId,
		parent,
		value,
		renderedId
	]);
	return /*#__PURE__*/ (0, import_jsx_runtime.jsxs)(CheckboxRootContext.Provider, {
		value: state,
		children: [
			element,
			!checked && !groupContext && name && !parent && uncheckedValue !== void 0 && /*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				type: "hidden",
				form,
				name,
				value: uncheckedValue,
				disabled
			}),
			/*#__PURE__*/ (0, import_jsx_runtime.jsx)("input", {
				...inputProps,
				suppressHydrationWarning: true
			})
		]
	});
});
// ../../node_modules/.pnpm/@base-ui+react@1.9.0_@types_9de95ddea501fb73a908a36fe3e33ee8/node_modules/@base-ui/react/checkbox/indicator/CheckboxIndicator.mjs
/**
* Indicates whether the checkbox is ticked.
* Renders a `<span>` element.
*
* Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
*/
var CheckboxIndicator = /*#__PURE__*/ import_react.forwardRef(function CheckboxIndicator(componentProps, forwardedRef) {
	const { render, className, style, keepMounted = false, ...elementProps } = componentProps;
	const rootState = useCheckboxRootContext();
	const rendered = rootState.checked || rootState.indeterminate;
	const { mounted, transitionStatus, setMounted } = useTransitionStatus(rendered);
	const indicatorRef = import_react.useRef(null);
	const state = {
		...rootState,
		transitionStatus
	};
	useOpenChangeComplete({
		batch: true,
		enabled: !rendered,
		open: rendered,
		ref: indicatorRef,
		onComplete() {
			if (!rendered) setMounted(false);
		}
	});
	const stateAttributesMapping = {
		...getCheckboxStateAttributesMapping(rootState),
		...transitionStatusMapping
	};
	const shouldRender = keepMounted || mounted;
	const element = useRenderElement("span", componentProps, {
		ref: [forwardedRef, indicatorRef],
		state,
		stateAttributesMapping,
		props: elementProps
	});
	if (!shouldRender) return null;
	return element;
});
// src/components/ui/checkbox.tsx
function Checkbox({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxRoot, {
		"data-slot": "checkbox",
		className: cn("peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 group-has-[:focus-visible]/field-label:ring-0 group-has-[:focus-visible]/field-label:not-data-checked:border-input after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground group-has-[:focus-visible]/field-label:data-checked:border-primary dark:data-checked:bg-primary", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckboxIndicator, {
			"data-slot": "checkbox-indicator",
			className: "grid place-content-center text-current transition-none [&>svg]:size-3.5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {})
		})
	});
}
// src/routes/schedule.tsx?tsr-split=component
function Schedule() {
	const settings = useSettings();
	const { config, setConfig } = settings;
	if (!config) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Loading, {});
	const n = config.night;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "page-title",
		children: "活动时间"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-stack schedule-page",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "page-stack",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Field, {
					label: "时区",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: config.timezone,
						list: "timezones",
						onChange: (e) => setConfig({
							...config,
							timezone: e.target.value
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
						id: "timezones",
						children: [
							"Asia/Shanghai",
							"Asia/Tokyo",
							"Asia/Singapore",
							"Europe/London",
							"America/New_York",
							"America/Los_Angeles",
							"UTC"
						].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, { value: t }, t))
					})]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "section-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "每日活动时段" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						disabled: n.windows.length >= 4,
						onClick: () => setConfig({
							...config,
							night: {
								...n,
								windows: [...n.windows, {
									start: "20:00",
									end: "24:00",
									wakes: 1
								}]
							}
						}),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 16 }), "添加时段"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "time-windows",
					children: n.windows.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "time-window",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "window-label",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Checkbox, {
										checked: w.wakes > 0,
										"aria-label": "启用时段" + (i + 1),
										onCheckedChange: (checked) => setConfig({
											...config,
											night: {
												...n,
												windows: n.windows.map((x, j) => j === i ? {
													...x,
													wakes: checked ? 1 : 0
												} : x)
											}
										})
									}),
									"时段 ",
									i + 1
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								"aria-label": "时段" + (i + 1) + "开始",
								value: w.start,
								placeholder: "20:00",
								maxLength: 5,
								onChange: (e) => setConfig({
									...config,
									night: {
										...n,
										windows: n.windows.map((x, j) => j === i ? {
											...x,
											start: e.target.value
										} : x)
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "–" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								"aria-label": "时段" + (i + 1) + "结束",
								value: w.end,
								placeholder: "24:00",
								maxLength: 5,
								onChange: (e) => setConfig({
									...config,
									night: {
										...n,
										windows: n.windows.map((x, j) => j === i ? {
											...x,
											end: e.target.value
										} : x)
									}
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "window-count",
								children: [
									"最多",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelect, {
										"aria-label": "时段" + (i + 1) + "机会数",
										value: w.wakes,
										onChange: (e) => setConfig({
											...config,
											night: {
												...n,
												windows: n.windows.map((x, j) => j === i ? {
													...x,
													wakes: Number(e.target.value)
												} : x)
											}
										}),
										children: [
											0,
											1,
											2,
											3
										].map((x) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NativeSelectOption, {
											value: x,
											children: x
										}, x))
									}),
									"次机会"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "ghost",
								size: "icon",
								"aria-label": "删除时段" + (i + 1),
								disabled: n.windows.length === 1,
								onClick: () => setConfig({
									...config,
									night: {
										...n,
										windows: n.windows.filter((_, j) => j !== i)
									}
								}),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash, { size: 18 })
							})
						]
					}, i))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "逛 B 站的习惯" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "form-columns",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "这次歇一歇的概率",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "with-unit",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 0,
									max: 100,
									value: Math.round(n.skipChance * 100),
									onChange: (e) => setConfig({
										...config,
										night: {
											...n,
											skipChance: Number(e.target.value) / 100
										}
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "%" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "两次闲逛至少间隔",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "with-unit",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 10,
									max: 1440,
									value: n.minGapMin,
									onChange: (e) => setConfig({
										...config,
										night: {
											...n,
											minGapMin: Number(e.target.value)
										}
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "分钟" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "每次最多看几个视频",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "with-unit",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "number",
									min: 1,
									max: 10,
									value: n.maxVideos,
									onChange: (e) => setConfig({
										...config,
										night: {
											...n,
											maxVideos: Number(e.target.value)
										}
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "个" })]
							})
						})
					]
				})] })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SaveBar, { ...settings })]
	})] });
}
export { Schedule as component };
