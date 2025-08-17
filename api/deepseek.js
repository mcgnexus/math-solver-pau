// api/deepseek.js - Versión optimizada para evitar timeouts
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Manejar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            error: 'Método no permitido' 
        });
    }

    try {
        const { prompt } = req.body;

        // Validación básica
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ 
                success: false,
                error: 'Prompt requerido' 
            });
        }

        // TEST: Si el usuario escribe "test", verificar configuración
        if (prompt.toLowerCase() === 'test') {
            return res.status(200).json({
                success: true,
                resultado: `✅ Conexión exitosa!\n\nAPI Key configurada: ${!!process.env.DEEPSEEK_API_KEY}\nServidor funcionando correctamente.`,
                tokens: 0,
                modelo: 'Test Mode'
            });
        }

        // Verificar API key
        if (!process.env.DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY no configurada');
            return res.status(500).json({ 
                success: false,
                error: 'Error de configuración: API Key no encontrada' 
            });
        }

        // Limitar longitud del prompt para respuestas más rápidas
        const promptLimitado = prompt.substring(0, 200);

        // Crear un timeout más agresivo (8 segundos para dejar margen)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            // Llamar a DeepSeek con configuración optimizada
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
                            content: `Eres un tutor de matemáticas. IMPORTANTE: Responde de forma BREVE y DIRECTA.
                            
Instrucciones para derivadas e integrales:
1. Identifica la función
2. Aplica la regla correspondiente
3. Muestra el resultado final

Usa notación LaTeX simple. Máximo 3-4 pasos. Sé conciso.`
                        },
                        {
                            role: 'user',
                            content: promptLimitado
                        }
                    ],
                    // Configuración optimizada para respuestas rápidas
                    temperature: 0.3,
                    max_tokens: 300,  // Reducido para respuestas más rápidas
                    top_p: 0.9,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Verificar respuesta
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Sin detalles');
                console.error('Error de DeepSeek:', response.status, errorText);
                
                if (response.status === 429) {
                    return res.status(429).json({
                        success: false,
                        error: 'Límite de API excedido. Intenta en unos momentos.'
                    });
                }
                
                if (response.status === 401) {
                    return res.status(401).json({
                        success: false,
                        error: 'API Key inválida. Verifica tu configuración.'
                    });
                }
                
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Validar respuesta
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Respuesta inválida de DeepSeek');
            }

            const resultado = data.choices[0].message.content.trim();
            
            return res.status(200).json({
                success: true,
                resultado: resultado || 'No se pudo generar una respuesta.',
                tokens: data.usage?.total_tokens || 0,
                modelo: 'DeepSeek Chat (Optimizado)'
            });

        } catch (innerError) {
            clearTimeout(timeoutId);
            
            if (innerError.name === 'AbortError') {
                // Timeout - dar una respuesta básica
                console.log('Timeout detectado, enviando respuesta básica');
                
                // Respuesta de emergencia para funciones comunes
                const respuestaEmergencia = generarRespuestaBasica(prompt);
                
                return res.status(200).json({
                    success: true,
                    resultado: respuestaEmergencia,
                    tokens: 0,
                    modelo: 'Respuesta Rápida (sin IA)'
                });
            }
            
            throw innerError;
        }

    } catch (error) {
        console.error('Error general:', error.message);
        
        return res.status(500).json({
            success: false,
            error: 'Error procesando la solicitud. Intenta con una función más simple.'
        });
    }
}

// Función auxiliar para respuestas básicas cuando hay timeout
function generarRespuestaBasica(prompt) {
    const funcionLimpia = prompt.toLowerCase().trim();
    
    // Detectar si es derivada o integral
    const esDerivada = prompt.toLowerCase().includes('derivada');
    const esIntegral = prompt.toLowerCase().includes('integral');
    
    if (funcionLimpia.includes('x^2') || funcionLimpia.includes('x²')) {
        if (esIntegral) {
            return `**Integral de x²:**\n\nAplicando la regla de potencias:\n∫x² dx = x³/3 + C\n\nDonde C es la constante de integración.`;
        }
        return `**Derivada de x²:**\n\nAplicando la regla de potencias:\nf(x) = x²\nf'(x) = 2x\n\n**Resultado:** 2x`;
    }
    
    if (funcionLimpia.includes('x^3') || funcionLimpia.includes('x³')) {
        if (esIntegral) {
            return `**Integral de x³:**\n\nAplicando la regla de potencias:\n∫x³ dx = x⁴/4 + C\n\nDonde C es la constante de integración.`;
        }
        return `**Derivada de x³:**\n\nAplicando la regla de potencias:\nf(x) = x³\nf'(x) = 3x²\n\n**Resultado:** 3x²`;
    }
    
    if (funcionLimpia.includes('sin') || funcionLimpia.includes('sen')) {
        if (esIntegral) {
            return `**Integral de sin(x):**\n\n∫sin(x) dx = -cos(x) + C\n\nDonde C es la constante de integración.`;
        }
        return `**Derivada de sin(x):**\n\nf(x) = sin(x)\nf'(x) = cos(x)\n\n**Resultado:** cos(x)`;
    }
    
    if (funcionLimpia.includes('cos')) {
        if (esIntegral) {
            return `**Integral de cos(x):**\n\n∫cos(x) dx = sin(x) + C\n\nDonde C es la constante de integración.`;
        }
        return `**Derivada de cos(x):**\n\nf(x) = cos(x)\nf'(x) = -sin(x)\n\n**Resultado:** -sin(x)`;
    }
    
    if (funcionLimpia.includes('e^x') || funcionLimpia.includes('exp')) {
        if (esIntegral) {
            return `**Integral de e^x:**\n\n∫e^x dx = e^x + C\n\nLa función exponencial es su propia integral.`;
        }
        return `**Derivada de e^x:**\n\nf(x) = e^x\nf'(x) = e^x\n\nLa función exponencial es su propia derivada.`;
    }
    
    // Respuesta genérica
    return `⚠️ La respuesta tardó demasiado tiempo. 

**Sugerencias:**
1. Intenta con una función más simple
2. Escribe "test" para verificar la conexión
3. Ejemplos que funcionan bien: x^2, x^3, sin(x), cos(x), e^x

**Nota:** El servidor tiene un límite de 10 segundos para responder. Funciones muy complejas pueden exceder este tiempo.`;
}

// Configuración para Vercel
export const config = {
    maxDuration: 10
};
