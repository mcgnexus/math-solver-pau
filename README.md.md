# 📐 Solucionador Matemático PAU - DeepSeek

Aplicación web para resolver derivadas e integrales paso a paso, diseñada para estudiantes de 2º de Bachillerato preparando la PAU/Selectividad.

## 🚀 Características

- ✅ **Cálculo de derivadas e integrales** con explicaciones paso a paso
- ✅ **Notación LaTeX** renderizada profesionalmente con KaTeX
- ✅ **Interfaz moderna y responsive** con animaciones suaves
- ✅ **Ejemplos rápidos** para facilitar el uso
- ✅ **Caché inteligente** para respuestas instantáneas
- ✅ **Rate limiting** para proteger la API
- ✅ **Manejo robusto de errores** con reintentos automáticos

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Renderizado matemático**: KaTeX
- **Backend**: Node.js (Vercel Functions)
- **IA**: DeepSeek API
- **Hosting**: Vercel

## 📦 Instalación

### Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- API Key de [DeepSeek](https://platform.deepseek.com)
- Git

### Pasos de instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/math-solver-pau.git
cd math-solver-pau
```

2. **Estructura de archivos**
```
math-solver-pau/
├── api/
│   ├── deepseek.js         # Función serverless principal
│   └── _middleware.js      # Middleware de rate limiting (opcional)
├── public/
│   └── index.html          # Aplicación web
├── vercel.json             # Configuración de Vercel
└── README.md
```

3. **Configurar Vercel**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Iniciar sesión
vercel login

# Desplegar
vercel
```

4. **Configurar variables de entorno**
```bash
# En el dashboard de Vercel o usando CLI
vercel env add DEEPSEEK_API_KEY production
# Pega tu API key cuando se solicite
```

## 🔧 Configuración

### Variables de entorno necesarias

- `DEEPSEEK_API_KEY`: Tu API key de DeepSeek

### Personalización

Puedes modificar los siguientes aspectos en `api/deepseek.js`:

- **Rate limiting**: Ajusta `maxRequests` y `windowMs`
- **Timeout**: Modifica el tiempo máximo de espera (línea 24)
- **Tokens máximos**: Cambia `max_tokens` en la llamada a la API
- **Temperatura**: Ajusta `temperature` para mayor/menor creatividad

## 🚀 Uso

1. **Accede a tu aplicación** en `https://tu-proyecto.vercel.app`
2. **Introduce una función matemática** (ej: `x^2 + 3x - 5`)
3. **Selecciona la operación** (Derivada o Integral)
4. **Haz clic en "Resolver"**
5. **Visualiza la solución** paso a paso con notación matemática

### Ejemplos de funciones soportadas

- Polinomios: `x^3 + 2x^2 - 5x + 1`
- Trigonométricas: `sin(x) * cos(x)`
- Exponenciales: `e^(2x)`
- Logarítmicas: `ln(x^2 + 1)`
- Raíces: `sqrt(x)` o `x^(1/2)`
- Fracciones: `1/(x^2 + 1)`

## 🔒 Seguridad

### Características implementadas

- ✅ **API Key segura** en variables de entorno
- ✅ **Sanitización de entrada** para prevenir inyecciones
- ✅ **Rate limiting** por IP
- ✅ **Validación de datos** en cliente y servidor
- ✅ **CORS configurado** correctamente
- ✅ **Timeout protection** para evitar solicitudes colgadas

### Recomendaciones adicionales

1. **Monitoreo**: Activa los logs en Vercel para supervisar el uso
2. **Límites de API**: Configura límites en tu cuenta de DeepSeek
3. **Backup**: Considera tener una API key de respaldo
4. **Analytics**: Añade Google Analytics o similar para tracking

## 📊 Límites y consideraciones

### Plan gratuito de Vercel
- Timeout máximo: 10 segundos
- Bandwidth: 100GB/mes
- Invocaciones: 100,000/mes

### DeepSeek API
- Verifica los límites de tu plan
- Considera implementar un sistema de créditos para usuarios

## 🐛 Solución de problemas

### Error 429 (Too Many Requests)
- El rate limiting está activo
- Espera el tiempo indicado antes de reintentar

### Error 504 (Timeout)
- La función es demasiado compleja
- Intenta simplificarla o dividirla

### LaTeX no se renderiza
- Verifica que KaTeX esté cargando correctamente
- Revisa la consola del navegador

## 📝 Mejoras futuras

- [ ] Historial de cálculos
- [ ] Exportar a PDF
- [ ] Modo oscuro
- [ ] Gráficas de funciones
- [ ] Ejercicios de práctica
- [ ] Sistema de usuarios
- [ ] API para desarrolladores

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Contacto

Tu Nombre - [@tu-twitter](https://twitter.com/tu-twitter)

Link del proyecto: [https://github.com/tu-usuario/math-solver-pau](https://github.com/tu-usuario/math-solver-pau)

## 🙏 Agradecimientos

- [DeepSeek](https://deepseek.com) por la potente API de IA
- [KaTeX](https://katex.org) por el renderizado de LaTeX
- [Vercel](https://vercel.com) por el hosting gratuito
- Comunidad educativa por el feedback