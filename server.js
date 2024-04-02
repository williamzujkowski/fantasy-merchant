const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const session = require('express-session');
const Item = require('./models/Item');
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/kingdom_trader';
const ITEM_FILE_PATH = './fantasy_items.json';

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Initialize player's gold balance
app.use((req, res, next) => {
    if (!req.session.playerGold) {
        req.session.playerGold = 1000; // Set the initial gold balance
    }
    next();
});

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        updateItemsInDatabase();
        setInterval(updateItemsInDatabase, 60000);
    })
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Function to load items from JSON file
const loadItemsFromJson = async () => {
    try {
        const data = await fs.readFile(ITEM_FILE_PATH);
        return JSON.parse(data);
    } catch (err) {
        console.error('Error loading items from JSON file:', err);
        throw err;
    }
};

// Function to update items in the database
const updateItemsInDatabase = async () => {
    try {
        const itemsFromJson = await loadItemsFromJson();
        const itemsFromJsonArray = Object.values(itemsFromJson).flat();
        const itemsInDatabase = await Item.find();

        for (const item of itemsFromJsonArray) {
            const existingItem = itemsInDatabase.find(dbItem => dbItem.name === item.name);
            if (existingItem) {
                // Update item price based on market conditions
                const marketFactor = Math.random() * 0.4 - 0.2; // Random value between -0.2 and 0.2
                const newPrice = Math.round(existingItem.price * (1 + marketFactor));
                existingItem.price = newPrice;
                await existingItem.save();
            } else {
                await Item.create(item);
            }
        }
        console.log('Items in database updated successfully');
    } catch (err) {
        console.error('Error updating items in database:', err);
    }
};

// Routes
app.get('/', (req, res) => {
    res.send('Hello, welcome to the Fantasy Merchant API!');
});

app.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/gold', (req, res) => {
    res.json({ gold: req.session.playerGold });
});

app.post('/items/:id/buy', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, price, quantity } = req.body;
        // Check if the player has enough gold to buy the item
        if (req.session.playerGold >= price * quantity) {
            // Deduct the price from the player's gold balance
            req.session.playerGold -= price * quantity;
            // Add the item to the player's inventory
            const inventory = req.session.inventory || [];
            const existingItem = inventory.find(item => item.id === itemId && item.price === price);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                inventory.push({ id: itemId, name, price, quantity });
            }
            req.session.inventory = inventory;
            res.json({ name, quantity, playerGold: req.session.playerGold });
        } else {
            res.status(400).json({ message: 'Insufficient gold to buy the item' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/items/:id/sell', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, price, quantity } = req.body;
        // Remove the item from the player's inventory
        const inventory = req.session.inventory || [];
        const itemIndex = inventory.findIndex(item => item.id === itemId && item.price === price);
        if (itemIndex !== -1) {
            const item = inventory[itemIndex];
            if (item.quantity > quantity) {
                item.quantity -= quantity;
            } else {
                inventory.splice(itemIndex, 1);
            }
            req.session.inventory = inventory;
            // Add the price to the player's gold balance
            req.session.playerGold += price * quantity;
            res.json({ name, playerGold: req.session.playerGold });
        } else {
            res.status(400).json({ message: 'Item not found in inventory' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});