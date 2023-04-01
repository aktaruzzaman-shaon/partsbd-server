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
        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const parts = await cursor.limit(6).sort({ _id: 1 }).toArray();
            res.send(parts);
        })

        //provide all product count
        app.get('/productCount', async (req, res) => {
            const query = {};
            const cursor = partsCollection.find(query);
            const count = await cursor.count();
            console.log(count);
            res.json(count);
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

