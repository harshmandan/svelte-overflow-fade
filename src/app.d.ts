/// <reference types="svelte" />
import type { OverflowState } from '$lib';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	namespace svelteHTML {
		interface HTMLAttributes<T> {
			'onoverflow'?: (e: CustomEvent<OverflowState>) => void;
		}
	}
}

export {};
