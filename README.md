# StayFinder – PG Accommodation Finder

## Project Overview
StayFinder is a full-stack web application that helps users find Paying Guest (PG) accommodations based on their preferred area and gender selection. Users can view PG details, rent, and available facilities.

## Technologies Used
- **Frontend:** React.js, HTML, CSS, JavaScript
- **Backend:** Python, Flask
- **Database:** MySQL
- **API:** REST API

## Features
- Search PG accommodations by area.
- Filter PGs by Men and Women.
- View PG names, rent, and facilities.
- Display PG accommodation photos.
- Store user details such as name and age in the database.
- Perform CRUD operations (Create, Read, Update, Delete) for managing records.

## Project Structure
```text
StayFinder/
├── frontend/
│   └── React application
└── backend/
    └── app.py
```

## How It Works
1. The user enters a preferred area.
2. The user selects Men or Women.
3. StayFinder displays matching PG accommodations.
4. The application uses Flask APIs to communicate with the MySQL database.
5. Relevant accommodation and user information is stored and retrieved from the database.

## How to Run the Project

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install flask
python app.py
```

Configure your MySQL database credentials in the backend before running the application.

## Project Objective
To build a beginner-friendly accommodation search application that connects a React frontend with a Python Flask backend and a MySQL database.

## Author
