function addToCart(productId) {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const selectedSize = document.querySelector('.select-container select:nth-child(1)').value;
    
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
        };
        cartItems.push(product);
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateTotal();
}

// if($('.accordion-box').length){
//     $(".accordion-box").on('click', '.acc-btn', function() {
        
//         var outerBox = $(this).parents('.accordion-box');
//         var target = $(this).parents('.accordion');
        
//         if($(this).hasClass('active')!==true){
//             $(outerBox).find('.accordion .acc-btn').removeClass('active');
//         }
        
//         if ($(this).next('.acc-content').is(':visible')){
//             return false;
//         }else{
//             $(this).addClass('active');
//             $(outerBox).children('.accordion').removeClass('active-block');
//             $(outerBox).find('.accordion').children('.acc-content').slideUp(300);
//             target.addClass('active-block');
//             $(this).next('.acc-content').slideDown(300);	
//         }
//     });	
// }
