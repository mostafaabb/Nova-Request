# Nova Request — API Testing Platform

**A developer-focused platform for creating, sending, and inspecting API requests.**

Nova Request is a web-based API testing project built to make working with HTTP APIs more organized and convenient. It focuses on the workflows developers use when building and debugging applications: configuring requests, managing authentication, inspecting responses, and sharing API-related work.

I developed this project to explore the challenges of building a practical developer tool, with attention to the user experience as well as the application logic behind API testing.

## Why I Built It

APIs are a core part of modern web applications, but testing them often involves switching between different tools, repeatedly configuring requests, and manually inspecting responses.

Nova Request explores how these workflows can be brought together in one interface, helping developers work with APIs during development and debugging.

## Key Features

- **HTTP request testing** — configure and send API requests using the methods supported by the application.
- **Request configuration** — organize request details, headers, parameters, and request bodies where supported.
- **Authentication support** — configure authentication for protected endpoints using the supported authentication methods.
- **Response inspection** — examine API responses and their available metadata in a readable format.
- **Request organization** — manage API testing workflows in a structured interface.
- **Sharing capabilities** — share supported API testing resources with other users.
- **API visualization** — present request and response information in a way that makes debugging easier.
- **Developer-focused interface** — keep common API testing tasks accessible from one place.

The exact capabilities depend on the current implementation. Refer to the source code for the supported HTTP methods, authentication schemes, response formats, and sharing options.

## Technology Stack

Nova Request uses a web application architecture. The exact stack and package versions should be taken from the repository's dependency files.

- **Frontend:** Next.js, React, TypeScript, and Tailwind CSS.
- **Backend:** Node.js and Express.js for server-side logic and API handling.
- **Database & ORM:** PostgreSQL and Prisma ORM for data persistence and database operations.
- **API Testing:** HTTP request execution, response inspection, and API workflow management.
- **Authentication & State Management:** JWT-based authentication, bcryptjs, and Zustand.
- **Deployment:** Deployed web application with a live demo at [nova-request.com](https://nova-request.com).

## How It Works

The general API testing workflow is:

1. Configure a request to an API endpoint.
2. Add the required parameters, headers, authentication details, or request body.
3. Send the request to the target service.
4. Inspect the response and use the available information to investigate unexpected behavior.
5. Organize or share supported testing resources as needed.

This workflow helps developers test API behavior independently of the frontend application that may eventually consume the API.

## Getting Started

### Prerequisites

Before installing Nova Request, check the repository for its required runtime versions, package manager, database services, and environment configuration.

### Installation

Clone the repository:

```bash
git clone https://github.com/mostafaabb/Nova-Request.git
cd Nova-Request
```

Install dependencies using the package manager and commands specified by the project.

### Environment Configuration

If the repository includes an environment example, create the appropriate local environment file and configure the required values.

Depending on the implementation, configuration may include:

- Backend and frontend URLs
- Database connection settings
- Authentication secrets
- External service credentials
- Deployment-specific settings

Never commit real credentials or private secrets to the repository.

### Run the Application

Follow the existing setup and deployment documentation for the exact commands to start the frontend, backend, and any required supporting services.

**Note:** Use the actual scripts in the project's package configuration and its deployment guide. This README intentionally does not invent startup commands or database setup steps.

## Project Structure

The repository contains the application code and supporting configuration for developing and deploying Nova Request.

For the most accurate overview, refer to the current directory structure in the repository. The frontend, backend, API-related logic, and deployment configuration should be documented according to their actual locations.

## What I Learned

Working on Nova Request has given me practical experience with the challenges involved in building a developer-facing application.

Beyond the interface itself, a tool like this needs to handle request configuration, authentication, response handling, and clear presentation of technical information. Sharing functionality also introduces questions about how application resources should be accessed and managed.

These are the kinds of details I want to keep improving as I build more complete and maintainable software.

## Project Status

Nova Request is a project that can continue evolving as API testing workflows and developer needs change. Check the repository for the latest implementation, supported functionality, and setup instructions.

## Author

**Mostafa Borshalli** — Full-Stack Developer

- Portfolio: https://mostafa-portfolio-black.vercel.app/
- GitHub: https://github.com/mostafaabb
- LinkedIn: https://linkedin.com/in/mostafa-borshalli-7a152a327
