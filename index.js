const express = require('express');
const app = express();
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
            console.log(count);
            res.send({ count });
        })

        //get all products in product page
        app.get('/allProducts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const allProducts = await cursor.toArray();
            res.send(allProducts);
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

