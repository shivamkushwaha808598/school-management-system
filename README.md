# School Management System (Full-Stack)

A role-based School Management System built with **React (Vite)**, **Node.js (Express)**, and **MySQL**.

## Features
- **JWT Authentication & Role-Based Access Control** (Admin, Teacher, Student)
- **Admin Dashboard:** Manage teachers, students, classes, fees (Pending/Paid), and school notices.
- **Teacher Dashboard:** View assigned classes, mark daily student attendance (Present/Absent/Late), and read notices.
- **Student Dashboard:** View personal profile, attendance percentage, fee status, and school notices.

## Tech Stack
- **Frontend:** React, React Router, Axios
- **Backend:** Node.js, Express, JWT, Bcryptjs
- **Database:** MySQL (mysql2)

## Setup Instructions
1. Clone the repository and configure ackend/.env (PORT, DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET).
2. Run cd backend && npm install && npm run dev (runs on port 5000).
3. Run cd frontend && npm install && npm run dev (runs on port 5173).
