# Deployment Guide

## 1. Architecture
- Backend: Django API (`backend/`)
- Frontend: React + Vite (`frontend/`)
- Recommended: Deploy backend on Render/Railway and frontend on Netlify/Vercel.

## 2. Backend Deployment (Render example)

### Build/Start
- Build Command:
```bash
cd backend && pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate
```
- Start Command:
```bash
cd backend && gunicorn backend.wsgi:application
```

### Required Environment Variables
Set these in your backend hosting dashboard:

```env
DEBUG=False
SECRET_KEY=<strong-random-secret>
ALLOWED_HOSTS=<your-backend-domain>
DATABASE_URL=<postgres-connection-url>
CORS_ALLOWED_ORIGINS=<your-frontend-domain>
CSRF_TRUSTED_ORIGINS=<your-frontend-domain>
```

Examples:
- `ALLOWED_HOSTS=myapp-backend.onrender.com`
- `CORS_ALLOWED_ORIGINS=https://myapp.netlify.app`
- `CSRF_TRUSTED_ORIGINS=https://myapp.netlify.app`

## 3. Frontend Deployment (Netlify example)

### Build Settings
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

### Required Environment Variable
```env
VITE_DJANGO_BASE_URL=https://<your-backend-domain>
```

Example:
```env
VITE_DJANGO_BASE_URL=https://myapp-backend.onrender.com
```

## 4. Post-Deploy Checklist
- Backend health:
  - `https://<backend-domain>/api/`
- Frontend loads:
  - `https://<frontend-domain>/`
- Login/register works.
- Product list loads from deployed backend.
- Seller page (`/admin/products`) works only for staff user.
- Django admin works:
  - `https://<backend-domain>/admin/`

## 5. Create Superuser on Hosted Backend
Run once in backend shell/console:
```bash
python manage.py createsuperuser
```

## 6. Notes
- Keep `DEBUG=False` in production.
- Do not use SQLite for production; use Postgres via `DATABASE_URL`.
- Uploaded media (`/media/`) needs persistent storage in production (object storage/CDN recommended).
