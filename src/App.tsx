import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Trash2, Search, FolderOpen, BarChart3 } from 'lucide-react';

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
    profit: 'Net Profit'
  },
  ku: {
    appTitle: 'بەدواداچوونی فرۆشتن',
    langToggle: 'English',
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
    profit: 'قازانجی پوخت'
  }
};

type LangType = 'en' | 'ku';
type CurrencyType = 'USD' | 'IQD';
type TabType = 'all' | 'profit' | 'loss';

export default function App() {
  const [lang, setLang] = useState<LangType>(() => (localStorage.getItem('appLang') as LangType) || 'en');
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

  // Sync state to local storage when changed
  useEffect(() => {
    localStorage.setItem('appLang', lang);
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('appCurrency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('exchangeRate', exchangeRate.toString());
  }, [exchangeRate]);

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
        if (!nameMatch && !serialMatch) return false;
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
  };

  const handleDelete = (id: number) => {
    setTransactions(prev => prev.filter(x => x.id !== id));
    setDetailTransactionId(null);
  };

  const selectedTx = transactions.find(x => x.id === detailTransactionId);
  const selectedProfit = selectedTx ? selectedTx.price - selectedTx.cost : 0;

  return (
    <div className={`bg-slate-50 text-slate-900 font-sans antialiased min-h-screen relative pb-24 transition-colors duration-200 border-t-4 border-indigo-600 ${lang === 'ku' ? 'rtl' : 'ltr'}`}>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{t.appTitle}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 flex-1 md:flex-none">
              <label htmlFor="input-exchange-rate" className="text-xs font-semibold text-slate-500 whitespace-nowrap">{t.exchangeRateLabel}</label>
              <input 
                type="number" 
                id="input-exchange-rate" 
                className="w-20 bg-transparent text-sm font-bold text-slate-900 outline-none text-right" 
                dir="ltr" 
                value={exchangeRate}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) setExchangeRate(val);
                }}
              />
              <span className="text-xs font-semibold text-slate-500">IQD</span>
            </div>
            <button 
              type="button" 
              onClick={() => setCurrency(currency === 'USD' ? 'IQD' : 'USD')}
              className="px-3 py-1.5 border border-slate-200 bg-slate-50 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {currency === 'USD' ? 'USD ($)' : 'IQD (د.ع)'}
            </button>
            <button 
              type="button" 
              onClick={() => setLang(lang === 'en' ? 'ku' : 'en')}
              className="px-3 py-1.5 border border-slate-200 rounded-md text-xs font-semibold hover:bg-slate-50"
            >
              {t.langToggle}
            </button>
          </div>
        </header>

        <main>
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.totalItems}</div>
              <div className="text-2xl font-bold text-slate-900">{stats.items}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.totalCost}</div>
              <div className="text-2xl font-bold text-slate-900">{formatMoney(stats.cost)}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.totalSold}</div>
              <div className="text-2xl font-bold text-slate-900">{formatMoney(stats.sold)}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-md bg-indigo-50/30">
              <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">{t.totalProfit}</div>
              <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                {formatMoney(stats.profit)}
              </div>
            </div>
          </div>

          {/* History List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 gap-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight whitespace-nowrap">{t.historyTitle}</h3>
              
              <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                <div className="flex bg-slate-200/50 p-1 rounded-lg">
                  <button 
                    type="button" 
                    onClick={() => setCurrentTab('all')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs transition-all ${currentTab === 'all' ? 'font-bold bg-white text-indigo-600 shadow-sm' : 'font-semibold text-slate-500 hover:text-slate-700'}`}
                  >
                    {t.tabAll}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCurrentTab('profit')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs transition-all ${currentTab === 'profit' ? 'font-bold bg-white text-indigo-600 shadow-sm' : 'font-semibold text-slate-500 hover:text-slate-700'}`}
                  >
                    {t.tabProfit}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setCurrentTab('loss')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs transition-all ${currentTab === 'loss' ? 'font-bold bg-white text-indigo-600 shadow-sm' : 'font-semibold text-slate-500 hover:text-slate-700'}`}
                  >
                    {t.tabLoss}
                  </button>
                </div>
                
                <div className="relative w-full sm:w-56">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full ps-9 pe-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-800 font-medium" 
                    placeholder={t.searchPlaceholder}
                  />
                  <Search className="absolute start-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {filteredTransactions.map(tr => {
                const profit = tr.price - tr.cost;
                const profitColor = profit >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
                return (
                  <div 
                    key={tr.id} 
                    onClick={() => setDetailTransactionId(tr.id)}
                    className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{tr.itemName}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{tr.dateStr} {tr.timeStr} {tr.buyerName ? '• ' + tr.buyerName : ''}</div>
                    </div>
                    <div className="text-right flex flex-col justify-end items-end">
                      <div className="font-mono text-indigo-600 font-bold">{formatMoney(tr.price)}</div>
                      <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${profitColor}`}>
                        {profit >= 0 ? '+' : ''}{formatMoney(profit)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredTransactions.length === 0 && (
              <div className="p-10 text-center">
                <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <div className="text-slate-500 font-medium text-sm">{t.noRecords}</div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button (FAB) */}
      <button 
        type="button" 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-8 end-8 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 hover:-translate-y-1 z-10" 
        aria-label="Add new record"
      >
        <Plus className="w-6 h-6" />
      </button>
      
      {/* Add New Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">{t.addTitle}</h2>
            </div>
            <div className="p-5 overflow-y-auto">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label htmlFor="input-itemName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.itemName}</label>
                  <input type="text" id="input-itemName" name="itemName" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-slate-900" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-buyerName" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.buyerName}</label>
                    <input type="text" id="input-buyerName" name="buyerName" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-slate-900" />
                  </div>
                  <div>
                    <label htmlFor="input-buyerPhone" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.buyerPhone}</label>
                    <input type="tel" id="input-buyerPhone" name="buyerPhone" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm text-slate-900" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label htmlFor="input-serial" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.serialNumber}</label>
                  <input type="text" id="input-serial" name="serial" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm text-slate-900" dir="ltr" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="input-cost" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.costPrice}</label>
                    <input type="number" step="0.01" min="0" id="input-cost" name="cost" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm font-bold text-slate-900" dir="ltr" />
                  </div>
                  <div>
                    <label htmlFor="input-price" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{t.sellingPrice}</label>
                    <input type="number" step="0.01" min="0" id="input-price" name="price" required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-mono text-sm font-bold text-slate-900" dir="ltr" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-sm transition-colors">{t.cancel}</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-sm shadow-sm transition-colors">{t.save}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">{t.detailTitle}</h2>
              <button onClick={() => setDetailTransactionId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400 font-medium uppercase">{t.itemName}</div>
                  <div className="text-slate-900 font-semibold text-right text-sm">{selectedTx.itemName}</div>
                  
                  <div className="text-slate-400 font-medium uppercase">{t.buyerName}</div>
                  <div className="text-slate-900 font-semibold text-right">{selectedTx.buyerName || '-'}</div>
                  
                  <div className="text-slate-400 font-medium uppercase">{t.buyerPhone}</div>
                  <div className="text-slate-900 font-mono text-right">{selectedTx.buyerPhone || '-'}</div>
                  
                  <div className="text-slate-400 font-medium uppercase">{t.serialNumber}</div>
                  <div className="text-slate-900 font-mono text-right">{selectedTx.serial || '-'}</div>
                </div>
                <div className="h-px bg-slate-100 my-3"></div>
                <div className="grid grid-cols-2 gap-2 text-xs items-center">
                  <div className="text-slate-400">{t.costPrice}</div>
                  <div className="text-right text-red-600 font-mono font-bold">{formatMoney(selectedTx.cost)}</div>
                  <div className="text-slate-400">{t.sellingPrice}</div>
                  <div className="text-right text-blue-600 font-mono font-bold">{formatMoney(selectedTx.price)}</div>
                  <div className="text-indigo-600 font-bold uppercase mt-2">{t.profit}</div>
                  <div className={`text-right ${selectedProfit >= 0 ? 'text-green-600' : 'text-red-600'} font-bold text-sm mt-2 font-mono`}>
                    {selectedProfit >= 0 ? '+' : ''}{formatMoney(selectedProfit)}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-50 italic text-[10px] text-slate-400 text-center">
                  {selectedTx.dayStr}, {selectedTx.dateStr} at {selectedTx.timeStr}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
               <button 
                type="button" 
                onClick={() => handleDelete(selectedTx.id)} 
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md font-semibold text-sm transition-colors flex-1 flex justify-center items-center gap-2"
              >
                 <Trash2 className="w-4 h-4" />
                 <span>{t.delete}</span>
               </button>
               <button 
                type="button" 
                onClick={() => setDetailTransactionId(null)} 
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-semibold text-sm transition-colors flex-1"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
