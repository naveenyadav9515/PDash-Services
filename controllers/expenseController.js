const Expense = require('../models/Expense');
const PendingTransaction = require('../models/PendingTransaction');

exports.getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json({
      status: 'success',
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    next(error);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { amount, category, merchant, tags, notes, date, paymentMethod } = req.body;
    
    const expense = await Expense.create({
      user: req.user.id,
      amount,
      category,
      merchant,
      tags,
      notes,
      date,
      paymentMethod
    });

    res.status(201).json({
      status: 'success',
      data: expense
    });
  } catch (error) {
    next(error);
  }
};

exports.getExpenseSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // 1. Time Boundaries
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 2. Fetch all expenses for calculations
    const expenses = await Expense.find({ user: userId });

    // 3. Helper to sum amounts based on date range
    const sumRange = (start, end) => {
      return expenses
        .filter(e => e.date >= start && (!end || e.date <= end))
        .reduce((sum, e) => sum + e.amount, 0);
    };

    // Core Metrics
    const budgetTarget = 30000;
    const monthlySpend = sumRange(startOfMonth);
    const budgetUsedPct = Math.min(100, Math.round((monthlySpend / budgetTarget) * 100));
    
    // Top Categories
    const categoryTotals = {};
    const thisMonthExpenses = expenses.filter(e => e.date >= startOfMonth);
    thisMonthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    
    const topCategories = Object.keys(categoryTotals)
      .map(cat => ({
        name: cat === 'Food' ? 'Food & Dining' : cat,
        amount: categoryTotals[cat],
        percentage: monthlySpend === 0 ? 0 : Math.round((categoryTotals[cat] / monthlySpend) * 1000) / 10
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // top 5

    // Chart Data (7 Days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const chartLabels = [];
    const chartData = [];
    let weeklyTotal = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dStart = new Date(d.setHours(0,0,0,0));
      const dEnd = new Date(d.setHours(23,59,59,999));
      
      const dayTotal = expenses
        .filter(e => e.date >= dStart && e.date <= dEnd)
        .reduce((sum, e) => sum + e.amount, 0);
        
      chartLabels.push(dStart.toLocaleDateString('en-US', { weekday: 'short' }));
      chartData.push(dayTotal);
      weeklyTotal += dayTotal;
    }

    // AI Insight / Forecast Math
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = Math.max(1, now.getDate());
    const dailyAvg = monthlySpend / daysPassed;
    const estimatedSpend = Math.round(dailyAvg * daysInMonth);
    const isHealthy = estimatedSpend <= budgetTarget;
    
    // Example AI Insight finding highest category vs usual
    const topCat = topCategories[0]?.name || 'Food & Dining';

    res.status(200).json({
      status: 'success',
      data: {
        monthlySpend,
        budgetTarget,
        budgetUsedPct,
        budgetStatus: isHealthy ? 'Healthy' : 'At Risk',
        spent: monthlySpend,
        available: Math.max(0, budgetTarget - monthlySpend),
        topCategories,
        spendingTrend: {
          labels: chartLabels,
          data: chartData,
          avgPerWeek: Math.round(weeklyTotal / 1), // Assuming 1 week
          trendPct: 8, // mock percentage
          trendStatus: 'up'
        },
        forecast: {
          estimatedSpend,
          statusText: isHealthy ? "You're on track to stay within budget." : "You're projected to exceed your budget.",
          statusColor: isHealthy ? 'var(--lm-color-success)' : 'var(--lm-color-error)'
        },
        insight: {
          highlightPct: '28%',
          highlightCategory: topCat,
          text: `You're spending 28% more on ${topCat} compared to your monthly average.`
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingTransactions = async (req, res, next) => {
  try {
    const pending = await PendingTransaction.find({ user: req.user.id, status: 'Pending' }).sort({ date: -1 });
    res.status(200).json({
      status: 'success',
      count: pending.length,
      data: pending
    });
  } catch (error) {
    next(error);
  }
};

exports.processPendingTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, ...expenseData } = req.body; // action: 'approve' or 'ignore'

    const pending = await PendingTransaction.findOne({ _id: id, user: req.user.id });
    if (!pending) {
      return res.status(404).json({ status: 'error', message: 'Pending transaction not found' });
    }

    if (action === 'ignore') {
      pending.status = 'Rejected';
      await pending.save();
      return res.status(200).json({ status: 'success', message: 'Transaction ignored' });
    }

    if (action === 'approve') {
      pending.status = 'Approved';
      await pending.save();

      // Create actual expense
      const expense = await Expense.create({
        user: req.user.id,
        amount: expenseData.amount || pending.amount,
        merchant: expenseData.merchant || pending.merchant,
        category: expenseData.category || pending.category,
        paymentMethod: expenseData.paymentMethod || pending.paymentMethod,
        date: pending.date,
        tags: expenseData.tags || pending.tags,
        notes: expenseData.notes || pending.notes
      });

      return res.status(201).json({ status: 'success', data: expense });
    }

    res.status(400).json({ status: 'error', message: 'Invalid action' });
  } catch (error) {
    next(error);
  }
};

// Automatic log feature simulator (Mocking Gmail parser)
exports.simulateAutoLog = async (req, res, next) => {
  try {
    const { amount, merchant, paymentMethod, date } = req.body;
    
    // Simulate parsing email to a pending transaction
    const pending = await PendingTransaction.create({
      user: req.user.id,
      amount: amount || Math.floor(Math.random() * 1000) + 100,
      merchant: merchant || 'Simulated Merchant',
      paymentMethod: paymentMethod || 'UPI',
      date: date || new Date(),
      status: 'Pending'
    });

    res.status(201).json({
      status: 'success',
      data: pending
    });
  } catch (error) {
    next(error);
  }
};

// On-demand or On-load synchronization of emails (Alternative to Pub/Sub)
exports.syncExpenses = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('+googleRefreshToken');
    
    if (user && user.gmailConnected && user.googleRefreshToken) {
      const { syncRecentBankEmails } = require('./webhooksController');
      await syncRecentBankEmails(user);
    }
    
    res.status(200).json({ status: 'success', message: 'Sync complete' });
  } catch (error) {
    next(error);
  }
};
