const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

//module scaffolding
const app = express();
const port = process.env.PORT || 5000;

//applying middleware
app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.USER_PASS}@cluster0.qnaq6cg.mongodb.net/?retryWrites=true&w=majority1`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const appointmentsCollection = client.db('DoctorsPortal').collection('appointments');

        //read appointments
        app.get('/appointments', async (req, res) => {
            const query = {};
            const cursor = appointmentsCollection.find(query);

            const appointments = await cursor.toArray();
            res.send(appointments);
        })

    }
    finally { }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`App listening on port - ${port}`);
})