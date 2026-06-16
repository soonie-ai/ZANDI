// ZANDI 장부 시스템 - Test Suite (js/tests.js)

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// ==========================================
// 1. Utilities Tests (utils.js)
// ==========================================

test("금액 포맷팅: 숫자 1000 입력 시 1,000으로 반환되는가", () => {
  const result = formatAmountInput("1000");
  if (result !== "1,000") throw new Error(`Expected '1,000' but got '${result}'`);
});

test("금액 포맷팅: 1,234,567 입력 시 콤마가 그대로 유지되는가", () => {
  const result = formatAmountInput("1,234,567");
  if (result !== "1,234,567") throw new Error(`Expected '1,234,567' but got '${result}'`);
});

test("금액 포맷팅: 빈 문자열 입력 시 빈 문자열을 반환하는가", () => {
  const result = formatAmountInput("");
  if (result !== "") throw new Error(`Expected '' but got '${result}'`);
});

test("전화번호 포맷팅: 01012345678 입력 시 하이픈이 자동으로 삽입되는가", () => {
  const result = formatPhoneNumber("01012345678");
  if (result !== "010-1234-5678") throw new Error(`Expected '010-1234-5678' but got '${result}'`);
});

test("전화번호 포맷팅: 021234567 입력 시 서울 지역번호 규격에 맞춰 하이픈이 들어가는가", () => {
  const result = formatPhoneNumber("021234567");
  if (result !== "02-123-4567") throw new Error(`Expected '02-123-4567' but got '${result}'`);
});


// ==========================================
// 2. State & Caching Tests (state.js)
// ==========================================

test("상태 복구: 로컬 스토리지에 데이터가 있을 때 loadState()가 정상 복구하는가", () => {
  const testState = {
    customers: [{ id: 'test-cust', name: '테스트조경', prices: {} }],
    sales: [],
    workers: [],
    attendance: [],
    rents: []
  };
  localStorage.setItem('zandi_ledger_data', JSON.stringify(testState));
  
  loadState();
  
  if (state.customers.length !== 1 || state.customers[0].name !== '테스트조경') {
    throw new Error("상태 복구 로직이 올바르지 않습니다.");
  }
  
  // Clean up
  localStorage.removeItem('zandi_ledger_data');
});

test("정렬 보존: customer_sort_order가 주어졌을 때 순서대로 정렬되는가", () => {
  const testState = {
    customers: [
      { id: 'c-3', name: '삼번', prices: {}, sortOrder: 3 },
      { id: 'c-1', name: '일번', prices: {}, sortOrder: 1 },
      { id: 'c-2', name: '이번', prices: {}, sortOrder: 2 }
    ],
    sales: [],
    workers: [],
    attendance: [],
    rents: []
  };
  localStorage.setItem('zandi_ledger_data', JSON.stringify(testState));
  localStorage.setItem('customer_sort_order', 'c-1,c-2,c-3');
  
  loadState();
  
  if (state.customers[0].id !== 'c-1' || state.customers[1].id !== 'c-2' || state.customers[2].id !== 'c-3') {
    throw new Error("고객 정렬 보존 로직이 올바르지 않습니다.");
  }
  
  // Clean up
  localStorage.removeItem('zandi_ledger_data');
  localStorage.removeItem('customer_sort_order');
});


// ==========================================
// Test Runner Function
// ==========================================
async function runTests() {
  const container = document.getElementById('test-results');
  container.innerHTML = '';
  
  let passed = 0;
  let failed = 0;
  
  for (const t of tests) {
    const div = document.createElement('div');
    div.className = 'p-3 rounded-lg flex items-center justify-between text-xs transition-all duration-300 ';
    
    try {
      await t.fn();
      passed++;
      div.className += 'bg-emerald-950/20 border border-emerald-500/30 text-emerald-400';
      div.innerHTML = `
        <span class="font-medium">✔️ [성공] ${t.name}</span>
        <span class="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">PASS</span>
      `;
    } catch (e) {
      failed++;
      div.className += 'bg-rose-950/20 border border-rose-500/30 text-rose-400';
      div.innerHTML = `
        <div>
          <p class="font-semibold">❌ [실패] ${t.name}</p>
          <p class="text-[10px] text-rose-300/80 mt-1">${e.message}</p>
        </div>
        <span class="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded font-bold">FAIL</span>
      `;
    }
    
    container.appendChild(div);
  }
  
  document.getElementById('total-count').textContent = tests.length;
  document.getElementById('pass-count').textContent = passed;
  document.getElementById('fail-count').textContent = failed;
}

// Run immediately on page load
document.addEventListener('DOMContentLoaded', runTests);
