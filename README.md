# Track-My-Tax

Blockchain-governed infrastructure tax tracking system for UET Peshawar.

Built with **React + Vite + TypeScript** (frontend), **Python Flask** (backend), **MySQL** (database), and **Ganache** (local Ethereum chain).

---

## How to Run This Project in VS Code — Step by Step

### Step 1 — Install Prerequisites

Download and install each tool before continuing.

| Tool | Download | Notes |
|------|----------|-------|
| Node.js 18+ | https://nodejs.org | Choose the LTS version |
| Python 3.10+ | https://python.org/downloads | Tick "Add to PATH" during install |
| MySQL 8.0 | https://dev.mysql.com/downloads/installer | Use "Developer Default" setup |
| VS Code | https://code.visualstudio.com | Install the Python and ESLint extensions |
| Ganache CLI | Run `npm install -g ganache` in terminal after Node.js is installed | |

---

### Step 2 — Open the Project in VS Code

1. Extract the downloaded zip file to a folder, e.g. `C:\Projects\track-my-tax`
2. Open VS Code → **File → Open Folder** → select that folder
3. Open the integrated terminal: **View → Terminal** (or `` Ctrl + ` ``)

---

### Step 3 — Set Up the MySQL Database

Open the MySQL Command Line Client (installed with MySQL) and run:

```bash
mysql -u root -p < backend/setup_db.sql
```

When prompted, enter your MySQL root password.

This creates:
- Database: `escrow`
- User: `escrow_user` / password: `1k2a3p`
- All tables + 4 seed projects + admin account

Verify it worked:

```sql
mysql -u escrow_user -p1k2a3p
USE escrow;
SHOW TABLES;
```

You should see: `users`, `projects`, `transactions`, `risk_predictions`, `verifications`, `blockchain_logs`

---

### Step 4 — Start Ganache (Local Blockchain)

In a **new terminal tab** inside VS Code, run:

```bash
ganache --port 7545 --accounts 10 --deterministic
```

Keep this terminal running. You will see 10 accounts with their private keys printed. Leave it open.

---

### Step 5 — Deploy the Smart Contract (Hardhat)

In a **new terminal tab**, go into the backend folder and install Hardhat:

```bash
cd backend
npm install
```

Compile and deploy to Ganache:

```bash
npm run compile
npm run deploy
```

You will see output like:

```
✅  CitizenCredits deployed at: 0xAbc123...
   CONTRACT_ADDRESS=0xAbc123...
```

Copy that address. Open `backend/.env` and set:

```
CONTRACT_ADDRESS=0xAbc123...
```

---

### Step 6 — Start the Flask Backend

In a **new terminal tab**:

```bash
cd backend
python -m venv venv
```

**Windows:**
```bash
venv\Scripts\activate
```

**macOS / Linux:**
```bash
source venv/bin/activate
```

Install dependencies and start:

```bash
pip install -r requirements.txt
python app.py
```

Flask will start on **http://127.0.0.1:5000**

---

### Step 7 — Start the React Frontend

In a **new terminal tab** (back at the project root, **not** inside `backend/`):

```bash
npm install
npm run dev
```

Frontend will start on **http://localhost:5173**

Open your browser and go to: **http://localhost:5173**

---

### Step 8 — Log In

| Email | Password | Role |
|-------|----------|------|
| admin@tax.local | admin123 | Admin |

> To create Faculty or Student accounts, click **Sign In → Register** in the app. Admin cannot be registered — it is seeded directly in the database.

---

## QR Code Feature

Click the **QR icon** (grid icon ⊞) in the top-right corner of the navigation bar. A popover opens with a live scannable QR code pointing to your current URL, plus a one-click copy button. Scan it with any phone on the same Wi-Fi to open the app on mobile.

---

## Project Structure

```
track-my-tax/
├── backend/
│   ├── app.py                # Flask API (all 17 routes)
│   ├── setup_db.sql          # MySQL schema + seed data — run this first
│   ├── requirements.txt      # Python packages
│   ├── package.json          # Hardhat devDependencies
│   ├── hardhat.config.js     # Hardhat → Ganache network config
│   ├── .env                  # DB + Ganache + contract config
│   ├── contracts/
│   │   └── CitizenCredits.sol   # Solidity escrow smart contract
│   └── scripts/
│       └── deploy.js            # Hardhat deployment script
├── src/
│   ├── views/                # All page components
│   │   ├── HomeSplash.tsx        # Landing page with stats + QR
│   │   ├── ProjectsMatrix.tsx    # Project list grid
│   │   ├── ProjectDetails.tsx    # Single project + milestones
│   │   ├── AdminControlRoom.tsx  # Admin escrow controls
│   │   ├── AnalyticsCenter.tsx   # Charts + risk analytics
│   │   ├── BlockchainMonitor.tsx # Ganache accounts + tx logs
│   │   ├── VerificationDesk.tsx  # Field image forensic upload
│   │   └── AuthView.tsx          # Login + Register
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth state wired to Flask /api/auth/*
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx    # App shell
│   │   │   ├── TopBar.tsx    # Header with QR popover + user menu
│   │   │   └── Dock.tsx      # Bottom navigation bar
│   │   └── ui/               # Reusable UI primitives
│   ├── lib/
│   │   ├── blockchain.ts     # API client (all Flask calls)
│   │   └── utils.ts
│   └── types/index.ts        # TypeScript interfaces
├── public/
├── index.html
├── vite.config.ts
├── package.json              # Frontend deps (React, Vite, etc.)
├── tsconfig.json
└── README.md                 # This file
```

---

## Flask API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Sign in |
| POST | /api/auth/register | Register (Faculty / Student only) |
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Project detail + milestones |
| POST | /api/projects | Create project (Admin) |
| PUT | /api/projects/:id | Update project (Admin) |
| DELETE | /api/projects/:id | Delete project (Admin) |
| GET | /api/transactions | All transactions |
| POST | /api/escrow/allocate | Allocate credits (Admin) |
| POST | /api/escrow/freeze | Freeze escrow (Admin) |
| POST | /api/escrow/release | Release escrow (Admin) |
| POST | /api/risk-prediction/predict | Run RandomForest risk prediction |
| GET | /api/risk-prediction/history | Prediction audit log |
| POST | /api/verification/analyze | MobileNetV2 forensic check |
| GET | /api/verification/results | Verification history |
| GET | /api/blockchain/accounts | Ganache ETH + CitizenCredits balances |
| GET | /api/blockchain/logs | Contract call log |
| GET | /api/ml/evaluation | ML evaluation report (ASCII tables) |

---

## ML Evaluation Metrics

Hit this endpoint after the backend starts:

```
GET http://127.0.0.1:5000/api/ml/evaluation
```

Returns ASCII tables for:
- **MobileNetV2** (image verification): per-class Recall and F1-score
- **RandomForest** (risk scoring): feature importance rankings

---

## Environment Variables

`backend/.env`:

```
DB_USER=escrow_user
DB_PASS=1k2a3p
DB_HOST=127.0.0.1
DB_NAME=escrow
GANACHE_URL=http://127.0.0.1:7545
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000
SECRET_KEY=your-flask-secret-key
```

`.env` (frontend root):

```
VITE_API_URL=http://127.0.0.1:5000/api
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `npm install` fails | Make sure Node.js 18+ is installed. Run `node -v` to check |
| `npm run deploy` fails | Make sure Ganache is running on port 7545 first |
| `pip install` fails on TensorFlow | Use Python 3.10–3.11 (not 3.12). TF CPU build is used |
| MySQL connection refused | Start MySQL service: `net start mysql80` (Windows) |
| Ganache not found | Run `npm install -g ganache` then restart VS Code terminal |
| Port 5000 already in use | Run `npx kill-port 5000` |
| Port 5173 already in use | Run `npx kill-port 5173` |
| Frontend shows mock data | Make sure Flask is running at port 5000 before starting frontend |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Python 3.10+, Flask 3, Flask-SQLAlchemy, Flask-CORS |
| Database | MySQL 8 via PyMySQL |
| Blockchain | Ganache (local), Web3.py, Solidity, Hardhat |
| ML | scikit-learn RandomForest, TensorFlow MobileNetV2 (CPU) |

## Contributors
- @Faiza-Khalid — project collaborator
