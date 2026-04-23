# Security Notes

## Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Helmet for security headers
- CORS configuration
- Input validation with Joi
- Audit logging for all actions
- Failed login tracking
- Role-based permissions

## Best Practices

- Change JWT_SECRET in production
- Use HTTPS
- Regularly update dependencies
- Monitor audit logs
- Limit ADMIN role creation
