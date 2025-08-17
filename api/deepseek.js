// api/deepseek.js - Usando Google Gemini API
export default async function handler(req, res) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Manejar OPTIONS para CORS
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

        if (!prompt) {
            return res.status(400).json({ 
                success: false,
                error: 'Prompt requerido' 
            });
        }

        // Verificar API key
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY no configurada');
            return res.status(500).json({ 
                success: false,
                error: 'Error de configuración: API Key no encontrada' 
            });
        }

        // Construir el prompt optimizado para matemáticas
        const systemPrompt = `Eres un experto en matemáticas para estudiantes de 2º bachillerato preparando la PAU/Selectividad.

INSTRUCCIONES IMPORTANTES:
1. Responde de forma BREVE y CLARA (máximo 4-5 pasos)
2. Usa notación LaTeX para las fórmulas matemáticas:
   - Inline: $formula$
   - Display: $$formula$$
3. Estructura tu respuesta así:
   - Identificar la función
   - Aplicar la regla correspondiente
   - Mostrar el resultado final
4. Sé motivador y accesible

Ejemplo de formato:
"Derivada de $f(x)=x^2$:
Aplicando la regla de potencias: $n·x^{n-1}$
Resultado: $f'(x)=2x$ (dos equis)"`;

        const fullPrompt = `${systemPrompt}\n\nResuelve: ${prompt}`;

        // Configurar timeout de 8 segundos
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        try {
            // Llamar a Gemini API
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: fullPrompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 500,
                            topP: 0.8,
                            topK: 40
                        },
                        safetySettings: [
                            {
                                category: "HARM_CATEGORY_HARASSMENT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_HATE_SPEECH",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                                threshold: "BLOCK_NONE"
                            },
                            {
                                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                                threshold: "BLOCK_NONE"
                            }
                        ]
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Gemini API error:', response.status, errorData);
                
                if (response.status === 400) {
                    return res.status(400).json({
                        success: false,
                        error: 'Solicitud inválida. Verifica el formato de la función.'
                    });
                }
                
                if (response.status === 403) {
                    return res.status(403).json({
                        success: false,
                        error: 'API Key inválida o sin permisos. Verifica tu configuración.'
                    });
                }
                
                if (response.status === 429) {
                    return res.status(429).json({
                        success: false,
                        error: 'Límite de solicitudes excedido. Intenta en unos segundos.'
                    });
                }
                
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Extraer la respuesta de Gemini
            let resultado = '';
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                resultado = data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Respuesta inválida de Gemini');
            }
            
            // Calcular tokens aproximados (Gemini no siempre los devuelve)
            const tokensUsados = data.usageMetadata?.totalTokenCount || 
                               Math.round(resultado.length / 4);
            
            return res.status(200).json({
                success: true,
                resultado: resultado.trim(),
                tokens: tokensUsados,
                modelo: 'Gemini 1.5 Flash'
            });

        } catch (innerError) {
            clearTimeout(timeoutId);
            
            // Si es timeout, dar respuesta básica
            if (innerError.name === 'AbortError') {
                console.log('Timeout - enviando respuesta básica');
                return res.status(200).json({
                    success: true,
                    resultado: generarRespuestaRapida(prompt),
                    tokens: 0,
                    modelo: 'Respuesta Rápida (Timeout)'
                });
            }
            
            throw innerError;
        }

    } catch (error) {
        console.error('Error general:', error);
        return res.status(500).json({
            success: false,
            error: 'Error al procesar la solicitud. Por favor, intenta de nuevo.'
        });
    }
}

// Función de respaldo para cuando hay timeout
function generarRespuestaRapida(prompt) {
    const promptLower = prompt.toLowerCase();
    const esIntegral = promptLower.includes('integral');
    
    // Respuestas rápidas para funciones comunes
    if (promptLower.includes('x^2') || promptLower.includes('x²')) {
        return esIntegral 
            ? `**Integral de $x^2$:**\n\nAplicando la regla de potencias:\n$$\\int x^2 \\, dx = \\frac{x^3}{3} + C$$\n\nDonde C es la constante de integración.`
            : `**Derivada de $x^2$:**\n\nAplicando la regla de potencias:\n$$f'(x) = 2x$$\n\nLa derivada de x² es 2x (dos equis).`;
    }
    
    if (promptLower.includes('x^3') || promptLower.includes('x³')) {
        return esIntegral
            ? `**Integral de $x^3$:**\n\n$$\\int x^3 \\, dx = \\frac{x^4}{4} + C$$`
            : `**Derivada de $x^3$:**\n\n$$f'(x) = 3x^2$$`;
    }
    
    if (promptLower.includes('sin') || promptLower.includes('sen')) {
        return esIntegral
            ? `**Integral de $\\sin(x)$:**\n\n$$\\int \\sin(x) \\, dx = -\\cos(x) + C$$`
            : `**Derivada de $\\sin(x)$:**\n\n$$f'(x) = \\cos(x)$$`;
    }
    
    if (promptLower.includes('cos')) {
        return esIntegral
            ? `**Integral de $\\cos(x)$:**\n\n$$\\int \\cos(x) \\, dx = \\sin(x) + C$$`
            : `**Derivada de $\\cos(x)$:**\n\n$$f'(x) = -\\sin(x)$$`;
    }
    
    if (promptLower.includes('e^x') || promptLower.includes('exp')) {
        return esIntegral
            ? `**Integral de $e^x$:**\n\n$$\\int e^x \\, dx = e^x + C$$\n\nLa función exponencial es su propia integral.`
            : `**Derivada de $e^x$:**\n\n$$f'(x) = e^x$$\n\nLa función exponencial es su propia derivada.`;
    }
    
    if (promptLower.includes('ln') || promptLower.includes('log')) {
        return esIntegral
            ? `**Integral de $\\ln(x)$:**\n\nUsando integración por partes:\n$$\\int \\ln(x) \\, dx = x\\ln(x) - x + C$$`
            : `**Derivada de $\\ln(x)$:**\n\n$$f'(x) = \\frac{1}{x}$$`;
    }
    
    if (promptLower.includes('1/x')) {
        return esIntegral
            ? `**Integral de $\\frac{1}{x}$:**\n\n$$\\int \\frac{1}{x} \\, dx = \\ln|x| + C$$`
            : `**Derivada de $\\frac{1}{x}$:**\n\n$$f'(x) = -\\frac{1}{x^2}$$`;
    }
    
    // Respuesta genérica
    return `⚠️ **Timeout del servidor**

La respuesta tardó más de 10 segundos. 

**Sugerencias:**
• Intenta con funciones más simples
• Ejemplos: x^2, x^3, sin(x), cos(x), e^x, ln(x)
• Evita funciones muy complejas

Nota: El límite de tiempo es por el plan gratuito de Vercel.`;
}

// Configuración para Vercel
export const config = {
    maxDuration: 15
};
