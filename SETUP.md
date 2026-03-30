# Thulirinfo Tech — Invoice Management System

## Project Structure

```
Invoice/
├── backend/                  # Django + DRF backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── thulirinfo/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── invoices/
│       ├── models.py          # Client, Service, Invoice, InvoiceItem
│       ├── serializers.py     # DRF serializers with validation
│       ├── views.py           # ViewSets + dashboard stats
│       ├── urls.py            # Router-based URL config
│       ├── pdf_generator.py   # ReportLab PDF generation
│       ├── admin.py
│       └── management/
│           └── commands/
│               └── seed_services.py
└── frontend/                 # React + Vite + Tailwind
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── context/
        │   └── AppContext.jsx     # Auth + dark mode + sidebar state
        ├── services/
        │   └── api.js             # Axios client + all API functions
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   ├── Navbar.jsx
        │   ├── StatusBadge.jsx
        │   ├── ConfirmModal.jsx
        │   └── Spinner.jsx
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Clients.jsx
            ├── CreateInvoice.jsx
            ├── EditInvoice.jsx
            ├── InvoiceList.jsx
            └── InvoicePreview.jsx
```

---

## Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

---

### Backend Setup

```bash
cd backend

# 1. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# 4. Create PostgreSQL database
# In psql or pgAdmin:
# CREATE DATABASE thulirinfo_db;

# 5. Run migrations
python manage.py migrate

# 6. Create superuser (for admin panel + JWT login)
python manage.py createsuperuser

# 7. Seed default services
python manage.py seed_services

# 8. Run the server
python manage.py runserver
```

Backend will be available at: http://localhost:8000
Admin panel: http://localhost:8000/admin/

---

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8000

# 3. Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

---

## API Endpoints

### Authentication
```
POST /api/token/          → Get access + refresh tokens
POST /api/token/refresh/  → Refresh access token
```

### Clients
```
GET    /api/clients/              → List all clients (search, ordering)
POST   /api/clients/              → Create client
GET    /api/clients/{id}/         → Get client detail
PUT    /api/clients/{id}/         → Update client
DELETE /api/clients/{id}/         → Delete client
GET    /api/clients/{id}/invoices/ → Client's invoices
GET    /api/clients/stats/        → Client statistics
```

### Invoices
```
GET    /api/invoices/                      → List invoices (filter, search)
POST   /api/invoices/                      → Create invoice + generate PDF
GET    /api/invoices/{id}/                 → Get invoice detail
PUT    /api/invoices/{id}/                 → Update invoice
DELETE /api/invoices/{id}/                 → Delete invoice
POST   /api/invoices/{id}/mark_paid/       → Mark as paid
POST   /api/invoices/{id}/mark_unpaid/     → Mark as unpaid
POST   /api/invoices/{id}/regenerate_pdf/  → Regenerate PDF
GET    /api/invoices/dashboard_stats/      → Dashboard statistics
```

### Services
```
GET    /api/services/     → List services
POST   /api/services/     → Create service
PUT    /api/services/{id}/ → Update service
```

---

## Sample API Request — Create Invoice

### Request
```json
POST /api/invoices/
Authorization: Bearer <token>
Content-Type: application/json

{
  "client": 1,
  "issue_date": "2026-03-28",
  "due_date": "2026-04-27",
  "tax_percentage": 18,
  "discount": 500,
  "status": "unpaid",
  "notes": "Payment via bank transfer. IFSC: HDFC0001234",
  "items": [
    {
      "service_name": "Web Development",
      "description": "5-page responsive website with CMS",
      "quantity": 1,
      "price": 15000
    },
    {
      "service_name": "UI/UX Design",
      "description": "Wireframes and final design mockups",
      "quantity": 1,
      "price": 8000
    }
  ]
}
```

### Response
```json
{
  "id": 1,
  "invoice_number": "TTI-2026-001",
  "client": 1,
  "client_name": "Rajesh Kumar",
  "client_company": "RK Enterprises",
  "client_email": "rajesh@rkenterprises.com",
  "issue_date": "2026-03-28",
  "due_date": "2026-04-27",
  "subtotal": "23000.00",
  "tax_percentage": "18.00",
  "tax_amount": "4140.00",
  "discount": "500.00",
  "total_amount": "26640.00",
  "status": "unpaid",
  "notes": "Payment via bank transfer. IFSC: HDFC0001234",
  "pdf_url": "http://localhost:8000/media/invoices/TTI-2026-001.pdf",
  "items": [
    {
      "id": 1,
      "service_name": "Web Development",
      "description": "5-page responsive website with CMS",
      "quantity": "1.00",
      "price": "15000.00",
      "total": "15000.00"
    },
    {
      "id": 2,
      "service_name": "UI/UX Design",
      "description": "Wireframes and final design mockups",
      "quantity": "1.00",
      "price": "8000.00",
      "total": "8000.00"
    }
  ],
  "created_at": "2026-03-28T10:30:00Z"
}
```

---

## Deployment

### Backend — Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
   - **Start Command:** `gunicorn thulirinfo.wsgi:application`
4. Add Environment Variables:
   ```
   SECRET_KEY=<generate-a-strong-secret>
   DEBUG=False
   DATABASE_URL=<render-postgresql-url>
   ALLOWED_HOSTS=your-app.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
5. Add a **PostgreSQL** database on Render and link it

### Frontend — Vercel

1. Import your GitHub repository on Vercel
2. Set **Root Directory** to `frontend`
3. Add Environment Variable:
   ```
   VITE_API_BASE_URL=https://your-backend.onrender.com
   ```
4. Deploy

---

## Features

- JWT authentication with auto token refresh
- Multi-client management with search
- Create invoices with dynamic line items
- Auto invoice number generation (TTI-2026-001)
- Auto-calculate subtotal, GST, discount, grand total
- Professional A4 PDF generation via ReportLab
- PDF auto-download on invoice creation
- Invoice status: Paid / Unpaid / Overdue / Cancelled
- Dashboard with revenue stats and charts
- Filter invoices by client, status, date range
- Dark / Light mode
- Fully responsive UI
- Edit and regenerate PDF
- Client invoice history
