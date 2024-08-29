const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const stripe = require('stripe')("sk_test_51MlPmmJ0Iao4xBhnATmgcfAmMYaJOGJBufd3bYoS4hdSf6bZrGYR85f3ACfPrUtQVeMM6Y9LCAcsjo4X9wbniZkJ00KHoFnFj3")

require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware
app.use(cors());
app.use(express.json());

//mongodb uri and client 
const uri = "mongodb+srv://partsbd:mV1PncQ3MDPiybEX@cluster0.uwk9cua.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authorizationToken = req.headers.authorization;
    if (!authorizationToken) {
        return res.status(401).send({ message: "Unauthorized Access" });
    }
    const token = authorizationToken.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {

    try {
        //mongodb connection
        await client.connect();

        //mongodb collections
        const partsCollection = client.db('products').collection("parts");
        const orders = client.db('products').collection("orders");
        const users = client.db('products').collection("users");
        const brandImage = client.db('products').collection("brandImage");

        //provide home page products
        app.get('/allProducts', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const category = req.query.category;
            const query = {};
            const cursor = partsCollection.find(query);

            let allProducts;
            console.log(page, size, category)

            // for page and size search
            if (page || size) {
                allProducts = await cursor.skip(page * size).limit(size).toArray();
            }

            // for category search
            if (category) {
                if (category === "allproducts") {
                    const cursor = partsCollection.find();
                    allProducts = await cursor.toArray();
                    console.log('find all products')
                    console.log(allProducts)
                }
                else {
                    const query = { category: category };
                    allProducts = await partsCollection.find(query).toArray();

                }
            }

            else {
                allProducts = await partsCollection.find(query).toArray();
            }

            res.send(allProducts);
        })

        //provide all product count
        app.get('/productCount', async (req, res) => {
            const count = await partsCollection.estimatedDocumentCount();
            res.send({ count });
        })

        // get home page products in product page
        app.get('/homePageProducts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const homePageProducts = await cursor.toArray();
            res.send(homePageProducts);
        })

        //to order a product 
        app.put('/order/:id', async (req, res) => {
            const productId = req.params.id;
            const filter = { _id: productId };
            const options = { upsert: true };
            const body = req.body;
            // console.log(body)
            const updatedDoc = {
                $set: body
            }
            const result = await orders.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        //find ordered products
        app.get('/orders', verifyJWT, async (req, res) => {
            const mail = req.query.mail;
            const decodedEmail = req.decoded.email;
            if (decodedEmail === mail) {
                const query = { mail: mail };
                const cursor = orders.find(query);
                const orderedProducts = await cursor.toArray();
                return res.send(orderedProducts);
            }
            else {
                return res.status(403).send({ message: ' forbidden access' });
            }
        })

        //make order
        app.post('/makeOrder', async (req, res) => {
            const orderedData = req.body;
            const result = await orders.insertOne(orderedData);
            res.send(result);
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
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ result, token });
        })

        //make admin api
        app.put('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: "admin" }
            }
            const result = await users.updateOne(filter, updateDoc);
            res.send(result);
        })

        //findout admin user
        app.get('/user/admin/:email', async (req, res) => {
            const email = req.params.email;
            const filter = { email: email }
            const result = await users.findOne(filter);
            const adminValue = result.role === 'admin';
            console.log(adminValue);
            res.send({ admin: adminValue });
        })

        //upload products
        app.post('/addParts', async (req, res) => {
            const productData = req.body;
            const result = await partsCollection.insertOne(productData);
            console.log(result);
            res.send(result);
        })

        //upload Prodcut Brand image
        app.post('/addBrand', async (req, res) => {
            const brandImageUrl = req.body;
            const result = await brandImage.insertOne(brandImageUrl);
            console.log(result);
            res.send(result);
        })

        //get product brand image
        app.get('/partsBrand', async (req, res) => {
            const cursor = brandImage.find({});
            const brandImageAll = await cursor.toArray();
            res.send(brandImageAll);

        })

        //getting all users from db
        app.get('/user', async (req, res) => {
            const user = await users.find().toArray();
            res.send(user);
        })

        //remove products
        app.delete('/deleteProducts/:_id', async (req, res) => {
            const productId = req.params._id;
            console.log(productId);
            const o_id = new ObjectId(productId);
            const query = ({ _id: o_id })
            console.log(query);
            const result = await partsCollection.deleteOne(query);
            console.log("id", productId, query);
            res.send(result);
        })

        //upload user delivery information
        app.put('/addDeliveryInfo/:email', async (req, res) => {
            const userEmail = req.params.email;
            const filter = { email: userEmail }
            const userData = req.body;
            console.log(userData)
            const options = { upsert: true };
            const updateDoc = {
                $set: userData
            }
            const result = users.updateOne(filter, updateDoc, options)
            res.send(result);
        })

        //processing payment 
        // app.post('/createPaymentIntent', async (req, res) => {
        //     const { price } = req.body;
        //     console.log(price)
        //     const amount = price * 100;
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: 'usd',
        //         payment_method_types: ['card']
        //     });
        //     res.send({ clientSecret: paymentIntent.client_secret });
        // })


        app.post('/createPaymentIntent', async (req, res) => {

            try {
                const { price } = req.body;
                const amount = price * 100;
                console.log(price)
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ["card"],
                    mode: "payment",
                    line_items: {
                        currency: 'usd',
                        unit_amount: amount
                    }
                })
                console.log(session)
                res.json({ "data": "payment received" })
            } catch (error) {
                res.status(500)
            }





            // const paymentIntent = await stripe.paymentIntents.create({
            //     amount: amount,
            //     currency: 'usd',
            //     payment_method_types: ['card']
            // });
            // res.send({ clientSecret: paymentIntent.client_secret });
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
app.get('*', (req, res) => {
    res.send("No route found, 404");
})

app.listen(port, () => {
    console.log("Serve is running");
})

