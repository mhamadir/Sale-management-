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
    profit: 'Profit'
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
    buyerPhone: 'ژمارەی تەلەفۆن',
    serialNumber: 'ژمارەی زنجیرەیی',
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
    profit: 'قازانج'
  }
};

let currentLang = localStorage.getItem('appLang') || 'en';
let currentCurrency = localStorage.getItem('appCurrency') || 'USD';
let exchangeRate = parseFloat(localStorage.getItem('exchangeRate')) || 150000;
let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
let currentTab = 'all';
let searchQuery = '';

const formatMoney = (amount) => {
  if (currentCurrency === 'IQD') {
    const iqdAmount = (amount / 100) * exchangeRate;
    return new Intl.NumberFormat(currentLang === 'en' ? 'en-US' : 'ku-IQ', {
      maximumFractionDigits: 0
    }).format(iqdAmount) + ' د.ع';
  }
  return new Intl.NumberFormat(currentLang === 'en' ? 'en-US' : 'ku-IQ', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const updateDOM = () => {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ku' ? 'rtl' : 'ltr';
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[currentLang][key]) {
      el.textContent = i18n[currentLang][key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[currentLang][key]) {
      el.placeholder = i18n[currentLang][key];
    }
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === currentTab) {
      btn.className = 'tab-btn flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-bold bg-white text-indigo-600 shadow-sm transition-all';
    } else {
      btn.className = 'tab-btn flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs font-semibold text-slate-500 hover:text-slate-700 transition-all';
    }
  });

  document.getElementById('currencyToggle').textContent = currentCurrency === 'USD' ? 'USD ($)' : 'IQD (د.ع)';
  
  renderDashboard();
  renderHistory();
};

const toggleLang = () => {
  currentLang = currentLang === 'en' ? 'ku' : 'en';
  localStorage.setItem('appLang', currentLang);
  updateDOM();
};

const toggleCurrency = () => {
  currentCurrency = currentCurrency === 'USD' ? 'IQD' : 'USD';
  localStorage.setItem('appCurrency', currentCurrency);
  updateDOM();
};

const getFilteredTransactions = () => {
  return transactions.filter(t => {
    const profit = Number(t.price) - Number(t.cost);
    
    if (currentTab === 'profit' && profit <= 0) return false;
    if (currentTab === 'loss' && profit > 0) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameMatch = (t.itemName || '').toLowerCase().includes(q);
      const serialMatch = (t.serial || '').toLowerCase().includes(q);
      if (!nameMatch && !serialMatch) return false;
    }
    
    return true;
  });
};

const renderDashboard = () => {
  const filtered = getFilteredTransactions();
  const items = filtered.length;
  const cost = filtered.reduce((sum, t) => sum + Number(t.cost), 0);
  const sold = filtered.reduce((sum, t) => sum + Number(t.price), 0);
  const profit = sold - cost;

  document.getElementById('stat-items').textContent = items;
  document.getElementById('stat-cost').textContent = formatMoney(cost);
  document.getElementById('stat-sold').textContent = formatMoney(sold);
  
  const profitEl = document.getElementById('stat-profit');
  profitEl.textContent = formatMoney(profit);
  profitEl.className = `text-2xl font-bold ${profit >= 0 ? 'text-indigo-700' : 'text-red-600'}`;
};

const renderHistory = () => {
  const list = document.getElementById('history-list');
  const noRecords = document.getElementById('no-records');
  const filtered = getFilteredTransactions();
  
  list.innerHTML = '';
  if (filtered.length === 0) {
    noRecords.classList.remove('hidden');
  } else {
    noRecords.classList.add('hidden');
    
    // Sort by newest first
    const sorted = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
    
    sorted.forEach(t => {
      const el = document.createElement('div');
      el.className = 'px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors flex justify-between items-center group';
      el.onclick = () => openDetailModal(t.id);
      
      const profit = Number(t.price) - Number(t.cost);
      const profitColor = profit >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
      
      el.innerHTML = `
        <div class="flex-1">
          <div class="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">${t.itemName}</div>
          <div class="text-xs text-slate-400 font-mono mt-0.5">${t.dateStr} ${t.timeStr} ${t.buyerName ? '• ' + t.buyerName : ''}</div>
        </div>
        <div class="text-right flex flex-col justify-end items-end">
          <div class="font-mono text-indigo-600 font-bold">${formatMoney(t.price)}</div>
          <div class="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full ${profitColor}">${profit >= 0 ? '+' : ''}${formatMoney(profit)}</div>
        </div>
      `;
      list.appendChild(el);
    });
  }
};

// Modals Setup
const addModal = document.getElementById('modal-add');
const detailModal = document.getElementById('modal-detail');

const openAddModal = () => {
  document.getElementById('form-add').reset();
  addModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
};

const closeAddModal = () => {
  addModal.classList.add('hidden');
  document.body.style.overflow = '';
};

const openDetailModal = (id) => {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  
  const profit = Number(t.price) - Number(t.cost);
  
  const detailContent = document.getElementById('detail-content');
  detailContent.innerHTML = `
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="text-slate-400 font-medium uppercase">${i18n[currentLang].itemName}</div>
        <div class="text-slate-900 font-semibold text-right text-sm">${t.itemName}</div>
        
        <div class="text-slate-400 font-medium uppercase">${i18n[currentLang].buyerName}</div>
        <div class="text-slate-900 font-semibold text-right">${t.buyerName || '-'}</div>
        
        <div class="text-slate-400 font-medium uppercase">${i18n[currentLang].buyerPhone}</div>
        <div class="text-slate-900 font-mono text-right">${t.buyerPhone || '-'}</div>
        
        <div class="text-slate-400 font-medium uppercase">${i18n[currentLang].serialNumber}</div>
        <div class="text-slate-900 font-mono text-right">${t.serial || '-'}</div>
      </div>
      <div class="h-px bg-slate-100 my-3"></div>
      <div class="grid grid-cols-2 gap-2 text-xs items-center">
        <div class="text-slate-400">${i18n[currentLang].costPrice}</div>
        <div class="text-right text-red-600 font-mono font-bold">${formatMoney(t.cost)}</div>
        <div class="text-slate-400">${i18n[currentLang].sellingPrice}</div>
        <div class="text-right text-blue-600 font-mono font-bold">${formatMoney(t.price)}</div>
        <div class="text-indigo-600 font-bold uppercase mt-2">${i18n[currentLang].profit}</div>
        <div class="text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'} font-bold text-sm mt-2 font-mono">${profit >= 0 ? '+' : ''}${formatMoney(profit)}</div>
      </div>
      
      <div class="mt-4 pt-3 border-t border-slate-50 italic text-[10px] text-slate-400 text-center">
        ${t.dayStr}, ${t.dateStr} at ${t.timeStr}
      </div>
    </div>
  `;
  
  document.getElementById('btn-delete').onclick = () => {
    transactions = transactions.filter(x => x.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    closeDetailModal();
    updateDOM();
  };
  
  detailModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

const closeDetailModal = () => {
  detailModal.classList.add('hidden');
  document.body.style.overflow = '';
};

// Event Listeners Registration
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    currentTab = e.target.dataset.tab;
    updateDOM();
  });
});

document.getElementById('input-search').addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderDashboard();
  renderHistory();
});

document.getElementById('langToggle').addEventListener('click', toggleLang);
document.getElementById('currencyToggle').addEventListener('click', toggleCurrency);

const rateInput = document.getElementById('input-exchange-rate');
rateInput.value = exchangeRate;
rateInput.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  if (!isNaN(val) && val > 0) {
    exchangeRate = val;
    localStorage.setItem('exchangeRate', exchangeRate);
    updateDOM();
  }
});

document.getElementById('fab-add').addEventListener('click', openAddModal);
document.getElementById('btn-cancel-add').addEventListener('click', closeAddModal);
document.getElementById('btn-close-detail').addEventListener('click', closeDetailModal);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === addModal) closeAddModal();
  if (e.target === detailModal) closeDetailModal();
});

// Form Submission
document.getElementById('form-add').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const itemName = document.getElementById('input-itemName').value.trim();
  const buyerName = document.getElementById('input-buyerName').value.trim();
  const buyerPhone = document.getElementById('input-buyerPhone').value.trim();
  const serial = document.getElementById('input-serial').value.trim();
  const cost = parseFloat(document.getElementById('input-cost').value);
  const price = parseFloat(document.getElementById('input-price').value);
  
  const now = new Date();
  
  const langLocale = currentLang === 'en' ? 'en-US' : 'ku-IQ';
  const dateStr = now.toLocaleDateString(langLocale);
  const timeStr = now.toLocaleTimeString(langLocale, { hour: '2-digit', minute: '2-digit' });
  const dayStr = now.toLocaleDateString(langLocale, { weekday: 'long' });

  // Fallback unique ID generation if crypto is unsupported
  const generateId = () => {
    return window.crypto && window.crypto.randomUUID 
      ? window.crypto.randomUUID() 
      : Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const newTx = {
    id: generateId(),
    itemName,
    buyerName,
    buyerPhone,
    serial,
    cost,
    price,
    timestamp: Date.now(),
    dateStr,
    timeStr,
    dayStr
  };
  
  transactions.push(newTx);
  localStorage.setItem('transactions', JSON.stringify(transactions));
  
  closeAddModal();
  updateDOM();
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered on scope:', registration.scope);
    }).catch((err) => {
      console.log('SW registration failed:', err);
    });
  });
}

// Initial Render
updateDOM();
