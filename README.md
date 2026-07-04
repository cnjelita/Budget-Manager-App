# 💰 Budget Manager App

A full-stack personal finance web application built with React, Node.js/Express, and MongoDB.

## Features

- **User Authentication** — Secure register/login with JWT & bcrypt password hashing
- **Interactive Dashboard** — Monthly spending summary, pie chart by category, budget progress bars
- **Expense Management (CRUD)** — Create, read, update, and delete transactions with date, amount, category, and description
- **Monthly Budgeting** — Set per-category budget limits with progress bars showing remaining balance
- **Filtering & History** — Filter transactions by date range, category, and amount with pagination

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (jsonwebtoken) + bcryptjs |

## Project Structure

```
Budget-Manager-App/
├── server/              # Express backend
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Route logic
│   ├── middleware/       # JWT auth middleware
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── scripts/         # DB seeder
│   └── server.js        # Entry point
└── client/              # React frontend
    └── src/
        ├── api/         # Axios instance
        ├── components/  # Reusable UI components + charts
        ├── context/     # Auth context
        └── pages/       # Dashboard, Expenses, Budgets, Auth
```

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env and set MONGO_URI, JWT_SECRET
npm install
npm run dev        # starts on http://localhost:5000
```

Seed default categories (optional):
```bash
node scripts/seedCategories.js
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev        # starts on http://localhost:5173
```

The Vite dev server proxies all `/api` requests to the backend.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| GET | `/api/auth/me` | Get current user profile |
| GET | `/api/expenses` | List expenses (filterable) |
| POST | `/api/expenses` | Create expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/summary` | Monthly category breakdown |
| GET | `/api/budgets` | List budgets with progress |
| POST | `/api/budgets` | Set/update a budget |
| DELETE | `/api/budgets/:id` | Remove a budget |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create custom category |
| DELETE | `/api/categories/:id` | Delete custom category |

## Database Schema

| Collection | Key Fields |
|-----------|-----------|
| Users | `_id`, `name`, `email`, `password_hash`, `created_at` |
| Categories | `_id`, `user_id`, `name`, `icon`, `color` |
| Budgets | `_id`, `user_id`, `category_id`, `amount_limit`, `month_year` |
| Expenses | `_id`, `user_id`, `category_id`, `amount`, `date`, `description` |

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/budget_manager
JWT_SECRET=your_secret_here
JWT_EXPIRE=30d
NODE_ENV=development
```
