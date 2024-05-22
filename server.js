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
        const [pokemonResponse, typesResponse] = await Promise.all([
            fetch('https://pokeapi.co/api/v2/pokemon?limit=810'),
            fetch('https://pokeapi.co/api/v2/type/') // Fetch types
        ]);

        const allPokemon = await pokemonResponse.json();
        const types = await typesResponse.json();

        res.json({ 
            pokemon: allPokemon.results, 
            types: types.results // Send types in the correct format
        }); 
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/pokemon/:name', async (req, res) => {
    try {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${req.params.name}`);
        const pokemon = await pokemonResponse.json();
        res.json(pokemon); 
    } catch (error) {
        console.error('Error fetching Pokemon details:', error);
        res.status(404).send('Pokemon not found'); // Handle not found error
    }
});

const PORT = process.env.PORT || 3000; // Use environment variable or default to 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));