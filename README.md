# MyS Sites — Certificación de Ventas

App interna de MyS Sites para el programa de certificación de vendedores por comisión: curso de 8 días con simulador de ventas, examen en dos partes, asignación y reasignación automática de prospectos, flujo de pago anti-fraude, y panel de administrador cruzado con el Mapa de Prospectos.

Contexto completo del programa: `wiki/negocio/Negocio Index.md` en el vault de Santiago, sección "Certificación de Ventas". Spec técnico: `Handoff.md` en la raíz del vault.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Supabase (Auth con Google OAuth, Postgres con RLS, Storage, Edge Functions, pg_cron)
- Groq (Llama 3.3 70B, free tier) para el simulador y el coach del examen
- Resend para correos transaccionales
- Deploy en Vercel

## Desarrollo local

```bash
npm install
npm run dev
```

Requiere `.env.local` con las variables de Supabase y Groq (ver `.env.example`).

