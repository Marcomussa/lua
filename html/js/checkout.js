document.addEventListener('DOMContentLoaded', function() {
    renderCartItems()
    updateTotal()
})

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

const mp = new MercadoPago('APP_USR-534177af-5707-41cc-852e-a44929cf1b34')  

async function createOrder(){
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

function tests(){
    form.addEventListener("submit", (e) => {
        e.preventDefault()
        quotation()
    })
}
tests()

async function quotation() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || []
    const itemsArray = generateItemsArray(cartItems)
    let quotation = {
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

    let quotationTest = {
        "address_from": {
            "name":"Juan de la Barrera",
            "company": "Colegio Militar",
            "email":"jbarrera@myeship.co",
            "phone":"55 9135 0245",
            "street1":"Paseo de los Tamarindos 90",
            "street2":"Bosques de las Lomas",
            "city":"Cuajimalpa",
            "state": "CDMX",
            "country": "MX",
            "zip": "05120"
        },
        "address_to": {
            "name":"Juan Escutia",
            "company": "Colegio Militar",
            "email":"jescutia@myeship.co",
            "phone":"55 9135 0245",
            "street1":"Jesús del Monte 42",
            "street2":"Hacienda de las Palmas",
            "city":"Huixquilucan",
            "state":"MEX",
            "country":"MX",
            "zip":"52763"
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

    const url = 'http://localhost:3000/quotation' 
    console.log(quotation)
 
        const response = await fetch(url, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(quotationTest)
        })

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText)
        }

        const data = await response.json()
        console.log(data)

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
    document.getElementById('totalPrice').textContent = `Total: $${total.toFixed(2)}`
    return total
}
