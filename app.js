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
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
// Agrega credenciales
const client = new MercadoPagoConfig({ 
    accessToken: process.env.ACCESS_TOKEN_TEST_AR
})

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
                success: 'https://luacup.com',
                pending: 'https://luacup.com',
                failure: 'https://luacup.com'
            },
            auto_return: "approved",
            notification_url: 'https://a38b-181-110-147-138.ngrok-free.app/webhook',
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

 app.post('/webhook-test', async (req, res) => {
    const payment = req.body;

    if (payment.type === 'payment') {
        try {
            const response = await client.payment.get(payment.data.id);
            if (response.body.status === 'approved') {
                console.log('Webhook Ok')
                
                sendConfirmationEmail(response.body.payer.email);

                let orderData = {
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
                    "order_info":{
                        "order_num":"40172",
                        "paid":1,
                        "fulfillment":0,
                        "shipment_type":"Economy",
                        "total_price":"1300.99",
                        "total_shipment":"0.00",
                        "total_tax":"0.00",
                        "subtotal_price":"1300.99"
                    },
                    "items":[
                        {
                            "SKU":"BETP1125",
                            "description":"Hex Elite TPR Dumbbell 125",
                            "quantity":2,
                            "price":"227.50",
                            "weight":"125",
                            "currency":"USD"
                        },
                        {
                            "SKU":"RIGG1001",
                            "description":"Power Rack",
                            "quantity":1,
                            "price":"845.99",
                            "weight":"320",
                            "currency":"USD"
                        }
                    ]
                }             

                const response = await axios.post('https://apiqa.myeship.co/rest/order', orderData, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': `${process.env.API_KEY}`
                    }
                })
            }
            res.sendStatus(200);
        } catch (error) {
            console.log(error);
           res.sendStatus(500);
        }
    } else {
        res.sendStatus(400);
    }
});

app.post('/webhook', async (req, res) => {
    const payment = new Payment(client)
    const paymentId = req.query.id
    console.log(payment)

    payment.get({
        id: paymentId,
    })
    .then((data) => {
        console.log(data)
        return data
    })
    .catch((err) => {
        console.log(err)
        return err
    })

    sendConfirmationEmail('marcomussa567@gmail.com')
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

const sendConfirmationEmail = (email, orderData) => {
    let transporter = nodemailer.createTransport({
        service: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Confirmación de Pedido',
        text: `Nuevo Pedido Lua Cup
                ${orderData}`
    };

    //transporter.sendMail(mailOptions, (error, info) => {
        //if (error) {
            //return console.log(error);
        //}
        //console.log('Email enviado: ' + info.response);
    //});
};

app.listen(3000, () => {
    console.log("Server on Port 3000")
})