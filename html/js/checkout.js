document.addEventListener('DOMContentLoaded', function() {
    renderCartItems();
    updateTotal();
});

let form = document.querySelector("#order-form")
let customer = document.querySelector("#name-order")
let phone = document.querySelector("#phone-order")
let email = document.querySelector("#email-order")
let state = document.querySelector("#state-order")
let street = document.querySelector("#address-order")
let floor = document.querySelector("#floor-order")
let city = document.querySelector("#city-order")
let zip = document.querySelector("#zip-order")
let addressDetails = document.querySelector("#details-order")

function tests(){
    form.addEventListener("submit", (e) => {
        e.preventDefault()
        getOrderData()
    })
}
tests()

async function quotation() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || []
    const itemsArray = generateItemsArray(cartItems)
    let quotation = {
        "address_from": {
            // Detalles de Lua Cup
        },
        "address_to": {
            "name": customer.value,
            "company": addressDetails.value,
            "street1": street.value,
            "city": city.value,
            "state": state.value,
            "zip": zip.value,
            "phone": phone.value,
            "email": email.value,
            "country": "MX"
        },
        "parcels":[
            {
                "length":30,
                "height":20,
                "width":10,
                "distance_unit": "cm",
                "weight": 1, 
                "mass_unit":"kg",
                "reference": null
            }
        ],
        "items": itemsArray,
    }
    const url = 'https://apiqa.myeship.co/rest/quotation'; 
    const apiKey = ''; 

    try {
        const response = await fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            },
            body: JSON.stringify(order)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        const data = await response.json();
        console.log(data); // Maneja la respuesta de la API aquí
    } catch (error) {
        console.error('Hubo un problema con la petición Fetch:', error);
    }
}

function generateItemsArray(cartItems) {
    return cartItems.map(item => {
        return {
            SKU: null,
            description: item.name,
            quantity: item.quantity,
            price: item.price,
            weight: "",
            currency: "MEX",
        };
    });
}

function getOrderData() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const itemsArray = generateItemsArray(cartItems);

    const orderData = {
        address_from: {
            // Detalles de Lua Cup
        },
        address_to: {
            name: customer.value,
            company: addressDetails.value,
            street1: street.value,
            city: city.value,
            state: state.value,
            zip: zip.value,
            phone: phone.value,
            email: email.value,
            country: "MX"
        },
        items: itemsArray,
    }

    console.log(JSON.stringify(orderData))
    return orderData
}

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
