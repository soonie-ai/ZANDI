// ZANDI 장부 시스템 - Supabase Database Synchronization (js/db.js)

// Supabase Global Client
let supabaseClient = null;
let realtimeChannel = null;

// Supabase Cloud Sync Operations
async function initSupabase() {
  const url = localStorage.getItem('zandi_supabase_url');
  let key = localStorage.getItem('zandi_supabase_key');
  const indicator = document.getElementById('sync-indicator');

  // 자동 완성으로 인해 비밀번호가 Supabase Key로 오염 저장된 경우 자동 차단 및 복구
  const currentPassword = localStorage.getItem('zandi_password') || "1234";
  if (key && (key === currentPassword || key === "1234")) {
    console.warn("[initSupabase] 비밀번호 자동 완성으로 오염된 Supabase Key 감지. 초기화합니다.");
    localStorage.removeItem('zandi_supabase_key');
    key = null;
  }
  
  // input fields prefill
  if (url) document.getElementById('settings-supabase-url').value = url;
  if (key) document.getElementById('settings-supabase-key').value = key || '';

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
      
      // DB 테이블 스키마 무결성 검증
      await checkDatabaseSchema();
      
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

    // settings 테이블 풀 시도 (테이블이 없을 수 있으므로 try-catch로 예외 처리)
    let customerSortOrder = null;
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
  } catch (e) {
    console.error('[pushCustomers] 예외 발생:', e);
    throw e;
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
