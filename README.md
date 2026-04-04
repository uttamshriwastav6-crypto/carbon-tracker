# Carbon Emission Tracker

A full-stack web application designed to track and monitor carbon emissions.

## Project Structure

This project is organized into two main folders:

### 1. Frontend (`/frontend`)
- A React application initialized with Vite.
- Built for fast, modern web-development.
- Navigate to the `/frontend` directory to install dependencies and run the development server.

### 2. Backend (`/backend`)
- A Node.js and Express REST API.
- Manages carbon emission data (CRUD operations).
- Contains backend dependencies and scripts defined in `package.json`.

## Setup Instructions

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000` (or `PORT` defined in `.env`).

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The UI will be accessible typically at `http://localhost:5173`.

## Technologies

- **Frontend**: React, Vite
- **Backend**: Node.js, Express, Cors
