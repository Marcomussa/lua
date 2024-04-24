document.addEventListener('DOMContentLoaded', function() {
    const storedItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const storedItemsContainer = document.getElementById('stored-items');

    if (storedItems.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.textContent = 'Carrito vacío';
        storedItemsContainer.appendChild(emptyMessage);
    } else {
        storedItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.textContent = `${item.quantity} x ${item.name} (${item.size}) - $${item.price * item.quantity}`;
            storedItemsContainer.appendChild(itemElement);
        });
    }
});
