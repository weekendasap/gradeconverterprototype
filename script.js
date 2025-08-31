document.addEventListener('DOMContentLoaded', () => {
  // 공통 요소
  const totalStudentsInput = document.getElementById('g1_total_students');
  const calculateBtn = document.getElementById('calculateBtn');
  const calculateBtnMobile = document.getElementById('calculateBtnMobile');
  const resetBtn = document.getElementById('resetBtn');
  const resetBtnMobile = document.getElementById('resetBtnMobile');

  const validationSummary = document.getElementById('validationSummary');

  const s1ResultsDiv = document.getElementById('s1_results');
  const s2ResultsDiv = document.getElementById('s2_results');
  const overallResultsDiv = document.getElementById('overall_results');

  const pyramidContainer = document.getElementById('pyramid_container');
  const percentileText = document.getElementById('percentile_text');

  // 과목 구성
  const SUBJECTS = [
    { key: 'korean', label: '국어' },
    { key: 'english', label: '영어' },
    { key: 'math', label: '수학' },
    { key: 'social', label: '사회' },
    { key: 'science', label: '과학' }
  ];
  const TERMS = ['s1', 's2']; // 1학기, 2학기

  // 규칙: 5등급제(성취)
  function fiveLevel(score) {
    if (score == null || isNaN(score)) return null;
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  }

  // 규칙: 9등급제(백분위 → 9등급)
  function nineLevelFromPercentile(percentile) {
    if (percentile == null || isNaN(percentile)) return null;
    if (percentile <= 4) return 1;
    if (percentile <= 11) return 2;
    if (percentile <= 23) return 3;
    if (percentile <= 40) return 4;
    if (percentile <= 60) return 5;
    if (percentile <= 77) return 6;
    if (percentile <= 89) return 7;
    if (percentile <= 96) return 8;
    return 9;
  }

  // 유틸: 값 읽기/오류 표시
  function v(id) {
    const el = document.getElementById(id);
    if (!el) return '';
    const raw = el.value;
    return raw === '' ? '' : raw;
  }
  function vNum(id) {
    const raw = v(id);
    if (raw === '') return null;
    const x = parseFloat(raw);
    return isNaN(x) ? null : x;
  }
  function setFieldError(inputId, msg) {
    const inputEl = document.getElementById(inputId);
    if (!inputEl) return;
    const group = inputEl.closest('.input-group');
    const errorElId = inputId + 'Error';
    let errorEl = document.getElementById(errorElId);
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'error-message';
      errorEl.id = errorElId;
      group.appendChild(errorEl);
    }
    if (msg) {
      group && group.classList.add('invalid');
      errorEl.textContent = msg;
    } else {
      group && group.classList.remove('invalid');
      errorEl.textContent = '';
    }
  }
  function clearAllErrors() {
    document.querySelectorAll('.input-group.invalid').forEach(g => g.classList.remove('invalid'));
    document.querySelectorAll('.error-message').forEach(e => (e.textContent = ''));
    validationSummary.textContent = '';
    validationSummary.classList.remove('show');
  }

  // 입력 검증
  function validateInputs() {
    clearAllErrors();
    let hasError = false;

    const totalStudents = vNum('g1_total_students');
    if (totalStudents == null || totalStudents <= 0) {
      setFieldError('g1_total_students', '1 이상의 숫자를 입력하세요.');
      hasError = true;
    }

    // 각 학기/과목 점수와 등수 검증
    ['s1','s2'].forEach(term => {
      ['korean','english','math','social','science'].forEach(key => {
        const scoreId = `${term}_${key}_score`;
        const rankId = `${term}_${key}_rank`;

        // 점수
        const score = v(scoreId);
        if (score !== '') {
          const scoreNum = vNum(scoreId);
          if (scoreNum == null || scoreNum < 0 || scoreNum > 100) {
            setFieldError(scoreId, '0~100 사이의 점수를 입력하세요.');
            hasError = true;
          } else {
            setFieldError(scoreId, '');
          }
        } else {
          setFieldError(scoreId, '');
        }

        // 등수
        const rank = v(rankId);
        if (rank !== '') {
          if (totalStudents == null || totalStudents <= 0) {
            setFieldError(rankId, '');
          } else {
            const r = vNum(rankId);
            if (r == null || r < 1 || r > totalStudents) {
              setFieldError(rankId, `1 이상, 전체 학생 수(${totalStudents}) 이하로 입력하세요.`);
              hasError = true;
            } else {
              setFieldError(rankId, '');
            }
          }
        } else {
          setFieldError(rankId, '');
        }
      });
    });

    if (hasError) {
      validationSummary.textContent = '입력값을 확인하세요.';
      validationSummary.classList.add('show');
    }
    return !hasError;
  }

  // 피라미드 SVG 렌더(단순화)
  function renderPyramid(percentile) {
    const has = percentile != null && !isNaN(percentile);
    const p = has ? Math.max(0, Math.min(100, percentile)) : null;

    const svg = `
      <svg viewBox="0 0 100 120" preserveAspectRatio="none" role="img" aria-label="피라미드 그래프">
        <polygon points="50,10 5,110 95,110" fill="#f4f8ff" stroke="#e1e8ff" stroke-width="0.8"/>
        ${[10,30,50,70,90].map(y => `<line x1="8" x2="92" y1="${y+10}" y2="${y+10}" stroke="#eef2ff" stroke-width="0.6" />`).join('')}
        ${has ? `
          <line x1="5" x2="95" y1="${10 + p}" y2="${10 + p}" stroke="#ff6b6b" stroke-width="1.2" stroke-dasharray="2,2"/>
          <circle cx="50" cy="${10 + p}" r="2" fill="#ff6b6b" />
        ` : ``}
      </svg>
    `;
    pyramidContainer.innerHTML = svg;
    percentileText.textContent = has ? `전교 상위 ${p.toFixed(2)}%` : '전교 상위 퍼센트 표시를 위해 등수를 입력하세요.';
  }

  // 결과 계산/렌더
  function calculate() {
    if (!validateInputs()) {
      s1ResultsDiv.innerHTML = '';
      s2ResultsDiv.innerHTML = '';
      overallResultsDiv.innerHTML = '';
      renderPyramid(null);
      return;
    }

    const totalStudents = vNum('g1_total_students');

    // 누적 통계(종합용)
    let scoreSum = 0, scoreCount = 0;
    let percSum = 0, percCount = 0;

    // 학기별 결과 생성
    ['s1','s2'].forEach(term => {
      const container = term === 's1' ? s1ResultsDiv : s2ResultsDiv;
      container.innerHTML = '';

      [
        { key: 'korean', label: '국어' },
        { key: 'english', label: '영어' },
        { key: 'math', label: '수학' },
        { key: 'social', label: '사회' },
        { key: 'science', label: '과학' }
      ].forEach(sub => {
        const score = vNum(`${term}_${sub.key}_score`);
        const rank = vNum(`${term}_${sub.key}_rank`);

        let parts = [];
        if (score != null) {
          const five = fiveLevel(score);
          parts.push(`점수: ${score}점 → <span class="pill pill-purple">${five}</span>`);
          scoreSum += score; scoreCount++;
        } else {
          parts.push(`점수: -`);
        }

        if (rank != null && totalStudents != null && totalStudents > 0) {
          const percentile = (rank / totalStudents) * 100;
          const nine = nineLevelFromPercentile(percentile);
          parts.push(`전교 등수: ${rank}등 / ${totalStudents}명`);
          parts.push(`상위: <span class="pill pill-blue">${percentile.toFixed(2)}%</span>`);
          parts.push(`9등급: <span class="pill pill-red">${nine}등급</span>`);
          percSum += percentile; percCount++;
        } else {
          parts.push(`등수: -`);
        }

        const itemHTML = `
          <div class="grade-result-item">
            <div class="item-head"><strong>${sub.label}</strong></div>
            <div class="item-body">
              ${parts.join('<br/>')}
            </div>
          </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
      });
    });

    // 종합 결과
    const avgScore = scoreCount > 0 ? (scoreSum / scoreCount) : null;
    const avgScoreFive = avgScore != null ? fiveLevel(avgScore) : null;
    const avgPerc = percCount > 0 ? (percSum / percCount) : null;
    const avgNine = avgPerc != null ? nineLevelFromPercentile(avgPerc) : null;

    overallResultsDiv.innerHTML = `
      <div class="overall-item">
        <div class="overall-title">평균 점수</div>
        <div class="overall-value">${avgScore != null ? avgScore.toFixed(2) + '점' : '-'}</div>
      </div>
      <div class="overall-item">
        <div class="overall-title">종합 5등급제</div>
        <div class="overall-value">${avgScoreFive != null ? `<span class="pill pill-purple big">${avgScoreFive}</span>` : '-'}</div>
      </div>
      <div class="overall-item">
        <div class="overall-title">평균 상위 퍼센트</div>
        <div class="overall-value">${avgPerc != null ? `<span class="pill pill-blue big">${avgPerc.toFixed(2)}%</span>` : '-'}</div>
      </div>
      <div class="overall-item">
        <div class="overall-title">종합 9등급제</div>
        <div class="overall-value">${avgNine != null ? `<span class="pill pill-red big">${avgNine}등급</span>` : '-'}</div>
      </div>
    `;

    renderPyramid(avgPerc);
    document.querySelector('.right-pane')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // 디바운스
  function debounce(fn, delay = 350) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), delay); };
  }
  const debouncedCalc = debounce(calculate, 350);

  // 이벤트 바인딩
  [calculateBtn, calculateBtnMobile].forEach(btn => btn && btn.addEventListener('click', calculate));
  [resetBtn, resetBtnMobile].forEach(btn => btn && btn.addEventListener('click', () => {
    totalStudentsInput.value = '';
    ['s1','s2'].forEach(term => {
      ['korean','english','math','social','science'].forEach(key => {
        const sid = `${term}_${key}_score`;
        const rid = `${term}_${key}_rank`;
        const sEl = document.getElementById(sid);
        const rEl = document.getElementById(rid);
        if (sEl) sEl.value = '';
        if (rEl) rEl.value = '';
      });
    });
    s1ResultsDiv.innerHTML = '';
    s2ResultsDiv.innerHTML = '';
    overallResultsDiv.innerHTML = '';
    clearAllErrors();
    renderPyramid(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));

  // 입력 시 자동 계산
  totalStudentsInput.addEventListener('input', debouncedCalc);
  ['s1','s2'].forEach(term => {
    ['korean','english','math','social','science'].forEach(key => {
      document.getElementById(`${term}_${key}_score`).addEventListener('input', debouncedCalc);
      document.getElementById(`${term}_${key}_rank`).addEventListener('input', debouncedCalc);
    });
  });

  renderPyramid(null);
});