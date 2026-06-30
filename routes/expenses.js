const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

// All expense routes require authentication
router.use(protect);

router.get('/summary', expenseController.getExpenseSummary);

router.get('/pending', expenseController.getPendingTransactions);
router.post('/pending/simulate', expenseController.simulateAutoLog);
router.post('/pending/:id', expenseController.processPendingTransaction);

router.route('/')
  .post(expenseController.createExpense)
  .get(expenseController.getExpenses);

module.exports = router;
