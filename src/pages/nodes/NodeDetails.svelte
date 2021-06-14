<script>
    import axios from "axios";    
    export let params = {};

    let nodeID;
    let node = {};
    let folders = [];
    let files = [];

    $: {
        nodeID = params.id;
        getNode();
        getAllFolders();
        getAllFiles();
    }

    function getNode() {
        axios.get("http://localhost:8080/projectx/nodes/id/" + nodeID)
            .then( response => {
                node = response.data;
            })
    }
    
    function getAllFolders() {
        axios.get("http://localhost:8080/projectx/folders/nodes/" + nodeID)
            .then( response => {
                folders = response.data;
            })
    }

    function getAllFiles() {
        axios.get("http://localhost:8080/projectx/files/nodes/" + nodeID)
            .then( response => {
                files = response.data;
            })
    }

</script>

<h1>Node details for <b>{node.name}</b></h1>

<!-- nav buttons -->
<div class="my-2">
    <a href="#/permissions" class="btn btn-outline-warning border-2">Go to all permissions</a>   
</div>


<!-- accordion with details -->
<div class="row">
    <div class="col-6">
        <div class="accordion" id="folders">
            <div class="accordion-item">
                <h2 class="accordion-header" id="flush-folders">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseFolders" aria-expanded="false" aria-controls="flush-collapseFolders">
                        List of all folders for this node
                    </button>
                </h2>
                <div id="flush-collapseFolders" class="accordion-collapse collapse" aria-labelledby="flush-folders" data-bs-parent="#folders">
                    <div class="accordion-body">
                        <table class="table table-secondary table-striped table-hover table-borderless">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Folder above</th>
                                    <th>Bio</th>
                                </tr>
                            </thead>
                        
                            <tbody>
                                {#each folders as folder}
                                <tr>
                                    <td>{folder.id}</td>
                                    <td>{folder.name}</td>
                                    <td>{folder.folder.name}</td>
                                    <td>{folder.bio}</td>
                                </tr>
                                {/each}
                            </tbody>
                        
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    
    <div class="col-6">
        <div class="accordion" id="files">
            <div class="accordion-item">
                <h2 class="accordion-header" id="flush-files">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseFile" aria-expanded="false" aria-controls="flush-collapseFile">
                        List of all files for this node
                    </button>
                </h2>
                <div id="flush-collapseFile" class="accordion-collapse collapse" aria-labelledby="flush-files" data-bs-parent="#files">
                    <div class="accordion-body">
                        <table class="table table-secondary table-striped table-hover table-borderless">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Folder above</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                        
                            <tbody>
                                {#each files as file}
                                <tr>
                                    <td>{file.id}</td>
                                    <td>{file.name}</td>
                                    <td>{file.folder.name}</td>
                                    <td>{file.date}</td>
                                </tr>
                                {/each}
                            </tbody>
                        
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
