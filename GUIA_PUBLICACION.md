# Hemeroteca Gamer: configuración y publicación

## 1. Configurar Supabase

El formulario **Pide una revista** inserta datos en `public.magazine_requests` y opcionalmente sube una imagen al bucket privado `requests`. El panel `/admin` lista las solicitudes para administradores autorizados.

En Supabase, abre **SQL Editor** y ejecuta `supabase-setup-requests.sql` (requiere que ya exista la función `public.has_role` definida en `drizzle/migrations/0000_migration.sql`). Si el proyecto Supabase está vacío, aplica primero la migración 0000. Comprueba que `requests` aparece en **Storage**, con límite de 5 MB, y que el usuario administrador tenga el rol `admin`. La solicitud no genera correos automáticos; se consulta en el panel administrador.

> Para evitar abuso, configura protección antispam, límites de peticiones y supervisión del almacenamiento antes de abrir el formulario a tráfico elevado. El acceso público de escritura a Storage y tabla requiere controles adicionales para un lanzamiento a gran escala.

## 2. Publicar en GitHub Pages

1. Crea un repositorio de GitHub, sube el contenido de este ZIP a la rama `main` (NO subas `.env`).
2. En el repositorio, entra a **Settings > Secrets and variables > Actions > Variables** y agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con la URL y clave *publicable* de tu Supabase. **Nunca uses `service_role` ni `sb_secret_`**.
3. En **Settings > Pages > Build and deployment > Source**, selecciona **GitHub Actions**.
4. Abre **Actions**, ejecuta `Publicar Hemeroteca Gamer` o haz push a `main`.
5. Visita `https://USUARIO.github.io/NOMBRE-REPOSITORIO/`.

El frontend usa rutas con hash para compatibilidad con Pages: `/#/contacto`, `/#/auth`, `/#/admin` (tras el prefijo del repositorio). Los enlaces internos se manejan automáticamente.

## 3. Compilar localmente

```bash
npm install
cp .env.example .env
# Edita .env con los valores públicos de Supabase
npm run build:pages
npm run dev # servidor original TanStack Start, no la compilación estática
```

Para comprobar el resultado estático usa `npx vite preview --config vite.pages.config.ts` después de compilar.

## 4. Verificación antes de lanzar

- Enviar petición solo texto y comprobar que aparece en **Admin > Peticiones**.
- Enviar otra petición con JPG/PNG menor de 5 MB y verificar imagen en panel.
- Probar un archivo no permitido y confirmar mensaje de validación.
- Abrir inicio, contacto, login y administración en la URL de GitHub Pages.
- Comprobar autenticación y políticas RLS de Supabase con cuenta administradora y visitante.

**Limitación:** GitHub Pages solo sirve archivos estáticos. Supabase debe estar activo y accesible por HTTPS. No se ha publicado en tu cuenta ni se han aplicado migraciones en tu base de datos.
