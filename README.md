# Masjid ERP System

A comprehensive Enterprise Resource Planning (ERP) web application designed specifically for Masjid financial management. This system provides role-based access control, receipt tracking, expense management, and public financial transparency features.

## 🏗️ Features

### Core Functionality
- **Role-Based Access Control**: Three user roles (Admin, Manager, Cash Collector) with appropriate permissions
- **Task Management**: Categorize income streams (Construction, Charity, Educational, etc.)
- **Receipt Book System**: Controlled receipt numbering with assignment to collectors
- **Receipt Entry**: Digital receipt creation with automatic numbering
- **Expense Tracking**: Dynamic expense types with detailed categorization
- **Financial Reporting**: Automated income, expense, and balance calculations
- **Public Transparency**: Published reports accessible without authentication
- **Data Backup**: SQL and JSON export capabilities

### Technical Stack
- **Frontend**: React 18 with TypeScript, Vite build tool
- **UI Components**: Shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with Islamic-themed design
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based with bcrypt password hashing
- **State Management**: TanStack Query for server state

## 🐳 Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Git (to clone the repository)

### Quick Start with Docker

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd masjid-erp
   ```

2. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Application: http://localhost:5000
   - Database: localhost:5432

### Default Login Credentials

After the first startup, use these credentials to access the system:

| Role | Username | Password | Description |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | Full system access |
| Manager | `manager1` | `manager123` | Financial management |
| Cash Collector | `collector1` | `collector123` | Receipt entry only |
| Cash Collector | `collector2` | `collector456` | Receipt entry only |

**⚠️ Important**: Change these default passwords immediately after first login for security.

### Docker Configuration

The application uses the following Docker setup:

- **Application Container**: Node.js 18 Alpine with the built application
- **Database Container**: PostgreSQL 15 Alpine with persistent data
- **Volumes**: 
  - `postgres_data`: Database persistence
  - `app_data`: Application data storage
- **Networks**: Custom network for container communication

### Environment Variables

The Docker setup includes these environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://masjid_user:masjid_secure_password_2024@postgres:5432/masjid_erp
POSTGRES_DB=masjid_erp
POSTGRES_USER=masjid_user
POSTGRES_PASSWORD=masjid_secure_password_2024

# Application
NODE_ENV=production
```

## 🔧 Development Setup

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

3. **Push database schema**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio

# Docker
npm run docker:build # Build Docker image
npm run docker:run   # Start with Docker Compose
npm run docker:stop  # Stop Docker containers
```

## 🏛️ Architecture

### Role-Based Permissions

#### Admin
- Full system access
- User management
- All manager and cash collector permissions

#### Manager  
- Task creation and management
- Receipt book creation and assignment
- Expense management and reporting
- Report publishing and data backup

#### Cash Collector
- Access to assigned receipt books only
- Receipt entry within assigned number ranges
- View personal collection statistics

### Database Schema

The system uses PostgreSQL with these main entities:

- **Users**: Authentication and role management
- **Tasks**: Income categorization (Construction, Charity, etc.)
- **Receipt Books**: Numbered receipt collections assigned to collectors
- **Receipts**: Individual income entries with donor information
- **Expense Types**: Categorization for expenditures
- **Expenses**: Expenditure tracking with detailed information
- **Published Reports**: Public financial transparency records

### Security Features

- JWT-based authentication with secure token storage
- Bcrypt password hashing with salt rounds
- Role-based route protection
- Input validation using Zod schemas
- SQL injection prevention via parameterized queries

## 🌐 API Endpoints

The application exposes RESTful APIs for:

- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User management (Admin only)
- `/api/tasks/*` - Task management
- `/api/receipt-books/*` - Receipt book operations  
- `/api/receipts/*` - Receipt entry and management
- `/api/expenses/*` - Expense tracking
- `/api/expense-types/*` - Expense categorization
- `/api/reports/*` - Financial reporting
- `/api/backup/*` - Data export functionality

## 🔍 Public Transparency

The system includes a public reports feature accessible at `/public-reports` without authentication, promoting financial transparency within the community.

## 🛠️ Customization

### Currency Configuration
The system is configured for Indian Rupees (₹). To change currency:

1. Update `formatCurrency` functions in dashboard, reports, and public-reports pages
2. Change the `currency` parameter from "INR" to your desired currency code
3. Update form labels to display the appropriate currency symbol

### Theming
The application uses Islamic-themed colors defined in `index.css`:
- Primary colors use green tones
- Custom CSS variables for consistent theming
- Tailwind CSS classes with `islamic-` prefix

## 📊 Monitoring and Maintenance

### Health Checks
The Docker setup includes health checks to monitor application status.

### Data Backup
Administrators and managers can export data in:
- **SQL format**: Complete database dump
- **JSON format**: Structured data export

### Logs
Application logs are available through:
- Docker logs: `docker-compose logs app`
- Database logs: `docker-compose logs postgres`

## 🤝 Contributing

This is an open-source project designed for Islamic community organizations. Contributions are welcome to enhance functionality and usability.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ for the Islamic Community**

For support or questions, please refer to the documentation or open an issue in the repository.