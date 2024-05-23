const express = require('express');
require("./utils.js");
const path = require('path');
const app = express();

app.set('view engine', 'ejs'); // Use EJS for templating
app.set('views', path.join(__dirname, 'views')); // Set the path for views
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)

app.get('/', async (req, res) => {
    try {
        const [pokemonResponse, typesResponse] = await Promise.all([
            fetch('https://pokeapi.co/api/v2/pokemon?limit=810'),
            fetch('https://pokeapi.co/api/v2/type/') // Fetch types
        ]);

        const allPokemon = await pokemonResponse.json();
        const types = await typesResponse.json(); // Get types from response

        res.render('index', {
            pokemon: allPokemon.results,
            types: types.results, // Send types to index.ejs
            currentPage: 1,
            pokemonPerPage: 10
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/pokemon', async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // Fetch Pokémon data from an API
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const data = await response.json();

        const pokemonData = await Promise.all(data.results.map(async (pokemon) => {
            const detailsResponse = await fetch(pokemon.url);
            const details = await detailsResponse.json();
            return {
                name: details.name,
                url: `/pokemon/details/${details.id}`, // Add this line to include the local URL for details
                id: details.id,
                sprites: details.sprites
            };
        }));

        // Fetch types data
        const typesResponse = await fetch('https://pokeapi.co/api/v2/type');
        const typesData = await typesResponse.json();

        res.json({
            pokemon: pokemonData,
            types: typesData.results, // Ensure types are included
            totalPages: Math.ceil(1302 / limit), // assuming 1302 total Pokémon for this example
            totalPokemonCount: 1302
        });
    } catch (error) {
        console.error('Error fetching Pokémon:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/pokemon/details/:id', async (req, res) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${req.params.id}`);
  
        if (response.ok) {
            const pokemon = await response.json();
            res.json(pokemon); // Send back the JSON data
        } else {
            console.error('Error fetching Pokemon details:', response.statusText);
            res.status(response.status).json({ error: 'Failed to fetch Pokémon details', message: response.statusText });
        }
    } catch (error) {
        console.error('Unexpected error fetching Pokemon details:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

app.get('/pokemon/:id', async (req, res) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${req.params.id}`);
        const pokemon = await response.json();
        res.json(pokemon); // Send back the JSON data
    } catch (error) {
        console.error('Error fetching Pokemon details:', error);
        res.status(404).send('Pokemon not found');
    }
});



const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));