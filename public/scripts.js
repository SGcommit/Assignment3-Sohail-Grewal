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
// Update the base URL for PokeAPI
const baseUrl = 'https://pokeapi.co/api/v2';
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Create filter checkboxes
async function createFilterCheckboxes() {
  try {
    const types = await fetchTypesData();
    filterSection.innerHTML = '';
    types.forEach(type => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = type;
      checkbox.value = type;
      const label = document.createElement('label');
      label.htmlFor = type;
      label.textContent = capitalizeFirstLetter(type);
      filterSection.appendChild(checkbox);
      filterSection.appendChild(label);
      checkbox.addEventListener('change', filterPokemon);
    });
  } catch (error) {
    console.error('Error creating filter checkboxes:', error);
  }
}
async function filterPokemon() {
  try {
    // Get all selected types
    const checkedCheckboxes = Array.from(filterSection.querySelectorAll('input[type="checkbox"]:checked'));

    // Allow only two types to be selected
    if (checkedCheckboxes.length > 2) {
      checkedCheckboxes[0].checked = false;
    }

    // Extract selected type names
    selectedTypes = checkedCheckboxes.map(checkbox => checkbox.value);

    // Reset current page to 1 when filtering
    currentPage = 1;

    // Fetch Pokémon data based on selected types
    showPokemon(currentPage);
  } catch (error) {
    console.error('Error filtering Pokémon:', error);
  }
}
// Create Pokémon card
async function createPokemonCard(pokemon) {
  try {
    // Update the rest of the logic to work with the fetched details
    if (!pokemon.sprites || !pokemon.name) {
      throw new Error('Invalid Pokémon data');
    }

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

function setupPagination(currentPage) {
  paginationSection.innerHTML = '';

  const firstPage = Math.max(1, currentPage - 2);
  const lastPage = Math.min(totalPages, currentPage + 2); // Show at most 5 pages

  const firstButton = createPaginationButton('First', 1, currentPage);
  const prevButton = createPaginationButton('Prev', currentPage - 1, currentPage);

  paginationSection.appendChild(firstButton);
  paginationSection.appendChild(prevButton);

  for (let i = firstPage; i <= lastPage; i++) {
    const pageButton = createPaginationButton(i, i, currentPage);
    paginationSection.appendChild(pageButton);
  }

  const nextButton = createPaginationButton('Next', currentPage + 1, currentPage);
  const lastButton = createPaginationButton('Last', totalPages, currentPage);

  paginationSection.appendChild(nextButton);
  paginationSection.appendChild(lastButton);
}

function createPaginationButton(label, page, currentPage) {
  const button = document.createElement('button');
  button.textContent = label;
  if (label === 'First') {
    button.disabled = (currentPage === 1);
  } else if (label === 'Last') {
    button.disabled = (currentPage === totalPages);
  } else {
    button.disabled = (page < 1 || page > totalPages);
  }

  if (currentPage === page) {
    button.classList.add('active');
  }

  button.addEventListener('click', () => {
    currentPage = page;
    showPokemon(currentPage);
  });
  return button;
}

function updatePokemonCount(totalCount) {
  const pokemonCountElement = document.getElementById('pokemon-count');
  if (currentPage && totalPages && !isNaN(currentPage) && !isNaN(totalPages)) {
    const startIndex = (currentPage - 1) * pokemonPerPage + 1;
    const endIndex = Math.min(currentPage * pokemonPerPage, totalCount);
    pokemonCountElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalCount} Pokémon (${currentPage}/${totalPages})`;
  } else {
    pokemonCountElement.textContent = `Total Pokémon: ${totalPokemonCount}`;
  }
}

// Show Pokémon based on current page
async function showPokemon(currentPage) {
  try {
    // Clear the existing Pokemon on the grid
    pokemonGrid.innerHTML = '';

    const limit = pokemonPerPage;
    const offset = (currentPage - 1) * limit; // Calculate the offset based on the current page

    // Fetch Pokémon data based on selected types
    const types = getSelectedTypes();
    const { filteredCount, filteredPokemonNames } = await fetchFilteredPokemonData(offset, limit, types);

    // Check if filteredPokemonNames is not an array, set it to an empty array if it's not
    const pokemonNamesArray = Array.isArray(filteredPokemonNames) ? filteredPokemonNames : [];

    for (const name of pokemonNamesArray) {
      const pokemonDetails = await fetchPokemonDetails(name);
      createPokemonCard(pokemonDetails);
    }

    totalPages = Math.ceil(filteredCount / pokemonPerPage); // Update total pages based on filtered count
    setupPagination(currentPage); // Update pagination buttons with the current page
    updatePokemonCount(filteredCount); // Update pokemon count display with filtered count
  } catch (error) {
    console.error('Error fetching Pokémon data:', error);
  }
}

// Function to get selected types from UI
function getSelectedTypes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  const selectedTypes = [];
  checkboxes.forEach(checkbox => {
    selectedTypes.push(checkbox.value);
  });
  return selectedTypes;
}

// Fetch Pokémon data
async function fetchPokemonData(offset, limit) {
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
  if (!response.ok) {
      throw new Error('Failed to fetch Pokémon data');
  }
  const data = await response.json();
  
  // Extract Pokemon names
  const pokemonNames = data.results.map(pokemon => pokemon.name);

  return pokemonNames; // Return only the names
}

// Fetch Pokémon data with pagination
async function fetchFilteredPokemonData(offset, limit, types) {
  try {
    let apiUrl = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`;

    // If types are selected, construct the API URL to filter by types
    if (types.length > 0) {
      apiUrl = `https://pokeapi.co/api/v2/type/${types[0]}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch Pokémon data');
      }
      const data = await response.json();
      let pokemonOfType = data.pokemon.map(p => p.pokemon.name);

      if (types.length === 2) {
        apiUrl = `https://pokeapi.co/api/v2/type/${types[1]}`;
        const response2 = await fetch(apiUrl);
        if (!response2.ok) {
          throw new Error('Failed to fetch Pokémon data');
        }
        const data2 = await response2.json();
        const secondTypePokemon = data2.pokemon.map(p => p.pokemon.name);
        pokemonOfType = pokemonOfType.filter(p => secondTypePokemon.includes(p));
      }

      const totalCount = pokemonOfType.length;
      const filteredPokemonNames = pokemonOfType.slice(offset, offset + limit);

      return { filteredCount: totalCount, filteredPokemonNames };
    }

    // If no types are selected, fetch all Pokémon
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon data');
    }
    const data = await response.json();
    const pokemonNames = data.results.map(pokemon => pokemon.name);
    const totalCount = data.count;

    return { filteredCount: totalCount, filteredPokemonNames: pokemonNames };
  } catch (error) {
    console.error('Error fetching filtered Pokémon data:', error);
    return { filteredCount: 0, filteredPokemonNames: [] };
  }
}

// Fetch Pokémon details by name
async function fetchPokemonDetails(name) {
  try {
    const response = await fetch(`${baseUrl}/pokemon/${name}`);
    if (!response.ok) {
      throw new Error('Failed to fetch Pokémon details');
    }
    const pokemon = await response.json();
    return pokemon;
  } catch (error) {
    console.error('Error fetching Pokémon details:', error);
    return {};
  }
}

function showPokemonDetails(pokemon) {
  const modalContent = document.getElementById('modal-content');
  if (!modalContent) {
    console.error('Modal content element not found');
    return;
  }

  modalContent.innerHTML = ''; // Clear previous content

  const pokemonName = document.createElement('h2');
  pokemonName.textContent = capitalizeFirstLetter(pokemon.name);

  const pokemonImage = document.createElement('img');
  pokemonImage.alt = `${pokemon.name} sprite`;
  pokemonImage.src = pokemon.sprites.front_default || '/images/placeholder.png';

  const pokemonTypes = document.createElement('p');
  pokemonTypes.textContent = `Types: ${pokemon.types.map(type => type.type.name).join(', ')}`;

  const pokemonAbilities = document.createElement('p');
  pokemonAbilities.textContent = `Abilities: ${pokemon.abilities.map(ability => ability.ability.name).join(', ')}`;

  const pokemonStats = document.createElement('ul');
  pokemonStats.innerHTML = 'Stats:';
  pokemon.stats.forEach(stat => {
      const statItem = document.createElement('li');
      statItem.textContent = `${capitalizeFirstLetter(stat.stat.name)}: ${stat.base_stat}`;
      pokemonStats.appendChild(statItem);
  });

  modalContent.appendChild(pokemonName);
  modalContent.appendChild(pokemonImage);
  modalContent.appendChild(pokemonTypes);
  modalContent.appendChild(pokemonAbilities);
  modalContent.appendChild(pokemonStats);

  const modal = document.getElementById('pokemon-modal');
  if (modal) {
    modal.style.display = 'block'; // Show the modal
  }
}

//event listener to close the modal
document.getElementById('close-modal').addEventListener('click', () => {
  const modal = document.getElementById('pokemon-modal');
  if (modal) {
    modal.style.display = 'none'; // Hide the modal
  }
});

// Close the modal when clicking outside of the modal content
window.addEventListener('click', (event) => {
  const modal = document.getElementById('pokemon-modal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// Fetch all types data
async function fetchTypesData() {
  try {
    const response = await fetch(`${baseUrl}/type`);
    if (!response.ok) {
      throw new Error('Failed to fetch types data');
    }
    const data = await response.json();
    return data.results.map(type => type.name);
  } catch (error) {
    console.error('Error fetching types data:', error);
    return [];
  }
}


// Update the fetch call inside the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
  // Call the fetchPokemonData function to fetch initial Pokémon data
  fetchPokemonData(0, 10)
    .then(data => {
      createFilterCheckboxes();
      currentPage = 1;
      showPokemon(currentPage);
    })
    .catch(error => console.error('Error fetching data:', error));
});