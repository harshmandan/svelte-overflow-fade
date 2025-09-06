<script lang="ts">
	import { overflowFade, isOverflowingAction, isOverflowing } from '$lib';
	import Logo from './Logo.svelte';
	import type { ChangeEventHandler } from 'svelte/elements';
	import { fade } from 'svelte/transition';

	type AXIS = 'x' | 'y';
	type CONTROL = 'mask' | 'element';
	type BACKGROUND = 'solid' | 'gradient';

	let axis: AXIS = $state('y');
	let fadeType: CONTROL = $state('mask');
	let background: BACKGROUND = $state('solid');

	let showLeftScrollBtn = $state(false);
	let showRightScrollBtn = $state(false);
	let scrollContainer: HTMLDivElement;

	const AXIS_OPTIONS = [
		{ value: 'x', label: 'Horizontal' },
		{ value: 'y', label: 'Vertical' }
	];

	const CONTROL_OPTIONS = [
		{ value: 'mask', label: 'CSS Mask' },
		{ value: 'element', label: 'Element (JS Based)' }
	];

	const BACKGROUND_OPTIONS = [
		{ value: 'solid', label: 'Solid' },
		{ value: 'gradient', label: 'Gradient' }
	];

	const actionExampleCode = `<${'script'}>
  import { overflowFadeAction } from 'svelte-overflow-fade';
</${'script'}>

<div 
  class="overflow-auto max-h-64"
  use:overflowFadeAction={{
    axis: 'y',
    fade: { 
      type: 'mask', 
      fadePercent: 10 
    }
  }}
  onoverflow={({ detail }) => {
    // Also emits overflow events!
    console.log(detail.overflowTop, detail.overflowBottom);
  }}
>
  <!-- Scrollable content -->
</div>`;

	const attachmentCodeExample = `<${'script'}>
  import { overflowFade } from 'svelte-overflow-fade';
</${'script'}>

<div 
  class="overflow-auto max-h-64"
  {@attach overflowFade({
    axis: 'y',
    fade: { 
      type: 'mask', 
      fadePercent: 10 
    }
  })}
>
  <!-- Scrollable content -->
</div>`;

	const isOverflowingExampleCode = `<${'script'}>
  import { isOverflowingAction } from 'svelte-overflow-fade';
  
  let showLeftBtn = $state(false);
  let showRightBtn = $state(false);
</${'script'}>

<div 
  class="relative"
>
  <div
    class="overflow-auto"
    use:isOverflowingAction={{ 
      axis: 'x' 
    }}
    onoverflow={({ detail }) => {
      showLeftBtn = detail.overflowLeft;
      showRightBtn = detail.overflowRight;
    }}
  >
    <!-- Scrollable content -->
  </div>
  
  {#if showLeftBtn}
    <button class="absolute left-4">←</button>
  {/if}
  
  {#if showRightBtn}
    <button class="absolute right-4">→</button>
  {/if}
</div>`;

	function scrollTo(direction: 'left' | 'right') {
		if (!scrollContainer) return;
		const scrollAmount = 200;
		scrollContainer.scrollBy({
			left: direction === 'left' ? -scrollAmount : scrollAmount,
			behavior: 'smooth'
		});
	}
</script>

<div class="min-h-screen">
	<div class="max-w-6xl mx-auto p-8 font-mono">
		<div class="flex items-center justify-between mb-8">
			<div class="flex items-center gap-8">
				<Logo />
				<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">svelte-overflow-fade</h1>
			</div>
			<a
				href="https://github.com/harshmandan/svelte-overflow-fade"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				aria-label="View on GitHub"
			>
				<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
					<path
						fill-rule="evenodd"
						d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
						clip-rule="evenodd"
					/>
				</svg>
				<span>GitHub</span>
			</a>
		</div>

		<section
			class="rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors"
		>
			<h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
				@attach overflowFade (Attachment)
			</h2>
			<div class="flex gap-4 mb-6 flex-wrap">
				{@render Select('Axis', AXIS_OPTIONS, axis, (e) => (axis = e.currentTarget.value as AXIS))}
				{@render Select(
					'Fade type',
					CONTROL_OPTIONS,
					fadeType,
					(e) => (fadeType = e.currentTarget.value as CONTROL)
				)}
				{@render Select(
					'Background',
					BACKGROUND_OPTIONS,
					background,
					(e) => (background = e.currentTarget.value as BACKGROUND)
				)}
			</div>

			<div
				class={[
					'relative border rounded border-gray-300 dark:border-gray-600',
					background === 'gradient'
						? 'bg-gradient-to-br from-blue-400 via-green-500 to-yellow-500'
						: 'bg-gray-50 dark:bg-gray-900'
				]}
			>
				<div
					class="rounded p-4 overflow-auto max-h-72 flex gap-4"
					class:flex-col={axis === 'y'}
					{@attach overflowFade({
						axis: axis,
						fade:
							fadeType === 'mask'
								? { type: 'mask', fadePercent: 10 }
								: {
										type: 'element',
										size: '60px',
										backgroundColor: window.matchMedia('(prefers-color-scheme: dark)').matches
											? '#101828'
											: 'white'
									}
					})}
				>
					{#each Array(50) as _, i}
						<div
							class="{background === 'gradient'
								? 'bg-white/80 backdrop-blur-sm text-gray-900'
								: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'} p-4 rounded whitespace-nowrap"
						>
							Item {i + 1}
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section
			class="rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors"
		>
			<h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
				isOverflowing (Overflow Detection Only)
			</h2>
			<p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
				Use this to detect container overflow and show/hide scroll controls. Note: The overflowFade
				action also emits these same events while adding visual fades.
			</p>

			<div class="relative group">
				<div
					bind:this={scrollContainer}
					class="rounded p-4 overflow-x-auto border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
					{@attach isOverflowing({
						axis: 'x'
					})}
					onoverflow={({ detail }) => {
						showLeftScrollBtn = detail.overflowLeft;
						showRightScrollBtn = detail.overflowRight;
					}}
				>
					<div class="flex gap-4">
						{#each Array(20) as _, i}
							<div
								class="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-4 rounded whitespace-nowrap"
							>
								Item {i + 1}
							</div>
						{/each}
					</div>
				</div>

				{#if showLeftScrollBtn}
					{@render ScrollButton('left')}
				{/if}
				{#if showRightScrollBtn}
					{@render ScrollButton('right')}
				{/if}
			</div>

			<div class="mt-6">
				<h3 class="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Example Code</h3>
				<div
					class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto border border-black/10 dark:border-gray-600"
				>
					<pre class="text-sm dark:text-white"><code>{isOverflowingExampleCode}</code></pre>
				</div>
			</div>
		</section>

		<section
			class="rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700 transition-colors bg-white dark:bg-gray-800"
		>
			<h2 class="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
				Installation & Usage
			</h2>

			<div class="mb-6 p-4 border border-black/10 rounded-lg">
				<h3 class="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Install</h3>
				<div class="space-y-3">
					<div class="flex items-center gap-2">
						<span
							class="text-sm font-mono bg-white dark:bg-gray-800 select-all px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600"
						>
							npm install svelte-overflow-fade
						</span>
					</div>
					<div class="flex items-center gap-2">
						<span
							class="text-sm font-mono bg-white dark:bg-gray-800 select-all px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600"
						>
							pnpm add svelte-overflow-fade
						</span>
					</div>
					<div class="flex items-center gap-2">
						<span
							class="text-sm font-mono bg-white dark:bg-gray-800 select-all px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600"
						>
							yarn add svelte-overflow-fade
						</span>
					</div>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-6">
				<div>
					<h3 class="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Action API</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
						Compatible with all Svelte versions
					</p>
					<div
						class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto border border-black/10 dark:border-gray-600"
					>
						<pre class="text-sm dark:text-white"><code>{actionExampleCode}</code></pre>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
						Attachment API
					</h3>
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
						Svelte 5.29+ with enhanced reactivity
					</p>
					<div
						class="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto border border-black/10 dark:border-gray-600"
					>
						<pre class="text-sm dark:text-white"><code>{attachmentCodeExample}</code></pre>
					</div>
				</div>
			</div>

			<div class="mt-6 p-4 bg-orange-50 dark:bg-blue-900/20 rounded-lg">
				<h4 class="font-semibold text-sm mb-2 text-orange-700 dark:text-blue-300">
					Configuration Options
				</h4>
				<div class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
					<div>
						<span class="font-mono bg-orange-200 dark:bg-gray-700 px-1 rounded">axis</span>: 'x' |
						'y' - Scroll direction
					</div>
					<div>
						<span class="font-mono bg-orange-200 dark:bg-gray-700 px-1 rounded">fade.type</span>:
						'mask' | 'element' - Fade implementation
					</div>
					<div>
						<span class="font-mono bg-orange-200 dark:bg-gray-700 px-1 rounded"
							>fade.fadePercent</span
						>: number - Fade size (mask mode)
					</div>
					<div>
						<span class="font-mono bg-orange-200 dark:bg-gray-700 px-1 rounded">fade.size</span>:
						string - Fade size (element mode)
					</div>
					<div>
						<span class="font-mono bg-orange-200 dark:bg-gray-700 px-1 rounded"
							>fade.backgroundColor</span
						>: string - Fade color (element mode)
					</div>
				</div>
			</div>

			<div class="mt-6 p-4 bg-blue-50 dark:bg-yellow-900/20 rounded-lg">
				<h4 class="font-semibold text-sm mb-2 text-blue-700 dark:text-yellow-300">
					TypeScript: Custom Event Types
				</h4>
				<p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
					To avoid TypeScript errors with the <span class="font-mono bg-blue-200 dark:bg-gray-700 px-1 rounded">onoverflow</span> event, add this to your <span class="font-mono bg-blue-200 dark:bg-gray-700 px-1 rounded">app.d.ts</span> or a separate <span class="font-mono bg-blue-200 dark:bg-gray-700 px-1 rounded">.d.ts</span> file:
				</p>
				<div class="bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-x-auto border border-black/10 dark:border-gray-600">
					<pre class="text-xs dark:text-white"><code>{`/// <reference types="svelte" />
import type { OverflowState } from 'svelte-overflow-fade';

declare global {
  namespace svelteHTML {
    interface HTMLAttributes<T> {
      // Svelte 5 syntax
      'onoverflow'?: (e: CustomEvent<OverflowState>) => void;
      // Svelte 4 syntax (if needed)
      'on:overflow'?: (e: CustomEvent<OverflowState>) => void;
    }
  }
}

export {};`}</code></pre>
				</div>
				<p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
					Note: The <span class="font-mono bg-blue-200 dark:bg-gray-700 px-1 rounded">declare global</span> wrapper is essential for the types to work correctly.
				</p>
			</div>
		</section>
	</div>
</div>

{#snippet Select(
	label: string,
	options: { value: string; label: string }[],
	value: string,
	onchange: ChangeEventHandler<HTMLSelectElement>
)}
	<label class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
		{label}:
		<select
			{value}
			{onchange}
			class="px-2 py-1 border border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
		>
			{#each options as { value, label } (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</label>
{/snippet}

{#snippet ScrollButton(direction: 'left' | 'right')}
	<div
		transition:fade={{ duration: 150 }}
		class="absolute inset-y-0 z-10 flex items-center {direction === 'left' ? 'left-2' : 'right-2'}"
	>
		<button
			onclick={() => scrollTo(direction)}
			class="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
			aria-label="Scroll {direction}"
		>
			<svg
				class="w-5 h-5 text-gray-700 dark:text-gray-300"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				{#if direction === 'left'}
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				{/if}
			</svg>
		</button>
	</div>
{/snippet}
