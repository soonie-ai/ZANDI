function renderDashboard() {
  const totalSales = state.sales.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const collectedSales = state.sales.reduce((sum, item) => {
    const collected = (item.payments || []).reduce((s, p) => s + p.amount, 0);
    return sum + collected;
  }, 0);
  
  // 거래처별 전체 미수금의 합 (거래 내역 미수금 + 이월 미수금 잔액)
  const uncollectedSales = state.customers.reduce((sum, customer) => {
    const cSales = state.sales.filter(s => s.customerId === customer.id);
    const total = cSales.reduce((s, item) => s + (item.quantity * item.price), 0);
    const paid = cSales.reduce((s, item) => s + (item.payments || []).reduce((sm, p) => sm + p.amount, 0), 0);
    
    const initialDebtVal = customer.initialDebt || 0;
    const initialCollectedVal = customer.initialDebtCollected || 0;
    const initialUncollected = Math.max(0, initialDebtVal - initialCollectedVal);
    
    return sum + (total - paid) + initialUncollected;
  }, 0);

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
        const unitLabel = (sale.productType === '1818' || sale.productType === '1818t' || sale.productType === '3030' || sale.productType === '3030t' || sale.productType === '4060') ? '장' : '평';
        
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
      const unitLabel = (sale.productType === '1818' || sale.productType === '1818t' || sale.productType === '3030' || sale.productType === '3030t' || sale.productType === '4060') ? '장' : '평';

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

window.openAttendanceDayDetailsModal = function(dateStr) {
  const modal = document.getElementById('attendance-day-details-modal');
  if (!modal) return;

  document.getElementById('attendance-modal-date-title').textContent = dateStr;
  const list = document.getElementById('attendance-modal-list');
  list.innerHTML = '';

  const dayAttendance = state.attendance.filter(a => a.workDate === dateStr);

  if (dayAttendance.length === 0) {
    list.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 text-xs">해당 날짜의 출근 내역이 없습니다.</td></tr>';
  } else {
    dayAttendance.forEach(att => {
      const worker = state.workers.find(w => w.id === att.workerId) || { name: '삭제된 인부' };
      const payment = att.workType * att.dailyWage;

      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20';
      tr.innerHTML = `
        <td class="p-2 text-white font-medium">${worker.name}</td>
        <td class="p-2 text-center text-gray-300">${att.workType === 1.0 ? '하루(1.0)' : '반나절(0.5)'}</td>
        <td class="p-2 text-right text-gray-400">${att.dailyWage.toLocaleString()}원</td>
        <td class="p-2 text-right text-emerald-400 font-bold">${payment.toLocaleString()}원</td>
        <td class="p-2 text-center">
          <span class="px-2 py-0.5 rounded text-[10px] ${att.isPaid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}">
            ${att.isPaid ? '지급완료' : '미지급'}
          </span>
        </td>
      `;
      list.appendChild(tr);
    });
  }

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
    
    const initialDebtVal = customer.initialDebt || 0;
    const initialCollectedVal = customer.initialDebtCollected || 0;
    const initialUncollected = Math.max(0, initialDebtVal - initialCollectedVal);
    const unpaid = (total - paid) + initialUncollected;

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
    const unitLabel = (sale.productType === '1818' || sale.productType === '1818t' || sale.productType === '3030' || sale.productType === '3030t' || sale.productType === '4060') ? '장' : '평';

    const collected = (sale.payments || []).reduce((sum, p) => sum + p.amount, 0);
    const uncollected = total - collected;
    const isFullyPaid = uncollected <= 0;

    filterQtyTotal += sale.quantity;
    filterAmountTotal += total;

    const tr = document.createElement('tr');
    tr.id = `sale-row-${sale.id}`;
    tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20';
    const hasNotes = sale.notes && sale.notes.trim() !== '';
    const noteButton = hasNotes 
      ? `<button onclick="openSaleNoteModal('${sale.notes.replace(/'/g, "\\'").replace(/"/g, '\\"')}')" class="text-amber-400 hover:text-amber-300 p-1 flex items-center justify-center mx-auto" title="메모 보기">
           <i data-lucide="message-square" class="w-5 h-5"></i>
         </button>`
      : `<span class="text-slate-600 flex items-center justify-center">-</span>`;

    tr.innerHTML = `
      <td class="p-3 text-center pl-2">
        <label class="custom-checkbox inline-block">
          <input type="checkbox" class="sale-select-row-check" data-sale-id="${sale.id}" onchange="toggleSaleSelectRow(this)">
          <span class="checkmark"></span>
        </label>
      </td>
      <td class="p-3 text-gray-400">${sale.saleDate}</td>
      <td class="p-3 text-white font-medium whitespace-nowrap">${customer.name}</td>
      <td class="p-3 text-gray-300 font-semibold">${PRODUCT_TYPE_LABELS[sale.productType] || '평당'}</td>
      <td class="p-3 text-right text-gray-300">${sale.quantity.toLocaleString()} ${unitLabel}</td>
      <td class="p-3 text-right text-gray-400">${sale.price.toLocaleString()}원</td>
      <td class="p-3 text-right text-emerald-400 font-bold">${total.toLocaleString()}원</td>
      <td class="p-3 text-center">
        <div onclick="openPaymentModal('${sale.id}')" class="cursor-pointer group flex flex-col items-center justify-center p-1.5 rounded hover:bg-emerald-950/45 border border-transparent hover:border-zandiBorder transition-all duration-300">
          <span class="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide ${
            isFullyPaid 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
              : collected > 0 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-extrabold animate-pulse'
          }">
            ${isFullyPaid ? '수금완료' : collected > 0 ? '부분수금' : '미수금'}
          </span>
          ${isFullyPaid 
            ? `<span class="text-xs text-white font-bold mt-1.5">${collected.toLocaleString()}원</span>` 
            : `<span class="text-xs text-rose-400 font-extrabold mt-1.5">${uncollected.toLocaleString()}원 미납</span>`
          }
        </div>
      </td>
      <td class="p-3 text-center">${noteButton}</td>
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
      <td class="p-3 text-emerald-400 font-bold">
        ${worker.baseDailyWage.toLocaleString()}원 / ${(worker.halfDailyWage || Math.round(worker.baseDailyWage * 0.5)).toLocaleString()}원
      </td>
      <td class="p-3 text-gray-300">${totalDays}일</td>
      <td class="p-3 text-rose-400 font-semibold">${unpaidWage.toLocaleString()}원</td>
      <td class="p-3 text-center">
        <div class="flex items-center justify-center gap-2">
          <button onclick="openWorkerEditModal('${worker.id}')" class="text-emerald-400 hover:text-emerald-300 p-1" title="수정">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
          <button onclick="deleteWorker('${worker.id}')" class="text-rose-400 hover:text-rose-300 p-1" title="삭제">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
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
            wageInput.value = formatAmountInput(String(worker.halfDailyWage || Math.round(worker.baseDailyWage * 0.5)));
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
    if (attFilters.isPaid) {
      if (attFilters.isPaid === 'paid' && !att.isPaid) return false;
      if (attFilters.isPaid === 'unpaid' && att.isPaid) return false;
    }
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
    cell.className = `calendar-day-cell cursor-pointer ${isToday ? 'today' : ''}`;
    cell.onclick = () => openAttendanceDayDetailsModal(dateStr);
    
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

  // 필터링 적용된 출근 내역 데이터 추출
  let filteredAttendance = state.attendance.filter(att => {
    if (attFilters.workerId && att.workerId !== attFilters.workerId) return false;
    if (attFilters.workType && att.workType !== Number(attFilters.workType)) return false;
    if (attFilters.startDate && att.workDate < attFilters.startDate) return false;
    if (attFilters.endDate && att.workDate > attFilters.endDate) return false;
    if (attFilters.isPaid) {
      if (attFilters.isPaid === 'paid' && !att.isPaid) return false;
      if (attFilters.isPaid === 'unpaid' && att.isPaid) return false;
    }
    return true;
  });

  // 날짜 내림차순 정렬
  filteredAttendance.sort((a, b) => {
    const dateDiff = new Date(b.workDate) - new Date(a.workDate);
    if (dateDiff !== 0) return dateDiff;
    const workerA = state.workers.find(w => w.id === a.workerId) || { name: '' };
    const workerB = state.workers.find(w => w.id === b.workerId) || { name: '' };
    return workerA.name.localeCompare(workerB.name);
  });

  let html = `
    <table class="w-full text-left text-sm min-w-[650px]">
      <thead>
        <tr class="text-xs text-zandiTextMuted border-b border-zandiBorder/40">
          <th class="pb-2 pl-3 w-10">
            <label class="custom-checkbox">
              <input type="checkbox" id="att-select-all-check">
              <span class="checkmark"></span>
            </label>
          </th>
          <th class="pb-2">일자</th>
          <th class="pb-2">인부명</th>
          <th class="pb-2 text-center">근무형태</th>
          <th class="pb-2 text-right">기준일당</th>
          <th class="pb-2 text-right">정산금액</th>
          <th class="pb-2 text-center">지급여부</th>
          <th class="pb-2 text-center">삭제</th>
        </tr>
      </thead>
      <tbody>
  `;

  if (filteredAttendance.length === 0) {
    html += `<tr><td colspan="8" class="p-4 text-center text-gray-500 text-xs">출근 기록이 없습니다.</td></tr>`;
  } else {
    filteredAttendance.forEach(att => {
      const worker = state.workers.find(w => w.id === att.workerId) || { name: '알수없음', baseDailyWage: 0 };
      const payment = att.workType * att.dailyWage;
      
      const isPaidClass = att.isPaid 
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20';

      html += `
        <tr class="border-b border-gray-800 hover:bg-emerald-950/10">
          <td class="p-3 pl-3">
            <label class="custom-checkbox">
              <input type="checkbox" class="att-select-check" value="${att.id}" ${att.isPaid ? 'disabled' : ''}>
              <span class="checkmark"></span>
            </label>
          </td>
          <td class="p-3 text-gray-400 font-medium">${att.workDate}</td>
          <td class="p-3 text-white font-medium">${worker.name}</td>
          <td class="p-3 text-center text-gray-300">
            ${att.workType === 1.0 ? '하루(1.0)' : '반나절(0.5)'}
          </td>
          <td class="p-3 text-right text-gray-300">${att.dailyWage.toLocaleString()}원</td>
          <td class="p-3 text-right text-emerald-400 font-bold">${payment.toLocaleString()}원</td>
          <td class="p-3 text-center">
            <span class="cursor-pointer inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${isPaidClass}" onclick="toggleAttendancePayment('${att.id}')" title="지급 여부 토글">
              ${att.isPaid ? '지급완료' : '미지급'}
            </span>
          </td>
          <td class="p-3 text-center">
            <button onclick="deleteAttendance('${att.id}')" class="text-rose-400 hover:text-rose-300 p-1 flex items-center justify-center mx-auto" title="삭제">
              <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
          </td>
        </tr>
      `;
    });
  }

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();

  // 체크박스 이벤트 바인딩 및 실시간 합계 초기화
  const checkboxes = container.querySelectorAll('.att-select-check');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateCheckedAttendanceStats);
  });

  const selectAllCheck = container.querySelector('#att-select-all-check');
  if (selectAllCheck) {
    selectAllCheck.addEventListener('change', (e) => {
      toggleAllAttSelects(e.target);
    });
  }

  updateCheckedAttendanceStats();
}

window.toggleAllAttSelects = function(master) {
  const checkboxes = document.querySelectorAll('.att-select-check:not(:disabled)');
  checkboxes.forEach(cb => {
    cb.checked = master.checked;
  });
  updateCheckedAttendanceStats();
};

function updateCheckedAttendanceStats() {
  const checkedBoxes = document.querySelectorAll('.att-select-check:checked');
  const count = checkedBoxes.length;
  let days = 0;
  let amount = 0;

  checkedBoxes.forEach(cb => {
    const att = state.attendance.find(a => a.id === cb.value);
    if (att) {
      days += Number(att.workType);
      amount += (att.workType * att.dailyWage);
    }
  });

  const countEl = document.getElementById('checked-att-count');
  const daysEl = document.getElementById('checked-att-days');
  const amountEl = document.getElementById('checked-att-amount');

  if (countEl) countEl.textContent = count + '건';
  if (daysEl) daysEl.textContent = days + '일';
  if (amountEl) amountEl.textContent = amount.toLocaleString() + '원';
}
window.updateCheckedAttendanceStats = updateCheckedAttendanceStats;



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

// 4.6. 농자재 지출 관리 (Expenses)
function renderExpenses() {
  const expenseList = document.getElementById('expense-list');
  if (!expenseList) return;

  const expenses = state.expenses || [];
  
  // 날짜 내림차순 정렬
  const sortedExpenses = [...expenses].sort((a, b) => {
    return new Date(b.expenseDate) - new Date(a.expenseDate);
  });

  const totalCount = sortedExpenses.length;
  const totalAmount = sortedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const totalCountEl = document.getElementById('expense-total-count');
  const totalAmountEl = document.getElementById('expense-total-amount');

  if (totalCountEl) totalCountEl.textContent = totalCount.toLocaleString();
  if (totalAmountEl) totalAmountEl.textContent = totalAmount.toLocaleString();

  expenseList.innerHTML = '';
  if (sortedExpenses.length === 0) {
    expenseList.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500 text-xs">등록된 농자재 지출 내역이 없습니다.</td></tr>';
  } else {
    sortedExpenses.forEach(exp => {
      const tr = document.createElement('tr');
      tr.id = `expense-row-${exp.id}`;
      tr.className = 'border-b border-gray-800 hover:bg-emerald-950/20 text-xs';
      tr.innerHTML = `
        <td class="p-3 text-gray-300">${exp.expenseDate || '-'}</td>
        <td class="p-3 text-white font-medium pl-2">${exp.usage || '-'}</td>
        <td class="p-3 text-right text-emerald-400 font-bold">${Number(exp.amount || 0).toLocaleString()}원</td>
        <td class="p-3 text-gray-400 max-w-[150px] truncate" title="${exp.notes || ''}">${exp.notes || '-'}</td>
        <td class="p-3 text-center no-print">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="openExpenseEditModal('${exp.id}')" class="text-emerald-400 hover:text-emerald-300 p-1">
              <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="deleteExpense('${exp.id}')" class="text-rose-400 hover:text-rose-300 p-1">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      `;
      expenseList.appendChild(tr);
    });
  }

  if (window.lucide) window.lucide.createIcons();
}

// Expense Actions
async function addExpense(usage, amount, notes, date) {
  const id = 'exp-' + Date.now();
  const newExpense = {
    id,
    expenseDate: date,
    usage,
    amount: Number(amount) || 0,
    notes
  };
  state.expenses.push(newExpense);
  saveState();
  renderAll();

  try {
    await pushExpense(newExpense);
    if (supabaseClient) {
      showToast('지출 내역이 저장되었습니다.', 'success');
    }
  } catch (e) {
    console.error('[addExpense] Supabase 저장 실패, 로컬 데이터는 유지됩니다:', e);
    showToast('서버 저장 실패: 데이터베이스 권한 또는 컬럼 오류 (로컬에 임시 보존됨)', 'warning');
  }
}

window.deleteExpense = async function(id) {
  if (confirm('이 지출 내역을 삭제하시겠습니까?')) {
    state.expenses = state.expenses.filter(e => e.id !== id);
    saveState();
    renderAll();

    try {
      await removeExpenseSupabase(id);
      showToast('지출 내역이 성공적으로 삭제되었습니다.');
    } catch (e) {
      console.warn('[deleteExpense] Supabase 지출 삭제 실패, 로컬 데이터만 삭제됩니다:', e);
      showToast('서버 저장 실패 (로컬 데이터만 삭제됨)', 'info');
    }
  }
};

window.openExpenseEditModal = function(id) {
  const exp = state.expenses.find(e => e.id === id);
  if (!exp) return;

  document.getElementById('edit-expense-id').value = exp.id;
  document.getElementById('edit-expense-date').value = exp.expenseDate || '';
  document.getElementById('edit-expense-usage').value = exp.usage || '';
  document.getElementById('edit-expense-amount').value = exp.amount ? Number(exp.amount).toLocaleString('ko-KR') : '';
  document.getElementById('edit-expense-notes').value = exp.notes || '';

  document.getElementById('expense-edit-modal').classList.remove('hidden');
};

window.addExpense = addExpense;
window.renderExpenses = renderExpenses;

// 4.7. 월별 인건비 지급 내역 집계
function renderMonthlyLaborReport() {
  const monthSelect = document.getElementById('filter-monthly-labor-month');
  const laborList = document.getElementById('monthly-labor-list');
  if (!monthSelect || !laborList) return;

  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthsSet = new Set([currentMonth]);
  (state.attendance || []).forEach(att => {
    if (att.workDate) {
      monthsSet.add(att.workDate.slice(0, 7));
    }
  });

  const sortedMonths = Array.from(monthsSet).sort().reverse();
  const prevVal = monthSelect.value;
  
  const currentOptions = Array.from(monthSelect.options).map(o => o.value);
  const isDifferent = currentOptions.length !== sortedMonths.length || currentOptions.some((v, i) => v !== sortedMonths[i]);
  
  if (isDifferent) {
    monthSelect.innerHTML = '';
    sortedMonths.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      const [year, month] = m.split('-');
      opt.textContent = `${year}년 ${month}월`;
      monthSelect.appendChild(opt);
    });
    if (prevVal && sortedMonths.includes(prevVal)) {
      monthSelect.value = prevVal;
    } else {
      monthSelect.value = sortedMonths[0] || currentMonth;
    }
  }

  const selectedMonth = monthSelect.value; // YYYY-MM

  const monthlyAtts = (state.attendance || []).filter(att => att.workDate && att.workDate.startsWith(selectedMonth));

  const workerAgg = {};
  monthlyAtts.forEach(att => {
    if (!workerAgg[att.workerId]) {
      const worker = state.workers.find(w => w.id === att.workerId) || { name: '알수없음' };
      workerAgg[att.workerId] = {
        name: worker.name,
        totalDays: 0,
        totalWage: 0,
        paidAmount: 0,
        unpaidAmount: 0
      };
    }
    const agg = workerAgg[att.workerId];
    const amount = Number(att.workType) * Number(att.dailyWage);
    agg.totalDays += Number(att.workType);
    agg.totalWage += amount;
    if (att.isPaid) {
      agg.paidAmount += amount;
    } else {
      agg.unpaidAmount += amount;
    }
  });

  laborList.innerHTML = '';
  let grandDays = 0;
  let grandWage = 0;
  let grandPaid = 0;
  let grandUnpaid = 0;

  const aggList = Object.values(workerAgg).sort((a, b) => b.totalWage - a.totalWage);

  if (aggList.length === 0) {
    laborList.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-500 text-xs">선택한 월에 해당하는 인건비 지급 내역이 없습니다.</td></tr>';
  } else {
    aggList.forEach(agg => {
      grandDays += agg.totalDays;
      grandWage += agg.totalWage;
      grandPaid += agg.paidAmount;
      grandUnpaid += agg.unpaidAmount;

      const tr = document.createElement('tr');
      tr.className = 'border-b border-gray-800 hover:bg-emerald-950/10 text-xs';
      tr.innerHTML = `
        <td class="p-3 pl-2 text-white font-medium">${agg.name}</td>
        <td class="p-3 text-center text-gray-300">${agg.totalDays.toFixed(1)}일</td>
        <td class="p-3 text-right text-emerald-400 font-bold">${agg.totalWage.toLocaleString()}원</td>
        <td class="p-3 text-right text-emerald-500">${agg.paidAmount.toLocaleString()}원</td>
        <td class="p-3 text-right text-rose-400">${agg.unpaidAmount.toLocaleString()}원</td>
      `;
      laborList.appendChild(tr);
    });
  }

  const totalDaysEl = document.getElementById('monthly-labor-total-days');
  const totalWageEl = document.getElementById('monthly-labor-total-wage');
  const totalPaidEl = document.getElementById('monthly-labor-total-paid');
  const totalUnpaidEl = document.getElementById('monthly-labor-total-unpaid');

  if (totalDaysEl) totalDaysEl.textContent = `${grandDays.toFixed(1)}일`;
  if (totalWageEl) totalWageEl.textContent = `${grandWage.toLocaleString()}원`;
  if (totalPaidEl) totalPaidEl.textContent = `${grandPaid.toLocaleString()}원`;
  if (totalUnpaidEl) totalUnpaidEl.textContent = `${grandUnpaid.toLocaleString()}원`;
}

window.renderMonthlyLaborReport = renderMonthlyLaborReport;

window.openMonthlyLaborModal = function() {
  const modal = document.getElementById('monthly-labor-modal');
  if (modal) {
    modal.classList.remove('hidden');
    renderMonthlyLaborReport();
  }
};

window.closeMonthlyLaborModal = function() {
  const modal = document.getElementById('monthly-labor-modal');
  if (modal) modal.classList.add('hidden');
};

window.openSaleNoteModal = function(notes) {
  const modal = document.getElementById('sale-note-modal');
  const content = document.getElementById('sale-note-modal-content');
  if (modal && content) {
    content.textContent = notes;
    modal.classList.remove('hidden');
  }
};

window.closeSaleNoteModal = function() {
  const modal = document.getElementById('sale-note-modal');
  if (modal) modal.classList.add('hidden');
};

function renderAll() {
  renderDashboard();
  renderCustomers();
  renderSales();
  renderAttendance();
  renderRent();
  renderExpenses();
  renderMonthlyLaborReport();
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
function addWorker(name, baseDailyWage, halfDailyWage) {
  const id = 'worker-' + Date.now();
  const newWorker = { 
    id, 
    name, 
    baseDailyWage: Number(String(baseDailyWage).replace(/,/g, '')) || 0,
    halfDailyWage: Number(String(halfDailyWage).replace(/,/g, '')) || 0 
  };
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
}

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

// Worker Edit Modal Actions
window.openWorkerEditModal = function(id) {
  const worker = state.workers.find(w => w.id === id);
  if (!worker) return;

  document.getElementById('edit-worker-id').value = worker.id;
  document.getElementById('edit-worker-name').value = worker.name;
  document.getElementById('edit-worker-wage').value = formatAmountInput(String(worker.baseDailyWage || 0));
  document.getElementById('edit-worker-half-wage').value = formatAmountInput(String(worker.halfDailyWage || Math.round((worker.baseDailyWage || 0) * 0.5)));

  document.getElementById('worker-edit-modal').classList.remove('hidden');
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




window.bulkPayAttendance = async function() {
  const checkedBoxes = document.querySelectorAll('.att-select-check:checked');
  if (checkedBoxes.length === 0) {
    showToast('지급 완료 처리할 출근 내역을 먼저 선택해 주세요.', 'info');
    return;
  }

  const selectedIds = Array.from(checkedBoxes).map(cb => cb.value);
  let targetEntries = state.attendance.filter(att => selectedIds.includes(att.id) && !att.isPaid);

  if (targetEntries.length === 0) {
    showToast('선택한 내역 중 지급 처리할 수 있는 미지급 내역이 없습니다.', 'info');
    return;
  }

  const confirmMsg = `선택한 출근 내역 ${targetEntries.length}건을 일괄 지급 완료 처리하시겠습니까?`;
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
  
  // 마스터 체크박스 해제
  const masterCheck = document.getElementById('att-select-all-check');
  if (masterCheck) masterCheck.checked = false;
};

// ============================================================
//  📄 거래명세서 (Statement) 관리 함수
// ============================================================
window.openStatementModal = function() {
  const custId = document.getElementById('filter-sale-customer').value;
  if (!custId) {
    alert('거래명세서를 발행할 특정 거래처를 먼저 선택해 주세요.');
    return;
  }

  const customer = state.customers.find(c => c.id === custId);
  if (!customer) {
    alert('존재하지 않는 거래처입니다.');
    return;
  }

  const startDate = document.getElementById('filter-sale-start').value;
  const endDate = document.getElementById('filter-sale-end').value;

  // 필터링된 매출 내역 가져오기
  let salesData = state.sales.filter(sale => {
    if (sale.customerId !== custId) return false;
    if (startDate && sale.saleDate < startDate) return false;
    if (endDate && sale.saleDate > endDate) return false;
    return true;
  });

  // 날짜 오름차순 정렬 (명세서는 과거부터 순서대로 보여주는 것이 일반적)
  salesData.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));

  // 모달 데이터 셋업
  document.getElementById('stmt-customer-name').textContent = `${customer.name} 귀하`;
  
  // 발행일자 세팅 (오늘 날짜)
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('stmt-issue-date').textContent = today;

  // 공급자 및 금융 정보 LocalStorage 자동 연동 및 저장 설정
  const editableFields = [
    'stmt-supplier-no', 'stmt-supplier-name', 'stmt-supplier-owner', 
    'stmt-supplier-addr', 'stmt-supplier-phone', 'stmt-supplier-fax', 
    'stmt-supplier-type', 'stmt-bank-info', 'stmt-notes-info'
  ];
  editableFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const saved = localStorage.getItem(`zandi_stmt_${id}`);
      if (saved !== null) {
        el.textContent = saved;
      }
      
      // 글자 수정 후 포커스가 해제될 때 LocalStorage에 자동 저장
      el.onblur = () => {
        localStorage.setItem(`zandi_stmt_${id}`, el.textContent.trim());
      };
    }
  });

  const tbody = document.getElementById('statement-items-body');
  tbody.innerHTML = '';

  let totalQty = 0;
  let totalAmount = 0;

  salesData.forEach(sale => {
    const total = sale.quantity * sale.price;
    totalQty += sale.quantity;
    totalAmount += total;

    // 날짜 포맷 (MM/DD 형태)
    const dateObj = new Date(sale.saleDate);
    const dateStr = `${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
    const specName = PRODUCT_TYPE_LABELS[sale.productType] || '평당';

    const tr = document.createElement('tr');
    tr.className = 'border-b border-black';
    tr.innerHTML = `
      <td class="border-r border-black p-1.5" contenteditable="true">${dateStr}</td>
      <td class="border-r border-black p-1.5 text-left" contenteditable="true">재배잔디</td>
      <td class="border-r border-black p-1.5 text-center" contenteditable="true">${specName}</td>
      <td class="border-r border-black p-1.5 text-right font-semibold" contenteditable="true" oninput="recalculateStatement()">${sale.quantity.toLocaleString()}</td>
      <td class="border-r border-black p-1.5 text-right" contenteditable="true" oninput="recalculateStatement()">${sale.price.toLocaleString()}</td>
      <td class="border-r border-black p-1.5 text-right font-bold stmt-row-total">${total.toLocaleString()}원</td>
      <td class="border-r border-black p-1.5 text-left" contenteditable="true"></td>
      <td class="p-1.5 no-print">
        <button onclick="deleteStatementRow(this)" class="text-rose-600 hover:text-rose-800 font-bold">X</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (salesData.length === 0) {
    const tr = document.createElement('tr');
    tr.id = 'stmt-empty-row';
    tr.innerHTML = `<td colspan="8" class="p-4 text-center text-gray-400">해당 기간의 거래 내역이 없습니다. [+ 수기 항목 추가]를 통해 직접 항목을 채워주세요.</td>`;
    tbody.appendChild(tr);
  }

  // 합계 업데이트
  document.getElementById('stmt-total-qty').textContent = `${totalQty.toLocaleString()} 장/평`;
  document.getElementById('stmt-total-amount').textContent = `${totalAmount.toLocaleString()}원`;

  if (window.lucide) window.lucide.createIcons();

  // 모달 보이기
  document.getElementById('statement-modal').classList.remove('hidden');
};

window.closeStatementModal = function() {
  document.getElementById('statement-modal').classList.add('hidden');
};

window.addStatementRow = function() {
  const tbody = document.getElementById('statement-items-body');
  
  // 비어있음 행 제거
  const emptyRow = document.getElementById('stmt-empty-row');
  if (emptyRow) emptyRow.remove();

  const tr = document.createElement('tr');
  tr.className = 'border-b border-black';
  tr.innerHTML = `
    <td class="border-r border-black p-1.5" contenteditable="true"></td>
    <td class="border-r border-black p-1.5 text-left" contenteditable="true">재배잔디</td>
    <td class="border-r border-black p-1.5 text-center" contenteditable="true"></td>
    <td class="border-r border-black p-1.5 text-right font-semibold" contenteditable="true" oninput="recalculateStatement()">0</td>
    <td class="border-r border-black p-1.5 text-right" contenteditable="true" oninput="recalculateStatement()">0</td>
    <td class="border-r border-black p-1.5 text-right font-bold stmt-row-total">0원</td>
    <td class="border-r border-black p-1.5 text-left" contenteditable="true"></td>
    <td class="p-1.5 no-print">
      <button onclick="deleteStatementRow(this)" class="text-rose-600 hover:text-rose-800 font-bold">X</button>
    </td>
  `;
  tbody.appendChild(tr);
  recalculateStatement();
};

window.deleteStatementRow = function(btn) {
  const row = btn.closest('tr');
  row.remove();
  recalculateStatement();

  const tbody = document.getElementById('statement-items-body');
  if (tbody.children.length === 0) {
    const tr = document.createElement('tr');
    tr.id = 'stmt-empty-row';
    tr.innerHTML = `<td colspan="8" class="p-4 text-center text-gray-400">해당 기간의 거래 내역이 없습니다. [+ 수기 항목 추가]를 통해 직접 항목을 채워주세요.</td>`;
    tbody.appendChild(tr);
  }
};

window.recalculateStatement = function() {
  const tbody = document.getElementById('statement-items-body');
  const rows = tbody.querySelectorAll('tr:not(#stmt-empty-row)');
  
  let totalQty = 0;
  let totalAmount = 0;

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    const qtyStr = cells[3].textContent.replace(/[^0-9]/g, '');
    const priceStr = cells[4].textContent.replace(/[^0-9]/g, '');

    const qty = Number(qtyStr) || 0;
    const price = Number(priceStr) || 0;
    const rowTotal = qty * price;

    totalQty += qty;
    totalAmount += rowTotal;

    // 개별 행 총액 업데이트
    cells[5].textContent = `${rowTotal.toLocaleString()}원`;
  });

  document.getElementById('stmt-total-qty').textContent = `${totalQty.toLocaleString()} 장/평`;
  document.getElementById('stmt-total-amount').textContent = `${totalAmount.toLocaleString()}원`;
};

window.printStatement = function() {
  window.print();
};





