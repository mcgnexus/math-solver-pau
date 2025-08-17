// api/deepseek.js - Función serverless mejorada para DeepSeek
export default async function handler(req, res) {
    // Configurar CORS primero
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Método no permitido. Use POST.' 
        });
    }

    // Configurar timeout (Vercel tiene límite de 10s para el plan gratuito)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try {
        const { prompt } = req.body;

        // Validación de entrada
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ 
                success: false,
                error: 'Prompt requerido y debe ser texto' 
            });
        }

        // Sanitizar y validar el prompt
        const sanitizedPrompt = sanitizePrompt(prompt);
        
        if (sanitizedPrompt.length > 500) {
            return res.status(400).json({ 
                success: false,
                error: 'El prompt es demasiado largo (máximo 500 caracteres)' 
            });
        }

        // Verificar API key
        if (!process.env.DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY no configurada');
            return res.status(500).json({ 
                success: false,
                error: 'Error de configuración del servidor' 
            });
        }

        // Log para debugging (sin exponer información sensible)
        console.log('Procesando solicitud:', {
            promptLength: sanitizedPrompt.length,
            timestamp: new Date().toISOString()
        });

        // Llamar a DeepSeek API con timeout
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: `Eres un experto en matemáticas para estudiantes de 2º bachillerato preparando la PAU/Selectividad. 

INSTRUCCIONES DE FORMATO:
1. Mantén respuestas cortas y directas: simplifica explicaciones al mínimo esencial
2. Usa notación matemática LaTeX para fórmulas (envuelve en $ para inline o $$ para display)
3. Después de cada LaTeX, proporciona equivalente en texto natural entre paréntesis
4. Para derivadas e integrales: refleja pasos clave de resolución de forma concisa
5. Estructura: Problema → Pasos numerados → Solución final
6. Lenguaje accesible y motivador
7. Incluye verificación cuando sea relevante

FORMATO DE PASOS:
- Paso 1: [Identificar tipo de función]
- Paso 2: [Aplicar regla correspondiente]
- Paso 3: [Simplificar resultado]
- Resultado final: [Respuesta simplificada]

Ejemplo: "Para $f(x)=x^2$, su derivada es $f'(x)=2x$ (dos equis)"

IMPORTANTE: Si la función no es válida o no se puede resolver, explícalo claramente.`
                    },
                    {
                        role: 'user',
                        content: sanitizedPrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 800,
                stream: false
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        // Verificar respuesta HTTP
        if (!response.ok) {
            const errorData = await response.text();
            console.error('DeepSeek API error:', response.status, errorData);
            
            // Manejar errores específicos
            if (response.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'Límite de solicitudes excedido. Intente más tarde.'
                });
            }
            
            if (response.status === 401) {
                return res.status(500).json({
                    success: false,
                    error: 'Error de autenticación con el servicio'
                });
            }
            
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Validar respuesta
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Respuesta inválida de la API');
        }

        const resultado = data.choices[0].message.content.trim();
        
        // Verificar que hay contenido en la respuesta
        if (!resultado) {
            throw new Error('Respuesta vacía de la API');
        }
        
        // Log exitoso
        console.log('Solicitud procesada exitosamente:', {
            tokens: data.usage?.total_tokens || 0,
            timestamp: new Date().toISOString()
        });
        
        return res.status(200).json({
            success: true,
            resultado: resultado,
            tokens: data.usage?.total_tokens || 0,
            modelo: 'DeepSeek V3',
            processingTime: data.usage?.completion_tokens ? 
                `~${Math.round(data.usage.completion_tokens / 10)}s` : 'N/A'
        });

    } catch (error) {
        clearTimeout(timeout);
        
        // Manejar diferentes tipos de errores
        if (error.name === 'AbortError') {
            console.error('Timeout en la solicitud');
            return res.status(504).json({
                success: false,
                error: 'La solicitud tardó demasiado tiempo. Intente con una función más simple.'
            });
        }
        
        console.error('Error procesando solicitud:', {
            message: error.message,
            timestamp: new Date().toISOString()
        });
        
        return res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud. Por favor, intente nuevamente.'
        });
    }
}

// Función para sanitizar el prompt
function sanitizePrompt(prompt) {
    // Eliminar caracteres de control y normalizar espacios
    let sanitized = prompt
        .replace(/[\x00-\x1F\x7F]/g, '') // Eliminar caracteres de control
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
    
    // Limitar longitud
    if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 500);
    }
    
    return sanitized;
}

// Configuración para Vercel
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '1mb',
        },
        responseLimit: false,
    },
    maxDuration: 10, // Máximo 10 segundos para el plan gratuito
};