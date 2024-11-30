document.addEventListener("DOMContentLoaded", function() {
    const searchBox = document.getElementById("read-input");

    searchBox.addEventListener('input', function() {
        if (searchBox.value.trim() === '') {
            clearResults();
            searchBox.placeholder = "Search Game";
        }
    });

    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent the default form submission

            const formData = new FormData(searchForm);
            const searchName = formData.get('AppID');
            
            try {
                if (searchName) {
                    const response = await fetch(`/search-game/${searchName}`);

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                
                    const result = await response.json();
                    
                    if (result.results.length > 0) {
                        // Display 
                        displayResults(result.results);
                    }  else {
                        displayResults([]);
                    }
                } else {
                    clearResults(); 
                    searchBox.placeholder = "Search Name";
                }
            } catch (error) {
                console.error('There was a problem with the search operation:', error);
            }
        });
    }
});

let currentPage = 1;
const resultsPerPage = 10;

function displayResults(results) {
    const searchBox = document.getElementById("search-box");
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = ""; // Clear previous results

    if (results.length > 0) {
        const totalPages = Math.ceil(results.length / resultsPerPage);
        const startIndex = (currentPage - 1) * resultsPerPage;
        const endIndex = Math.min(startIndex + resultsPerPage, results.length);
        const paginatedResults = results.slice(startIndex, endIndex);

        // Create a table to display results
        const tableElement = document.createElement("table");
        tableElement.className = "results-table";

        // Create table header
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `
            <th>AppID</th>
            <th>Name</th>
            <th>Released Date</th>
            <th>Price</th>
            <th>Estimated Owners</th>
            <th>Positive Review</th>
            <th>Negative Review</th>
        `;
        thead.appendChild(headerRow);
        tableElement.appendChild(thead);

        // Create table body
        const tbody = document.createElement("tbody");

        paginatedResults.forEach(game => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${game.AppID}</td>
                <td>${game.Name}</td>
                <td>${game.Release_date}</td>
                <td>${game.Price}</td>
                <td>${game.Estimated_owners}</td>
                <td>${game.Positive != null ? game.Positive : game.positive}</td>
                <td>${game.Negative != null ? game.Negative : game.negative}</td>
            `;
            tbody.appendChild(row);
        });

        tableElement.appendChild(tbody);
        resultsContainer.appendChild(tableElement);

        // Add pagination controls
        const paginationControls = document.createElement("div");
        paginationControls.className = "pagination-controls";

        if (currentPage > 1) {
            const prevLink = document.createElement("a");
            prevLink.textContent = "Previous";
            prevLink.href = "#";
            prevLink.style.textDecoration = "underline"; 
            prevLink.style.cursor = "pointer"; 
            prevLink.style.marginLeft = "35px"; 
            prevLink.style.color = "gray";

            prevLink.addEventListener("click", function(event) {
                event.preventDefault();
                currentPage--;
                displayResults(results); // Redisplay results for the previous page
            });
            paginationControls.appendChild(prevLink);
        }

        if (currentPage < totalPages) {
            const nextLink = document.createElement("a");
            nextLink.textContent = "Next";
            nextLink.href = "#";
            nextLink.style.textDecoration = "underline"; 
            nextLink.style.cursor = "pointer"; 
            nextLink.style.marginLeft = "35px"; 
            nextLink.style.color = "gray";

            nextLink.addEventListener("click", function(event) {
                event.preventDefault();
                currentPage++;
                displayResults(results); // Redisplay results for the next page
            });
            paginationControls.appendChild(nextLink);
        }

        resultsContainer.appendChild(paginationControls);
    } else {
        // If no results found, show a message
        const noResultsMessage = document.createElement("p");
        noResultsMessage.textContent = "No results found.";
        resultsContainer.appendChild(noResultsMessage);
    }
}

function clearResults() {
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.innerHTML = "";
}