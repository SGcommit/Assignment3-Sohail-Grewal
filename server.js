const express = require('express');
require("./utils.js");
const path = require('path');
const app = express();

app.set('view engine', 'ejs'); // Use EJS for templating
app.set('views', path.join(__dirname, 'views')); // Set the path for views
app.use(express.static('public')); // Serve static files (CSS, JS)

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
        const page = parseInt(req.query.page) || 1;
        const limit = 10; // Pokémon per page
        const offset = (page - 1) * limit; // Correct offset calculation
        const types = req.query.type ? req.query.type.split(',') : []; // Array of selected types

        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`);
        const pokemonData = await pokemonResponse.json();

        let filteredPokemon = pokemonData.results;
        if (types.length > 0) {
            const allPokemonDetails = await Promise.all(filteredPokemon.map(async pokemon => {
                const pokemonDetailsResponse = await fetch(pokemon.url);
                return pokemonDetailsResponse.json();
            }));
            filteredPokemon = allPokemonDetails.filter(pokemon => {
                const pokemonTypes = pokemon.types.map(type => type.type.name);
                return types.every(type => pokemonTypes.includes(type));
            });
        }

        // Check if no Pokémon match the filter
        if (filteredPokemon.length === 0) {
            return res.json({ pokemon: [], currentPage: page, totalPages: 0 });
        }

        const typesResponse = await fetch('https://pokeapi.co/api/v2/type/');
        const typesData = await typesResponse.json();

        res.json({
            pokemon: filteredPokemon,
            types: typesData.results,
            currentPage: page,
            totalPages: Math.ceil(pokemonData.count / limit) // Calculate based on filtered results
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
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