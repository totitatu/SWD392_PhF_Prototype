import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { MessageCircle, Send, X } from 'lucide-react';
import { geminiDirectAPI } from '../../services/geminiDirect';
import { productAPI, inventoryAPI, saleAPI } from '../../services/api';

export function GeminiChat({ session }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load products, inventory, and sales from database when chat opens
  useEffect(() => {
    if (isOpen && products.length === 0 && !productsLoading) {
      loadDataFromDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const loadDataFromDatabase = async () => {
    setProductsLoading(true);
    try {
      // Load products, inventory, and sales in parallel
      const [productsData, inventoryData, salesData] = await Promise.all([
        productAPI.list({ active: true }).catch(() => []),
        inventoryAPI.list({ active: true }).catch(() => []),
        saleAPI.list().catch(() => [])
      ]);

      // Handle products
      if (productsData && Array.isArray(productsData)) {
        setProducts(productsData);
      } else if (productsData && productsData.content) {
        setProducts(productsData.content || []);
      }

      // Handle inventory
      if (inventoryData && Array.isArray(inventoryData)) {
        setInventory(inventoryData);
      } else if (inventoryData && inventoryData.content) {
        setInventory(inventoryData.content || []);
      }

      // Handle sales
      if (salesData && Array.isArray(salesData)) {
        setSales(salesData);
      } else if (salesData && salesData.content) {
        setSales(salesData.content || []);
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
      // Continue without data if API fails
    } finally {
      setProductsLoading(false);
    }
  };

  const getFallbackResponse = (userInput) => {
    const lowerInput = userInput.toLowerCase();
    
    // Simple keyword-based responses for fallback
    if (lowerInput.includes('xin chào') || lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return 'Xin chào! Tôi là trợ lý AI Gemini. Tôi có thể giúp bạn với các câu hỏi về quản lý nhà thuốc, sản phẩm, đơn hàng và nhiều hơn nữa. Bạn cần hỗ trợ gì?';
    }
    if (lowerInput.includes('sản phẩm') || lowerInput.includes('product')) {
      return 'Bạn có thể quản lý sản phẩm trong mục Inventory. Tại đó bạn có thể thêm, sửa, xóa và tìm kiếm sản phẩm. Bạn muốn biết thêm chi tiết về tính năng nào?';
    }
    if (lowerInput.includes('đơn hàng') || lowerInput.includes('order') || lowerInput.includes('purchase')) {
      return 'Bạn có thể tạo và quản lý đơn hàng mua trong mục Purchase Orders. Hệ thống hỗ trợ tạo đơn hàng tự động với AI hoặc tạo thủ công.';
    }
    if (lowerInput.includes('bán hàng') || lowerInput.includes('pos') || lowerInput.includes('sale')) {
      return 'Hệ thống POS cho phép bạn bán hàng nhanh chóng, quét mã vạch và thanh toán. Bạn có thể truy cập từ menu Point of Sale.';
    }
    if (lowerInput.includes('nhà cung cấp') || lowerInput.includes('supplier')) {
      return 'Bạn có thể quản lý nhà cung cấp trong mục Suppliers. Tại đó bạn có thể thêm thông tin nhà cung cấp, liên hệ và lịch sử giao dịch.';
    }
    if (lowerInput.includes('cảm ơn') || lowerInput.includes('thank')) {
      return 'Không có gì! Tôi luôn sẵn sàng giúp đỡ bạn. Nếu có câu hỏi gì khác, cứ hỏi tôi nhé!';
    }
    
    // Default fallback
    return `Cảm ơn bạn đã hỏi về "${userInput}". Tôi hiểu bạn đang quan tâm đến chủ đề này. Để tôi có thể hỗ trợ tốt hơn, bạn có thể:\n\n1. Kiểm tra kết nối với server\n2. Thử lại câu hỏi\n3. Hoặc liên hệ admin để được hỗ trợ\n\nBạn có câu hỏi gì khác về hệ thống quản lý nhà thuốc không?`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setLoading(true);

    try {
      // Prepare context data with products, inventory, and sales from database
      // Enrich products with inventory and sales data
      const enrichedProducts = products.map(product => {
        const inventoryItem = inventory.find(inv => inv.productId === product.id);
        const productSales = sales.filter(sale => 
          sale.items?.some(item => item.productId === product.id)
        );
        
        return {
          ...product,
          currentStock: inventoryItem?.quantity || 0,
          lowStockThreshold: inventoryItem?.lowStockThreshold || product.lowStockThreshold,
          expiryDate: inventoryItem?.expiryDate,
          costPrice: inventoryItem?.costPrice || product.costPrice,
          salesHistory: productSales.map(sale => ({
            date: sale.soldAt || sale.createdAt,
            quantity: sale.items?.find(item => item.productId === product.id)?.quantity || 0,
            amount: sale.items?.find(item => item.productId === product.id)?.price || 0
          }))
        };
      });

      const contextData = {
        products: enrichedProducts.length > 0 ? enrichedProducts : undefined
      };
      
      // Use direct Gemini API with conversation history and product context
      const response = await geminiDirectAPI.chat(userInput, messages, contextData);
      const aiMessage = {
        role: 'assistant',
        content: response,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Check for specific error types
      let errorMessage = '';
      if (error.message && error.message.includes('leaked')) {
        errorMessage = `🔐 API Key đã bị đánh dấu là leaked.\n\n📝 Để sử dụng Gemini AI, vui lòng:\n1. Truy cập https://aistudio.google.com/apikey\n2. Tạo API key mới\n3. Cập nhật API key trong file src/services/geminiDirect.js\n\nĐang sử dụng chế độ phản hồi cơ bản:`;
      } else if (error.message && error.message.includes('API key')) {
        errorMessage = `🔐 Lỗi API Key: ${error.message}\n\n📝 Vui lòng kiểm tra API key trong file src/services/geminiDirect.js\n\nĐang sử dụng chế độ phản hồi cơ bản:`;
      } else {
        errorMessage = `⚠️ Không thể kết nối với Gemini API: ${error.message}\n\nĐang sử dụng chế độ phản hồi cơ bản:`;
      }
      
      // Use fallback response if API fails
      const fallbackResponse = getFallbackResponse(userInput);
      const finalMessage = {
        role: 'assistant',
        content: `${errorMessage}\n\n${fallbackResponse}`,
      };
      setMessages(prev => [...prev, finalMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatMessage = (text) => {
    if (!text) return '';
    
    // Split by lines to process block-level elements
    const lines = text.split('\n');
    const formatted = [];
    let inCodeBlock = false;
    let codeBlockContent = [];
    let inList = false;
    let listItems = [];
    let listType = null; // 'ul' or 'ol'
    
    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        // Close any open list first
        if (inList) {
          const ListTag = listType === 'ol' ? 'ol' : 'ul';
          formatted.push(
            <ListTag key={`list-${index}`} className="ml-4 mb-2 space-y-1">
              {listItems.map((item, i) => (
                <li key={i}>{formatInlineText(item)}</li>
              ))}
            </ListTag>
          );
          listItems = [];
          inList = false;
          listType = null;
        }
        
        if (inCodeBlock) {
          // End code block
          formatted.push(
            <pre key={`code-${index}`} className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 text-xs">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Start code block
          inCodeBlock = true;
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }
      
      // Check for list items
      const isUnorderedList = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const isOrderedList = /^\d+\.\s/.test(line.trim());
      
      if (isUnorderedList || isOrderedList) {
        const itemText = isUnorderedList 
          ? line.trim().substring(2) 
          : line.trim().replace(/^\d+\.\s/, '');
        const currentListType = isUnorderedList ? 'ul' : 'ol';
        
        if (inList && listType === currentListType) {
          listItems.push(itemText);
        } else {
          // Close previous list if exists
          if (inList) {
            const ListTag = listType === 'ol' ? 'ol' : 'ul';
            formatted.push(
              <ListTag key={`list-${index}`} className="ml-4 mb-2 space-y-1">
                {listItems.map((item, i) => (
                  <li key={i}>{formatInlineText(item)}</li>
                ))}
              </ListTag>
            );
          }
          listItems = [itemText];
          listType = currentListType;
          inList = true;
        }
        return;
      }
      
      // Close list if we hit a non-list line
      if (inList) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        formatted.push(
          <ListTag key={`list-${index}`} className="ml-4 mb-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i}>{formatInlineText(item)}</li>
            ))}
          </ListTag>
        );
        listItems = [];
        inList = false;
        listType = null;
      }
      
      // Headers
      if (line.startsWith('### ')) {
        formatted.push(<h3 key={index} className="font-semibold text-base mt-3 mb-1">{formatInlineText(line.substring(4))}</h3>);
        return;
      }
      if (line.startsWith('## ')) {
        formatted.push(<h2 key={index} className="font-semibold text-lg mt-4 mb-2">{formatInlineText(line.substring(3))}</h2>);
        return;
      }
      if (line.startsWith('# ')) {
        formatted.push(<h1 key={index} className="font-bold text-xl mt-4 mb-2">{formatInlineText(line.substring(2))}</h1>);
        return;
      }
      
      // Regular paragraph
      if (line.trim()) {
        formatted.push(
          <p key={index} className="mb-2">
            {formatInlineText(line)}
          </p>
        );
      } else {
        formatted.push(<br key={index} />);
      }
    });
    
    // Close any open code block or list
    if (inCodeBlock && codeBlockContent.length > 0) {
      formatted.push(
        <pre key="code-final" className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto my-2 text-xs">
          <code>{codeBlockContent.join('\n')}</code>
        </pre>
      );
    }
    if (inList && listItems.length > 0) {
      const ListTag = listType === 'ol' ? 'ol' : 'ul';
      formatted.push(
        <ListTag key="list-final" className="ml-4 mb-2 space-y-1">
          {listItems.map((item, i) => (
            <li key={i}>{formatInlineText(item)}</li>
          ))}
        </ListTag>
      );
    }
    
    return formatted;
  };
  
  const formatInlineText = (text) => {
    if (!text) return '';
    
    const parts = [];
    let currentIndex = 0;
    const matches = [];
    
    // Match patterns in order: code (highest priority), bold, italic, links
    // Process code blocks first (backticks)
    const codeRegex = /`([^`]+)`/g;
    let match;
    while ((match = codeRegex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: 'code',
        content: match[1],
      });
    }
    
    // Process bold (**text**)
    const boldRegex = /\*\*([^*]+)\*\*/g;
    while ((match = boldRegex.exec(text)) !== null) {
      // Skip if inside a code block
      const isInCode = matches.some(m => m.type === 'code' && match.index >= m.index && match.index < m.index + m.length);
      if (!isInCode) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: 'bold',
          content: match[1],
        });
      }
    }
    
    // Process italic (*text*) - but not if it's part of bold
    const italicRegex = /\*([^*]+)\*/g;
    while ((match = italicRegex.exec(text)) !== null) {
      // Check if it's part of bold (**text**)
      const isBold = text.substring(Math.max(0, match.index - 1), match.index + match[0].length + 1) === `*${match[0]}*`;
      const isInCode = matches.some(m => m.type === 'code' && match.index >= m.index && match.index < m.index + m.length);
      const isInBold = matches.some(m => m.type === 'bold' && match.index >= m.index && match.index < m.index + m.length);
      if (!isInCode && !isInBold && !isBold) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: 'italic',
          content: match[1],
        });
      }
    }
    
    // Process links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    while ((match = linkRegex.exec(text)) !== null) {
      const isInCode = matches.some(m => m.type === 'code' && match.index >= m.index && match.index < m.index + m.length);
      if (!isInCode) {
        matches.push({
          index: match.index,
          length: match[0].length,
          type: 'link',
          content: match[1],
          url: match[2],
        });
      }
    }
    
    // Sort matches by index
    matches.sort((a, b) => a.index - b.index);
    
    // Remove overlapping matches (keep code blocks, then bold, then italic, then links)
    const filteredMatches = [];
    matches.forEach(match => {
      const overlaps = filteredMatches.some(existing => 
        (match.index >= existing.index && match.index < existing.index + existing.length) ||
        (existing.index >= match.index && existing.index < match.index + match.length)
      );
      if (!overlaps) {
        filteredMatches.push(match);
      }
    });
    
    // Build parts array
    let lastIndex = 0;
    filteredMatches.forEach((match) => {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      switch (match.type) {
        case 'code':
          parts.push(<code key={currentIndex++} className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-xs font-mono">{match.content}</code>);
          break;
        case 'bold':
          parts.push(<strong key={currentIndex++} className="font-semibold">{match.content}</strong>);
          break;
        case 'italic':
          parts.push(<em key={currentIndex++} className="italic">{match.content}</em>);
          break;
        case 'link':
          parts.push(<a key={currentIndex++} href={match.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{match.content}</a>);
          break;
      }
      
      lastIndex = match.index + match.length;
    });
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div 
        className="fixed z-50" 
        style={{ 
          bottom: 0, 
          right: 0,
          position: 'fixed'
        }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="w-24 h-24 shadow-2xl hover:shadow-3xl transition-shadow rounded-full p-0"
        >
          <MessageCircle className="w-16 h-16" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="fixed z-50" 
      style={{ 
        bottom: 0, 
        right: 0,
        position: 'fixed',
        width: '320px',
        maxWidth: '320px'
      }}
    >
      <Card 
        className="shadow-2xl flex flex-col" 
        style={{ 
          height: '600px',
          width: '100%',
          maxWidth: '320px',
          borderTopLeftRadius: '0.75rem',
          borderBottomLeftRadius: '0.75rem',
          borderTopRightRadius: '0',
          borderBottomRightRadius: '0'
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Trợ lý AI Gemini
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <>
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Xin chào! Tôi là trợ lý AI Gemini.</p>
                  <p className="text-sm mt-2">Hãy hỏi tôi bất cứ điều gì về quản lý nhà thuốc.</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                      style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      ) : (
                        <div className="text-sm break-words prose prose-sm max-w-none">
                          {formatMessage(msg.content)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  disabled={loading}
                />
                <Button onClick={sendMessage} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
        </>
      </Card>
    </div>
  );
}
