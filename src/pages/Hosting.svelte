<script>
	// transtions directive
	import { quintOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	const [send, receive] = crossfade({
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: t => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});

	let checks = [
		{ id: 1, done: false, description: 'Home' },
		{ id: 2, done: false, description: 'Users' },
		{ id: 3, done: false, description: 'User details' },
		{ id: 4, done: false, description: 'Create users' },
		{ id: 5, done: false, description: 'Permissions' },
		{ id: 6, done: false, description: 'Nodes' },
		{ id: 7, done: false, description: 'Apps' },
        { id: 8, done: false, description: 'App Details'},
        { id: 9, done: false, description: 'Hosting'},
	];

	// each block bindings 
	let todos = [
		{ done: false, text: 'clock in navigation bar' },
		{ done: false, text: 'transitions on homepage' },
		{ done: false, text: 'reactive statements on homepage' },
		{ done: false, text: 'animate directive on hosting page' },
		{ done: false, text: 'each block bindings on hosting page' },
		{ done: false, text: 'form with validation' },
		{ done: false, text: 'derived stores - time spent on page in footer' },
		{ done: false, text: 'bootstrap elements - tables, accordions, buttons, along with container and other more boring parts' },
		{ done: false, text: 'css for styling, both global and per page' },
	];

	function addToDO() {
		todos = todos.concat({ done: false, text: '' });
	}

	function clear() {
		todos = todos.filter(t => !t.done);
	}

	$: remaining = todos.filter(t => !t.done).length;
</script>

<h1>I wanted to do something cool but I didn't have and idea to design any of these elements into what I had in my data</h1>

<!-- To-do's -->
<div class="container my-2">
	<h3>Elements</h3>
	{#each todos as todo}
		<div class="my-2">
			<input type=checkbox bind:checked={todo.done}>
			<input placeholder="Task" bind:value={todo.text} disabled={todo.done} id="todo">
		</div>
	{/each}

	<span>
		<button class="btn btn-outline-success border-2" on:click={addToDO}>
			Add new task
		</button>
		
		<button class="btn btn-outline-danger border-2" on:click={clear}>
			Clear completed tasks
		</button>

		{remaining} {remaining===1 ? 'task' : 'tasks'} left to do
	</span>

</div>

<!-- Checked pages -->
<div class='row p-3 m-2' id="directive">

	<div class='left'>
		<h2>Pages to check</h2>
		{#each checks.filter(t => !t.done) as check (check.id)}
			<label
				in:receive="{{key: check.id}}"
				out:send="{{key: check.id}}"
				animate:flip
			>
				<input type=checkbox bind:checked={check.done}>
				{check.description}
			</label>
		{/each}
	</div>

    <div class='right'>
		<h2>Pages checked</h2>
		{#each checks.filter(t => t.done) as check (check.id)}
			<label
				in:receive="{{key: check.id}}"
				out:send="{{key: check.id}}"
				animate:flip
			>
				<input type=checkbox bind:checked={check.done}>
				{check.description}
			</label>
		{/each}
	</div>

</div>

<style>
	.left, .right {
		float: left;
		width: 25%;
		padding: 0 1em 0 0;
		box-sizing: border-box;
        margin-left: auto;
        margin-right: auto;
	}

    label {
		top: 0;
		left: 0;
		display: block;
		font-size: 1em;
		line-height: 1;
		padding: 0.5em;
		margin: 0 auto 0.5em auto;
		border-radius: 2px;
		background-color: rgb(255, 115, 115);
		user-select: none;
	}

	.right label {
		background-color: rgb(144, 246, 10);
	}

</style>