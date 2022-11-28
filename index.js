const express = require('express');
const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")('sk_test_51M8u12KC1Cxv0cZw8TYFBONg9PQVQoOPZpw3tHEUC6as8Uk4xkREU3nwhZ62ZkGOcsvIJTMxvr5x4jtWD40e7t3a00ji61cZqD');
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

//middleware function
function verifyJWT(req, res, next) {
    console.log('token inside verifyJWT', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const phoneCollection = client.db('mobilePlanet').collection('allPhones');
        const bookingCollection = client.db('mobilePlanet').collection('bookPhones');
        const userCollection = client.db('mobilePlanet').collection('users');
        const productCollection = client.db('mobilePlanet').collection('products');
        const paymentCollection = client.db('mobilePlanet').collection('payment');

        //NOTE: make sure you are verifyAdmin after verifyJWT
        //verify admin
        const verifyAdmin = async (req, res, next) => {
            console.log('Inside verifyAdmin::', req.decoded.email);

            const decodedEmail = req.decoded.email;
            const query = { email: decodedEmail };
            const user = await userCollection.findOne(query);
            if (user?.role !== 'Admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            next();
        }

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
        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            // console.log('token', req.headers.authorization);
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { email: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        })

        // get specific booking data for user
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
        })

        // store user data
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        // jwt
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            // console.log('token', req.headers.authorization)
            const user = await userCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token })
            }
            // console.log(user);
            res.status(403).send({ accessToken: '' })
        })

        // Display all users in dashboard
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        })

        // Display and separate all user with their role in dashboard
        app.get('/users/:role', async (req, res) => {
            const role = req.params.role;
            const query = { role: role };
            const usersRole = await userCollection.find(query).toArray();
            res.send(usersRole);
        })

        // Update user to admin role
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async (req, res) => {

            // check the promoter is admin or not with verifyJWT
            // const decodedEmail = req.decoded.email;
            // const query = { email: decodedEmail };
            // const user = await userCollection.findOne(query);
            // if (user?.role !== 'Admin') {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: { role: 'Admin' }
            }

            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })

        // Check the user is admin or not
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email };
            const user = await userCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'Admin' });
        })

        // Add product by seller
        app.post('/products', verifyJWT, verifyAdmin, async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        })

        // Get products from database for managing
        app.get('/products', verifyJWT, verifyAdmin, async (req, res) => {
            const query = {};
            const products = await productCollection.find(query).toArray();
            res.send(products);
        })

        // Delete products
        app.delete('/products/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(filter);
            res.send(result);
        })

        // Payment
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            // console.log(booking);
            const price = booking.price;
            // console.log(price)
            const amount = price * 100;
            console.log(amount)

            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })
    }

    finally {

    }
}
run().catch(console.log);

