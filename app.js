const express = require("express")
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const axios = require('axios');
          
// SDK de Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago')
// Agrega credenciales
const client = new MercadoPagoConfig({ 
    accessToken: 'APP_USR-207196557607626-053115-54570b6c2b2b4c6ed6e97847785c3490-1409367344' 
});

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('server ok')
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
        console.log(error)
        return error
    }
})

app.post('/quotation', async (req, res) => {
    try {
        const response = await axios.post('https://apiqa.myeship.co/rest/quotation', req.body, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer `
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log("Server on Port 3000")
})