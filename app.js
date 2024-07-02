require('dotenv').config()
const express = require("express")
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors')
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion } = require('mongodb');
const serverless = require('serverless-http')
          
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
let db
let paymentsCollection
async function connectToMongoDB() {
    try {
      await mongo.connect();
      console.log('Connected to MongoDB');
      db = mongo.db('Payments-IDs');
      paymentsCollection = db.collection('Payments')
    } catch (err) {
      console.error('Error connecting to MongoDB:', err)
      process.exit(1);
    }
}
connectToMongoDB()


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

    console.log(req.body.metadata[0])

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
                "length":30,
                "height":20,
                "width":10,
                "distance_unit":"cm",
                "weight":0.25,
                "mass_unit":"kg",
                "reference":"Lua Cup"
            }
        ]
} 
    const response = await axios.post('https://api.myeship.co/rest/quotation', quotation, {
        headers: {
            'Content-Type': 'application/json',
            'api-key': `${process.env.API_KEY_ESHIP_PROD}`
        }
    })

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
                    };
  
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
                    };

                    console.log(orderDetails)
  
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

// Función para verificar la firma del webhook
const verifyWebhookSignature = (req, res, buf) => {
    const secret = process.env.WEBHOOK_SECRET;
    const hash = crypto.createHmac('sha256', secret)
                       .update(buf)
                       .digest('hex');
    const signature = req.headers['x-hub-signature'];

    if (hash !== signature) {
        throw new Error('Firma del webhook no válida');
    }
}

// Middleware para verificar la firma del webhook
app.use((req, res, next) => {
    try {
        verifyWebhookSignature(req, res, req.rawBody);
        next();
    } catch (err) {
        res.status(401).send('Firma del webhook no válida');
    }
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

//! Paypal
app.get('/create-order', (req, res) => {
    const { name, phone, email, street, city, zip, floor, state, addressDetails, shipmentProvider, shipmentDays, shipmentPrice } = req.body.metadata[0]

    const order = {
        intent: 'CAPTURE',
        purchase_units: [ 
            {
                amount: {
                    currency_code: 'MXN',
                    value: req.body.items.unit_price
                }
            }
        ],
        application_context: {
            brand_name: 'Lúa Cup',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY NOW',
            return_url: 'https://luacup.onrender.com/capture-order',
            cancel_url: 'https://luaucup.onrender.com/cancel-order'
        }
    }

    axios.post(`${process.env.PAYPAL_API}/v2/checkout/orders`, order)
})

app.get('/capture-order', (req, res) => {
    
})

app.get('/cancel-order', (req, res) => {
    
})

//! Server
app.listen(3000, () => {
    console.log("Server on Port 3000")
})

