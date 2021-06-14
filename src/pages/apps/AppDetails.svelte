<script>
    import axios from "axios";
    export let params = {};

    let appID;
    let app = {};
    let permission = [];

    $: {
        appID = params.id;
        getApp();
        getAllPermission();
    }

    function getApp() {
        axios
            .get("http://localhost:8080/projectx/apps/id/" + appID)
            .then((response) => {
                app = response.data;
            });
    }

    function getAllPermission() {
        axios
            .get("http://localhost:8080/projectx/permissions/app/" + appID)
            .then((response) => {
                permission = response.data;
            });
    }
</script>

<h1>App details for <b>{app.name}</b></h1>

<!-- nav buttons -->
<div class="my-2">
    <a href="#/apps" class="btn btn-outline-danger border-2"
        >Go to all locations</a
    >
    <a href="#/permissions" class="btn btn-outline-warning border-2"
        >Go to all permissions</a
    >
</div>

<!-- accordion with details -->
<div class="accordion" id="details">
    <div class="accordion-item">
        <h2 class="accordion-header" id="flush-details">
            <button
                class="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#flush-collapseDetail"
                aria-expanded="false"
                aria-controls="flush-collapseDetail"
            >
                List of all permissions for this app
            </button>
        </h2>
        <div
            id="flush-collapseDetail"
            class="accordion-collapse collapse"
            aria-labelledby="flush-details"
            data-bs-parent="#details"
        >
            <div class="accordion-body">
                <table
                    class="table table-secondary table-striped table-hover table-borderless"
                >
                    <thead>
                        <tr>
                            <th>Permission ID</th>
                            <th>User's name</th>
                            <th>Date</th>
                            <th>Node</th>
                        </tr>
                    </thead>

                    <tbody>
                        {#each permission as perm}
                            <tr>
                                <td>{perm.id}</td>
                                <td><a href={"#/users/" + perm.user.id}>{perm.user.name}</a></td>
                                <td>{perm.date}</td>
                                <td><a href={"#/nodes/" + perm.node.id}>{perm.node.name}</a></td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
