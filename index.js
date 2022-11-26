const express = require('express');
const ObjectId = require('mongodb').ObjectId;
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
        const bookingCollection = client.db('mobilePlanet').collection('bookPhones');

        app.get('/allPhones', async (req, res) => {
            const query = {};
            const phones = await phoneCollection.find(query).toArray();
            res.send(phones);
        })

        app.get('/allPhones/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const phone = await phoneCollection.findOne(query);
            res.send(phone);
        })

        app.get('/category/:category', async (req, res) => {
            const id = req.params.category;
            console.log(id);
            const query = { category: id };
            const category = await phoneCollection.find(query).toArray();
            res.send(category);
        })

        // post booking data from user
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        // get booking data for each buyer
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { Email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })
    }

    finally {

    }
}
run().catch(console.log);

