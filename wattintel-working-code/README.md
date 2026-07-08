# WattIntel – Smart Energy Intelligence Platform for MSMEs

## Run steps

### 1. MySQL
```sql
CREATE DATABASE wattintel_db;
```

Then run:
```bash
mysql -u root -p wattintel_db < database/schema.sql
mysql -u root -p wattintel_db < database/seed.sql
```

### 2. Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

Click **Simulate IoT Reading** to generate demo machine readings.
