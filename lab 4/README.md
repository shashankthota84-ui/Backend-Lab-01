# Lab 4: Registration, Login and JWT

## Student Details

- **Name:** T.SHASHANK  
- **Registration Number:** 252U1R1243  
- **Section:** CSE-2E(211)  

---

## Deployment Status

> **Deployment Note:** Deployment was not completed because this is a local laboratory assignment intended for offline college evaluation, local Postman testing, and viva demonstration. In accordance with safety and submission guidelines, public deployment to cloud platforms (such as Render, Railway, or Vercel) was not performed. If cloud hosting is required by the college evaluator, deployment steps are documented in this README.

---

## Project Description

Lab 4 focuses on core backend authentication and authorization principles. In modern web architectures, securely handling user credentials, preventing data leaks, protecting against common vulnerabilities (like SQL injection and credential stuffing), and implementing stateless session management using JSON Web Tokens (JWT) are critical.

This project implements:
1. **User Registration (`POST /register`)**: Validates input fields, checks for duplicate usernames, hashes passwords securely using `bcrypt` (with 10 salt rounds), and persists user records in an SQLite database using parameterized queries.
2. **User Login (`POST /login`)**: Verifies user existence, securely compares candidate passwords against stored bcrypt hashes, and issues a cryptographically signed JWT containing strictly the user's `username` in the payload upon successful authentication.
3. **Robust Security Controls**: Ensures plain-text passwords are never stored in the database, never logged to server logs, and never included in JWT payloads or API responses.

---

## Technologies Used

- **Node.js**: Asynchronous event-driven JavaScript runtime environment.
- **Express.js**: Fast, minimalist web framework for building RESTful endpoints.
- **SQLite (sqlite3 & sqlite wrapper)**: Serverless, lightweight, file-based relational database.
- **bcrypt**: Industry-standard cryptographic library for salting and hashing passwords.
- **jsonwebtoken (JWT)**: Standard library for signing and verifying JSON Web Tokens.
- **Postman**: API development, request formatting, and automated endpoint testing tool.

---

## Project Structure

```text
lab 4/
├── screenshots/          # Postman test and SQLite database verification screenshots
│   └── .gitkeep
├── database/             # SQLite connection and schema management
│   ├── database.js       # SQLite connection logic & automatic table creation
│   └── users.db          # SQLite database file (created on startup, ignored by git)
├── routes/               # Modular Express route handlers
│   └── auth.js           # /register and /login API route implementations
├── .gitignore            # Git exclusion rules (node_modules, .env, *.db)
├── package.json          # Node dependencies and project metadata
├── server.js             # Application entry point and server startup
└── README.md             # Documentation, API specifications, and viva guide
```

---

## Database Structure

The project uses an SQLite database (`database/users.db`) with a `users` table automatically created upon server initialization:

### Table Schema: `users`

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each registered user record |
| `username` | `TEXT` | `NOT NULL UNIQUE` | Unique handle/login username chosen by the user |
| `name` | `TEXT` | `NOT NULL` | Full display name of the user |
| `password` | `TEXT` | `NOT NULL` | **Bcrypt hashed password string** (e.g. `$2b$10$...`). Plaintext is never stored. |

### SQL Creation Query

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL
);
```

---

## Installation & Setup Instructions

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (Node Package Manager)
- Postman (desktop application or web client)

### 1. Navigate to Project Folder
Open PowerShell or Terminal and change directory to `lab 4`:
```powershell
cd "lab 4"
```

### 2. Install Dependencies
Install all required production dependencies:
```powershell
npm install
```

### 3. Start the Server
Start the Express server:
```powershell
npm start
```
Or directly using Node:
```powershell
node server.js
```

Upon successful startup, the console displays:
```text
[Database] SQLite connected at: ...\lab 4\database\users.db
[Database] Users table verified/created successfully.
===============================================
Server running successfully at http://localhost:3000/
Registration endpoint: POST http://localhost:3000/register
Login endpoint:        POST http://localhost:3000/login
===============================================
```

---

## API Endpoints Specification

### 1. Register User
- **Method:** `POST`
- **URL:** `http://localhost:3000/register`
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "username": "arjun123",
  "name": "Arjun",
  "password": "arjun@123"
}
```

#### Responses
- **Success (HTTP 200 OK):**
  ```json
  {
    "message": "User registered successfully"
  }
  ```
- **Error: User already exists (HTTP 400 Bad Request):**
  ```json
  {
    "error": "User already exists",
    "message": "User already exists"
  }
  ```
- **Error: Missing required fields (HTTP 400 Bad Request):**
  ```json
  {
    "error": "All fields (username, name, password) are required and cannot be empty.",
    "message": "All fields (username, name, password) are required and cannot be empty."
  }
  ```

---

### 2. User Login
- **Method:** `POST`
- **URL:** `http://localhost:3000/login`
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "username": "arjun123",
  "password": "arjun@123"
}
```

#### Responses
- **Success (HTTP 200 OK):**
  ```json
  {
    "jwt_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFyanVuMTIzIiwiaWF0IjoxNzg0ODQ5..."
  }
  ```
- **Error: Invalid username (HTTP 400 Bad Request):**
  ```json
  {
    "error": "Invalid user",
    "message": "Invalid user"
  }
  ```
- **Error: Invalid password (HTTP 400 Bad Request):**
  ```json
  {
    "error": "Invalid password",
    "message": "Invalid password"
  }
  ```
- **Error: Missing fields (HTTP 400 Bad Request):**
  ```json
  {
    "error": "Both username and password are required.",
    "message": "Both username and password are required."
  }
  ```

---

## Postman Testing Scenarios & Verification

### Test Scenarios Matrix

| Test Case # | Category | Description | Expected Status | Expected Response Body |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Registration | Register new user `arjun123` | `200 OK` | `{"message": "User registered successfully"}` |
| **TC-02** | Registration | Register duplicate username `arjun123` | `400 Bad Request` | `{"error": "User already exists", ...}` |
| **TC-03** | Registration | Register without required fields (e.g. empty name) | `400 Bad Request` | `{"error": "All fields ... are required ...", ...}` |
| **TC-04** | Login | Login with correct username & password | `200 OK` | `{"jwt_token": "<valid_jwt_string>"}` |
| **TC-05** | Login | Login with unknown username (`unknown_user`) | `400 Bad Request` | `{"error": "Invalid user", ...}` |
| **TC-06** | Login | Login with incorrect password (`wrong_pass`) | `400 Bad Request` | `{"error": "Invalid password", ...}` |
| **TC-07** | Database Security | Direct SQLite query verification | Verified | Password column contains `$2b$10$...` hash |

---

## Screenshots Guide

Save your Postman and database screenshots into the `screenshots/` directory with the following filenames:

1. `screenshots/01-register-success.png`: Postman showing successful registration (HTTP 200).
2. `screenshots/02-register-duplicate-user.png`: Postman showing 400 Bad Request when registering duplicate username.
3. `screenshots/03-register-missing-fields.png`: Postman showing 400 Bad Request when fields are missing.
4. `screenshots/04-login-success-jwt.png`: Postman showing successful login returning `jwt_token` (HTTP 200).
5. `screenshots/05-login-invalid-user.png`: Postman showing 400 Bad Request for unknown user.
6. `screenshots/06-login-invalid-password.png`: Postman showing 400 Bad Request for incorrect password.
7. `screenshots/07-database-hashed-passwords.png`: SQLite Viewer / terminal output showing hashed password strings in the `users` table.

---

## Viva & Conceptual Explanations

### 1. Why do we hash passwords using `bcrypt` instead of storing plain text or MD5/SHA256?
- **Plain-text danger:** If an attacker gains read access to the database (via SQL injection, database dump leak, or server compromise), all user passwords are immediately compromised.
- **Salt & Key-stretching:** `bcrypt` generates a unique cryptographic salt for every password and hashes it through multiple iterations (work factor / cost). This makes pre-computed rainbow table attacks and high-speed GPU brute-force attacks computationally infeasible.

### 2. How does `bcrypt.compare()` verify passwords without knowing the original plaintext?
- The stored hash in SQLite contains the algorithm version, cost factor, salt, and hash combined (e.g., `$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW`).
- When `bcrypt.compare(candidatePassword, storedHash)` is called, `bcrypt` extracts the exact salt and parameters from `storedHash`, hashes the candidate password using that exact salt, and checks if the newly computed hash matches the stored hash in constant time (preventing timing attacks).

### 3. What is JWT and how does it provide stateless authentication?
- **JWT (JSON Web Token)** is an open standard (RFC 7519) that defines a compact, URL-safe container for securely transmitting claims between parties.
- A JWT consists of three parts separated by dots (`.`):
  1. **Header:** Algorithm & token type (e.g., `{"alg": "HS256", "typ": "JWT"}`).
  2. **Payload:** Claims/data (e.g., `{"username": "arjun123"}`).
  3. **Signature:** Created by hashing Header + Payload using the secret key (`HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)`).
- **Stateless nature:** The server does not need to store active sessions in database memory. Any incoming request carrying the token can be verified mathematically using the secret key.

### 4. Why should passwords NEVER be put in JWT payloads?
- The JWT payload is only Base64URL-encoded, **not encrypted**. Anyone possessing or intercepting the token can decode the payload instantly using tools like `jwt.io` or `Buffer.from(payload, 'base64')`. Therefore, sensitive data like passwords or password hashes must never be placed inside the payload.

### 5. Why do we use Parameterized Queries (`?`)?
- Parameterized queries separate the SQL code structure from the user-supplied data inputs. The database driver treats parameters strictly as data literals, preventing SQL injection attacks (e.g. `' OR '1'='1`).

---

## Problems Faced and Solutions

1. **Problem:** Vulnerability to duplicate user registrations and race conditions.  
   **Solution:** Defined `username TEXT NOT NULL UNIQUE` at the SQLite schema level and added an explicit pre-check query (`SELECT * FROM users WHERE username = ?;`) before hashing and insertion.

2. **Problem:** Sensitive information exposure in API responses.  
   **Solution:** Strictly sanitized all responses. The registration API only returns a confirmation message (`{"message": "User registered successfully"}`), and the login API only returns the signed `jwt_token`.

3. **Problem:** Plaintext exposure in JWT claims.  
   **Solution:** Built the JWT payload strictly with `{ username: user.username }`, ensuring zero password or hash data enters the token.

4. **Problem:** Whitespace or missing field bypass.  
   **Solution:** Implemented defensive input validation checking both presence and `.trim() !== ''` for all required body parameters.
