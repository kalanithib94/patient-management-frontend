# Patient Management System - Full Stack

A comprehensive Patient Management System with React frontend and Node.js backend, designed for healthcare providers.

## 🏗️ Architecture

- **Frontend:** React 18 with modern UI components
- **Backend:** Node.js/Express with SQLite database
- **Deployment:** Vercel (Frontend) + Railway (Backend)
- **Database:** SQLite with Salesforce integration

## 🚀 Features

### Frontend
- **Patient Management:** Add, edit, and manage patient records
- **Appointment Scheduling:** Schedule and manage appointments
- **Analytics Dashboard:** View insights and analytics
- **AI Insights:** AI-powered recommendations and insights
- **Settings:** Configure system settings and integrations

### Backend
- **RESTful API:** Complete CRUD operations
- **Database Management:** SQLite with automatic migrations
- **Salesforce Integration:** Referral management
- **Authentication:** Secure user authentication
- **Analytics:** Data processing and insights

## 🛠️ Tech Stack

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- Recharts for data visualization
- React Icons
- React Toastify for notifications

### Backend
- Node.js
- Express.js
- SQLite3
- CORS
- Joi for validation
- Bcryptjs for security
- JSForce for Salesforce

## 📁 Project Structure

```
patient-management-system/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── config/            # API configuration
│   ├── services/          # API services
│   └── hooks/             # Custom React hooks
├── backend/               # Node.js backend
│   ├── routes/            # API routes
│   ├── config/            # Database configuration
│   ├── services/          # Business logic
│   └── database/          # Database files
├── public/                # Static assets
├── package.json           # Dependencies
├── vercel.json           # Vercel configuration
└── railway.toml          # Railway configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm 8+

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kalanithib94/patient-management-frontend.git
   cd patient-management-frontend
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run client` - Start only frontend
- `npm run server` - Start only backend
- `npm run build` - Build frontend for production
- `npm run install:all` - Install all dependencies

## 🚀 Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Deploy!

### Backend (Railway)
1. Connect repository to Railway
2. Set root directory: `backend`
3. Set start command: `npm start`
4. Deploy!

## 🔧 Configuration

### Environment Variables

#### Frontend
- `REACT_APP_API_URL` - Backend API URL

#### Backend
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - Database connection string
- `SALESFORCE_*` - Salesforce integration credentials

## 📊 API Endpoints

### Patients
- `GET /api/patients` - Get all patients
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/patients` - Get patient analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions, please open an issue in the repository.