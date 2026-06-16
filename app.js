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
  village: '1', // 기본값 1동네
  isPaid: ''
};

// 동네 이름 정의 (로컬 스토리지 캐싱 지원)
let rentVillageNames = {
  '1': localStorage.getItem('rent_village_name_1') || '1동네',
  '2': localStorage.getItem('rent_village_name_2') || '2동네',
  '3': localStorage.getItem('rent_village_name_3') || '3동네',
  '4': localStorage.getItem('rent_village_name_4') || '4동네'
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
  const persistentAuth = localStorage.getItem('zandi_authenticated') === 'true';
  
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

  state.isAuthenticated = persistentAuth;
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
      
      // 실제 연결 상태 테스트를 위한 간단한 쿼리 호출
      const { data, error } = await supabaseClient.from('customers').select('id').limit(1);
      if (error) {
        throw error;
      }
      
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
      alert(`[Supabase 연동 실패] 주소 또는 Key가 틀렸거나 데이터베이스 설정 오류입니다.\n\n오류 내용: ${e.message || JSON.stringify(e)}`);
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => pullFromSupabase())
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

    // settings 테이블 풀 시도 (테이블이 없을 수 있으므로 try-catch로 예외 처리)
    try {
      const { data: settingsData, error: setErr } = await supabaseClient.from('settings').select('*');
      if (!setErr && settingsData) {
        settingsData.forEach(s => {
          if (s.key && s.key.startsWith('rent_village_name_')) {
            const vKey = s.key.replace('rent_village_name_', '');
            rentVillageNames[vKey] = s.value;
            localStorage.setItem(s.key, s.value);
          }
        });
      }
    } catch (e) {
      console.warn("Supabase settings table pull failed (might not exist yet):", e);
    }

    state.customers = cust.map(c => ({ id: c.id, name: c.name, phone: c.phone, prices: c.prices, initialDebt: c.initial_debt || 0, initialDebtCollected: c.initial_debt_collected || 0, sortOrder: c.sort_order || 0 }));
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
      // Supabase에 데이터가 있으면 → Supabase 데이터로 state 업데이트
      state.rents = ren.map(r => ({
        id: r.id,
        ownerName: r.owner_name || r.ownerName || '',
        phone: r.phone || '',
        address: r.address || '',
        area: Number(r.area) || 0,
        amount: Number(r.amount) || 0,
        bankAccount: r.bank_account || r.bankAccount || '',
        yearlyPayments: r.yearly_payments || r.yearlyPayments || {},
        paymentDate: r.payment_date || r.paymentDate || '',
        notes: r.notes || '',
        village: r.village || '1'
      }));

      // 로컬에만 있고 Supabase에 없는 항목 → 자동 업로드 (누락 데이터 보완)
      const supabaseIds = new Set(ren.map(r => r.id));
      const localOnly = (JSON.parse(localStorage.getItem('zandi_ledger_data') || '{}').rents || [])
        .filter(r => !supabaseIds.has(r.id) && !r.id.startsWith('rent-'));
      if (localOnly.length > 0) {
        console.log(`[AutoSync] Supabase에 없는 로컬 데이터 ${localOnly.length}건 자동 업로드...`);
        for (const rent of localOnly) {
          try {
            await pushRent(rent);
          } catch (err) {
            console.warn("[AutoSync] Local only rent upload failed:", err);
          }
        }
      }
    } else if (state.rents && state.rents.length > 0) {
      // Supabase가 완전히 비어있고 로컬에 데이터가 있으면 → 실제 사용자가 등록한 데이터만 초기 업로드
      const realRents = state.rents.filter(r => !r.id.startsWith('rent-'));
      if (realRents.length > 0) {
        console.log(`[AutoSync] 초기 동기화: 로컬 데이터 ${realRents.length}건 업로드...`);
        for (const rent of realRents) {
          try {
            await pushRent(rent);
          } catch (err) {
            console.warn("[AutoSync] Initial rent upload failed:", err);
          }
        }
        console.log('[AutoSync] 초기 업로드 완료!');
      }
    }

    saveState();
    renderAll();
  } catch (e) {
    console.warn("Supabase fetch failed. Using local cached data.", e);
  }
}

async function pushCustomers(customers) {
  if (!supabaseClient) return;
  const list = Array.isArray(customers) ? customers : [customers];
  const payload = list.map(customer => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    prices: customer.prices,
    initial_debt: customer.initialDebt || 0,
    initial_debt_collected: customer.initialDebtCollected || 0,
    sort_order: customer.sortOrder || 0
  }));

  try {
    const { error } = await supabaseClient.from('customers').upsert(payload);
    if (error) {
      console.error('[pushCustomers] Supabase 저장 오류:', error);
    }
  } catch (e) {
    console.error('[pushCustomers] 예외 발생:', e);
  }
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
    const { error } = await supabaseClient.from('rents').upsert({
      id: rent.id,
      owner_name: rent.ownerName,    // snake_case로 저장 (PostgreSQL 호환)
      phone: rent.phone,
      address: rent.address,
      area: rent.area,
      amount: rent.amount,
      bank_account: rent.bankAccount,
      yearly_payments: rent.yearlyPayments,
      payment_date: rent.paymentDate,
      notes: rent.notes,
      village: rent.village || '1'
    });
    if (error) {
      console.error('[pushRent] Supabase 저장 오류:', error);
      const detail = error.details || error.hint || '';
      showToast(`임대료 저장 실패: ${error.message} ${detail ? `(${detail})` : ''}`, 'error');
      throw error;
    }
  } catch (e) {
    console.error('[pushRent] 예외 발생:', e);
    throw e;
  }
}

async function removeRentSupabase(id) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('rents').delete().eq('id', id);
    if (error) {
      console.error('[removeRentSupabase] Supabase 삭제 오류:', error);
      throw error;
    }
  } catch (e) {
    console.error('[removeRentSupabase] 예외 발생:', e);
    throw e;
  }
}

async function pushSetting(key, value) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('settings').upsert({
      key: key,
      value: value
    });
    if (error) {
      console.error('[pushSetting] Supabase 설정 저장 오류:', error);
      throw error;
    }
  } catch (e) {
    console.error('[pushSetting] 예외 발생:', e);
    throw e;
  }
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
      localStorage.setItem('zandi_authenticated', 'true');
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
      localStorage.removeItem('zandi_authenticated');
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

  const sortedCustomers = [...state.customers].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  sortedCustomers.forEach(customer => {
    const cSales = state.sales.filter(s => s.customerId === customer.id);
    const totalSales = cSales.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const totalCollected = cSales.reduce((sum, item) => sum + (item.payments || []).reduce((s, p) => s + p.amount, 0), 0);
    
    const initialDebtVal = customer.initialDebt || 0;
    const initialCollectedVal = customer.initialDebtCollected || 0;
    const initialUncollected = Math.max(0, initialDebtVal - initialCollectedVal);
    const uncollected = (totalSales - totalCollected) + initialUncollected;

    const prices = customer.prices || { '1818': 0, '1818t': 0, '3030': 0, '3030t': 0, '4060': 0, 'pyeong': 0, 'extra': 0 };

    const tr = document.createElement('tr');
    tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20 customer-row-draggable';
    tr.setAttribute('draggable', 'true');
    tr.dataset.id = customer.id;
    tr.innerHTML = `
      <td class="p-3 text-center no-print" onclick="event.stopPropagation()">
        <label class="custom-checkbox inline-block">
          <input type="checkbox" class="cust-select-check" value="${customer.id}">
          <span class="checkmark"></span>
        </label>
      </td>
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
      <td class="p-3 text-rose-400 font-semibold">
        <div class="flex items-center justify-between gap-1.5">
          <span class="cursor-pointer hover:underline text-rose-300 flex items-center gap-1" onclick="openMonthlyDebtModal('${customer.id}', '${customer.name.replace(/'/g, "\\'")}', ${uncollected})">
            ${uncollected.toLocaleString()}원 <i data-lucide="eye" class="w-3 h-3 text-rose-400/60 inline"></i>
          </span>
          ${uncollected > 0 ? `
            <button onclick="openDebtCollectModal('${customer.id}', '${customer.name.replace(/'/g, "\\'")}', ${uncollected})" class="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-semibold" title="이월 미수금 일괄 수금">
              입금
            </button>
          ` : ''}
        </div>
      </td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-1">
          <button onclick="openCustomerEditModal('${customer.id}')" class="text-emerald-400 hover:text-emerald-300 p-1" title="수정">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteCustomer('${customer.id}')" class="text-rose-400 hover:text-rose-300 p-1" title="삭제">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    `;

    // --- Drag and Drop Events (Mouse) ---
    tr.addEventListener('dragstart', (e) => {
      tr.classList.add('opacity-40');
      e.dataTransfer.setData('text/plain', customer.id);
    });

    tr.addEventListener('dragend', () => {
      tr.classList.remove('opacity-40');
      document.querySelectorAll('.customer-row-draggable').forEach(row => {
        row.classList.remove('bg-emerald-950/40');
      });
    });

    tr.addEventListener('dragover', (e) => {
      e.preventDefault();
      tr.classList.add('bg-emerald-950/40');
    });

    tr.addEventListener('dragleave', () => {
      tr.classList.remove('bg-emerald-950/40');
    });

    tr.addEventListener('drop', async (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      const targetId = tr.dataset.id;
      if (draggedId && draggedId !== targetId) {
        await reorderCustomers(draggedId, targetId);
      }
    });

    // --- Drag and Drop Events (Touch for Mobile) ---
    let touchStartY = 0;
    tr.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      tr.classList.add('opacity-40');
    }, { passive: true });

    tr.addEventListener('touchmove', (e) => {
      const touchY = e.touches[0].clientY;
      const element = document.elementFromPoint(e.touches[0].clientX, touchY);
      const targetTr = element ? element.closest('.customer-row-draggable') : null;
      
      document.querySelectorAll('.customer-row-draggable').forEach(row => {
        row.classList.remove('bg-emerald-950/40');
      });
      if (targetTr && targetTr !== tr) {
        targetTr.classList.add('bg-emerald-950/40');
      }
    }, { passive: true });

    tr.addEventListener('touchend', async (e) => {
      tr.classList.remove('opacity-40');
      const touchY = e.changedTouches[0].clientY;
      const element = document.elementFromPoint(e.changedTouches[0].clientX, touchY);
      const targetTr = element ? element.closest('.customer-row-draggable') : null;
      
      document.querySelectorAll('.customer-row-draggable').forEach(row => {
        row.classList.remove('bg-emerald-950/40');
      });

      if (targetTr && targetTr !== tr) {
        const draggedId = tr.dataset.id;
        const targetId = targetTr.dataset.id;
        await reorderCustomers(draggedId, targetId);
      }
    });

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
    tr.id = `sale-row-${sale.id}`;
    tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20';
    tr.innerHTML = `
      <td class="p-3 text-center pl-2">
        <label class="custom-checkbox inline-block">
          <input type="checkbox" class="sale-select-row-check" data-sale-id="${sale.id}" onchange="toggleSaleSelectRow(this)">
          <span class="checkmark"></span>
        </label>
      </td>
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

window.toggleSaleSelectRow = function(checkbox) {
  const allChecks = document.querySelectorAll('.sale-select-row-check');
  const checkedCount = document.querySelectorAll('.sale-select-row-check:checked').length;
  const allCheckHeader = document.getElementById('sales-select-all-check');
  if (allCheckHeader) {
    allCheckHeader.checked = (allChecks.length === checkedCount);
  }
};

window.toggleAllSalesSelects = function(headerCheckbox) {
  const isChecked = headerCheckbox.checked;
  const rowCheckboxes = document.querySelectorAll('.sale-select-row-check');
  rowCheckboxes.forEach(cb => {
    cb.checked = isChecked;
  });
};

window.bulkCollectSales = async function() {
  const checkedBoxes = document.querySelectorAll('.sale-select-row-check:checked');
  if (checkedBoxes.length === 0) {
    alert('완납 처리할 거래 내역을 하나 이상 선택해주세요.');
    return;
  }
  
  if (!confirm(`선택한 ${checkedBoxes.length}건의 거래를 일괄 완납 처리하시겠습니까?`)) {
    return;
  }
  
  let updatedCount = 0;
  for (const box of checkedBoxes) {
    const saleId = box.dataset.saleId;
    const sale = state.sales.find(s => s.id === saleId);
    if (sale) {
      const total = sale.quantity * sale.price;
      const collected = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const uncollected = total - collected;
      
      if (uncollected > 0) {
        if (!sale.payments) sale.payments = [];
        sale.payments.push({
          id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          date: new Date().toISOString().split('T')[0],
          amount: uncollected
        });
        sale.isCollected = true;
        await pushSale(sale);
        updatedCount++;
      }
    }
  }
  
  if (updatedCount > 0) {
    saveState();
    renderAll();
    alert(`${updatedCount}건의 미수금이 완납 처리되었습니다.`);
  } else {
    alert('선택한 항목들이 이미 완납 상태이거나 처리할 항목이 없습니다.');
  }
  
  const allCheckHeader = document.getElementById('sales-select-all-check');
  if (allCheckHeader) allCheckHeader.checked = false;
};

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
            <input type="text" inputmode="numeric" class="att-worker-wage bg-black/40 border border-zandiBorder text-emerald-400 text-[11px] rounded p-1 w-20 text-right font-bold" value="${formatAmountInput(String(worker.baseDailyWage))}" placeholder="일당">
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

      const select = div.querySelector('.att-worker-type');
      const wageInput = div.querySelector('.att-worker-wage');
      
      // 일당 인풋 금액 포매터 연결
      attachAmountFormat(wageInput);

      // 드롭다운 변경 시 입력 칸의 기본값 자동 변경
      if (select && wageInput) {
        select.addEventListener('change', () => {
          const val = Number(select.value);
          if (val === 1.0) {
            wageInput.value = formatAmountInput(String(worker.baseDailyWage));
          } else if (val === 0.5) {
            // 기본값은 절반으로 제안하지만, 직접 수정 가능하도록 포커스+전체선택
            wageInput.value = formatAmountInput(String(Math.round(worker.baseDailyWage * 0.5)));
            wageInput.focus();
            wageInput.select(); // 전체 선택 → 바로 다른 금액 입력 가능
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
  const rentSearchField = document.getElementById('filter-rent-field')?.value || 'all';
  const selectedFilterYear = document.getElementById('filter-rent-year-select')?.value || String(yearCurr);
  const filterPaidVal = document.getElementById('filter-rent-paid-select')?.value || '';
  const currentVillage = rentFilters.village || '1';

  // 1) 동네 이름 로컬 캐싱 기반 UI 갱신
  const villageTitleEl = document.getElementById('current-rent-village-title');
  if (villageTitleEl) {
    villageTitleEl.textContent = rentVillageNames[currentVillage];
  }

  const tabs = document.querySelectorAll('.rent-village-tab');
  tabs.forEach(tab => {
    const v = tab.dataset.village;
    tab.textContent = rentVillageNames[v] || `${v}동네`;
    if (v === currentVillage) {
      tab.className = 'rent-village-tab px-4 py-2 text-xs font-bold rounded-lg border bg-zandiPrimary text-black border-zandiPrimary flex-shrink-0';
    } else {
      tab.className = 'rent-village-tab px-4 py-2 text-xs font-bold rounded-lg border bg-black/40 text-slate-400 border-zandiBorder/30 hover:text-white flex-shrink-0';
    }
  });

  // Filter rents (동네 & 검색어 & 지급여부)
  let filteredRents = state.rents.filter(rent => {
    // 동네 필터 (기존에 동네 구분이 없던 임대 항목은 '1'동네로 간주)
    const rentVillage = rent.village || '1';
    if (rentVillage !== currentVillage) return false;

    // 항목별 검색 필터
    if (rentSearch) {
      const fieldsToSearch = rentSearchField === 'all'
        ? ['ownerName', 'phone', 'address', 'bankAccount', 'notes']
        : [rentSearchField];
      const matched = fieldsToSearch.some(field => {
        const val = (rent[field] || '').toString().toLowerCase();
        return val.includes(rentSearch);
      });
      if (!matched) return false;
    }

    if (filterPaidVal !== '') {
      const isPaid = !!(rent.yearlyPayments && rent.yearlyPayments[selectedFilterYear]);
      const expected = filterPaidVal === 'true';
      if (isPaid !== expected) return false;
    }
    return true;
  });

  // Calculate Metrics based on the selected filter year AND active village
  const totalAmount = state.rents
    .filter(r => (r.village || '1') === currentVillage)
    .reduce((sum, r) => sum + Number(r.amount), 0);
    
  const paidAmount = state.rents
    .filter(r => (r.village || '1') === currentVillage && r.yearlyPayments && r.yearlyPayments[selectedFilterYear])
    .reduce((sum, r) => sum + Number(r.amount), 0);
    
  const unpaidAmount = totalAmount - paidAmount;

  document.getElementById('rent-total-amount').textContent = totalAmount.toLocaleString() + '원';
  document.getElementById('rent-paid-amount').textContent = paidAmount.toLocaleString() + '원';
  document.getElementById('rent-unpaid-amount').textContent = unpaidAmount.toLocaleString() + '원';

  // Render Table
  rentList.innerHTML = '';
  if (filteredRents.length === 0) {
    rentList.innerHTML = '<tr><td colspan="12" class="p-6 text-center text-gray-500 text-xs">선택한 동네에 등록된 토지 임대 내역이 없습니다.</td></tr>';
  } else {
    filteredRents.forEach(rent => {
      const payPrev = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearPrev)]);
      const payCurr = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearCurr)]);
      const payNext = !!(rent.yearlyPayments && rent.yearlyPayments[String(yearNext)]);

      const tr = document.createElement('tr');
      tr.id = `rent-row-${rent.id}`;
      tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20 text-xs';
      tr.innerHTML = `
        <td class="p-3 text-center no-print w-12">
          <label class="custom-checkbox inline-block">
            <input type="checkbox" class="rent-print-row-check" checked data-rent-id="${rent.id}" onchange="toggleRentPrintRow(this)">
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="p-3 text-white font-medium pl-2">${rent.ownerName || '-'}</td>
        <td class="p-3 text-gray-300">${rent.phone || '-'}</td>
        <td class="p-3 text-gray-300 max-w-[150px] truncate" title="${rent.address || ''}">${rent.address || '-'}</td>
        <td class="p-3 text-center text-gray-300">${rent.area ? rent.area + '평' : '-'}</td>
        <td class="p-3 text-right text-emerald-400 font-bold">${Number(rent.amount).toLocaleString()}원</td>
        <td class="p-3 text-gray-300 max-w-[120px] truncate" title="${rent.bankAccount || ''}">${rent.bankAccount || '-'}</td>
        <td class="p-3 text-center print-hide">
          <label class="custom-checkbox inline-block">
            <input type="checkbox" ${payPrev ? 'checked' : ''} onchange="toggleRentYear('${rent.id}', '${yearPrev}')">
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="p-3 text-center print-hide">
          <label class="custom-checkbox inline-block">
            <input type="checkbox" ${payCurr ? 'checked' : ''} onchange="toggleRentYear('${rent.id}', '${yearCurr}')">
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="p-3 text-center print-hide">
          <label class="custom-checkbox inline-block">
            <input type="checkbox" ${payNext ? 'checked' : ''} onchange="toggleRentYear('${rent.id}', '${yearNext}')">
            <span class="checkmark"></span>
          </label>
        </td>
        <td class="p-3 text-gray-400 print-hide">${rent.paymentDate || '-'}</td>
        <td class="p-3 text-gray-400 max-w-[120px] truncate print-hide" title="${rent.notes || ''}">${rent.notes || '-'}</td>
        <td class="p-3 text-center no-print">
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
async function addRent(ownerName, phone, address, area, amount, bankAccount, yearlyPayments, paymentDate, notes) {
  const id = 'rent-' + Date.now();
  const currentVillage = rentFilters.village || '1';
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
    notes,
    village: currentVillage
  };
  state.rents.push(newRent);
  saveState();
  renderAll();
  try {
    await pushRent(newRent);
    if (supabaseClient) {
      showToast('임대료 계약이 저장되었습니다.', 'success');
    }
  } catch (e) {
    console.error('[addRent] Supabase 저장 실패, 로컬 데이터는 유지됩니다:', e);
  }
}


window.toggleRentPrintRow = function(checkbox) {
  const rentId = checkbox.dataset.rentId;
  const row = document.getElementById(`rent-row-${rentId}`);
  if (row) {
    if (checkbox.checked) {
      row.classList.remove('print-exclude');
    } else {
      row.classList.add('print-exclude');
    }
  }
  
  // 전체 선택 체크박스 상태 업데이트
  const allChecks = document.querySelectorAll('.rent-print-row-check');
  const checkedCount = document.querySelectorAll('.rent-print-row-check:checked').length;
  const allCheckHeader = document.getElementById('rent-print-all-check');
  if (allCheckHeader) {
    allCheckHeader.checked = (allChecks.length === checkedCount);
  }
};

window.toggleAllRentPrintChecks = function(headerCheckbox) {
  const isChecked = headerCheckbox.checked;
  const rowCheckboxes = document.querySelectorAll('.rent-print-row-check');
  rowCheckboxes.forEach(cb => {
    cb.checked = isChecked;
    const rentId = cb.dataset.rentId;
    const row = document.getElementById(`rent-row-${rentId}`);
    if (row) {
      if (isChecked) {
        row.classList.remove('print-exclude');
      } else {
        row.classList.add('print-exclude');
      }
    }
  });
};

window.deleteRent = async function(id) {
  if (confirm('이 임대 계약 내역을 삭제하시겠습니까?')) {
    const originalRents = [...state.rents];
    state.rents = state.rents.filter(r => r.id !== id);
    saveState();
    renderAll();
    
    try {
      await removeRentSupabase(id);
      showToast('임대 내역이 성공적으로 삭제되었습니다.');
    } catch (e) {
      showToast('서버 저장 실패: 삭제 처리를 롤백합니다.');
      state.rents = originalRents;
      saveState();
      renderAll();
    }
  }
};

window.toggleRentYear = async function(id, year) {
  const rent = state.rents.find(r => r.id === id);
  if (rent) {
    if (!rent.yearlyPayments) rent.yearlyPayments = {};
    rent.yearlyPayments[year] = !rent.yearlyPayments[year];
    if (rent.yearlyPayments[year]) {
      rent.paymentDate = new Date().toISOString().split('T')[0];
    }
    saveState();
    renderAll();
    try {
      await pushRent(rent);
    } catch (e) {
      console.error('[toggleRentYear] Supabase 저장 실패:', e);
    }
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
  // 금액: 콤마 포맷으로 표시
  document.getElementById('edit-rent-amount').value = rent.amount ? Number(rent.amount).toLocaleString('ko-KR') : '';
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

// 토스트 알림 유틸리티 함수
function showToast(message, type = 'info') {
  const existing = document.getElementById('zandi-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'zandi-toast';
  const bgColor = type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#374151';
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    padding: 12px 18px;
    border-radius: 12px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    background: ${bgColor};
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    opacity: 0;
    transform: translateY(8px);
    transition: all 0.3s ease;
    max-width: 320px;
    word-break: break-word;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// 5. Actions & Mutation Event Listeners

// 5.1. Customer Actions
function addCustomer(name, phone, prices, initialDebt) {
  const id = 'cust-' + Date.now();
  const maxOrder = state.customers.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0);
  const newCust = { id, name, phone, prices, initialDebt: Number(initialDebt) || 0, sortOrder: maxOrder + 1 };
  state.customers.push(newCust);
  saveState();
  pushCustomers(newCust);
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

  // 금액 포매터 장착
  attachAmountFormat(priceInput);

  typeSelect.addEventListener('change', () => {
    const custId = document.getElementById('sale-customer').value;
    const customer = state.customers.find(c => c.id === custId);
    if (customer && customer.prices) {
      priceInput.value = formatAmountInput(String(customer.prices[typeSelect.value] || 0));
    } else {
      priceInput.value = '0';
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
    priceInput.value = formatAmountInput(String(customer.prices[typeSelect.value] || 0));
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
  
  // 수금액(받은 돈) 인풋 자동 기입 제거 (기본 미수금 0원 설정을 위함)
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
    const initialDebt = Number(document.getElementById('cust-initial-debt').value.replace(/,/g, '')) || 0;
    
    const prices = {
      '1818': Number(document.getElementById('cust-price-1818').value.replace(/,/g, '')) || 0,
      '1818t': Number(document.getElementById('cust-price-1818t').value.replace(/,/g, '')) || 0,
      '3030': Number(document.getElementById('cust-price-3030').value.replace(/,/g, '')) || 0,
      '3030t': Number(document.getElementById('cust-price-3030t').value.replace(/,/g, '')) || 0,
      '4060': Number(document.getElementById('cust-price-4060').value.replace(/,/g, '')) || 0,
      'pyeong': Number(document.getElementById('cust-price-pyeong').value.replace(/,/g, '')) || 0,
      'extra': Number(document.getElementById('cust-price-extra').value.replace(/,/g, '')) || 0
    };

    if (!name) return;
    addCustomer(name, phone, prices, initialDebt);
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
        priceInput.value = formatAmountInput(String(customer.prices[typeSelect.value] || 0));
      } else {
        priceInput.value = '0';
      }
    });
    calculateTotals();
  });

  // 3) 완납 적용 버튼
  document.getElementById('btn-fill-full-payment').addEventListener('click', () => {
    const totalStr = document.getElementById('sale-items-total').textContent;
    const total = Number(totalStr.replace(/[^0-9]/g, '')) || 0;
    document.getElementById('sale-collected-amount').value = formatAmountInput(String(total));
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
    let remainingCollected = Number(document.getElementById('sale-collected-amount').value.replace(/,/g, '')) || 0;

    // 각 품목별로 루프 돌려 등록
    for (const row of rows) {
      const productType = row.querySelector('.item-product-type').value;
      const quantity = Number(row.querySelector('.item-qty').value);
      const price = Number(row.querySelector('.item-price').value.replace(/,/g, '')) || 0;

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

    const prevCustomerId = document.getElementById('sale-customer').value;
    saveState();
    renderAll();
    
    document.getElementById('sale-form').reset();
    document.getElementById('sale-items-container').innerHTML = '';
    
    // 이전 거래처 선택 유지
    document.getElementById('sale-customer').value = prevCustomerId;
    
    addSaleItemRow(); // 기본 한줄 추가
    document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('sale-collected-amount').value = '0';
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
        const enteredWage = wageInput ? Number(wageInput.value.replace(/,/g, '')) : worker.baseDailyWage;
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

  const closeDebtModalBtn = document.getElementById('close-debt-modal-btn');
  if (closeDebtModalBtn) {
    closeDebtModalBtn.addEventListener('click', () => {
      document.getElementById('debt-collect-modal').classList.add('hidden');
    });
  }

  const closeMonthlyDebtModalBtn = document.getElementById('close-monthly-debt-modal-btn');
  if (closeMonthlyDebtModalBtn) {
    closeMonthlyDebtModalBtn.addEventListener('click', () => {
      document.getElementById('customer-monthly-debt-modal').classList.add('hidden');
    });
  }

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
    const amount = Number(document.getElementById('modal-pay-amount').value.replace(/,/g, ''));

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

  const debtPaymentForm = document.getElementById('debt-payment-form');
  if (debtPaymentForm) {
    debtPaymentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const customerId = document.getElementById('debt-modal-cust-id').value;
      const date = document.getElementById('debt-pay-date').value;
      const amount = Number(document.getElementById('debt-pay-amount').value.replace(/,/g, ''));
      
      if (!customerId || !date || amount <= 0) return;
      
      await collectDebtFromOlderSales(customerId, date, amount);
      document.getElementById('debt-collect-modal').classList.add('hidden');
    });
  }

  // 11.5) Land Rent Register Form & Filters
  const rentForm = document.getElementById('rent-form');
  const rentRegisterModal = document.getElementById('rent-register-modal');
  if (rentForm) {
    rentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ownerName = document.getElementById('rent-owner-name').value.trim();
      const phone = document.getElementById('rent-phone').value.trim();
      const address = document.getElementById('rent-address').value.trim();
      const area = document.getElementById('rent-area').value;
      const amount = document.getElementById('rent-amount').value.replace(/[^0-9]/g, ''); // 콤마 제거 후 숫자만
      const bankAccount = document.getElementById('rent-bank-account').value.trim();
      
      const yearlyPayments = {};
      document.querySelectorAll('.rent-register-year').forEach(cb => {
        if (cb.checked) {
          yearlyPayments[cb.value] = true;
        }
      });
      
      const paymentDate = document.getElementById('rent-pay-date').value;
      const notes = document.getElementById('rent-notes').value.trim();

      await addRent(ownerName, phone, address, area, amount, bankAccount, yearlyPayments, paymentDate, notes);
      
      rentForm.reset();
      document.getElementById('rent-pay-date').value = '';
      
      // 등록 완료 후 모달 닫기
      if (rentRegisterModal) {
        rentRegisterModal.classList.add('hidden');
      }
    });
  }

  // ============================================================
  //  📱 전화번호 자동 하이픈 & 금액 콤마 포맷 이벤트 리스너
  // ============================================================

  /**
   * 전화번호 자동 하이픈 포맷
   * 010 → 010-0000-0000 (11자리 핸드폰)
   * 0X  → 0X-000-0000  (지역번호 10자리)
   */
  function formatPhoneNumber(value) {
    const digits = value.replace(/\D/g, ''); // 숫자만 추출
    if (digits.length <= 3) return digits;
    const isMobile = digits.startsWith('010') || digits.startsWith('011') || digits.startsWith('016') || digits.startsWith('017') || digits.startsWith('018') || digits.startsWith('019');
    if (isMobile) {
      // 010-XXXX-XXXX 형식 (최대 11자리)
      const d = digits.slice(0, 11);
      if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
      return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
    } else {
      // 지역번호: 앞자리가 2자리(02) 또는 3자리(055 등)
      const prefix = digits.startsWith('02') ? 2 : 3;
      const d = digits.slice(0, 10 + (prefix === 2 ? 1 : 0));
      if (d.length <= prefix + 3) return d.slice(0, prefix) + '-' + d.slice(prefix);
      if (d.length <= prefix + 7) return d.slice(0, prefix) + '-' + d.slice(prefix, prefix + 4) + '-' + d.slice(prefix + 4);
      return d.slice(0, prefix) + '-' + d.slice(prefix, prefix + 4) + '-' + d.slice(prefix + 4);
    }
  }

  /**
   * 금액 콤마 포맷 (입력 중 1,000 단위 콤마 표시)
   */
  function formatAmountInput(value) {
    const digits = value.replace(/[^0-9]/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('ko-KR');
  }

  // 전화번호 필드에 자동 하이픈 이벤트 연결
  function attachPhoneFormat(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      e.target.value = formatted;
    });
  }

  // 금액 필드에 콤마 포맷 및 포커스 시 선택/지우기 이벤트 연결
  function attachAmountFormat(inputIdOrElement) {
    const el = typeof inputIdOrElement === 'string' ? document.getElementById(inputIdOrElement) : inputIdOrElement;
    if (!el) return;
    
    el.type = 'text';
    el.inputMode = 'numeric';

    el.addEventListener('focus', (e) => {
      const rawVal = e.target.value.replace(/[^0-9]/g, '');
      if (rawVal === '0' || rawVal === '') {
        e.target.value = '';
      } else {
        e.target.select();
      }
    });

    el.addEventListener('blur', (e) => {
      const rawVal = e.target.value.replace(/[^0-9]/g, '');
      if (rawVal === '') {
        e.target.value = '0';
      }
    });

    el.addEventListener('input', (e) => {
      const formatted = formatAmountInput(e.target.value);
      const originalSelectionStart = e.target.selectionStart;
      const originalLength = e.target.value.length;
      
      e.target.value = formatted;
      
      const newLength = formatted.length;
      const diff = newLength - originalLength;
      e.target.setSelectionRange(originalSelectionStart + diff, originalSelectionStart + diff);
    });
  }

  // 등록 폼
  attachPhoneFormat('rent-phone');
  attachAmountFormat('rent-amount');
  attachAmountFormat('cust-initial-debt');
  attachAmountFormat('cust-price-1818');
  attachAmountFormat('cust-price-1818t');
  attachAmountFormat('cust-price-3030');
  attachAmountFormat('cust-price-3030t');
  attachAmountFormat('cust-price-4060');
  attachAmountFormat('cust-price-pyeong');
  attachAmountFormat('cust-price-extra');
  attachAmountFormat('sale-collected-amount');
  attachAmountFormat('worker-wage');
  attachAmountFormat('modal-pay-amount');
  attachAmountFormat('debt-pay-amount');

  // 수정 폼 (수정 모달이 열릴 때 자동으로 이벤트가 걸려있도록)
  attachPhoneFormat('edit-rent-phone');
  attachAmountFormat('edit-rent-amount');
  attachAmountFormat('edit-cust-initial-debt');
  attachAmountFormat('edit-cust-price-1818');
  attachAmountFormat('edit-cust-price-1818t');
  attachAmountFormat('edit-cust-price-3030');
  attachAmountFormat('edit-cust-price-3030t');
  attachAmountFormat('edit-cust-price-4060');
  attachAmountFormat('edit-cust-price-pyeong');
  attachAmountFormat('edit-cust-price-extra');
  attachAmountFormat('edit-sale-price');

  const rentSearchInput = document.getElementById('filter-rent-search');
  if (rentSearchInput) {
    rentSearchInput.addEventListener('input', () => {
      renderRent();
    });
  }

  // 항목별 검색 필드 드롭다운 변경 시 재렌더
  const rentFieldSelect = document.getElementById('filter-rent-field');
  if (rentFieldSelect) {
    rentFieldSelect.addEventListener('change', () => {
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

  // 1) 동네 탭 전환 클릭 처리
  const rentTabsContainer = document.getElementById('rent-neighborhood-tabs');
  if (rentTabsContainer) {
    rentTabsContainer.addEventListener('click', (e) => {
      const tab = e.target.closest('.rent-village-tab');
      if (tab) {
        rentFilters.village = tab.dataset.village;
        renderRent();
      }
    });
  }

  // 2) 동네 이름 수정 팝업 리스너
  const renameVillageBtn = document.getElementById('btn-rename-village');
  if (renameVillageBtn) {
    renameVillageBtn.addEventListener('click', async () => {
      const currentVillage = rentFilters.village || '1';
      const oldName = rentVillageNames[currentVillage];
      const newName = prompt(`선택한 ${currentVillage}동네의 이름을 입력해 주세요:`, oldName);
      if (newName !== null && newName.trim() !== '') {
        const tempName = newName.trim();
        const originalName = oldName;
        
        // 로컬 즉시 반영
        rentVillageNames[currentVillage] = tempName;
        localStorage.setItem(`rent_village_name_${currentVillage}`, tempName);
        renderRent();
        
        try {
          await pushSetting(`rent_village_name_${currentVillage}`, tempName);
        } catch (e) {
          showToast('동네 이름 저장 실패: 서버에 반영되지 않았습니다. 롤백합니다.');
          rentVillageNames[currentVillage] = originalName;
          localStorage.setItem(`rent_village_name_${currentVillage}`, originalName);
          renderRent();
        }
      }
    });
  }

  // 3) 토지 임대료 계약 등록 팝업 열기 / 닫기
  const openRentRegisterBtn = document.getElementById('btn-open-rent-register');
  const closeRentRegisterModalBtn = document.getElementById('close-rent-register-modal-btn');

  if (openRentRegisterBtn && rentRegisterModal) {
    openRentRegisterBtn.addEventListener('click', () => {
      rentRegisterModal.classList.remove('hidden');
    });
  }

  if (closeRentRegisterModalBtn && rentRegisterModal) {
    closeRentRegisterModalBtn.addEventListener('click', () => {
      rentRegisterModal.classList.add('hidden');
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
      rent.amount = Number(document.getElementById('edit-rent-amount').value.replace(/[^0-9]/g, '')) || 0; // 콤마 제거
      rent.bankAccount = document.getElementById('edit-rent-bank-account').value.trim();
      
      if (!rent.yearlyPayments) rent.yearlyPayments = {};
      rent.yearlyPayments[String(yearPrev)] = document.getElementById('edit-rent-year-prev').checked;
      rent.yearlyPayments[String(yearCurr)] = document.getElementById('edit-rent-year-curr').checked;
      rent.yearlyPayments[String(yearNext)] = document.getElementById('edit-rent-year-next').checked;
      
      rent.paymentDate = document.getElementById('edit-rent-pay-date').value;
      rent.notes = document.getElementById('edit-rent-notes').value.trim();
      
      saveState();
      renderAll();
      document.getElementById('rent-edit-modal').classList.add('hidden');
      
      try {
        await pushRent(rent);
        if (supabaseClient) {
          showToast('임대료 정보가 수정되었습니다.', 'success');
        }
      } catch (e) {
        console.error('[editRentForm] Supabase 수정 실패, 로컬 데이터는 유지됩니다:', e);
      }
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
      customer.initialDebt = Number(document.getElementById('edit-cust-initial-debt').value.replace(/,/g, '')) || 0;
      customer.prices = {
        '1818': Number(document.getElementById('edit-cust-price-1818').value.replace(/,/g, '')) || 0,
        '1818t': Number(document.getElementById('edit-cust-price-1818t').value.replace(/,/g, '')) || 0,
        '3030': Number(document.getElementById('edit-cust-price-3030').value.replace(/,/g, '')) || 0,
        '3030t': Number(document.getElementById('edit-cust-price-3030t').value.replace(/,/g, '')) || 0,
        '4060': Number(document.getElementById('edit-cust-price-4060').value.replace(/,/g, '')) || 0,
        'pyeong': Number(document.getElementById('edit-cust-price-pyeong').value.replace(/,/g, '')) || 0,
        'extra': Number(document.getElementById('edit-cust-price-extra').value.replace(/,/g, '')) || 0
      };

      saveState();
      await pushCustomers(customer);
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
      sale.price = Number(document.getElementById('edit-sale-price').value.replace(/,/g, '')) || 0;
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
  document.getElementById('edit-cust-initial-debt').value = formatAmountInput(String(customer.initialDebt || 0));

  const prices = customer.prices || {};
  document.getElementById('edit-cust-price-1818').value = formatAmountInput(String(prices['1818'] || 0));
  document.getElementById('edit-cust-price-1818t').value = formatAmountInput(String(prices['1818t'] || 0));
  document.getElementById('edit-cust-price-3030').value = formatAmountInput(String(prices['3030'] || 0));
  document.getElementById('edit-cust-price-3030t').value = formatAmountInput(String(prices['3030t'] || 0));
  document.getElementById('edit-cust-price-4060').value = formatAmountInput(String(prices['4060'] || 0));
  document.getElementById('edit-cust-price-pyeong').value = formatAmountInput(String(prices['pyeong'] || 0));
  document.getElementById('edit-cust-price-extra').value = formatAmountInput(String(prices['extra'] || 0));

  document.getElementById('customer-edit-modal').classList.remove('hidden');
};

// Sale Edit Modal Actions
window.openSaleEditModal = function(id) {
  const sale = state.sales.find(s => s.id === id);
  if (!sale) return;

  const editSaleCustomerSelect = document.getElementById('edit-sale-customer');
  editSaleCustomerSelect.innerHTML = '';
  const sortedForEdit = [...state.customers].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  sortedForEdit.forEach(c => {
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
  document.getElementById('edit-sale-price').value = formatAmountInput(String(sale.price || 0));
  document.getElementById('edit-sale-notes').value = sale.notes || '';

  document.getElementById('sale-edit-modal').classList.remove('hidden');
};

// 4.5.1. 가로 인쇄 기능 구현
window.printRentLandscape = function() {
  const currentVillage = rentFilters.village || '1';
  const villageName = rentVillageNames[currentVillage];
  
  // 1) 인쇄 타이틀 동적으로 세팅
  const printTitle = document.getElementById('print-document-title');
  if (printTitle) {
    printTitle.textContent = `${villageName} 토지 임대료 관리 장부`;
  }
  
  const printDate = document.getElementById('print-date-info');
  if (printDate) {
    const today = new Date();
    printDate.textContent = `출력 일시: ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  }

  // 2) 브라우저 기본 인쇄 실행 (css의 @media print에서 가로 세팅 자동 적용)
  window.print();
};

// 4.5.2. 이월 미수금 일괄 입금/수금 관련 액션
window.openDebtCollectModal = function(customerId, customerName, uncollectedAmount) {
  document.getElementById('debt-modal-cust-id').value = customerId;
  document.getElementById('debt-modal-cust-name').textContent = customerName;
  document.getElementById('debt-modal-uncollected-amount').textContent = uncollectedAmount.toLocaleString() + '원';
  
  document.getElementById('debt-pay-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('debt-pay-amount').value = '';
  document.getElementById('debt-pay-amount').max = uncollectedAmount;
  
  document.getElementById('debt-collect-modal').classList.remove('hidden');
};

window.collectDebtFromOlderSales = async function(customerId, payDate, payAmount) {
  let remaining = payAmount;
  let updatedCount = 0;

  // 0) 기초 미수금(이전 미수 잔액) 우선 차감
  const customer = state.customers.find(c => c.id === customerId);
  if (customer) {
    const initialDebtVal = customer.initialDebt || 0;
    const initialCollectedVal = customer.initialDebtCollected || 0;
    const initialUncollected = Math.max(0, initialDebtVal - initialCollectedVal);
    
    if (initialUncollected > 0) {
      const applyAmount = Math.min(remaining, initialUncollected);
      customer.initialDebtCollected = initialCollectedVal + applyAmount;
      remaining -= applyAmount;
      await pushCustomers(customer);
      updatedCount++;
    }
  }

  // 1) 해당 거래처의 모든 판매 건 필터링
  const clientSales = state.sales.filter(s => s.customerId === customerId);
  
  // 2) 미납이 남아 있는 거래들만 추출
  const unpaidSales = clientSales.map(sale => {
    const total = sale.quantity * sale.price;
    const collected = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const uncollected = total - collected;
    return { sale, total, collected, uncollected };
  }).filter(item => item.uncollected > 0);
  
  // 3) 판매 일자 기준 오름차순(오래된 날짜 우선)으로 정렬
  unpaidSales.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));
  
  for (const item of unpaidSales) {
    if (remaining <= 0) break;
    
    const applyAmount = Math.min(remaining, item.uncollected);
    if (applyAmount > 0) {
      const sale = item.sale;
      if (!sale.payments) sale.payments = [];
      
      sale.payments.push({
        id: 'pay-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        date: payDate,
        amount: applyAmount
      });
      
      const newCollected = item.collected + applyAmount;
      sale.isCollected = (item.total - newCollected) <= 0;
      
      remaining -= applyAmount;
      await pushSale(sale);
      updatedCount++;
    }
  }
  
  if (updatedCount > 0) {
    saveState();
    renderAll();
    alert(`이월 미수금 중 총 ${payAmount.toLocaleString()}원이 성공적으로 입금 반영되었습니다.`);
  } else {
    alert('반영할 미수금 내역이 없습니다.');
  }
};

// 4.5.3. 거래처 월별 누적 미수금 모달 및 장부 연동
window.openMonthlyDebtModal = function(customerId, customerName, totalUncollected) {
  const customer = state.customers.find(c => c.id === customerId);
  if (!customer) return;

  document.getElementById('monthly-debt-modal-cust-name').textContent = customerName;
  document.getElementById('monthly-debt-modal-total-uncollected').textContent = totalUncollected.toLocaleString() + '원';

  const listContainer = document.getElementById('monthly-debt-modal-list');
  listContainer.innerHTML = '';

  // 1) 기초 미수금(이전 이월) 렌더링
  const initialDebtVal = customer.initialDebt || 0;
  const initialCollectedVal = customer.initialDebtCollected || 0;
  const initialUncollected = Math.max(0, initialDebtVal - initialCollectedVal);
  
  if (initialUncollected > 0) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-emerald-950/20 cursor-pointer';
    tr.innerHTML = `
      <td class="py-2 pl-1 font-semibold text-slate-300">이전 이월 (기초 미수)</td>
      <td class="py-2 text-right text-gray-400">${initialDebtVal.toLocaleString()}원</td>
      <td class="py-2 text-right text-rose-400 font-bold">${initialUncollected.toLocaleString()}원</td>
    `;
    tr.onclick = () => goSalesTabWithFilter(customerId, '');
    listContainer.appendChild(tr);
  }

  // 2) 월별 거래 미수금 계산 및 정렬
  const clientSales = state.sales.filter(s => s.customerId === customerId);
  const monthlyData = {};

  clientSales.forEach(sale => {
    const month = sale.saleDate.substring(0, 7); // "YYYY-MM"
    const total = sale.quantity * sale.price;
    const collected = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const uncollected = total - collected;

    if (!monthlyData[month]) {
      monthlyData[month] = { totalSales: 0, totalUncollected: 0 };
    }
    monthlyData[month].totalSales += total;
    monthlyData[month].totalUncollected += uncollected;
  });

  // 월별 오름차순 정렬하여 렌더링
  const sortedMonths = Object.keys(monthlyData).sort();
  let hasActiveMonthDebt = false;

  sortedMonths.forEach(month => {
    const data = monthlyData[month];
    if (data.totalUncollected > 0) {
      hasActiveMonthDebt = true;
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-emerald-950/20 cursor-pointer';
      tr.innerHTML = `
        <td class="py-2 pl-1 text-emerald-400 underline font-semibold">${month}</td>
        <td class="py-2 text-right text-gray-400">${data.totalSales.toLocaleString()}원</td>
        <td class="py-2 text-right text-rose-400 font-bold">${data.totalUncollected.toLocaleString()}원</td>
      `;
      tr.onclick = () => goSalesTabWithFilter(customerId, month);
      listContainer.appendChild(tr);
    }
  });

  if (initialUncollected <= 0 && !hasActiveMonthDebt) {
    listContainer.innerHTML = '<tr><td colspan="3" class="text-center text-gray-500 py-4">남은 미수금이 없습니다. 깔끔합니다!</td></tr>';
  }

  if (window.lucide) window.lucide.createIcons();
  document.getElementById('customer-monthly-debt-modal').classList.remove('hidden');
};

window.goSalesTabWithFilter = function(customerId, yearMonth) {
  // 1) 판매 대장 탭(sales) 클릭 트리거
  const salesTab = document.querySelector('.nav-tab[data-section="sales"]');
  if (salesTab) salesTab.click();

  // 2) 필터 컴포넌트 세팅
  const customerDropdown = document.getElementById('filter-sale-customer');
  if (customerDropdown) {
    customerDropdown.value = customerId;
    customerDropdown.dispatchEvent(new Event('change'));
  }

  const startDateInput = document.getElementById('filter-sale-start-date');
  const endDateInput = document.getElementById('filter-sale-end-date');

  if (yearMonth) {
    const [year, month] = yearMonth.split('-');
    const firstDay = `${yearMonth}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const lastDayStr = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;

    if (startDateInput) startDateInput.value = firstDay;
    if (endDateInput) endDateInput.value = lastDayStr;
  } else {
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
  }

  // 3) 필터 상태값 갱신
  if (startDateInput) filters.startDate = startDateInput.value;
  if (endDateInput) filters.endDate = endDateInput.value;
  if (customerDropdown) filters.customerId = customerId;

  // 4) 렌더링 갱신
  renderSales();

  // 5) 모달 닫기
  document.getElementById('customer-monthly-debt-modal').classList.add('hidden');
};

window.reorderCustomers = async function(draggedId, targetId) {
  const sorted = [...state.customers].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const draggedIndex = sorted.findIndex(c => c.id === draggedId);
  const targetIndex = sorted.findIndex(c => c.id === targetId);
  
  if (draggedIndex === -1 || targetIndex === -1) return;
  
  const [draggedItem] = sorted.splice(draggedIndex, 1);
  sorted.splice(targetIndex, 0, draggedItem);
  
  sorted.forEach((c, i) => {
    c.sortOrder = i + 1;
    const realCustomer = state.customers.find(item => item.id === c.id);
    if (realCustomer) {
      realCustomer.sortOrder = i + 1;
    }
  });
  
  saveState();
  renderCustomers(); // 화면에 즉시 임시 반영 (저장 버튼 클릭 시 서버 동기화)
};

window.toggleAllCustSelects = function(master) {
  const checkboxes = document.querySelectorAll('.cust-select-check');
  checkboxes.forEach(cb => {
    cb.checked = master.checked;
  });
};

window.bulkMoveCustomersToTop = function() {
  const checkedBoxes = document.querySelectorAll('.cust-select-check:checked');
  if (checkedBoxes.length === 0) {
    showToast('이동할 거래처를 먼저 선택해 주세요.', 'info');
    return;
  }

  const selectedIds = new Set(Array.from(checkedBoxes).map(cb => cb.value));
  const sorted = [...state.customers].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  
  const selectedOnes = sorted.filter(c => selectedIds.has(c.id));
  const remainingOnes = sorted.filter(c => !selectedIds.has(c.id));
  
  const newOrder = [...selectedOnes, ...remainingOnes];
  
  newOrder.forEach((c, i) => {
    c.sortOrder = i + 1;
    const realCustomer = state.customers.find(item => item.id === c.id);
    if (realCustomer) {
      realCustomer.sortOrder = i + 1;
    }
  });

  saveState();
  renderCustomers();
  
  const masterCheck = document.getElementById('cust-select-all-check');
  if (masterCheck) masterCheck.checked = false;
  
  showToast('선택한 거래처를 맨 위로 올렸습니다. [거래처 순서 저장]을 누르셔야 서버에 최종 영구 반영됩니다.', 'info');
};

window.saveCustomerOrdering = async function() {
  if (!supabaseClient) {
    showToast('로컬 모드: 순서가 로컬에 임시 보존되었습니다.', 'success');
    return;
  }

  const saveBtn = document.querySelector('button[onclick="saveCustomerOrdering()"]');
  const originalHtml = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '저장 중... <i class="w-3 h-3 animate-spin inline-block ml-1"></i>';
  }

  try {
    // 최종 상태 전체를 서버에 단 한번만 일괄 전송 (경쟁 상태 완벽 해결)
    await pushCustomers(state.customers);
    saveState();
    showToast('거래처 정렬 순서가 서버에 안전하게 영구 저장되었습니다.', 'success');
  } catch (err) {
    console.error("[saveCustomerOrdering] Supabase sync failed:", err);
    showToast('서버 저장 실패: 네트워크 연결 상태를 확인해 주세요.', 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHtml;
    }
    renderAll();
  }
};

window.bulkPayAttendance = async function() {
  // 현재 설정된 필터 조건에 해당하고, 아직 지급되지 않은 출근 내역 추출
  let targetEntries = state.attendance.filter(att => {
    if (att.isPaid) return false;
    if (attFilters.workerId && att.workerId !== attFilters.workerId) return false;
    if (attFilters.workType && att.workType !== Number(attFilters.workType)) return false;
    if (attFilters.startDate && att.workDate < attFilters.startDate) return false;
    if (attFilters.endDate && att.workDate > attFilters.endDate) return false;
    return true;
  });

  if (targetEntries.length === 0) {
    showToast('선택한 조건에 해당하는 미지급 내역이 없습니다.', 'info');
    return;
  }

  const confirmMsg = `필터링된 미지급 내역 ${targetEntries.length}건을 일괄 지급 완료 처리하시겠습니까?`;
  if (!confirm(confirmMsg)) return;

  // 일괄 업데이트 및 Supabase 동기화
  for (const att of targetEntries) {
    att.isPaid = true;
    try {
      await pushAttendance(att);
    } catch (err) {
      console.error("[bulkPayAttendance] Supabase sync failed:", err);
    }
  }

  saveState();
  renderAll();
  showToast(`총 ${targetEntries.length}건의 인건비가 일괄 지급 완료 처리되었습니다.`, 'success');
};





