import { tick } from 'svelte';

export type OverflowState = {
	overflowLeft: boolean;
	overflowRight: boolean;
	overflowTop: boolean;
	overflowBottom: boolean;
};

/**
 * Which axis (or axes) to fade.
 * - `'y'`: vertical scrolling (top/bottom edges)
 * - `'x'`: horizontal scrolling (left/right edges)
 * - `'both'`: fade both axes at once (up to all four edges, subject to `sides`).
 */
export type FadeAxis = 'x' | 'y' | 'both';

/**
 * Which edge(s) to fade/check, relative to the axis.
 * - `'both'` (default): start and end
 * - `'start'`: the beginning edge(s) — top (axis `'y'`), left (axis `'x'`),
 *   or top + left (axis `'both'`)
 * - `'end'`: the trailing edge(s) — bottom (axis `'y'`), right (axis `'x'`),
 *   or bottom + right (axis `'both'`)
 */
export type FadeSides = 'both' | 'start' | 'end';

export type OverflowFadeOptions = {
	axis: FadeAxis;
	sides?: FadeSides;
	fade?: FadeConfig;
};

export type OverflowCheckOptions = {
	axis: FadeAxis;
	sides?: FadeSides;
	onOverflow?: (state: OverflowState) => void;
};

export type FadeConfig =
	| {
			type: 'element';
			size: string;
			backgroundColor: string;
			zIndex?: number;
	  }
	| {
			type: 'mask';
			fadePercent: number;
	  };

export type OverflowFadeAction = typeof overflowFadeAction;
export type OverflowFadeAttachment = typeof overflowFade;
export type IsOverflowingAction = typeof isOverflowingAction;
export type IsOverflowingAttachment = typeof isOverflowing;

type Edge = 'top' | 'bottom' | 'left' | 'right';
type EdgeFlags = Record<Edge, boolean>;

/**
 * Resolve which of the four edges are active for a given axis/sides combination.
 * This is the single source of truth used for overflow measurement, mask updates,
 * and element fader creation.
 */
function activeEdges(axis: FadeAxis, sides: FadeSides = 'both'): EdgeFlags {
	// `sides` selects the beginning vs trailing edge of each active axis:
	// 'start' = top/left, 'end' = bottom/right. This applies to 'both' too.
	const wantY = axis === 'y' || axis === 'both';
	const wantX = axis === 'x' || axis === 'both';
	const checkStart = sides !== 'end';
	const checkEnd = sides !== 'start';

	return {
		top: wantY && checkStart,
		bottom: wantY && checkEnd,
		left: wantX && checkStart,
		right: wantX && checkEnd
	};
}

function ensureMaskStyles() {
	let styleElement = document.querySelector('style[data-overflow-fade-styles]') as HTMLStyleElement;
	const styleContent = `
		@property --fade-top {
			syntax: '<number>';
			initial-value: 0;
			inherits: false;
		}
		@property --fade-bottom {
			syntax: '<number>';
			initial-value: 100;
			inherits: false;
		}
		@property --fade-left {
			syntax: '<number>';
			initial-value: 0;
			inherits: false;
		}
		@property --fade-right {
			syntax: '<number>';
			initial-value: 100;
			inherits: false;
		}
	`;

	if (!styleElement) {
		styleElement = document.createElement('style');
		styleElement.setAttribute('data-overflow-fade-styles', '');
		styleElement.textContent = styleContent;
		document.head.appendChild(styleElement);
	} else {
		// Replace content to ensure it's correct
		styleElement.textContent = styleContent;
	}
}

function checkOverflow(
	element: HTMLElement,
	axis: FadeAxis,
	sides: FadeSides = 'both'
): OverflowState {
	const state: OverflowState = {
		overflowLeft: false,
		overflowRight: false,
		overflowTop: false,
		overflowBottom: false
	};

	// Only measure the edge(s) we actually care about.
	const edges = activeEdges(axis, sides);

	if (edges.top) state.overflowTop = Math.floor(element.scrollTop) > 0;
	if (edges.bottom)
		state.overflowBottom = Math.round(element.clientHeight + element.scrollTop) < element.scrollHeight;
	if (edges.left) state.overflowLeft = Math.floor(element.scrollLeft) > 0;
	if (edges.right)
		state.overflowRight = Math.round(element.clientWidth + element.scrollLeft) < element.scrollWidth;

	return state;
}

function throttle<T extends unknown[]>(delay: number, func: (...args: T) => void) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastExecTime = 0;

	return function (...args: T) {
		const currentTime = Date.now();

		if (currentTime - lastExecTime > delay) {
			func(...args);
			lastExecTime = currentTime;
		} else {
			if (timeoutId) clearTimeout(timeoutId);
			timeoutId = setTimeout(
				() => {
					func(...args);
					lastExecTime = Date.now();
				},
				delay - (currentTime - lastExecTime)
			);
		}
	};
}

// Core overflow checking functionality
function createOverflowChecker(element: HTMLElement, options: OverflowCheckOptions) {
	let { axis, sides = 'both', onOverflow } = options;
	let observer: MutationObserver | null = null;

	function handleOverflowCheck() {
		const state = checkOverflow(element, axis, sides);

		// Call the callback if provided
		onOverflow?.(state);

		// Always dispatch the event
		element.dispatchEvent(new CustomEvent<OverflowState>('overflow', { detail: state }));
	}

	const throttledCheck = throttle(100, handleOverflowCheck);

	function init() {
		observer = new MutationObserver(throttledCheck);
		observer.observe(element, { childList: true, subtree: true });
		element.addEventListener('scroll', throttledCheck);

		tick().then(throttledCheck);
	}

	function destroy() {
		observer?.disconnect();
		element.removeEventListener('scroll', throttledCheck);
	}

	function update(newOptions: OverflowCheckOptions) {
		axis = newOptions.axis;
		sides = newOptions.sides ?? 'both';
		onOverflow = newOptions.onOverflow;
		throttledCheck();
	}

	// Initialize
	init();

	return {
		destroy,
		update
	};
}

// Export overflow checking as action
export function isOverflowingAction(element: HTMLElement, options: OverflowCheckOptions) {
	return createOverflowChecker(element, options);
}

// Export overflow checking as attachment for Svelte 5.29+
export function isOverflowing(options: OverflowCheckOptions) {
	return (element: HTMLElement) => {
		const { destroy } = createOverflowChecker(element, options);
		return destroy;
	};
}

// Overflow fade implementation
function createOverflowFade(element: HTMLElement, options: OverflowFadeOptions) {
	let { axis, sides = 'both', fade = { type: 'mask', fadePercent: 10 } } = options;

	let faders: Partial<Record<Edge, HTMLDivElement>> = {};
	let originalStyle: string | null = null;
	let overflowChecker: ReturnType<typeof createOverflowChecker> | null = null;

	function createEdgeFader(
		edge: Edge,
		config: Extract<FadeConfig, { type: 'element' }>
	): HTMLDivElement {
		const div = document.createElement('div');

		// Positioning + the dimension we animate, per edge.
		const layout: Record<Edge, { position: string; grow: string; gradientTo: string }> = {
			top: { position: 'top: 0; left: 0; right: 0;', grow: 'height: 0; transition: height 150ms;', gradientTo: 'bottom' },
			bottom: { position: 'bottom: 0; left: 0; right: 0;', grow: 'height: 0; transition: height 150ms;', gradientTo: 'top' },
			left: { position: 'left: 0; top: 0; bottom: 0;', grow: 'width: 0; transition: width 150ms;', gradientTo: 'right' },
			right: { position: 'right: 0; top: 0; bottom: 0;', grow: 'width: 0; transition: width 150ms;', gradientTo: 'left' }
		};

		const { position, grow, gradientTo } = layout[edge];

		div.style.cssText = `
			position: absolute;
			pointer-events: none;
			z-index: ${config.zIndex ?? 10};
			${position}
			${grow}
			background: linear-gradient(to ${gradientTo},
				${config.backgroundColor} 0%,
				${config.backgroundColor} 10%,
				transparent 100%);
		`;

		element.parentElement?.appendChild(div);
		return div;
	}

	function createElementFaders(config: Extract<FadeConfig, { type: 'element' }>) {
		const edges = activeEdges(axis, sides);
		(Object.keys(edges) as Edge[]).forEach((edge) => {
			if (edges[edge]) faders[edge] = createEdgeFader(edge, config);
		});
	}

	function setupMaskCSS() {
		// Ensure global styles exist
		ensureMaskStyles();

		// Reset all four fade stops to their no-fade defaults.
		element.style.setProperty('--fade-top', '0');
		element.style.setProperty('--fade-bottom', '100');
		element.style.setProperty('--fade-left', '0');
		element.style.setProperty('--fade-right', '100');
		element.style.transition =
			'--fade-top 300ms ease, --fade-bottom 300ms ease, --fade-left 300ms ease, --fade-right 300ms ease';

		const vertical = `linear-gradient(to bottom,
			transparent 0%,
			black calc(var(--fade-top) * 1%),
			black calc(var(--fade-bottom) * 1%),
			transparent 100%)`;
		const horizontal = `linear-gradient(to right,
			transparent 0%,
			black calc(var(--fade-left) * 1%),
			black calc(var(--fade-right) * 1%),
			transparent 100%)`;

		let gradient: string;
		if (axis === 'both') {
			// Two masks composited so a pixel is only shown where BOTH keep it —
			// this fades all four edges (and their corners) instead of one axis
			// overwriting the other's mask.
			gradient = `${vertical}, ${horizontal}`;
			element.style.setProperty('mask-composite', 'intersect');
			element.style.setProperty('-webkit-mask-composite', 'source-in');
		} else {
			gradient = axis === 'y' ? vertical : horizontal;
			// Clear any composite left over from a previous 'both' configuration.
			element.style.removeProperty('mask-composite');
			element.style.removeProperty('-webkit-mask-composite');
		}

		element.style.maskImage = gradient;
		element.style.webkitMaskImage = gradient;
	}

	function updateFaders(state: OverflowState) {
		if (fade.type === 'element') {
			const size = fade.size;
			if (faders.top) faders.top.style.height = state.overflowTop ? size : '0';
			if (faders.bottom) faders.bottom.style.height = state.overflowBottom ? size : '0';
			if (faders.left) faders.left.style.width = state.overflowLeft ? size : '0';
			if (faders.right) faders.right.style.width = state.overflowRight ? size : '0';
		} else if (fade.type === 'mask') {
			const percent = fade.fadePercent;
			const edges = activeEdges(axis, sides);

			// Update CSS custom properties for smooth transitions.
			// Untouched edges stay at their no-fade defaults (0 / 100).
			if (edges.top) element.style.setProperty('--fade-top', state.overflowTop ? `${percent}` : '0');
			if (edges.bottom)
				element.style.setProperty('--fade-bottom', state.overflowBottom ? `${100 - percent}` : '100');
			if (edges.left)
				element.style.setProperty('--fade-left', state.overflowLeft ? `${percent}` : '0');
			if (edges.right)
				element.style.setProperty('--fade-right', state.overflowRight ? `${100 - percent}` : '100');
		}
	}

	function init() {
		// Set up visual elements
		if (fade.type === 'element') {
			createElementFaders(fade);
		} else {
			originalStyle = element.style.cssText || '';
			setupMaskCSS();
		}

		// Set up overflow checking with callback to update faders
		overflowChecker = createOverflowChecker(element, {
			axis,
			sides,
			onOverflow: updateFaders
		});
	}

	function destroy() {
		// Clean up overflow checker
		overflowChecker?.destroy();

		// Clean up visual elements
		if (fade.type === 'element') {
			(Object.values(faders) as (HTMLDivElement | undefined)[]).forEach((f) => f?.remove());
			faders = {};
		} else if (originalStyle !== null) {
			element.style.cssText = originalStyle;
		}
	}

	function update(newOptions: OverflowFadeOptions) {
		const newSides = newOptions.sides ?? 'both';

		// A change to fade type, axis, or sides changes which faders/masks exist, so rebuild.
		if (
			fade.type !== newOptions.fade?.type ||
			axis !== newOptions.axis ||
			sides !== newSides
		) {
			destroy();
			options = newOptions;
			axis = newOptions.axis;
			sides = newSides;
			fade = newOptions.fade || { type: 'mask', fadePercent: 10 };
			init();
		} else {
			// Just update the parameters in place.
			fade = newOptions.fade || { type: 'mask', fadePercent: 10 };
			overflowChecker?.update({ axis, sides, onOverflow: updateFaders });
		}
	}

	// Initialize
	init();

	return {
		destroy,
		update
	};
}

export function overflowFadeAction(element: HTMLElement, options: OverflowFadeOptions) {
	return createOverflowFade(element, options);
}

/**
 * Attachment version of overflowFade for Svelte 5.29+
 * Use with {@attach overflowFade(options)}
 */
export function overflowFade(options: OverflowFadeOptions) {
	return (element: HTMLElement) => {
		const { destroy } = createOverflowFade(element, options);
		return destroy;
	};
}
