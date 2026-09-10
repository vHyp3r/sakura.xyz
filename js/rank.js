function rank() {
    getUserid();
    if (userid == null) {
        // Handle the case where userid is null
    console.error("User ID is null. Cannot proceed with ranking.");
    } else {
        console.log("User ID is valid. Proceeding with ranking.");
    }

}