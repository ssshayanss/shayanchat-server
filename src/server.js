require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const expressFileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const cors = require('cors');
const ioServer = require('./ioServer');

const app = express();
const appRoutes = require('./routes');

mongoose.connect(process.env.MONGODB_URL, 
    { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
.then(() => console.log('DB Connected.'))
.catch(error => console.error(error.message));

app.use(express.static(path.join(__dirname, '../public')));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileUpload());
app.use(appRoutes);

const server = http.createServer(app);
ioServer(server);

server.listen(process.env.PORT, () => console.log(`Server is running on port ${process.env.PORT}`));