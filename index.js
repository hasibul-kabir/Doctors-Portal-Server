const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const jwt = require('jsonwebtoken');

//module scaffolding
const app = express();
const port = process.env.PORT || 5000;

//applying middleware
app.use(express.json());
app.use(cors());


//JWT varification
function jwtVerification(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access.' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SECRET_KEY, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden!' })
        }
        req.decoded = decoded;
        next();
    });

}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.USER_PASS}@cluster0.qnaq6cg.mongodb.net/?retryWrites=true`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const appointmentsCollection = client.db('DoctorsPortal').collection('appointments');
        const bookedAppointmentsCollection = client.db('DoctorsPortal').collection('bookedAppointments');
        const usersCollection = client.db('DoctorsPortal').collection('users');

        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.SECRET_KEY, { expiresIn: '1h' });

            res.send({ result, token })
        })


        app.get('/appointments', async (req, res) => {
            const query = {};
            const cursor = appointmentsCollection.find(query);

            const appointments = await cursor.toArray();
            res.send(appointments);
        });

        app.post('/booked', async (req, res) => {
            const booking = req.body;
            const query = { bookedTreatment: booking.bookedTreatment, email: booking.email, date: booking.date }
            const exists = await bookedAppointmentsCollection.findOne(query);
            if (exists) {
                res.send({ success: false, message: 'You have already booked this appointment!' })
            } else {
                const result = await bookedAppointmentsCollection.insertOne(booking);
                res.send({ success: true, result })
            }
        })

        app.get('/mybookings', jwtVerification, async (req, res) => {
            const email = req.query.email;
            if (req.decoded.email === email) {
                const query = { email: email };
                const cursor = bookedAppointmentsCollection.find(query);
                const bookedAppointments = await cursor.toArray();
                return res.send(bookedAppointments)
            } else {
                return res.status(403).send({ message: 'Forbidden!' })
            }
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;
            const allAppointments = await appointmentsCollection.find().toArray();

            const query = { date: date }
            const bookedAppointmentsDateSpecific = await bookedAppointmentsCollection.find(query).toArray();
            allAppointments.forEach((appointment) => {
                const bookedAppointments = bookedAppointmentsDateSpecific.filter(bookedAppointment => bookedAppointment.bookedTreatment === appointment.name)
                const bookedSlots = bookedAppointments.map((booked) => booked.slot);
                const availableSlots = appointment.slots.filter((slot) => !bookedSlots.includes(slot));

                appointment.slots = availableSlots;
            })
            res.send(allAppointments);
        });

        app.get('/user', jwtVerification, async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        //set admin role
        app.put('/user/admin/:email', jwtVerification, async (req, res) => {
            const email = req.params.email;
            const filter = { email }
            const updateDoc = {
                $set: { role: 'admin' }
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        //filter admin role
        app.get('/admin/:email', jwtVerification, async (req, res) => {
            const email = req.params.email;

            const user = await usersCollection.findOne({ email: email });
            const admin = user.role === 'admin';
            res.send({ admin: admin });
        })


        app.get('/', (req, res) => {
            res.send("Connected")
        })
    }
    finally { }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`App listening on port - ${port}`);
})