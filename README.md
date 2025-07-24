# Fast Chat v2 - Modern Real-time Chat Application

A high-performance, modern chat application built with React.js and Node.js, optimized for deployment on Render.

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **Modern React frontend** with Vite build system
- **PostgreSQL database** for better performance
- **Mobile-responsive design** with Tailwind CSS
- **Room-based chat** with user management
- **Optimized for production** deployment
- **Fast and lightweight** architecture

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** with Express
- **Socket.IO** - Real-time bidirectional communication
- **PostgreSQL** - Robust relational database
- **JWT** - Secure authentication
- **Rate limiting** - API protection
- **Compression** - Optimized responses

## 📁 Project Structure

```
fast-chat-v2/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   └── App.jsx         # Main application component
│   ├── package.json
│   └── vite.config.js
├── server/                 # Node.js backend application
│   ├── database/           # Database configuration and queries
│   ├── handlers/           # Socket.IO event handlers
│   ├── middleware/         # Express middleware
│   ├── index.js            # Main server file
│   └── package.json
└── render.yaml             # Render deployment configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fast-chat-v2
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   
   # Create .env file
   echo "DATABASE_URL=postgresql://username:password@localhost:5432/fastchat" > .env
   echo "JWT_SECRET=your-super-secret-jwt-key" >> .env
   echo "PORT=3001" >> .env
   echo "NODE_ENV=development" >> .env
   
   # Start development server
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../client
   npm install
   
   # Create .env file
   echo "VITE_API_URL=http://localhost:3001" > .env
   echo "VITE_SOCKET_URL=http://localhost:3001" >> .env
   
   # Start development server
   npm run dev
   ```

4. **Setup Database**
   ```bash
   # Create PostgreSQL database
   createdb fastchat
   
   # The application will automatically create tables on first run
   ```

## 🌐 Production Deployment on Render

### Automatic Deployment
This project includes a `render.yaml` file for easy deployment:

1. **Fork this repository** to your GitHub account

2. **Connect to Render**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Create a new "Blueprint" and select this repository

3. **Environment Variables**
   The deployment will automatically set up:
   - PostgreSQL database
   - Environment variables
   - Build and start commands

### Manual Deployment

#### Database Setup
1. Create a PostgreSQL database on Render
2. Note the connection string

#### Backend Deployment
1. Create a new Web Service on Render
2. Connect your repository
3. Set these environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your-postgres-connection-string>`
   - `JWT_SECRET=<generate-secure-secret>`
   - `CORS_ORIGIN=<your-frontend-url>`
4. Build Command: `cd server && npm install`
5. Start Command: `cd server && npm start`

#### Frontend Deployment
1. Create a new Static Site on Render
2. Connect your repository
3. Set these environment variables:
   - `VITE_API_URL=<your-backend-url>`
   - `VITE_SOCKET_URL=<your-backend-url>`
4. Build Command: `cd client && npm install && npm run build`
5. Publish Directory: `client/dist`

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

#### Client (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

## 📱 Mobile Optimization

- **Responsive design** with Tailwind CSS
- **Touch-friendly** interface
- **Optimized input handling** to prevent zoom on mobile
- **Mobile-first** approach

## 🔒 Security Features

- **JWT authentication**
- **Rate limiting** on API endpoints
- **CORS configuration**
- **Input validation** and sanitization
- **Secure headers** with Helmet.js

## 🚀 Performance Optimizations

- **PostgreSQL** instead of SQLite for better concurrent performance
- **Compression middleware** for smaller response sizes
- **Vite** for fast frontend builds
- **React optimizations** with proper component structure
- **Database indexing** for faster queries

## 🧪 Available Scripts

### Frontend (client/)
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend (server/)
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run build    # Prepare for production (if needed)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Deploy to see your app](https://your-app.onrender.com)
- **Backend API**: [Your backend URL](https://your-api.onrender.com)

## 📞 Support

If you have any questions or run into issues:

1. Check the [Issues](../../issues) section
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ for modern web development**
