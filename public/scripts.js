const pokemonGrid = document.getElementById('pokemon-grid');
const filterSection = document.getElementById('filter-section');
const paginationSection = document.getElementById('pagination');
const pokemonModal = document.getElementById('pokemon-modal');

// Global variables
let allPokemon = []; 
let currentPage = 1;
let pokemonPerPage = 10;
let filteredPokemon = [];

// Initial Data Fetch (Happens once when the page loads)
fetch('/pokemon')
    .then(response => response.json())
    .then(data => {
        allPokemon = data.pokemon;
        filteredPokemon = allPokemon; // Initially, all Pokemon are shown
        createFilterCheckboxes(data.types); // Create filter checkboxes
        showPokemon();  // Show Pokemon for the initial page
        setupPagination(Math.ceil(allPokemon.length / pokemonPerPage)); // Setup pagination
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