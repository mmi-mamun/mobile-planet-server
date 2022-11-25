const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json())

app.get('/', async (req, res) => {
    res.send('Mobile Planet server is running..')
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`)
})


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ijax3zt.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri)
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const phoneCollection = client.db('mobilePlanet').collection('allPhones');

        app.get('/allPhones', async (req, res) => {
            const query = {};
            const phones = await phoneCollection.find(query).toArray();
            res.send(phones);
        })
    }

    finally {

    }
}
run().catch(console.log);

