# Tackld - Home Service Booking Platform

A full-stack web application for booking home services in Singapore, built with React, Node.js, and MongoDB.

## 🌟 Features

### For Customers
- **Service Selection**: Choose from 5 core services (Aircon, Plumbing, Electrical, Cleaning, Painting)
- **Easy Booking**: Service-specific questions and image uploads
- **Progress Tracking**: Real-time job progress with green bar tracking
- **Secure Payments**: Pay only after job completion via wallet system
- **Review System**: Rate and review completed services

### For Contractors
- **Filtered Job Feed**: View jobs within your trade category
- **Flexible Bidding**: Submit bids with pricing and ETA
- **Job Progress Panel**: Update stages with photo uploads
- **Instant Payouts**: Receive payments upon job completion
- **Profile Building**: Build reputation through ratings and reviews

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tackld
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your MongoDB connection string and other configurations.

4. **Start the development server**
   ```bash
   # Terminal 1: Start the backend server
   npm run server:dev
   
   # Terminal 2: Start the frontend development server
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/api/health

## 📁 Project Structure

```
tackld/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── routes/             # React Router routes
│   ├── lib/                # Utility libraries
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   └── server/             # Server configuration
├── server.js               # Main server file
├── package.json            # Dependencies and scripts
└── .env                    # Environment variables
```

## 🗄️ Database Schema

The application uses MongoDB with the following collections:

- **users**: User accounts and authentication
- **userProfiles**: Extended user information
- **services**: Available services and categories
- **bookings**: Service booking records
- **bids**: Contractor bids on bookings
- **addresses**: User addresses and locations
- **wallets**: User wallet balances and transactions
- **reviews**: User reviews and ratings

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/popular` - Get popular services
- `GET /api/services/search` - Search services

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/:id` - Get booking by ID
- `PATCH /api/bookings/:id/progress` - Update booking progress
- `POST /api/bookings/:id/review` - Add review to booking

### Bids
- `POST /api/bids` - Submit bid
- `GET /api/bids/booking/:id` - Get bids for booking
- `PATCH /api/bids/:id/accept` - Accept bid
- `PATCH /api/bids/:id/reject` - Reject bid

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/addresses` - Get user addresses
- `POST /api/users/addresses` - Add address

### Wallets
- `GET /api/wallets/balance` - Get wallet balance
- `POST /api/wallets/topup` - Top up wallet
- `POST /api/wallets/pay` - Make payment
- `GET /api/wallets/transactions` - Get transaction history

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication. Tokens are stored in localStorage and automatically included in API requests.

## 💰 Payment System

Currently implements a wallet-based payment system:
- Users can top up their wallet
- Payments are processed from wallet balance
- Contractors receive payouts to their wallet
- Future integration with Stripe planned

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Start the server: `npm start`

### Frontend Deployment
1. Update the API URL in the environment variables
2. Build the application: `npm run build`
3. Deploy the `dist` folder to your hosting platform

## 🔧 Development

### Available Scripts
- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend development server with nodemon
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Database Seeding
The application includes sample data creation functions in the Jupyter notebook. You can run these to populate your database with test data.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Real-time notifications
- [ ] Push notifications
- [ ] Advanced search and filtering
- [ ] Admin dashboard
- [ ] Stripe payment integration
- [ ] Mobile app development
- [ ] Multi-language support
- [ ] Advanced analytics
