# Task Planner – Full-Stack Task Management Application

## 📌 Overview

Task Planner is a role-based task management web application inspired by Trello, designed to support hierarchical team collaboration and structured workflows.

The application enables managers to assign tasks to executors, track their activity, and monitor progress through a clearly defined task lifecycle.

---

## 🚀 Tech Stack

**Frontend**
- React
- JavaScript
- CSS

**Backend**
- Node.js
- Express
- JWT Authentication

**Database**
- PostgreSQL
- Sequelize ORM

**Deployment**
- Render (temporary deployment)

---

## ✨ Key Features

- 🔐 Role-based authentication (Admin / Manager / Executor)
- 🛡 JWT-based secure login and protected API routes
- 📋 Task workflow system: `OPEN → PENDING → COMPLETED → CLOSED`
- 👥 Hierarchical user relationships (Managers assign tasks to Executors)
- 🗂 Relational database design with foreign keys and associations
- 📊 Historical task tracking per user
- 🌐 Full-stack deployment

---

## 🧠 Architecture Highlights

- RESTful API design
- Middleware-based authentication and authorization
- Sequelize model associations (One-to-Many relationships)
- Separation of concerns between controllers, routes, and models
- Environment-based configuration

---

## 📦 Database Design

The application uses a relational PostgreSQL database with:

- User roles and hierarchical relationships
- Task status lifecycle tracking
- Referential integrity through Sequelize associations
- Structured task assignment system

---

## 🌍 Deployment

The application was deployed using **Render**.

⚠️ The live deployment is temporary, as it uses Render’s free tier (no premium plan).  
The backend service and database may become inactive due to hosting limitations.

However:
- The full source code remains available in this repository
- The project can be cloned and run locally without restrictions

https://task-planner-xz0h.onrender.com
---

## 🛠 Local Setup

1. Clone the repository:
```bash
git clone https://github.com/pavelmiruna/task-planner.git
```
2. Install dependencies:
```bash
npm install
```

3. Run the server:
```bash
npm start
```
