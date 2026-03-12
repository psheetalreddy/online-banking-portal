# Online Banking Portal

## Current State
New project — no existing code.

## Requested Changes (Diff)

### Add
- Full online banking portal with Sprint-1 (User & Account Management) and Sprint-2 (Transactions & Payments)
- Authentication: register, login, logout with session management
- Dashboard: total balance summary, accounts overview, recent transactions, notifications
- Account Management: Savings, Current, Credit Card, Home Loan, Investments, Insurance categories; expandable lists; delete account; account detail placeholder
- Messages/Alerts: view, open, mark read/unread, delete, create new messages
- Profile Management: view/edit name, address, DOB, preferences; ID proof upload triggers KYC pending state
- Transaction History: list with filters (last 10, last month, date range); dispute option for credit card transactions
- Fund Transfer: select source account, select/add payee, enter amount, optional standing instructions, confirm
- Payments: pay credit card bills and home loan EMI; select source account; balance check; process payment
- Sidebar navigation with all sections
- Header with logo, notifications bell, logout

### Modify
N/A

### Remove
N/A

## Implementation Plan

### Backend (Motoko)
- User profile store: name, email, dateOfBirth, address, phoneNumber, preferences, kycStatus, idProofDocument
- Account store: accountType, accountNumber, balance, status, createdAt
- Transaction store: fromAccount, toAccount, amount, type, date, description, status
- Payee store: payeeName, bankName, branchName, accountNumber, ifsc
- Message store: subject, message, status (read/unread), createdAt
- APIs: CRUD for all entities, transfer funds, process payments, dispute transaction, filter transactions
- Use authorization component for auth; blob-storage for ID proof document uploads

### Frontend (React + TypeScript)
- App shell: sidebar + header layout
- Pages: Login, Register, Dashboard, Accounts, Messages, Profile, Transactions, Transfer, Payments
- Dashboard widgets: total balance card, accounts summary, recent transactions list, unread message count
- Account page: collapsible categories, balance display, delete account action
- Messages page: list with read/unread state, open detail, mark unread, delete, compose
- Profile page: view/edit form, ID proof upload (blob-storage), KYC pending banner
- Transactions page: table with filter controls, dispute modal for CC transactions
- Transfer page: source account select, payee select/add form, amount input, standing instruction toggle, confirm dialog
- Payments page: select CC/HL account, show balance/due date, source account select, process button
- Loading states, success/error toasts, confirmation dialogs throughout
