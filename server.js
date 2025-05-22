const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 5000;
const { v4: uuidv4 } = require('uuid');

const AccountHolder = require('./models/AccountHolder')
const BankWorker = require('./models/BankWorker')
const BranchManager = require('./models/BranchManager')
const BankManager = require('./models/BankManager')
const Loan = require('./models/Loans')
const LoanPayment = require('./models/LoanPayment')
const Transaction = require('./models/Transactions')
const Notification = require('./models/Notifications')
const BranchDetail = require('./models/BranchDetail')

const conn = require('./conn/conn')
const authenticateToken = require('./middleware/auth');
const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    console.log('No authorization header');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    console.log('Malformed authorization header');
    return res.status(401).json({ message: 'Malformed token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT Error:', err.message);
    return res.status(403).json({ message: 'Invalid token' });
  }
};





app.post('/login', async (req, res) => {
  const { accountNumber, password } = req.body;

  if (!accountNumber || !password) {
    return res.status(400).json({ error: 'Account number and password are required' });
  }

  try {
    const user = await AccountHolder.findOne({ accountNumber, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ accountNumber: user.accountNumber }, process.env.JWT_SECRET, { expiresIn: '1h' });


    return res.status(200).json({
      message: 'Login successful',
      accountNumber: user.accountNumber,
      name: user.name,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.post('/bankworker', async (req, res) => {
  const { workerId, password } = req.body;

  if (!workerId || !password) {
    return res.status(400).json({ error: 'Worker ID and password are required' });
  }

  try {
    const user = await BankWorker.findOne({ workerId, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ workerId: user.workerId }, process.env.JWT_SECRET, { expiresIn: '1h' });


    return res.status(200).json({
      message: 'Login successful',
      workerId: user.workerId,
      name: user.name,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/branchmanager', async (req, res) => {
  const { branchManagerId, password } = req.body;

  console.log("Incoming login request:", { branchManagerId, password });

  if (!branchManagerId || !password) {
    console.log("Missing credentials");
    return res.status(400).json({ error: 'Branch Manager ID and password are required' });
  }

  try {
    const user = await BranchManager.findOne({ branchManagerId, password });
    console.log("Query result:", user);

    if (!user) {
      console.log("Login failed: No user found with provided credentials");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log("Login success. branchId in user:", user.branchId);

    const token = jwt.sign(
      {
        branchManagerId: user.branchManagerId,
        name: user.name,
        email: user.email,
        mobno: user.mobno,
        branchId: user.branchId,
      },
      process.env.JWT_SECRET || 'Omm',
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      message: 'Login successful',
      branchManagerId: user.branchManagerId,
      name: user.name,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});





app.post('/bankmanager', async (req, res) => {
  const { managerId, password } = req.body;

  if (!managerId || !password) {
    return res.status(400).json({ error: 'Bank Manager ID and password are required' });
  }

  try {
    const user = await BankManager.findOne({ managerId, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      {
        managerId: user.managerId,
        name: user.name,
        email: user.email,
        mobno: user.mobno,
      },
      process.env.JWT_SECRET || 'Omm',
      { expiresIn: '15m' }
    );

    return res.status(200).json({
      message: 'Login successful',
      managerId: user.managerId,
      name: user.name,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/', verifyToken, async (req, res) => {
  try {
    const user = await AccountHolder.findOne({ accountNumber: req.user.accountNumber }).select(
      'name email mobno accountNumber balance branchId address'
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({
      name: user.name,
      email: user.email,
      mobno: user.mobno,
      accountNumber: user.accountNumber,
      balance: user.balance,
      branchId: user.branchId,
      address: user.address,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/bankworker/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await BankWorker.findOne({ workerId: req.user.workerId }).select(
      'name email mobno workerId branchManagerId branchId address'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      mobno: user.mobno,
      workerId: user.workerId,
      branchManagerId: user.branchManagerId,
      branchId: user.branchId,
      address: user.address,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/branchmanager/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await BranchManager.findOne({ branchManagerId: req.user.branchManagerId }).select(
      'name email mobno workerId branchManagerId bankManagerId branchId address'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      mobno: user.mobno,
      bankManagerId: user.bankManagerId,
      branchManagerId: user.branchManagerId,
      branchId: user.branchId,
      address: user.address,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/bankmanager/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await BankManager.findOne({ managerId: req.user.managerId }).select(
      'name email mobno managerId address'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      mobno: user.mobno,
      managerId: user.managerId,
      address: user.address,
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/bankmanager/add-branch', verifyToken, async (req, res) => {
  try {
    const { branchName, branchId, address, contactNumber, email, totalBalance } = req.body;

    if (!branchName || !branchId || !address || !contactNumber || !email) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const existingBranch = await BranchDetail.findOne({ branchId });
    if (existingBranch) {
      return res.status(409).json({ message: 'Branch ID already exists' });
    }

    const newBranch = new BranchDetail({
      branchName,
      branchId,
      address,
      contactNumber,
      email,
      totalBalance: totalBalance || 0,
    });

    await newBranch.save();

    res.status(201).json({ message: 'Branch added successfully', branch: newBranch });
  } catch (err) {
    console.error('Error adding branch:', err);
    res.status(500).json({ message: 'Server error while adding branch' });
  }
});

app.post('/bankmanager/add-branchmanager', verifyToken, async (req, res) => {
  const {
    branchManagerId,
    name,
    email,
    mobno,
    address,
    password,
    branchId,
  } = req.body;

  if (
    !branchManagerId ||
    !name ||
    !email ||
    !mobno ||
    !address ||
    !password ||
    !branchId
  ) {
    return res.status(400).json({ error: 'All fields except bankManagerId are required' });
  }

  try {
    const existingManager = await BranchManager.findOne({ branchManagerId });
    if (existingManager) {
      return res.status(400).json({ error: 'Branch Manager ID already exists' });
    }

    const existingEmail = await BranchManager.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const bankManagerId = req.user.managerId;

    const newBranchManager = new BranchManager({
      branchManagerId,
      name,
      email,
      mobno,
      address,
      password,
      branchId,
      bankManagerId,
    });

    await newBranchManager.save();

    res.status(201).json({ message: 'Branch Manager created', id: branchManagerId });
  } catch (err) {
    console.error('Error creating branch manager:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/bankmanager/branches', async (req, res) => {
  try {
    const branches = await BranchDetail.find({}, 'branchName branchId'); 
    res.json(branches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching branches' });
  }
});

app.get('/bankmanager/delete-branchmanagers', verifyToken, async (req, res) => {
  try {
    const bankManagerId = req.user.managerId;

    const branchManagers = await BranchManager.find({ bankManagerId }).select(
      'branchManagerId name branchId'
    );

    res.status(200).json(branchManagers);
  } catch (err) {
    console.error('Error fetching branch managers:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.delete('/bankmanager/delete-branchmanagers/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await BranchManager.findOneAndDelete({ branchManagerId: id });

    if (!deleted) {
      return res.status(404).json({ error: 'Branch Manager not found.' });
    }

    res.status(200).json({ message: 'Branch Manager deleted successfully.' });
  } catch (err) {
    console.error('Error deleting branch manager:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});


app.post('/bankmanager/add-branchmanager', verifyToken, async (req, res) => {
  const {
    branchManagerId,
    name,
    email,
    mobno,
    address,
    password,
    branchId,
  } = req.body;

  if (
    !branchManagerId ||
    !name ||
    !email ||
    !mobno ||
    !address ||
    !password ||
    !branchId
  ) {
    return res.status(400).json({ error: 'All fields except bankManagerId are required' });
  }

  try {
    const existingManager = await BranchManager.findOne({ branchManagerId });
    if (existingManager) {
      return res.status(400).json({ error: 'Branch Manager ID already exists' });
    }

    const existingEmail = await BranchManager.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const bankManagerId = req.user.managerId;

    const newBranchManager = new BranchManager({
      branchManagerId,
      name,
      email,
      mobno,
      address,
      password,
      branchId,
      bankManagerId,
    });

    await newBranchManager.save();

    res.status(201).json({ message: 'Branch Manager created', id: branchManagerId });
  } catch (err) {
    console.error('Error creating branch manager:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/branchmanager/profile', verifyToken, async (req, res) => {
  try {
    const managerId = req.user.branchManagerId; // ✅ FIXED
    const manager = await BranchManager.findOne({ branchManagerId: managerId });

    if (!manager) {
      return res.status(404).json({ error: 'Branch Manager not found' });
    }

    res.status(200).json({
      branchManagerId: manager.branchManagerId,
      branchId: manager.branchId,
      name: manager.name,
      email: manager.email
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post('/branchmanager/add-bankworker', verifyToken, async (req, res) => {
  const {
    workerId,
    name,
    email,
    mobno,
    address,
    password,
    branchId
  } = req.body;

  if (!workerId || !name || !email || !mobno || !address || !password || !branchId) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existingWorker = await BankWorker.findOne({ workerId });
    if (existingWorker) {
      return res.status(400).json({ error: 'Worker ID already exists' });
    }

    const existingEmail = await BankWorker.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const branchManagerId = req.user.branchManagerId;

    const newWorker = new BankWorker({
      workerId,
      name,
      email,
      mobno,
      address,
      password,
      branchId,
      branchManagerId
    });

    await newWorker.save();

    res.status(201).json({ message: 'Bank Worker added successfully', id: newWorker._id });
  } catch (err) {
    console.error('Error adding Bank Worker:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.get('/branchmanager/delete-workers', verifyToken, async (req, res) => {
  try {
    const branchManagerId = req.user.branchManagerId

    const workers = await BankWorker.find({ branchManagerId });

    res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
app.delete('/branchmanager/delete-workers/:workerId', verifyToken, async (req, res) => {
  const { workerId } = req.params;
  const branchId = req.user.branchId;

  console.log('Trying to delete:', workerId);
  console.log('Branch ID from token:', branchId);

  try {
    const deleted = await BankWorker.findOneAndDelete({
      workerId,
      branchId: branchId,
    });

    if (!deleted) {
      console.log('No matching worker found for deletion');
      return res.status(404).json({ message: 'Worker not found or unauthorized' });
    }

    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});






app.get('/branchmanager/loans', verifyToken, async (req, res) => {
  try {
    const branchManagerId = req.user.branchManagerId;
    if (!branchManagerId) return res.status(401).json({ message: 'Unauthorized' });

    const branchManager = await BranchManager.findOne({ branchManagerId });
    if (!branchManager) return res.status(404).json({ message: 'Branch manager not found' });

    const loans = await Loan.find({ status: 'pending', branchId: branchManager.branchId });
    res.json(loans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.patch('/branchmanager/loans/:loanId', verifyToken, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const branchManagerId = req.user.branchManagerId;
    if (!branchManagerId) return res.status(401).json({ message: 'Unauthorized' });

    const branchManager = await BranchManager.findOne({ branchManagerId });
    if (!branchManager) return res.status(404).json({ message: 'Branch manager not found' });

    const loan = await Loan.findOne({ loanId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    if (loan.branchId !== branchManager.branchId) {
      return res.status(403).json({ message: 'Unauthorized to update this loan' });
    }

    loan.status = status;
    if (status === 'approved') {
      loan.approvedByBranchManagerId = branchManagerId;
      loan.approvalDate = new Date();
      loan.disbursementDate = new Date();

      const accountHolder = await AccountHolder.findOne({ accountNumber: loan.accountHolderNumber });
      if (!accountHolder) {
        return res.status(404).json({ message: 'Account holder not found' });
      }

      const existingBalance = Number(accountHolder.balance) || 0;
      const loanAmount = Number(loan.parentAmount) || 0;
      accountHolder.balance = existingBalance + loanAmount;
      await accountHolder.save();
    }
    const loanAmount = Number(loan.parentAmount) || 0;


    await loan.save();
    const transactionId = `TXN-${Date.now()}-${uuidv4().slice(0, 6)}`;
    const transaction = new Transaction({
      transactionId,
      fromAccountId: "BANK-LOAN-SYSTEM",
      toAccountId: loan.accountHolderNumber,
      branchId: loan.branchId,
      amount: loanAmount,
      transactionType: 'loan credit',
      status: 'completed',
      purpose: 'Bank Transfer',
      remarks: `Loan Credited`,
    });
    await transaction.save();

    const notif = new Notification({
      receiverId: loan.accountHolderNumber,
      message: status === 'approved' ? `Loan Approved of amount ₹${loanAmount}` : `Loan Denied of amount ${loanAmount}`,
      purpose: 'Loan Status Update',
      isRead: false,
    });
    await notif.save();

    res.json({ message: `Loan ${status} successfully.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});



app.get('/branchmanager/loans/:loanId', verifyToken, async (req, res) => {
  try {
    const branchManagerId = req.user.branchManagerId;
    if (!branchManagerId) return res.status(401).json({ message: 'Unauthorized' });

    const branchManager = await BranchManager.findOne({ branchManagerId });
    if (!branchManager) return res.status(404).json({ message: 'Branch manager not found' });

    const loan = await Loan.findOne({ loanId: req.params.loanId, branchId: branchManager.branchId });
    if (!loan) return res.status(404).json({ message: 'Loan not found' });

    res.json(loan);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});





app.get('/bankworker/generate-account-number', verifyToken, async (req, res) => {
  try {
    const workerId = req.user.workerId;
    const bankWorker = await BankWorker.findOne({ workerId: workerId });
    if (!bankWorker) {
      return res.status(404).json({ error: 'Bank worker not found' });
    }

    const fullBranchId = bankWorker.branchId;
    if (!fullBranchId || fullBranchId.length < 4) {
      return res.status(400).json({ error: 'Invalid branch ID in bank worker data' });
    }
    const branchId = fullBranchId.substring(0, 4);
    const now = new Date();
    const yearTwoDigits = now.getFullYear().toString().slice(-2);

    const prefix = branchId + yearTwoDigits;
    const lastAccount = await AccountHolder.findOne({
      accountNumber: { $regex: `^${prefix}` }
    }).sort({ createdAt: -1 });

    let serialNumber = 1;

    if (lastAccount) {
      const lastSerialStr = lastAccount.accountNumber.slice(-6);
      const lastSerialNum = parseInt(lastSerialStr, 10);
      if (!isNaN(lastSerialNum)) {
        serialNumber = lastSerialNum + 1;
      }
    }

    const serialStr = serialNumber.toString().padStart(6, '0');
    const newAccountNumber = prefix + serialStr;

    res.json({ accountNumber: newAccountNumber });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error generating account number' });
  }
});


app.post('/bankworker/create-account-holder', verifyToken, async (req, res) => {
  try {
    const workerId = req.user.workerId;
    if (!workerId) return res.status(401).json({ message: 'Unauthorized: No workerId in token' });

    const bankWorker = await BankWorker.findOne({ workerId });
    if (!bankWorker) return res.status(404).json({ message: 'Bank worker not found' });

    const fullBranchId = bankWorker.branchId;
    if (!fullBranchId || fullBranchId.length < 4) {
      return res.status(400).json({ message: 'Invalid branch ID in bank worker data' });
    }
    const branchId = fullBranchId;
    const { name, email, mobno, password, address, balance, accountNumber } = req.body;
    if (!name || !email || !mobno || !password || !accountNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const AccHoldername = req.body.name

    const newAccountHolder = new AccountHolder({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobno: mobno.trim(),
      password,
      branchId,
      accountNumber,
      address: address ? address.trim() : '',
      balance: balance || 0,
      createdAt: new Date(),
    });

    await newAccountHolder.save();
    if (newAccountHolder) {
      const notif = new Notification({
        receiverId: accountNumber,
        message:  `Welcome ${AccHoldername} ! Happy Banking !` ,
        purpose: 'New Account Created.',
        isRead: false,
      });
      await notif.save();
    }

    res.status(201).json({ message: 'Account holder created successfully', accountHolder: newAccountHolder });
  } catch (error) {
    console.error('Create account holder error:', error);
    res.status(500).json({ message: 'Server error while creating account holder' });
  }
});

app.get('/bankworker/info', verifyToken, async (req, res) => {
  try {
    const workerId = req.user.workerId;

    if (!workerId) {
      return res.status(401).json({ message: 'Unauthorized: No workerId in token' });
    }

    const worker = await BankWorker.findOne({ workerId });
    if (!worker) {
      return res.status(404).json({ message: 'Bank worker not found' });
    }

    res.json({
      workerId: worker.workerId,
      branchId: worker.branchId,
    });
  } catch (error) {
    console.error('Worker info fetch error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/check-loan-eligibility/:accountHolderNumber', async (req, res) => {
  const { accountHolderNumber } = req.params;

  try {
    // Get all loans for this account holder (whether approved or not)
    const loans = await Loan.find({ accountHolderNumber });

    for (const loan of loans) {
      // Check if not approved
      const notApproved = !loan.approvedByBranchManagerId || loan.approvedByBranchManagerId === false;

      const payments = await LoanPayment.find({ loanId: loan.loanId });
      const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);

      const notFullyPaid = totalPaid < loan.amountToBePaid;

      if (notApproved || notFullyPaid) {
        return res.json({ eligible: false, reason: 'Pending loan exists (not approved or not fully paid).' });
      }
    }

    return res.json({ eligible: true });
  } catch (err) {
    console.error('Error checking loan eligibility:', err);
    res.status(500).json({ error: 'Server error while checking loan eligibility' });
  }
});



app.post('/bankworker/request-loan', verifyToken, async (req, res) => {
  try {
    const {
      loanId,
      parentAmount,
      amountToBePaid,
      accountHolderNumber,
      appliedByWorkerId,
      approvedByBranchManagerId,
      purpose,
      interestRate,
      tenureMonths,
      branchId,
    } = req.body;
    if (
      !loanId ||
      !parentAmount ||
      !amountToBePaid ||
      !accountHolderNumber ||
      !appliedByWorkerId ||
      !purpose ||
      !interestRate ||
      !tenureMonths ||
      !branchId
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newLoan = new Loan({
      loanId,
      parentAmount,
      amountToBePaid,
      accountHolderNumber,
      appliedByWorkerId,
      approvedByBranchManagerId: approvedByBranchManagerId || false,
      purpose,
      interestRate,
      tenureMonths,
      branchId,
    });

    await newLoan.save();
    const notif = new Notification({
        receiverId: accountHolderNumber,
        message:  `Loan Applied from the bank of Amount ₹${parentAmount}!` ,
        purpose: 'Loan Applied.',
        isRead: false,
      });
      await notif.save();

    res.status(201).json({ message: 'Loan request submitted successfully', loan: newLoan });
  } catch (error) {
    console.error('Loan request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




app.get('/bankworker/fetch-details/:accountNumber', verifyToken, async (req, res) => {
  try {
    const account = await AccountHolder.findOne({ accountNumber: req.params.accountNumber });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    res.json({
      name: account.name,
      balance: account.balance,
      mobile: account.mobile,
      address: account.address,
      branchId: account.branchId,
      accountNumber: account.accountNumber,
      createdAt: account.createdAt,
    });
  } catch (err) {
    console.error('Error fetching account details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



app.get('/bankworker/account/:accountNumber', verifyToken, async (req, res) => {
  try {
    const account = await AccountHolder.findOne({ accountNumber: req.params.accountNumber });
    if (!account) return res.status(404).json({ message: 'Account not found' });

    res.json({ name: account.name, balance: account.balance });
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/bankworker/transfer-money', verifyToken, async (req, res) => {
  try {
    const { from, to, amount, applicationNumber } = req.body;
    const amt = Number(amount);

    if (!from || !to || !amt || amt <= 0 || !applicationNumber || applicationNumber.length !== 4) {
      return res.status(400).json({ message: 'Invalid input fields' });
    }

    const sender = await AccountHolder.findOne({ accountNumber: from });
    const receiver = await AccountHolder.findOne({ accountNumber: to });

    if (!sender || !receiver)
      return res.status(404).json({ message: 'Sender or Receiver not found' });

    if (sender.balance < amt)
      return res.status(400).json({ message: 'Insufficient sender balance' });

    sender.balance -= amt;
    receiver.balance += amt;

    await sender.save();
    await receiver.save();

    const transactionId = `TXN-${Date.now()}-${uuidv4().slice(0, 6)}`;
    const transaction = new Transaction({
      transactionId,
      fromAccountId: from,
      toAccountId: to,
      branchId: sender.branchId,
      amount: amt,
      transactionType: 'transfer',
      status: 'completed',
      purpose: 'Bank Worker Transfer',
      remarks: `AppNo: ${applicationNumber}`,
    });

    await transaction.save();
    const notif_from = new Notification({
        receiverId: from,
        message:  `₹${amt} debited from your Account.` ,
        purpose: 'Transferred Money through Bank.',
        isRead: false,
      });
      await notif_from.save();
    const notif_to = new Notification({
        receiverId: to,
        message:  `₹${amt} credited to your Account.` ,
        purpose: 'Transferred Money through Bank.',
        isRead: false,
      });
      await notif_to.save();

    res.json({ message: 'Transfer completed successfully', transactionId });
  } catch (err) {
    console.error('Transfer error:', err);
    res.status(500).json({ message: 'Server error during transfer' });
  }
});



app.get('/transactions/account/:accountNumber', async (req, res) => {
  const { accountNumber } = req.params;

  try {
    const transactions = await Transaction.find({
      $or: [
        { fromAccountId: accountNumber },
        { toAccountId: accountNumber },
      ],
    }).sort({ transactionDate: -1 });

    const accountNumbersSet = new Set();
    transactions.forEach(tx => {
      accountNumbersSet.add(tx.fromAccountId);
      accountNumbersSet.add(tx.toAccountId);
    });
    const accountNumbers = Array.from(accountNumbersSet);

    const accounts = await AccountHolder.find({ accountNumber: { $in: accountNumbers } });
    const nameMap = {};
    accounts.forEach(acc => {
      nameMap[acc.accountNumber] = acc.name;
    });

    const response = transactions.map(tx => {
      const isSender = tx.fromAccountId === accountNumber;
      return {
        transactionId: tx.transactionId,
        type: isSender ? 'sent' : 'received', 
        counterpartyName: isSender ? (nameMap[tx.toAccountId] || 'Unknown') : (nameMap[tx.fromAccountId] || 'Unknown'),
        amount: tx.amount,
        transactionDate: tx.transactionDate,
        status: tx.status,
        purpose: tx.purpose,
        remarks: tx.remarks,
      };
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/bankworker/loans/:accountNumber", async (req, res) => {
  const accountNumber = req.params.accountNumber;

  try {

    const loans = await Loan.find({ accountHolderNumber: accountNumber }).lean();
    for (const loan of loans) {
      const payments = await LoanPayment.aggregate([
        { $match: { loanId: loan.loanId } },
        { $group: { _id: "$loanId", totalPaid: { $sum: "$paymentAmount" } } },
      ]);

      loan.amountPaid = payments.length > 0 ? payments[0].totalPaid : 0;

      if (loan.amountToBePaid - loan.amountPaid <= 0 && loan.status !== "closed") {
        loan.status = "closed";
      }
    }

    res.json({ loans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching loans." });
  }
});


app.post("/bankworker/pay-loan", verifyToken, async (req, res) => {
  try {
    const { loanId, paymentAmount, paymentMode, remarks } = req.body;
    if (!loanId || !paymentAmount || paymentAmount <= 0 || !paymentMode) {
      return res.status(400).json({ error: "Missing or invalid fields" });
    }

    const loan = await Loan.findOne({ loanId });
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const payments = await LoanPayment.find({ loanId });
    const totalPaid = payments.reduce((sum, p) => sum + p.paymentAmount, 0);
    const unpaidAmount = loan.amountToBePaid - totalPaid;

    if (paymentAmount > unpaidAmount) {
      return res.status(400).json({
        error: `Payment exceeds unpaid amount of ${unpaidAmount.toFixed(2)}`,
      });
    }
    function generatePaymentId() {
      const prefix = "PAY";
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0"); 
      return `${prefix}${timestamp}${randomNum}`;
    }

    const payment = new LoanPayment({
      paymentId: generatePaymentId(),
      loanId,
      accountHolderId: loan.accountHolderNumber,
      paymentAmount,
      paymentMode,
      remarks,
    });

    await payment.save();

    const notif = new Notification({
        receiverId: loan.accountHolderNumber,
        message:  `Payment of ₹${paymentAmount} is successfull for the Loan.` ,
        purpose: `Loan Payment.`,
        isRead: false,
      });
      await notif.save();

    if (paymentAmount === unpaidAmount) {
      loan.status = "closed";
      await loan.save();
    }

    res.json({ message: "Payment successful", payment });
  } catch (error) {
    console.error("Error in /bankworker/pay-loan:", error);
    res.status(500).json({ error: "Server error" });
  }
});


app.get('/notificationscount', verifyToken, async (req, res) => {
  const { receiverId } = req.query;
  if (!receiverId) {
    return res.status(400).json({ error: "receiverId is required" });
  }

  try {
    const unreadCount = await Notification.countDocuments({
      receiverId,
      isRead: false,
    });

    res.json({ unreadCount });
  } catch (err) {
    console.error("Error fetching unread notifications count:", err);
    res.status(500).json({ error: "Server error while fetching notifications count" });
  }
});

app.put('/notifications/mark-read', verifyToken, async (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: "receiverId is required" });

  try {
    await Notification.updateMany({ receiverId, isRead: false }, { isRead: true });
    res.json({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("Error updating notifications:", err);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});


app.get('/notifications', verifyToken, async (req, res) => {
  const { receiverId } = req.query;

  if (!receiverId) {
    return res.status(400).json({ error: "receiverId is required" });
  }

  try {
    const notifications = await Notification.find({ receiverId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Server error while fetching notifications" });
  }
});

app.post('/account-holder/transfer-money', verifyToken, async (req, res) => {
  const { senderAccountNumber, receiverAccountNumber, amount } = req.body;

  if (!senderAccountNumber || !receiverAccountNumber || !amount) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const sender = await AccountHolder.findOne({ accountNumber: senderAccountNumber });
    const receiver = await AccountHolder.findOne({ accountNumber: receiverAccountNumber });

    if (!sender) {
      return res.status(404).json({ error: "Sender account not found" });
    }
    if (!receiver) {
      return res.status(404).json({ error: "Receiver account not found" });
    }

    if (sender.balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    sender.balance -= amount;
    await sender.save();

    receiver.balance += amount;
    await receiver.save();

    const transactionId = uuidv4();

    const Transaction_Create = await Transaction.create({
      transactionId,
      fromAccountId: senderAccountNumber,
      toAccountId: receiverAccountNumber,
      branchId: sender.branchId, 
      amount,
      transactionType: "transfer",
      purpose: "Self Transfer",
      status: "completed",
      transactionDate: new Date(),
      remarks: `Transferred ${amount} from ${senderAccountNumber} to ${receiverAccountNumber}`
    });

    if(Transaction_Create){
      const notif_sender = new Notification({
        receiverId: senderAccountNumber,
        message:  `Transfer of ₹${amount} is successfull.` ,
        purpose: `Self Transfer`,
        isRead: false,
      });
      await notif_sender.save();
      const notif_reciever = new Notification({
        receiverId: receiverAccountNumber,
        message:  `₹${amount} credited to your Account.` ,
        purpose: `Self Transfer`,
        isRead: false,
      });
      await notif_reciever.save();
    }

    res.json({ message: "Transfer successful", transactionId });
  } catch (error) {
    console.error("Error during transfer:", error);
    res.status(500).json({ error: "Server error during transfer" });
  }
});


app.get('/bankworker/account/:accountNumber', verifyToken,async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const account = await AccountHolder.findOne({ accountNumber });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      name: account.name,
      balance: account.balance,
    });
  } catch (err) {
    console.error('Error fetching account:', err);
    res.status(500).json({ message: 'Server error while fetching account' });
  }
});

app.post('/bankworker/deposit',verifyToken, async (req, res) => {
  try {
    const { accountNumber, amount, remarks } = req.body;

    if (!accountNumber || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid account number or deposit amount' });
    }

    const account = await AccountHolder.findOne({ accountNumber });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    account.balance += amount;
    await account.save();



    const transactionId = uuidv4();
    const Transaction_Create = await Transaction.create({
      transactionId,
      fromAccountId: "BANK_DEPOSIT",
      toAccountId: accountNumber,
      branchId: account.branchId, 
      amount,
      transactionType: "deposit",
      purpose: "Bank Deposit",
      status: "completed",
      transactionDate: new Date(),
      remarks: `Deposited ${amount} fromto your account.`
    });

    const notif = new Notification({
        receiverId: accountNumber,
        message:  `Bank Deposit of ₹${amount} is successfull.` ,
        purpose: `Bank Deposit`,
        isRead: false,
      });
      await notif.save();


    res.json({ message: 'Deposit successful' });
  } catch (err) {
    console.error('Error during deposit:', err);
    res.status(500).json({ message: 'Server error while processing deposit' });
  }
});




app.get("/branchmanager/see-loans", verifyToken, async (req, res) => {
  try {
    const branchId = req.user.branchId; 
    const loans = await Loan.find({ branchId }).lean();
    const loanIds = loans.map((loan) => loan.loanId);
    const payments = await LoanPayment.find({ loanId: { $in: loanIds } }).lean();
    const paidMap = payments.reduce((acc, payment) => {
      acc[payment.loanId] = (acc[payment.loanId] || 0) + payment.paymentAmount;
      return acc;
    }, {});

    const loansWithUnpaid = loans.map((loan) => {
      const totalPaid = paidMap[loan.loanId] || 0;
      return {
        ...loan,
        unpaidAmount: loan.amountToBePaid - totalPaid,
      };
    });

    return res.json(loansWithUnpaid);
  } catch (err) {
    console.error("Error fetching loans for branch manager:", err);
    return res.status(500).send("Internal server error");
  }
});

app.get("/branchmanager/loanpayments", verifyToken, async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const loans = await Loan.find({ branchId }).lean();
    const loanIds = loans.map((loan) => loan.loanId);
    const payments = await LoanPayment.find({ loanId: { $in: loanIds } }).lean();

    return res.json(payments);
  } catch (err) {
    console.error("Error fetching loan payments for branch manager:", err);
    return res.status(500).send("Internal server error");
  }
});

app.get("/branchmanager/accountholderdetails/:accountNumber", verifyToken, async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { accountNumber } = req.params;

    const accountHolder = await AccountHolder.findOne({ accountNumber, branchId }).lean();

    if (!accountHolder) {
      return res.status(404).send("Account holder not found or does not belong to your branch.");
    }

    return res.json(accountHolder);
  } catch (err) {
    console.error("Error fetching account holder details:", err);
    return res.status(500).send("Internal server error");
  }
});



app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
