import { readable, derived } from 'svelte/store';

export const time_opened = readable(new Date(), function start(set) {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

const start = new Date();

export const elapsed = derived(
	time_opened,
	$time_opened => Math.round(($time_opened - start) / 1000)
);