# Ralus — Gestión de proyectos con tablero Kanban

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)

---

## Descripción general

**Ralus** es una aplicación web de gestión de proyectos con tablero Kanban. Permite a equipos organizar su trabajo en columnas y tarjetas, invitar colaboradores con roles diferenciados y mover tareas entre estados mediante drag & drop.

### Funcionalidades del MVP

- **Registro e inicio de sesión** — autenticación con JWT y contraseñas hasheadas con bcrypt
- **Gestión de proyectos** — crear, ver y eliminar proyectos personales y colaborativos
- **Tablero Kanban** — columnas ordenables con tarjetas dentro de cada una
- **Drag & drop** — reordenar tarjetas dentro de una columna y moverlas entre columnas
- **Miembros con roles** — invitar usuarios como `ADMIN` o `MEMBER` dentro de un proyecto
- **Notificación por correo** — el usuario invitado recibe un email al ser añadido al proyecto

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4, @hello-pangea/dnd |
| **Backend** | Node.js 18+, Express 5, JWT (jsonwebtoken), bcrypt, Nodemailer |
| **Base de datos** | PostgreSQL serverless (Neon), Prisma ORM 7 |

---

## Estructura del proyecto

```
Ralus/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Modelos de la base de datos
│   ├── src/
│   │   ├── controllers/        # Lógica de negocio por recurso
│   │   ├── middleware/         # authMiddleware (verificación JWT)
│   │   ├── routes/             # Definición de endpoints por recurso
│   │   ├── utils/              # password, token, mailer, sendInvitationEmail
│   │   ├── lib/prisma.js       # Instancia singleton de PrismaClient
│   │   └── index.js            # Entry point — Express app
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/                # Módulos Axios por recurso (projects, columns, cards, members)
    │   ├── components/         # Avatar, Button, Modal, MembersModal, PrivateRoute
    │   ├── context/            # AuthContext — estado global de autenticación
    │   ├── hooks/              # useAuth
    │   ├── pages/              # LoginPage, RegisterPage, DashboardPage, BoardPage
    │   └── App.jsx             # Rutas con React Router
    ├── .env.example
    └── package.json
```

---

## Modelo de base de datos

```
User ──< ProjectMember >── Project ──< Column ──< Card
```

| Modelo | Descripción |
|---|---|
| **User** | Usuario del sistema. Tiene un `GlobalRole` (`ADMIN` \| `USER`) y puede ser dueño de proyectos o miembro de ellos. |
| **Project** | Tablero/proyecto con nombre, descripción opcional y un `owner` (User). Tiene columnas y miembros. |
| **ProjectMember** | Relación usuario↔proyecto con `ProjectRole` (`ADMIN` \| `MEMBER`). Clave única compuesta `(userId, projectId)`. |
| **Column** | Columna dentro de un proyecto con `position` entero para mantener el orden. Cascade delete desde Project. |
| **Card** | Tarjeta dentro de una columna con título, descripción opcional, `position` y referencia al creador. Cascade delete desde Column. |

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

---

## Instalación y configuración local

### Requisitos previos

- Node.js 18+
- Cuenta en [Neon](https://neon.tech) (PostgreSQL serverless gratuito)
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

## Variables de entorno

### `backend/.env`

```env
DATABASE_URL=          # Connection string de Neon (postgresql://...)
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

**Neon como base de datos**
Neon provee PostgreSQL serverless con un tier gratuito generoso, conexión vía connection string estándar (compatible con Prisma sin configuración extra) y escalado automático. Elimina la necesidad de gestionar infraestructura de base de datos en el desarrollo inicial.

**Actualización optimista en drag & drop**
Al mover una tarjeta o columna, el estado local se actualiza inmediatamente sin esperar la respuesta del servidor. Si la petición falla, se revierte al estado anterior (`previousColumns`). Esto hace la UI percibida como instantánea, sin bloqueos ni parpadeos durante el arrastre.
