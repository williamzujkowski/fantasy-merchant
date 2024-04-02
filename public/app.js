// Frontend JavaScript for Kingdom Trader
document.addEventListener('DOMContentLoaded', () => {
    const itemList = document.getElementById('item-list');
    const inventoryList = document.getElementById('inventory-list');
    const goldAmount = document.getElementById('gold-amount');

    // Function to fetch items from backend
    const fetchItems = async () => {
        try {
            const response = await fetch('/items');
            const data = await response.json();
            displayItems(data);
        } catch (err) {
            console.error('Error fetching items:', err);
        }
    };

    // Function to fetch player's gold balance from backend
    const fetchGoldBalance = async () => {
        try {
            const response = await fetch('/gold');
            const data = await response.json();
            updateGoldBalance(data.gold);
        } catch (err) {
            console.error('Error fetching gold balance:', err);
        }
    };

    // Function to display items in the marketplace
    const displayItems = (items) => {
        itemList.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            const buyButton = document.createElement('button');
            buyButton.innerText = 'Buy';
            buyButton.addEventListener('click', () => buyItem(item._id, item.name, item.price));
            li.innerText = `${item.name} - Price: ${item.price}`;
            li.appendChild(buyButton);
            itemList.appendChild(li);
        });
    };

    // Function to buy an item
    const buyItem = async (itemId, itemName, itemPrice) => {
        try {
            const response = await fetch(`/items/${itemId}/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: itemName, price: itemPrice, quantity: 1 })
            });
            const data = await response.json();
            console.log('Item bought:', data);
            // Update inventory UI
            addToInventory(itemId, itemName, itemPrice, data.quantity);
            // Update player's gold balance
            updateGoldBalance(data.playerGold);
        } catch (err) {
            console.error('Error buying item:', err);
        }
    };

    // Function to sell an item
    const sellItem = async (itemId, itemName, itemPrice, itemQuantity) => {
        try {
            const response = await fetch(`/items/${itemId}/sell`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: itemName, price: itemPrice, quantity: itemQuantity })
            });
            const data = await response.json();
            console.log('Item sold:', data);
            // Update inventory UI
            removeFromInventory(itemId, itemPrice, itemQuantity);
            // Update player's gold balance
            updateGoldBalance(data.playerGold);
        } catch (err) {
            console.error('Error selling item:', err);
        }
    };

    // Function to add an item to the inventory
    const addToInventory = (itemId, itemName, itemPrice, itemQuantity) => {
        const existingItem = inventoryList.querySelector(`li[data-item-id="${itemId}"][data-item-price="${itemPrice}"]`);
        if (existingItem) {
            const quantityElement = existingItem.querySelector('.item-quantity');
            const currentQuantity = parseInt(quantityElement.innerText.split(': ')[1]);
            quantityElement.innerText = `Quantity: ${currentQuantity + itemQuantity}`;
            const totalPriceElement = existingItem.querySelector('.item-total-price');
            const currentTotalPrice = parseInt(totalPriceElement.innerText.split(': ')[1]);
            totalPriceElement.innerText = `Total Price: ${currentTotalPrice + (itemPrice * itemQuantity)}`;
        } else {
            const inventoryItem = document.createElement('li');
            inventoryItem.setAttribute('data-item-id', itemId);
            inventoryItem.setAttribute('data-item-price', itemPrice);
            const sellButton = document.createElement('button');
            sellButton.innerText = 'Sell';
            sellButton.addEventListener('click', () => sellItem(itemId, itemName, itemPrice, 1));
            inventoryItem.innerHTML = `
          <span class="item-name">${itemName}</span>
          <span class="item-price">Price: ${itemPrice}</span>
          <span class="item-quantity">Quantity: ${itemQuantity}</span>
          <span class="item-total-price">Total Price: ${itemPrice * itemQuantity}</span>
        `;
            inventoryItem.appendChild(sellButton);
            inventoryList.appendChild(inventoryItem);
        }
    };

    // Function to remove an item from the inventory
    const removeFromInventory = (itemId, itemPrice, itemQuantity) => {
        const inventoryItem = inventoryList.querySelector(`li[data-item-id="${itemId}"][data-item-price="${itemPrice}"]`);
        if (inventoryItem) {
            const quantityElement = inventoryItem.querySelector('.item-quantity');
            const currentQuantity = parseInt(quantityElement.innerText.split(': ')[1]);
            if (currentQuantity > itemQuantity) {
                quantityElement.innerText = `Quantity: ${currentQuantity - itemQuantity}`;
                const totalPriceElement = inventoryItem.querySelector('.item-total-price');
                const currentTotalPrice = parseInt(totalPriceElement.innerText.split(': ')[1]);
                totalPriceElement.innerText = `Total Price: ${currentTotalPrice - (itemPrice * itemQuantity)}`;
            } else {
                inventoryItem.remove();
            }
        }
    };

    // Function to update the player's gold balance
    const updateGoldBalance = (balance) => {
        goldAmount.innerText = balance;
    };

    // Fetch items and gold balance on page load
    fetchItems();
    fetchGoldBalance();
});