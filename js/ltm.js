async function ifLink() {
    const input = document.getElementById("link");
    const link = input?.value.trim();

    if (!link) return;

    let url;
    try {
        url = new URL(link);
        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("Only HTTP and HTTPS links are supported.");
        }
    } catch (error) {
        console.error(error);
        return;
    }

    try {
        // The server must fetch the remote file and store it in MongoDB. Do
        // not connect to MongoDB directly from browser code.
        const response = await fetch("/api/uploads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ link: url.href })
        });

        if (!response.ok) {
            throw new Error(`Upload failed (${response.status}).`);
        }

        input.value = "";
        return await response.json();
    } catch (error) {
        console.error("Unable to upload the texture pack or mod:", error);
    }
}