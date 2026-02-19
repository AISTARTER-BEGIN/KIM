/**
 * estimator.js — AI Solution Estimator 핵심 비즈니스 로직
 *
 * 구조:
 *   PRICING_CONFIG       — 모든 옵션 데이터 및 가중치 상수
 *   calculateEstimate()  — 순수 계산 함수 (DOM 비의존)
 *   formatMan()          — 비용 포맷 유틸리티
 *   animateRangeDisplay()— 카운트업 → 범위 형식 애니메이션
 *   renderResult()       — DOM 업데이트 전담
 *   getSelections()      — 폼 선택값 수집
 *   updateResult()       — 선택 → 계산 → 렌더링 파이프라인
 *   init()               — 이벤트 리스너 등록 및 부트스트랩
 */
(function () {
    'use strict';
  
    /* ══════════════════════════════════════════════════════
       PRICING_CONFIG
       이 객체만 수정하면 모든 견적 기준이 반영됨
  
       [정직성 기준]
       실제로 수행한 프로젝트에서 검증된 기술/플랫폼만 포함.
       • 제거된 기술: 데이터 파이프라인, 모니터링 대시보드
       • 제거된 플랫폼: NVIDIA Jetson, x86 Linux 서버, 클라우드(AWS/GCP)
       • 플랫폼은 Raspberry Pi 단독 고정 (선택 UI 불필요)
    ══════════════════════════════════════════════════════ */
    const PRICING_CONFIG = {
  
      /** 아무것도 선택하지 않았을 때의 기본값 */
      base: {
        duration: 4,         // 단위: 주(week)
        cost:     3_000_000, // 단위: 원(KRW)
      },
  
      /**
       * AI 기술 가중치 — 복수 선택 가능
       * 실제 Baby Sleep Monitor AI 프로젝트에서 수행한 기술만 유지
       */
      techs: {
        cv_detection:    { label: 'CV — 객체 감지',    duration: 3, cost: 2_500_000 },
        cv_classification: { label: 'CV — 분류/인식',  duration: 2, cost: 1_800_000 },
        sensor_integration: { label: '센서 데이터 통합', duration: 2, cost: 1_200_000 },
        edge_inference:  { label: '엣지 AI 최적화',    duration: 3, cost: 2_000_000 },
      },
  
      /**
       * 플랫폼 — Raspberry Pi 고정
       * 향후 경험이 쌓이면 여기에 추가
       */
      platforms: {
        rpi: { label: 'Raspberry Pi', duration: 1, cost: 500_000 },
      },
  
      /** 복잡도 배수 — 단일 선택 */
      complexity: {
        simple:   { label: 'Simple',   multiplier: 1.0 },
        standard: { label: 'Standard', multiplier: 1.5 },
        complex:  { label: 'Complex',  multiplier: 2.2 },
      },
  
      /** 결과 범위 계수: base × 0.9 ~ base × 1.2 */
      range: { min: 0.9, max: 1.2 },
    };
  
    /* ══════════════════════════════════════════════════════
       calculateEstimate(selections) — 순수 계산 함수
       입력: { techs: string[], platform: string, complexity: string }
       출력: { durationBase, durationMin, durationMax,
                costBase, costMin, costMax }
       DOM에 의존하지 않아 독립적으로 테스트 가능
    ══════════════════════════════════════════════════════ */
    function calculateEstimate(selections) {
      const { techs, platform, complexity } = selections;
  
      let totalDuration = PRICING_CONFIG.base.duration;
      let totalCost     = PRICING_CONFIG.base.cost;
  
      /* 선택된 기술들의 가중치 합산 */
      techs.forEach(key => {
        const tech = PRICING_CONFIG.techs[key];
        if (tech) {
          totalDuration += tech.duration;
          totalCost     += tech.cost;
        }
      });
  
      /* 플랫폼 가중치 추가 (항상 rpi) */
      const platformConfig = PRICING_CONFIG.platforms[platform];
      if (platformConfig) {
        totalDuration += platformConfig.duration;
        totalCost     += platformConfig.cost;
      }
  
      /* 복잡도 배수 적용 */
      const complexityConfig = PRICING_CONFIG.complexity[complexity];
      const multiplier       = complexityConfig ? complexityConfig.multiplier : 1.5;
      const rawDuration      = totalDuration * multiplier;
      const rawCost          = totalCost     * multiplier;
  
      /* 범위 계산 후 정수 반올림 */
      return {
        durationBase: Math.round(rawDuration),
        durationMin:  Math.round(rawDuration * PRICING_CONFIG.range.min),
        durationMax:  Math.round(rawDuration * PRICING_CONFIG.range.max),
        costBase:     Math.round(rawCost),
        costMin:      Math.round(rawCost * PRICING_CONFIG.range.min),
        costMax:      Math.round(rawCost * PRICING_CONFIG.range.max),
      };
    }
  
    /* ══════════════════════════════════════════════════════
       formatMan(amount) — 비용을 만원 단위 문자열로 변환
       예) 13_500_000 → "1,350만"
    ══════════════════════════════════════════════════════ */
    function formatMan(amount) {
      const man = Math.round(amount / 10_000);
      return man.toLocaleString('ko-KR') + '만';
    }
  
    /* ══════════════════════════════════════════════════════
       animateRangeDisplay(element, min, max, formatter, duration)
       숫자 카운트업 후 "min~max" 형식으로 교체
    ══════════════════════════════════════════════════════ */
    function animateRangeDisplay(element, min, max, formatter, duration) {
      let startTime = null;
  
      function tick(now) {
        if (!startTime) startTime = now;
        const progress = Math.min((now - startTime) / duration, 1);
  
        /* easeOutCubic — 빠르게 시작하고 부드럽게 감속 */
        const eased = 1 - Math.pow(1 - progress, 3);
  
        if (progress < 1) {
          /* 카운트업 진행 중: max 기준으로 증가 */
          element.textContent = formatter(Math.round(max * eased));
          requestAnimationFrame(tick);
        } else {
          /* 완료: min~max 범위 형식으로 교체 */
          element.textContent = formatter(min) + '~' + formatter(max);
        }
      }
  
      requestAnimationFrame(tick);
    }
  
    /* ══════════════════════════════════════════════════════
       renderResult(estimate, selections) — DOM 업데이트 전담
       첫 표시 시 카운터 애니메이션, 이후 변경은 즉시 업데이트
    ══════════════════════════════════════════════════════ */
    function renderResult(estimate, selections) {
      const placeholder  = document.getElementById('resultPlaceholder');
      const card         = document.getElementById('resultCard');
      const durationEl   = document.getElementById('durationDisplay');
      const durationRange= document.getElementById('durationRange');
      const costEl       = document.getElementById('costDisplay');
      const costRange    = document.getElementById('costRange');
      const summaryList  = document.getElementById('summaryList');
  
      if (!card || !placeholder) return;
  
      /* 플레이스홀더 → 결과 카드 전환 여부 확인 */
      const isFirstRender = card.hidden;
      placeholder.hidden  = true;
      card.hidden         = false;
  
      /* 기간 업데이트 */
      if (isFirstRender) {
        animateRangeDisplay(
          durationEl,
          estimate.durationMin, estimate.durationMax,
          v => String(v),
          900
        );
      } else {
        durationEl.textContent = estimate.durationMin + '~' + estimate.durationMax;
      }
      durationRange.textContent =
        '최소 ' + estimate.durationMin + '주 ~ 최대 ' + estimate.durationMax + '주';
  
      /* 비용 업데이트 */
      if (isFirstRender) {
        animateRangeDisplay(
          costEl,
          estimate.costMin, estimate.costMax,
          formatMan,
          900
        );
      } else {
        costEl.textContent = formatMan(estimate.costMin) + '~' + formatMan(estimate.costMax);
      }
      costRange.textContent =
        '최소 ' + formatMan(estimate.costMin) + '원 ~ 최대 ' + formatMan(estimate.costMax) + '원';
  
      /* 선택 항목 요약 목록 — DocumentFragment로 일괄 삽입 */
      const fragment = document.createDocumentFragment();
  
      /* 선택된 기술 항목 */
      selections.techs.forEach(key => {
        const tech = PRICING_CONFIG.techs[key];
        if (tech) {
          const li = document.createElement('li');
          li.textContent = tech.label;
          fragment.appendChild(li);
        }
      });
  
      /* 플랫폼 항목 (고정: Raspberry Pi) */
      const platformConfig = PRICING_CONFIG.platforms[selections.platform];
      if (platformConfig) {
        const li = document.createElement('li');
        li.textContent = '플랫폼: ' + platformConfig.label;
        fragment.appendChild(li);
      }
  
      /* 선택된 복잡도 */
      const complexityConfig = PRICING_CONFIG.complexity[selections.complexity];
      if (complexityConfig) {
        const li = document.createElement('li');
        li.textContent =
          '복잡도: ' + complexityConfig.label +
          ' (×' + complexityConfig.multiplier + ')';
        fragment.appendChild(li);
      }
  
      summaryList.innerHTML = '';
      summaryList.appendChild(fragment);
    }
  
    /* ══════════════════════════════════════════════════════
       getSelections(form) — 폼 현재 선택값 수집
       반환: { techs: string[], platform: 'rpi', complexity: string }
  
       플랫폼은 Raspberry Pi로 항상 고정.
       HTML에서 platform 라디오 버튼 제거 가능.
    ══════════════════════════════════════════════════════ */
    function getSelections(form) {
      const techInputs      = form.querySelectorAll('input[name="techs"]:checked');
      const complexityInput = form.querySelector('input[name="complexity"]:checked');
  
      return {
        techs:      [...techInputs].map(el => el.value),
        platform:   'rpi', // Raspberry Pi 고정
        complexity: complexityInput ? complexityInput.value : 'standard',
      };
    }
  
    /* ══════════════════════════════════════════════════════
       updateResult(form) — 선택 → 계산 → 렌더링 파이프라인
       플랫폼이 고정되었으므로 기술 선택만 있어도 즉시 결과 표시
    ══════════════════════════════════════════════════════ */
    function updateResult(form) {
      const selections = getSelections(form);
      const estimate   = calculateEstimate(selections);
      renderResult(estimate, selections);
    }
  
    /* ══════════════════════════════════════════════════════
       init() — 이벤트 리스너 등록 및 앱 부트스트랩
    ══════════════════════════════════════════════════════ */
    function init() {
      const form = document.getElementById('estimatorForm');
      if (!form) return;
  
      /* 체크박스/라디오 변경 즉시 결과 업데이트 */
      form.addEventListener('change', () => updateResult(form));
  
      /* 페이지 로드 시 기본값(complexity: standard + platform: rpi)으로 초기 렌더 */
      updateResult(form);
    }
  
    document.addEventListener('DOMContentLoaded', init);
  
  }());
  