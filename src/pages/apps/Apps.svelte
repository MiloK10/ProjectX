<script> 
    import axios from "axios";
    import { onMount } from "svelte";

    let apps = [];

    onMount( () => {
        getApplications();
    })

    function getApplications() {
        axios.get("http://localhost:8080/projectx/apps")
            .then( response => {
                apps = response.data;
            })
    }
</script>

<h1>Apps</h1>

<div class="bdr mt-3">
    <table class="table table-secondary table-striped table-hover table-borderless">

        <thead>
            <tr>
                <th>ID</th>
                <th>Application name</th>
            </tr>
        </thead>
    
        <tbody>
            {#each apps as app}
            <tr>
                <td>{app.id}</td>
                <td><a href={"#/apps/" + app.id}>{app.name}</a></td>
                <!-- <td>{location.gender}</td> -->
            </tr>
            {/each}
        </tbody>
    
    </table>
</div>