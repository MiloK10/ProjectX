<script>
	import Router from "svelte-spa-router";
	import routes from "./routes";

	import { onMount } from "svelte";
	let time = new Date();
	$: hours = time.getHours();
	$: minutes = time.getMinutes();
	$: seconds = time.getSeconds();

	onMount(() => {
		const interval = setInterval(() => {
			time = new Date();
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});

	// stores for clock
	import { time_opened, elapsed } from "./stores.js";
</script>

<!-- Navigation -->
<nav class="navbar navbar-expand-lg navbar-dark sticky-top bg-dark">
	<div class="container-fluid">
		<!-- dropbar button and nav brand -->
		<span>
			<button
				class="navbar-toggler"
				type="button"
				data-bs-toggle="collapse"
				data-bs-target="#navbarNavDropdown"
				aria-controls="navbarNavDropdown"
				aria-expanded="false"
				aria-label="Toggle navigation"
			>
				<span class="navbar-toggler-icon" />
			</button>
			<a class="navbar-brand" href="#/">
				<img
					src="/logo.jpg"
					class="img-thumbnail"
					alt="logo"
					id="logo"
				/> Project X
			</a>
		</span>

		<!-- Nav links -->
		<div class="collapse navbar-collapse" id="navbarNavDropdown">
			<ul class="navbar-nav">
				<li class="nav-item">
					<a class="nav-link" href="#/home">Home</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#/users">Users</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#/permissions">Permissions</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#/apps">Apps</a>
				</li>
				<li class="nav-item">
					<a class="nav-link" href="#/hosting">Hosting</a>
				</li>
			</ul>
		</div>

		<!-- clock -->
		<svg viewBox="-50 -50 100 100">
			<circle class="clock-face" r="48" />
			<!-- markers -->
			{#each [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] as minute}
				<line
					class="major"
					y1="35"
					y2="45"
					transform="rotate({30 * minute})"
				/>

				{#each [1, 2, 3, 4] as offset}
					<line
						class="minor"
						y1="42"
						y2="45"
						transform="rotate({6 * (minute + offset)})"
					/>
				{/each}
			{/each}
			<!-- hours -->
			<line
				class="hour"
				y1="2"
				y2="-20"
				transform="rotate({30 * hours + minutes / 2})"
			/>
			<!-- minutes -->
			<line
				class="minute"
				y1="4"
				y2="-30"
				transform="rotate({6 * minutes + seconds / 10})"
			/>
		</svg>
	</div>
</nav>

<div class="container my-3 p-3" id="main">
	<!-- Here we load the page depending on the current URL -->
	<Router {routes} />

	<!-- Footer -->
	<div class="row pt-2 mt-2" id="footer">
		<div class="container mb-2">
			You have been on my page for: 
			{$elapsed}
			{$elapsed === 1 ? "second" : "seconds"}
		</div>
		<!-- Logo -->
		<div class="col-2">
			<img src="/logo.jpg" class="img-thumbnail" alt="logo" />
		</div>

		<!-- Page info -->
		<div class="col-4">
			<h5>&#169; 1998-2021 Milosz Kruczek</h5>
			<h5>Hosting: <a href="#/hosting">Lorem ipsum</a></h5>
			<p>
				Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
				commodo ligula eget dolor. Aenean massa. Cum sociis natoque
				penatibus et magnis dis parturient montes, nascetur ridiculus
				mus. Donec quam felis, ultricies nec, pellentesque eu, pretium
				quis, sem.
			</p>
		</div>

		<!-- Page map -->
		<div class="col-3">
			<h4>Page map</h4>
			<ul class="list-unstyled">
				<li>
					<a href="#/home">Home</a>
				</li>
				<li>
					<a href="#/users">Users</a>
				</li>
				<li>
					<a href="#/create-user">Create user</a>
				</li>
				<li>
					<a href="#/permissions">Permissions</a>
				</li>
				<li>
					<a href="#/apps">Apps</a>
				</li>
				<li>
					<a href="#/hosting">Hosting</a>
				</li>
			</ul>
		</div>

		<!-- Social links -->
		<div class="col-3">
			<h4>Find me on:</h4>
			<ul class="list-unstyled">
				<li class="my-2">
					<a href="https://www.facebook.com"
						><img
							src="/images/fb.png"
							alt="fb-logo"
							id="brand-logo"
						/></a
					>
					<a
						href="https://www.facebook.com"
						class="btn btn-light btn-outline-primary border-2"
						>Facebook</a
					>
				</li>
				<li class="my-2">
					<a href="https://www.twitter.com"
						><img
							src="/images/tt.png"
							alt="tt-logo"
							id="brand-logo"
						/></a
					>
					<a
						href="https://www.twitter.com"
						class="btn btn-light btn-outline-primary border-2"
						>Twitter</a
					>
				</li>
				<li class="my-2">
					<a href="https://www.instagram.com"
						><img
							src="/images/ig.png"
							alt="ig-logo"
							id="brand-logo"
						/></a
					>
					<a
						href="https://www.instagram.com"
						class="btn btn-light btn-outline-warning border-2"
						>Instagram</a
					>
				</li>
				<li class="my-2">
					<a href="https://www.youtube.com"
						><img
							src="/images/yt.png"
							alt="yt-logo"
							id="brand-logo"
						/></a
					>
					<a
						href="https://www.youtube.com"
						class="btn btn-light btn-outline-danger border-2"
						>YouTube</a
					>
				</li>
				<li class="mt-2">
					<a href="https://www.linkedin.com"
						><img
							src="/images/lin.jpg"
							alt="li-logo"
							id="brand-logo"
						/></a
					>
					<a
						href="https://www.linkedin.com"
						class="btn btn-light btn-outline-primary border-2"
						>LinkedIn</a
					>
				</li>
			</ul>
		</div>
	</div>
</div>

<style>
	/* clock */
	svg {
		width: 50px;
		height: 50px;
	}

	.clock-face {
		stroke: rgba(160, 7, 7, 0.774);
		stroke-width: 4;
		fill: white;
	}

	.minor {
		stroke: white;
		stroke-width: 0.5;
	}

	.major {
		stroke: white;
		stroke-width: 1;
	}

	.hour {
		stroke: black;
		stroke-width: 4;
	}

	.minute {
		stroke: black;
		stroke-width: 4;
	}
</style>
