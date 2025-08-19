const cors = require('cors');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');   
const fs = require('fs/promises');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');
require('dotenv').config();
const nodeMailer = require('nodemailer');
const Flutterwave = require('flutterwave-node-v3');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const validator = require('validator');


const app = express();
const corsOptions = {
    origin: ["http://localhost:3000"],
    methods: ['GET', 'POST'],
    credentials: true,
};
app.use(cors(corsOptions)); 
app.use(express.json());
app.use(express.static('contents')); 
app.use(bodyParser.json());
app.use(cookieParser());

app.set('trust proxy', 1);

const uri = 'mongodb+srv://tysev8301:0S3Ue0XGrXMqJeH7@cluster0.4shv1eu.mongodb.net/subscribers?retryWrites=true&w=majority'

// mongoose.connect('mongodb://127.0.0.1:27017/subscribe', {})
// .then(() => console.log("MongoDB connected"))
// .catch((err) => console.error("MongoDB connection error:", err));
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  ssl: true,               // ensure SSL is used
  tlsAllowInvalidCertificates: false, // set true only for testing
};
// Connect to MongoDB
mongoose
  .connect(uri, options)
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Listen for successful connection
mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

// Optional: Additional event listeners for connection management
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB connection disconnected');
});

const subscribeSchema = new mongoose.Schema({
    email: String,
    name: String,
});

const surveySchema = new mongoose.Schema({
    fstansw: String,
    secansw: String,
});



const subscribes = mongoose.model('subscribes', subscribeSchema);
const surveys = mongoose.model('surveys', surveySchema);

// ================================================== //
// =============SUBSCRIBE FUNCTION STARTS============ //
// ================================================== //

app.post('/preloader', async (req, res) => {
    try {
        res.json({status:'success'})
    } catch (error) {
        res.json({status:'error', message: error.message})
    }
})

app.post('/subscribe', async (req, res) => {
    const emailed = req.body.email
    const name = req.body.name;
    
    if (emailed && name) {
        try {
            /////////REMOVING SPACE FROM NAME IN ORDER TO VALIDATE INPUT\\\\\\\\\\\
            const testName = name?.replace(/\s+/g,'')

            /////////NAME VALIDATIONS\\\\\\\\\\\
            const rules={
                hasNumber : /\d/.test(testName),
                hasSpecial : /[^a-zA-Z0-9]/.test(testName),
            }
             
            /////////INVALID NAME RESPONSE\\\\\\\\\\\
            if (rules?.hasNumber || rules?.hasSpecial) {
                return res.json({status:'error', message:'Invalid Name Input'});
            }
             
            /////////NAME CHARACTER LIMIT RESPONSE\\\\\\\\\\\
            if (testName?.length > 100) {
                return res.json({status:'error', message:'Name Input Must be less than 100 letters'});
            }
            
            /////////VALIDATE EMAIL\\\\\\\\\\\
            const isValidEmail = (email) => {
                const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                return regex.test(email)
            };
            
            /////////INVALID EMAIL RESPONSE\\\\\\\\\\\
            if (!isValidEmail(emailed)) {
                return res.json({status:'error', message:'Invalid Email'});
            }
          
            /////////EMAIL CHARACTER LIMIT RESPONSE\\\\\\\\\\\
            if (emailed?.length > 100) {
                return res.json({status:'error', message:'Name Input Must be less than 100 letters'});
            }

            /////////CHECK IF EMAIL EXISTS\\\\\\\\\\\
            const getUser = await subscribes.findOne({ email: emailed });

            /////////ALREADY EXISTING EMAIL RESPONSE\\\\\\\\\\\
            if(getUser){
                return res.json({ status: 'error', message:'User ALready Subscribed'});
            }

            /////////SUBSCRIBE USER EMAIL\\\\\\\\\\\
            await subscribes.create({
                email: emailed,
                name
            })

            res.json({ status: 'success'});
        } catch (err) {
            console.error('MongoDB error:', err);
            res.status(500).json({ error: 'Database error' });
        }
    } else {
        res.json({ status: 'offline' });
    }
});

app.post('/surveys', async (req, res) => {
    const fstansw = req.body.fstansw
    const secansw = req.body.secansw;
    
    if (fstansw && secansw) {
        try {
            
            /////////How did you hear about us CHARACTER LIMIT RESPONSE\\\\\\\\\\\
            if (fstansw?.length > 100) {
                return res.json({status:'error', message:'Name Input Must be less than 100 letters'});
            }
            
            /////////What are you most excited about CHARACTER LIMIT RESPONSE\\\\\\\\\\\
            if (secansw?.length > 250) {
                return res.json({status:'error', message:'Name Input Must be less than 100 letters'});
            }

            /////////CREATE INPUT USER SURVEY\\\\\\\\\\\
            await surveys.create({
                fstansw,
                secansw
            })

            res.json({ status: 'success'});
        } catch (err) {
            console.error('MongoDB error:', err);
            res.status(500).json({ error: 'Database error' });
        }
    } else {
        res.json({ status: 'offline' });
    }
});




app.listen(4000, '0.0.0.0', () => {
    console.log('Server running on port 4000');
});
















