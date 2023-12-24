const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data storage
let users = {}; // Format: { phoneNum: { availableAmount: number, transactions: [] } }

// Middleware to check if user exists
function userExists(req, res, next) {
    const phoneNum = req.body.phoneNum || req.body.from || req.params.phoneNum;
    if (!users[phoneNum]) {
        return res.status(404).send('User not found');
    }
    next();
}

// Log In or Register User
app.post('/login', (req, res) => {
    const { phoneNum, initialAmount } = req.body;
    if (!users[phoneNum]) {
        users[phoneNum] = { availableAmount: parseFloat(initialAmount) || 0, transactions: [] };
    }
    res.json({ success: true, message: 'Logged in successfully', phoneNum });
});

// Transfer Amount
app.post('/transfer', userExists, (req, res) => {
    const { from, to, amount } = req.body;

    if (parseFloat(amount) <= 0 || users[from].availableAmount < parseFloat(amount)) {
        return res.status(400).send('Invalid transaction');
    }
    if (!users[to]) {
        users[to] = { availableAmount: 0, transactions: [] }; // Create recipient if not exists
    }

    // Perform transaction
    users[from].availableAmount -= parseFloat(amount);
    users[to].availableAmount += parseFloat(amount);

    // Record transaction
    const transactionRecord = { from, to, amount: parseFloat(amount) };
    users[from].transactions.push(transactionRecord);
    users[to].transactions.push(transactionRecord);

    // Cashback logic
    let cashback = 0;
    if (parseFloat(amount) % 500 !== 0) {
        cashback = parseFloat(amount) < 1000 ? parseFloat(amount) * 0.05 : parseFloat(amount) * 0.02;
        users[from].availableAmount += cashback;
    }

    res.json({ message: 'Transfer successful', cashback: cashback.toFixed(2) });
});

// Display User Information
app.get('/user/:phoneNum', userExists, (req, res) => {
    const { phoneNum } = req.params;
    res.json(users[phoneNum]);
});

// Optionally, redirect root to a specific HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
