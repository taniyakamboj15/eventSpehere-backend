# EventSphere - Community Event Platform Backend

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green)
![License](https://img.shields.io/badge/license-MIT-blue)

A production-grade, scalable backend for a generic Community Event Platform. Designed to support Neighborhood Associations, Meetup Groups, and Local Businesses with robust discovery, RSVP management, and recurring event capabilities.

## 🚀 Features

### Core Domain
- **Hybrid Communities**: Support for Neighborhood (Private), Hobby (Public), and Business (Promotional) groups.
- **Geo-Spatial Discovery**: Location-based search for events and communities using MongoDB GeoJSON.
- **Advanced Event Management**:
  - Recurring Events (Daily/Weekly/Monthly) via Cron jobs.
  - Strict Capacity Management & Atomic RSVP handling.
  - Privacy controls (`PUBLIC`, `COMMUNITY_ONLY`, `PRIVATE_INVITE`).
- **Interactive Features**: Comment threads and Cloudinary-backed photo galleries.

### Security & Architecture
- **Enterprise-Grade Auth**: JWT Access/Refresh token rotation, HttpOnly cookies, and Role-Based Access Control (RBAC).
- **Production-Grade Security**:
  - Environment variable validation with Zod
  - Redis-based distributed rate limiting (100 req/15min general, 5 req/15min auth)
  - NoSQL Injection protection (`express-mongo-sanitize`)
  - Secure Headers (`helmet`) with CSP, HSTS, XSS protection
  - File upload validation and sanitization
  - Request size limits (10MB)
- **Performance Optimizations**:
  - Redis caching service with cache-aside pattern
  - Comprehensive database indexing (10-100x faster queries)
  - Connection pooling (2-10 connections)
  - Graceful shutdown support
- **Scalable Architecture**: Strict modular design with centralized type definitions and service repository pattern.
- **Async Processing**: Redis & BullMQ for decoupling high-load tasks (e.g., email notifications).
- **Monitoring & Observability**:
  - Structured logging with Winston and request context
  - Health check endpoints (/health/health, /health/ready, /health/live)
  - Request ID tracking (UUID)
- **API Documentation**: Complete Swagger/OpenAPI documentation at `/api-docs`

## 🛡️ Use Case Satisfaction

| Use Case | Implementation Mapping |
| :--- | :--- |
| **Neighborhood Associations** | Supported via `CommunityType.NEIGHBORHOOD` and `EventVisibility.COMMUNITY_ONLY`. This ensures private club meetings remain invisible to the general public. |
| **Meetup & Hobby Groups** | Enabled by `EventCategory` filtering and `EventVisibility.PUBLIC`. Interest-based discovery allows users to find "Tech" or "Sports" communities nearby. |
| **Local Business Promotion** | Supported via `CommunityType.BUSINESS`. Businesses can host branding events with a strict `capacity` limit to manage foot traffic and seat availability. |

## ✅ Feature Implementation Audit

- **📍 Location & Discovery**: Uses **GeoJSON** for both `Events` and `Communities`. The discovery API performs a `$near` search, allowing users to find events within a 10km radius of their location.
- **🎟️ RSVP & Capacity**: The `RsvpService` uses atomic operations to ensure `attendeeCount` never exceeds the `capacity`. Only `ATTENDEE` or `ADMIN` roles can RSVP (Organizers manage).
- **🔄 Recurring Events**: A dedicated **Cron Job** (`recurring.job.ts`) runs at midnight daily. It automatically creates the next occurrence for any event marked as `WEEKLY` or `MONTHLY`, preserving all original event metadata.
- **📧 Async Notifications**: Decoupled via **BullMQ + Redis**. When an event is updated, the notification queue triggers a worker to "email" all RSVP'd attendees without blocking the main request cycle.
- **📅 Calendar Sync**: The `calendar.utils.ts` provides pre-formatted **Google Calendar** links and **Standard .ics** strings, ensuring users never miss an event.
- **📸 Photo Gallery**: Integrated with **Cloudinary**. Organizers can upload multiple photos per event, with URLs stored securely in a dedicated array in the Event document.
- **✅ Check-in System**: A specialized endpoint allows Organizers to verify attendees on-site, preventing double check-ins and providing real-time attendance data.
- **💬 Q&A Section**: The `Comment` module provides a threaded-style discussion for each event, allowing for pre-event questions and post-event discussions.

## 🎫 Flexible Check-in Logic (QR & Manual)

The backend is designed to be UI-agnostic, supporting both high-tech and fallback check-in methods through the same `POST /api/events/:id/checkin/:userId` endpoint:

1. **Digital Flow (QR Code)**:
   - Frontend generates a QR code containing the `userId`.
   - Organizer scans the code via their device.
   - App calls the check-in endpoint using the scanned `userId`.

2. **Manual Flow (Attendee List)**:
   - Organizer fetches the attendee list via `GET /api/events/:id/attendees`.
   - Organizer identifies the guest and clicks "Check-in" in the UI.
   - App calls the same check-in endpoint using the `userId` from the list.

Both methods benefit from the same **Security Checks** (Organizer authentication), **Business Logic** (RSVP verification), and **Deduplication** (Prevention of double check-ins).

## 🛠️ Tech Stack

- **Runtime**: Node.js, Express.js
- **Language**: TypeScript (Strict Mode)
- **Database**: MongoDB (Mongoose with GeoJSON)
- **Caching & Queues**: Redis, ioredis, BullMQ
- **Validation**: Zod (environment), Express-Validator
- **Security**: Helmet, express-rate-limit, rate-limit-redis, express-mongo-sanitize
- **Infrastructure**: Cloudinary (Media), Winston (Logging with daily rotation)
- **Documentation**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Email**: Nodemailer with Handlebars templates

## 📂 Project Structure

The project follows a Domain-Driven modular architecture:

```
src/
├── modules/            # Feature-based modules (Domain Logic)
│   ├── user/           # Auth, RBAC, User Profile
│   ├── community/      # Groups & Location logic
│   ├── event/          # Core Event management & Recurring rules
│   ├── rsvp/           # Attendance & Capacity transactions
│   ├── notification/   # Async workers & Queues
│   └── ...
├── common/             # Shared Utilities, Middlewares, & Types
├── config/             # Environment & Infrastructure config
├── jobs/               # Scheduled Cron Tasks
└── routes/             # Centralized API Routes
```

## ⚡ Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (Local or Atlas)
- Redis Server (for async workers)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/eventsphere-backend.git
   cd eventsphere-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/eventsphere
   
   # Security
   JWT_SECRET=your_super_secret_access_key
   JWT_REFRESH_SECRET=your_super_secret_refresh_key
   CORS_ORIGIN=http://localhost:3000
   
   # Infrastructure
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # Media
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Run the Server**
   ```bash
   # Development Mode
   npm run dev

   # Production Build
   npm run build
   npm start
   ```

## 📖 API Documentation

### Interactive Swagger Documentation
Access comprehensive API documentation at: **http://localhost:5000/api-docs**

**Features**:
- 40+ documented endpoints with request/response schemas
- Interactive "Try it out" functionality
- JWT authentication support
- Organized by tags (Authentication, Events, Communities, RSVPs, Users, etc.)
- Request/response examples with validation rules

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access | 
|:---|:---|:---|:---|
| `POST` | `/register` | Register a new user | Public |
| `POST` | `/login` | Login & receive tokens | Public |
| `POST` | `/refresh` | Refresh access token | Public (Cookie) |
| `POST` | `/logout` | Logout & clear session | Authenticated |

### 🏙️ Communities (`/api/communities`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `POST` | `/` | Create a new community | Organizer/Admin |
| `GET` | `/` | List all communities | Public |
| `POST` | `/:id/join` | Join a community | Authenticated |

### 📅 Events (`/api/events`)
| Method | Endpoint | Description | Access |
|:---|:---|:---|:---|
| `GET` | `/` | Search events (filters: lat, long, category) | Public |
| `POST` | `/` | Create an event | Organizer/Admin |
| `GET` | `/:id` | Get event details | Public |
| `PATCH` | `/:id` | Update event details | Organizer (Owner) |
| `DELETE` | `/:id` | Delete event | Organizer (Owner) |
| `POST` | `/:id/rsvp` | RSVP to event (Going/Maybe/Cancel) | Authenticated |
| `GET` | `/:id/attendees` | Get attendee list with status | Public |
| `POST` | `/:id/checkin/:userId` | Check-in user at event | Organizer/Admin |
| `POST` | `/:id/comments` | Post a comment/question | Authenticated |
| `GET` | `/:id/comments` | Get event comments | Public |
| `POST` | `/:id/photos` | Upload event gallery photo | Organizer/Admin |

### 📸 Uploads
- Integrated directly into Event endpoints (`POST /api/events/:id/photos`) using Cloudinary.

*(All `POST` endpoints expect JSON bodies unless specified otherwise)*

## 🛡️ Security Practices

- **Environment Validation**: Zod schema validation on startup with type-safe configuration
- **Rate Limiting**: Redis-based distributed rate limiting
  - General API: 100 requests/15 minutes
  - Authentication: 5 attempts/15 minutes
  - Uploads: 20 files/hour
  - Creates: 10 operations/hour
- **Sanitization**: All inputs sanitized against NoSQL injection
- **File Upload Security**: MIME type validation, size limits (5MB), filename sanitization
- **Security Headers**: CSP, HSTS, frame protection, XSS filter
- **Type Safety**: Full TypeScript coverage with shared interfaces in `*.types.ts`
- **Graceful Shutdown**: Proper cleanup of HTTP server, database, Redis, and background jobs

## ⚡ Performance Features

- **Database Indexing**: Comprehensive indexes for 10-100x faster queries
  - Geospatial indexes for location-based queries
  - Compound indexes for common query patterns
  - Text search indexes for events and communities
- **Redis Caching**: Cache-aside pattern with TTL for frequently accessed data
- **Connection Pooling**: MongoDB connection pool (2-10 connections)
- **Standardized Responses**: Consistent API response format across all endpoints

## 🏥 Health & Monitoring

### Health Check Endpoints
- **GET /health/health**: Comprehensive health check (API, Database, Redis, memory, uptime)
- **GET /health/ready**: Readiness probe for load balancers
- **GET /health/live**: Liveness probe for container orchestration

### Logging
- Structured logging with Winston
- Request ID tracking (UUID)
- Request/response timing
- Daily log rotation
- Separate error logs

## 📝 Recent Updates

### Production Optimizations (Latest)
- **Critical Priority (12/12 Complete)**:
  - Environment variable validation with Zod
  - Enhanced database connection with pooling and error handling
  - Graceful server shutdown
  - Production-grade security headers (CSP, HSTS)
  - Redis-based distributed rate limiting
  - Frontend error boundaries and API error handling
  
- **High Priority (10/14 Complete)**:
  - Redis caching service implementation
  - Standardized API response format
  - Comprehensive database indexing
  - Structured logging with request context
  - File upload security validation
  - Enhanced health check endpoints
  
- **Medium Priority**:
  - Complete Swagger/OpenAPI documentation (40+ endpoints)

### Previous Updates
- **Logic Refactoring**: Transitioned high-complexity modules (e.g., `notification.worker.ts`) from brittle `switch/if-else` blocks to extensible lookup-based handler patterns.
- **Async Reliability**: Improved notification worker stability with better error handling and structured logging.
- **API Performance**: Optimized database queries for GeoJSON discovery and capacity management.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License.
