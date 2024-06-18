# Rover Check-In/Out System

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
  - [Unit Tests](#unit-tests)
  - [Integration Tests](#integration-tests)
  - [End-to-End Tests](#end-to-end-tests)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Features

- **Check-In/Out Form**: Users can enter a "Rover Number" and an "Employee ID" to check in or check out a rover.
- **Database Storage**: All records are stored in a SQLite database.
- **Dashboard**: Admin dashboard to view currently checked-out rovers and download records.
- **Time Frame Selector**: Select a time frame to download specific records as an Excel file.
- **Email Notifications**: Sends daily emails with the day's records as an Excel file using Office 365.
- **SMB Backup**: Copies a CSV file of the records to an SMB drive every 10 minutes.
- **Authentication**: Basic authentication for accessing the dashboard.

## Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/rover-check-in.git
    cd rover-check-in
    ```

2. **Install dependencies**:
    ```bash
    npm install
    ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory and add your Office 365 email credentials and SMB server details:
    ```
    EMAIL_USER=your-email@your-domain.com
    EMAIL_PASS=your-email-password
    SMB_SERVER=\\YOUR_SMB_SERVER\share
    SMB_USERNAME=your-username
    SMB_PASSWORD=your-password
    SMB_DOMAIN=your-domain
    ```

4. **Start the server**:
    ```bash
    npm start
    ```

## Usage

1. **Access the application**:
   Open your browser and navigate to `http://localhost:3000/`.

2. **Check-In/Out a Rover**:
   - Enter a "Rover Number" and an "Employee ID".
   - Select either "Check In" or "Check Out".
   - Click "Submit".

3. **Admin Dashboard**:
   - Navigate to `http://localhost:3000/dashboard`.
   - Log in with username `rover` and password `rover`.
   - View currently checked-out rovers.
   - Select a time frame and download records as an Excel file.

## Testing

### Unit Tests

Unit tests are located in the `test/unit` directory.

1. **Run unit tests**:
    ```bash
    npm test
    ```

### Integration Tests

Integration tests are located in the `test/integration` directory.

1. **Run integration tests**:
    ```bash
    npm test
    ```

### End-to-End Tests

End-to-end tests are located in the `cypress/integration` directory.

1. **Run end-to-end tests**:
    ```bash
    npm run test:e2e
    ```

## Project Structure

```bash
rover-check-in/
├── public/
│ ├── styles.css
├── views/
│ ├── index.ejs
│ ├── dashboard.ejs
├── cypress/
│ ├── integration/
│ │ ├── example.spec.js
├── test/
│ ├── unit/
│ │ ├── example.test.js
│ ├── integration/
│ │ ├── example.integration.test.js
├── database.js
├── index.js
├── package.json
├── package-lock.json
├── README.md
```

## API Endpoints

### GET `/`

- **Description**: Renders the main check-in/out page.
- **Response**: HTML page.

### POST `/submit`

- **Description**: Handles form submissions for checking in/out rovers.
- **Request Body**:
  - `roverNumber`: String (required)
  - `employeeID`: String (required)
  - `action`: String (required, either "Check In" or "Check Out")
- **Response**: Redirects to the main page.

### GET `/dashboard`

- **Description**: Renders the admin dashboard.
- **Authentication**: Basic (username: `rover`, password: `rover`)
- **Response**: HTML page.

### GET `/download`

- **Description**: Downloads the records as an Excel file for the specified time frame.
- **Query Parameters**:
  - `startDate`: String (required, format `YYYY-MM-DD`)
  - `endDate`: String (required, format `YYYY-MM-DD`)
- **Authentication**: Basic (username: `rover`, password: `rover`)
- **Response**: Downloads an Excel file.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to contribute to this project by opening issues or submitting pull requests. If you encounter any problems or have suggestions, please let us know!