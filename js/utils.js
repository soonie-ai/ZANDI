// ZANDI 장부 시스템 - Utilities (js/utils.js)

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

/**
 * 금액 필드에 콤마 포맷 및 포커스 시 선택/지우기 이벤트 연결
 */
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

