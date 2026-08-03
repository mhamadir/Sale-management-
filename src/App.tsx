import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  X, 
  Trash2, 
  Search, 
  FolderOpen, 
  BarChart3, 
  Sun, 
  Moon, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet,
  ArrowUpDown
} from 'lucide-react';

interface Transaction {
  id: number;
  itemName: string;
  buyerName: string;
  buyerPhone: string;
  serial: string;
  cost: number;
  price: number;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  dayStr: string;
}

const i18n = {
  en: {
    appTitle: 'Sales Tracker',
    langToggle: 'کوردی',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    exchangeRateLabel: '100$ =',
    totalItems: 'Total Items Sold',
    totalCost: 'Total Cost Price',
    totalSold: 'Total Sold Price',
    totalProfit: 'Total Profit',
    historyTitle: 'Order History',
    searchPlaceholder: 'Search name or serial...',
    tabAll: 'All',
    tabProfit: 'Profitable',
    tabLoss: 'Loss / Zero',
    noRecords: 'No records found.',
    addTitle: 'Add New Record',
    itemName: 'Item Name',
    buyerName: 'Buyer Name',
    buyerPhone: 'Buyer Phone Number',
    serialNumber: 'Item Serial Number',
    costPrice: 'Cost Price ($)',
    sellingPrice: 'Selling Price ($)',
    save: 'Save Record',
    cancel: 'Cancel',
    detailTitle: 'Record Details',
    delete: 'Delete Record',
    close: 'Close',
    date: 'Date',
    time: 'Time',
    day: 'Day',
    profit: 'Net Profit',
    exportAll: 'Export CSV',
    importData: 'Import CSV',
    exportItem: 'Export Single Record',
    importSuccess: 'Successfully imported sales records!',
    importError: 'Invalid CSV format or missing columns.',
    exportSuccess: 'CSV exported successfully!',
    deleteConfirmTitle: 'Delete Confirmation',
    deleteConfirmMsg: 'Are you sure you want to delete this sale record?',
    confirmDelete: 'Yes, Delete',
    exportSingleTooltip: 'Export item CSV'
  },
  ku: {
    appTitle: 'بەدواداچوونی فرۆشتن',
    langToggle: 'English',
    themeLight: 'دۆخی ڕووناک',
    themeDark: 'دۆخی تۆخ',
    exchangeRateLabel: '100$ =',
    totalItems: 'کۆی ئایتمە فرۆشراوەکان',
    totalCost: 'کۆی گشتی نرخی کڕین',
    totalSold: 'کۆی گشتی نرخی فرۆشتن',
    totalProfit: 'کۆی گشتی قازانج',
    historyTitle: 'مێژووی داواکارییەکان',
    searchPlaceholder: 'گەڕان بۆ ناو یان زنجیرەیی...',
    tabAll: 'هەمووی',
    tabProfit: 'قازانج',
    tabLoss: 'بێ قازانج / زەرەر',
    noRecords: 'هیچ تۆمارێک نەدۆزرایەوە.',
    addTitle: 'تۆمارێکی نوێ زیاد بکە',
    itemName: 'ناوی کالا',
    buyerName: 'ناوی کڕیار',
    buyerPhone: 'ژمارەی مۆبایلی کڕیار',
    serialNumber: 'ژمارەی زنجیرەیی کالا',
    costPrice: 'نرخی کڕین ($)',
    sellingPrice: 'نرخی فرۆشتن ($)',
    save: 'پاشەکەوتکردن',
    cancel: 'پاشگەزبوونەوە',
    detailTitle: 'وردەکارییەکانی تۆمار',
    delete: 'لابردن',
    close: 'داخستن',
    date: 'بەروار',
    time: 'کات',
    day: 'ڕۆژ',
    profit: 'قازانجی پوخت',
    exportAll: 'داگرتنی CSV',
    importData: 'هاوردەکردنی CSV',
    exportItem: 'داگرتنی ئەم تۆمارە',
    importSuccess: 'تۆمارەکان بە سەرکەوتوویی هاوردە کران!',
    importError: 'فۆرماتی CSV ناڕاستە یان ستوونی پێویست کەمە.',
    exportSuccess: 'فایلی CSV بە سەرکەوتوویی دروستکرا!',
    deleteConfirmTitle: 'دڵنیابوونەوە لە سڕینەوە',
    deleteConfirmMsg: 'دڵنیایت لە سڕینەوەی ئەم تۆمارەی فرۆشتن؟',
    confirmDelete: 'بەڵێ، بسڕەوە',
    exportSingleTooltip: 'داگرتنی CSV ی ئایتم'
  }
};

type LangType = 'en' | 'ku';
type CurrencyType = 'USD' | 'IQD';
type TabType = 'all' | 'profit' | 'loss';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [lang, setLang] = useState<LangType>(() => (localStorage.getItem('appLang') as LangType) || 'en');
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('theme') === 'dark');
  const [currency, setCurrency] = useState<CurrencyType>(() => (localStorage.getItem('appCurrency') as CurrencyType) || 'USD');
  const [exchangeRate, setExchangeRate] = useState<number>(() => parseFloat(localStorage.getItem('exchangeRate') || '150000'));
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('transactions') || '[]');
    } catch {
      return [];
    }
  });

  const [currentTab, setCurrentTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailTransactionId, setDetailTransactionId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Dark Mode Sync with root HTML element and localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Language Effect
  useEffect(() => {
    localStorage.setItem('appLang', lang);
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  }, [lang]);

  // Currency & Rate Effects
  useEffect(() => {
    localStorage.setItem('appCurrency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('exchangeRate', exchangeRate.toString());
  }, [exchangeRate]);

  // Transactions State Sync
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const t = i18n[lang];

  const formatMoney = (amount: number) => {
    if (currency === 'IQD') {
      const iqdAmount = (amount / 100) * exchangeRate;
      return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ku-IQ', {
        maximumFractionDigits: 0
      }).format(iqdAmount) + ' د.ع';
    }
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ku-IQ', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      const profit = tr.price - tr.cost;
      if (currentTab === 'profit' && profit <= 0) return false;
      if (currentTab === 'loss' && profit > 0) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (tr.itemName || '').toLowerCase().includes(q);
        const serialMatch = (tr.serial || '').toLowerCase().includes(q);
        const buyerMatch = (tr.buyerName || '').toLowerCase().includes(q);
        if (!nameMatch && !serialMatch && !buyerMatch) return false;
      }
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, currentTab, searchQuery]);

  const stats = useMemo(() => {
    return filteredTransactions.reduce((acc, tr) => {
      acc.items += 1;
      acc.cost += tr.cost;
      acc.sold += tr.price;
      acc.profit += (tr.price - tr.cost);
      return acc;
    }, { items: 0, cost: 0, sold: 0, profit: 0 });
  }, [filteredTransactions]);

  const handleAddSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const cost = parseFloat(formData.get('cost') as string);
    const price = parseFloat(formData.get('price') as string);
    
    if (isNaN(cost) || isNaN(price)) return;
    
    const now = new Date();
    const newTx: Transaction = {
      id: Date.now(),
      itemName: formData.get('itemName') as string,
      buyerName: formData.get('buyerName') as string,
      buyerPhone: formData.get('buyerPhone') as string,
      serial: formData.get('serial') as string,
      cost,
      price,
      timestamp: now.getTime(),
      dateStr: now.toLocaleDateString(lang === 'en' ? 'en-US' : 'ku-IQ', { year: 'numeric', month: 'short', day: 'numeric' }),
      timeStr: now.toLocaleTimeString(lang === 'en' ? 'en-US' : 'ku-IQ', { hour: '2-digit', minute: '2-digit' }),
      dayStr: now.toLocaleDateString(lang === 'en' ? 'en-US' : 'ku-IQ', { weekday: 'long' })
    };
    
    setTransactions(prev => [...prev, newTx]);
    setIsAddModalOpen(false);
    showToast(t.addTitle + ' ' + t.save);
  };

  const handleDelete = (id: number) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
    if (detailTransactionId === id) setDetailTransactionId(null);
    setDeleteConfirmId(null);
  };

  // CSV Export with UTF-8 BOM (\uFEFF) for Kurdish Sorani Support
  const exportToCSV = (dataList: Transaction[], filename: string) => {
    if (!dataList || dataList.length === 0) return;

    const headers = [
      'ID',
      'Item Name',
      'Buyer Name',
      'Buyer Phone',
      'Serial Number',
      'Cost Price ($)',
      'Sold Price ($)',
      'Profit ($)',
      'Date',
      'Time',
      'Day',
      'Timestamp'
    ];

    const rows = dataList.map(tr => [
      tr.id,
      `"${(tr.itemName || '').replace(/"/g, '""')}"`,
      `"${(tr.buyerName || '').replace(/"/g, '""')}"`,
      `"${(tr.buyerPhone || '').replace(/"/g, '""')}"`,
      `"${(tr.serial || '').replace(/"/g, '""')}"`,
      tr.cost,
      tr.price,
      tr.price - tr.cost,
      `"${(tr.dateStr || '').replace(/"/g, '""')}"`,
      `"${(tr.timeStr || '').replace(/"/g, '""')}"`,
      `"${(tr.dayStr || '').replace(/"/g, '""')}"`,
      tr.timestamp || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t.exportSuccess);
  };

  const exportAllToCSV = () => {
    exportToCSV(transactions, `sales_report_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const exportSingleToCSV = (saleItem: Transaction) => {
    exportToCSV([saleItem], `sale_${saleItem.itemName.replace(/\s+/g, '_')}_${saleItem.id}.csv`);
  };

  // Robust CSV Import Handler supporting headers, mobile MIME types, quotes, and UTF-8 BOM
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) return;

        // Clean content: remove BOM if present and normalize line breaks
        const cleanContent = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Split lines respecting quotes
        const lines: string[] = [];
        let cur = '';
        let inQuotes = false;

        for (let i = 0; i < cleanContent.length; i++) {
          const char = cleanContent[i];
          if (char === '"') {
            inQuotes = !inQuotes;
            cur += char;
          } else if (char === '\n' && !inQuotes) {
            lines.push(cur);
            cur = '';
          } else {
            cur += char;
          }
        }
        if (cur) lines.push(cur);

        const cleanLines = lines.map(l => l.trim()).filter(l => l.length > 0);
        if (cleanLines.length < 1) {
          showToast(t.importError, 'error');
          return;
        }

        const splitLine = (line: string): string[] => {
          const res: string[] = [];
          let f = '';
          let q = false;
          for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (c === '"') {
              if (q && line[i + 1] === '"') {
                f += '"';
                i++;
              } else {
                q = !q;
              }
            } else if (c === ',' && !q) {
              res.push(f.replace(/^"|"$/g, '').trim());
              f = '';
            } else {
              f += c;
            }
          }
          res.push(f.replace(/^"|"$/g, '').trim());
          return res;
        };

        const firstRow = splitLine(cleanLines[0]);
        const header = firstRow.map(h => h.toLowerCase());

        // Check if first line is a header row
        const hasHeader = header.some(h => 
          h.includes('item') || h.includes('name') || h.includes('price') || 
          h.includes('cost') || h.includes('کالا') || h.includes('نرخی') || h.includes('id')
        );

        const idIdx = header.findIndex(h => h.includes('id'));
        const nameIdx = header.findIndex(h => h.includes('item name') || h.includes('item') || h.includes('کالا') || h === 'name');
        const buyerIdx = header.findIndex(h => h.includes('buyer name') || h.includes('buyer') || h.includes('کڕیار'));
        const phoneIdx = header.findIndex(h => h.includes('buyer phone') || h.includes('phone') || h.includes('مۆبایل'));
        const serialIdx = header.findIndex(h => h.includes('serial') || h.includes('زنجیرەیی'));
        const costIdx = header.findIndex(h => h.includes('cost') || h.includes('کڕین'));
        const priceIdx = header.findIndex(h => h.includes('sold') || h.includes('price') || h.includes('selling') || h.includes('فرۆشتن'));
        const dateIdx = header.findIndex(h => h.includes('date') || h.includes('بەروار'));
        const timeIdx = header.findIndex(h => h.includes('time') || h.includes('کات'));
        const dayIdx = header.findIndex(h => h.includes('day') || h.includes('ڕۆژ'));
        const timestampIdx = header.findIndex(h => h.includes('timestamp'));

        const startIndex = hasHeader ? 1 : 0;
        const importedItems: Transaction[] = [];

        for (let i = startIndex; i < cleanLines.length; i++) {
          const row = splitLine(cleanLines[i]);
          if (row.length === 0) continue;

          let itemName = '';
          let cost = 0;
          let price = 0;
          let buyerName = '';
          let buyerPhone = '';
          let serial = '';
          let dateStr = '';
          let timeStr = '';
          let dayStr = '';
          let parsedId = 0;
          let parsedTimestamp = 0;

          if (hasHeader) {
            itemName = nameIdx !== -1 ? row[nameIdx] : (row[1] || row[0] || '');
            buyerName = buyerIdx !== -1 ? row[buyerIdx] : '';
            buyerPhone = phoneIdx !== -1 ? row[phoneIdx] : '';
            serial = serialIdx !== -1 ? row[serialIdx] : '';
            cost = costIdx !== -1 ? parseFloat(row[costIdx]) : 0;
            price = priceIdx !== -1 ? parseFloat(row[priceIdx]) : 0;
            dateStr = dateIdx !== -1 ? row[dateIdx] : '';
            timeStr = timeIdx !== -1 ? row[timeIdx] : '';
            dayStr = dayIdx !== -1 ? row[dayIdx] : '';
            parsedId = idIdx !== -1 && !isNaN(parseInt(row[idIdx])) ? parseInt(row[idIdx]) : 0;
            parsedTimestamp = timestampIdx !== -1 && !isNaN(parseInt(row[timestampIdx])) ? parseInt(row[timestampIdx]) : 0;
          } else {
            // Positional fallback
            if (row.length >= 3) {
              if (!isNaN(parseFloat(row[0])) && row.length >= 4) {
                parsedId = parseInt(row[0]) || 0;
                itemName = row[1] || '';
                price = parseFloat(row[2]) || 0;
                cost = parseFloat(row[3]) || 0;
                dateStr = row[4] || '';
              } else {
                itemName = row[0] || '';
                cost = parseFloat(row[1]) || 0;
                price = parseFloat(row[2]) || 0;
                dateStr = row[3] || '';
              }
            } else {
              itemName = row[0] || '';
              price = parseFloat(row[1]) || 0;
            }
          }

          if (!itemName) continue;

          const now = new Date();
          const finalId = parsedId || (Date.now() + i);
          const finalTimestamp = parsedTimestamp || now.getTime();

          importedItems.push({
            id: finalId,
            itemName,
            buyerName: buyerName || '',
            buyerPhone: buyerPhone || '',
            serial: serial || '',
            cost: isNaN(cost) ? 0 : cost,
            price: isNaN(price) ? 0 : price,
            timestamp: finalTimestamp,
            dateStr: dateStr || now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            timeStr: timeStr || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            dayStr: dayStr || now.toLocaleDateString('en-US', { weekday: 'long' })
          });
        }

        if (importedItems.length === 0) {
          showToast(t.importError, 'error');
          return;
        }

        setTransactions(prev => {
          const existingIds = new Set(prev.map(x => x.id));
          const newUnique = importedItems.filter(x => !existingIds.has(x.id));
          const updated = [...newUnique, ...prev];
          localStorage.setItem('transactions', JSON.stringify(updated));
          return updated;
        });

        showToast(`${t.importSuccess} (+${importedItems.length})`);
      } catch (err) {
        console.error("CSV Parse error", err);
        showToast(t.importError, 'error');
      } finally {
        if (e.target) e.target.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };

  const selectedTx = transactions.find(x => x.id === detailTransactionId);
  const selectedProfit = selectedTx ? selectedTx.price - selectedTx.cost : 0;

  return (
    <div className={darkMode ? "min-h-screen bg-slate-900 text-slate-100 transition-colors duration-300 relative pb-24 border-t-4 border-indigo-600 font-sans antialiased" : "min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 relative pb-24 border-t-4 border-indigo-600 font-sans antialiased"} dir="auto">
      
      {/* Toast Notifications */}
      <div className="fixed top-4 end-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border animate-in slide-in-from-top-3 fade-in duration-200 ${
              toast.type === 'error' 
                ? 'bg-red-50 dark:bg-red-950/90 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900' 
                : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header Section */}
        <header className={darkMode ? "flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-700 gap-4 transition-colors duration-300" : "flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 gap-4 transition-colors duration-300"}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className={darkMode ? "text-xl font-extrabold leading-tight tracking-tight text-white" : "text-xl font-extrabold leading-tight tracking-tight text-slate-900"}>{t.appTitle}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Exchange Rate Input */}
            <div className={darkMode ? "flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700 flex-1 sm:flex-none" : "flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex-1 sm:flex-none"}>
              <label htmlFor="input-exchange-rate" className={darkMode ? "text-xs font-semibold text-slate-400 whitespace-nowrap" : "text-xs font-semibold text-slate-500 whitespace-nowrap"}>{t.exchangeRateLabel}</label>
              <input 
                type="number" 
                id="input-exchange-rate" 
                className={darkMode ? "w-20 bg-transparent text-sm font-bold text-white outline-none text-right" : "w-20 bg-transparent text-sm font-bold text-slate-900 outline-none text-right"} 
                dir="ltr" 
                value={exchangeRate}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) setExchangeRate(val);
                }}
              />
              <span className={darkMode ? "text-xs font-semibold text-slate-400" : "text-xs font-semibold text-slate-500"}>IQD</span>
            </div>

            {/* Currency Toggle Button */}
            <button 
              type="button" 
              onClick={() => setCurrency(currency === 'USD' ? 'IQD' : 'USD')}
              className={darkMode ? "px-3 py-1.5 border border-slate-700 bg-slate-900 hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 transition-transform duration-150 active:scale-90 flex items-center gap-1.5" : "px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-transform duration-150 active:scale-90 flex items-center gap-1.5"}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
              <span>{currency === 'USD' ? 'USD ($)' : 'IQD (د.ع)'}</span>
            </button>

            {/* Dark/Light Mode Toggle */}
            <button 
              type="button" 
              onClick={() => setDarkMode(!darkMode)}
              className={darkMode ? "p-2 border border-slate-700 bg-slate-900 hover:bg-slate-700/80 rounded-xl text-slate-200 transition-transform duration-150 active:scale-90 flex items-center gap-1" : "p-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-700 transition-transform duration-150 active:scale-90 flex items-center gap-1"}
              title={darkMode ? t.themeLight : t.themeDark}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Language Toggle */}
            <button 
              type="button" 
              onClick={() => setLang(lang === 'en' ? 'ku' : 'en')}
              className={darkMode ? "px-3 py-1.5 border border-slate-700 bg-slate-900 hover:bg-slate-700/80 rounded-xl text-xs font-bold text-slate-200 transition-transform duration-150 active:scale-90" : "px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-transform duration-150 active:scale-90"}
            >
              {t.langToggle}
            </button>

            {/* Global Export CSV Button */}
            <button 
              type="button"
              onClick={exportAllToCSV}
              className={darkMode ? "px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-xl text-xs font-bold transition-transform duration-150 active:scale-90 flex items-center gap-1.5" : "px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold transition-transform duration-150 active:scale-90 flex items-center gap-1.5"}
              title={t.exportAll}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.exportAll}</span>
            </button>

            {/* Global Import CSV Button connected to hidden file input */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={darkMode ? "px-3 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-transform duration-150 active:scale-90 flex items-center gap-1.5" : "px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-transform duration-150 active:scale-90 flex items-center gap-1.5"}
              title={t.importData}
            >
              <Upload className={darkMode ? "w-3.5 h-3.5 text-slate-400" : "w-3.5 h-3.5 text-slate-500"} />
              <span>{t.importData}</span>
            </button>

            {/* Hidden CSV File Input with Mobile/Android MIME Types */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleCSVImport} 
              accept=".csv, text/csv, text/plain, application/vnd.ms-excel" 
              className="hidden" 
            />
          </div>
        </header>

        <main>
          {/* Dashboard Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-4 mb-6">
            <div className={darkMode ? "p-4 rounded-xl border border-slate-700 bg-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer" : "p-4 rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer"}>
              <div className={darkMode ? "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.totalItems}</div>
              <div className={darkMode ? "text-2xl font-black text-white" : "text-2xl font-black text-slate-900"}>{stats.items}</div>
            </div>
            
            <div className={darkMode ? "p-4 rounded-xl border border-slate-700 bg-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer" : "p-4 rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer"}>
              <div className={darkMode ? "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.totalCost}</div>
              <div className={darkMode ? "text-xl md:text-2xl font-black text-white font-mono" : "text-xl md:text-2xl font-black text-slate-900 font-mono"}>{formatMoney(stats.cost)}</div>
            </div>

            <div className={darkMode ? "p-4 rounded-xl border border-slate-700 bg-slate-800 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer" : "p-4 rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer"}>
              <div className={darkMode ? "text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.totalSold}</div>
              <div className={darkMode ? "text-xl md:text-2xl font-black text-white font-mono" : "text-xl md:text-2xl font-black text-slate-900 font-mono"}>{formatMoney(stats.sold)}</div>
            </div>

            <div className={darkMode ? "p-4 rounded-xl border border-indigo-900/60 bg-indigo-950/30 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer" : "p-4 rounded-xl border border-indigo-200 bg-indigo-50/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-95 cursor-pointer"}>
              <div className={darkMode ? "text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1" : "text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-1"}>{t.totalProfit}</div>
              <div className={`text-xl md:text-2xl font-black font-mono ${stats.profit >= 0 ? (darkMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-rose-600'}`}>
                {formatMoney(stats.profit)}
              </div>
            </div>
          </div>

          {/* History Order List Container */}
          <div className={darkMode ? "bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300" : "bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-colors duration-300"}>
            <div className={darkMode ? "px-4 py-3.5 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/50 gap-4" : "px-4 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4"}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
                <h3 className={darkMode ? "text-xs font-extrabold text-slate-200 uppercase tracking-wider" : "text-xs font-extrabold text-slate-700 uppercase tracking-wider"}>{t.historyTitle}</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                {/* Profit/Loss Filter Tabs */}
                <div className={darkMode ? "flex bg-slate-900 p-1 rounded-xl" : "flex bg-slate-200/60 p-1 rounded-xl"}>
                  <button 
                    type="button" 
                    onClick={() => setCurrentTab('all')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs transition-transform duration-150 active:scale-90 ${currentTab === 'all' ? (darkMode ? 'font-bold bg-slate-700 text-indigo-300 shadow-sm' : 'font-bold bg-white text-indigo-600 shadow-sm') : (darkMode ? 'font-semibold text-slate-400 hover:text-slate-200' : 'font-semibold text-slate-500 hover:text-slate-700')}`}
                  >
                    {t.tabAll}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCurrentTab('profit')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs transition-transform duration-150 active:scale-90 ${currentTab === 'profit' ? (darkMode ? 'font-bold bg-slate-700 text-indigo-300 shadow-sm' : 'font-bold bg-white text-indigo-600 shadow-sm') : (darkMode ? 'font-semibold text-slate-400 hover:text-slate-200' : 'font-semibold text-slate-500 hover:text-slate-700')}`}
                  >
                    {t.tabProfit}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCurrentTab('loss')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs transition-transform duration-150 active:scale-90 ${currentTab === 'loss' ? (darkMode ? 'font-bold bg-slate-700 text-indigo-300 shadow-sm' : 'font-bold bg-white text-indigo-600 shadow-sm') : (darkMode ? 'font-semibold text-slate-400 hover:text-slate-200' : 'font-semibold text-slate-500 hover:text-slate-700')}`}
                  >
                    {t.tabLoss}
                  </button>
                </div>
                
                {/* Search Input Bar */}
                <div className="relative w-full sm:w-60">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={darkMode ? "w-full ps-9 pe-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-500 text-slate-100 font-medium" : "w-full ps-9 pe-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-800 font-medium"} 
                    placeholder={t.searchPlaceholder}
                  />
                  <Search className={darkMode ? "absolute start-2.5 top-2 w-3.5 h-3.5 text-slate-500" : "absolute start-2.5 top-2 w-3.5 h-3.5 text-slate-400"} />
                </div>
              </div>
            </div>
            
            {/* Sales Item Cards List */}
            <div className={darkMode ? "divide-y divide-slate-700/60" : "divide-y divide-slate-100"}>
              {filteredTransactions.map(tr => {
                const profit = tr.price - tr.cost;
                const profitColor = profit >= 0 
                  ? (darkMode ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800' : 'text-emerald-700 bg-emerald-50 border border-emerald-200')
                  : (darkMode ? 'text-rose-300 bg-rose-950/60 border border-rose-800' : 'text-rose-700 bg-rose-50 border border-rose-200');
                
                return (
                  <div 
                    key={tr.id} 
                    className={darkMode ? "px-4 py-3.5 hover:bg-slate-700/50 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer flex justify-between items-center group gap-3" : "px-4 py-3.5 hover:bg-slate-50/80 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer flex justify-between items-center group gap-3"}
                    onClick={() => setDetailTransactionId(tr.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={darkMode ? "font-bold text-slate-100 group-hover:text-indigo-400 transition-colors truncate text-sm" : "font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate text-sm"}>
                        {tr.itemName}
                      </div>
                      <div className={darkMode ? "text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5" : "text-xs text-slate-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5"}>
                        <span>{tr.dateStr}</span>
                        <span>•</span>
                        <span>{tr.timeStr}</span>
                        {tr.buyerName && (
                          <>
                            <span>•</span>
                            <span className={darkMode ? "text-slate-300 font-sans" : "text-slate-600 font-sans"}>{tr.buyerName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-2.5 shrink-0">
                      <div className="flex flex-col items-end">
                        <div className={darkMode ? "font-mono text-indigo-400 font-bold text-sm" : "font-mono text-indigo-600 font-bold text-sm"}>{formatMoney(tr.price)}</div>
                        <div className={`text-[10px] font-bold mt-0.5 px-2 py-0.5 rounded-full ${profitColor}`}>
                          {profit >= 0 ? '+' : ''}{formatMoney(profit)}
                        </div>
                      </div>

                      {/* Single Item Export Button */}
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportSingleToCSV(tr);
                        }}
                        className={darkMode ? "p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/50 rounded-lg transition-transform duration-150 active:scale-90" : "p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-transform duration-150 active:scale-90"}
                        title={t.exportSingleTooltip}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredTransactions.length === 0 && (
              <div className="p-12 text-center">
                <FolderOpen className={darkMode ? "w-10 h-10 text-slate-600 mx-auto mb-3" : "w-10 h-10 text-slate-300 mx-auto mb-3"} />
                <div className={darkMode ? "text-slate-400 font-medium text-sm" : "text-slate-500 font-medium text-sm"}>{t.noRecords}</div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        type="button" 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 end-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-transform duration-150 active:scale-90 z-20" 
        aria-label="Add new record"
      >
        <Plus className="w-6 h-6" />
      </button>
      
      {/* Add New Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={darkMode ? "bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" : "bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"}>
            <div className={darkMode ? "px-5 py-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center" : "px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"}>
              <h2 className={darkMode ? "text-base font-bold text-white" : "text-base font-bold text-slate-800"}>{t.addTitle}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className={darkMode ? "text-slate-400 hover:text-slate-200 transition-colors" : "text-slate-400 hover:text-slate-600 transition-colors"}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label htmlFor="input-itemName" className={darkMode ? "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.itemName}</label>
                  <input type="text" id="input-itemName" name="itemName" required className={darkMode ? "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-white" : "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-slate-900"} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-buyerName" className={darkMode ? "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.buyerName}</label>
                    <input type="text" id="input-buyerName" name="buyerName" className={darkMode ? "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-white" : "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-slate-900"} />
                  </div>
                  <div>
                    <label htmlFor="input-buyerPhone" className={darkMode ? "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.buyerPhone}</label>
                    <input type="tel" id="input-buyerPhone" name="buyerPhone" className={darkMode ? "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-white" : "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-slate-900"} dir="ltr" />
                  </div>
                </div>

                <div>
                  <label htmlFor="input-serial" className={darkMode ? "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.serialNumber}</label>
                  <input type="text" id="input-serial" name="serial" className={darkMode ? "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm text-white" : "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm text-slate-900"} dir="ltr" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-cost" className={darkMode ? "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.costPrice}</label>
                    <input type="number" step="0.01" min="0" id="input-cost" name="cost" required className={darkMode ? "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm font-bold text-white" : "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm font-bold text-slate-900"} dir="ltr" />
                  </div>
                  <div>
                    <label htmlFor="input-price" className={darkMode ? "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1" : "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1"}>{t.sellingPrice}</label>
                    <input type="number" step="0.01" min="0" id="input-price" name="price" required className={darkMode ? "w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm font-bold text-white" : "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm font-bold text-slate-900"} dir="ltr" />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className={darkMode ? "flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-semibold text-sm transition-transform duration-150 active:scale-90" : "flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-transform duration-150 active:scale-90"}>{t.cancel}</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20 transition-transform duration-150 active:scale-90">{t.save}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={darkMode ? "bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200" : "bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"}>
            <div className={darkMode ? "px-5 py-4 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center" : "px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center"}>
              <h2 className={darkMode ? "text-xs font-bold text-slate-200 uppercase tracking-wider" : "text-xs font-bold text-slate-700 uppercase tracking-wider"}>{t.detailTitle}</h2>
              <button onClick={() => setDetailTransactionId(null)} className={darkMode ? "text-slate-400 hover:text-slate-200 transition-colors" : "text-slate-400 hover:text-slate-600 transition-colors"}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={darkMode ? "text-slate-400 font-medium uppercase" : "text-slate-400 font-medium uppercase"}>{t.itemName}</div>
                  <div className={darkMode ? "text-white font-bold text-right text-sm" : "text-slate-900 font-bold text-right text-sm"}>{selectedTx.itemName}</div>
                  
                  <div className={darkMode ? "text-slate-400 font-medium uppercase" : "text-slate-400 font-medium uppercase"}>{t.buyerName}</div>
                  <div className={darkMode ? "text-slate-200 font-semibold text-right" : "text-slate-800 font-semibold text-right"}>{selectedTx.buyerName || '-'}</div>
                  
                  <div className={darkMode ? "text-slate-400 font-medium uppercase" : "text-slate-400 font-medium uppercase"}>{t.buyerPhone}</div>
                  <div className={darkMode ? "text-slate-200 font-mono text-right" : "text-slate-800 font-mono text-right"}>{selectedTx.buyerPhone || '-'}</div>
                  
                  <div className={darkMode ? "text-slate-400 font-medium uppercase" : "text-slate-400 font-medium uppercase"}>{t.serialNumber}</div>
                  <div className={darkMode ? "text-slate-200 font-mono text-right" : "text-slate-800 font-mono text-right"}>{selectedTx.serial || '-'}</div>
                </div>

                <div className={darkMode ? "h-px bg-slate-700 my-3" : "h-px bg-slate-100 my-3"}></div>

                <div className="grid grid-cols-2 gap-2 text-xs items-center">
                  <div className="text-slate-400 font-medium">{t.costPrice}</div>
                  <div className="text-right text-rose-600 font-mono font-bold text-sm">{formatMoney(selectedTx.cost)}</div>
                  
                  <div className="text-slate-400 font-medium">{t.sellingPrice}</div>
                  <div className={darkMode ? "text-right text-indigo-400 font-mono font-bold text-sm" : "text-right text-indigo-600 font-mono font-bold text-sm"}>{formatMoney(selectedTx.price)}</div>
                  
                  <div className={darkMode ? "text-indigo-400 font-bold uppercase mt-2" : "text-indigo-600 font-bold uppercase mt-2"}>{t.profit}</div>
                  <div className={`text-right ${selectedProfit >= 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : 'text-rose-600'} font-black text-base mt-2 font-mono`}>
                    {selectedProfit >= 0 ? '+' : ''}{formatMoney(selectedProfit)}
                  </div>
                </div>
                
                <div className={darkMode ? "mt-4 pt-3 border-t border-slate-700 italic text-[11px] text-slate-400 text-center" : "mt-4 pt-3 border-t border-slate-100 italic text-[11px] text-slate-400 text-center"}>
                  {selectedTx.dayStr}, {selectedTx.dateStr} at {selectedTx.timeStr}
                </div>
              </div>
            </div>

            <div className={darkMode ? "p-4 border-t border-slate-700 bg-slate-900/40 flex flex-wrap gap-2.5" : "p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-2.5"}>
               {/* Single Item Export Button */}
               <button 
                type="button" 
                onClick={() => exportSingleToCSV(selectedTx)} 
                className={darkMode ? "px-3 py-2 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 rounded-xl font-bold text-xs transition-transform duration-150 active:scale-90 flex-1 flex justify-center items-center gap-1.5" : "px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold text-xs transition-transform duration-150 active:scale-90 flex-1 flex justify-center items-center gap-1.5"}
              >
                 <Download className="w-4 h-4" />
                 <span>{t.exportItem}</span>
               </button>

               {/* Delete Button */}
               <button 
                type="button" 
                onClick={() => setDeleteConfirmId(selectedTx.id)} 
                className={darkMode ? "px-3 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-xl font-bold text-xs transition-transform duration-150 active:scale-90 flex-1 flex justify-center items-center gap-1.5" : "px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs transition-transform duration-150 active:scale-90 flex-1 flex justify-center items-center gap-1.5"}
              >
                 <Trash2 className="w-4 h-4" />
                 <span>{t.delete}</span>
               </button>

               <button 
                type="button" 
                onClick={() => setDetailTransactionId(null)} 
                className={darkMode ? "px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold text-xs transition-transform duration-150 active:scale-90 w-full sm:w-auto" : "px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-xs transition-transform duration-150 active:scale-90 w-full sm:w-auto"}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={darkMode ? "bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-sm p-5 text-center animate-in zoom-in-95 duration-200" : "bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 text-center animate-in zoom-in-95 duration-200"}>
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className={darkMode ? "text-base font-bold text-white mb-1" : "text-base font-bold text-slate-900 mb-1"}>{t.deleteConfirmTitle}</h3>
            <p className={darkMode ? "text-xs text-slate-400 mb-5" : "text-xs text-slate-500 mb-5"}>{t.deleteConfirmMsg}</p>
            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setDeleteConfirmId(null)}
                className={darkMode ? "flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition-transform duration-150 active:scale-90" : "flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-transform duration-150 active:scale-90"}
              >
                {t.cancel}
              </button>
              <button 
                type="button" 
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-transform duration-150 active:scale-90"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
