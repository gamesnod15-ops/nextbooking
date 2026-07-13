# RandevumKolay

Turkiye pazari icin cok kiracili SaaS randevu platformu.

## Uygulama Ayrimi

- `frontend/bussines-panel`: Isletme Paneli (`Business Panel`) - `http://localhost:3000`
- `frontend/apps/web`: Marketing Web - `http://localhost:3004`

## Domain Ayrimi

- `randevumkolay.com` ve `www.randevumkolay.com` -> Marketing Web
- `business.randevumkolay.com` -> Isletme Paneli

## Gelistirme

1. Altyapi:
```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

2. API:
```bash
cd src/API/RandevumKolay.API
dotnet run
```

3. Isletme Paneli:
```bash
cd frontend/bussines-panel
npm install
npm run dev
```

4. Marketing Web:
```bash
cd frontend/apps/web
npm install
npm run dev
```
