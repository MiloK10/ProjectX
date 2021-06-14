<script> 
    import axios from "axios";
    import { onMount } from "svelte";

    let permissions = [];

    onMount( () => {
        getPermissions();
    })

    function getPermissions() {
        axios.get("http://localhost:8080/projectx/permissions")
            .then( response => {
                permissions = response.data;
            })
    }
</script>

<h1>This is a list of all permissions</h1>

<div class="bdr mt-3">
    <table class="table table-secondary table-striped table-hover table-borderless">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>App</th>
                <th>Date</th>
                <th>Node</th>
            </tr>
        </thead>
    
        <tbody>
            {#each permissions as permission}
            <tr>
                <td>{permission.id}</td>
                <td><a href={"#/users/" + permission.user.id}>{permission.user.name}</a></td>
                <td><a href={"#/apps/" + permission.app.id}>{permission.app.name}</a></td>
                <td>{permission.date}</td>
                <td><a href={"#/nodes/" + permission.node.id}>{permission.node.name}</a></td>
            </tr>
            {/each}
        </tbody>
    
    </table>
</div>
