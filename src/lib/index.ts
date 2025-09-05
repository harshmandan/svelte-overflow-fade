import { tick } from 'svelte';

export type OverflowState = {
	overflowLeft: boolean;
	overflowRight: boolean;
	overflowTop: boolean;
	overflowBottom: boolean;
};

export type OverflowFadeOptions = {
	axis: 'x' | 'y';
	fade?: FadeConfig;
};

export type OverflowCheckOptions = {
	axis: 'x' | 'y';
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

function checkOverflow(element: HTMLElement, axis: 'x' | 'y'): OverflowState {
	const state: OverflowState = {
		overflowLeft: false,
		overflowRight: false,
		overflowTop: false,
		overflowBottom: false
	};

	if (axis === 'y') {
		state.overflowTop = Math.floor(element.scrollTop) > 0;
		state.overflowBottom =
			Math.round(element.clientHeight + element.scrollTop) < element.scrollHeight;
	} else {
		state.overflowLeft = Math.floor(element.scrollLeft) > 0;
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
	let { axis, onOverflow } = options;
	let observer: MutationObserver | null = null;

	function handleOverflowCheck() {
		const state = checkOverflow(element, axis);
		
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
	let { axis, fade = { type: 'mask', fadePercent: 10 } } = options;
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

		startFader = document.createElement('div');
		endFader = document.createElement('div');

		const gradientDir = isVertical ? 'bottom' : 'right';
		const oppositeDir = isVertical ? 'top' : 'left';

		startFader.style.cssText = `
			${baseStyles}
			${isVertical ? 'top: 0;' : 'left: 0;'}
			background: linear-gradient(to ${gradientDir},
				${config.backgroundColor} 0%,
				${config.backgroundColor} 10%,
				transparent 100%);
		`;

		endFader.style.cssText = `
			${baseStyles}
			${isVertical ? 'bottom: 0;' : 'right: 0;'}
			background: linear-gradient(to ${oppositeDir},
				${config.backgroundColor} 0%,
				${config.backgroundColor} 10%,
				transparent 100%);
		`;

		element.parentElement?.appendChild(startFader);
		element.parentElement?.appendChild(endFader);
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
		if (fade.type === 'element' && startFader && endFader) {
			const size = fade.size;
			if (isVertical) {
				startFader.style.height = state.overflowTop ? size : '0';
				endFader.style.height = state.overflowBottom ? size : '0';
			} else {
				startFader.style.width = state.overflowLeft ? size : '0';
				endFader.style.width = state.overflowRight ? size : '0';
			}
		} else if (fade.type === 'mask') {
			const percent = fade.fadePercent;
			const hasStartOverflow = isVertical ? state.overflowTop : state.overflowLeft;
			const hasEndOverflow = isVertical ? state.overflowBottom : state.overflowRight;

			// Update CSS custom properties for smooth transitions
			element.style.setProperty('--fade-start', hasStartOverflow ? `${percent}` : '0');
			element.style.setProperty('--fade-end', hasEndOverflow ? `${100 - percent}` : '100');
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
		// Update overflow checker
		overflowChecker?.update({
			axis: newOptions.axis,
			onOverflow: updateFaders
		});
		
		// If fade type changed, rebuild everything
		if (fade.type !== newOptions.fade?.type) {
			destroy();
			options = newOptions;
			axis = newOptions.axis;
			fade = newOptions.fade || { type: 'mask', fadePercent: 10 };
			isVertical = axis === 'y';
			init();
		} else {
			// Just update the parameters
			axis = newOptions.axis;
			fade = newOptions.fade || { type: 'mask', fadePercent: 10 };
			isVertical = axis === 'y';
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