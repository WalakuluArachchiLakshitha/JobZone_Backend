
# 💼 JobZone Backend

> Backend API for **JobZone**, a job marketplace platform that connects job seekers with employers.

The JobZone backend provides RESTful APIs for user authentication, job posting and searching, job applications, company management, resumes, saved jobs, contact messages, administration, file uploads, and chatbot assistance.

---

## 📌 Project Overview


It provides RESTful APIs for:

- User authentication
- User profile management
- Job posting and management
- Job searching and filtering
- Job applications
- Saved jobs
- Company profiles
- Resume and CV management
- File uploads
- Chatbot functionality
- Contact management
- Administrative operations

The backend is built using **Node.js, Express.js, and MongoDB** and communicates with the JobZone frontend through REST APIs.

---

## ✨ Key Features

- JWT-based user authentication
- User and profile management
- Job posting and management
- Job search and filtering
- Location-based job search
- Job applications
- Saved jobs
- Company profiles
- Resume and CV generation
- File uploads
- Job search chatbot
- Email and OTP functionality
- Role-based authorization
- Admin management
- Automated API testing
- API rate limiting
- Password hashing and security controls

---

# 🛠️ Technologies Used

## Backend

- Node.js
- Express.js
- JavaScript

## Database

- MongoDB
- Mongoose

## Authentication

- JSON Web Token (JWT)
- bcryptjs

## Validation

- express-validator

## Security

- CORS
- express-rate-limit
- JWT authentication
- Password hashing

## File Uploads

- Multer

## Email Services

- Nodemailer
- Gmail SMTP

## CV Generation

- docx

## Testing

- Jest
- Supertest
- MongoDB Memory Server

## Development

- Nodemon

---

# 📁 Project Structure

```text
JobZone_Backend/
│
├── controllers/
│   ├── adminController.js
│   ├── applicationController.js
│   ├── authController.js
│   ├── chatbotController.js
│   ├── companyController.js
│   ├── contactController.js
│   ├── jobController.js
│   ├── resumeController.js
│   ├── savedJobController.js
│   └── userController.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── rateLimit.js
│   └── uploadMiddleware.js
│
├── models/
│   ├── Application.js
│   ├── Company.js
│   ├── Contact.js
│   ├── Job.js
│   ├── Resume.js
│   ├── SavedJob.js
│   └── User.js
│
├── routes/
│   ├── adminRoutes.js
│   ├── applicationRoutes.js
│   ├── authRoutes.js
│   ├── chatbotRoutes.js
│   ├── companyRoutes.js
│   ├── contactRoutes.js
│   ├── jobRoutes.js
│   ├── resumeRoutes.js
│   ├── savedJobRoutes.js
│   └── userRoutes.js
│
├── tests/
│   ├── applications.test.js
│   ├── auth.test.js
│   ├── companies.test.js
│   ├── contact.test.js
│   ├── jobs.test.js
│   ├── resume.test.js
│   ├── savedJobs.test.js
│   ├── users.test.js
│   ├── globalSetup.js
│   ├── globalTeardown.js
│   └── setup.js
│
├── uploads/
│   ├── avatars/
│   ├── documents/
│   ├── resumes/
│   ├── attachments/
│   └── general/
│
├── utils/
│   ├── constants.js
│   ├── emailService.js
│   └── helpers.js
│
├── .env.example
├── .gitignore
├── index.js
├── jest.config.js
├── package.json
├── package-lock.json
├── render.yaml
└── README.md
````

---

# ⚙️ Requirements

Before running the project, install:

* Node.js 18 or later
* npm
* MongoDB or MongoDB Atlas
* Git

Check Node.js:

```bash
node --version
```

Check npm:

```bash
npm --version
```

---

# 📥 Installation

## 1. Clone the Repository

```bash
git clone <repository-url>
```

Navigate to the backend directory:

```bash
cd JobZone_Backend
```

---

## 2. Install Dependencies

```bash
npm install
```

This installs all dependencies listed in `package.json`.

---

# 🔐 Environment Variables

The backend requires environment variables for database connections, authentication, email services, and other configuration.

Create a `.env` file in the root directory.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secure_jwt_secret

EMAIL_USER=your_email@gmail.com

EMAIL_PASS=your_gmail_app_password

GOOGLE_CLIENT_ID=your_google_client_id

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Environment Variable Description

| Variable           | Description                            |
| ------------------ | -------------------------------------- |
| `PORT`             | Port used by the backend server        |
| `MONGO_URI`        | MongoDB connection string              |
| `JWT_SECRET`       | Secret key used for JWT authentication |
| `EMAIL_USER`       | Email account used for sending emails  |
| `EMAIL_PASS`       | Gmail App Password                     |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID                 |
| `CORS_ORIGINS`     | Allowed frontend origins               |

---

## `.env.example`

A `.env.example` file should be included in the repository as a template.

It should contain placeholder values only:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
GOOGLE_CLIENT_ID=your_google_client_id
CORS_ORIGINS=http://localhost:5173
```

### ⚠️ Important

Never commit the real `.env` file to GitHub.

Do not expose:

* Database credentials
* JWT secrets
* Email passwords
* OAuth credentials
* API keys

---

# ▶️ Running the Application

## Development Mode

Run:

```bash
npm run dev
```

The backend should start on:

```text
http://localhost:5000
```

---

## Production Mode

Run:

```bash
npm start
```

---

# ❤️ API Health Check

After starting the server, visit:

```text
GET /
```

The endpoint confirms that the backend API is running.

Example response:

```json
{
  "message": "JobZone API is running",
  "version": "1.0.0"
}
```

---

# 🔗 API Documentation

The backend is organized into several REST API route groups.

```text
/api/auth
/api/users
/api/jobs
/api/applications
/api/companies
/api/contact
/api/saved-jobs
/api/resume
/api/admin
/api/chatbot
```

---

# 🔐 Authentication API

Base URL:

```text
/api/auth
```

| Method | Endpoint                    | Description            |
| ------ | --------------------------- | ---------------------- |
| POST   | `/api/auth/register`        | Register a new user    |
| POST   | `/api/auth/login`           | Login                  |
| POST   | `/api/auth/forgot-password` | Request password reset |
| POST   | `/api/auth/verify-otp`      | Verify OTP             |
| POST   | `/api/auth/reset-password`  | Reset password         |
| POST   | `/api/auth/google`          | Google authentication  |

---

# 👤 User API

Base URL:

```text
/api/users
```

| Method | Endpoint                     | Description                           |
| ------ | ---------------------------- | ------------------------------------- |
| GET    | `/api/users/profile`         | Get current user profile              |
| PUT    | `/api/users/profile`         | Update profile                        |
| PUT    | `/api/users/change-password` | Change password                       |
| POST   | `/api/users/upload-avatar`   | Upload profile picture                |
| POST   | `/api/users/upload-resume`   | Upload resume                         |
| POST   | `/api/users/upload-br`       | Upload business registration document |
| GET    | `/api/users/seekers`         | Get seekers                           |
| GET    | `/api/users/seekers/:id`     | Get seeker by ID                      |

Protected endpoints require a valid JWT token.

---

# 💼 Job API

Base URL:

```text
/api/jobs
```

| Method | Endpoint                     | Description         |
| ------ | ---------------------------- | ------------------- |
| GET    | `/api/jobs`                  | Get available jobs  |
| GET    | `/api/jobs/:id`              | Get job details     |
| GET    | `/api/jobs/employer/my-jobs` | Get employer's jobs |
| POST   | `/api/jobs`                  | Create a job        |
| PUT    | `/api/jobs/:id`              | Update a job        |
| DELETE | `/api/jobs/:id`              | Delete a job        |

---

## 🔎 Job Search

Search by keyword:

```http
GET /api/jobs?search=software
```

Search by location:

```http
GET /api/jobs?location=Colombo
```

Filter by job type:

```http
GET /api/jobs?type=full-time
```

Filter by salary:

```http
GET /api/jobs?salary=100000
```

Filter by skills:

```http
GET /api/jobs?skills=javascript,react
```

Filter by category:

```http
GET /api/jobs?category=Technology
```

Filter by experience:

```http
GET /api/jobs?experience=Entry-level
```

---

## 🔎 Natural Language Job Search

The backend supports natural-language job search queries.

Example:

```text
Find part-time software jobs in Colombo
```

The system can identify relevant information such as:

```text
Job Type: Part-time
Location: Colombo
Keyword: software
```

and use the extracted information to search the job database.

---

## 📄 Pagination

Example:

```http
GET /api/jobs?page=1&limit=10
```

---

## ↕️ Sorting

Example:

```http
GET /api/jobs?sort=salary
```

Descending sorting:

```http
GET /api/jobs?sort=-salary
```

---

# 📝 Application API

Base URL:

```text
/api/applications
```

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/api/applications`     | Apply for a job           |
| GET    | `/api/applications`     | Get applications          |
| PATCH  | `/api/applications/:id` | Update application status |

Example application request:

```json
{
  "jobId": "JOB_ID",
  "coverLetter": "I am interested in this position and believe my skills match the requirements."
}
```

Application statuses include:

```text
pending
reviewed
shortlisted
rejected
accepted
```

The backend also prevents duplicate applications where applicable.

---

# ❤️ Saved Jobs API

Base URL:

```text
/api/saved-jobs
```

| Method | Endpoint                 | Description        |
| ------ | ------------------------ | ------------------ |
| POST   | `/api/saved-jobs`        | Save a job         |
| GET    | `/api/saved-jobs`        | Get saved jobs     |
| DELETE | `/api/saved-jobs/:jobId` | Remove a saved job |

These endpoints require authentication.

---

# 🏢 Company API

Base URL:

```text
/api/companies
```

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| GET    | `/api/companies`     | Get companies       |
| GET    | `/api/companies/:id` | Get company details |
| POST   | `/api/companies`     | Create company      |
| PUT    | `/api/companies/:id` | Update company      |

Company profiles can contain information such as:

* Company name
* Logo
* Industry
* Location
* Company size
* Founded year
* Description
* Website
* Benefits
* Company culture
* Rating
* Reviews
* Open positions

---

# 📄 Resume API

Base URL:

```text
/api/resume
```

| Method | Endpoint                  | Description   |
| ------ | ------------------------- | ------------- |
| GET    | `/api/resume`             | Get resume    |
| PUT    | `/api/resume`             | Update resume |
| GET    | `/api/resume/generate-cv` | Generate CV   |

Resume information can include:

* Skills
* Education
* Work experience
* Portfolio projects
* Languages
* References

The project uses the `docx` package for CV generation.

---

# 📤 File Uploads

File uploads are handled using **Multer**.

Supported upload types include:

* Profile avatars
* Resumes
* Company documents
* Attachments

Directory structure:

```text
uploads/
├── avatars/
├── resumes/
├── documents/
├── attachments/
└── general/
```

Supported formats include:

```text
JPG
JPEG
PNG
WebP
PDF
DOC
DOCX
```

Maximum upload size:

```text
5 MB
```

---

# 🤖 Chatbot API

Base URL:

```text
/api/chatbot
```

## Send a Message

```http
POST /api/chatbot/message
```

Example:

```json
{
  "message": "Show software jobs in Colombo"
}
```

The chatbot can assist with topics such as:

* Finding jobs
* Job searching
* Job matching
* Applying for jobs
* Resume creation
* User profiles
* Company information
* JobZone support information

---

# 📧 Contact API

Base URL:

```text
/api/contact
```

| Method | Endpoint       | Description              |
| ------ | -------------- | ------------------------ |
| POST   | `/api/contact` | Submit a contact message |
| GET    | `/api/contact` | View contact messages    |

Contact messages may contain:

* Name
* Email
* Phone
* Subject
* Message

Administrative access is required to view submitted messages.

---

# 🛡️ Admin API

Base URL:

```text
/api/admin
```

Admin endpoints require authentication and administrator authorization.

| Method | Endpoint                             | Description                       |
| ------ | ------------------------------------ | --------------------------------- |
| GET    | `/api/admin/stats`                   | Get dashboard statistics          |
| GET    | `/api/admin/users`                   | Get users                         |
| DELETE | `/api/admin/users/:id`               | Delete user                       |
| GET    | `/api/admin/pending-verifications`   | Get pending company verifications |
| PATCH  | `/api/admin/verify-company/:id`      | Verify company                    |
| PATCH  | `/api/admin/reject-verification/:id` | Reject company verification       |
| GET    | `/api/admin/jobs`                    | Get all jobs                      |
| DELETE | `/api/admin/jobs/:id`                | Delete job                        |
| GET    | `/api/admin/contacts`                | Get contact messages              |

---

# 🔑 Authentication

Protected API requests use JWT authentication.

The client should send the JWT using the `Authorization` header:

```http
Authorization: Bearer <your_token>
```

Example:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

The authentication middleware verifies the token before allowing access to protected resources.

---

# 🔄 Authentication Flow

```text
User
  |
  | Register
  v
Password Hashing
  |
  v
MongoDB
  |
  | Login
  v
Credentials Verification
  |
  v
JWT Token
  |
  v
Client
  |
  | Authorization: Bearer <token>
  v
Authentication Middleware
  |
  v
Protected Controller
  |
  v
Response
```

---

# 🏗️ Backend Architecture

A typical request follows this structure:

```text
Client / Frontend
       |
       v
     Route
       |
       v
   Middleware
       |
       v
   Controller
       |
       v
     Model
       |
       v
    MongoDB
       |
       v
    Response
       |
       v
Client / Frontend
```

### Routes

Define the available API endpoints.

### Middleware

Handles common functionality such as:

* Authentication
* Authorization
* Rate limiting
* File uploads

### Controllers

Contain application and business logic.

### Models

Define MongoDB schemas and database operations.

### Utils

Contain reusable helper functions and services.

### Tests

Contain automated tests for backend functionality.

---

# 🗄️ Database Models

The backend uses MongoDB with Mongoose.

Main models include:

```text
User
Job
Application
Company
Resume
SavedJob
Contact
```

### User

Stores:

* Authentication information
* User role
* Name
* Email
* Profile information
* Skills
* Education
* Experience
* Location
* Social links
* Resume information
* Company information
* Verification status

### Job

Stores:

* Job title
* Description
* Company
* Location
* Job type
* Salary
* Skills
* Category
* Industry
* Experience
* Deadline
* Number of positions
* Remote availability
* Urgent status
* Featured status
* Employer
* Job views
* Job status

### Application

Stores:

* Job
* Seeker
* Cover letter
* Application status
* Timestamps

### Company

Stores:

* Company information
* Industry
* Location
* Description
* Website
* Company size
* Founded year
* Rating
* Benefits
* Culture
* Owner information
* Verification information

### Resume

Stores:

* Skills
* Education
* Experience
* Portfolio
* Languages
* References

### SavedJob

Maintains the relationship between users and saved jobs.

### Contact

Stores messages submitted through the JobZone contact system.

---

# 🛡️ Security

Security is an important part of the JobZone backend.

## Password Hashing

Passwords are hashed using:

```text
bcryptjs
```

Plain-text passwords are not stored in the database.

---

## JWT Authentication

JWT is used to authenticate users and protect private API routes.

---

## Role-Based Authorization

The system supports different user roles.

```text
Seeker
  └── Search and apply for jobs

Employer
  ├── Create jobs
  ├── Manage jobs
  └── Manage applications

Admin
  ├── Manage users
  ├── Manage jobs
  ├── Manage companies
  └── Manage contact messages
```

---

## Input Validation

The backend uses:

```text
express-validator
```

to validate incoming request data.

---

## CORS

Cross-Origin Resource Sharing is configured to control which frontend applications can access the backend.

---

# 🚦 Rate Limiting

Rate limiting is implemented using:

```text
express-rate-limit
```

It helps protect the API from excessive requests.

Rate limiting can be applied to areas such as:

* Authentication
* Contact forms
* General API requests

---

# 🧪 Testing

The backend uses:

* Jest
* Supertest
* MongoDB Memory Server

Test files include:

```text
tests/
├── applications.test.js
├── auth.test.js
├── companies.test.js
├── contact.test.js
├── jobs.test.js
├── resume.test.js
├── savedJobs.test.js
├── users.test.js
├── globalSetup.js
├── globalTeardown.js
└── setup.js
```

---

## Run Tests

Run the complete test suite:

```bash
npm test
```

The test environment uses a separate MongoDB test environment.

---

# 📦 NPM Scripts

## Start Server

```bash
npm start
```

Starts the backend server.

## Development Server

```bash
npm run dev
```

Starts the server using Nodemon and automatically restarts it when files change.

## Run Tests

```bash
npm test
```

Runs the Jest test suite.

---

# 🌐 Deployment

The project includes a `render.yaml` configuration for deployment using Render.

Typical deployment configuration:

```text
Runtime: Node.js
Build Command: npm install
Start Command: node index.js
Health Check: /
```

Production environment variables should be configured through the deployment platform.

Example:

```env
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
GOOGLE_CLIENT_ID=your_google_client_id
CORS_ORIGINS=your_frontend_url
```

---

# 🔧 Troubleshooting

## MongoDB Connection Error

Check that the MongoDB connection string is correctly configured:

```env
MONGO_URI=your_mongodb_connection_string
```

Make sure MongoDB or MongoDB Atlas is accessible.

---

## JWT Authentication Error

Check that the JWT secret exists:

```env
JWT_SECRET=your_secret
```

Make sure the client sends:

```http
Authorization: Bearer <token>
```

---

## CORS Error

Check that the frontend URL is included in:

```env
CORS_ORIGINS=http://localhost:5173
```

Multiple origins can be separated using commas:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Email or OTP Not Working

Check:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

For Gmail, use an App Password rather than your normal Gmail password.

---

## File Upload Error

Check that:

1. The uploaded file uses a supported format.
2. The file size is below 5 MB.
3. The request uses `multipart/form-data`.
4. The correct upload field is used.

---

# 👥 Team Members

| Name                  | Role                 |
| --------------------- | -------------------- |
| W.A. Lakshitha        | Database / Backend   |
| D.S. Wijesooriya      | Backend Development  |
| N.K.M.P.K. Samarakoon | Frontend Development |
| K.A.R. Lakmal         | UI/UX Design         |
| R.H.T.N. Wickramasiri | Frontend Development |

---

# 📌 Project Status

**Status:** Completed / Final Project

JobZone Backend was developed as part of an academic final project and provides the REST APIs and server-side functionality required by the JobZone job-finding platform.

---

# 🚀 Future Improvements

Possible future improvements include:

* 🔔 Real-time notifications
* 📧 Automated job application notifications
* 🎯 More advanced job recommendation algorithms
* 🤖 Improved chatbot intelligence
* 📊 Advanced employer analytics
* 🔎 Improved search ranking
* 📖 Swagger/OpenAPI documentation
* 🧪 Increased automated test coverage
* 🛡️ Advanced security monitoring

---

# 🤝 Contribution Guidelines

Contributions and improvements are welcome.

Create a new branch:

```bash
git checkout -b feature/your-feature-name
```

Make your changes and run the tests:

```bash
npm test
```

Add your changes:

```bash
git add .
```

Commit:

```bash
git commit -m "feat: describe your change"
```

Push the branch:

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request.

---

# 📝 Development Guidelines

When working on the backend:

* Keep controllers inside the `controllers` directory.
* Keep database schemas inside the `models` directory.
* Keep API routes inside the `routes` directory.
* Use middleware for authentication and authorization.
* Validate incoming user data.
* Never expose passwords or secrets.
* Never commit `.env` files.
* Add tests for new functionality when possible.
* Use meaningful variable and function names.
* Use meaningful Git commit messages.
* Keep API responses consistent.
* Avoid unnecessary duplication of code.

---

# 🔐 Security Best Practices

When developing or deploying JobZone:

* Use strong JWT secrets.
* Never expose database credentials.
* Never commit `.env`.
* Use HTTPS in production.
* Use Gmail App Passwords for SMTP.
* Keep dependencies updated.
* Validate all user input.
* Restrict CORS to trusted frontend domains.
* Use authentication for protected resources.
* Apply role-based authorization.
* Keep uploaded files within configured limits.

---

# 📄 License

This project was developed for educational and academic purposes.

---

# 💼 JobZone Backend

**Project:** JobZone

**Component:** Backend API

**Technology:** Node.js + Express.js

**Database:** MongoDB

**Authentication:** JWT

**Testing:** Jest + Supertest

**Deployment:** Render

---

> **JobZone Backend provides the server-side infrastructure required for the JobZone platform, connecting job seekers, employers, and administrators through secure RESTful APIs.**

````




