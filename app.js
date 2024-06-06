require('dotenv').config()
const express = require("express")
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

          
// SDK de Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago')
// Agrega credenciales
const client = new MercadoPagoConfig({ 
    accessToken: process.env.ACCESS_TOKEN
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname + '/html/', 'views'));
app.use(express.static(path.join(__dirname, 'html')));
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/luacup', (req, res) => {
    res.render('luacup')
})

app.get('/cart', (req, res) => {
    res.render('cart', {
        result: null
    })
})

app.post('/create-preference', async (req, res) => {
    try {
        const body = {
            items: req.body.items, 
            back_urls: {
                success: 'https://google.com',
                pending: 'https://google.com',
                failure: 'https://google.com'
            },
            auto_return: "approved"
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

    for(let i = 0; i < response.data.rates.length; i++){
        console.log(response.data.rates[i])
    }
    res.render('cart', { 
        result: response.data ? response.data : ''
    });
    console.log(response.data)
    return response
});

app.post('/webhook', async (req, res) => {
    const payment = req.body;

    if (payment.type === 'payment') {
        try {
            const response = await client.payment.get(payment.data.id);
            if (response.body.status === 'approved') {
                sendConfirmationEmail(response.body.payer.email);
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