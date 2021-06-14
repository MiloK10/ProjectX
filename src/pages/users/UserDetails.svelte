<script>
    import axios from "axios";
    export let params = {};

    let userId;
    let user = {};

    $: {
        userId = params.id;
        getUser();
    }

    function getUser() {
        axios
            .get("http://localhost:8080/projectx/users/id/" + userId)
            .then((response) => {
                user = response.data;
            });
    }

    // hovers
    import Hoverable from "./Hoverable.svelte";
</script>

<h1>Personal details for <b>{user.name}</b></h1>

<!-- buttons for navigation -->
<div class="my-2">
    <a href="#/users" class="btn btn-outline-danger border-2">Go to all users</a
    >
    <a href="#/permissions" class="btn btn-warning border-2"
        >Go to all permissions</a
    >
</div>

<!-- accordion with details -->
<div class="accordion" id="details">
    <div class="accordion-item">
        <h2 class="accordion-header" id="flush-email">
            <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#flush-collapseEmail"
                aria-expanded="false"
                aria-controls="flush-collapseEmail"
            >
                Email
            </button>
        </h2>
        <div
            id="flush-collapseEmail"
            class="accordion-collapse collapse"
            aria-labelledby="flush-email"
            data-bs-parent="#details"
        >
            <div class="accordion-body">
                <a href={"mailto:" + user.email}>{user.email}</a>
            </div>
        </div>
    </div>
    <div class="accordion-item">
        <h2 class="accordion-header" id="flush-city">
            <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#flush-collapseCity"
                aria-expanded="false"
                aria-controls="flush-collapseCity"
            >
                Place of residence
            </button>
        </h2>
        <div
            id="flush-collapseCity"
            class="accordion-collapse collapse"
            aria-labelledby="flush-city"
            data-bs-parent="#details"
        >
            <div class="accordion-body">{user.city}</div>
        </div>
    </div>
    <div class="accordion-item">
        <h2 class="accordion-header" id="flush-age">
            <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#flush-collapseAge"
                aria-expanded="false"
                aria-controls="flush-collapseAge"
            >
                Age
            </button>
        </h2>
        <div
            id="flush-collapseAge"
            class="accordion-collapse collapse"
            aria-labelledby="flush-age"
            data-bs-parent="#details"
        >
            <div class="accordion-body">{user.age}</div>
        </div>
    </div>
    <div class="accordion-item">
        <h2 class="accordion-header" id="flush-gender">
            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseGender" aria-expanded="false" aria-controls="flush-collapseGender">
                Gender
            </button>
        </h2>
        <div
            id="flush-collapseGender"
            class="accordion-collapse collapse"
            aria-labelledby="flush-gender"
            data-bs-parent="#details"
        >
            <div class="accordion-body">
                <div class="text-center">
                    <Hoverable let:hovering={active}>
                        <div class:active id="hover">
                            {#if active}
                                {user.gender}
                            {:else}
                                Hover to reveal the gender
                            {/if}
                        </div>
                    </Hoverable>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    #hover {
		background-color: blue;
    }

    .active {
        background-color: rgba(160, 7, 7, 0.774);
        color: white;
    }
</style>
