<script> 
    import axios from "axios";
    import { onMount } from "svelte";

    let users = [];

    onMount( () => {
        getUsers();
    })

    function getUsers() {
        axios.get("http://localhost:8080/projectx/users")
            .then( response => {
                users = response.data;
            })
    }
</script>

<h1>Users</h1>

<a href="#/create-user" class="btn btn-outline-danger border-2">+ Add new user</a>

<div class="bdr mt-3">
    <table class="table table-secondary table-striped table-hover table-borderless">

        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>City</th>
            </tr>
        </thead>
    
        <tbody>
            {#each users as user}
            <tr>
                <td>{user.id}</td>
                <td><a href={"#/users/" + user.id}>{user.name}</a></td>
                <td><a href={"mailto:" + user.email}>{user.email}</a></td>
                <td>{user.city}</td>
            </tr>
            {/each}
        </tbody>
    
    </table>
</div>
