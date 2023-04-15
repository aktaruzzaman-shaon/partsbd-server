const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());

//mongodb uri and client 
const uri = "mongodb+srv://partsbd:mV1PncQ3MDPiybEX@cluster0.uwk9cua.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {

    try {
        //mongodb connection
        await client.connect();

        //mongodb collections
        const partsCollection = client.db('products').collection("parts");
        const orders = client.db('products').collection("orders");
        const users = client.db('products').collection("users");

        //provide home page products
        app.get('/homePageProducts', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = partsCollection.find(query);
            let homePageProducts;

            if (page || size) {
                homePageProducts = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                homePageProducts = await cursor.toArray();
            }
            res.send(homePageProducts);
        })

        //provide all product count
        app.get('/productCount', async (req, res) => {
            const count = await partsCollection.estimatedDocumentCount();
            res.send({ count });
        })

        //get all products in product page
        app.get('/allProducts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const allProducts = await cursor.toArray();
            res.send(allProducts);
        })

        //to order a product 
        app.post('/order', async (req, res) => {
            const body = req.body;
            const result = await orders.insertOne(body)
            res.send(result);
        })

        //find ordered products
        app.get('/orders', async (req, res) => {
            const mail = req.query.mail;
            const query = { mail: mail };
            const cursor = orders.find(query);
            const orderedProducts = await cursor.toArray();
            res.send(orderedProducts);
        })

        //insert or update user in db
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const user = req.body;
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            }
            const result = await users.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, 'shaon', { expiresIn: '1h' });
            res.send({ result, token });
        })

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("THis is home page of partsbd backend");
})

app.listen(port, () => {
    console.log("Serve is running");
})

