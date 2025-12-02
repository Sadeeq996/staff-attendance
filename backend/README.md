# Staff Attendance Backend

Node.js + Express + Prisma + MySQL backend for the Staff Attendance Management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your MySQL database in `.env`:
```
DATABASE_URL="mysql://username:password@localhost:3306/staff_attendance"
JWT_SECRET="your-secret-key"
PORT=3000
NODE_ENV=development
```

3. Run Prisma migrations:
```bash
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:studio` - Open Prisma Studio for database inspection

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Hospitals
- `GET /api/hospitals` - Get all hospitals
- `POST /api/hospitals` - Create hospital
- `PUT /api/hospitals/:id` - Update hospital
- `DELETE /api/hospitals/:id` - Delete hospital

### Shifts
- `GET /api/shifts` - Get all shifts
- `POST /api/shifts` - Create shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/clock-in` - Clock in
- `POST /api/attendance/clock-out` - Clock out

### Shift Assignments
- `GET /api/shift-assignments` - Get assignments
- `POST /api/shift-assignments` - Create assignment
- `PUT /api/shift-assignments/:id` - Update assignment
- `DELETE /api/shift-assignments/:id` - Delete assignment
