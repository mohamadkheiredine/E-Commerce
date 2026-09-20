# Backend

**Express:** Simple and lightweight, without forcing a lot of framework-specific conventions.

**Controller → Service → Repository:** Keeps responsibilities separate: controllers handle requests, services handle business logic, and repositories handle database access.

**JWT + refresh tokens:** Short-lived access tokens improve security, while refresh-token rotation helps detect and limit stolen tokens.

**httpOnly cookies:** Keeps tokens away from browser JavaScript, reducing the risk of them being stolen through XSS.

**Error handling:** Uses consistent error codes and responses, making it easier for the frontend to handle different errors properly.
