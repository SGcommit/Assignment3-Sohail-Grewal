const pokemonGrid = document.getElementById('pokemon-grid');
const filterSection = document.getElementById('filter-section');
const paginationSection = document.getElementById('pagination');
const pokemonModal = document.getElementById('pokemon-modal');
const pokemonCount = document.getElementById('pokemon-count');

// Global variables
let currentPage = 1;
let pokemonPerPage = 10;
let selectedTypes = [];
let totalPages = 1;
let totalPokemonCount = 0;
let loaded = false;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Function to create filter checkboxes
function createFilterCheckboxes(types) {
  const filterSection = document.getElementById('filter-section');
  
  if (!filterSection) {
    console.error('Filter section element not found');
    return;
  }

  // Clear any existing checkboxes
  filterSection.innerHTML = '';

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

// Update the fetch call inside the createPokemonCard function
async function createPokemonCard(pokemon) {
  try {
      // Update the rest of the logic to work with the fetched details
      if (!pokemon.sprites || !pokemon.name) {
          throw new Error('Invalid Pokémon data');
      }

      const pokemonGrid = document.getElementById('pokemon-grid');

      const pokemonCard = document.createElement('div');
      pokemonCard.classList.add('pokemon-card');
      pokemonCard.dataset.name = pokemon.name;

      const pokemonImage = document.createElement('img');
      pokemonImage.alt = `${pokemon.name} sprite`;
      pokemonImage.src = pokemon.sprites.front_default || '/images/placeholder.png';

      const pokemonName = document.createElement('h2');
      pokemonName.textContent = capitalizeFirstLetter(pokemon.name);

      pokemonCard.appendChild(pokemonImage);
      pokemonCard.appendChild(pokemonName);

      pokemonCard.addEventListener('click', () => {
          showPokemonDetails(pokemon);
      });

      pokemonGrid.appendChild(pokemonCard);
  } catch (error) {
      console.error('Error creating Pokémon card:', error);
  }
}
function setupPagination() {
  paginationSection.innerHTML = '';

  const firstPage = Math.max(1, currentPage - 2);
  const lastPage = Math.min(totalPages, currentPage + 2);

  const firstButton = createPaginationButton('First', 1);
  const prevButton = createPaginationButton('Prev', currentPage - 1);

  paginationSection.appendChild(firstButton);
  paginationSection.appendChild(prevButton);

  for (let i = firstPage; i <= lastPage; i++) {
      const pageButton = createPaginationButton(i, i);
      paginationSection.appendChild(pageButton);
  }

  const nextButton = createPaginationButton('Next', currentPage + 1);
  const lastButton = createPaginationButton('Last', totalPages);

  paginationSection.appendChild(nextButton);
  paginationSection.appendChild(lastButton);
}

function createPaginationButton(label, page) {
  const button = document.createElement('button');
  button.textContent = label;
  button.disabled = (page < 1 || page > totalPages);
  button.addEventListener('click', () => {
      currentPage = page;
      showPokemon();
  });
  return button;
}



function updatePokemonCount() {
  const pokemonCountElement = document.getElementById('pokemon-count');
  if (currentPage && totalPages && !isNaN(currentPage) && !isNaN(totalPages)) {
      const startIndex = (currentPage - 1) * pokemonPerPage + 1;
      const endIndex = Math.min(currentPage * pokemonPerPage, totalPokemonCount);
      pokemonCountElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalPokemonCount} Pokémon (${currentPage}/${totalPages})`;
  } else {
      pokemonCountElement.textContent = `Total Pokémon: ${totalPokemonCount}`;
  }
}

// Update the fetch call inside the showPokemon function
async function showPokemon(currentPage) {
  // Fetch Pokémon data based on the current page
  try {
      const data = await fetchPokemonData(currentPage, pokemonPerPage);
      // Update the rest of the logic to work with the fetched data
      console.log("Data in showPokemon", data);

      if (!data.types) {
          throw new Error('Types data is missing');
      }

      createFilterCheckboxes(data.types);

      if (data.results.length === 0) { // Updated from data.pokemon.length
          pokemonGrid.innerHTML = '<p>No Pokémon found matching the selected types.</p>';
          paginationSection.innerHTML = '';
          return;
      }

      const totalCount = data.count || 0; // Updated from data.totalPokemonCount
      const totalPages = Math.ceil(totalCount / pokemonPerPage); // Updated from data.totalPages

      updatePokemonCount(totalCount, currentPage, totalPages);

      for (const pokemon of data.results) { // Updated from data.pokemon
          try {
              console.log('Fetching details for:', pokemon.name);
              const pokemonDetails = await fetchPokemonDetails(pokemon.name); // Updated from fetch(pokemon.url)
              createPokemonCard(pokemonDetails); // Pass the fetched details
          } catch (error) {
              console.error('Error fetching Pokémon details:', error);
          }
      }
      console.log("current page",currentPage);
      console.log("totalPages", totalPages);
      setupPagination(currentPage, totalPages); // Update pagination based on the filtered results
  } catch (error) {
      console.error('Error fetching Pokémon data:', error);
  }
}

function filterPokemon() {
  const checkedCheckboxes = Array.from(filterSection.querySelectorAll('input[type="checkbox"]:checked'));

  if (checkedCheckboxes.length > 2) {
    checkedCheckboxes[0].checked = false;
  }

  selectedTypes = Array.from(filterSection.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  currentPage = 1;
  showPokemon(currentPage);
}

// Update the base URL for PokeAPI
const baseUrl = 'https://pokeapi.co/api/v2';

// Function to fetch Pokémon data from the PokeAPI
async function fetchPokemonData(page, limit) {
    const response = await fetch(`${baseUrl}/pokemon?offset=${(page - 1) * limit}&limit=${limit}`);
    if (!response.ok) {
        throw new Error('Failed to fetch Pokémon data');
    }
    const data = await response.json();
    return data;
}

// Function to fetch Pokémon details from the PokeAPI
async function fetchPokemonDetails(id) {
    const response = await fetch(`${baseUrl}/pokemon/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch Pokémon details');
    }
    const data = await response.json();
    return data;
}

// Update the fetch call inside the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
  // Call the fetchPokemonData function to fetch initial Pokémon data
  fetchPokemonData(1, 10)
      .then(data => {
          createFilterCheckboxes(data.types);
          loaded = true;
          currentPage = 1;
          showPokemon(currentPage);
      })
      .catch(error => console.error('Error fetching data:', error));
});