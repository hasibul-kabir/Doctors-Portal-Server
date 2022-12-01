const express = require('express');
const cors = require('cors');
require('dotenv').config();

//module scaffolding
const app = express();
const port = process.env.PORT || 5000;

//applying middleware
app.use(express.json());
app.use(cors());

app.listen(port, () => {
    console.log(`App listening on port - ${port}`);
})