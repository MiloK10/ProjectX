<script>
    import axios from "axios";
    import {} from "os";

    // import { bind } from "svelte/internal";

    let user = {
        name: "",
        gender: "",
        age: null,
        city: "",
        email: "",
    };

    function createUser() {
        axios
            .post("http://localhost:8080/projectx/users", user)
            .then((response) => {
                alert("User was successfully created");
            });
    }

    // validation
    let errors = { name: '', email: '', city: '', gender: '', age: ''};
    let valid = false;

    const submitHandler = () => {
        valid = true

        // validate name
        if (user.name.trim().length < 1 ) {
            valid = false;
            errors.name = "Please enter name"
        } else {
            errors.name = '';
        }

        // validate email
        if (user.email.trim().length < 1 ) {
            valid = false;
            errors.email = "Please enter email"
        } else {
            errors.email = '';
        }

        // validate age
        if (user.age === null ) {
            valid = false;
            errors.age = "Please enter age"
        } else {
            errors.age = '';
        }

        // validate city
        if (user.city.trim().length < 1 ) {
            valid = false;
            errors.city = "Please enter city"
        } else {
            errors.city = '';
        }

        // validate gender
        if (user.gender.trim().length < 1 ) {
            valid = false;
            errors.gender = "Please enter gender"
        } else {
            errors.gender = '';
        }

        if (valid) {
            createUser()
        }

    }
    
</script>

<h1>Create new user</h1>

<a href="#/users" class="btn btn-outline-danger border-2">Go back to users</a>

<!-- form with validation -->
<div class="row">
    <form on:submit|preventDefault={submitHandler} class="row text-center">
        <div class="form-field mb-3 col-6">
            <label class="form-label" for="name" >Name</label>
            <input class="form-control" type="text" bind:value={user.name} placeholder="Enter name and surname">
            <div class="error">{ errors.name }</div>
        </div>
        <div class="form-field mb-3 col-6">
            <label class="form-label" for="Email">Email</label>
            <input class="form-control" type="email" bind:value={user.email} placeholder="Enter email address">
            <div class="error">{ errors.email }</div>
        </div>
        <div class="form-field mb-3 col-6">
            <label class="form-label" for="City">Place of residence</label>
            <input class="form-control" type="text" bind:value={user.city} placeholder="Enter place of residence">
            <div class="error">{ errors.city }</div>
        </div>
        <div class="form-field mb-3 col-2">
            <label class="form-label" for="Age">Age</label>
            <input class="form-control" type="number" bind:value={user.age} placeholder="Enter age">
            <div class="error">{ errors.age }</div>
        </div>
        <div class="form-field mb-3 col-4">
            <label class="form-label" for="gender">Gender</label>
            <select class="form-select" aria-label="Select" bind:value={user.gender}>
                <option selected>Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>
            <div class="error">{ errors.gender }</div>
        </div>
   
        <button type="secondary" class="btn btn-outline-success border-2 col-1 offset-6">Create</button>   
    </form>

</div>
