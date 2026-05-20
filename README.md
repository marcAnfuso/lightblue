# lightblue

una paginita para Cele.

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind v3 + Motion (framer-motion)
- Vercel Blob para guardar mensajitos y fotos
- jose para cookie firmada (HS256)

## Levantarlo local

```bash
cp .env.example .env.local
# editar .env.local con los valores reales
npm install
npm run dev
```

Sin `BLOB_READ_WRITE_TOKEN`, la home renderiza pero el upload va a fallar.
Para probar el blob en local se puede correr `vercel env pull` después de linkear el proyecto.

## Deploy en Vercel

1. Crear repo nuevo en GitHub y pushear este código.
2. En Vercel: `Add New Project` → importar el repo.
3. En `Storage` → crear un Blob store y conectarlo al proyecto (setea `BLOB_READ_WRITE_TOKEN` solo).
4. Setear env vars manuales:
   - `UNLOCK_PASSWORD=botella`
   - `AUTH_SECRET=<string random de 32+ chars>`
5. Deploy.

## Cómo funciona

- `middleware.ts` redirige a `/unlock` cualquier ruta sin cookie válida.
- `/unlock` recibe la clave; si matchea `UNLOCK_PASSWORD` (case-insensitive, trim) setea cookie JWT firmada por 60 días.
- Los posts se guardan como blobs públicos en `posts/`:
  - `posts/{timestamp}.json` con `{ author, createdAt, text?, imageUrl? }`
  - `posts/img-{timestamp}.{ext}` el binario de la imagen (si aplica)
- La home lista todos los `.json` y los renderiza ordenados por fecha desc.

## Límites conocidos

- Upload de imágenes hasta 4MB (límite de body en Vercel functions). Para más grandes habría que migrar a `@vercel/blob/client`.
- Las URLs de los blobs son públicas (cualquiera con la URL puede ver la imagen). La protección es por obscuridad: nadie va a adivinar la URL exacta. Si querés algo más cerrado, hay que usar blobs `private` con signed URLs.
