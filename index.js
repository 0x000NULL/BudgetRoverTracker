// Import required packages
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const XLSX = require('xlsx');

// Initialize the express application
const app = express();
const port = 3000;

// Middleware to parse URL-encoded data from the request body
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set the view engine to EJS for rendering HTML templates
app.set('view engine', 'ejs');

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

// Schedule a job to run at midnight every day
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

    // Redirect the user back to the main page
    res.redirect('/');
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
