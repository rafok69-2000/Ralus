# Ralus — Gestión de proyectos con tablero Kanban

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)

---

## Demo en producción

🌐 **[ralus.vercel.app](https://ralus.vercel.app)**

---

## Descripción general

**Ralus** es una aplicación web de gestión de proyectos con tablero Kanban. Permite a equipos organizar su trabajo en columnas y tarjetas, invitar colaboradores con roles diferenciados y mover tareas entre estados mediante drag & drop.

### Funcionalidades del MVP

- **Registro e inicio de sesión** — autenticación con JWT y contraseñas hasheadas con bcrypt
- **Gestión de proyectos** — crear, editar, eliminar y personalizar con color propio
- **Tablero Kanban** — columnas ordenables con tarjetas dentro de cada una
- **Drag & drop** — reordenar tarjetas y columnas, moverlas entre estados
- **Miembros con roles** — invitar usuarios como `ADMIN` o `MEMBER` dentro de un proyecto
- **Detalle de tarjeta** — asignar miembros, fechas límite, etiquetas y comentarios
- **Notificaciones en tiempo real** — alertas SSE al ser asignado, invitado o cuando una tarjeta vence
- **Filtros en el tablero** — filtrar tarjetas por etiqueta, estado de fecha límite
- **Modo oscuro** — toggle persistente en localStorage con soporte completo en todos los componentes
- **Rate limiting** — protección contra abuso en endpoints de autenticación e invitaciones
- **Notificación por correo** — el usuario invitado recibe un email al ser añadido al proyecto

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4, @hello-pangea/dnd |
| **Backend** | Node.js 18+, Express 5, JWT, bcrypt, Nodemailer, express-rate-limit |
| **Base de datos** | PostgreSQL (Supabase), Prisma ORM 7 |
| **Notificaciones** | Server-Sent Events (SSE) |
| **Deploy** | Railway (backend), Vercel (frontend) |

---

## Estructura del proyecto

```
Ralus/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── project.controller.js
│   │   │   ├── column.controller.js
│   │   │   ├── card.controller.js
│   │   │   ├── label.controller.js
│   │   │   ├── comment.controller.js
│   │   │   └── notification.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── project.middleware.js
│   │   │   └── rateLimit.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── project.routes.js
│   │   │   ├── column.routes.js
│   │   │   ├── card.routes.js
│   │   │   ├── label.routes.js
│   │   │   ├── comment.routes.js
│   │   │   └── notification.routes.js
│   │   ├── jobs/
│   │   │   └── dueDateChecker.js
│   │   ├── sse/
│   │   │   └── sseManager.js
│   │   ├── utils/
│   │   │   ├── password.js
│   │   │   ├── token.js
│   │   │   ├── mailer.js
│   │   │   └── createNotification.js
│   │   ├── lib/
│   │   │   └── prisma.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js
    │   │   ├── projects.js
    │   │   ├── columns.js
    │   │   ├── cards.js
    │   │   ├── members.js
    │   │   ├── labels.js
    │   │   ├── comments.js
    │   │   └── notifications.js
    │   ├── components/
    │   │   ├── Avatar.jsx
    │   │   ├── Button.jsx
    │   │   ├── Modal.jsx
    │   │   ├── ConfirmModal.jsx
    │   │   ├── PrivateRoute.jsx
    │   │   ├── MembersModal.jsx
    │   │   ├── CardDetail.jsx
    │   │   ├── NotificationBell.jsx
    │   │   ├── BoardFilters.jsx
    │   │   ├── ColorPicker.jsx
    │   │   ├── ThemeToggle.jsx
    │   │   └── Footer.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   └── useCardFilters.js
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   └── BoardPage.jsx
    │   ├── utils/
    │   │   ├── dates.js
    │   │   └── projectColors.js
    │   └── App.jsx
    ├── .env.example
    ├── vercel.json
    └── package.json
```

---

## Modelo de base de datos

```
User ──< ProjectMember >── Project ──< Column ──< Card
└──< Label >──< Card
User ──< Notification
Card ──< Comment
```

| Modelo | Descripción |
|---|---|
| **User** | Usuario del sistema con `GlobalRole` (`ADMIN` \| `USER`). Puede ser dueño de proyectos, miembro, tener tarjetas asignadas y recibir notificaciones. |
| **Project** | Tablero con nombre, descripción, color y un `owner`. Tiene columnas, miembros y etiquetas. |
| **ProjectMember** | Relación usuario↔proyecto con `ProjectRole` (`ADMIN` \| `MEMBER`). |
| **Column** | Columna dentro de un proyecto con `position` para mantener orden. Cascade delete desde Project. |
| **Card** | Tarjeta con título, descripción, `position`, fecha límite, usuario asignado y etiquetas. Cascade delete desde Column. |
| **Label** | Etiqueta con nombre y color hex perteneciente a un proyecto. Relación muchos a muchos con Card. |
| **Comment** | Comentario de un usuario en una tarjeta con contenido y fecha. |
| **Notification** | Notificación de tipo `CARD_ASSIGNED`, `CARD_DUE_SOON` o `PROJECT_INVITATION` para un usuario. |

---

## Endpoints de la API

Base URL: `http://localhost:3000/api`

### Auth

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Registrar nuevo usuario | No |
| `POST` | `/auth/login` | Iniciar sesión, devuelve JWT | No |
| `GET` | `/auth/me` | Obtener usuario autenticado | Sí |

### Proyectos

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/projects` | Crear proyecto | Sí |
| `GET` | `/projects` | Listar proyectos del usuario | Sí |
| `GET` | `/projects/:id` | Obtener proyecto por ID | Sí |
| `PUT` | `/projects/:id` | Actualizar proyecto | Sí |
| `DELETE` | `/projects/:id` | Eliminar proyecto | Sí |

### Miembros

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/projects/:id/members` | Listar miembros del proyecto | Sí |
| `POST` | `/projects/:id/members` | Invitar miembro (envía email) | Sí |
| `DELETE` | `/projects/:id/members/:memberId` | Remover miembro | Sí |

### Columnas

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/projects/:projectId/columns` | Crear columna | Sí |
| `GET` | `/projects/:projectId/columns` | Listar columnas con sus tarjetas | Sí |
| `PUT` | `/projects/:projectId/columns/reorder` | Reordenar columnas (bulk) | Sí |
| `PUT` | `/projects/:projectId/columns/:columnId` | Actualizar nombre de columna | Sí |
| `DELETE` | `/projects/:projectId/columns/:columnId` | Eliminar columna y sus tarjetas | Sí |

### Tarjetas

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/projects/:projectId/columns/:columnId/cards` | Crear tarjeta | Sí |
| `GET` | `/projects/:projectId/columns/:columnId/cards` | Listar tarjetas de una columna | Sí |
| `PUT` | `/projects/:projectId/columns/:columnId/cards/reorder` | Reordenar tarjetas (bulk) | Sí |
| `PUT` | `/projects/:projectId/columns/:columnId/cards/:cardId/move` | Mover tarjeta a otra columna | Sí |
| `PUT` | `/projects/:projectId/columns/:columnId/cards/:cardId` | Actualizar tarjeta | Sí |
| `DELETE` | `/projects/:projectId/columns/:columnId/cards/:cardId` | Eliminar tarjeta | Sí |

### Etiquetas

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/projects/:projectId/labels` | Crear etiqueta | Sí |
| `GET` | `/projects/:projectId/labels` | Listar etiquetas del proyecto | Sí |
| `DELETE` | `/projects/:projectId/labels/:labelId` | Eliminar etiqueta | Sí |
| `POST` | `/projects/:projectId/labels/cards/:cardId/labels` | Agregar etiqueta a tarjeta | Sí |
| `DELETE` | `/projects/:projectId/labels/cards/:cardId/labels/:labelId` | Quitar etiqueta de tarjeta | Sí |

### Comentarios

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/projects/:projectId/columns/:columnId/cards/:cardId/comments` | Listar comentarios | Sí |
| `POST` | `/projects/:projectId/columns/:columnId/cards/:cardId/comments` | Crear comentario | Sí |
| `PUT` | `/projects/:projectId/columns/:columnId/cards/:cardId/comments/:commentId` | Editar comentario | Sí |
| `DELETE` | `/projects/:projectId/columns/:columnId/cards/:cardId/comments/:commentId` | Eliminar comentario | Sí |

### Notificaciones

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `GET` | `/notifications/stream` | Conectar SSE para notificaciones en tiempo real | Sí |
| `GET` | `/notifications` | Listar notificaciones del usuario | Sí |
| `PUT` | `/notifications/read-all` | Marcar todas como leídas | Sí |
| `PUT` | `/notifications/:id/read` | Marcar una como leída | Sí |
| `DELETE` | `/notifications/clear` | Eliminar todas las notificaciones | Sí |

---

## Instalación y configuración local

### Requisitos previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) (PostgreSQL gratuito)
- Cuenta de Gmail con [App Password](https://myaccount.google.com/apppasswords) habilitada (o SendGrid)

### 1. Clonar el repositorio

```bash
git clone https://github.com/rafok69-2000/Ralus.git
cd Ralus
```

### 2. Configurar el backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores
```

### 3. Ejecutar migraciones

```bash
npx prisma migrate dev
```

### 4. Iniciar el backend

```bash
npm run dev
# Servidor en http://localhost:3000
```

### 5. Configurar el frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# Editar .env con tus valores
```

### 6. Iniciar el frontend

```bash
npm run dev
# App en http://localhost:5173
```

---

## Deploy en producción

El proyecto está desplegado con el siguiente stack:

| Servicio | Plataforma | URL |
|---|---|---|
| Frontend | Vercel | [ralus.vercel.app](https://ralus.vercel.app) |
| Backend | Railway | [ralus-production.up.railway.app](https://ralus-production.up.railway.app) |
| Base de datos | Supabase (PostgreSQL) | — |

### Variables de entorno en producción

**Railway (backend):**
```env
DATABASE_URL=     # Connection string de Supabase
JWT_SECRET=       # Cadena secreta para JWT
FRONTEND_URL=     # https://ralus.vercel.app
```

**Vercel (frontend):**
```env
VITE_API_URL=https://ralus-production.up.railway.app/api
```

---

## Variables de entorno (local)

### `backend/.env`

```env
DATABASE_URL=          # Connection string de Supabase (postgresql://...)
JWT_SECRET=            # Cadena secreta para firmar tokens JWT
PORT=3000              # Puerto del servidor (opcional, default 3000)
GMAIL_USER=            # Dirección de Gmail para enviar invitaciones
GMAIL_APP_PASSWORD=    # App Password de Google (no la contraseña normal)
FRONTEND_URL=http://localhost:5173  # URL del frontend (para links en emails)
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api  # URL base de la API
```

---

## Roles y permisos

### GlobalRole — rol del usuario en la plataforma

| Rol | Descripción |
|---|---|
| `USER` | Rol por defecto. Puede crear proyectos, gestionar los propios e interactuar con proyectos donde es miembro. |
| `ADMIN` | Rol de plataforma reservado para administración global (extensible). |

### ProjectRole — rol dentro de un proyecto específico

| Rol | Puede invitar miembros | Puede remover miembros | Puede editar columnas/tarjetas |
|---|---|---|---|
| `ADMIN` | Sí | Sí (excepto al dueño) | Sí |
| `MEMBER` | No | No | Sí |

El **dueño** del proyecto (`owner`) tiene permisos totales y no puede ser removido por nadie.

---

## Decisiones técnicas

**`"type": "module"` en el backend**
El backend usa ES Modules nativos (`import`/`export`) en lugar de CommonJS. Esto mantiene consistencia con el frontend (Vite/React), elimina la fricción entre sistemas de módulos y aprovecha las importaciones estáticas.

**`@hello-pangea/dnd` en lugar de `react-beautiful-dnd`**
`react-beautiful-dnd` fue discontinuado y no soporta React 18+. `@hello-pangea/dnd` es un fork activo mantenido por la comunidad, con API idéntica y soporte completo para React 19.

**Server-Sent Events (SSE) en lugar de WebSockets**
Las notificaciones en tiempo real requieren comunicación unidireccional servidor→cliente. SSE cubre este caso con menor complejidad que WebSockets, funciona sobre HTTP estándar, no requiere librerías adicionales y es compatible con el plan gratuito de Railway sin configuración especial.

**Rate limiting con express-rate-limit**
Se aplican límites diferenciados por endpoint: 100 peticiones/15min globalmente, 10 peticiones/15min en auth y 20 peticiones/hora en invitaciones. Protege contra fuerza bruta en login y abuso de invitaciones sin afectar el uso normal.

**Actualización optimista en drag & drop**
Al mover una tarjeta o columna, el estado local se actualiza inmediatamente sin esperar la respuesta del servidor. Si la petición falla, se revierte al estado anterior. Esto hace la UI percibida como instantánea.