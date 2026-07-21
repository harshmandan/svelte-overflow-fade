import { tick } from 'svelte';

export type OverflowState = {
	overflowLeft: boolean;
	overflowRight: boolean;
	overflowTop: boolean;
	overflowBottom: boolean;
};

/**
 * Which edge(s) to fade/check, relative to the axis.
 * - `'both'` (default): start and end
 * - `'start'`: top for axis `'y'`, left for axis `'x'`
 * - `'end'`: bottom for axis `'y'`, right for axis `'x'`
 */
export type FadeSides = 'both' | 'start' | 'end';

export type OverflowFadeOptions = {
	axis: 'x' | 'y';
	sides?: FadeSides;
	fade?: FadeConfig;
};

export type OverflowCheckOptions = {
	axis: 'x' | 'y';
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

function ensureMaskStyles() {
	let styleElement = document.querySelector('style[data-overflow-fade-styles]') as HTMLStyleElement;
	const styleContent = `
		@property --fade-start {
			syntax: '<number>';
			initial-value: 0;
			inherits: false;
		}
		@property --fade-end {
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
	axis: 'x' | 'y',
	sides: FadeSides = 'both'
): OverflowState {
	const state: OverflowState = {
		overflowLeft: false,
		overflowRight: false,
		overflowTop: false,
		overflowBottom: false
	};

	// Only measure the edge(s) we actually care about.
	const checkStart = sides !== 'end';
	const checkEnd = sides !== 'start';

	if (axis === 'y') {
		if (checkStart) state.overflowTop = Math.floor(element.scrollTop) > 0;
		if (checkEnd)
			state.overflowBottom =
				Math.round(element.clientHeight + element.scrollTop) < element.scrollHeight;
	} else {
		if (checkStart) state.overflowLeft = Math.floor(element.scrollLeft) > 0;
		if (checkEnd)
			state.overflowRight =
				Math.round(element.clientWidth + element.scrollLeft) < element.scrollWidth;
	}

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
	let isVertical = axis === 'y';

	let startFader: HTMLDivElement | null = null;
	let endFader: HTMLDivElement | null = null;
	let originalStyle: string | null = null;
	let overflowChecker: ReturnType<typeof createOverflowChecker> | null = null;

	function createElementFaders(config: Extract<FadeConfig, { type: 'element' }>) {
		const baseStyles = `
			position: absolute;
			pointer-events: none;
			transition: ${isVertical ? 'height' : 'width'} 150ms;
			z-index: ${config.zIndex ?? 10};
			${isVertical ? 'height: 0; left: 0; right: 0;' : 'width: 0; top: 0; bottom: 0;'}
		`;

		const gradientDir = isVertical ? 'bottom' : 'right';
		const oppositeDir = isVertical ? 'top' : 'left';

		// Only create the fader(s) for the requested side(s).
		if (sides !== 'end') {
			startFader = document.createElement('div');
			startFader.style.cssText = `
				${baseStyles}
				${isVertical ? 'top: 0;' : 'left: 0;'}
				background: linear-gradient(to ${gradientDir},
					${config.backgroundColor} 0%,
					${config.backgroundColor} 10%,
					transparent 100%);
			`;
			element.parentElement?.appendChild(startFader);
		}

		if (sides !== 'start') {
			endFader = document.createElement('div');
			endFader.style.cssText = `
				${baseStyles}
				${isVertical ? 'bottom: 0;' : 'right: 0;'}
				background: linear-gradient(to ${oppositeDir},
					${config.backgroundColor} 0%,
					${config.backgroundColor} 10%,
					transparent 100%);
			`;
			element.parentElement?.appendChild(endFader);
		}
	}

	function setupMaskCSS() {
		// Ensure global styles exist
		ensureMaskStyles();

		// Set up the element styles
		element.style.setProperty('--fade-start', '0');
		element.style.setProperty('--fade-end', '100');
		element.style.transition = '--fade-start 300ms ease, --fade-end 300ms ease';
		
		const gradient = `linear-gradient(to ${isVertical ? 'bottom' : 'right'}, 
			transparent 0%, 
			black calc(var(--fade-start) * 1%), 
			black calc(var(--fade-end) * 1%), 
			transparent 100%)`;
		
		element.style.maskImage = gradient;
		element.style.webkitMaskImage = gradient;
	}

	function updateFaders(state: OverflowState) {
		if (fade.type === 'element') {
			const size = fade.size;
			if (isVertical) {
				if (startFader) startFader.style.height = state.overflowTop ? size : '0';
				if (endFader) endFader.style.height = state.overflowBottom ? size : '0';
			} else {
				if (startFader) startFader.style.width = state.overflowLeft ? size : '0';
				if (endFader) endFader.style.width = state.overflowRight ? size : '0';
			}
		} else if (fade.type === 'mask') {
			const percent = fade.fadePercent;

			// Update CSS custom properties for smooth transitions.
			// Untouched sides stay at their no-fade defaults (0 / 100).
			if (sides !== 'end') {
				const hasStartOverflow = isVertical ? state.overflowTop : state.overflowLeft;
				element.style.setProperty('--fade-start', hasStartOverflow ? `${percent}` : '0');
			}
			if (sides !== 'start') {
				const hasEndOverflow = isVertical ? state.overflowBottom : state.overflowRight;
				element.style.setProperty('--fade-end', hasEndOverflow ? `${100 - percent}` : '100');
			}
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
			startFader?.remove();
			endFader?.remove();
		} else if (originalStyle !== null) {
			element.style.cssText = originalStyle;
		}
	}

	function update(newOptions: OverflowFadeOptions) {
		const newSides = newOptions.sides ?? 'both';

		// A change to fade type or sides changes which faders exist, so rebuild.
		if (fade.type !== newOptions.fade?.type || sides !== newSides) {
			destroy();
			options = newOptions;
			axis = newOptions.axis;
			sides = newSides;
			fade = newOptions.fade || { type: 'mask', fadePercent: 10 };
			isVertical = axis === 'y';
			init();
		} else {
			// Just update the parameters in place.
			axis = newOptions.axis;
			fade = newOptions.fade || { type: 'mask', fadePercent: 10 };
			isVertical = axis === 'y';
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