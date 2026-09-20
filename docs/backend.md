# Backend

i chose Node.js with Express because it is simple and enough for this project. i separated the backend into controllers, services, and repositories to keep the code organized and easier to test. for authentication, i use short-lived JWTs and rotating refresh tokens in `httpOnly` cookies. SQLite keeps the demo simple, while PostgreSQL would be a better choice for a larger production system.
