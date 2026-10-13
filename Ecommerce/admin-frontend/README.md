# D'FIT Admin Frontend

Standalone React/Vite admin application for the D'FIT catalog.

## Run locally

From this directory:

```bash
npm install
npm run dev
```

The admin app runs at `http://127.0.0.1:5174/` and uses the shared Django API at `http://127.0.0.1:8000/`.

The signed-in account must be a Django staff user or superuser. Product reads and writes use:

- `GET /api/admin/products/`
- `POST /api/admin/products/`
- `PATCH /api/admin/products/:id/`
- `DELETE /api/admin/products/:id/`
- `POST /api/token/`
- `GET /api/me/`

The customer storefront remains in `frontend/` and runs separately on port `5173`.