// Direct Gemini API Service
// Note: Exposing API keys in frontend is not recommended for production
// This is for development/testing purposes only

const GEMINI_API_KEY = 'AIzaSyCzl2XuDH2CfUlqK11kbHBL9MELvakZXPU';

// Using gemini-2.5-flash model
const GEMINI_MODEL = 'gemini-2.5-flash';

// Fallback models if main model fails
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest', 
  'gemini-pro',
  'gemini-1.5-flash',
  'gemini-1.5-pro'
];

// Use v1 API instead of v1beta
const getGeminiUrl = (model) => 
  `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Call Gemini API directly from frontend
 * @param {string} userInput - User's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {Object} contextData - Additional context data (products, inventory, etc.)
 * @returns {Promise<string>} - AI response
 */
export const geminiDirectAPI = {
  chat: async (userInput, conversationHistory = [], contextData = {}) => {
    // Build conversation context
    const contents = [];
    
    // Add system context if available (products, inventory data)
    if (contextData.products && contextData.products.length > 0) {
      const productsInfo = contextData.products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        currentStock: p.currentStock || p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
        expiryDate: p.expiryDate,
        salesHistory: p.salesHistory || []
      }));
      
      const systemContext = `Bạn là trợ lý AI cho hệ thống quản lý nhà thuốc. Dưới đây là thông tin các sản phẩm hiện có:

${JSON.stringify(productsInfo, null, 2)}

Khi người dùng hỏi về sản phẩm, bạn có thể:
- Phân tích dữ liệu lịch sử bán hàng
- Đề xuất ngưỡng cảnh báo tồn kho thấp (low-stock threshold) dựa trên mùa vụ và xu hướng
- Đề xuất thời gian cảnh báo hết hạn (near-expiry alert) dựa trên pattern hết hạn
- Đưa ra gợi ý tối ưu cho từng sản phẩm

Hãy trả lời bằng tiếng Việt và đưa ra các gợi ý cụ thể, có thể hành động được.`;
      
      contents.push({
        role: 'user',
        parts: [{ text: systemContext }]
      });
      
      contents.push({
        role: 'model',
        parts: [{ text: 'Tôi đã hiểu. Tôi có thể giúp bạn phân tích sản phẩm và đưa ra các gợi ý tối ưu về quản lý tồn kho và cảnh báo hết hạn.' }]
      });
    }
    
    // Add conversation history (last 10 messages to avoid token limit)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });
    
    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userInput }]
    });

    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    // Try each model until one works
    let lastError = null;
    for (const model of GEMINI_MODELS) {
      try {
        const url = getGeminiUrl(model);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || `HTTP error! status: ${response.status}`;
          
          // If model not found, try next model
          if (errorMsg.includes('not found') || errorMsg.includes('not supported')) {
            lastError = new Error(errorMsg);
            continue; // Try next model
          }
          
          throw new Error(errorMsg);
        }

        const data = await response.json();
        
        // Extract text from response
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const textParts = data.candidates[0].content.parts;
          if (textParts && textParts.length > 0) {
            return textParts[0].text;
          }
        }
        
        // Check if content was blocked
        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
          return 'Xin lỗi, nội dung này không thể được xử lý do vi phạm chính sách an toàn.';
        }
        
        throw new Error('Không nhận được phản hồi từ AI');
      } catch (error) {
        lastError = error;
        // If it's a model not found error, continue to next model
        if (error.message && (error.message.includes('not found') || error.message.includes('not supported'))) {
          console.log(`Model ${model} not available, trying next...`);
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }
    
    // If all models failed
    throw lastError || new Error('Tất cả các model đều không khả dụng');
  }
};

