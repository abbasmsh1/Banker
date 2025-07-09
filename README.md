# 🏦 Banker App

A modern banking application built with FastAPI (backend) and vanilla JavaScript (frontend) that allows users to manage accounts, transfer money, and handle banking operations.

## Features

### User Features
- **Account Management**: View account details, balance, IBAN, and crypto address
- **Money Transfer**: Send money using IBAN or crypto address
- **Beneficiary Management**: Add and manage beneficiaries
- **Transaction History**: View recent transactions
- **Secure Authentication**: JWT-based login system

### Admin Features
- **User Management**: Create new users and accounts
- **Account Creation**: Auto-generate IBAN and crypto addresses
- **Money Management**: Add money to any account
- **Bank Statistics**: View total money and daily transfers
- **Account Monitoring**: View all accounts and their details

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: Database ORM
- **SQLite**: Database (can be easily switched to PostgreSQL/MySQL)
- **JWT**: Authentication
- **Pydantic**: Data validation
- **Passlib**: Password hashing

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **HTML5/CSS3**: Modern styling with gradients and animations
- **Fetch API**: HTTP requests to backend

## Setup Instructions

### Prerequisites
- Python 3.8+

### Installation

1. **Clone the repository and navigate to the project directory**
   ```bash
   cd Banker
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install fastapi uvicorn sqlalchemy pydantic passlib bcrypt PyJWT python-multipart
   ```

4. **Create admin user**
   ```bash
   python create_admin.py
   ```
   This creates an admin user with:
   - Username: `admin`
   - Password: `adminpassword`

5. **Start the application**
   ```bash
   uvicorn main:app --reload
   ```
   The application will be available at `http://localhost:8000`

## Usage

### Access the Application
1. Open your browser and go to `http://localhost:8000`
2. You'll be automatically redirected to the login page

### Admin Login
1. Login with admin credentials:
   - Username: `admin`
   - Password: `adminpassword`

### Admin Features
- **Create Users**: Create new user accounts with auto-generated IBAN and crypto addresses
- **Add Money**: Fund any account by selecting from the dropdown
- **View Statistics**: Monitor total bank money and daily transfers
- **Account Management**: View all accounts in a table format

### User Features
- **View Account**: See account details, balance, and transaction history
- **Send Money**: Transfer funds using IBAN or crypto address
- **Manage Beneficiaries**: Add and view saved beneficiaries
- **Transaction History**: View recent transactions with timestamps

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration

### User Endpoints
- `GET /accounts` - Get user accounts
- `POST /beneficiaries` - Add beneficiary
- `GET /beneficiaries` - Get user beneficiaries
- `POST /transfer` - Send money
- `GET /transactions` - Get transaction history

### Admin Endpoints
- `POST /admin/create_user_account` - Create user and account
- `GET /admin/all_accounts` - Get all accounts
- `POST /admin/add_money` - Add money to account
- `GET /admin/total_money` - Get total bank money
- `GET /admin/total_transferred_today` - Get daily transfer total

## Project Structure

```
Banker/
├── main.py                 # FastAPI application
├── models.py              # SQLAlchemy models
├── create_admin.py        # Admin user creation script
├── bank.db               # SQLite database
├── static/               # Frontend files
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── user_dashboard.html  # User dashboard
│   ├── admin_dashboard.html # Admin dashboard
│   ├── style.css         # Shared styles
│   └── js/               # JavaScript files
│       ├── common.js     # Shared utilities
│       ├── auth.js       # Authentication logic
│       ├── user.js       # User dashboard logic
│       └── admin.js      # Admin dashboard logic
└── README.md
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt password hashing
- **Input Validation**: Pydantic models for data validation
- **CORS Support**: Cross-origin resource sharing
- **Admin Authorization**: Role-based access control

## Customization

### Changing Admin Credentials
Edit `create_admin.py` and modify the username and password variables.

### Database Configuration
Change `DATABASE_URL` in `main.py` to use different databases:
- PostgreSQL: `postgresql://user:password@localhost/dbname`
- MySQL: `mysql://user:password@localhost/dbname`

### Styling
Modify `static/style.css` to customize the application appearance.

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the port in the uvicorn command: `uvicorn main:app --reload --port 8001`

2. **Database errors**
   - Delete `bank.db` and restart the application to recreate the database

3. **CORS errors**
   - The application includes CORS middleware, but ensure your browser allows local requests

4. **Authentication issues**
   - Clear browser localStorage and re-login
   - Check that the JWT token is valid

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License. 