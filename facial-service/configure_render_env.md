# Configurar Variables de Entorno en Render

Tu backend está desplegado en **Render** (`https://proyecto-2-olvb.onrender.com`). Para que use el servicio facial en Azure, necesitas configurar la variable de entorno en Render.

## Pasos para Configurar en Render

### 1. Accede al Dashboard de Render

1. Ve a [https://dashboard.render.com](https://dashboard.render.com)
2. Inicia sesión con tu cuenta
3. Busca tu servicio backend (probablemente llamado `proyecto-2-olvb` o similar)

### 2. Configura la Variable de Entorno

1. En el dashboard de tu servicio, ve a la sección **"Environment"** o **"Environment Variables"**
2. Haz clic en **"Add Environment Variable"** o **"Add Variable"**
3. Agrega:
   - **Key:** `DEEPFACE_SERVICE_URL`
   - **Value:** `http://facial-service-ervin.brazilsouth.azurecontainer.io:5001`
4. Guarda los cambios

### 3. Reinicia el Servicio

Después de agregar la variable:
1. Ve a la sección **"Manual Deploy"** o **"Deploy"**
2. Haz clic en **"Clear build cache & deploy"** o simplemente **"Deploy"**
3. Esto reiniciará el servicio con la nueva variable de entorno

## Verificar que Funciona

Después de reiniciar, puedes verificar que funciona:

```bash
# Desde tu máquina local
curl https://proyecto-2-olvb.onrender.com/api/health
```

O prueba el endpoint de reconocimiento facial desde tu aplicación.

## Variables de Entorno que Debes Tener en Render

Basándote en tu `.env` local, estas son las variables que deberías tener en Render:

```env
# Puerto (Render lo asigna automáticamente, pero puedes configurarlo)
PORT=5000

# API Keys (reemplaza con tus propias keys)
GROQ_API_KEY=tu_groq_api_key_aqui
GROQ_MODEL=llama-3.1-8b-instant
ASSEMBLYAI_API_KEY=tu_assemblyai_api_key_aqui
AZURE_API_KEY=tu_azure_api_key_aqui
AZURE_ENDPOINT=https://brazilsouth.tts.speech.microsoft.com/
AZURE_TTS_REGION=brazilsouth

# Servicio Facial en Azure (NUEVA - IMPORTANTE)
DEEPFACE_SERVICE_URL=http://facial-service-ervin.brazilsouth.azurecontainer.io:5001

# Firebase (si usas SERVICE_ACCOUNT_KEY como variable de entorno)
# SERVICE_ACCOUNT_KEY={...tu JSON aquí...}
```

**⚠️ IMPORTANTE:** Reemplaza los valores `tu_*_aqui` con tus propias API keys desde tu archivo `.env` local. **NUNCA** subas tus API keys reales a Git.

## Nota Importante

- **NO** subas el archivo `.env` a Git (ya está en `.gitignore`)
- Las variables de entorno en Render son **secretas** y no se muestran en los logs
- Cada vez que cambies una variable, **debes reiniciar** el servicio

## Alternativa: Usar Render CLI

Si tienes Render CLI instalado, puedes configurarlo desde la terminal:

```bash
# Instalar Render CLI
npm install -g render-cli

# Autenticarte
render login

# Configurar variable de entorno
render env:set DEEPFACE_SERVICE_URL=http://facial-service-ervin.brazilsouth.azurecontainer.io:5001
```

Pero la forma más fácil es usar el dashboard web.

