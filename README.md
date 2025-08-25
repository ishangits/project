# AI Chatbot Admin Panel
A production-ready full‑stack web application for managing AI chatbots, **domains (formerly “clients”)**, knowledge bases, and token usage analytics — now backed by **MySQL + Sequelize**.

---

## 🚀 Tech Stack

### Frontend

* **React** (Vite)
* **TypeScript**
* **Tailwind CSS**
* **React Router DOM**
* **Axios**
* **Chart.js**
* **Lucide React**
* **date-fns**

### Backend

* **Node.js** + **Express.js**
* **MySQL** (InnoDB)
* **Sequelize** ORM (migrations & seeders)
* **JWT** for authentication
* **bcryptjs** for password hashing
* **Multer** for file uploads
* **csv-parse** (CSV) & **xlsx** (Excel)
* **jsPDF** for PDF generation

> **What changed?** We replaced MongoDB/Mongoose with **MySQL/Sequelize** and renamed the **Clients** module to **Domains**. Crawling is **removed**.

---

## 📋 Features

### 🔐 Admin Authentication

* Secure JWT-based auth
* Protected routes (admin-only)
* Login/logout & token verification

### 📊 Dashboard

* Overview cards for domains and usage
* Token usage analytics with interactive charts
* Recent activity

### 🌐 Domain Management (formerly Clients)

* Add, edit, delete **domains**
* Auto-generate API endpoint & auth token
* Status management (active/inactive/suspended)
* Search, filter, and pagination
* **NEW:** Domain form now captures **external database connection info**:

  * Hostname
  * Port
  * Username
  * Password (securely encrypted at rest)
  * Database name
  * Table name

### 📚 Knowledge Base Management (No Crawling)

* Upload FAQ content via **CSV/Excel**
* Create **manual** entries
* Track updates (timestamps, author)
* Search & filtering

### 📈 Token Usage Analytics

* Track token consumption per domain
* Automatic cost calculation (per 1K tokens)
* Charts & trends
* Exportable reports

### 📄 Reports & Billing

* CSV & PDF exports
* Custom date ranges & per-domain reports
* Invoice generation (placeholder)

---

## 🛠️ Installation & Setup

### Prerequisites

* Node.js (v18+ recommended)
* **MySQL 8+** (or compatible)
* npm or yarn

### 1) Clone the Repository

```bash
git clone <repository-url>
cd ai-chatbot-admin-panel
```

### 2) Install Dependencies

```bash
# Frontend
npm install

# Backend
cd backend
npm install
```
### 3) Initialize Database (MySQL)

Create the database and run migrations/seeders with Sequelize CLI:

```bash
cd backend
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

The seeders create:

* Admin user (`admin@chatbot.com` / `admin123`)
* Sample **domains** (renamed from clients)
* Sample knowledge base entries
* Token usage logs

> Passwords in domain DB configs are encrypted at rest using AES‑256‑CBC with `DB_ENCRYPTION_KEY`.

### 4) Start the App

```bash
# Backend
cd backend
npm start    # http://localhost:5000

# Frontend (in project root)
npm run dev  # http://localhost:5173
```

### Admin Login

* Visit `http://localhost:5173`
* Credentials: `admin@chatbot.com` / `admin123`

### Main Sections

1. **Dashboard** – overview & charts
2. **Domains** – manage domain records & DB connection info
3. **Knowledge Base** – manual entries & CSV/Excel upload (no crawling)
4. **Token Usage** – usage & cost analytics
5. **Reports** – CSV/PDF exports & (placeholder) invoices






## 🛡️ Security

* JWT auth & route guards
* `bcryptjs` password hashing
* CORS configured
* Input validation
* File-type/size checks on uploads
* **Encrypted domain DB passwords** (AES‑256‑CBC with IV)

---

## 🎨 UI/UX

* Responsive layout
* Clean, modern interface
* Interactive charts
* Search, filter, pagination
* Proper loading & empty states
* Client-side form validation

---

## 🧪 Testing Data

Seeders provide:

* 2 demo domains
* KB entries
* 50+ token usage logs
* Admin user

---

## 🚀 Production Deployment

### Environment

* Set strong values for `JWT_SECRET` and `DB_ENCRYPTION_KEY`
* `NODE_ENV=production`

### Build Frontend

```bash
npm run build
```

### Run Backend with PM2

```bash
pm2 start backend/server.js --name "chatbot-admin-api"
```

---

## 🤝 Contributing

1. Fork
2. Create a feature branch
3. Commit with tests (if applicable)
4. Submit a PR

---

## 📝 License

MIT

---

## 🆘 Support

* Read documentation & code comments
* Open an issue with steps to reproduce

---

**Demo Credentials**

* Email: `admin@chatbot.com`
* Password: `admin123`

> Access the app at `http://localhost:5173` after starting both servers.
