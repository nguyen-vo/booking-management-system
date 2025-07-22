# Ticket Booking API

A NestJS-based REST API for ticket booking system.

## 🚀 Quick Start


## Features

- 🎫 Event search with filters (name, date, location, type, status)
- 📍 Location-based event filtering
- 🎭 Support for multiple event types (Concert, Sport, Theater)
- 👥 Performer management
- 🎟️ Ticket management
- 📱 RESTful API design
- 🗄️ PostgreSQL database with TypeORM
- ✅ Data validation and transformation
- 🔍 Pagination support

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Validation**: class-validator, class-transformer
- **Language**: TypeScript

## Database Schema

The application uses the following entities:
- **Events**: Core event information with date, location, and type
- **Locations**: Venue details with capacity information
- **Performers**: Artists, teams, or acts performing at events
- **Users**: User account information
- **Bookings**: User booking records
- **Tickets**: Individual tickets with seat and pricing information

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm

## Installation & Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd ticket-booking-api
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set up Environment Variables
Create a `.env` file in the root directory:
```bash
touch .env
```

Add the following configuration to your `.env` file:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=ticket_booking

# Application Configuration
NODE_ENV=development
PORT=3000
```

**Important**: Replace `your_password` with your actual PostgreSQL password.

### Step 4: Database Setup

#### Option A: Manual PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed):
   - **macOS**: `brew install postgresql` or download from [postgresql.org](https://www.postgresql.org/download/)
   - **Ubuntu**: `sudo apt-get install postgresql postgresql-contrib`
   - **Windows**: Download installer from [postgresql.org](https://www.postgresql.org/download/)

2. **Start PostgreSQL service**:
   - **macOS**: `brew services start postgresql`
   - **Ubuntu**: `sudo systemctl start postgresql`
   - **Windows**: PostgreSQL should start automatically after installation

3. **Create database user** (if needed):
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create user (replace 'your_password' with your desired password)
   CREATE USER postgres WITH PASSWORD 'your_password';
   ALTER USER postgres CREATEDB;

   # Exit PostgreSQL
   \q
   ```

4. **Create the database**:
   ```bash
   # Create database
   createdb ticket_booking -U postgres

   # Or using psql
   psql -U postgres -c "CREATE DATABASE ticket_booking;"
   ```

#### Option B: Docker Setup

1. **Start PostgreSQL with Docker**:
   ```bash
   docker run --name ticket-booking-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     -e POSTGRES_DB=ticket_booking \
     -p 5432:5432 \
     -d postgres:15-alpine
   ```

2. **Update your `.env` file** with Docker database settings:
   ```env
   DB_PASSWORD=password
   ```

#### Option C: Docker Compose (Recommended for Development)

1. **Start with automatic seeding** (recommended):
   ```bash
   docker-compose up -d
   ```
   This will automatically:
   - Start PostgreSQL database
   - Wait for database to be ready
   - Check if database is already seeded
   - Seed with sample data if empty
   - Start the application

2. **Start without automatic seeding**:
   ```bash
   docker-compose -f docker-compose.no-seed.yml up -d
   ```

3. **Using npm scripts** (convenient shortcuts):
   ```bash
   # Start with automatic seeding
   npm run docker:up

   # Start without seeding
   npm run docker:up-no-seed

   # View logs
   npm run docker:logs

   # Stop services
   npm run docker:down
   ```

### Step 5: Verify Database Connection

Test if you can connect to the database:
```bash
# Test connection
psql -h localhost -U postgres -d ticket_booking -c "SELECT version();"
```

You should see PostgreSQL version information if the connection is successful.

### Step 6: Start the Application

Choose one of the following methods:

#### Method A: Docker Compose (Recommended - Includes Auto-Seeding)

1. **Start with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

   This will automatically:
   - Build the application
   - Start PostgreSQL database
   - Wait for database to be ready
   - Seed database with sample data (if empty)
   - Start the application in development mode

2. **View application logs**:
   ```bash
   docker-compose logs -f app
   ```

#### Method B: Manual Setup (Without Docker)

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start in development mode** (with hot reload):
   ```bash
   npm run start:dev
   ```

   The server will start on `http://localhost:3000/api`

**Note**: If you used Docker Compose, the database is already seeded automatically. Skip this step.

For manual setup, run the seeding script:
```bash
npm run seed
```

### Step 8: Test the API

1. **Test basic connectivity**:
   ```bash
   curl http://localhost:3000/api/events/search
   ```

2. **Test search functionality**:
   ```bash
   # Search for all events
   curl "http://localhost:3000/api/events/search?limit=5"

   # Search for concerts
   curl "http://localhost:3000/api/events/search?type=Concert"

   # Search by event name
   curl "http://localhost:3000/api/events/search?name=taylor"

   # Search by location
   curl "http://localhost:3000/api/events/search?location=madison"
   ```

3. **Open in browser**: Navigate to `http://localhost:3000/api/events/search` to see the JSON response.

#### Troubleshooting

#### Database Connection Issues
- **Check PostgreSQL is running**: `pg_isready -h localhost -p 5432`
- **Verify credentials**: Make sure `.env` file has correct database credentials
- **Check database exists**: `psql -U postgres -l | grep ticket_booking`

#### Port Already in Use
- **Change port in `.env`**: Set `PORT=3001` or another available port
- **Kill existing process**: `lsof -ti:3000 | xargs kill -9`

#### Permission Denied
- **Check PostgreSQL permissions**: 
  ```bash
  psql -U postgres -c "ALTER USER postgres CREATEDB;"
  ```

#### TypeScript Compilation Errors
- **Clean build**: `rm -rf dist && npm run build`
- **Check Node.js version**: Ensure you're using Node.js 18 or higher

## Running the Application

### With Docker Compose (Recommended)

```bash
# Start app and database only (no seeding)
docker-compose up -d app postgres
# or
npm run docker:up

# Start with seeding (app + database + seeder)
docker-compose up -d app postgres seeder
# or
npm run docker:up-with-seed

# Run seeding separately (after app is running)
docker-compose up seeder
# or
npm run docker:seed

# Force seeding (run even if already seeded)
npm run docker:seed-force

# View application logs
docker-compose logs -f app
# or
npm run docker:logs

# View seeding logs
docker-compose logs seeder
# or
npm run docker:logs-seed

# Stop services
docker-compose down
# or
npm run docker:down

# Clean up (remove volumes and containers)
npm run docker:clean
```

### Manual Setup

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Regular development mode
npm run start
```

The API will be available at `http://localhost:3000/api`

### Docker Compose Independent Seeding

The new approach uses separate services for better control:

1. **Database Service (`postgres`)**: PostgreSQL database with health checks
2. **Application Service (`app`)**: NestJS API server
3. **Seeder Service (`seeder`)**: Independent seeding container that runs once

This means:
- ✅ **Full control**: Choose when to seed the database
- ✅ **No automatic seeding**: App starts cleanly without seeding overhead
- ✅ **Run once**: Seeder container exits after completion
- ✅ **Independent**: Seed, re-seed, or skip seeding as needed
- ✅ **Clean separation**: App and seeding logic are separate

**Seeding Options:**
```bash
# Option 1: Start everything including seeding
npm run docker:up-with-seed

# Option 2: Start app first, seed later
npm run docker:up
npm run docker:seed

# Option 3: Force re-seeding
npm run docker:seed-force
```

## API Endpoints

### Events

#### Search Events
```http
GET /api/events/search?name=concert&date=2024-06-15&location=madison&type=Concert&status=Upcoming&page=1&limit=10
```

**Query Parameters:**
- `name` (optional): Filter by event name
- `date` (optional): Filter by event date (YYYY-MM-DD)
- `location` (optional): Filter by location name or address
- `type` (optional): Filter by event type (Concert, Sport, Theater)
- `status` (optional): Filter by status (Upcoming, Sold Out, Canceled, Ended)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of results per page (default: 10)

**Response:**
```json
{
  "events": [
    {
      "eventId": "uuid",
      "name": "Taylor Swift - Eras Tour",
      "date": "2024-06-15T19:30:00.000Z",
      "description": "Experience the magic of Taylor Swift's Eras Tour",
      "type": "Concert",
      "status": "Upcoming",
      "location": {
        "locationId": "uuid",
        "name": "Madison Square Garden",
        "address": "4 Pennsylvania Plaza, New York, NY 10001",
        "seatCapacity": 20000
      },
      "performers": [
        {
          "performerId": "uuid",
          "name": "Taylor Swift",
          "description": "Grammy-winning pop and country music artist"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Get Upcoming Events
```http
GET /api/events/upcoming?limit=10
```

## Example Usage

### Search for concerts in New York
```bash
curl "http://localhost:3000/api/events/search?type=Concert&location=New%20York"
```

### Get events on a specific date
```bash
curl "http://localhost:3000/api/events/search?date=2024-06-15"
```

### Search for events by name
```bash
curl "http://localhost:3000/api/events/search?name=taylor%20swift"
```

## Database Seeding

The application includes a seeding script that creates sample data:

```bash
npm run seed
```

This creates:
- 4 sample locations (Madison Square Garden, Hollywood Bowl, etc.)
- 6 sample performers (Taylor Swift, Ed Sheeran, sports teams, etc.)
- 6 sample events with different types
- 3 sample users
- Sample tickets for each event

## Project Structure

```
src/
├── entities/           # TypeORM entities
│   ├── event.entity.ts
│   ├── location.entity.ts
│   ├── performer.entity.ts
│   ├── user.entity.ts
│   ├── booking.entity.ts
│   ├── ticket.entity.ts
│   └── index.ts
├── events/            # Events module
│   ├── dto/           # Data Transfer Objects
│   │   ├── search-events.dto.ts
│   │   └── event-response.dto.ts
│   ├── events.controller.ts
│   ├── events.service.ts
│   └── events.module.ts
├── database/          # Database utilities
│   └── seed.ts        # Database seeding script
├── app.module.ts      # Main application module
└── main.ts           # Application entry point
```

## License

This project is [MIT licensed](LICENSE).
