# Gaming Club — система бронирования

MVP системы онлайн-бронирования мест для игрового клуба. Админ-панель: календарь броней, управление бронями, местами, категориями, комнатами и клиентами.

## Стек

- **Next.js 16** (App Router, TypeScript) + Tailwind CSS
- **PostgreSQL** (Neon) + Prisma 7
- Деплой: **Vercel**

## Запуск локально

```bash
npm install
cp .env.example .env   # заполнить DATABASE_URL и остальные переменные
npx prisma migrate deploy
npm run db:seed        # тестовые данные
npm run dev
```

Админ-панель: `http://localhost:3000/admin` (логин/пароль из `.env`).

## Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | Строка подключения Neon Postgres |
| `ADMIN_USERNAME` | Логин администратора |
| `ADMIN_PASSWORD` | Пароль администратора |
| `SESSION_SECRET` | Случайная строка 32+ символов для подписи cookie |

## Защита от двойных броней

Пересечение активных броней по одному месту запрещено на уровне БД
(exclusion constraint `no_overlapping_active_bookings`, расширение `btree_gist`) —
плюс дружелюбная проверка на уровне приложения.
