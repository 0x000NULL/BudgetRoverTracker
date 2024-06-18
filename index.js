// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const XLSX = require('xlsx');
const SMB2 = require('smb2');
const session = require('express-session');
const basicAuth = require('basic-auth');

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

// Configure the CSV writer to write data to 'records.csv'
const csvWriter = createObjectCsvWriter({
    path: 'records.csv',
    header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'roverNumber', title: 'Rover Number' },
        { id: 'employeeID', title: 'Employee ID' },
        { id: 'action', title: 'Action' },
    ],
    append: true, // Append to the file if it exists
});

// Configure nodemailer transporter for sending emails using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-email-password'   // Replace with your email password
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

// Function to convert a CSV file to an Excel file
function csvToExcel(csvFilePath, excelFilePath) {
    // Read the CSV file data
    const data = fs.readFileSync(csvFilePath, 'utf8');
    // Split the CSV data into rows
    const rows = data.split('\n').map(row => row.split(','));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

    // Write the workbook to an Excel file
    XLSX.writeFile(workbook, excelFilePath);
}

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
    // Get the current date
    const today = new Date().toISOString().split('T')[0];
    const csvFilePath = 'records.csv';
    const excelFilePath = `records_${today}.xlsx`;

    // Convert the CSV file to an Excel file
    csvToExcel(csvFilePath, excelFilePath);

    // Configure the email options
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'recipient-email@gmail.com', // Replace with recipient email
        subject: `Daily Records - ${today}`,
        text: `Please find attached the daily records for ${today}.`,
        attachments: [
            {
                filename: `records_${today}.xlsx`,
                path: excelFilePath
            }
        ]
    };

    // Send the email with the Excel file attachment
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
});

// Schedule a job to copy the CSV file to the SMB drive every 10 minutes
schedule.scheduleJob('*/10 * * * *', () => {
    copyCsvToSmbDrive();
});

// Route for serving the main page
app.get('/', (req, res) => {
    res.render('index');
});

// Route for handling form submissions
app.post('/submit', (req, res) => {
    const { roverNumber, employeeID, action } = req.body;
    const timestamp = new Date().toISOString();

    // Create a record with the form data
    const record = [{ timestamp, roverNumber, employeeID, action }];

    // Write the record to the CSV file
    csvWriter.writeRecords(record)
        .then(() => {
            console.log('Record added to CSV');
        })
        .catch(err => {
            console.error('Error writing to CSV', err);
        });

    // Update session data for the dashboard
    if (action === 'Check In') {
        delete req.session.rovers[roverNumber];
    } else if (action === 'Check Out') {
        req.session.rovers = req.session.rovers || {};
        req.session.rovers[roverNumber] = employeeID;
    }

    // Redirect the user back to the main page
    res.redirect('/');
});

// Route for the dashboard page
app.get('/dashboard', auth, (req, res) => {
    const rovers = req.session.rovers || {};
    res.render('dashboard', { rovers });
});

// Route to download the records as an Excel file
app.get('/download', auth, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const csvFilePath = 'records.csv';
    const excelFilePath = `records_${today}.xlsx`;

    csvToExcel(csvFilePath, excelFilePath);

    res.download(excelFilePath, `records_${today}.xlsx`, (err) => {
        if (err) {
            console.error('Error downloading file:', err);
        }
    });
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
