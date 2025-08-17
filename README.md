# AI Chatbot Admin Panel

A complete, production-ready full-stack web application for managing AI chatbots, domains, knowledge bases, and token usage analytics.

## 🚀 Tech Stack

### Frontend
- **React** (with Vite) - Modern React development
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Chart.js** - Interactive charts and analytics
- **Lucide React** - Beautiful icons
- **Date-fns** - Date manipulation utilities

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CSV Parser** - CSV file processing
- **XLSX** - Excel file processing
- **jsPDF** - PDF generation

## 📋 Features

### 🔐 Admin Authentication
- Secure JWT-based authentication
- Protected routes for admin-only access
- Login/logout functionality
- Token verification and refresh

### 📊 Dashboard
- Overview of all domains and statistics
- Token usage analytics with interactive charts
- Recent activity monitoring
- Quick access to key metrics

### 🌐 Domain Management (CRUD)
- Add, edit, and delete client domains
- Automatic API endpoint generation
- Secure auth token creation
- Domain status management
- Bulk operations and search

### 📚 Knowledge Base Management
- Upload FAQ files (CSV, Excel)
- Manual KB entry creation
- Domain crawling capabilities
- KB update tracking
- Content search and filtering

### 📈 Token Usage Analytics
- Real-time token consumption tracking
- Cost calculation and reporting
- Interactive charts and trends
- Domain-wise usage breakdown
- Export capabilities

### 📄 Reports & Billing
- Generate CSV and PDF reports
- Customizable date ranges
- Domain-specific reporting
- Usage analytics export
- Invoice generation (placeholder)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-chatbot-admin-panel
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
cd backend
npm install
```

### 3. Environment Configuration

Create a `.env` file in the `backend` directory:
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/chatbot_admin

# JWT Secret
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Server Port
PORT=5000

# Admin Credentials for Seed
ADMIN_EMAIL=admin@chatbot.com
ADMIN_PASSWORD=admin123

# Token Cost (per 1000 tokens)
TOKEN_COST_PER_1K=0.002
```

### 4. Database Setup

#### Start MongoDB (if running locally)
```bash
mongod
```

#### Seed Initial Data
```bash
cd backend
npm run seed
```

This creates:
- An admin user (admin@chatbot.com / admin123)
- Sample domains
- Sample knowledge base entries
- Token usage logs for testing

### 5. Start the Application

#### Terminal 1: Start Backend Server
```bash
cd backend
npm start
```
Backend runs on `http://localhost:5000`

#### Terminal 2: Start Frontend Development Server
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

## 📱 Usage

### Admin Login
- Navigate to `http://localhost:5173`
- Use credentials: `admin@chatbot.com` / `admin123`

### Main Features
1. **Dashboard** - View overview and analytics
2. **Clients** - Manage domains and their settings
3. **Knowledge Base** - Upload and manage content
4. **Token Usage** - Monitor usage and costs
5. **Reports** - Generate and download reports

## 🏗️ Project Structure

```
ai-chatbot-admin-panel/
├── backend/                    # Backend Express.js application
│   ├── config/                # Database configuration
│   ├── middleware/            # Authentication middleware
│   ├── models/               # MongoDB/Mongoose models
│   ├── routes/               # API routes
│   ├── uploads/              # File upload directory
│   ├── temp/                 # Temporary files for reports
│   ├── server.js             # Express server entry point
│   ├── seed.js              # Database seeding script
│   └── package.json         # Backend dependencies
├── src/                      # Frontend React application
│   ├── components/          # Reusable UI components
│   ├── context/            # React context (Auth)
│   ├── pages/              # Page components
│   ├── services/           # API service layer
│   ├── App.tsx            # Main App component
│   └── main.tsx           # React entry point
├── public/                 # Static assets
├── package.json           # Frontend dependencies
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.ts         # Vite configuration
└── README.md             # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Admin logout

### Domains
- `GET /api/domains` - List all domains
- `POST /api/domains` - Create new domain
- `GET /api/domains/:id` - Get domain details
- `PUT /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain

### Knowledge Base
- `GET /api/kb/:domainId` - Get KB entries
- `POST /api/kb/:domainId/manual` - Add manual entry
- `POST /api/kb/:domainId/upload` - Upload KB file
- `DELETE /api/kb/:domainId/entries/:entryId` - Delete entry

### Token Usage
- `GET /api/tokens` - Get token usage logs
- `GET /api/tokens/stats` - Get usage statistics
- `POST /api/tokens` - Create usage log

### Reports
- `GET /api/reports/csv` - Download CSV report
- `GET /api/reports/pdf` - Download PDF report
- `POST /api/reports/invoice` - Generate invoice

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for secure password storage
- **Route Protection** - Middleware for admin-only routes
- **CORS Configuration** - Proper cross-origin setup
- **Input Validation** - Server-side validation
- **File Upload Security** - Type and size restrictions

## 🎨 UI/UX Features

- **Responsive Design** - Works on all device sizes
- **Modern Interface** - Clean, professional design
- **Interactive Charts** - Real-time data visualization
- **Search & Filtering** - Easy data discovery
- **Pagination** - Efficient data browsing
- **Loading States** - Smooth user experience
- **Form Validation** - Client-side validation

## 🧪 Testing Data

The seed script creates sample data:
- 2 demo domains with different configurations
- Sample knowledge base entries
- 50+ token usage logs with varied data
- Admin user for immediate access

## 🚀 Production Deployment

### Environment Variables
Set production values for:
- `MONGODB_URI` - Production MongoDB connection
- `JWT_SECRET` - Strong production secret
- `NODE_ENV=production`

### Build Frontend
```bash
npm run build
```

### Process Management
Use PM2 or similar for production:
```bash
pm2 start backend/server.js --name "chatbot-admin-api"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the existing documentation
2. Review the code comments
3. Create an issue with detailed description
4. Provide steps to reproduce any bugs

---

**Demo Credentials:**
- Email: `admin@chatbot.com`
- Password: `admin123`

Access the application at `http://localhost:5173` after starting both servers.