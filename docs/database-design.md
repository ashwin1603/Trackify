# Database Design

## Tables

- **User**: id, email, name, dob, devCode, passwordHash, roleId, createdAt, updatedAt
- **Role**: id, name, description
- **Permission**: id, code, description
- **RolePermission**: roleId, permissionId
- **Bug**: id, title, description, status, priority, creatorId, assigneeId, assignedToDevCode, createdAt, updatedAt
- **Comment**: id, content, bugId, authorId, createdAt, updatedAt
- **AuditLog**: id, actorId, action, details, createdAt

## Relationships

- User belongs to Role
- Role has many Permissions via RolePermission
- Bug belongs to User (creator/assignee)
- Comment belongs to Bug and User
- AuditLog belongs to User (actor)

## Indexes

- Bug status and assigneeId indexed for performance
