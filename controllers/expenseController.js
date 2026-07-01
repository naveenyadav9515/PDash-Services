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
    
    // ── 1. Time Boundaries ──
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = Math.max(1, now.getDate());
    const daysLeft = Math.max(0, daysInMonth - daysPassed);

    // ── 2. Previous month boundaries (for trend comparison) ──
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // ── 3. Fetch ONLY relevant expenses using MongoDB queries (not all expenses!) ──
    const thisMonthExpenses = await Expense.find({
      user: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const prevMonthExpenses = await Expense.find({
      user: userId,
      date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth }
    });

    // ── 4. Calculate monthly spend precisely ──
    const monthlySpend = thisMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevMonthSpend = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // ── 5. Budget calculations ──
    const budgetTarget = 30000;
    const budgetUsedPct = Math.min(100, Math.round((monthlySpend / budgetTarget) * 100));

    // ── 6. Top Categories (from this month only) ──
    const categoryTotals = {};
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
      .slice(0, 5);

    // ── 7. Chart Data — last 7 days ──
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch 7-day expenses in a single query
    const weekExpenses = await Expense.find({
      user: userId,
      date: { $gte: sevenDaysAgo, $lte: now }
    });

    const chartLabels = [];
    const chartData = [];
    let weeklyTotal = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      const dayTotal = weekExpenses
        .filter(e => e.date >= dStart && e.date <= dEnd)
        .reduce((sum, e) => sum + e.amount, 0);
        
      chartLabels.push(dStart.toLocaleDateString('en-US', { weekday: 'short' }));
      chartData.push(dayTotal);
      weeklyTotal += dayTotal;
    }

    // ── 8. Real trend calculation ──
    // Compare current month's daily avg with previous month's daily avg
    const prevDaysInMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    const prevDailyAvg = prevMonthSpend / prevDaysInMonth;
    const currentDailyAvg = monthlySpend / daysPassed;
    
    let trendPct = 0;
    let trendStatus = 'flat';
    if (prevDailyAvg > 0) {
      trendPct = Math.round(((currentDailyAvg - prevDailyAvg) / prevDailyAvg) * 100);
      trendStatus = trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';
      trendPct = Math.abs(trendPct);
    }

    // ── 9. Forecast ──
    const estimatedSpend = Math.round(currentDailyAvg * daysInMonth);
    const isHealthy = estimatedSpend <= budgetTarget;
    
    // ── 10. Real Insight — find category with highest spend vs prev month ──
    const prevCategoryTotals = {};
    prevMonthExpenses.forEach(e => {
      const catName = e.category === 'Food' ? 'Food & Dining' : e.category;
      prevCategoryTotals[catName] = (prevCategoryTotals[catName] || 0) + e.amount;
    });

    const topCat = topCategories[0]?.name || 'Food & Dining';
    const topCatThisMonth = categoryTotals[topCat === 'Food & Dining' ? 'Food' : topCat] || 0;
    const topCatPrevMonth = prevCategoryTotals[topCat] || 0;
    
    let insightPct = 0;
    let insightText = '';
    if (topCatPrevMonth > 0) {
      insightPct = Math.round(((topCatThisMonth - topCatPrevMonth) / topCatPrevMonth) * 100);
      if (insightPct > 0) {
        insightText = `You're spending ${insightPct}% more on ${topCat} compared to last month.`;
      } else if (insightPct < 0) {
        insightText = `Great job! You've reduced ${topCat} spending by ${Math.abs(insightPct)}% vs last month.`;
      } else {
        insightText = `Your ${topCat} spending is consistent with last month.`;
      }
    } else if (topCatThisMonth > 0) {
      insightText = `${topCat} is your top category this month at ₹${topCatThisMonth.toLocaleString('en-IN')}.`;
    } else {
      insightText = 'Start logging expenses to get spending insights!';
    }

    res.status(200).json({
      status: 'success',
      data: {
        monthlySpend,
        budgetTarget,
        budgetUsedPct,
        budgetStatus: isHealthy ? 'Healthy' : 'At Risk',
        spent: monthlySpend,
        available: Math.max(0, budgetTarget - monthlySpend),
        daysLeft,
        daysInMonth,
        topCategories,
        spendingTrend: {
          labels: chartLabels,
          data: chartData,
          avgPerWeek: Math.round(weeklyTotal),
          trendPct,
          trendStatus
        },
        forecast: {
          estimatedSpend,
          statusText: isHealthy ? "You're on track to stay within budget." : "You're projected to exceed your budget.",
          statusColor: isHealthy ? 'var(--lm-color-success)' : 'var(--lm-color-error)'
        },
        insight: {
          highlightPct: `${Math.abs(insightPct)}%`,
          highlightCategory: topCat,
          text: insightText
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
        notes: expenseData.notes || pending.notes,
        gmailMessageId: pending.gmailMessageId
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
