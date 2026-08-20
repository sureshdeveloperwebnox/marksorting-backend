---
name: marksorting-backend
description: Comprehensive NestJS backend engineering guidelines, Prisma ORM database rules, complete folder-by-folder architecture breakdown (common, config, 29 modules, queues, redis, shared), dual-auth strategy, permission guards, audit logging, and presigned S3 upload protocol.
---

# MarkSorting Backend Engineering Guidelines

## 1. Directory Structure & Folder Breakdown

The backend is an enterprise NestJS (v11) application located in [marksorting-backend](file:///d:/Office/marksorting/marksorting-backend).

```
marksorting-backend/src/
├── common/             # Cross-cutting framework utilities & guards
│   ├── decorators/     # Custom NestJS decorators (@CurrentUser, @RequirePermissions, @Roles)
│   ├── dto/            # Base response DTOs and pagination wrappers
│   ├── filters/        # Global exception filters (AllExceptionsFilter)
│   ├── guards/         # Security guards (JwtAuthGuard, PermissionsGuard, RolesGuard)
│   ├── interceptors/   # LoggingInterceptor, AuditInterceptor, TransformInterceptor
│   ├── middleware/     # HTTP logging and correlation ID injection middleware
│   ├── pipes/          # Custom validation & transformation pipes
│   └── utils/          # Encryption, hashing, and date utilities
├── config/             # Environment configs (app, database, jwt, redis, s3, mail)
├── modules/            # Feature modules (29 domain modules)
├── prisma/             # PrismaService & Database connection module
├── queues/             # BullMQ background job queues (email, pdf compilation, notifications)
├── redis/              # Redis Client module (caching, sessions, pub/sub)
├── shared/             # Shared utilities (Puppeteer PDF compiler, XLSX exporter)
└── types/              # TypeScript interfaces, express extension types
```

### Complete Breakdown of the 29 Modules ([src/modules](file:///d:/Office/marksorting/marksorting-backend/src/modules))
1. **`auth`**: Authentication endpoints, login, password reset, token refresh, OTP verification, session management.
2. **`users`**: System user management, profile creation, status toggle (`ACTIVE`, `INACTIVE`, `LOCKED`).
3. **`roles`**: RBAC role management and preconfigured role seeds.
4. **`permissions`**: Seeded 69 permissions lookup and assignment APIs.
5. **`tickets`**: Service ticket lifecycle (`ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `PENDING_PARTS`), technician assignments, timeline logging.
6. **`service-reports`**: Visited service report creation, compressor readings, air dryer checks, technician & customer signature keys.
7. **`installation-reports`**: Machine installation certificates, warranty start dates, ground value checks.
8. **`expenses`**: Reimbursable expense filing, receipt image keys, approval workflows (`PENDING`, `APPROVED`, `REJECTED`, `REIMBURSED`).
9. **`expense-categories`**: Reference categories for expense line items (`TRAVEL`, `LODGING`, `FOOD`, `SPARE_PARTS`, `MISC`).
10. **`service-categories`**: Categories for maintenance and repair service operations.
11. **`service-records`**: Historical machine servicing logs.
12. **`services`**: Master list of offered service types.
13. **`customers`**: Corporate clients owning mill facilities.
14. **`mills`**: Mill factory facilities linked to customers.
15. **`master-mills`**: Master catalog of mill machine models and specs.
16. **`technicians`**: Field technician roster and skill assignments.
17. **`stores`**: Inventory inflows/outflows, machine returns, depth-safe semicolon serialization for per-barcode return & engineer/admin acknowledge status (`RET:Returned`, `ENG_ACK:Acknowledged`, `ADM_ACK:Pending`), and automated `quantity_summary` calculation.
18. **`materials`**: Store material inventory and barcode tracking (`store_materials`).
19. **`upload`**: AWS S3 presigned URL generation for direct client uploads (`/upload/presigned-url`).
20. **`pdf`**: PDF generation triggers using Puppeteer HTML templates.
21. **`mail`**: Email notification dispatchers via SMTP/Nodemailer.
22. **`notifications`**: User notification drawer and real-time push events.
23. **`report-notifications`**: Automated email/SMS alerts when reports are finalized.
24. **`whatsapp`**: WhatsApp notification integration (Twilio/WATI).
25. **`logging`**: Centralized log query and management services.
26. **`activity-logs`**: Audit queries for user activities.
27. **`dashboard`**: Executive dashboard metrics, charts, ticket counts, technician performance summaries.
28. **`reports`**: Business intelligence and export queries.
29. **`settings`**: Platform system configuration.

---

## 2. Authentication & Dual-Auth Handling

The NestJS backend supports both Web (Cookies) and Mobile (Bearer JWT) clients.

### Web vs Mobile Strategy
- **Web App**: Sets `access_token` and `refresh_token` as HTTP-Only, Secure cookies.
- **Mobile App**: Uses `Authorization: Bearer <access_token>` header. Refresh endpoint `/auth/refresh` accepts Bearer token body/header.

### Guard Chain for Controllers
Every protected controller MUST be guarded with:
```typescript
@Controller('tickets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TicketsController {
  @Get()
  @RequirePermissions('tickets.read')
  async findAll(@Query() query: PaginationQueryDto) { ... }
}
```

---

## 3. File Upload Protocol (AWS S3 Presigned URLs)

1. Client requests presigned upload URL from `POST /api/v1/upload/presigned-url`.
2. Client sends raw binary via HTTP `PUT` directly to S3 `upload_url`.
3. Client stores `file_key` in database records via API form submission.

---

## 4. Audit & Security Logging

When modifying domain entities, backend services MUST write audit logs:
```typescript
await this.prisma.auditTrail.create({
  data: {
    user_id: userId,
    action: 'UPDATE_SERVICE_REPORT',
    entity_type: 'service_report',
    entity_id: reportId,
    before_data: JSON.stringify(previousState),
    after_data: JSON.stringify(newState),
    ip_address: req.ip,
  },
});
```
