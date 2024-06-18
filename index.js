// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const XLSX = require('xlsx');
const SMB2 = require('smb2');
const session = require('express-session');
const basicAuth = require('basic-auth');
const db = require('./database');

// Initialize the express application
const app = express();
const port = 3000;

// Middleware to parse URL-encoded data from the request body
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set the view engine to EJS for rendering HTML templates
app.set('view engine', 'ejs');

// Middleware for session management
app.use(session({
    secret: 'secret-key', // Replace with a strong secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true if using HTTPS
}));

// Configure nodemailer transporter for sending emails using Office 365
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'your-email@your-domain.com', // Replace with your Office 365 email
        pass: 'your-email-password'          // Replace with your Office 365 email password
    }
});

// Configure the SMB connection
const smb2Client = new SMB2({
    share: '\\\\YOUR_SMB_SERVER\\share', // Replace with your SMB server and share
    username: 'your-username',           // Replace with your SMB username
    password: 'your-password',           // Replace with your SMB password
    domain: 'your-domain'                // Replace with your SMB domain
});

// Middleware for basic authentication
function auth(req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm="401"');
        return res.status(401).send('Authentication required.');
    }

    const user = basicAuth(req);
    if (!user || user.name !== 'rover' || user.pass !== 'rover') {
        return unauthorized(res);
    }
    return next();
}

/*
// Function to copy the CSV file to the SMB drive
function copyCsvToSmbDrive() {
    const localCsvPath = 'records.csv';
    const remoteCsvPath = `\\YOUR_SMB_SERVER\\share\\records_${new Date().toISOString().split('T')[0]}.csv`; // Adjust the remote path as needed

    fs.readFile(localCsvPath, (err, data) => {
        if (err) {
            return console.error('Error reading local CSV file:', err);
        }

        smb2Client.writeFile(remoteCsvPath, data, (err) => {
            if (err) {
                console.error('Error writing to SMB drive:', err);
            } else {
                console.log('CSV file copied to SMB drive successfully');
            }
        });
    });
}

// Schedule a job to run at midnight every day to send the daily records via email
schedule.scheduleJob('0 0 * * *', () => {
    const today = new Date().toISOString().split('T')[0];
    const excelFilePath = `records_${today}.xlsx`;

    db.all(`SELECT * FROM records`, [], (err, rows) => {
        if (err) {
            return console.error('Error fetching records from database:', err);
        }

        const data = rows.map(row => [row.timestamp, row.roverNumber, row.employeeID, row.action]);
        data.unshift(['Timestamp', 'Rover Number', 'Employee ID', 'Action']); // Add headers

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

        XLSX.writeFile(workbook, excelFilePath);

        const mailOptions = {
            from: 'your-email@your-domain.com', // Replace with your Office 365 email
            to: 'recipient-email@domain.com',   // Replace with recipient email
            subject: `Daily Records - ${today}`,
            text: `Please find attached the daily records for ${today}.`,
            attachments: [
                {
                    filename: `records_${today}.xlsx`,
                    path: excelFilePath
                }
            ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
    });
});

// Schedule a job to copy the CSV file to the SMB drive every 10 minutes
schedule.scheduleJob('0 * * * *', () => {
    copyCsvToSmbDrive();
});

*/


// Route for serving the main page
app.get('/', (req, res) => {
    res.render('index');
});

// Route for handling form submissions
app.post('/submit', (req, res) => {
    const { roverNumber, employeeID, action } = req.body;
    const timestamp = new Date().toISOString();

    // Insert the record into the SQLite database
    db.run(
        `INSERT INTO records (timestamp, roverNumber, employeeID, action) VALUES (?, ?, ?, ?)`,
        [timestamp, roverNumber, employeeID, action],
        (err) => {
            if (err) {
                return console.error('Error inserting record into database:', err);
            }
            console.log('Record added to database');

            // Update session data for the dashboard
            if (action === 'Check In') {
                delete req.session.rovers[roverNumber];
            } else if (action === 'Check Out') {
                req.session.rovers = req.session.rovers || {};
                req.session.rovers[roverNumber] = employeeID;
            }

            // Redirect the user back to the main page
            res.redirect('/');
        }
    );
});

// Route for the dashboard page
app.get('/dashboard', auth, (req, res) => {
    db.all(`SELECT * FROM records WHERE action = 'Check Out'`, [], (err, rows) => {
        if (err) {
            return console.error('Error fetching records from database:', err);
        }

        const rovers = {};
        rows.forEach(row => {
            rovers[row.roverNumber] = row.employeeID;
        });

        res.render('dashboard', { rovers });
    });
});

// Route to download the records as an Excel file with date range filtering
app.get('/download', auth, (req, res) => {
    const { startDate, endDate } = req.query;
    const excelFilePath = `records_${startDate}_to_${endDate}.xlsx`;

    db.all(
        `SELECT * FROM records WHERE date(timestamp) BETWEEN date(?) AND date(?)`,
        [startDate, endDate],
        (err, rows) => {
            if (err) {
                return console.error('Error fetching records from database:', err);
            }

            const data = rows.map(row => [row.timestamp, row.roverNumber, row.employeeID, row.action]);
            data.unshift(['Timestamp', 'Rover Number', 'Employee ID', 'Action']); // Add headers

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

            XLSX.writeFile(workbook, excelFilePath);

            res.download(excelFilePath, `records_${startDate}_to_${endDate}.xlsx`, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                }
            });
        }
    );
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
