const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const XLSX = require('xlsx');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

const csvWriter = createObjectCsvWriter({
    path: 'records.csv',
    header: [
        { id: 'timestamp', title: 'Timestamp' },
        { id: 'roverNumber', title: 'Rover Number' },
        { id: 'employeeID', title: 'Employee ID' },
        { id: 'action', title: 'Action' },
    ],
    append: true,
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password'
    }
});

function csvToExcel(csvFilePath, excelFilePath) {
    const data = fs.readFileSync(csvFilePath, 'utf8');
    const rows = data.split('\n').map(row => row.split(','));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Records');

    XLSX.writeFile(workbook, excelFilePath);
}

schedule.scheduleJob('0 0 * * *', () => { // Runs at midnight every day
    const today = new Date().toISOString().split('T')[0];
    const csvFilePath = 'records.csv';
    const excelFilePath = `records_${today}.xlsx`;

    csvToExcel(csvFilePath, excelFilePath);

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'recipient-email@gmail.com',
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

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/submit', (req, res) => {
    const { roverNumber, employeeID, action } = req.body;
    const timestamp = new Date().toISOString();

    const record = [{ timestamp, roverNumber, employeeID, action }];

    csvWriter.writeRecords(record)
        .then(() => {
            console.log('Record added to CSV');
        })
        .catch(err => {
            console.error('Error writing to CSV', err);
        });

    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
