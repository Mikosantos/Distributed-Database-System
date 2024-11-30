document.addEventListener("DOMContentLoaded", function() {
    const addGameForm = document.getElementById("addGameForm");

    if (addGameForm) {
        addGameForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(addGameForm);
            const gameTitle = formData.get("gameTitle");
            const releasedDate = formData.get("releasedDate");
            const price = formData.get("price");
            const ownerRange = formData.get("ownerRange");
            const posReview = formData.get("posReview");
            const negReview = formData.get("negReview");
        })
    }
});