const pokemonGrid = document.getElementById('pokemon-grid');
const filterSection = document.getElementById('filter-section');
const paginationSection = document.getElementById('pagination');
const pokemonModal = document.getElementById('pokemon-modal');

// Global variables
let allPokemon = [];
let currentPage = 1;
let pokemonPerPage = 10;
let filteredPokemon = [];
let selectedTypes = [];
let loaded = false;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
// Initial Data Fetch (Happens once when the page loads)
let initialFetch = true;
fetch('/pokemon?page=1') // Fetch the first page initially
    .then(response => response.json())
    .then(data => {
        if (initialFetch) {
            allPokemon = data.pokemon; // Store all pokemon in global variable only on initial fetch
        }

        filteredPokemon = data.pokemon;
        createFilterCheckboxes(data.types);
        loaded = true; // Mark data as loaded
        setupPagination(data.totalPages); // Use totalPages from response
        initialFetch = false; // Turn off flag for future fetches
    })
    .catch(error => console.error('Error fetching data:', error));


// Function to create filter checkboxes
function createFilterCheckboxes(types) {
    types.forEach(type => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = type.name;
        checkbox.value = type.name;

        const label = document.createElement('label');
        label.htmlFor = type.name;
        label.textContent = type.name;

        filterSection.appendChild(checkbox);
        filterSection.appendChild(label);

        checkbox.addEventListener('change', filterPokemon);
    });
}


async function createPokemonCard(pokemon) {
    const pokemonCard = document.createElement('div');
    pokemonCard.classList.add('pokemon-card');
    pokemonCard.dataset.name = pokemon.name;
    pokemonCard.dataset.id = pokemon.id

    const pokemonImage = document.createElement('img');
    pokemonImage.alt = `${pokemon.name} sprite`;
    pokemonImage.src = pokemon.sprites?.front_default || '/images/placeholder.png'; // If no image, use a placeholder image. Ensure you have 'placeholder.png' in the '/public/images' folder

    const pokemonName = document.createElement('h2');
    pokemonName.textContent = capitalizeFirstLetter(pokemon.name);

    pokemonCard.appendChild(pokemonImage);
    pokemonCard.appendChild(pokemonName);
    
    pokemonCard.addEventListener('click', () => showPokemonDetails(pokemon.name, pokemon.id));
    pokemonGrid.appendChild(pokemonCard);
}

//add pagination
function setupPagination(totalPages) {
    paginationSection.innerHTML = ''; // Clear existing buttons
    //prev button
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Prev';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        currentPage--;
        showPokemon();
    });
    paginationSection.appendChild(prevButton);

    // page buttons
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage);
        pageButton.addEventListener('click', () => {
            currentPage = i;
            showPokemon();
        });
        paginationSection.appendChild(pageButton);
    }

    //next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        currentPage++;
        showPokemon();
    });
    paginationSection.appendChild(nextButton);
    prevButton.style.display = currentPage === 1 ? 'none' : 'block';
    nextButton.style.display = currentPage === totalPages ? 'none' : 'block';
}

function updatePaginationButtons() {
    const pageButtons = paginationSection.querySelectorAll('button');
    pageButtons.forEach(button => {
        button.disabled =
            (button.textContent === 'Prev' && currentPage === 1) ||
            (button.textContent === 'Next' && currentPage === Math.ceil(filteredPokemon.length / pokemonPerPage));

        button.classList.toggle('active', button.textContent == currentPage);
    });
}

async function filterPokemon() {
    const selectedTypes = Array.from(filterSection.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    console.log("selected types: ", selectedTypes);
    // Fetch the pokemon data if any filters are selected, otherwise show all
    currentPage = 1;
    await showPokemon(); //wait for showPokemon to finish updating filteredPokemon
    setupPagination(Math.ceil(filteredPokemon.length / pokemonPerPage)); 
}
// Function to show Pokemon (Modified)
async function showPokemon() {
    pokemonGrid.innerHTML = ''; // Clear the grid

    // Construct the fetch URL with query parameters
    const fetchUrl = `/pokemon?page=${currentPage}&type=${selectedTypes.join(',')}`;

    const response = await fetch(fetchUrl);
    const data = await response.json();

    filteredPokemon = data.pokemon; // Update filteredPokemon with the data from the current page

    for (const pokemon of filteredPokemon) {
        createPokemonCard(pokemon);
    }

    setupPagination(data.totalPages);
}

function showPokemonDetails(pokemon) {
    // Create modal content dynamically based on pokemon data
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    // Add pokemon details to modal content (name, image, types, etc.)
    const pokemonName = document.createElement('h2');
    pokemonName.textContent = capitalizeFirstLetter(pokemon.name);
    modalContent.appendChild(pokemonName);

    // ... Add other details like image, types, etc. ...

    // Display the modal
    pokemonModal.innerHTML = '';
    pokemonModal.appendChild(modalContent);
    pokemonModal.style.display = 'block';

    // Close button for modal
    const closeButton = document.createElement('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        pokemonModal.style.display = 'none';
    });
    modalContent.appendChild(closeButton);
}

showPokemon();
setupPagination(Math.ceil(allPokemon.length / pokemonPerPage));