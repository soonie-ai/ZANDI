// ZANDI 장부 시스템 - Supabase Database Synchronization (js/db.js)

// =========================================================================
// [필독] 사장님 부부 Supabase 연동 정보 설정 구역
// 이 상수에 본인의 Supabase URL과 Key를 직접 입력하시면 연동이 영구적으로 고정됩니다.
// (비어있거나 플레이스홀더일 경우 기존 로컬스토리지 저장 정보로 폴백)
// =========================================================================
const SUPABASE_URL = "https://xlreatabvuezxatuslgf.supabase.co";
const SUPABASE_KEY = "sb_publishable_N8T-SPxMLfayG9b0e2SpmA_TKejBJTi";

// Supabase Global Client
let supabaseClient = null;
let realtimeChannel = null;

// Supabase Cloud Sync Operations
async function initSupabase() {
  // 1) 상수가 채워져 있다면 상수를 우선 사용하고, 비어있다면 로컬 스토리지에서 폴백
  const isHardcodedUrl = SUPABASE_URL && SUPABASE_URL !== "https://your-project.supabase.co";
  const isHardcodedKey = SUPABASE_KEY && SUPABASE_KEY !== "your-anon-key";

  const url = isHardcodedUrl ? SUPABASE_URL : localStorage.getItem('zandi_supabase_url');
  const key = isHardcodedKey ? SUPABASE_KEY : localStorage.getItem('zandi_supabase_key');
  const indicator = document.getElementById('sync-indicator');

  // 키가 존재하면 UI가 로컬 모드로 풀려 보이지 않도록 즉각 '연동중' 상태 표시
  if (url && key && indicator) {
    indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block mr-1"></span> 부부 실시간 연동중';
  }

  // 로컬스토리지에 하드코딩된 정보를 캐시 업데이트(백업)
  if (isHardcodedUrl) localStorage.setItem('zandi_supabase_url', SUPABASE_URL);
  if (isHardcodedKey) localStorage.setItem('zandi_supabase_key', SUPABASE_KEY);

  console.log('[initSupabase] 로드:', url ? 'URL있음' : 'URL없음', key ? `KEY있음(${key.length}자)` : 'KEY없음');

  if (url && key) {
    if (!window.supabase) {
      console.warn('[initSupabase] window.supabase가 아직 준비되지 않았습니다. 100ms 후 다시 시도합니다.');
      setTimeout(initSupabase, 100);
      return;
    }
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
      
      // DB 테이블 스키마 무결성 검증
      await checkDatabaseSchema();
      
      await pullFromSupabase();
      subscribeToRealtime();
    } catch (e) {
      console.error("Supabase connection error:", e);
      if (indicator) {
        indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500 inline-block mr-1"></span> 연동 오류';
      }
      setTimeout(() => {
        if (typeof showToast === 'function') {
          showToast(`[Supabase 연동 실패] 주소/Key가 틀렸거나 RLS 설정 오류입니다.`, 'error');
        }
      }, 500);
    }
  } else {
    if (indicator) {
      indicator.innerHTML = '<span class="w-2 h-2 rounded-full bg-neutral-600 inline-block mr-1"></span> 로컬 전용 모드';
    }
  }
}

// Supabase Auth 로그인 요청 함수
async function signInWithSupabase(email, password) {
  if (!supabaseClient) {
    throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. 먼저 설정을 완료해 주세요.');
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });
  if (error) throw error;
  return data;
}

// Supabase Auth 로그아웃 요청 함수
async function signOutFromSupabase() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
}


async function checkDatabaseSchema() {
  if (!supabaseClient) return;
  console.log("[SchemaCheck] Supabase DB 테이블 진단 시작...");
  const tables = ['customers', 'sales', 'workers', 'attendance', 'rents', 'settings'];
  for (const table of tables) {
    try {
      const { error } = await supabaseClient.from(table).select('*').limit(1);
      if (error) {
        console.warn(`[SchemaCheck] '${table}' 테이블이 부재하거나 접근 권한(RLS)이 설정되지 않았습니다:`, error.message);
      } else {
        console.log(`[SchemaCheck] '${table}' 테이블 연결 확인 완료`);
      }
    } catch (e) {
      console.warn(`[SchemaCheck] '${table}' 테이블 진단 중 에러 발생:`, e);
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

    // expenses 테이블 풀 시도 (테이블이 없을 수 있으므로 try-catch로 예외 처리)
    let exp = [];
    try {
      const { data: expData, error: eErr } = await supabaseClient.from('expenses').select('*');
      if (!eErr && expData) exp = expData;
    } catch (e) {
      console.warn("Supabase expenses table pull failed (might not exist yet):", e);
    }

    // settings 테이블 풀 시도 (테이블이 없을 수 있으므로 try-catch로 예외 처리)
    let customerSortOrder = localStorage.getItem('customer_sort_order') || null;
    try {
      const { data: settingsData, error: setErr } = await supabaseClient.from('settings').select('*');
      if (!setErr && settingsData) {
        settingsData.forEach(s => {
          if (s.key && s.key.startsWith('rent_village_name_')) {
            const vKey = s.key.replace('rent_village_name_', '');
            rentVillageNames[vKey] = s.value;
            localStorage.setItem(s.key, s.value);
          }
          if (s.key === 'customer_sort_order') {
            customerSortOrder = s.value;
            localStorage.setItem('customer_sort_order', s.value);
          }
          if (s.key === 'recent_activities') {
            try {
              state.recent_activities = JSON.parse(s.value);
            } catch (err) {
              state.recent_activities = [];
            }
          }
          if (s.key === 'zandi_password') {
            localStorage.setItem('zandi_password', s.value);
          }
        });
      }
    } catch (e) {
      console.warn("Supabase settings table pull failed (might not exist yet):", e);
    }

    state.customers = cust.map(c => ({ id: c.id, name: c.name, phone: c.phone, prices: c.prices, initialDebt: c.initial_debt || 0, initialDebtCollected: c.initial_debt_collected || 0, sortOrder: c.sort_order || 0 }));
    
    if (customerSortOrder) {
      const orderArray = customerSortOrder.split(',');
      state.customers.sort((a, b) => {
        const idxA = orderArray.indexOf(a.id);
        const idxB = orderArray.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
      // 메모리 객체에도 정렬 순서 인덱스를 동기화해둠
      state.customers.forEach((c, i) => {
        c.sortOrder = i + 1;
      });
    } else {
      state.customers.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
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
    state.workers = work.map(w => ({ 
      id: w.id, 
      name: w.name, 
      baseDailyWage: w.base_daily_wage,
      halfDailyWage: w.half_daily_wage !== undefined && w.half_daily_wage !== null 
        ? w.half_daily_wage 
        : Math.round((w.base_daily_wage || 0) * 0.5)
    }));
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

    if (exp && exp.length > 0) {
      state.expenses = exp.map(e => ({
        id: e.id,
        expenseDate: e.expense_date || e.expenseDate || '',
        usage: e.usage || '',
        amount: Number(e.amount) || 0,
        notes: e.notes || ''
      }));
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
      // PostgreSQL 오류 코드 42703 (undefined_column) 이거나 에러 메시지에 sort_order가 포함된 경우
      if (error.code === '42703' || (error.message && error.message.includes('sort_order'))) {
        console.warn("[pushCustomers] sort_order 컬럼이 존재하지 않아 해당 컬럼을 제외하고 저장 재시도합니다.");
        const fallbackPayload = payload.map(p => {
          const { sort_order, ...rest } = p;
          return rest;
        });
        const { error: fallbackError } = await supabaseClient.from('customers').upsert(fallbackPayload);
        if (fallbackError) {
          throw fallbackError;
        }
      } else {
        throw error;
      }
    }
    const names = list.map(c => c.name).join(', ');
    logSystemActivity('customer_save', `'${names}' 거래처 정보가 등록/수정되었습니다.`);
  } catch (e) {
    console.error('[pushCustomers] 예외 발생:', e);
    throw e;
  }
}

async function removeCustomerSupabase(id) {
  if (!supabaseClient) return;
  const name = state.customers.find(c => c.id === id)?.name || '알수없음';
  try {
    await supabaseClient.from('customers').delete().eq('id', id);
    logSystemActivity('customer_delete', `'${name}' 거래처 정보가 삭제되었습니다.`);
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
    const customer = state.customers.find(c => c.id === sale.customerId)?.name || '알수없음';
    logSystemActivity('sale_save', `'${customer}' 거래처의 ${sale.saleDate} 잔디 판매 건(규격: ${sale.productType}, 수량: ${sale.quantity})이 등록/수정되었습니다.`);
  } catch (e) { console.error(e); }
}

async function removeSaleSupabase(id) {
  if (!supabaseClient) return;
  const sale = state.sales.find(s => s.id === id);
  const customer = sale ? (state.customers.find(c => c.id === sale.customerId)?.name || '알수없음') : '알수없음';
  const date = sale ? sale.saleDate : '';
  try {
    await supabaseClient.from('sales').delete().eq('id', id);
    logSystemActivity('sale_delete', `'${customer}' 거래처의 ${date} 판매 내역이 삭제되었습니다.`);
  } catch (e) { console.error(e); }
}

async function pushWorker(worker) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('workers').upsert({
      id: worker.id,
      name: worker.name,
      base_daily_wage: worker.baseDailyWage,
      half_daily_wage: worker.halfDailyWage
    });
    if (error) {
      // 42703 (undefined_column) 에러 발생 시, half_daily_wage 컬럼 없이 재시도
      if (error.code === '42703') {
        console.warn("Supabase 'workers' 테이블에 'half_daily_wage' 컬럼이 없어 컬럼 제외 후 재시도합니다.");
        const { error: retryError } = await supabaseClient.from('workers').upsert({
          id: worker.id,
          name: worker.name,
          base_daily_wage: worker.baseDailyWage
        });
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    }
    logSystemActivity('worker_save', `'${worker.name}' 인부 정보가 등록/수정되었습니다.`);
  } catch (e) { console.error(e); }
}

async function removeWorkerSupabase(id) {
  if (!supabaseClient) return;
  const name = state.workers.find(w => w.id === id)?.name || '알수없음';
  try {
    await supabaseClient.from('workers').delete().eq('id', id);
    logSystemActivity('worker_delete', `'${name}' 인부 정보가 삭제되었습니다.`);
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
    const name = state.workers.find(w => w.id === att.workerId)?.name || '알수없음';
    logSystemActivity('attendance_save', `'${name}' 인부의 ${att.workDate} 출근(형태: ${att.workType === 1 ? '하루' : '반나절'})이 등록/수정되었습니다.`);
  } catch (e) { console.error(e); }
}

async function removeAttendanceSupabase(id) {
  if (!supabaseClient) return;
  const att = state.attendance.find(a => a.id === id);
  const name = att ? (state.workers.find(w => w.id === att.workerId)?.name || '알수없음') : '알수없음';
  const date = att ? att.workDate : '';
  try {
    await supabaseClient.from('attendance').delete().eq('id', id);
    logSystemActivity('attendance_delete', `'${name}' 인부의 ${date} 출근 내역이 삭제되었습니다.`);
  } catch (e) { console.error(e); }
}

async function pushRent(rent) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('rents').upsert({
      id: rent.id,
      owner_name: rent.ownerName,
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
    logSystemActivity('rent_save', `'${rent.ownerName}' 임대인의 토지 임대 정보가 등록/수정되었습니다.`);
  } catch (e) {
    console.error('[pushRent] 예외 발생:', e);
    throw e;
  }
}

async function removeRentSupabase(id) {
  if (!supabaseClient) return;
  const name = state.rents.find(r => r.id === id)?.ownerName || '알수없음';
  try {
    const { error } = await supabaseClient.from('rents').delete().eq('id', id);
    if (error) {
      console.error('[removeRentSupabase] Supabase 삭제 오류:', error);
      throw error;
    }
    logSystemActivity('rent_delete', `'${name}' 임대인의 토지 임대 정보가 삭제되었습니다.`);
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

async function pushExpense(expense) {
  if (!supabaseClient) return;
  try {
    const { error } = await supabaseClient.from('expenses').upsert({
      id: expense.id,
      expense_date: expense.expenseDate,
      usage: expense.usage,
      amount: expense.amount,
      notes: expense.notes
    });
    if (error) {
      console.warn('[pushExpense] Supabase 지출 저장 오류 (테이블이 없을 수 있음):', error);
      throw error;
    }
    logSystemActivity('expense_save', `${expense.expenseDate} 지출 내역(사용처: ${expense.usage}, 금액: ${expense.amount.toLocaleString()}원)이 등록되었습니다.`);
  } catch (e) {
    console.error('[pushExpense] 예외 발생:', e);
    throw e;
  }
}

async function removeExpenseSupabase(id) {
  if (!supabaseClient) return;
  const exp = state.expenses.find(e => e.id === id);
  const date = exp ? exp.expenseDate : '';
  const usage = exp ? exp.usage : '';
  try {
    const { error } = await supabaseClient.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('[removeExpenseSupabase] Supabase 지출 삭제 오류:', error);
      throw error;
    }
    logSystemActivity('expense_delete', `${date} 지출 내역(${usage})이 삭제되었습니다.`);
  } catch (e) {
    console.error('[removeExpenseSupabase] 예외 발생:', e);
    throw e;
  }
}

// 🔔 최근 변경 이력 등록 및 Supabase settings 연동 저장
async function logSystemActivity(type, message) {
  if (!supabaseClient) return;
  const username = localStorage.getItem('zandi_login_username') || '사장님';
  const newActivity = {
    id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    user: username,
    type: type,
    message: message
  };

  if (!state.recent_activities) state.recent_activities = [];
  state.recent_activities.unshift(newActivity);
  state.recent_activities = state.recent_activities.slice(0, 20);

  saveState();
  try {
    await pushSetting('recent_activities', JSON.stringify(state.recent_activities));
  } catch (err) {
    console.warn('[logSystemActivity] 알림 업로드 실패:', err);
  }
}

