import { motion } from 'framer-motion';
import {
  DollarSign,
  ArrowRightLeft,
  Sparkles,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';

// Major world currencies
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
];

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch exchange rates from API
  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      setRates(data.rates);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch rates:', error);
      // Fallback to mock rates
      setRates({ EUR: 0.92, GBP: 0.79, JPY: 149.52, INR: 83.12 });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRates();
  }, [fromCurrency]);

  const rate = rates[toCurrency] || 1;
  const converted = parseFloat(amount || '0') * rate;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const filteredFromCurrencies = CURRENCIES.filter(
    curr =>
      curr.code.toLowerCase().includes(fromSearch.toLowerCase()) ||
      curr.name.toLowerCase().includes(fromSearch.toLowerCase())
  ).slice(0, 5);

  const filteredToCurrencies = CURRENCIES.filter(
    curr =>
      curr.code.toLowerCase().includes(toSearch.toLowerCase()) ||
      curr.name.toLowerCase().includes(toSearch.toLowerCase())
  ).slice(0, 5);

  const selectFromCurrency = (code: string) => {
    setFromCurrency(code);
    setFromSearch('');
    setShowFromSuggestions(false);
  };

  const selectToCurrency = (code: string) => {
    setToCurrency(code);
    setToSearch('');
    setShowToSuggestions(false);
  };

  return (
    <div className="glass-card p-5 space-y-4 overflow-visible">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h4 className="font-serif font-semibold text-foreground">Currency</h4>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          onClick={fetchRates}
          disabled={isLoading}
          className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`}
          />
        </motion.button>
      </div>

      <div className="space-y-3">
        {/* From Currency */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 text-foreground text-right font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="relative">
            <input
              type="text"
              value={showFromSuggestions ? fromSearch : fromCurrency}
              onChange={e => {
                setFromSearch(e.target.value);
                setShowFromSuggestions(true);
              }}
              onFocus={() => setShowFromSuggestions(true)}
              onBlur={() => setTimeout(() => setShowFromSuggestions(false), 200)}
              placeholder="USD"
              className="w-20 px-3 py-2 rounded-xl bg-secondary text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {showFromSuggestions && fromSearch && filteredFromCurrencies.length > 0 && (
              <div
                className="absolute bottom-full mb-1 right-0 w-64 bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
                style={{ zIndex: 99999 }}
              >
                {filteredFromCurrencies.map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => selectFromCurrency(curr.code)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors flex items-center gap-3"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shrink-0">
                      <span className="text-lg font-semibold text-primary">{curr.symbol}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">{curr.code}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{curr.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={swapCurrencies}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>

        {/* To Currency */}
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 rounded-xl bg-primary/10 text-right font-semibold text-foreground">
            {converted.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </div>
          <div className="relative">
            <input
              type="text"
              value={showToSuggestions ? toSearch : toCurrency}
              onChange={e => {
                setToSearch(e.target.value);
                setShowToSuggestions(true);
              }}
              onFocus={() => setShowToSuggestions(true)}
              onBlur={() => setTimeout(() => setShowToSuggestions(false), 200)}
              placeholder="EUR"
              className="w-20 px-3 py-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {showToSuggestions && toSearch && filteredToCurrencies.length > 0 && (
              <div
                className="absolute bottom-full mb-1 right-0 w-64 bg-card rounded-xl shadow-2xl border border-border overflow-hidden"
                style={{ zIndex: 99999 }}
              >
                {filteredToCurrencies.map(curr => (
                  <button
                    key={curr.code}
                    onClick={() => selectToCurrency(curr.code)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors flex items-center gap-3"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shrink-0">
                      <span className="text-lg font-semibold text-primary">{curr.symbol}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">{curr.code}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{curr.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
        </span>
        {lastUpdated && <span>{lastUpdated.toLocaleTimeString()}</span>}
      </div>
    </div>
  );
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIPacker = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState<{ item: string; checked: boolean }[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const callAI = async (userMessage: string) => {
    setIsLoading(true);
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      // Using Google Gemini API (FREE - 60 requests/minute!)
      const prompt = `You are a helpful travel packing assistant. Create a practical packing list for this trip: "${userMessage}". 

Provide a concise packing list with each item on a new line starting with "- ". Consider the destination, duration, activities, and weather. Be specific and helpful. List 10-15 essential items.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 500,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!assistantMessage) {
        throw new Error('No response from Gemini');
      }

      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }]);

      // Parse items from response
      const items = assistantMessage
        .split('\n')
        .filter((line: string) => line.trim().startsWith('-'))
        .map((line: string) => ({
          item: line.replace(/^-\s*/, '').trim(),
          checked: false,
        }));

      if (items.length > 0) {
        setChecklist(items);
      } else {
        // Fallback: create items from any line that looks like a packing item
        const fallbackItems = assistantMessage
          .split('\n')
          .filter((line: string) => line.trim().length > 3 && !line.includes(':'))
          .slice(0, 15)
          .map((line: string) => ({
            item: line.replace(/^[\d.\-*•]\s*/, '').trim(),
            checked: false,
          }));
        if (fallbackItems.length > 0) {
          setChecklist(fallbackItems);
        }
      }
    } catch (error: any) {
      console.error('AI API error:', error);

      // Intelligent fallback based on trip description
      const smartItems = generateSmartPackingList(userMessage);
      setChecklist(smartItems);

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Here's a smart packing list for your trip! ✨`,
        },
      ]);
    }

    setIsLoading(false);
  };

  // Smart fallback packing list generator
  const generateSmartPackingList = (
    tripDescription: string
  ): { item: string; checked: boolean }[] => {
    const desc = tripDescription.toLowerCase();
    const items: string[] = [];

    // Essential items for all trips
    items.push('Passport/ID', 'Phone charger', 'Wallet/cards', 'Medications');

    // Duration-based items
    if (desc.match(/\d+\s*(day|night|week)/)) {
      const duration = parseInt(desc.match(/\d+/)?.[0] || '3');
      items.push(`${duration} sets of clothes`, 'Toiletries bag', 'Underwear & socks');
    }

    // Destination-based items
    if (
      desc.includes('beach') ||
      desc.includes('tropical') ||
      desc.includes('bali') ||
      desc.includes('hawaii')
    ) {
      items.push('Swimsuit', 'Sunscreen SPF 50+', 'Sunglasses', 'Beach towel', 'Flip-flops', 'Hat');
    }
    if (desc.includes('mountain') || desc.includes('hiking') || desc.includes('trek')) {
      items.push(
        'Hiking boots',
        'Backpack',
        'Water bottle',
        'First aid kit',
        'Warm jacket',
        'Trail snacks'
      );
    }
    if (
      desc.includes('ski') ||
      desc.includes('snow') ||
      desc.includes('cold') ||
      desc.includes('winter')
    ) {
      items.push('Winter jacket', 'Thermal underwear', 'Gloves', 'Warm hat', 'Snow boots', 'Scarf');
    }
    if (desc.includes('city') || desc.includes('urban') || desc.includes('business')) {
      items.push(
        'Comfortable walking shoes',
        'Day bag',
        'Camera',
        'City map/guide',
        'Portable charger'
      );
    }

    // Activity-based items
    if (desc.includes('swim')) items.push('Goggles', 'Swim cap');
    if (desc.includes('camp')) items.push('Sleeping bag', 'Tent', 'Flashlight');
    if (desc.includes('photo')) items.push('Camera', 'Extra batteries', 'Memory cards');

    // Always useful
    items.push('Reusable water bottle', 'Travel adapter', 'Hand sanitizer', 'Wet wipes');

    return items.slice(0, 12).map(item => ({ item, checked: false }));
  };

  const handleGenerate = () => {
    if (!input.trim()) return;
    callAI(input);
    setInput('');
  };

  const toggleItem = (index: number) => {
    setChecklist(prev =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    );
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h4 className="font-serif font-semibold text-foreground">AI Packer</h4>
        </div>
        <span className="text-xs text-success font-medium">✨ Free AI</span>
      </div>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {messages.slice(-4).map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs p-2 rounded-lg ${msg.role === 'user'
                  ? 'bg-primary/10 text-foreground ml-4'
                  : 'bg-secondary/30 text-muted-foreground mr-4'
                }`}
            >
              {msg.content}
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          placeholder="e.g., 3 days beach trip in Bali"
          className="flex-1 px-3 py-2 rounded-xl bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerate}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pack'}
        </motion.button>
      </div>

      {checklist.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        >
          {checklist.map((item, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleItem(index)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${item.checked ? 'bg-success/10' : 'bg-secondary/30 hover:bg-secondary/50'
                }`}
            >
              {item.checked ? (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span
                className={`text-sm ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
              >
                {item.item}
              </span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const UtilityWidgets = () => {
  return (
    <div className="space-y-4">
      <CurrencyConverter />
      <AIPacker />
    </div>
  );
};

export default UtilityWidgets;
