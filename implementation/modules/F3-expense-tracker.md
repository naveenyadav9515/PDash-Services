# Module Plan: Expense Tracker (F3)

## Core Principle
**Manual expense tracking is the primary workflow.**
The Expense Tracker module must function completely without Gmail, Bank integrations, Automatic transaction detection, or AI services. Users should be able to use 100% of the essential expense-tracking functionality through manual entry alone. Automatic transaction detection is an optional enhancement feature.

---

## 1. Primary Workflow (Default State)

When a user installs or imports the Expense Tracker module:
*   **Manual Entry** = Enabled
*   **Automatic Transaction Detection** = Disabled
*   **Gmail Integration** = Not Connected

The user should immediately be able to:
*   Add Expenses
*   Create Categories
*   Create Tags
*   Define Budgets
*   View Reports, Analytics, and Insights
*   Manage Expenses

---

## 2. Expense Entry Sources

### Source 1 (Primary): Manual Entry
This is the default method.
**Fields:**
*   Amount (e.g., ₹850)
*   Category (e.g., Food)
*   Reason (e.g., Dinner)
*   Tags (e.g., #Weekend, #Swiggy)
*   Notes
*   Date
*   Payment Method

### Source 2 (Optional): Automatic Transaction Detection
Disabled by default. User must explicitly enable it.

---

## 3. Automation Settings & Flow

**Navigation:** `Expense Tracker → Settings → Automation`
*   Option: `[ ] Enable Automatic Transaction Detection` (Default: OFF)

**Enabling Flow:**
1.  Enable Feature
2.  Connect Google Account (OAuth)
3.  Grant Gmail Permission
4.  Choose Supported Banks (e.g., ☑ Axis Bank, ☐ HDFC, ☐ ICICI, ☐ SBI, ☐ Credit Card Alerts)
5.  Start Monitoring

**User Configuration Schema (Stored per user/module):**
```json
{
  "expenseAutomationEnabled": false,
  "gmailConnected": false,
  "enabledBanks": []
}
```

**Gmail Monitoring Logic:**
Only active when `expenseAutomationEnabled = true` AND `gmailConnected = true`. Otherwise, no Gmail activity occurs, and no email access occurs.

---

## 4. Transaction Detection Workflow

**Data Flow:**
`Bank Email` → `Gmail API` → `Email Parser` → `Transaction Extracted` → `Pending Transaction Queue` → `User Notification`

**CRITICAL RULE:** Detected transactions should NEVER automatically become expenses. Every detected transaction requires user confirmation.

---

## 5. Pending Transaction Management

**Detected Transaction Example:**
*   ₹850 | Merchant: Swiggy | Status: Pending

**Notification Actions:**
1.  **Add:** Opens Review Screen. Fields pre-filled (Amount, Merchant). User adds Reason, Category, Tags, Notes. User confirms → Expense created.
2.  **Ignore:** Status becomes `Ignored`. Transaction never appears again.
3.  **Later:** Status remains `Pending`. Visible in Pending Expenses Widget, Pending Expenses Screen, and Pending Expenses Card.

---

## 6. Privacy & Product Philosophy

**Privacy Philosophy**
Users should never be forced to connect Gmail, grant email access, or enable automation. The Expense Tracker remains fully functional without any external integrations. Automation is a convenience feature, not a dependency.

**Product Philosophy (The 3 Scenarios)**
1.  **Scenario 1 (Manual User):** No Gmail, No Automation. Full Functionality.
2.  **Scenario 2 (Semi-Automated User):** Gmail Connected, Transaction Detection Enabled. User Reviews Transactions manually.
3.  **Scenario 3 (Power User):** Gmail Connected, Automation Enabled, AI Insights Enabled. Advanced Financial Analysis.

**Design Principle:**
*Manual Expense Tracking First → Automation Second → AI Third.*
The product should never depend on automation to be useful. Automation exists to reduce effort, not to replace the core experience.
