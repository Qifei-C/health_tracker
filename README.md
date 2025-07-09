# Health Tracker

A comprehensive web application for tracking blood glucose, ketones, food intake, and body metrics with automatic calculations and visualizations.

## Features

- **User Authentication**: Register and login with secure password hashing
- **Glucose & Ketone Tracking**: Log blood glucose and ketone levels with automatic GKI (Glucose Ketone Index) calculation
- **Food Management**: Add food items manually or import from CSV files
- **Meal Logging**: Track meals by type (breakfast, lunch, dinner, snacks) with multiple food items
- **Body Metrics**: Log weight, fat weight, muscle weight with automatic BMI and fat percentage calculations
- **Visualizations**: Interactive line charts showing trends over time
- **Dashboard**: Overview of recent readings and metrics

## Installation

1. Make sure you have Node.js installed (version 14 or higher)
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install express sqlite3 bcryptjs express-session ejs multer csv-parser dotenv
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

## Usage

### Getting Started
1. Register a new account or login with existing credentials
2. Add your age and height during registration for BMI calculations
3. Start logging your health data!

### Blood Glucose & Ketones
- Navigate to "Glucose & Ketones" to log readings
- Enter glucose level (mg/dL) and ketone level (mmol/L)
- GKI is calculated automatically using the formula: (glucose ÷ 18) ÷ ketones
- View GKI status indicators:
  - **< 1**: Therapeutic ketosis
  - **1-3**: Moderate ketosis
  - **3-6**: Light ketosis
  - **> 6**: Not in ketosis

### Food Management
- Add individual food items with name, weight, and calories
- Import food items from CSV files (format: name, weight, calories)
- Sample CSV file included: `sample-foods.csv`

### Meal Logging
- Create meals by selecting food items and quantities
- Track by meal type: breakfast, lunch, dinner, snacks
- View meal history with food details

### Body Metrics
- Log weight, fat weight, and muscle weight
- BMI calculated automatically if height is provided
- Fat percentage calculated from total weight and fat weight
- BMI categories:
  - **< 18.5**: Underweight
  - **18.5-24.9**: Normal weight
  - **25-29.9**: Overweight
  - **≥ 30**: Obese

### Dashboard
- Overview of recent readings and meals
- Interactive charts showing trends over time
- Quick access to add new data

## Database Schema

The application uses SQLite database with the following tables:

- **users**: User accounts with profile information
- **glucose_readings**: Blood glucose and ketone measurements
- **food_items**: Food database with nutritional information
- **meals**: Meal records with type and timestamp
- **meal_items**: Junction table linking meals to food items
- **body_metrics**: Weight and body composition measurements

## CSV Import Format

For food items, use this CSV format:
```csv
name,weight,calories
"Chicken Breast",100,165
"Broccoli",100,34
"Brown Rice",100,123
```

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: EJS templating, HTML, CSS, JavaScript
- **Charts**: Chart.js
- **Authentication**: bcryptjs, express-session
- **File Upload**: Multer
- **CSV Processing**: csv-parser

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- SQL injection prevention with parameterized queries
- CSRF protection through session validation
- File upload restrictions

## Development

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For questions or issues, please create an issue in the repository or contact the development team.