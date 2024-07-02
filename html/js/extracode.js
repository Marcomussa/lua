const [responseMP, responsePayPal] = await Promise.all([
    fetch('https://luacup.onrender.com/create-preference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
    }),
    fetch('https://luacup.onrender.com/create-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
    })
]);