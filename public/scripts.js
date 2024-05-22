const pokemonGrid = document.getElementById('pokemon-grid');
const filterSection = document.getElementById('filter-section');
const paginationSection = document.getElementById('pagination');
const pokemonModal = document.getElementById('pokemon-modal');

// Global variables
let allPokemon = []; 
let currentPage = 1;
let pokemonPerPage = 10;
let filteredPokemon = [];

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
// Initial Data Fetch (Happens once when the page loads)
fetch('/pokemon')
    .then(response => response.json())
    .then(data => {
        allPokemon = data.pokemon; // Store all pokemon in global variable
        filteredPokemon = allPokemon; // Initially, all Pokemon are shown
        createFilterCheckboxes(data.types); // Create filter checkboxes
        showPokemon();  // Show Pokemon for the initial page
        setupPagination(Math.ceil(allPokemon.length / pokemonPerPage)); // Setup pagination
    })
    .catch(error => console.error('Error fetching data:', error));

// Function to show Pokemon
async function showPokemon() {
    pokemonGrid.innerHTML = '';
    // Get the Pokemon to display on the current page
    const startIndex = (currentPage - 1) * pokemonPerPage;
    const endIndex = startIndex + pokemonPerPage;
    const pokemonToShow = filteredPokemon.slice(startIndex, endIndex);

    for (const pokemon of pokemonToShow) {
        createPokemonCard(pokemon.url);
    }

    setupPagination(Math.ceil(filteredPokemon.length / pokemonPerPage));
}

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


async function createPokemonCard(pokemonUrl) {
    const response = await fetch(pokemonUrl)
    const pokemon = await response.json();

    const pokemonCard = document.createElement('div');
    pokemonCard.classList.add('pokemon-card');
    pokemonCard.dataset.name = pokemon.name;

    const pokemonImage = document.createElement('img');
    pokemonImage.src = pokemon.sprites.front_default; // Update image path
    pokemonImage.alt = `${pokemon.name} sprite`;

    const pokemonName = document.createElement('h2');
    pokemonName.textContent = capitalizeFirstLetter(pokemon.name);

    pokemonCard.appendChild(pokemonImage);
    pokemonCard.appendChild(pokemonName);

    pokemonCard.addEventListener('click', () => showPokemonDetails(pokemon));
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

// Function to filter Pokemon
function filterPokemon() {
    const selectedTypes = Array.from(filterSection.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    filteredPokemon = allPokemon.filter(pokemon => {
        return pokemon.types.some(type => selectedTypes.includes(type.type.name));
    });

    currentPage = 1; // Reset to first page when filtering
    showPokemon();
    setupPagination(Math.ceil(filteredPokemon.length / pokemonPerPage)); 
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