// 2. Authentication UI & Logic
function initAuth() {
  const loginOverlay = document.getElementById('login-overlay');
  const loginBtn = document.getElementById('login-btn');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const loginError = document.getElementById('login-error');
  const mainApp = document.getElementById('main-app');
  const logoutBtn = document.getElementById('logout-btn');
  const settingsCurrentEmail = document.getElementById('settings-current-email');

  // UI 상태 변화 헬퍼
  const setLoginUIState = (authenticated, email = null) => {
    if (authenticated) {
      loginOverlay.style.display = 'none';
      mainApp.style.opacity = '1';
      mainApp.style.pointerEvents = 'auto';
      if (settingsCurrentEmail && email) {
        settingsCurrentEmail.textContent = email;
      }
    } else {
      loginOverlay.style.display = 'flex';
      mainApp.style.opacity = '0.05';
      mainApp.style.pointerEvents = 'none';
      if (settingsCurrentEmail) {
        settingsCurrentEmail.textContent = '-';
      }
    }
  };

  // 1) 초기 세션 상태에 따른 UI 초기 설정
  setLoginUIState(state.isAuthenticated, localStorage.getItem('zandi_user_email'));

  // 2) 로그인 버튼 클릭
  loginBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    loginBtn.disabled = true;
    const originalText = loginBtn.textContent;
    loginBtn.textContent = '로그인 중...';
    loginError.style.display = 'none';

    try {
      // Supabase Auth 로그인 요청
      const data = await signInWithSupabase(email, password);
      
      if (data && data.user) {
        state.isAuthenticated = true;
        localStorage.setItem('zandi_authenticated', 'true');
        localStorage.setItem('zandi_user_email', data.user.email);
        setLoginUIState(true, data.user.email);
        
        emailInput.value = '';
        passwordInput.value = '';
        
        // Supabase 연결 완료 직후 데이터를 동기식 풀링
        await pullFromSupabase();
        renderAll();
      }
    } catch (err) {
      console.error('로그인 실패:', err);
      loginError.textContent = '이메일 또는 비밀번호가 일치하지 않거나 서버 연결 오류입니다.';
      loginError.style.display = 'block';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;
    }
  });

  // Enter 입력 시 로그인 트리거
  const handleEnterKey = (e) => {
    if (e.key === 'Enter') loginBtn.click();
  };
  if (emailInput) emailInput.addEventListener('keypress', handleEnterKey);
  if (passwordInput) passwordInput.addEventListener('keypress', handleEnterKey);

  // 3) 로그아웃 버튼
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      const confirmLogout = confirm('안전하게 로그아웃하시겠습니까?');
      if (!confirmLogout) return;

      try {
        await signOutFromSupabase();
      } catch (err) {
        console.warn('Supabase 로그아웃 중 예외 발생 (무시하고 로컬 세션 해제):', err);
      }

      state.isAuthenticated = false;
      localStorage.removeItem('zandi_authenticated');
      localStorage.removeItem('zandi_user_email');
      
      setLoginUIState(false);
      
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      loginError.style.display = 'none';

      // 설정 모달이 닫히도록 처리
      const settingsModal = document.getElementById('settings-modal');
      if (settingsModal) settingsModal.classList.add('hidden');
    });
  }

  // 4) Supabase Auth 실시간 세션 감지 리스너 추가
  setTimeout(() => {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('[Auth Listener] Event:', event);
        if (session && session.user) {
          state.isAuthenticated = true;
          localStorage.setItem('zandi_authenticated', 'true');
          localStorage.setItem('zandi_user_email', session.user.email);
          setLoginUIState(true, session.user.email);
        } else if (event === 'SIGNED_OUT') {
          state.isAuthenticated = false;
          localStorage.removeItem('zandi_authenticated');
          localStorage.removeItem('zandi_user_email');
          setLoginUIState(false);
        }
      });
    }
  }, 500);
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
function initRentYears() {
  const currentYear = new Date().getFullYear();
  const yearPrev = currentYear - 1;
  const yearCurr = currentYear;
  const yearNext = currentYear + 1;

  // 4.1. Dashboard View
  const thNext = document.getElementById('rent-header-year-next');
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

  // 11) (이전 Supabase 설정 폼 제거됨)

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
      try {
        await pushCustomers(customer);
        if (supabaseClient) {
          showToast('거래처 정보가 수정되었습니다.', 'success');
        }
      } catch (err) {
        console.error('[editCustForm] Supabase 저장 실패, 로컬 데이터는 유지됩니다:', err);
        showToast('서버 저장 실패: 데이터베이스 권한 또는 컬럼 오류 (로컬에 임시 보존됨)', 'warning');
      }
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

  // 13) (이전 비밀번호 변경 폼 제거됨)

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
  // 강제 초기화 및 비밀번호 복구 주소(?clear=true) 처리
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('clear') === 'true') {
    console.log("[Launch] 강제 초기화 실행...");
    localStorage.removeItem('zandi_supabase_url');
    localStorage.removeItem('zandi_supabase_key');
    localStorage.removeItem('zandi_authenticated');
    localStorage.removeItem('zandi_user_email');
    localStorage.setItem('zandi_password', '1234');
    window.location.replace(window.location.origin + window.location.pathname);
    return;
  }

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

  // Supabase 동기화 초기화: 즉시 실행 (상수 기반 로드 가능)
  try {
    initSupabase();
  } catch (err) {
    console.error("[Launch] initSupabase failed: ", err);
  }

  renderAll();
});

