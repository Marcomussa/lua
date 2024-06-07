require('dotenv').config()
const express = require("express")
const app = express()
const bodyParser = require('body-parser');
const cors = require('cors')
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

          
// SDK de Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago')
// Agrega credenciales
const client = new MercadoPagoConfig({ 
    accessToken: process.env.ACCESS_TOKEN_MEX
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/html/', 'views'));
app.use(express.static(path.join(__dirname, 'html')));
app.use(cors())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
    const { name, phone, email, address, city, zip, floor, state, details } = req.body.metadata[0]

    console.log(req.body)

    try {
        const body = {
            items: req.body.items, 
            back_urls: {
                success: 'https://google.com',
                pending: 'https://google.com',
                failure: 'https://google.com'
            },
            auto_return: "approved",
            //notification_url: 'https://6edc-181-110-147-138.ngrok-free.app/webhook'
            metadata: {
                customer_name: name,
                customer_email: email,
                customer_floor: floor,
                customer_address: address,
                customer_city: city,
                customer_state: state,
                customer_zip: zip,
                customer_details: details
            },
            payer: {
                'name': name,
                'address': {
                    'zip_code': zip,
                    'street_name': `${address, floor, city, state, details}`
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

let orderData = {}

app.post('/quotation', async (req, res) => {
    const { name, phone, email, state, address, floor, city, zip, details } = req.body;

    const orderId = Date.now().toString();

    orderData[orderId] = { name, phone, email, state, address, floor, city, zip, details };

    const quotation = 
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
    const response = await axios.post('https://apiqa.myeship.co/rest/quotation', quotation, {
        headers: {
            'Content-Type': 'application/json',
            'api-key': `${process.env.API_KEY}`
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
        details: details
    })

    return response
});

// app.post('/webhook', async (req, res) => {
//     const payment = req.body;

//     if (payment.type === 'payment') {
//         try {
//             const response = await client.payment.get(payment.data.id);
//             if (response.body.status === 'approved') {
//                 sendConfirmationEmail(response.body.payer.email);
//             }
//             res.sendStatus(200);
//         } catch (error) {
//             console.log(error);
//             res.sendStatus(500);
//         }
//     } else {
//         res.sendStatus(400);
//     }
// });

app.post('/webhook', async (req, res) => {
    const payment = req.query
    const paymentId = req.query.id
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`
        }
    })

    if (response.ok) {
        const paymentData = await response.json();
        if (paymentData.status === 'approved') {
            const email = paymentData.payer.email
            sendConfirmationEmail(email)

            //! POST eSHIP
            const eshipResponse = await fetch('https://apiqa.myeship.co/rest/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': process.env.API_KEY_ESHIP
                    },
                    body: JSON.stringify({
                        //! Como recibo la data?
                    })
            });

            if (eshipResponse.ok) {
                res.sendStatus(200);
            } else {
                res.status(500).send('Error al enviar los datos a Eship');
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
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
};

// Middleware para verificar la firma del webhook
app.use((req, res, next) => {
    try {
        verifyWebhookSignature(req, res, req.rawBody);
        next();
    } catch (err) {
        res.status(401).send('Firma del webhook no válida');
    }
});

const sendConfirmationEmail = (email) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Confirmación de Pedido',
        text: 'Gracias por tu compra. Tu pedido ha sido confirmado.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email enviado: ' + info.response);
    });
};

app.listen(3000, () => {
    console.log("Server on Port 3000")
})