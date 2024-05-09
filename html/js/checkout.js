document.addEventListener('DOMContentLoaded', function() {
    renderCartItems();
    updateTotal();
});

function renderCartItems() {
    const cartItemsContainer = document.getElementById('stored-items');
    cartItemsContainer.innerHTML = '';

    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

    if (cartItems.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.innerHTML = `Carrito Vacio. <a class="see-products" href="/html/luacup.html">Ver Productos</a>`
        cartItemsContainer.appendChild(emptyMessage);
    } else {
        cartItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');

            const quantitySpan = document.createElement('span');
            quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`;
            

            const increaseButton = document.createElement('button');
            increaseButton.classList.add('btn', 'btn-primary');
            increaseButton.textContent = '+';
            increaseButton.addEventListener('click', function() {
                cartItems[index].quantity++;
                quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                updateTotal();
            });

            const decreaseButton = document.createElement('button');
            decreaseButton.classList.add('btn', 'btn-primary');
            decreaseButton.textContent = '-';
            decreaseButton.addEventListener('click', function() {
                if (cartItems[index].quantity > 1) {
                    cartItems[index].quantity--;
                    quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`;
                    localStorage.setItem('cartItems', JSON.stringify(cartItems));
                    updateTotal();
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('btn', 'btn-danger');
            
            deleteButton.addEventListener('click', function() {
                Swal.fire({
                    title: "Estas segur@?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#d33",
                    cancelButtonText: "Volver",
                    cancelButtonColor: "#0a58ca",
                    confirmButtonText: "Eliminar"
                  }).then((result) => {
                    if (result.isConfirmed) {
                        cartItems.splice(index, 1);
                        localStorage.setItem('cartItems', JSON.stringify(cartItems));
                        renderCartItems();
                        updateTotal();
                    }
                })
            });

            itemElement.appendChild(quantitySpan);
            itemElement.appendChild(increaseButton);
            itemElement.appendChild(decreaseButton);
            itemElement.appendChild(deleteButton);
            cartItemsContainer.appendChild(itemElement);
        });
    }
}

function updateTotal() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    document.getElementById('totalPrice').textContent = `Total: $${total.toFixed(2)}`;
}
