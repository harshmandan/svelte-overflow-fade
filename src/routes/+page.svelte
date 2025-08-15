<script lang="ts">
	import { overflowFade } from '$lib';
	import Logo from './Logo.svelte';
	import type { ChangeEventHandler } from 'svelte/elements';

	type AXIS = 'x' | 'y';
	type CONTROL = 'mask' | 'element';
	type BACKGROUND = 'solid' | 'gradient';

	let axis: AXIS = $state('y');
	let fadeType: CONTROL = $state('mask');
	let background: BACKGROUND = $state('solid');

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
</script>

<div class="min-h-screen">
	<div class="max-w-6xl mx-auto p-8 font-mono">
		<div class="flex items-center gap-8 mb-8">
			<Logo />
			<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Svelte Overflow Fade Demo</h1>
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
