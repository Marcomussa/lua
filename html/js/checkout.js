document.addEventListener('DOMContentLoaded', function() {
    renderCartItems()
    updateTotal()
})

const mp = new MercadoPago('')  
let btnSubmit = document.querySelector('#submit-form')
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

let quotationTest = 
    {
        "address_from":{
            "name":"Not2 Fitness",
            "company":"Not2 Fitness",
            "street1":"2065 Progress St., Ste A",
            "street2":"",
            "city":"Vista",
            "state":"CA",
            "zip":"92081",
            "country":"US",
            "phone":"6559225181",
            "email":"shipping@not2fit.com"
        },
        "address_to":{
            "name":"Jennifer Smith",
            "company":"Jennifer Smith",
            "street1":"125 Bartley Drive",
            "street2":"",
            "city":"Newark",
            "state":"DE",
            "zip":"19702",
            "country":"US",
            "phone":"3053326755",
            "email":"jsmith@example.com"
        },
        "parcels":[
            {
                "length":30,
                "height":20,
                "width":10,
                "distance_unit":"cm",
                "weight":1,
                "mass_unit":"kg",
                "reference":"Reference 1"
            }
        ],
        "order_info":{
            "order_num":"BA12041",
            "shipment_type":"Next Day",
            "status":0,
            "paid":1
        }
} 
let quotationProd = {
    "address_from": {
        "name": 'Sandra Kalach',
        'company': 'Lua Cup',
        'street1': 'Calzada de la naranja 1G',
        'city': 'Naucalpan de Juarez', 
        'state': 'Ciudad de Mexico',
        'zip': '53370',
        'phone': '+525591350245',
        'email': 'contacto@segmail.co',
        'country': 'MX'
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
    ]
}      
async function createOrder(shipmentPrice){
    const cart = localStorage.getItem('cartItems')
    const products = JSON.parse(cart)
    const totalQuantity = products.reduce((acc, product) => acc + product.quantity, 0)

    const order = {
        items: [
            {
                title: products[0].description, 
                quantity: totalQuantity,
                unit_price: 450,
                currency_id: 'MXN'
            }
        ]
    }
    console.log(order)
    const response = await fetch('http://localhost:3000/create-preference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    })

    const preference = await response.json()
    createCheckoutButton(preference.id)
}

const createCheckoutButton = (preferenceId) => {
    const bricksBuilder = mp.bricks()

    const renderComponent = async () => {
        await bricksBuilder.create("wallet", "wallet_container", {
            initialization: {
                preferenceId: preferenceId
            }
        })
    }

    renderComponent()
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
        }
    })
}

function getOrderData() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || []
    const itemsArray = generateItemsArray(cartItems)

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

    return orderData
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('stored-items')
    cartItemsContainer.innerHTML = ''

    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || []

    if (cartItems.length === 0) {
        const emptyMessage = document.createElement('p')
        emptyMessage.innerHTML = `Carrito Vacio. <a class="see-products" href="/html/luacup.html">Ver Productos</a>`
        cartItemsContainer.appendChild(emptyMessage)
    } else {
        cartItems.forEach((item, index) => {
            const itemElement = document.createElement('div')
            itemElement.classList.add('cart-item')

            const quantitySpan = document.createElement('span')
            quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`
            

            const increaseButton = document.createElement('button')
            increaseButton.classList.add('btn', 'btn-primary')
            increaseButton.textContent = '+'
            increaseButton.addEventListener('click', function() {
                cartItems[index].quantity++
                quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`
                localStorage.setItem('cartItems', JSON.stringify(cartItems))
                updateTotal()
            })

            const decreaseButton = document.createElement('button')
            decreaseButton.classList.add('btn', 'btn-primary')
            decreaseButton.textContent = '-'
            decreaseButton.addEventListener('click', function() {
                if (cartItems[index].quantity > 1) {
                    cartItems[index].quantity--
                    quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`
                    localStorage.setItem('cartItems', JSON.stringify(cartItems))
                    updateTotal()
                }
            })

            const deleteButton = document.createElement('button')
            deleteButton.textContent = 'Eliminar'
            deleteButton.classList.add('btn', 'btn-danger')
            
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
                        cartItems.splice(index, 1)
                        localStorage.setItem('cartItems', JSON.stringify(cartItems))
                        renderCartItems()
                        updateTotal()
                    }
                })
            })

            itemElement.appendChild(quantitySpan)
            itemElement.appendChild(increaseButton)
            itemElement.appendChild(decreaseButton)
            itemElement.appendChild(deleteButton)
            cartItemsContainer.appendChild(itemElement)
        })
    }
}

function updateTotal() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || []
    const total = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    document.getElementById('totalPrice').textContent = `Subtotal: $${total.toFixed(2)}`
    return total
}
