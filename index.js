const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');

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
