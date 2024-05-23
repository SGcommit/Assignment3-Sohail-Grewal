const pokemonGrid = document.getElementById('pokemon-grid');
const filterSection = document.getElementById('filter-section');
const paginationSection = document.getElementById('pagination');
const pokemonModal = document.getElementById('pokemon-modal');
const pokemonCount = document.getElementById('pokemon-count'); // Add this to display the count

// Global variables
let currentPage = 1;
let pokemonPerPage = 10;
let selectedTypes = [];
let totalPages = 1;
let totalPokemonCount = 0; // Add this to track total Pokémon count
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

async function createPokemonCard(pokemon) {
  if (!pokemon.sprites || !pokemon.name) {
      console.error('Invalid Pokémon data:', pokemon);
      return;
  }

  const pokemonGrid = document.getElementById('pokemon-grid');

  const pokemonCard = document.createElement('div');
  pokemonCard.classList.add('pokemon-card');
  pokemonCard.dataset.name = pokemon.name;

  const pokemonImage = document.createElement('img');
  pokemonImage.alt = `${pokemon.name} sprite`;
  pokemonImage.src = pokemon.sprites.front_default || '/images/placeholder.png'; // Assuming placeholder.png exists in the '/public/images' folder

  const pokemonName = document.createElement('h2');
  pokemonName.textContent = capitalizeFirstLetter(pokemon.name);

  pokemonCard.appendChild(pokemonImage);
  pokemonCard.appendChild(pokemonName);

  pokemonCard.addEventListener('click', async () => {
      try {
          const response = await fetch(`/pokemon/details/${pokemon.id}`);
          if (!response.ok) {
              throw new Error(`Failed to fetch Pokémon details for ${pokemon.name}`);
          }
          const pokemonDetails = await response.json();
          showPokemonDetails(pokemonDetails);
      } catch (error) {
          console.error('Error fetching Pokémon details:', error);
      }
  });

  pokemonGrid.appendChild(pokemonCard); // Append the Pokémon card to the grid
}

function setupPagination(currentPage, totalPages) {
  paginationSection.innerHTML = ''; // Clear existing buttons

  const firstPage = Math.max(1, currentPage - 2);
  const lastPage = Math.min(totalPages, currentPage + 2);

  const firstButton = document.createElement('button');
  firstButton.textContent = 'First';
  firstButton.disabled = currentPage === 1;
  firstButton.addEventListener('click', () => {
      currentPage = 1;
      showPokemon(currentPage);
  });
  paginationSection.appendChild(firstButton);

  const prevButton = document.createElement('button');
  prevButton.textContent = 'Prev';
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener('click', () => {
      currentPage--;
      showPokemon(currentPage);
  });
  paginationSection.appendChild(prevButton);

  for (let i = firstPage; i <= lastPage; i++) {
      const pageButton = document.createElement('button');
      pageButton.textContent = i;
      pageButton.classList.toggle('active', i === currentPage);
      pageButton.addEventListener('click', () => {
          currentPage = i;
          showPokemon(currentPage);
      });
      paginationSection.appendChild(pageButton);
  }

  const nextButton = document.createElement('button');
  nextButton.textContent = 'Next';
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener('click', () => {
      currentPage++;
      showPokemon(currentPage);
  });
  paginationSection.appendChild(nextButton);

  const lastButton = document.createElement('button');
  lastButton.textContent = 'Last';
  lastButton.disabled = currentPage === totalPages;
  lastButton.addEventListener('click', () => {
      currentPage = totalPages;
      showPokemon(currentPage);
  });
  paginationSection.appendChild(lastButton);
}





function updatePokemonCount(totalCount, currentPage, totalPages) {
  const pokemonCountElement = document.getElementById('pokemon-count');
  if (currentPage && totalPages && !isNaN(currentPage) && !isNaN(totalPages)) {
      const startIndex = (currentPage - 1) * pokemonPerPage + 1;
      const endIndex = Math.min(currentPage * pokemonPerPage, totalCount);
      pokemonCountElement.textContent = `Showing ${startIndex}-${endIndex} of ${totalCount} Pokémon (${currentPage}/${totalPages})`;
  } else {
      pokemonCountElement.textContent = `Total Pokémon: ${totalCount}`;
  }
}

async function showPokemon(currentPage) { // Pass currentPage as a parameter
  if (!loaded) return; // Don't run until initial data is loaded

  pokemonGrid.innerHTML = '';

  // Construct the fetch URL with query parameters
  let fetchUrl = `/pokemon?page=${currentPage}`;
  if (selectedTypes.length > 0) {
      fetchUrl += `&type=${selectedTypes.join(',')}`; // Include selectedTypes in query string
  }

  console.log('Fetch URL:', fetchUrl); // Log the fetchUrl variable

  try {
      const response = await fetch(fetchUrl);
      const data = await response.json();
      console.log("Data in showPokemon", data);

      if (!data.types) {
          throw new Error('Types data is missing');
      }

      createFilterCheckboxes(data.types);

      if (data.pokemon.length === 0) {
          pokemonGrid.innerHTML = '<p>No Pokémon found matching the selected types.</p>';
          paginationSection.innerHTML = '';
          return;
      }

      const totalCount = data.totalPokemonCount || 0;
      const totalPages = data.totalPages || 1;

      updatePokemonCount(totalCount, currentPage, totalPages);

      for (const pokemon of data.pokemon) {
          try {
              console.log('Fetching details for:', pokemon.name);
              if (!pokemon.url) {
                  throw new Error(`Pokemon URL is undefined for ${pokemon.name}`);
              }
              console.log('Pokemon URL:', pokemon.url); // Log the Pokemon URL
              const pokemonDetailsResponse = await fetch(pokemon.url); // Fetch individual pokemon details
              if (!pokemonDetailsResponse.ok) {
                  throw new Error(`Failed to fetch Pokémon details for ${pokemon.name}`);
              }
              const pokemonData = await pokemonDetailsResponse.json();
              createPokemonCard(pokemonData); // Pass the full pokemon data
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
    checkedCheckboxes[0].checked = false; // Uncheck the first checked checkbox if more than 2 are selected
  }

  selectedTypes = Array.from(filterSection.querySelectorAll('input[type="checkbox"]:checked'))
    .map(checkbox => checkbox.value);
  currentPage = 1;
  showPokemon(currentPage);
}

function showPokemonDetails(pokemon) {
  const modalContent = document.createElement('div');
  modalContent.classList.add('modal-content');

  const pokemonName = document.createElement('h2');
  pokemonName.textContent = capitalizeFirstLetter(pokemon.name);
  modalContent.appendChild(pokemonName);

  const pokemonImage = document.createElement('img');
  pokemonImage.alt = `${pokemon.name} sprite`;
  pokemonImage.src = pokemon.sprites?.front_default || '/images/placeholder.png';
  modalContent.appendChild(pokemonImage);

  const pokemonTypes = document.createElement('p');
  pokemonTypes.textContent = `Types: ${pokemon.types.map(type => type.type.name).join(', ')}`;
  modalContent.appendChild(pokemonTypes);

  pokemonModal.innerHTML = '';
  pokemonModal.appendChild(modalContent);
  pokemonModal.style.display = 'block';

  const closeButton = document.createElement('span');
  closeButton.classList.add('close-button');
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', () => {
    pokemonModal.style.display = 'none';
  });
  modalContent.appendChild(closeButton);
}

document.addEventListener('DOMContentLoaded', () => {
  fetch('/pokemon?page=1')
    .then(response => response.json())
    .then(data => {
      createFilterCheckboxes(data.types);
      loaded = true;
      currentPage = 1;
      showPokemon(currentPage);
    })
    .catch(error => console.error('Error fetching data:', error));
});
