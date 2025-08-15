<script lang="ts">
	interface Props {
		src?: string;
		size?: string;
		duration?: number;
	}

	let { src = '/favicon.svg', size = '48px', duration = 8 }: Props = $props();
</script>

<div
	class="border dark:!border-gray-800"
	style="border-color: #d5dce2 #d5dce2 #b8c2cc; transform: perspective(75em) rotateX(40deg); box-shadow: rgba(22, 31, 39, 0.42) 0px 60px 123px -25px, rgba(19, 26, 32, 0.08) 0px 35px 75px -35px; border-radius: 10px;"
>
	<div
		class="logo-container relative overflow-hidden inline-block bg-gray-100 dark:bg-gray-950 p-1"
		style="--duration: {duration}s;"
	>
		<img {src} alt="Logo" class="logo-img size-full" />
	</div>
</div>

<style>
	.logo-container {
		mask-image: linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%);
		-webkit-mask-image: linear-gradient(
			to bottom,
			transparent 0%,
			black 40%,
			black 60%,
			transparent 100%
		);
	}

	.logo-img {
		display: block;
		animation: spin-jump var(--duration) ease-out infinite;
	}

	@keyframes spin-jump {
		0% {
			transform: translateY(0%);
		}
		5% {
			transform: translateY(30%);
		}
		8% {
			transform: translateY(0%);
		}
		8.5% {
			transform: translateY(150%);
		}

		10% {
			transform: translateY(-150%);
		}
		10.01% {
			transform: translateY(150%);
		}
		11.5% {
			transform: translateY(-150%);
		}
		11.51% {
			transform: translateY(150%);
		}
		13% {
			transform: translateY(-150%);
		}
		13.01% {
			transform: translateY(150%);
		}
		14.5% {
			transform: translateY(-150%);
		}
		14.51% {
			transform: translateY(150%);
		}
		16.5% {
			transform: translateY(-150%);
		}
		16.51% {
			transform: translateY(150%);
		}
		19% {
			transform: translateY(-150%);
		}
		19.01% {
			transform: translateY(150%);
		}
		22% {
			transform: translateY(-150%);
		}
		22.01% {
			transform: translateY(150%);
		}
		/* Final slow pass and stop */
		25% {
			transform: translateY(50%);
		}
		28% {
			transform: translateY(-20%);
		}
		30% {
			transform: translateY(5%);
		}
		31% {
			transform: translateY(-2%);
		}
		32%,
		100% {
			transform: translateY(0%);
		}
	}
</style>
