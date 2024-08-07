require('dotenv').config()
const express = require("express")
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors')
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, ServerApiVersion, UUID } = require('mongodb');
          
//! SDK de Mercado Pago
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const client = new MercadoPagoConfig({ 
    accessToken: process.env.ACCESS_TOKEN_MEX
})

//! Mongo DB Settings
const uriMongo = `mongodb+srv://desarrollo:${process.env.MONGO_PASS}@luacuppayments.pihi42d.mongodb.net/?retryWrites=true&w=majority&appName=LuacupPayments`
const mongo = new MongoClient(uriMongo, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
})

//! Mongo Conection & Get Payment ID's
let dbPayments;
let paymentsCollection;
let dbPaypalOrders;
let paypalOrdersCollection;

async function connectToMongoDB() {
  try {
    await mongo.connect();
    console.log('Connected to MongoDB');

    // Conectar a la base de datos "Payments-IDs"
    dbPayments = mongo.db('Payments-IDs');
    paymentsCollection = dbPayments.collection('Payments');

    // Conectar a la base de datos "Paypal-Orders"
    dbPaypalOrders = mongo.db('pp-orders');
    paypalOrdersCollection = dbPaypalOrders.collection('orders');

  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  }
}

connectToMongoDB();


//! Express Settings  
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/html/', 'views'));
app.use(express.static(path.join(__dirname, 'html')));
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//! Routes
app.get('/', (req, res) => {
    res.render('index')
})

app.get('/luacup', (req, res) => {
    res.render('luacup')
})

app.get('/blog', (req, res) => {
    res.render('blog')
})

app.get('/higiene-menstrual', (req, res) => {
    res.render('higiene')
})

app.get('/pobreza-menstrual', (req, res) => {
    res.render('pobreza')
})

app.get('/cart', (req, res) => {
    res.render('cart', {
        result: null,
        name: '',
        phone: '',
        email: '',
        state: '',
        address: '',
        floor: '',
        city: '',
        zip: '',
        details: ''
    })
})

app.post('/create-preference', async (req, res) => {
    const { name, phone, email, street, city, zip, floor, state, addressDetails, shipmentProvider, shipmentDays, shipmentPrice } = req.body.metadata[0]

    try {
        const body = {
            items: req.body.items, 
            back_urls: {
                success: 'https://luacup.onrender.com',
                pending: 'https://luacup.onrender.com',
                failure: 'https://luacup.onrender.com'
            },
            auto_return: "approved",
            notification_url: 'https://luacup.onrender.com/webhook',
            metadata: {
                customer_name: name,
                customer_phone: phone,
                customer_email: email,
                customer_floor: floor,
                customer_address: street,
                customer_city: city,
                customer_state: state,
                customer_zip: zip,
                customer_details: addressDetails,
                customer_shipment_type: shipmentProvider,
                customer_shipment_price: shipmentPrice,
                customer_shipment_days: shipmentDays
            },
            payer: {
                'name': name,
                'address': {
                    'zip_code': zip,
                    'street_name': `${street, floor, city, state, addressDetails}`
                },
                'email': email,
            }
        }

        const preference = new Preference(client)
        const result = await preference.create({ body })

        res.json({
            id: result.id
        })
    } catch (error) {
        return error
    }
})

app.post('/quotation', async (req, res) => {
    const { name, phone, email, state, address, floor, city, zip, message } = req.body;

    const quotation = 
    {
        "address_from":{
            "name": 'Sandra Kalach',
            'company': 'Lua Cup',
            'street1': 'Calzada de la naranja 1G',
            'city': 'Naucalpan de Juarez', 
            'state': 'Ciudad de Mexico',
            'zip': '53370',
            'phone': '+525591350245',
            'email': 'luacup21@gmail.com',
            'country': 'MX'
        },
        "address_to":{
            name,
            "street1": address,
            company: message,
            city,
            state,
            zip,
            country: 'MX',
            phone,
            email
        },
        "parcels":[
            {
                "length":7,
                "height":8,
                "width":7,
                "distance_unit":"cm",
                "weight":0.5,
                "mass_unit":"kg",
                "reference":"Lua Cup"
            }
        ],
        "save_order": false
} 
    const response = await axios.post('https://api.myeship.co/rest/quotation', quotation, {
        headers: {
            'Content-Type': 'application/json',
            'api-key': `${process.env.API_KEY_ESHIP_PROD}`
        }
    })

    console.log(response.data)

    res.render('cart', { 
        result: response.data ? response.data : '',
        name: name,
        phone: phone,
        email: email,
        state: state,
        address: address,
        floor: floor,
        city: city,
        zip: zip,
        details: message,
    })

    return response
});

app.post('/webhook', (req, res) => {
    const paymentId = req.query.id;
  
    paymentsCollection.findOne({ paymentId: paymentId })
        .then(paymentProcessed => {
            if (!paymentProcessed) {
                const payment = new Payment(client)
                payment.get({ 
                    id: paymentId 
                })
                .then(data => {
                    const regex = /Cantidad: (\d+)/g
                    let match
                    let totalCantidad = 0

                    while((match = regex.exec(data.description)) !== null){
                        totalCantidad += parseInt(match[1], 10)
                    }

                    let relevantData = {
                customer: {
                  'Nombre': data.metadata.customer_name,
                  'Email': data.metadata.customer_email,
                  'Direccion': data.metadata.customer_address,
                  'Piso': data.metadata.customer_floor,
                  'Ciudad': data.metadata.customer_city,
                  'Estado': data.metadata.customer_state,
                  'ZIP': data.metadata.customer_zip,
                  'Detalles': data.metadata.customer_details
                },
                order: {
                  'Orden': data.description,
                  'TipoEnvio': data.metadata.customer_shipment_type,
                  'CostoEnvio': data.metadata.customer_shipment_price,
                  'DiasEnvio': data.metadata.customer_shipment_days
                }
                    }
  
                    let orderDetails = {
                'address_from': {
                  'name': 'Sandra Kalach',
                  'company': 'Lua Cup',
                  'street1': 'Calzada de la naranja 1G',
                  'city': 'Naucalpan de Juarez',
                  'state': 'Ciudad de Mexico',
                  'zip': '53370',
                  'phone': '+525591350245',
                  'email': 'luacup21@gmail.com',
                  'country': 'MX'
                },
                'address_to': {
                  'name': data.metadata.customer_name,
                  'street1': data.metadata.customer_address,
                  'city': data.metadata.customer_city,
                  'state': data.metadata.customer_state,
                  'zip': data.metadata.customer_zip,
                  'country': 'MX',
                  'phone': data.metadata.customer_phone,
                  'email': data.metadata.customer_email
                },
                'order_info': {
                    'shipment_type': `${data.metadata.customer_shipment_type} | ${data.metadata.customer_shipment_days} dia/s`
                },
                'items': [{
                    'quantity': totalCantidad,
                    'price': 450,
                    'description': data.description
                }]
                    }
  
                    sendConfirmationEmail(data.metadata.customer_email, relevantData)
                    sendConfirmationEmail('luacup21@gmail.com', relevantData)
  
                    paymentsCollection.insertOne({ 
                        paymentId: paymentId 
                    })
                    .then(() => {
                        return axios.post('https://api.myeship.co/rest/order', orderDetails, {
                            headers: {
                                'Content-Type': 'application/json',
                                'api-key': `${process.env.API_KEY_ESHIP_PROD}`
                            }
                        });
                    })
                    .then(response => {
                        res.status(200).json({ message: 'Webhook procesado exitosamente.', data: response.data });
                    })
                    .catch(err => {
                        console.log('Error procesando el webhook:', err.message);
                    });
                })
            .catch(err => {
              console.error('Error obteniendo datos del pago:', err);
            });
        } else {
          res.status(200).json({ message: 'Acción única ya ejecutada para este pago.' });
        }
      })
      .catch(err => {
        console.error('Error verificando el estado del pago:', err);
        res.status(500).json({ error: 'Error verificando el estado del pago.' });
      });
})

const sendConfirmationEmail = (email, orderData) => {
    let transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        port: process.env.EMAIL_PORT, 
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }, 
        tls: {
            rejectUnauthorized: false
        }
    })

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Confirmación de Pedido',
        text: `¡Recibimos tu Pedido, muchas gracias por confiar en Lúa Cup!`,
        html: `
            <h2>Sus datos son los siguientes:</h2> 
            <b>Nombre y Apellido: ${orderData.customer.Nombre} </b> <br>
            <b>Email: ${orderData.customer.Email} </b> <br>
            <b>Direccion: ${orderData.customer.Direccion}</b>  <br>
            <b>Piso: ${orderData.customer.Piso} </b> <br>
            <b>Estado: ${orderData.customer.Estado}</b>  <br>
            <b>Ciudad: ${orderData.customer.Ciudad} </b> <br>
            <b>ZIP: ${orderData.customer.ZIP} </b> <br>
            <b>Detalles extras de la direccion: ${orderData.customer.Detalles}</b>  <br>
            <b>Detalles de la orden: ${orderData.order.Orden}</b>  <br>
            <b>Detalles del metodo de envio: 
                <ul>
                    <li>Proveedor: ${orderData.order.TipoEnvio} </li>
                    <li>Costo de envio: $${orderData.order.CostoEnvio}</li>
                    <li>Dias: ${orderData.order.DiasEnvio} Dia/s</li>
                </ul>
            <br>

            <h3>¡Muchas gracias! Despacharemos tu pedido hoy mismo.</h3>`
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email enviado: ' + info.response);
    });
}

const sendConfirmationEmailPayPal = (email, orderData) => {
    const orderMetadata = orderData.metadata[0]
    const orderItems = orderData.items

    let transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        port: process.env.EMAIL_PORT, 
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }, 
        tls: {
            rejectUnauthorized: false
        }
    })

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Confirmación de Pedido',
        text: ``,
        html: `
            <h1>¡Recibimos tu Pedido, muchas gracias por confiar en Lúa Cup!</h1>
            <h2>Sus datos son los siguientes:</h2> 
            <b>Nombre y Apellido: ${orderMetadata.name} </b> <br>
            <b>Email: ${orderMetadata.email} </b> <br>
            <b>Direccion: ${orderMetadata.street}</b>  <br>
            <b>Piso: ${orderMetadata.floor} </b> <br>
            <b>Estado: ${orderMetadata.state}</b>  <br>
            <b>Ciudad: ${orderMetadata.city} </b> <br>
            <b>ZIP: ${orderMetadata.zip} </b> <br>
            <b>Detalles extras de la direccion: ${orderMetadata.addressDetails}</b>  <br>
            <b>Detalles de la orden: ${orderItems[0].title}</b>  <br>
            <b>Precio Total: ${orderItems[0].unit_price}</b>
            <b>Detalles del metodo de envio: 
                <ul>
                    <li>Proveedor: ${orderMetadata.shipmentProvider} </li>
                    <li>Costo de envio: $${orderMetadata.shipmentPrice}</li>
                    <li>Dias: ${orderMetadata.shipmentDays} Dia/s</li>
                </ul>
            <br>

            <h3>¡Muchas gracias! Despacharemos tu pedido hoy mismo.</h3>`
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email enviado: ' + info.response);
    });
}

//! Paypal
app.post('/create-order', async (req, res) => {
    const orderData = req.body
    const { unit_price } = req.body.items[0]
    orderData.ID = uuidv4()

    //console.log(`Create Order Req Body: ${JSON.stringify(orderData)}`)

    const order = {
        intent: 'CAPTURE',
        purchase_units: [ 
            {
                amount: {
                    currency_code: 'MXN',
                    value: unit_price
                },
                custom_id: orderData.ID
            }
        ],
        application_context: {
            brand_name: 'luacup.com',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: 'https://luacup.onrender.com/capture-order',
            cancel_url: 'https://luacup.onrender.com'
        }
    }

    //console.log(`Create Order: ${JSON.stringify(order)}`)

    const params = new URLSearchParams()
    params.append('grant_type', 'client_credentials')

    const { data: { access_token } } = await axios.post(`${process.env.PAYPAL_API}/v1/oauth2/token`, 
    params, {
        headers: {   
           "Content-Type": "application/x-www-form-urlencoded" 
        },
        auth: {
            username: process.env.PAYPAL_API_CLIENT,
            password: process.env.PAYPAL_API_SECRET
        }
    })

    const response = await axios.post(`${process.env.PAYPAL_API}/v2/checkout/orders`, order, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access_token}`
        }
    });

    await paypalOrdersCollection.insertOne(orderData)

    return res.json(response.data)
})

app.get('/capture-order', async (req, res) => {
    const { token } = req.query

    const response = await axios.post(`${process.env.PAYPAL_API}/v2/checkout/orders/${token}/capture`, {}, {
        auth: {
            username: process.env.PAYPAL_API_CLIENT,
            password: process.env.PAYPAL_API_SECRET
        }
    })

    const data = await response.data

    //.log(`Capture Order: ${JSON.stringify(data)}`)

    //console.log(`Order ID Capture: ${data.purchase_units[0].payments.captures[0].custom_id}`)

    paypalOrdersCollection.findOne({ 
        ID: data.purchase_units[0].payments.captures[0].custom_id
    })
    .then(order => {
        if (!order) {
            return res.status(404).send('Order not found')
        }
        //console.log(`FINAL ORDER DATA: ${JSON.stringify(order)}`)

        const orderMetadata = order.metadata[0]
        const orderItems = order.items
        const regex = /Cantidad: (\d+)/g
        let match
        let totalCantidad = 0

        while((match = regex.exec(orderItems[0].title)) !== null){
            totalCantidad += parseInt(match[1], 10)
        }

        let orderDetails = {
            'address_from': {
              'name': 'Sandra Kalach',
              'company': 'Lua Cup',
              'street1': 'Calzada de la naranja 1G',
              'city': 'Naucalpan de Juarez',
              'state': 'Ciudad de Mexico',
              'zip': '53370',
              'phone': '+525591350245',
              'email': 'luacup21@gmail.com',
              'country': 'MX'
            },
            'address_to': {
              'name': orderMetadata.name,
              'street1': orderMetadata.street,
              'city': orderMetadata.city,
              'state': orderMetadata.state,
              'zip': orderMetadata.zip,
              'country': 'MX',
              'phone': orderMetadata.phone,
              'email': orderMetadata.mail
            },
            'order_info': {
                'shipment_type': `${orderMetadata.shipmentProvider} | ${orderMetadata.shipmentDays} dia/s`
            },
            'items': [{
                'quantity': totalCantidad,
                'price': 450,
                'description': orderItems[0].title
            }]
        }

        sendConfirmationEmailPayPal(orderMetadata.email, order)

        res.redirect('https://luacup.com')

        return axios.post('https://api.myeship.co/rest/order', orderDetails, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': `${process.env.API_KEY_ESHIP_PROD}`
            }
        })
    })
    .catch(err => {
        console.error(err)
        res.status(500).send('Internal Server Error')
    })
})

app.get('/cancel-order', (req, res) => {
    
})

//! Server
app.listen(3000, () => {
    console.log("Server on Port 3000")
})

