<script>
    // transitions
    import { slide } from "svelte/transition";
    let visible = false;

    // statements
    let count = 5;

    $: if (count <= 0) {
        alert(`here is the link: https://1drv.ms/v/s!AlawxW0w_xgdgdwVBNJZicjvEfyJPQ?e=qA7F5u`);
        count = 1;
    }

    function handleClick() {
        count -= 1;
    }
</script>

<div class="my-2" style="text-align: center">
    <img class="img-fluid logo" alt="Krakow" src="images/krakow.jpg" />
</div>

<h1 class="p-3">Welcome to my final project from Web Engineering</h1>

<!-- Checkbox to reveal video -->
<div class="text-center">
    <label class="checkbox">
        <input type="checkbox" bind:checked={visible} />
        <span class="mx-2"
            >Click here to see the screencast of website's functions</span
        >
    </label>
</div>

<!-- Inside of the checkbox -->
{#if visible}
    <div in:slide={{ y: 200, duration: 1000 }} out:slide={{ y: 200, duration: 1000 }} class="row text-center px-3 pb-3">
        <h2>It's in the attached files</h2>

        <div class="mb-2">
            <button class="btn btn-outline-success border-2" on:click={handleClick}>
                Click {count} more {count===1 ? 'time' : 'times'} to get the link to the screencast
            </button>
        </div>

        <div class="ratio ratio-16x9 w-75 mx-auto">
            <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="YouTube Video"
                allowfullscreen
            />
        </div>
    </div>
{/if}

<style>
</style>
