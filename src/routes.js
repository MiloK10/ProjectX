// Pages
import Home from "./pages/Home.svelte";

import Users from "./pages/users/Users.svelte"
import UserDetails from "./pages/users/UserDetails.svelte"
import CreateUser from "./pages/users/CreateUser.svelte"

import Permissions from "./pages/permissions/Permissions.svelte"

import Apps from "./pages/apps/Apps.svelte"
import AppDetails from "./pages/apps/AppDetails.svelte"

import NodeDetails from "./pages/nodes/NodeDetails.svelte"

import Hosting from "./pages/Hosting.svelte"

// Export the route definition object
export default {
    // Exact path
    '/': Home,
    '/home': Home,

    // users
    '/users': Users,
    '/users/:id': UserDetails,
    '/create-user': CreateUser,
    
    // permissions
    '/permissions': Permissions,

    // locations
    '/apps': Apps,
    '/apps/:id': AppDetails,

    // nodes
    '/nodes/:id': NodeDetails,

    // hosting
    '/hosting': Hosting,


}