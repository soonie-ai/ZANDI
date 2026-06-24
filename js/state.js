// ZANDI 장부 시스템 - State & Constants (js/state.js)

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

const INITIAL_EXPENSES = [
  { id: 'exp-1', expenseDate: '2026-06-12', usage: '농협 복합비료 10포대', amount: 150000, notes: '평리 밭 비료 살포용' },
  { id: 'exp-2', expenseDate: '2026-06-14', usage: '송정농약사 제초제', amount: 85000, notes: '송정리 밭 잡초 제거' }
];

// App Data State
let state = {
  customers: [],
  sales: [],
  workers: [],
  attendance: [],
  rents: [],
  expenses: [],
  recent_activities: [],
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
  endDate: '',
  isPaid: ''
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
    if (!state.expenses) {
      state.expenses = INITIAL_EXPENSES;
    }
    if (!state.recent_activities) {
      state.recent_activities = [];
    }
    if (state.customers) {
      const localSortOrder = localStorage.getItem('customer_sort_order');
      if (localSortOrder) {
        const orderArray = localSortOrder.split(',');
        state.customers.sort((a, b) => {
          const idxA = orderArray.indexOf(a.id);
          const idxB = orderArray.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return (a.sortOrder || 0) - (b.sortOrder || 0);
        });
      } else {
        state.customers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      }
    }
  } else {
    state.customers = INITIAL_CUSTOMERS;
    state.sales = INITIAL_SALES;
    state.workers = INITIAL_WORKERS;
    state.attendance = INITIAL_ATTENDANCE;
    state.rents = INITIAL_RENTS;
    state.expenses = INITIAL_EXPENSES;
    state.recent_activities = [];
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
    rents: state.rents,
    expenses: state.expenses,
    recent_activities: state.recent_activities
  }));
}
