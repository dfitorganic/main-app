# AdCart - Full Stack Ecommerce

AdCart is a full stack ecommerce app with:
- Django REST backend
- React + Vite + Tailwind frontend
- JWT auth
- Cart and checkout flow
- Customer order history
- Seller product management UI
- Django admin panel for operations

## Tech Stack
- Backend: Django, Django REST Framework, SimpleJWT, WhiteNoise
- Frontend: React, Vite, Tailwind CSS
- Database: SQLite (local) / PostgreSQL (production)

## Project Structure
```text
Ecommerce-Full-Stack/
  backend/
    backend/            # Django project settings
    store/              # Ecommerce app (models, APIs, admin)
    manage.py
    requirements.txt
  frontend/
    src/
    package.json
  DEPLOYMENT.md
```

## Features
- Auth: signup, login, JWT token refresh
- Catalog: product list, search, sort, category filter
- Product details with add-to-cart
- Cart management: add/remove/update quantity
- Checkout and order creation
- My Orders page for customers
- Seller/Admin product manager in React (`/admin/products`)
- Django admin for full backend control (`/admin`)

## Local Setup

## 1) Open the project
Open this project folder in your editor, then run the setup commands below.

## 2) Backend setup
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` inside `backend/` (or copy from `.env.example`):
```env
DEBUG=True
SECRET_KEY=dev-secret-key
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

Run migrations + superuser:
```bash
python manage.py migrate
python manage.py createsuperuser
```

Start backend:
```bash
python manage.py runserver
```

Backend URLs:
- API root: `http://127.0.0.1:8000/api/`
- Django admin: `http://127.0.0.1:8000/admin/`

## 3) Frontend setup
Open new terminal:
```bash
cd frontend
npm install
```

Create `.env` inside `frontend/` (or copy from `.env.example`):
```env
VITE_DJANGO_BASE_URL=http://127.0.0.1:8000
```

Start frontend:
```bash
npm run dev
```

Frontend URL:
- App: `http://localhost:5173/`

## Seller/Admin Access
- Login with staff/superuser account.
- Seller UI route: `http://localhost:5173/admin/products`
- Only staff users can access backend seller APIs.

## Deployment
Use `DEPLOYMENT.md` for production setup.

Quick notes:
- Set `DEBUG=False`
- Use PostgreSQL via `DATABASE_URL`
- Set secure env vars: `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`

## Useful Commands
Backend:
```bash
python manage.py check
python manage.py test
python manage.py changepassword <username>
```

Frontend:
```bash
npm run lint
npm run build
```

## Troubleshooting
- If admin page looks unstyled, ensure backend `DEBUG=True` in local and hard refresh.
- If `localhost` behaves oddly on Windows, prefer `127.0.0.1` URLs.

## License
This project is for learning and portfolio use. Add your preferred license if publishing publicly.
