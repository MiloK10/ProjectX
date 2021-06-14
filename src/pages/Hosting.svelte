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
		{ id: 6, done: false, description: 'Locations' },
        { id: 7, done: false, description: 'Location Details'},
        { id: 8, done: false, description: 'Hosting'},
	];

	// let uid = checks.length + 1;

	// function add(input) {
	// 	const check = {
	// 		id: uid++,
	// 		done: false,
	// 		description: input.value
	// 	};

	// 	checks = [check, ...checks];
	// 	input.value = '';
	// }

	// each block bindings 
	let todos = [
		{ done: false, text: 'clock - navigation' },
		{ done: false, text: 'transitions directive - anywhere - no additional things needed' },
		{ done: false, text: 'reactive statements - anywhere - no additional things needed' },
		{ done: false, text: 'add svelte window bindings - homepage - no additional things needed' },
		{ done: false, text: 'each block bindings - form or hosting - no additional things needed' },
		{ done: false, text: 'inputs and validation for the forms - need to consult' },
		{ done: false, text: 'derived stores - footer or bottom of the page - need to consult' },
		{ done: false, text: 'modal - anywhere - need to consult' },
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
	<h3>To-do's</h3>
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

		{remaining} tasks left to do
	</span>

</div>

<!-- List of things to do -->
<ul>
    <li>inputs and validation for the forms - need to consult</li>
	<li>consult on how to get some .js and other files to work as elements in svelte</li>
    <li>derived stores - footer or bottom of the page - need to consult</li>
    <li>slot props - anywhere - need to consult</li>
    <li>modal - anywhere - need to consult</li>
	<li><del>clock - navigation</del></li>
    <li><del>transitions directive - anywhere - no additional things needed</del></li>
    <li><del>reactive statements - anywhere - no additional things needed</del></li>
    <li><del>each block bindings - form or hosting - no additional things needed</del></li> 
</ul>

<!-- Checked pages -->
<div class='row p-3 m-2' id="directive">
	<!-- <input
		class="new-check"
		placeholder="what needs to be done?"
		on:keydown="{event => event.key === 'Enter' && add(event.target)}"
	> -->
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
				<!-- <button on:click="{() => remove(check)}">x</button> -->
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
				<!-- <button on:click="{() => remove(check)}">x</button> -->
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