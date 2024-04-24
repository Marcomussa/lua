function addToCart(productId) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Buscar si el producto ya está en el carrito
    const existingProductIndex = cartItems.findIndex(item => item.productId === productId && item.size === (productId === 1 ? "Talla S" : "Talla L"));
    
    if (existingProductIndex !== -1) {
        // Si el producto ya está en el carrito, aumentar la cantidad
        cartItems[existingProductIndex].quantity += 1;
    } else {
        // Si el producto no está en el carrito, agregarlo
        const product = {
            productId: productId,
            name: `Producto ${productId}`,
            price: productId === 1 ? 10 : 15,
            quantity: 1,
            size: productId === 1 ? "Talla S" : "Talla L"
        };
        cartItems.push(product);
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
}
