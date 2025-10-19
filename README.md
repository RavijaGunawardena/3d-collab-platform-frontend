# 3D Collaborative Project Platform

A real-time 3D collaborative platform built with React, TypeScript, Three.js, and Socket.IO. Multiple users can view, manipulate 3D models, add annotations, and chat in real-time.

## 🚀 Features

### Core Functionality
- ✅ **Real-time Collaboration** - Multiple users can work simultaneously
- ✅ **3D Model Management** - Add, transform, and manage 3D primitives
- ✅ **Annotations System** - Click-to-place annotations in 3D space
- ✅ **Live Chat** - Real-time messaging with typing indicators
- ✅ **Camera Synchronization** - See where other users are looking
- ✅ **Project Management** - Create, view, and share projects
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

### 3D Viewer
- **Camera Controls**: Pan, zoom, rotate with mouse/touch
- **5 Primitive Models**: Box, Sphere, Cylinder, Cone, Torus
- **Transform Controls**: Move models with visual gizmos
- **Color Customization**: 8 presets + custom color picker
- **Visibility Toggle**: Show/hide models
- **Real-time Shadows**: Dynamic shadow rendering
- **Grid Helper**: Spatial reference grid

### Annotations
- **Click-to-Place**: Click anywhere in 3D space
- **3D Markers**: Floating spheres with text labels
- **Color-coded**: 10 color presets + custom
- **Hover Effects**: Interactive highlighting
- **Visibility Control**: Toggle annotation display
- **Auto-refresh**: Updates every 5 seconds

### Chat
- **Real-time Messages**: Instant delivery via Socket.IO
- **Typing Indicators**: See who's typing
- **Message History**: Last 50 messages loaded
- **System Notifications**: User join/leave alerts
- **Auto-scroll**: To latest messages
- **Character Limit**: Up to 1000 characters

## 📋 Prerequisites

- Node.js 22.x or higher
- npm or yarn
- Backend server running (see backend setup)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000
VITE_API_VERSION=v1
VITE_SOCKET_URL=http://localhost:5000
VITE_ENABLE_LOGGING=true
VITE_ENABLE_DEBUG=false
```

**Environment Variables:**
- `VITE_API_URL` - Backend API base URL
- `VITE_API_VERSION` - API version (default: v1)
- `VITE_SOCKET_URL` - Socket.IO server URL
- `VITE_ENABLE_LOGGING` - Enable console logging (true/false)
- `VITE_ENABLE_DEBUG` - Enable debug mode (true/false)

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Build for Production

```bash
npm run build
```

Build output will be in the `dist` directory.

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── auth/         # Authentication components
│   │   ├── projects/     # Project management
│   │   ├── ui/           # shadcn/ui components
│   │   └── viewer/       # 3D viewer components
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── pages/            # Page components
│   ├── services/         # API services
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   ├── validators/       # Zod validation schemas
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── .env                  # Environment variables
├── .env.example          # Environment template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Vite config
└── tailwind.config.js    # Tailwind CSS config
```

## 🎮 Usage Guide

### Login
1. Navigate to `/login`
2. Enter a username (2-50 characters, alphanumeric + underscore/hyphen)
3. Example usernames: `alice`, `bob123`, `engineer_1`

### Create Project
1. Click **"New Project"** button
2. Enter project title and description (optional)
3. Click **"Create Project"**
4. You'll be redirected to the 3D viewer

### Add Models
1. Click the **blue "+" button** (bottom-right)
2. Choose geometry type (Box, Sphere, etc.)
3. Enter model name
4. Select color
5. Click **"Add Model"**

### Transform Models
1. Click **layers button** to open model list
2. Click on a model to select it
3. Drag the transform gizmo to move the model
4. Changes auto-save to backend

### Add Annotations
1. Click **"Add Annotation"** in right panel
2. Cursor changes to crosshair
3. Click anywhere in 3D space
4. Enter annotation text
5. Choose color
6. Click **"Create Annotation"**

### Chat
1. Type message in chat input (left panel)
2. Press **Enter** to send
3. See real-time messages from other users
4. Typing indicators show active users

### Camera Controls
- **Rotate**: Left-click and drag
- **Pan**: Right-click and drag (or two-finger drag on mobile)
- **Zoom**: Scroll wheel (or pinch on mobile)

## 🔧 Technologies

### Frontend Stack
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Zustand** - State management
- **Three.js** - 3D rendering
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Three.js helpers
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **shadcn/ui** - UI components
- **Tailwind CSS v4** - Styling
- **Sonner** - Toast notifications
- **Lucide React** - Icons

## 📡 API Integration

### REST Endpoints

**Authentication**
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

**Projects**
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PUT /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

**Models**
- `POST /api/v1/projects/:id/models` - Add model
- `PUT /api/v1/projects/:id/models/:modelId` - Update model
- `DELETE /api/v1/projects/:id/models/:modelId` - Delete model

**Annotations**
- `GET /api/v1/annotations/project/:projectId` - List annotations
- `POST /api/v1/annotations` - Create annotation
- `PUT /api/v1/annotations/:id` - Update annotation
- `DELETE /api/v1/annotations/:id` - Delete annotation

**Chat**
- `GET /api/v1/chat/projects/:projectId/recent` - Get messages
- `POST /api/v1/chat/messages` - Send message

### Socket.IO Events

**Project Events**
- `project:join` - Join project room
- `project:leave` - Leave project room
- `project:user-joined` - User joined notification
- `project:user-left` - User left notification

**Camera Events**
- `camera:update` - Broadcast camera position
- `camera:updated` - Receive camera updates

**Annotation Events**
- `annotation:create` - Create annotation
- `annotation:created` - Annotation created notification
- `annotation:update` - Update annotation
- `annotation:updated` - Annotation updated notification
- `annotation:delete` - Delete annotation
- `annotation:deleted` - Annotation deleted notification

**Chat Events**
- `chat:message` - Send message
- `chat:typing` - Typing indicator

## 🧪 Development

### Code Quality
- ESLint for linting
- TypeScript strict mode
- Prettier for formatting (recommended)

### Best Practices
- Component-based architecture
- Type-safe throughout
- Custom hooks for reusability
- Service layer for API calls
- Error boundaries for error handling
- Loading states for async operations
- Toast notifications for user feedback

## 🚀 Deployment

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Deploy

The `dist` folder can be deployed to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- DigitalOcean App Platform
- Railway
- Render

### Example: Vercel Deployment

```bash
npm install -g vercel
vercel --prod
---

**Built with ❤️ using React, TypeScript, and Three.js**
