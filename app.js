// ZANDI 장부 시스템 Core Logic (app.js)

// 1. Initial State Definition / Dummy Data (비어있지 않게 멋지게 사전 로드)
const INITIAL_CUSTOMERS = [
  { 
    id: 'cust-1', 
    name: '그린조경', 
    phone: '010-1234-5678', 
    prices: { '1818': 1500, '1818t': 130000, '3030': 2500, '3030t': 160000, '4060': 4000, 'pyeong': 15000, 'extra': 0 }
  },
  { 
    id: 'cust-2', 
    name: '현대건설 잔디팀', 
    phone: '010-9876-5432', 
    prices: { '1818': 1600, '1818t': 140000, '3030': 2800, '3030t': 170000, '4060': 4200, 'pyeong': 18000, 'extra': 0 }
  },
  { 
    id: 'cust-3', 
    name: '한양수목원', 
    phone: '010-5555-4444', 
    prices: { '1818': 1400, '1818t': 120000, '3030': 2300, '3030t': 150000, '4060': 3800, 'pyeong': 14000, 'extra': 0 }
  }
];

const INITIAL_SALES = [
  { id: 'sale-1', customerId: 'cust-1', saleDate: '2026-06-12', quantity: 120, price: 15000, productType: 'pyeong', isCollected: true, notes: '잔디 평당 15000원 납품', payments: [{ id: 'mig-sale-1', date: '2026-06-12', amount: 1800000 }] },
  { id: 'sale-2', customerId: 'cust-2', saleDate: '2026-06-13', quantity: 2, price: 170000, productType: '3030t', isCollected: false, notes: '3030 2톤 납품', payments: [] },
  { id: 'sale-3', customerId: 'cust-3', saleDate: '2026-06-14', quantity: 80, price: 14000, productType: 'pyeong', isCollected: true, notes: '현장 직납', payments: [{ id: 'mig-sale-3', date: '2026-06-14', amount: 1120000 }] },
  { id: 'sale-4', customerId: 'cust-1', saleDate: '2026-06-15', quantity: 300, price: 1500, productType: '1818', isCollected: false, notes: '1818 규격 납품 예정', payments: [{ id: 'mig-sale-4', date: '2026-06-15', amount: 200000 }] }
];

const INITIAL_WORKERS = [
  { id: 'worker-1', name: '김씨 (반장)', baseDailyWage: 160000 },
  { id: 'worker-2', name: '이씨', baseDailyWage: 140000 },
  { id: 'worker-3', name: '박씨', baseDailyWage: 140000 },
  { id: 'worker-4', name: '최씨', baseDailyWage: 140000 },
  { id: 'worker-5', name: '정씨', baseDailyWage: 140000 },
  { id: 'worker-6', name: '강씨', baseDailyWage: 140000 },
  { id: 'worker-7', name: '조씨', baseDailyWage: 150000 }
];

const INITIAL_ATTENDANCE = [
  { id: 'att-1', workerId: 'worker-1', workDate: '2026-06-14', workType: 1.0, dailyWage: 160000, isPaid: true },
  { id: 'att-2', workerId: 'worker-2', workDate: '2026-06-14', workType: 1.0, dailyWage: 140000, isPaid: true },
  { id: 'att-3', workerId: 'worker-3', workDate: '2026-06-14', workType: 0.5, dailyWage: 140000, isPaid: false },
  { id: 'att-4', workerId: 'worker-4', workDate: '2026-06-14', workType: 1.0, dailyWage: 140000, isPaid: true },
  { id: 'att-5', workerId: 'worker-5', workDate: '2026-06-14', workType: 1.0, dailyWage: 140000, isPaid: true },
  { id: 'att-6', workerId: 'worker-1', workDate: '2026-06-15', workType: 1.0, dailyWage: 160000, isPaid: false },
  { id: 'att-7', workerId: 'worker-2', workDate: '2026-06-15', workType: 0.5, dailyWage: 140000, isPaid: false },
  { id: 'att-8', workerId: 'worker-6', workDate: '2026-06-15', workType: 1.0, dailyWage: 140000, isPaid: false },
  { id: 'att-9', workerId: 'worker-7', workDate: '2026-06-15', workType: 1.0, dailyWage: 150000, isPaid: true }
];

const INITIAL_RENTS = [
  { id: 'rent-1', ownerName: '홍길동', phone: '010-1111-2222', address: '평리 105번지 길가밭', area: 500, amount: 1200000, bankAccount: '농협 302-1234-5678-01', yearlyPayments: { '2025': true, '2026': true }, paymentDate: '2026-06-10', notes: '연 단위 계약 완료' },
  { id: 'rent-2', ownerName: '이몽룡', phone: '010-3333-4444', address: '송정리 송정길 12 농지', area: 300, amount: 800000, bankAccount: '신한 110-987-654321', yearlyPayments: { '2025': true, '2026': false }, paymentDate: '', notes: '도지세 잔여분 80만원 미납' }
];

// App Data State
let state = {
  customers: [],
  sales: [],
  workers: [],
  attendance: [],
  rents: [],
  isAuthenticated: false
};

// Filter States
let filters = {
  customerId: '',
  productType: '',
  startDate: '',
  endDate: ''
};

let attFilters = {
  workerId: '',
  workType: '',
  startDate: '',
  endDate: ''
};

let rentFilters = {
  village: '',
  isPaid: ''
};

// Calendar States
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
let activeAttendanceView = 'table';

let dashCalendarYear = new Date().getFullYear();
let dashCalendarMonth = new Date().getMonth();


// Supabase Global Client
let supabaseClient = null;
let realtimeChannel = null;

// Modal State
let currentActiveSaleId = null;

// LocalStorage Helper functions
function loadState() {
  const localData = localStorage.getItem('zandi_ledger_data');
  const sessionAuth = sessionStorage.getItem('zandi_authenticated') === 'true';
  
  if (localData) {
    state = JSON.parse(localData);
    if (!state.rents) {
      state.rents = INITIAL_RENTS;
    }
  } else {
    state.customers = INITIAL_CUSTOMERS;
    state.sales = INITIAL_SALES;
    state.workers = INITIAL_WORKERS;
    state.attendance = INITIAL_ATTENDANCE;
    state.rents = INITIAL_RENTS;
    saveState();
  }
  
  // 데이터 스키마 마이그레이션 (payments 배열 유무 확인)
  state.sales.forEach(sale => {
    if (!sale.payments) {
      if (sale.isCollected) {
        sale.payments = [{ id: 'mig-' + sale.id, date: sale.saleDate, amount: sale.quantity * sale.price }];
      } else {
        sale.payments = [];
      }
    }
  });

  state.isAuthenticated = sessionAuth;
}

function saveState() {
  localStorage.setItem('zandi_ledger_data', JSON.stringify({
    customers: state.customers,
    sales: state.sales,
    workers: state.workers,
    attendance: state.attendance,
    rents: state.rents
  }));
}

// Supabase Cloud Sync Operations
async function initSupabase() {
  const url = localStorage.getItem('zandi_supabase_url');
  const key = localStorage.getItem('zandi_supabase_key');
  const indicator = document.getElementById('sync-indicator');
  
  // input fields prefill
  if (url) document.getElementById('settings-supabase-url').value = url;
  if (key) document.getElementById('settings-supabase-key').value = key;

  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      if (indicator) {
        indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block mr-1"></span> 부부 실시간 연동중';
      }
      await pullFromSupabase();
      subscribeToRealtime();
    } catch (e) {
      console.error("Supabase connection error:", e);
      if (indicator) {
        indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1"></span> 연동 오류';
      }
    }
  } else {
    if (indicator) {
      indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-neutral-600 inline-block mr-1"></span> 로컬 전용 모드';
    }
  }
}

function subscribeToRealtime() {
  if (!supabaseClient) return;
  
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }
  
  realtimeChannel = supabaseClient.channel('zandi-realtime-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => pullFromSupabase())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => pullFromSupabase())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => pullFromSupabase())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () => pullFromSupabase())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rents' }, () => pullFromSupabase())
    .subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });
}

async function pullFromSupabase() {
  if (!supabaseClient) return;
  try {
    const { data: cust, error: cErr } = await supabaseClient.from('customers').select('*');
    if (cErr) throw cErr;
    const { data: sal, error: sErr } = await supabaseClient.from('sales').select('*');
    if (sErr) throw sErr;
    const { data: work, error: wErr } = await supabaseClient.from('workers').select('*');
    if (wErr) throw wErr;
    const { data: att, error: aErr } = await supabaseClient.from('attendance').select('*');
    if (aErr) throw aErr;
    
    // rents 테이블 풀 시도 (테이블이 없을 수 있으므로 try-catch로 예외 처리)
    let ren = [];
    try {
      const { data: rentData, error: rErr } = await supabaseClient.from('rents').select('*');
      if (!rErr && rentData) ren = rentData;
    } catch (e) {
      console.warn("Supabase rents table pull failed (might not exist yet):", e);
    }

    state.customers = cust.map(c => ({ id: c.id, name: c.name, phone: c.phone, prices: c.prices }));
    state.sales = sal.map(s => ({ 
      id: s.id, 
      customerId: s.customer_id, 
      saleDate: s.sale_date, 
      productType: s.product_type, 
      quantity: s.quantity, 
      price: s.price, 
      isCollected: s.is_collected, 
      notes: s.notes,
      payments: s.payments || []
    }));
    state.workers = work.map(w => ({ id: w.id, name: w.name, baseDailyWage: w.base_daily_wage }));
    state.attendance = att.map(a => ({ 
      id: a.id, 
      workerId: a.worker_id, 
      workDate: a.work_date, 
      workType: a.work_type, 
      dailyWage: a.daily_wage, 
      isPaid: a.is_paid 
    }));
    if (ren && ren.length > 0) {
      state.rents = ren.map(r => ({
        id: r.id,
        ownerName: r.ownerName || '',
        phone: r.phone || '',
        address: r.address || '',
        area: Number(r.area) || 0,
        amount: Number(r.amount) || 0,
        bankAccount: r.bankAccount || '',
        yearlyPayments: r.yearlyPayments || {},
        paymentDate: r.paymentDate || '',
        notes: r.notes || ''
      }));
    }

    saveState();
    renderAll();
  } catch (e) {
    console.warn("Supabase fetch failed. Using local cached data.", e);
  }
}

async function pushCustomer(customer) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('customers').upsert({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      prices: customer.prices
    });
  } catch (e) { console.error(e); }
}

async function removeCustomerSupabase(id) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('customers').delete().eq('id', id);
  } catch (e) { console.error(e); }
}

async function pushSale(sale) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('sales').upsert({
      id: sale.id,
      customer_id: sale.customerId,
      sale_date: sale.saleDate,
      product_type: sale.productType,
      quantity: sale.quantity,
      price: sale.price,
      is_collected: sale.isCollected,
      notes: sale.notes,
      payments: sale.payments
    });
  } catch (e) { console.error(e); }
}

async function removeSaleSupabase(id) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('sales').delete().eq('id', id);
  } catch (e) { console.error(e); }
}

async function pushWorker(worker) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('workers').upsert({
      id: worker.id,
      name: worker.name,
      base_daily_wage: worker.baseDailyWage
    });
  } catch (e) { console.error(e); }
}

async function removeWorkerSupabase(id) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('workers').delete().eq('id', id);
  } catch (e) { console.error(e); }
}

async function pushAttendance(att) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('attendance').upsert({
      id: att.id,
      worker_id: att.workerId,
      work_date: att.workDate,
      work_type: att.workType,
      daily_wage: att.dailyWage,
      is_paid: att.isPaid
    });
  } catch (e) { console.error(e); }
}

async function removeAttendanceSupabase(id) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('attendance').delete().eq('id', id);
  } catch (e) { console.error(e); }
}

async function pushRent(rent) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('rents').upsert({
      id: rent.id,
      ownerName: rent.ownerName,
      phone: rent.phone,
      address: rent.address,
      area: rent.area,
      amount: rent.amount,
      bankAccount: rent.bankAccount,
      yearlyPayments: rent.yearlyPayments,
      paymentDate: rent.paymentDate,
      notes: rent.notes
    });
  } catch (e) { console.error(e); }
}

async function removeRentSupabase(id) {
  if (!supabaseClient) return;
  try {
    await supabaseClient.from('rents').delete().eq('id', id);
  } catch (e) { console.error(e); }
}

// 2. Authentication UI & Logic
function initAuth() {
  const loginOverlay = document.getElementById('login-overlay');
  const loginBtn = document.getElementById('login-btn');
  const passwordInput = document.getElementById('password-input');
  const loginError = document.getElementById('login-error');
  const mainApp = document.getElementById('main-app');
  const logoutBtn = document.getElementById('logout-btn');

  const MASTER_PASSWORD = localStorage.getItem('zandi_password') || "1234";

  if (state.isAuthenticated) {
    loginOverlay.style.display = 'none';
    mainApp.style.opacity = '1';
    mainApp.style.pointerEvents = 'auto';
  } else {
    loginOverlay.style.display = 'flex';
    mainApp.style.opacity = '0.05';
    mainApp.style.pointerEvents = 'none';
  }

  loginBtn.addEventListener('click', () => {
    const currentMasterPassword = localStorage.getItem('zandi_password') || "1234";
    if (passwordInput.value === currentMasterPassword) {
      state.isAuthenticated = true;
      sessionStorage.setItem('zandi_authenticated', 'true');
      loginOverlay.style.display = 'none';
      mainApp.style.opacity = '1';
      mainApp.style.pointerEvents = 'auto';
      renderAll();
    } else {
      loginError.style.display = 'block';
      passwordInput.value = '';
    }
  });

  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      state.isAuthenticated = false;
      sessionStorage.removeItem('zandi_authenticated');
      loginOverlay.style.display = 'flex';
      mainApp.style.opacity = '0.05';
      mainApp.style.pointerEvents = 'none';
      passwordInput.value = '';
      loginError.style.display = 'none';
    });
  }
}

// 3. Navigation / Tab Switching
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.content-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('bg-surface-hover', 'border-l-4', 'border-primary', 'text-primary'));
      tab.classList.add('bg-surface-hover', 'border-l-4', 'border-primary', 'text-primary');

      const targetSection = tab.dataset.section;
      sections.forEach(sec => {
        if (sec.id === `${targetSection}-section`) {
          sec.classList.remove('hidden');
          sec.classList.add('animate-fade-in');
        } else {
          sec.classList.add('hidden');
        }
      });
    });
  });
}

// 4. Rendering logic

// 4.1. Dashboard View
function renderDashboard() {
  const totalSales = state.sales.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const collectedSales = state.sales.reduce((sum, item) => {
    const collected = (item.payments || []).reduce((s, p) => s + p.amount, 0);
    return sum + collected;
  }, 0);
  const uncollectedSales = totalSales - collectedSales;

  const totalLabor = state.attendance.reduce((sum, item) => sum + (item.workType * item.dailyWage), 0);
  const paidLabor = state.attendance.filter(a => a.isPaid).reduce((sum, item) => sum + (item.workType * item.dailyWage), 0);
  const unpaidLabor = totalLabor - paidLabor;

  const netProfit = totalSales - totalLabor;

  document.getElementById('dash-total-sales').textContent = totalSales.toLocaleString() + '원';
  document.getElementById('dash-collected-sales').textContent = collectedSales.toLocaleString() + '원';
  document.getElementById('dash-uncollected-sales').textContent = uncollectedSales.toLocaleString() + '원';

  document.getElementById('dash-total-labor').textContent = totalLabor.toLocaleString() + '원';
  document.getElementById('dash-paid-labor').textContent = paidLabor.toLocaleString() + '원';
  document.getElementById('dash-unpaid-labor').textContent = unpaidLabor.toLocaleString() + '원';

  const netProfitEl = document.getElementById('dash-net-profit');
  netProfitEl.textContent = netProfit.toLocaleString() + '원';
  if (netProfit >= 0) {
    netProfitEl.className = 'text-3xl font-bold text-emerald-400 mt-2';
  } else {
    netProfitEl.className = 'text-3xl font-bold text-rose-400 mt-2';
  }

  renderDashCalendar();
  renderUnpaidCustomers();
}

function renderDashCalendar() {
  const gridContainer = document.getElementById('dash-calendar-grid');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';

  document.getElementById('dash-cal-month-title').textContent = `${dashCalendarYear}년 ${dashCalendarMonth + 1}월`;

  const firstDayIndex = new Date(dashCalendarYear, dashCalendarMonth, 1).getDay();
  const numDays = new Date(dashCalendarYear, dashCalendarMonth + 1, 0).getDate();
  const prevNumDays = new Date(dashCalendarYear, dashCalendarMonth, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Prev month trailing
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevNumDays - i;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span class="text-[10px] text-gray-500 font-semibold mb-1">${dayVal}</span>`;
    gridContainer.appendChild(cell);
  }

  // Current month
  for (let day = 1; day <= numDays; day++) {
    const dateStr = `${dashCalendarYear}-${String(dashCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    // Filter sales/deliveries on this date
    const daySales = state.sales.filter(s => s.saleDate === dateStr);

    const cell = document.createElement('div');
    cell.className = `calendar-day-cell cursor-pointer ${isToday ? 'today' : ''}`;
    cell.onclick = () => openDashDayDetailsModal(dateStr);
    
    let dayNumClass = 'text-[11px] font-bold text-gray-400 mb-1';
    const cellDate = new Date(dashCalendarYear, dashCalendarMonth, day);
    const dayOfWeek = cellDate.getDay();
    if (dayOfWeek === 0) dayNumClass = 'text-[11px] font-bold text-rose-400 mb-1';
    else if (dayOfWeek === 6) dayNumClass = 'text-[11px] font-bold text-sky-400 mb-1';

    let html = `<span class="${dayNumClass}">${day}</span>`;
    
    if (daySales.length > 0) {
      html += `<div class="flex flex-col gap-1 w-full mt-1 max-h-[60px] overflow-y-auto pr-0.5">`;
      daySales.forEach(sale => {
        const customer = state.customers.find(c => c.id === sale.customerId) || { name: '알수없음' };
        const unitLabel = (sale.productType === '1818t' || sale.productType === '3030t') ? 't' : 
                          (sale.productType === '1818' || sale.productType === '3030' || sale.productType === '4060') ? '장' : '평';
        
        html += `
          <div class="px-1 py-0.5 rounded text-[9px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 truncate" title="${customer.name}: ${sale.quantity}${unitLabel}">
            ${customer.name}: ${sale.quantity}${unitLabel}
          </div>
        `;
      });
      html += `</div>`;
    }

    cell.innerHTML = html;
    gridContainer.appendChild(cell);
  }

  // Next month leading
  const totalCells = firstDayIndex + numDays;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span class="text-[10px] text-gray-500 font-semibold mb-1">${i}</span>`;
    gridContainer.appendChild(cell);
  }
}

window.openDashDayDetailsModal = function(dateStr) {
  const modal = document.getElementById('dash-day-details-modal');
  if (!modal) return;

  document.getElementById('dash-modal-date-title').textContent = dateStr;
  const list = document.getElementById('dash-modal-sales-list');
  list.innerHTML = '';

  const daySales = state.sales.filter(s => s.saleDate === dateStr);

  if (daySales.length === 0) {
    list.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500 text-xs">해당 날짜의 잔디 출하 내역이 없습니다.</td></tr>';
  } else {
    daySales.forEach(sale => {
      const customer = state.customers.find(c => c.id === sale.customerId) || { name: '삭제된 거래처' };
      const total = sale.quantity * sale.price;
      const unitLabel = (sale.productType === '1818t' || sale.productType === '3030t') ? '톤' : 
                        (sale.productType === '1818' || sale.productType === '3030' || sale.productType === '4060') ? '장' : '평';

      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20';
      tr.innerHTML = `
        <td class="p-2 text-white font-medium">${customer.name}</td>
        <td class="p-2 text-gray-300">${PRODUCT_TYPE_LABELS[sale.productType] || '평당'}</td>
        <td class="p-2 text-right text-gray-300">${sale.quantity.toLocaleString()} ${unitLabel}</td>
        <td class="p-2 text-right text-gray-400">${sale.price.toLocaleString()}원</td>
        <td class="p-2 text-right text-emerald-400 font-bold">${total.toLocaleString()}원</td>
        <td class="p-2 text-gray-400">${sale.notes || '-'}</td>
      `;
      list.appendChild(tr);
    });
  }

  if (window.lucide) window.lucide.createIcons();
  modal.classList.remove('hidden');
};

// Dashboard Unpaid Customers List Rendering
function renderUnpaidCustomers() {
  const list = document.getElementById('unpaid-customers-list');
  list.innerHTML = '';

  state.customers.forEach(customer => {
    const cSales = state.sales.filter(s => s.customerId === customer.id);
    const total = cSales.reduce((sum, s) => sum + (s.quantity * s.price), 0);
    const paid = cSales.reduce((sum, s) => sum + (s.payments || []).reduce((sm, p) => sm + p.amount, 0), 0);
    const unpaid = total - paid;

    if (unpaid > 0) {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-800 hover:bg-rose-950/10 transition-colors';
      tr.innerHTML = `
        <td class="p-2 text-white font-medium">${customer.name}</td>
        <td class="p-2 text-gray-400">${customer.phone || '-'}</td>
        <td class="p-2 text-right text-rose-400 font-bold">${unpaid.toLocaleString()}원</td>
        <td class="p-2 text-center">
          <button onclick="goToSalesTabWithFilter('${customer.id}')" class="text-[10px] text-zandiPrimary hover:text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/10 transition-colors">
            장부 확인
          </button>
        </td>
      `;
      list.appendChild(tr);
    }
  });

  if (list.children.length === 0) {
    list.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500 text-xs">미납금이 남아있는 거래처가 없습니다. 깔끔합니다!</td></tr>';
  }
}

window.goToSalesTabWithFilter = function(custId) {
  const salesTab = document.querySelector('.nav-tab[data-section="sales"]');
  if (salesTab) salesTab.click();
  
  const filterSelect = document.getElementById('filter-sale-customer');
  if (filterSelect) {
    filterSelect.value = custId;
    filterSelect.dispatchEvent(new Event('change'));
  }
};

// 4.2. Customers View
function renderCustomers() {
  const customerList = document.getElementById('customer-list');
  const customerDropdown = document.getElementById('sale-customer');
  const filterCustomerDropdown = document.getElementById('filter-sale-customer');
  
  const savedFilterCustValue = filterCustomerDropdown ? filterCustomerDropdown.value : '';
  
  customerList.innerHTML = '';
  customerDropdown.innerHTML = '<option value="">선택하세요</option>';
  if (filterCustomerDropdown) {
    filterCustomerDropdown.innerHTML = '<option value="">전체 거래처</option>';
  }

  state.customers.forEach(customer => {
    const cSales = state.sales.filter(s => s.customerId === customer.id);
    const totalSales = cSales.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalCollected = cSales.reduce((sum, item) => sum + (item.payments || []).reduce((s, p) => s + p.amount, 0), 0);
    const uncollected = totalSales - totalCollected;

    const prices = customer.prices || { '1818': 0, '1818t': 0, '3030': 0, '3030t': 0, '4060': 0, 'pyeong': 0, 'extra': 0 };

    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20';
    tr.innerHTML = `
      <td class="p-3 text-white font-medium">${customer.name}</td>
      <td class="p-3 text-gray-400">${customer.phone || '-'}</td>
      <td class="p-3 text-xs">
        <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-gray-300">
          <span>1818: <strong class="text-emerald-400">${Number(prices['1818'] || 0).toLocaleString()}</strong></span>
          <span>1818t: <strong class="text-emerald-400">${Number(prices['1818t'] || 0).toLocaleString()}</strong></span>
          <span>3030: <strong class="text-emerald-400">${Number(prices['3030'] || 0).toLocaleString()}</strong></span>
          <span>3030t: <strong class="text-emerald-400">${Number(prices['3030t'] || 0).toLocaleString()}</strong></span>
          <span>4060: <strong class="text-emerald-400">${Number(prices['4060'] || 0).toLocaleString()}</strong></span>
          <span>평당: <strong class="text-emerald-400">${Number(prices['pyeong'] || 0).toLocaleString()}</strong></span>
          <span class="col-span-2">여유분: <strong class="text-emerald-400">${Number(prices['extra'] || 0).toLocaleString()}</strong></span>
        </div>
      </td>
      <td class="p-3 text-gray-300">${totalSales.toLocaleString()}원</td>
      <td class="p-3 text-rose-400 font-semibold">${uncollected.toLocaleString()}원</td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="openCustomerEditModal('${customer.id}')" class="text-emerald-400 hover:text-emerald-300 p-1" title="수정">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteCustomer('${customer.id}')" class="text-rose-400 hover:text-rose-300 p-1" title="삭제">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    `;
    customerList.appendChild(tr);

    // 대장 등록용 드롭다운 추가
    const opt = document.createElement('option');
    opt.value = customer.id;
    opt.textContent = customer.name;
    customerDropdown.appendChild(opt);

    // 필터 드롭다운 추가
    if (filterCustomerDropdown) {
      const optFilter = document.createElement('option');
      optFilter.value = customer.id;
      optFilter.textContent = customer.name;
      filterCustomerDropdown.appendChild(optFilter);
    }
  });

  if (filterCustomerDropdown) {
    filterCustomerDropdown.value = savedFilterCustValue;
  }
  
  if (window.lucide) window.lucide.createIcons();
}

// Product type name mapping helper
const PRODUCT_TYPE_LABELS = {
  'pyeong': '평당',
  '1818': '1818',
  '1818t': '1818 톤',
  '3030': '3030',
  '3030t': '3030 톤',
  '4060': '4060',
  'extra': '여유분'
};

// 4.3. Sales View
function renderSales() {
  const salesList = document.getElementById('sales-list');
  salesList.innerHTML = '';

  // Filter Sales list
  let filteredSales = state.sales.filter(sale => {
    if (filters.customerId && sale.customerId !== filters.customerId) return false;
    if (filters.productType && sale.productType !== filters.productType) return false;
    if (filters.startDate && sale.saleDate < filters.startDate) return false;
    if (filters.endDate && sale.saleDate > filters.endDate) return false;
    return true;
  });

  // Calculate Filter Stats
  let filterQtyTotal = 0;
  let filterAmountTotal = 0;

  filteredSales.sort((a,b) => new Date(b.saleDate) - new Date(a.saleDate)).forEach(sale => {
    const customer = state.customers.find(c => c.id === sale.customerId) || { name: '삭제된 거래처' };
    const total = sale.quantity * sale.price;
    const unitLabel = (sale.productType === '1818t' || sale.productType === '3030t') ? '톤' : 
                      (sale.productType === '1818' || sale.productType === '3030' || sale.productType === '4060') ? '장' : '평';

    const collected = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const uncollected = total - collected;
    const isFullyPaid = uncollected <= 0;

    filterQtyTotal += sale.quantity;
    filterAmountTotal += total;

    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20';
    tr.innerHTML = `
      <td class="p-3 text-gray-400">${sale.saleDate}</td>
      <td class="p-3 text-white font-medium">${customer.name}</td>
      <td class="p-3 text-gray-300 font-semibold">${PRODUCT_TYPE_LABELS[sale.productType] || '평당'}</td>
      <td class="p-3 text-right text-gray-300">${sale.quantity.toLocaleString()} ${unitLabel}</td>
      <td class="p-3 text-right text-gray-400">${sale.price.toLocaleString()}원</td>
      <td class="p-3 text-right text-emerald-400 font-bold">${total.toLocaleString()}원</td>
      <td class="p-3 text-center">
        <div onclick="openPaymentModal('${sale.id}')" class="cursor-pointer group flex flex-col items-center justify-center p-1 rounded hover:bg-emerald-950/45 border border-transparent hover:border-zandiBorder transition-all duration-300">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isFullyPaid 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : collected > 0 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }">
            ${isFullyPaid ? '수금완료' : collected > 0 ? '부분수금' : '미수금'}
          </span>
          <span class="text-[9px] text-gray-400 mt-1 block">
            수금: ${collected.toLocaleString()}원
          </span>
          ${uncollected > 0 ? `<span class="text-[9px] text-rose-400 block">미납: ${uncollected.toLocaleString()}원</span>` : ''}
        </div>
      </td>
      <td class="p-3 text-gray-400">${sale.notes || '-'}</td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="openSaleEditModal('${sale.id}')" class="text-emerald-400 hover:text-emerald-300 p-1" title="수정">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteSale('${sale.id}')" class="text-rose-400 hover:text-rose-300 p-1" title="삭제">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    `;
    salesList.appendChild(tr);
  });

  // Render Stats Elements
  document.getElementById('filter-total-count').textContent = filteredSales.length + '건';
  document.getElementById('filter-total-qty').textContent = filterQtyTotal.toLocaleString();
  document.getElementById('filter-total-amount').textContent = filterAmountTotal.toLocaleString() + '원';
  
  if (window.lucide) window.lucide.createIcons();
}

// 4.4. Workers / Attendance View
function renderAttendance() {
  const workerList = document.getElementById('worker-list');
  const workersChecklistContainer = document.getElementById('att-workers-list-container');
  const filterWorkerDropdown = document.getElementById('filter-att-worker');
  
  const savedFilterWorkerValue = filterWorkerDropdown ? filterWorkerDropdown.value : '';

  workerList.innerHTML = '';
  if (workersChecklistContainer) {
    workersChecklistContainer.innerHTML = '';
  }
  if (filterWorkerDropdown) {
    filterWorkerDropdown.innerHTML = '<option value="">전체 인부</option>';
  }

  state.workers.forEach(worker => {
    const wAtt = state.attendance.filter(a => a.workerId === worker.id);
    const totalDays = wAtt.reduce((sum, item) => sum + Number(item.workType), 0);
    const unpaidWage = wAtt.filter(a => !a.isPaid).reduce((sum, item) => sum + (item.workType * item.dailyWage), 0);

    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20';
    tr.innerHTML = `
      <td class="p-3 text-white font-medium">${worker.name}</td>
      <td class="p-3 text-emerald-400 font-bold">${worker.baseDailyWage.toLocaleString()}원</td>
      <td class="p-3 text-gray-300">${totalDays}일</td>
      <td class="p-3 text-rose-400 font-semibold">${unpaidWage.toLocaleString()}원</td>
      <td class="p-3 text-center">
        <button onclick="deleteWorker('${worker.id}')" class="text-rose-400 hover:text-rose-300 p-1">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    `;
    workerList.appendChild(tr);

    // checklist checkbox row render
    if (workersChecklistContainer) {
      const div = document.createElement('div');
      div.className = 'flex flex-col gap-2 bg-black/20 p-2.5 rounded-lg border border-zandiBorder/40 text-xs';
      div.innerHTML = `
        <div class="flex items-center justify-between w-full">
          <label class="custom-checkbox">
            <input type="checkbox" class="att-worker-check" value="${worker.id}">
            <span class="checkmark"></span>
            <span class="text-xs text-white font-semibold truncate" title="${worker.name}">${worker.name}</span>
          </label>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-between sm:justify-start">
          <select class="att-worker-type bg-black/40 border border-zandiBorder text-white text-[11px] rounded p-1 flex-1 sm:flex-none">
            <option value="1.0">하루 (1.0)</option>
            <option value="0.5">반나절 (0.5)</option>
          </select>
          <div class="flex items-center gap-0.5">
            <input type="number" class="att-worker-wage bg-black/40 border border-zandiBorder text-emerald-400 text-[11px] rounded p-1 w-20 text-right font-bold" value="${worker.baseDailyWage}" placeholder="일당">
            <span class="text-[9px] text-slate-500">원</span>
          </div>
          <label class="custom-checkbox flex-shrink-0">
            <input type="checkbox" class="att-worker-paid">
            <span class="checkmark"></span>
            <span class="text-[11px] text-slate-400">지급</span>
          </label>
        </div>
      `;
      workersChecklistContainer.appendChild(div);

      // 드롭다운 변경 시 입력 칸의 기본값 자동 변경
      const select = div.querySelector('.att-worker-type');
      const wageInput = div.querySelector('.att-worker-wage');
      if (select && wageInput) {
        select.addEventListener('change', () => {
          const val = Number(select.value);
          if (val === 1.0) {
            wageInput.value = worker.baseDailyWage;
          } else if (val === 0.5) {
            wageInput.value = Math.round(worker.baseDailyWage * 0.5);
          }
        });
      }
    }

    if (filterWorkerDropdown) {
      const optFilter = document.createElement('option');
      optFilter.value = worker.id;
      optFilter.textContent = worker.name;
      filterWorkerDropdown.appendChild(optFilter);
    }
  });

  if (filterWorkerDropdown) {
    filterWorkerDropdown.value = savedFilterWorkerValue;
  }

  // Render Attendance Matrix List with Filters
  renderAttendanceMatrix();

  // Filter attendance entries for stats
  let filteredAttendance = state.attendance.filter(att => {
    if (attFilters.workerId && att.workerId !== attFilters.workerId) return false;
    if (attFilters.workType && att.workType !== Number(attFilters.workType)) return false;
    if (attFilters.startDate && att.workDate < attFilters.startDate) return false;
    if (attFilters.endDate && att.workDate > attFilters.endDate) return false;
    return true;
  });

  let attDaysSum = filteredAttendance.reduce((sum, item) => sum + Number(item.workType), 0);
  let attWageSum = filteredAttendance.reduce((sum, item) => sum + (item.workType * item.dailyWage), 0);

  // Render Filter Sum Stats for Attendance
  document.getElementById('filter-att-count').textContent = filteredAttendance.length + '건';
  document.getElementById('filter-att-days').textContent = attDaysSum + '일';
  document.getElementById('filter-att-amount').textContent = attWageSum.toLocaleString() + '원';

  if (window.lucide) window.lucide.createIcons();

  renderAttendanceCalendar();
}

function renderAttendanceCalendar() {
  const gridContainer = document.getElementById('attendance-calendar-grid');
  if (!gridContainer) return;
  gridContainer.innerHTML = '';

  document.getElementById('cal-month-title').textContent = `${calendarYear}년 ${calendarMonth + 1}월`;

  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const numDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const prevNumDays = new Date(calendarYear, calendarMonth, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Prev month trailing
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayVal = prevNumDays - i;
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span class="text-[10px] text-gray-500 font-semibold mb-1">${dayVal}</span>`;
    gridContainer.appendChild(cell);
  }

  // Current month
  for (let day = 1; day <= numDays; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;

    // Filter attendance entries for this date
    const dayAttendance = state.attendance.filter(att => {
      if (att.workDate !== dateStr) return false;
      if (attFilters.workerId && att.workerId !== attFilters.workerId) return false;
      if (attFilters.workType && att.workType !== Number(attFilters.workType)) return false;
      return true;
    });

    const cell = document.createElement('div');
    cell.className = `calendar-day-cell ${isToday ? 'today' : ''}`;
    
    let dayNumClass = 'text-[11px] font-bold text-gray-400 mb-1';
    const cellDate = new Date(calendarYear, calendarMonth, day);
    const dayOfWeek = cellDate.getDay();
    if (dayOfWeek === 0) dayNumClass = 'text-[11px] font-bold text-rose-400 mb-1';
    else if (dayOfWeek === 6) dayNumClass = 'text-[11px] font-bold text-sky-400 mb-1';

    let html = `<span class="${dayNumClass}">${day}</span>`;
    
    if (dayAttendance.length > 0) {
      html += `<div class="flex flex-col gap-1 w-full mt-1 max-h-[60px] overflow-y-auto pr-0.5">`;
      dayAttendance.forEach(att => {
        const worker = state.workers.find(w => w.id === att.workerId) || { name: '알수없음' };
        const badgeClass = att.workType === 1.0 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
        
        html += `
          <div class="px-1.5 py-0.5 rounded text-[9px] font-semibold truncate ${badgeClass} flex justify-between items-center" title="${worker.name}: ${att.workType === 1.0 ? '하루(1.0)' : '반나절(0.5)'}">
            <span class="truncate">${worker.name}</span>
            <span>${att.workType === 1.0 ? '1.0' : '0.5'}</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    cell.innerHTML = html;
    gridContainer.appendChild(cell);
  }

  // Next month leading
  const totalCells = firstDayIndex + numDays;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day-cell other-month';
    cell.innerHTML = `<span class="text-[10px] text-gray-500 font-semibold mb-1">${i}</span>`;
    gridContainer.appendChild(cell);
  }
}
function renderAttendanceMatrix() {
  const container = document.getElementById('attendance-table-container');
  if (!container) return;

  if (state.workers.length === 0) {
    container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">등록된 인부가 없습니다. 먼저 인부를 등록해주세요.</p>';
    return;
  }

  // Find all unique dates in attendance (filtered by start/end date filters if any)
  let dates = [...new Set(state.attendance.map(a => a.workDate))];
  
  if (attFilters.startDate) {
    dates = dates.filter(d => d >= attFilters.startDate);
  }
  if (attFilters.endDate) {
    dates = dates.filter(d => d <= attFilters.endDate);
  }
  
  dates.sort((a, b) => new Date(b) - new Date(a));

  let activeWorkers = state.workers;
  if (attFilters.workerId) {
    activeWorkers = state.workers.filter(w => w.id === attFilters.workerId);
  }

  let html = `
    <table class="w-full text-left text-sm min-w-[850px]">
      <thead>
        <tr class="text-xs text-zandiTextMuted border-b border-zandiBorder/40">
          <th class="pb-2">근무일자</th>
  `;

  activeWorkers.forEach(worker => {
    html += `<th class="pb-2 text-center">${worker.name}</th>`;
  });

  html += `
          <th class="pb-2 text-right">일당 합계</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (dates.length === 0) {
    html += `<tr><td colspan="${activeWorkers.length + 2}" class="p-4 text-center text-gray-500 text-xs">출근 기록이 없습니다.</td></tr>`;
  } else {
    dates.forEach(date => {
      let daySum = 0;
      html += `<tr class="border-b border-gray-800 hover:bg-emerald-950/10">`;
      html += `<td class="p-3 text-gray-400 font-medium">${date}</td>`;

      activeWorkers.forEach(worker => {
        const att = state.attendance.find(a => a.workDate === date && a.workerId === worker.id);
        
        html += `<td class="p-3 text-center">`;
        if (att) {
          const payment = att.workType * att.dailyWage;
          daySum += payment;
          
          const isPaidClass = att.isPaid 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
          
          html += `
            <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${isPaidClass}">
              <span class="cursor-pointer" onclick="toggleAttendancePayment('${att.id}')" title="지급 여부 토글">
                ${att.workType === 1.0 ? '하루(1.0)' : '반(0.5)'} ${att.isPaid ? '지급' : '미급'}
              </span>
              <button onclick="deleteAttendance('${att.id}')" class="text-rose-400 hover:text-rose-300 ml-1 flex items-center justify-center" title="삭제">
                <i data-lucide="x" class="w-3 h-3"></i>
              </button>
            </div>
          `;
        } else {
          html += `<span class="text-gray-600 font-medium">-</span>`;
        }
        html += `</td>`;
      });

      html += `<td class="p-3 text-right text-emerald-400 font-bold">${daySum.toLocaleString()}원</td>`;
      html += `</tr>`;
    });
  }

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

// 4.5. Land Rent View
function renderRent() {
  const rentList = document.getElementById('rent-list');
  if (!rentList) return;

  const currentYear = new Date().getFullYear();
  const yearPrev = currentYear - 1;
  const yearCurr = currentYear;
  const yearNext = currentYear + 1;

  const rentSearch = document.getElementById('filter-rent-search')?.value.trim().toLowerCase() || '';
  const selectedFilterYear = document.getElementById('filter-rent-year-select')?.value || String(yearCurr);
  const filterPaidVal = document.getElementById('filter-rent-paid-select')?.value || '';

  // Update label
  const filterLabel = document.getElementById('filter-rent-year-label');
  if (filterLabel) {
    filterLabel.textContent = `지급 여부 필터 (${selectedFilterYear}년 기준)`;
  }

  // Filter rents
  let filteredRents = state.rents.filter(rent => {
    if (rentSearch) {
      const owner = (rent.ownerName || '').toLowerCase();
      const addr = (rent.address || '').toLowerCase();
      if (!owner.includes(rentSearch) && !addr.includes(rentSearch)) return false;
    }
    if (filterPaidVal !== '') {
      const isPaid = !!(rent.yearlyPayments && rent.yearlyPayments[selectedFilterYear]);
      const expected = filterPaidVal === 'true';
      if (isPaid !== expected) return false;
    }
    return true;
  });

  // Calculate Metrics based on the selected filter year
  const totalAmount = state.rents.reduce((sum, r) => sum + Number(r.amount), 0);
  const paidAmount = state.rents.filter(r => r.yearlyPayments && r.yearlyPayments[selectedFilterYear]).reduce((sum, r) => sum + Number(r.amount), 0);
  const unpaidAmount = totalAmount - paidAmount;

  document.getElementById('rent-total-amount').textContent = totalAmount.toLocaleString() + '원';
  document.getElementById('rent-paid-amount').textContent = paidAmount.toLocaleString() + '원';
  document.getElementById('rent-unpaid-amount').textContent = unpaidAmount.toLocaleString() + '원';

  // Render Table
  rentList.innerHTML = '';
  if (filteredRents.length === 0) {
    rentList.innerHTML = '<tr><td colspan="12" class="p-4 text-center text-gray-500 text-xs">등록된 토지 임대 내역이 없습니다.</td></tr>';
  } else {
    filteredRents.forEach(rent => {
      const payPrev = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearPrev)]);
      const payCurr = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearCurr)]);
      const payNext = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearNext)]);

      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20 text-xs';
      tr.innerHTML = `
        <td class="p-3 text-white font-medium">${rent.ownerName || '-'}</td>
        <td class="p-3 text-gray-300">${rent.phone || '-'}</td>
        <td class="p-3 text-gray-300 max-w-[150px] truncate" title="${rent.address || ''}">${rent.address || '-'}</td>
        <td class="p-3 text-center text-gray-300">${rent.area ? rent.area + '평' : '-'}</td>
        <td class="p-3 text-right text-emerald-400 font-bold">${Number(rent.amount).toLocaleString()}원</td>
        <td class="p-3 text-gray-300 max-w-[120px] truncate" title="${rent.bankAccount || ''}">${rent.bankAccount || '-'}</td>
        <td class="p-3 text-center">
          <label class="custom-checkbox inline-block">
            <input type="checkbox" ${payPrev ? 'checked' : ''} onchange="toggleRentYear('${rent.id}', '${yearPrev}')">
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="p-3 text-center">
          <label class="custom-checkbox inline-block">
            <input type="checkbox" ${payCurr ? 'checked' : ''} onchange="toggleRentYear('${rent.id}', '${yearCurr}')">
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="p-3 text-center">
          <label class="custom-checkbox inline-block">
            <input type="checkbox" ${payNext ? 'checked' : ''} onchange="toggleRentYear('${rent.id}', '${yearNext}')">
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="p-3 text-gray-400">${rent.paymentDate || '-'}</td>
        <td class="p-3 text-gray-400 max-w-[120px] truncate" title="${rent.notes || ''}">${rent.notes || '-'}</td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openRentEditModal('${rent.id}')" class="text-emerald-400 hover:text-emerald-300 p-1">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteRent('${rent.id}')" class="text-rose-400 hover:text-rose-300 p-1">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      `;
      rentList.appendChild(tr);
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

// Rent Actions
function addRent(ownerName, phone, address, area, amount, bankAccount, yearlyPayments, paymentDate, notes) {
  const id = 'rent-' + Date.now();
  const newRent = {
    id,
    ownerName,
    phone,
    address,
    area: Number(area) || 0,
    amount: Number(amount) || 0,
    bankAccount,
    yearlyPayments: yearlyPayments || {},
    paymentDate,
    notes
  };
  state.rents.push(newRent);
  saveState();
  pushRent(newRent);
  renderAll();
}

window.deleteRent = function(id) {
  if (confirm('이 임대 계약 내역을 삭제하시겠습니까?')) {
    state.rents = state.rents.filter(r => r.id !== id);
    saveState();
    removeRentSupabase(id);
    renderAll();
  }
};

window.toggleRentYear = function(id, year) {
  const rent = state.rents.find(r => r.id === id);
  if (rent) {
    if (!rent.yearlyPayments) rent.yearlyPayments = {};
    rent.yearlyPayments[year] = !rent.yearlyPayments[year];
    if (rent.yearlyPayments[year]) {
      rent.paymentDate = new Date().toISOString().split('T')[0];
    }
    saveState();
    pushRent(rent);
    renderAll();
  }
};

window.openRentEditModal = function(id) {
  const rent = state.rents.find(r => r.id === id);
  if (!rent) return;
  
  const currentYear = new Date().getFullYear();
  const yearPrev = currentYear - 1;
  const yearCurr = currentYear;
  const yearNext = currentYear + 1;

  document.getElementById('edit-rent-id').value = rent.id;
  document.getElementById('edit-rent-owner-name').value = rent.ownerName || '';
  document.getElementById('edit-rent-phone').value = rent.phone || '';
  document.getElementById('edit-rent-address').value = rent.address || '';
  document.getElementById('edit-rent-area').value = rent.area || '';
  document.getElementById('edit-rent-amount').value = rent.amount || '';
  document.getElementById('edit-rent-bank-account').value = rent.bankAccount || '';
  
  document.getElementById('edit-rent-year-prev').checked = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearPrev)]);
  document.getElementById('edit-rent-year-curr').checked = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearCurr)]);
  document.getElementById('edit-rent-year-next').checked = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearNext)]);
  
  document.getElementById('edit-rent-pay-date').value = rent.paymentDate || '';
  document.getElementById('edit-rent-notes').value = rent.notes || '';
  
  document.getElementById('rent-edit-modal').classList.remove('hidden');
};

function renderAll() {
  renderDashboard();
  renderCustomers();
  renderSales();
  renderAttendance();
  renderRent();
}

// 5. Actions & Mutation Event Listeners

// 5.1. Customer Actions
function addCustomer(name, phone, prices) {
  const id = 'cust-' + Date.now();
  const newCust = { id, name, phone, prices };
  state.customers.push(newCust);
  saveState();
  pushCustomer(newCust);
  renderAll();
}

window.deleteCustomer = function(id) {
  if (confirm('이 거래처를 삭제하시겠습니까? 거래처의 기존 판매 내역은 유지됩니다.')) {
    state.customers = state.customers.filter(c => c.id !== id);
    saveState();
    removeCustomerSupabase(id);
    renderAll();
  }
};

// 5.2. Sales Actions
window.deleteSale = function(id) {
  if (confirm('이 판매 기록을 삭제하시겠습니까?')) {
    state.sales = state.sales.filter(s => s.id !== id);
    saveState();
    removeSaleSupabase(id);
    renderAll();
  }
};

// 5.3. Worker / Labor Actions
function addWorker(name, baseDailyWage) {
  const id = 'worker-' + Date.now();
  const newWorker = { id, name, baseDailyWage: Number(baseDailyWage) };
  state.workers.push(newWorker);
  saveState();
  pushWorker(newWorker);
  renderAll();
}

window.deleteWorker = function(id) {
  if (confirm('이 인부를 목록에서 삭제하시겠습니까? 출근 내역은 유지됩니다.')) {
    state.workers = state.workers.filter(w => w.id !== id);
    saveState();
    removeWorkerSupabase(id);
    renderAll();
  }
};

window.toggleAttendancePayment = function(id) {
  const att = state.attendance.find(a => a.id === id);
  if (att) {
    att.isPaid = !att.isPaid;
    saveState();
    pushAttendance(att);
    renderAll();
  }
};

window.deleteAttendance = function(id) {
  if (confirm('이 출근 기록을 삭제하시겠습니까?')) {
    state.attendance = state.attendance.filter(a => a.id !== id);
    saveState();
    removeAttendanceSupabase(id);
    renderAll();
  }
};

// Detailed Payment Modal Actions
window.openPaymentModal = function(saleId) {
  currentActiveSaleId = saleId;
  const sale = state.sales.find(s => s.id === saleId);
  if (!sale) return;
  
  const customer = state.customers.find(c => c.id === sale.customerId) || { name: '삭제된 거래처' };
  const totalAmount = sale.quantity * sale.price;
  const collectedAmount = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
  const uncollectedAmount = totalAmount - collectedAmount;
  
  document.getElementById('modal-cust-name').textContent = customer.name;
  document.getElementById('modal-sale-date').textContent = sale.saleDate;
  document.getElementById('modal-product-type').textContent = PRODUCT_TYPE_LABELS[sale.productType] || '평당';
  document.getElementById('modal-total-amount').textContent = totalAmount.toLocaleString() + '원';
  document.getElementById('modal-uncollected-amount').textContent = uncollectedAmount.toLocaleString() + '원';
  
  // Prefill new payment inputs
  document.getElementById('modal-pay-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('modal-pay-amount').value = uncollectedAmount;
  
  renderModalPaymentHistory(sale);
  
  document.getElementById('payment-modal').classList.remove('hidden');
};

function renderModalPaymentHistory(sale) {
  const container = document.getElementById('modal-payment-history');
  container.innerHTML = '';
  
  if (!sale.payments || sale.payments.length === 0) {
    container.innerHTML = '<p class="text-xs text-gray-500 py-2">등록된 수금 기록이 없습니다.</p>';
    return;
  }
  
  sale.payments.forEach(payment => {
    const div = document.createElement('div');
    div.className = 'flex justify-between items-center text-xs bg-black/25 p-2 rounded border border-zandiBorder/25';
    div.innerHTML = `
      <span class="text-gray-400 font-medium">${payment.date} 입금</span>
      <span class="text-emerald-400 font-semibold">${payment.amount.toLocaleString()}원</span>
      <button type="button" onclick="deletePaymentRecord('${sale.id}', '${payment.id}')" class="text-rose-400 hover:text-rose-300 text-[11px] font-medium transition-colors">
        삭제
      </button>
    `;
    container.appendChild(div);
  });
}

window.deletePaymentRecord = function(saleId, paymentId) {
  const sale = state.sales.find(s => s.id === saleId);
  if (!sale) return;
  
  sale.payments = sale.payments.filter(p => p.id !== paymentId);
  
  // Re-calculate status
  const totalAmount = sale.quantity * sale.price;
  const collectedAmount = sale.payments.reduce((sum, p) => sum + p.amount, 0);
  sale.isCollected = (totalAmount - collectedAmount) <= 0;
  
  saveState();
  pushSale(sale);
  renderAll();
  
  openPaymentModal(saleId);
};

// Dynamic Sale Item Row Creation
function addSaleItemRow() {
  const container = document.getElementById('sale-items-container');
  const rowId = 'row-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  
  const row = document.createElement('div');
  row.className = 'sale-item-row flex items-center gap-2 bg-black/20 p-2 rounded-lg border border-zandiBorder/40 animate-fade-in';
  row.id = rowId;
  
  row.innerHTML = `
    <select class="item-product-type bg-black/40 border border-zandiBorder text-white text-xs rounded p-1.5 w-1/3">
      <option value="pyeong">평당</option>
      <option value="1818">1818</option>
      <option value="1818t">1818 톤</option>
      <option value="3030">3030</option>
      <option value="3030t">3030 톤</option>
      <option value="4060">4060</option>
      <option value="extra">여유분 (기타)</option>
    </select>
    <input type="number" step="any" placeholder="수량" class="item-qty bg-black/40 border border-zandiBorder text-white text-xs rounded p-1.5 w-1/4" required>
    <input type="number" placeholder="단가" class="item-price bg-black/40 border border-zandiBorder text-white text-xs rounded p-1.5 w-1/4" required>
    <div class="text-right text-[11px] text-emerald-400 font-bold min-w-[60px] item-row-total">0원</div>
    <button type="button" class="remove-item-row-btn text-rose-400 hover:text-rose-300 p-1">
      <i data-lucide="x-circle" class="w-4 h-4"></i>
    </button>
  `;
  container.appendChild(row);
  if (window.lucide) window.lucide.createIcons();

  const typeSelect = row.querySelector('.item-product-type');
  const qtyInput = row.querySelector('.item-qty');
  const priceInput = row.querySelector('.item-price');
  const removeBtn = row.querySelector('.remove-item-row-btn');

  typeSelect.addEventListener('change', () => {
    const custId = document.getElementById('sale-customer').value;
    const customer = state.customers.find(c => c.id === custId);
    if (customer && customer.prices) {
      priceInput.value = customer.prices[typeSelect.value] || 0;
    } else {
      priceInput.value = 0;
    }
    calculateTotals();
  });

  qtyInput.addEventListener('input', calculateTotals);
  priceInput.addEventListener('input', calculateTotals);
  removeBtn.addEventListener('click', () => {
    row.remove();
    calculateTotals();
  });

  // Prefill price if customer is already selected
  const custId = document.getElementById('sale-customer').value;
  const customer = state.customers.find(c => c.id === custId);
  if (customer && customer.prices) {
    priceInput.value = customer.prices[typeSelect.value] || 0;
  }
  
  calculateTotals();
}

function calculateTotals() {
  const rows = document.querySelectorAll('.sale-item-row');
  let grandTotal = 0;
  
  rows.forEach(row => {
    const qty = Number(row.querySelector('.item-qty').value) || 0;
    const price = Number(row.querySelector('.item-price').value) || 0;
    const rowTotal = qty * price;
    row.querySelector('.item-row-total').textContent = rowTotal.toLocaleString() + '원';
    grandTotal += rowTotal;
  });
  
  document.getElementById('sale-items-total').textContent = grandTotal.toLocaleString() + '원';
  
  // 수금액(받은 돈) 인풋에 합계 자동 기입
  const collectedInput = document.getElementById('sale-collected-amount');
  if (collectedInput) {
    collectedInput.value = grandTotal;
  }
}

function initRentYears() {
  const currentYear = new Date().getFullYear();
  const yearPrev = currentYear - 1;
  const yearCurr = currentYear;
  const yearNext = currentYear + 1;

  // 1) 테이블 헤더 변경
  const thPrev = document.getElementById('rent-header-year-prev');
  const thCurr = document.getElementById('rent-header-year-curr');
  const thNext = document.getElementById('rent-header-year-next');
  if (thPrev) thPrev.textContent = `${yearPrev}년`;
  if (thCurr) thCurr.textContent = `${yearCurr}년`;
  if (thNext) thNext.textContent = `${yearNext}년`;

  // 1.5) 지급 여부 필터 연도 선택 옵션 생성 (최근 5개년 생성)
  const filterYearSelect = document.getElementById('filter-rent-year-select');
  if (filterYearSelect) {
    filterYearSelect.innerHTML = '';
    for (let y = currentYear - 2; y <= currentYear + 2; y++) {
      const opt = document.createElement('option');
      opt.value = String(y);
      opt.textContent = `${y}년`;
      if (y === currentYear) opt.selected = true;
      filterYearSelect.appendChild(opt);
    }
  }

  // 2) 등록 폼 체크박스 생성
  const regContainer = document.getElementById('rent-register-years-container');
  if (regContainer) {
    regContainer.innerHTML = `
      <label class="custom-checkbox">
        <input type="checkbox" class="rent-register-year" value="${yearPrev}">
        <span class="checkmark"></span>
        <span class="text-xs text-slate-300">${yearPrev}년</span>
      </label>
      <label class="custom-checkbox">
        <input type="checkbox" class="rent-register-year" value="${yearCurr}">
        <span class="checkmark"></span>
        <span class="text-xs text-slate-300">${yearCurr}년</span>
      </label>
      <label class="custom-checkbox">
        <input type="checkbox" class="rent-register-year" value="${yearNext}">
        <span class="checkmark"></span>
        <span class="text-xs text-slate-300">${yearNext}년</span>
      </label>
    `;
  }

  // 3) 수정 모달 체크박스 생성
  const editContainer = document.getElementById('rent-edit-years-container');
  if (editContainer) {
    editContainer.innerHTML = `
      <label class="custom-checkbox">
        <input type="checkbox" id="edit-rent-year-prev" value="${yearPrev}">
        <span class="checkmark"></span>
        <span class="text-xs text-slate-300">${yearPrev}년</span>
      </label>
      <label class="custom-checkbox">
        <input type="checkbox" id="edit-rent-year-curr" value="${yearCurr}">
        <span class="checkmark"></span>
        <span class="text-xs text-slate-300">${yearCurr}년</span>
      </label>
      <label class="custom-checkbox">
        <input type="checkbox" id="edit-rent-year-next" value="${yearNext}">
        <span class="checkmark"></span>
        <span class="text-xs text-slate-300">${yearNext}년</span>
      </label>
    `;
  }
}

// Form submission events setup
function initForms() {
  // 1) 거래처 등록
  document.getElementById('customer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    
    const prices = {
      '1818': Number(document.getElementById('cust-price-1818').value) || 0,
      '1818t': Number(document.getElementById('cust-price-1818t').value) || 0,
      '3030': Number(document.getElementById('cust-price-3030').value) || 0,
      '3030t': Number(document.getElementById('cust-price-3030t').value) || 0,
      '4060': Number(document.getElementById('cust-price-4060').value) || 0,
      'pyeong': Number(document.getElementById('cust-price-pyeong').value) || 0,
      'extra': Number(document.getElementById('cust-price-extra').value) || 0
    };

    if (!name) return;
    addCustomer(name, phone, prices);
    document.getElementById('customer-form').reset();
  });

  // 2) 판매 등록시 거래처 선택에 따른 모든 품목 단가 일괄 업데이트
  document.getElementById('sale-customer').addEventListener('change', () => {
    const custId = document.getElementById('sale-customer').value;
    const customer = state.customers.find(c => c.id === custId);
    
    const rows = document.querySelectorAll('.sale-item-row');
    rows.forEach(row => {
      const typeSelect = row.querySelector('.item-product-type');
      const priceInput = row.querySelector('.item-price');
      if (customer && customer.prices) {
        priceInput.value = customer.prices[typeSelect.value] || 0;
      } else {
        priceInput.value = 0;
      }
    });
    calculateTotals();
  });

  // 3) 완납 적용 버튼
  document.getElementById('btn-fill-full-payment').addEventListener('click', () => {
    const totalStr = document.getElementById('sale-items-total').textContent;
    const total = Number(totalStr.replace(/[^0-9]/g, '')) || 0;
    document.getElementById('sale-collected-amount').value = total;
  });

  // 4) 품목 추가 버튼 바인딩
  document.getElementById('add-sale-item-btn').addEventListener('click', addSaleItemRow);

  // 5) 잔디 판매 등록
  document.getElementById('sale-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerId = document.getElementById('sale-customer').value;
    const saleDate = document.getElementById('sale-date').value;
    const notes = document.getElementById('sale-notes').value.trim();

    const rows = document.querySelectorAll('.sale-item-row');
    if (rows.length === 0) {
      alert('최소 한 개의 품목을 추가해야 합니다.');
      return;
    }

    // 폼에 입력받은 총 수금액 (받은 돈)
    let remainingCollected = Number(document.getElementById('sale-collected-amount').value) || 0;

    // 각 품목별로 루프 돌려 등록
    for (const row of rows) {
      const productType = row.querySelector('.item-product-type').value;
      const quantity = Number(row.querySelector('.item-qty').value);
      const price = Number(row.querySelector('.item-price').value);

      if (!customerId || !saleDate || !quantity) continue;

      const id = 'sale-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const itemTotal = quantity * price;
      
      // 수금액을 품목별로 순차적으로 분배 적용
      const appliedAmount = Math.min(remainingCollected, itemTotal);
      remainingCollected -= appliedAmount;

      const payments = appliedAmount > 0 ? [{ id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5), date: saleDate, amount: appliedAmount }] : [];
      const isCollected = appliedAmount >= itemTotal;

      const newSale = {
        id,
        customerId,
        saleDate,
        productType,
        quantity,
        price,
        isCollected,
        notes,
        payments
      };
      state.sales.push(newSale);
      await pushSale(newSale);
    }

    saveState();
    renderAll();
    
    // Reset
    document.getElementById('sale-form').reset();
    document.getElementById('sale-items-container').innerHTML = '';
    addSaleItemRow(); // 기본 한줄 추가
    document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
  });

  // 6) 인부 등록
  document.getElementById('worker-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('worker-name').value.trim();
    const baseDailyWage = document.getElementById('worker-wage').value;

    if (!name || !baseDailyWage) return;
    addWorker(name, baseDailyWage);
    document.getElementById('worker-form').reset();
  });

  // 7) 출근 등록 (체크박스 다중 등록 지원)
  document.getElementById('attendance-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const workDate = document.getElementById('att-date').value;
    if (!workDate) return;

    const rows = document.querySelectorAll('#att-workers-list-container > div');
    let addedCount = 0;

    for (const row of rows) {
      const checkInput = row.querySelector('.att-worker-check');
      if (checkInput && checkInput.checked) {
        const workerId = checkInput.value;
        const worker = state.workers.find(w => w.id === workerId);
        if (!worker) continue;

        const workTypeSelect = row.querySelector('.att-worker-type');
        const workType = Number(workTypeSelect.value);

        const paidInput = row.querySelector('.att-worker-paid');
        const isPaid = paidInput ? paidInput.checked : false;

        const wageInput = row.querySelector('.att-worker-wage');
        const enteredWage = wageInput ? Number(wageInput.value) : worker.baseDailyWage;
        // dailyWage = 입력된 금액 / 근무일수(workType)
        const dailyWage = workType > 0 ? (enteredWage / workType) : enteredWage;

        // 고유 ID 생성 (동시 등록 시 밀리초 겹치지 않게 난수 결합)
        const id = 'att-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        const newAtt = {
          id,
          workerId,
          workDate,
          workType,
          dailyWage,
          isPaid
        };
        state.attendance.push(newAtt);
        await pushAttendance(newAtt);
        addedCount++;
      }
    }

    if (addedCount === 0) {
      alert('출근 등록할 인부를 최소 한 명 이상 선택해주세요.');
      return;
    }

    saveState();
    renderAll();
    
    // 폼 초기화 및 날짜 오늘로 재설정
    document.getElementById('attendance-form').reset();
    document.getElementById('att-date').value = new Date().toISOString().split('T')[0];
  });


  // 8) Advanced Filters Event Listeners for Sales
  const applyFilters = () => {
    filters.customerId = document.getElementById('filter-sale-customer').value;
    filters.productType = document.getElementById('filter-sale-type').value;
    filters.startDate = document.getElementById('filter-sale-start').value;
    filters.endDate = document.getElementById('filter-sale-end').value;
    renderSales();
  };

  document.getElementById('filter-sale-customer').addEventListener('change', applyFilters);
  document.getElementById('filter-sale-type').addEventListener('change', applyFilters);
  document.getElementById('filter-sale-start').addEventListener('change', applyFilters);
  document.getElementById('filter-sale-end').addEventListener('change', applyFilters);

  // 9) Filters Event Listeners for Attendance
  const applyAttFilters = () => {
    attFilters.workerId = document.getElementById('filter-att-worker').value;
    attFilters.workType = document.getElementById('filter-att-type').value;
    attFilters.startDate = document.getElementById('filter-att-start').value;
    attFilters.endDate = document.getElementById('filter-att-end').value;
    renderAttendance();
  };

  document.getElementById('filter-att-worker').addEventListener('change', applyAttFilters);
  document.getElementById('filter-att-type').addEventListener('change', applyAttFilters);
  document.getElementById('filter-att-start').addEventListener('change', applyAttFilters);
  document.getElementById('filter-att-end').addEventListener('change', applyAttFilters);

  // 9.5) Attendance View Toggle & Calendar Navigation Event Listeners
  const btnViewTable = document.getElementById('btn-view-table');
  const btnViewCalendar = document.getElementById('btn-view-calendar');
  const tableContainer = document.getElementById('attendance-table-container');
  const calendarContainer = document.getElementById('attendance-calendar-container');

  btnViewTable.addEventListener('click', () => {
    activeAttendanceView = 'table';
    tableContainer.classList.remove('hidden');
    calendarContainer.classList.add('hidden');
    btnViewTable.className = 'px-3 py-1 text-xs rounded-md bg-zandiPrimary text-black font-semibold transition-all duration-300';
    btnViewCalendar.className = 'px-3 py-1 text-xs rounded-md text-slate-400 hover:text-white transition-all duration-300';
  });

  btnViewCalendar.addEventListener('click', () => {
    activeAttendanceView = 'calendar';
    tableContainer.classList.add('hidden');
    calendarContainer.classList.remove('hidden');
    btnViewCalendar.className = 'px-3 py-1 text-xs rounded-md bg-zandiPrimary text-black font-semibold transition-all duration-300';
    btnViewTable.className = 'px-3 py-1 text-xs rounded-md text-slate-400 hover:text-white transition-all duration-300';
    renderAttendanceCalendar();
  });

  document.getElementById('btn-cal-prev').addEventListener('click', () => {
    if (calendarMonth === 0) {
      calendarMonth = 11;
      calendarYear--;
    } else {
      calendarMonth--;
    }
    renderAttendanceCalendar();
  });

  document.getElementById('btn-cal-next').addEventListener('click', () => {
    if (calendarMonth === 11) {
      calendarMonth = 0;
      calendarYear++;
    } else {
      calendarMonth++;
    }
    renderAttendanceCalendar();
  });

  // 9.7) Dashboard Calendar Navigation
  const btnDashCalPrev = document.getElementById('btn-dash-cal-prev');
  if (btnDashCalPrev) {
    btnDashCalPrev.addEventListener('click', () => {
      if (dashCalendarMonth === 0) {
        dashCalendarMonth = 11;
        dashCalendarYear--;
      } else {
        dashCalendarMonth--;
      }
      renderDashCalendar();
    });
  }

  const btnDashCalNext = document.getElementById('btn-dash-cal-next');
  if (btnDashCalNext) {
    btnDashCalNext.addEventListener('click', () => {
      if (dashCalendarMonth === 11) {
        dashCalendarMonth = 0;
        dashCalendarYear++;
      } else {
        dashCalendarMonth++;
      }
      renderDashCalendar();
    });
  }

  // 10) Modal Event Listeners
  document.getElementById('close-payment-modal-btn').addEventListener('click', () => {
    document.getElementById('payment-modal').classList.add('hidden');
  });

  const closeDashModalBtn = document.getElementById('close-dash-modal-btn');
  if (closeDashModalBtn) {
    closeDashModalBtn.addEventListener('click', () => {
      document.getElementById('dash-day-details-modal').classList.add('hidden');
    });
  }

  const btnCloseDashModal = document.getElementById('btn-close-dash-modal');
  if (btnCloseDashModal) {
    btnCloseDashModal.addEventListener('click', () => {
      document.getElementById('dash-day-details-modal').classList.add('hidden');
    });
  }

  // 10.5) Go to Sales/Attendance tabs with prefilled date from dashboard modal
  const btnDashGoSale = document.getElementById('btn-dash-go-sale');
  if (btnDashGoSale) {
    btnDashGoSale.addEventListener('click', () => {
      const targetDate = document.getElementById('dash-modal-date-title').textContent;
      document.getElementById('sale-date').value = targetDate;
      document.getElementById('dash-day-details-modal').classList.add('hidden');
      
      const salesTab = document.querySelector('.nav-tab[data-section="sales"]');
      if (salesTab) salesTab.click();
    });
  }

  const btnDashGoAtt = document.getElementById('btn-dash-go-att');
  if (btnDashGoAtt) {
    btnDashGoAtt.addEventListener('click', () => {
      const targetDate = document.getElementById('dash-modal-date-title').textContent;
      document.getElementById('att-date').value = targetDate;
      document.getElementById('dash-day-details-modal').classList.add('hidden');
      
      const attendanceTab = document.querySelector('.nav-tab[data-section="attendance"]');
      if (attendanceTab) attendanceTab.click();
    });
  }

  document.getElementById('modal-payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentActiveSaleId) return;

    const sale = state.sales.find(s => s.id === currentActiveSaleId);
    if (!sale) return;

    const date = document.getElementById('modal-pay-date').value;
    const amount = Number(document.getElementById('modal-pay-amount').value);

    if (!date || amount <= 0) return;

    if (!sale.payments) sale.payments = [];
    sale.payments.push({
      id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      date,
      amount
    });

    // Update status
    const totalAmount = sale.quantity * sale.price;
    const collectedAmount = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    sale.isCollected = (totalAmount - collectedAmount) <= 0;

    saveState();
    pushSale(sale);
    renderAll();

    openPaymentModal(currentActiveSaleId);
  });

  // 11.5) Land Rent Register Form & Filters
  const rentForm = document.getElementById('rent-form');
  if (rentForm) {
    rentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const ownerName = document.getElementById('rent-owner-name').value.trim();
      const phone = document.getElementById('rent-phone').value.trim();
      const address = document.getElementById('rent-address').value.trim();
      const area = document.getElementById('rent-area').value;
      const amount = document.getElementById('rent-amount').value;
      const bankAccount = document.getElementById('rent-bank-account').value.trim();
      
      const yearlyPayments = {};
      document.querySelectorAll('.rent-register-year').forEach(cb => {
        if (cb.checked) {
          yearlyPayments[cb.value] = true;
        }
      });
      
      const paymentDate = document.getElementById('rent-pay-date').value;
      const notes = document.getElementById('rent-notes').value.trim();

      addRent(ownerName, phone, address, area, amount, bankAccount, yearlyPayments, paymentDate, notes);
      
      rentForm.reset();
      document.getElementById('rent-pay-date').value = '';
    });
  }

  const rentSearchInput = document.getElementById('filter-rent-search');
  if (rentSearchInput) {
    rentSearchInput.addEventListener('input', () => {
      renderRent();
    });
  }

  const filterRentYearSelect = document.getElementById('filter-rent-year-select');
  if (filterRentYearSelect) {
    filterRentYearSelect.addEventListener('change', () => {
      renderRent();
    });
  }

  const filterRentPaidSelect = document.getElementById('filter-rent-paid-select');
  if (filterRentPaidSelect) {
    filterRentPaidSelect.addEventListener('change', () => {
      renderRent();
    });
  }

  const editRentForm = document.getElementById('edit-rent-form');
  if (editRentForm) {
    editRentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-rent-id').value;
      const rent = state.rents.find(r => r.id === id);
      if (!rent) return;
      
      const currentYear = new Date().getFullYear();
      const yearPrev = currentYear - 1;
      const yearCurr = currentYear;
      const yearNext = currentYear + 1;

      rent.ownerName = document.getElementById('edit-rent-owner-name').value.trim();
      rent.phone = document.getElementById('edit-rent-phone').value.trim();
      rent.address = document.getElementById('edit-rent-address').value.trim();
      rent.area = Number(document.getElementById('edit-rent-area').value) || 0;
      rent.amount = Number(document.getElementById('edit-rent-amount').value) || 0;
      rent.bankAccount = document.getElementById('edit-rent-bank-account').value.trim();
      
      if (!rent.yearlyPayments) rent.yearlyPayments = {};
      rent.yearlyPayments[String(yearPrev)] = document.getElementById('edit-rent-year-prev').checked;
      rent.yearlyPayments[String(yearCurr)] = document.getElementById('edit-rent-year-curr').checked;
      rent.yearlyPayments[String(yearNext)] = document.getElementById('edit-rent-year-next').checked;
      
      rent.paymentDate = document.getElementById('edit-rent-pay-date').value;
      rent.notes = document.getElementById('edit-rent-notes').value.trim();
      
      saveState();
      await pushRent(rent);
      renderAll();
      
      document.getElementById('rent-edit-modal').classList.add('hidden');
    });
  }

  const closeRentEditModalBtn = document.getElementById('close-rent-edit-modal-btn');
  if (closeRentEditModalBtn) {
    closeRentEditModalBtn.addEventListener('click', () => {
      document.getElementById('rent-edit-modal').classList.add('hidden');
    });
  }

  // 11) Supabase Settings Form Submit
  document.getElementById('settings-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = document.getElementById('settings-supabase-url').value.trim();
    const key = document.getElementById('settings-supabase-key').value.trim();
    
    if (url && key) {
      localStorage.setItem('zandi_supabase_url', url);
      localStorage.setItem('zandi_supabase_key', key);
      alert('Supabase 설정이 저장되었습니다. 동기화를 진행합니다.');
      initSupabase();
      
      const settingsModal = document.getElementById('settings-modal');
      if (settingsModal) settingsModal.classList.add('hidden');
    }
  });

  document.getElementById('clear-settings-btn').addEventListener('click', () => {
    localStorage.removeItem('zandi_supabase_url');
    localStorage.removeItem('zandi_supabase_key');
    alert('Supabase 연동이 해제되었습니다. 이제 기기 로컬 모드로 동작합니다.');
    
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) settingsModal.classList.add('hidden');
    location.reload();
  });

  // 12) Customer & Sale Edit Modal Event Listeners
  const closeCustEditBtn = document.getElementById('close-cust-edit-modal-btn');
  if (closeCustEditBtn) {
    closeCustEditBtn.addEventListener('click', () => {
      document.getElementById('customer-edit-modal').classList.add('hidden');
    });
  }

  const closeSaleEditBtn = document.getElementById('close-sale-edit-modal-btn');
  if (closeSaleEditBtn) {
    closeSaleEditBtn.addEventListener('click', () => {
      document.getElementById('sale-edit-modal').classList.add('hidden');
    });
  }

  const editCustForm = document.getElementById('edit-cust-form');
  if (editCustForm) {
    editCustForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-cust-id').value;
      const customer = state.customers.find(c => c.id === id);
      if (!customer) return;

      customer.name = document.getElementById('edit-cust-name').value.trim();
      customer.phone = document.getElementById('edit-cust-phone').value.trim();
      customer.prices = {
        '1818': Number(document.getElementById('edit-cust-price-1818').value) || 0,
        '1818t': Number(document.getElementById('edit-cust-price-1818t').value) || 0,
        '3030': Number(document.getElementById('edit-cust-price-3030').value) || 0,
        '3030t': Number(document.getElementById('edit-cust-price-3030t').value) || 0,
        '4060': Number(document.getElementById('edit-cust-price-4060').value) || 0,
        'pyeong': Number(document.getElementById('edit-cust-price-pyeong').value) || 0,
        'extra': Number(document.getElementById('edit-cust-price-extra').value) || 0
      };

      saveState();
      await pushCustomer(customer);
      renderAll();
      document.getElementById('customer-edit-modal').classList.add('hidden');
    });
  }

  const editSaleForm = document.getElementById('edit-sale-form');
  if (editSaleForm) {
    editSaleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('edit-sale-id').value;
      const sale = state.sales.find(s => s.id === id);
      if (!sale) return;

      sale.customerId = document.getElementById('edit-sale-customer').value;
      sale.saleDate = document.getElementById('edit-sale-date').value;
      sale.productType = document.getElementById('edit-sale-type').value;
      sale.quantity = Number(document.getElementById('edit-sale-qty').value);
      sale.price = Number(document.getElementById('edit-sale-price').value);
      sale.notes = document.getElementById('edit-sale-notes').value.trim();

      // 재계산 및 정산 상태 재확인
      const totalAmount = sale.quantity * sale.price;
      const collectedAmount = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
      sale.isCollected = collectedAmount >= totalAmount;

      saveState();
      await pushSale(sale);
      renderAll();
      document.getElementById('sale-edit-modal').classList.add('hidden');
    });
  }

  // 13) 비밀번호 변경 폼 리스너
  const passwordChangeForm = document.getElementById('password-change-form');
  if (passwordChangeForm) {
    passwordChangeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('current-pass').value;
      const newPass = document.getElementById('new-pass').value.trim();

      const storedPass = localStorage.getItem('zandi_password') || "1234";

      if (currentPass !== storedPass) {
        alert('현재 비밀번호가 일치하지 않습니다.');
        return;
      }

      if (newPass.length < 4) {
        alert('새 비밀번호는 최소 4자리 이상이어야 합니다.');
        return;
      }

      localStorage.setItem('zandi_password', newPass);
      alert('비밀번호가 성공적으로 변경되었습니다. 다음 로그인부터 적용됩니다.');
      passwordChangeForm.reset();
    });
  }

  // 14) 소유주 사장님 이름 연동 및 설정 모달 제어 로직
  const ownerNameInput = document.getElementById('owner-name-input');
  const settingsOwnerName = document.getElementById('settings-owner-name');
  const ownerAvatar = document.getElementById('owner-avatar');
  if (ownerNameInput) {
    // 저장되어 있는 이름 로드
    const savedName = localStorage.getItem('zandi_owner_name') || '소유주 사장님';
    ownerNameInput.value = savedName;
    if (settingsOwnerName) settingsOwnerName.value = savedName;
    if (ownerAvatar) ownerAvatar.textContent = savedName.trim().charAt(0) || '社';

    ownerNameInput.addEventListener('change', () => {
      const newName = ownerNameInput.value.trim() || '소유주 사장님';
      ownerNameInput.value = newName;
      if (settingsOwnerName) settingsOwnerName.value = newName;
      localStorage.setItem('zandi_owner_name', newName);
      if (ownerAvatar) ownerAvatar.textContent = newName.charAt(0);
    });

    if (settingsOwnerName) {
      settingsOwnerName.addEventListener('input', () => {
        const newName = settingsOwnerName.value.trim() || '소유주 사장님';
        ownerNameInput.value = newName;
        localStorage.setItem('zandi_owner_name', newName);
        if (ownerAvatar) ownerAvatar.textContent = newName.charAt(0);
      });
    }
  }

  const sidebarSettingsBtn = document.getElementById('sidebar-settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn');

  if (sidebarSettingsBtn && settingsModal) {
    sidebarSettingsBtn.addEventListener('click', () => {
      settingsModal.classList.remove('hidden');
    });
  }

  if (closeSettingsModalBtn && settingsModal) {
    closeSettingsModalBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });
  }

  // settings-modal 바깥을 클릭하면 모달 닫기
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.add('hidden');
      }
    });
  }
}

// 6. Application Launch Entry Point
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initAuth();
  initNavigation();
  
  // 기본 날짜 오늘 날짜로 세팅
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('sale-date').value = todayStr;
  document.getElementById('att-date').value = todayStr;

  initForms();
  initRentYears();
  
  // 판매 품목 기본 첫줄 추가
  addSaleItemRow();

  // Supabase 동기화 초기화
  initSupabase();

  renderAll();
});

// Customer Edit Modal Actions
window.openCustomerEditModal = function(id) {
  const customer = state.customers.find(c => c.id === id);
  if (!customer) return;

  document.getElementById('edit-cust-id').value = customer.id;
  document.getElementById('edit-cust-name').value = customer.name;
  document.getElementById('edit-cust-phone').value = customer.phone || '';

  const prices = customer.prices || {};
  document.getElementById('edit-cust-price-1818').value = prices['1818'] || 0;
  document.getElementById('edit-cust-price-1818t').value = prices['1818t'] || 0;
  document.getElementById('edit-cust-price-3030').value = prices['3030'] || 0;
  document.getElementById('edit-cust-price-3030t').value = prices['3030t'] || 0;
  document.getElementById('edit-cust-price-4060').value = prices['4060'] || 0;
  document.getElementById('edit-cust-price-pyeong').value = prices['pyeong'] || 0;
  document.getElementById('edit-cust-price-extra').value = prices['extra'] || 0;

  document.getElementById('customer-edit-modal').classList.remove('hidden');
};

// Sale Edit Modal Actions
window.openSaleEditModal = function(id) {
  const sale = state.sales.find(s => s.id === id);
  if (!sale) return;

  const editSaleCustomerSelect = document.getElementById('edit-sale-customer');
  editSaleCustomerSelect.innerHTML = '';
  state.customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    editSaleCustomerSelect.appendChild(opt);
  });

  document.getElementById('edit-sale-id').value = sale.id;
  editSaleCustomerSelect.value = sale.customerId;
  document.getElementById('edit-sale-date').value = sale.saleDate;
  document.getElementById('edit-sale-type').value = sale.productType;
  document.getElementById('edit-sale-qty').value = sale.quantity;
  document.getElementById('edit-sale-price').value = sale.price;
  document.getElementById('edit-sale-notes').value = sale.notes || '';

  document.getElementById('sale-edit-modal').classList.remove('hidden');
};

