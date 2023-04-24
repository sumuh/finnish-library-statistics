import express from 'express';
import { create } from 'express-handlebars';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname)

const app = express();
const hbs = create({ /* config */ });

// Register `hbs.engine` with the Express app.
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.get('/', (req, res) => {
    res.render('home', {showTitle: true});
});

app.get('/api/data', (req, res) => {
    fetch('http://localhost:3000/resources/finland_map.json')
        .then(jsonData => res.json(jsonData))
        .catch(err => {
            console.error(err);
        });
});

app.listen(3000);