# Staff Attendance Backend - Setup Instructions

## Prerequisites

- **Node.js** (v18+)
- **MySQL** (v8.0+) - running locally or remotely
- **npm** or **yarn**

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Create `.env` File

Copy `.env.example` to `.env` and update with your MySQL credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="mysql://root:your_password@localhost:3306/staff_attendance"
JWT_SECRET="your-secret-key-here"
PORT=3000
NODE_ENV=development
```

## Step 3: Create Database

Create a MySQL database:

```sql
CREATE DATABASE staff_attendance;
```

## Step 4: Run Prisma Migrations

This will create all tables in your database:

```bash
npm run prisma:migrate
```

You'll be prompted to name your migration (e.g., `init`).

## Step 5: Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

Test the API:
```bash
curl http://localhost:3000/api/health
```

## Database Schema Overview

The schema includes the following models:

- **User** - Staff/Admin users
- **Hospital** - Hospital information
- **Shift** - Shift definitions (Morning, Night, Off)
- **Roster** - Roster periods (Weekly, Monthly)
- **ShiftAssignment** - Staff assigned to shifts
- **AttendanceRecord** - Clock in/out records

## Using Prisma Studio

To visually browse and manage your database:

```bash
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` where you can view/edit data.

## API Testing

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "fullName": "Admin User",
    "password": "password123",
    "hospitalId": "hospital-id",
    "role": "ADMIN"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "password123"
  }'
```

Response includes a JWT token. Use it in subsequent requests:
```bash
curl http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Common Commands

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

**Connection refused error?**
- Ensure MySQL is running
- Check DATABASE_URL in `.env`

**Port already in use?**
- Change PORT in `.env`
- Or kill the process: `lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9`

**Prisma migration failed?**
- Delete `prisma/migrations` folder and run `npm run prisma:migrate` again
- Or reset the database: `npx prisma migrate reset --force`
