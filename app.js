const express = require("express")
const app = express()
const morgan = require('morgan')
const cors = require('cors')
          
// SDK de Mercado Pago
const { MercadoPagoConfig, Preference } = require('mercadopago')
// Agrega credenciales
const client = new MercadoPagoConfig({ 
    accessToken: '' 
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

app.listen(3000, () => {
    console.log("Server on Port 3000")
})