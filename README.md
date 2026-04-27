# BUKSU HM UTENSILS KITCHEN

## App Title and Description

**BUKSU HM UTENSILS KITCHEN** is a mobile utensil borrowing and inventory management application for tracking kitchen utensils, borrower activity, and return history. The app provides separate user and admin experiences so users can browse and borrow available utensils while admins can manage inventory, view logs, and monitor stock status.

## Features

- User registration, login, Google sign-in, and forgot password flow
- Role-based access for regular users and admins
- User dashboard with available utensils, search, stats, and borrow-again suggestions
- Utensil list and detail screens with quantity selection before borrowing
- Borrow and return tracking with personal user logs
- Admin dashboard for viewing inventory and activity summaries
- Admin utensil management for adding, editing, deleting, and uploading utensil images
- Admin logs for viewing all borrowed and returned utensils
- PDF export for user logs and admin logs
- Toast notifications for success and error feedback

## Tools Used

- React Native
- Expo
- React Navigation
- AsyncStorage
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens
- bcryptjs
- Nodemailer
- PDFKit
- Multer
- Expo File System, Media Library, Sharing, Web Browser, and Image Picker

## Challenges Encountered

- Creating separate navigation flows for users and admins while keeping authentication smooth
- Managing real-time stock changes when utensils are borrowed or returned
- Preventing admins from deleting utensils that still have active borrowed records
- Handling image uploads and displaying utensil images consistently across the app
- Implementing downloadable PDF reports for both personal and admin log views
- Supporting Google sign-in redirects across mobile and web environments
- Keeping backend API errors clear enough for the mobile interface to show useful feedback

## Getting Started

Install dependencies:

```bash
npm install
cd backend
npm install
```

Create environment files for the root app and backend, then configure values such as `API_URL`, `MONGO_URI`, `JWT_SECRET`, and optional Google or SMTP credentials.

Run the backend:

```bash
cd backend
npm run dev
```

Run the Expo app from the project root:

```bash
npm start
```
