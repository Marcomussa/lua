document.addEventListener('DOMContentLoaded', function() {
    renderCartItems()
    updateTotal()
    validateCheckout()
    freezeButtons()
    paypalBtn.addEventListener('click', payPalOrder)
})

const paypalContainer = document.getElementById('checkout-container')
const paypalBtn = document.getElementById('paypal-button')
// APP_USR-534177af-5707-41cc-852e-a44929cf1b34
const mp = new MercadoPago('APP_USR-534177af-5707-41cc-852e-a44929cf1b34', {
    locale: 'es-MX'
})  

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
     
async function createOrder(shipmentPrice, shipmentProvider, shipmentDays){
    paypalContainer.style.display = 'block'
    const cart = localStorage.getItem('cartItems')
    const products = JSON.parse(cart)
    const sumaQuantity = products.reduce((acumulador, currentValue) => {
        return acumulador + currentValue.quantity
    }, 0)
    const totalQuantity = products.reduce((acc, product) => acc + product.quantity, 0)
    const resultString = products.map(product => {
        return `${product.name}, Cantidad: ${product.quantity}, Size: ${product.size}`
    }).join(' | ')

    let customer = document.querySelector("#name-order").value
    let phone = document.querySelector("#phone-order").value
    let email = document.querySelector("#email-order").value
    let state = document.querySelector("#state-order").value
    let street = document.querySelector("#address-order").value
    let floor = document.querySelector("#floor-order").value
    let city = document.querySelector("#city-order").value
    let zip = document.querySelector("#zip-order").value
    let addressDetails = document.querySelector("#details-order").value

    const order = {
        items: [
            {
                title: resultString, 
                quantity: 1,
                unit_price: 450,
                currency_id: 'MXN'
            }
        ],      
        metadata: [
            {
                name: customer,
                email,
                phone,
                street,
                floor,
                city,
                state,
                zip,
                addressDetails,
                shipmentProvider,
                shipmentDays,
                shipmentPrice
            }
        ]
    }

    order.metadata.shipmentPrice = shipmentPrice
    order.metadata.shipmentProvider = shipmentProvider
    order.metadata.shipmentDays = shipmentDays
    
    //* Calculo final de precio
    order.items[0].unit_price = Number(((order.items[0].unit_price * Number(sumaQuantity)) + Number(shipmentPrice)).toFixed(2))
     
    const responseMP = await fetch('https://luacup.onrender.com/create-preference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    })

    const preferenceMP = await responseMP.json()
    createCheckoutButton(preferenceMP.id)
}

async function payPalOrder(){
    const response = await fetch('/create-order', {
        method: 'POST',
    })
    const data = await response.json()
    console.log(data)
}

let checkoutButtonCreated = false;

const createCheckoutButton = (preferenceId) => {
  if (!checkoutButtonCreated) {
    const bricksBuilder = mp.bricks()

    const renderComponent = async () => {
      await bricksBuilder.create("wallet", "wallet_container", {
        initialization: {
          preferenceId: preferenceId
        }
      })
      checkoutButtonCreated = true; 
    }

    renderComponent()
  }
}

function freezeButtons(){
    const currentPath = window.location.pathname
    let increaseButton = document.getElementsByClassName('increaseButton')
    let decreaseButton = document.getElementsByClassName('decreaseButton')
    
    if(currentPath == '/quotation'){
        for (let i = 0; i < increaseButton.length; i++) {
           increaseButton[i].classList.add('disabled')
           decreaseButton[i].classList.add('disabled') 
        }
    }
}

function validateCheckout(){
    let orderForm = document.getElementById('order-form')

    orderForm.addEventListener('submit', function(event) {
        const requiredFields = document.querySelectorAll('.required')
        let isValid = true
    
        requiredFields.forEach(function(field) {
            if (!field.value.trim()) {
                field.style.borderColor = 'red'
                isValid = false;
            } else {
                field.style.borderColor = ''
            }
        });
    
        if (!isValid) {
            event.preventDefault();
            Swal.fire({
              title: "Por favor",
              html: `Complete todos los campos requeridos`,
              icon: "error",
            })
        } 
    })
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('stored-items')
    cartItemsContainer.innerHTML = ''

    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || []

    if (cartItems.length === 0) {
        const emptyMessage = document.createElement('p')
        emptyMessage.innerHTML = `Carrito Vacio. <a class="see-products" href="/luacup">Ver Productos</a>`
        cartItemsContainer.appendChild(emptyMessage)
    } else {
        cartItems.forEach((item, index) => {
            const itemElement = document.createElement('div')
            itemElement.classList.add('cart-item')

            const quantitySpan = document.createElement('span')
            quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`
            

            const increaseButton = document.createElement('button')
            increaseButton.classList.add('btn', 'btn-primary', 'increaseButton')
            increaseButton.textContent = '+'
            increaseButton.addEventListener('click', function() {
                cartItems[index].quantity++
                quantitySpan.textContent = `${item.quantity} x ${item.name} - ${item.size} - $${item.price * item.quantity}`
                localStorage.setItem('cartItems', JSON.stringify(cartItems))
                updateTotal()
            })

            const decreaseButton = document.createElement('button')
            decreaseButton.classList.add('btn', 'btn-primary', 'decreaseButton')
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
            deleteButton.classList.add('btn', 'btn-danger', 'deleteButton')
            
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
