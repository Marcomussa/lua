function addToCart(productId) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const selectedSize = document.querySelector('.select-container select:nth-child(1)').value;
    const selectedColor = document.querySelector('.select-container select:nth-child(2)').value;
    
    // Check if the product already exists in the cart
    const existingProductIndex = cartItems.findIndex(item => item.productId === productId && item.size === selectedSize && item.color === selectedColor);
    if (existingProductIndex !== -1) {
        // If the product already exists, update its quantity
        cartItems[existingProductIndex].quantity++;
    } else {
        // If the product doesn't exist, add it to the cart
        const product = {
            productId: productId,
            name: `Lúa Cup`,            
            price: 450,
            quantity: 1,
            size: selectedSize,
            color: selectedColor
        };
        cartItems.push(product);
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateTotal();
}