const express = require('express');
const fetch = require('node-fetch'); // or other library
const app = express();

app.set('view engine', 'ejs'); 
app.use(express.static('public')); 

app.get('/', async (req, res) => {
    const allPokemon = await fetch('https://pokeapi.co/api/v2/pokemon?limit=810').then(res => res.json());
    const types = await fetch('https://pokeapi.co/api/v2/type/').then(res => res.json());

    res.render('index', { pokemon: allPokemon.results, types: types.results }); 
});

app.get('/pokemon/:name', async (req, res) => {
    const pokemon = await fetch(`https://pokeapi.co/api/v2/pokemon/${req.params.name}`).then(res => res.json());
    res.json(pokemon); // Send details back as JSON
});

app.listen(3000, () => console.log('Server running on port 3000'));