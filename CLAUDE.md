# Project Overview
이 프로젝트는 DongUk KIM의 AI/ML Engineer 포트폴리오 웹사이트입니다.
Computer Vision 및 Embedded Systems 전문성을 중점으로, SIDS 예방 모니터링 시스템 등 주요 프로젝트를 소개합니다.

# Technology Stack
- Frontend: Vanilla HTML5/CSS3/JavaScript
- Design: Modern CSS Variables, Responsive Design, Smooth Animations
- Deployment: Static Website (GitHub Pages 등)
- Content: AI/ML 프로젝트 포트폴리오
- Features: Email 복사 기능, 숫자 카운터 애니메이션, Intersection Observer

# Commands
## Development
- 로컬 미리보기: `index.html` 파일을 브라우저에서 직접 열기 또는 Live Server 사용
- Git 관리: `git status`, `git add .`, `git commit -m "message"`, `git push`

## File Structure
- `index.html`: 메인 포트폴리오 페이지
- `data.json`: 학습 상태 및 배지 메시지 데이터
- `.gitignore`: Git 제외 파일 설정
- `CLAUDE.md`: 프로젝트 가이드라인 (이 파일)

# Code Style
## Naming Conventions
- **변수명**: camelCase 사용 (예: `userList`, `isActive`)
- **함수명**: 동사로 시작하는 camelCase (예: `getUserData`, `handleClick`)
- **상수**: UPPER_SNAKE_CASE (예: `MAX_COUNT`, `API_URL`)
- **파일명**: kebab-case 또는 camelCase (프로젝트 패턴에 따라 통일)

## Code Quality
- 모든 변수와 함수는 의미를 명확히 전달할 수 있는 영어 단어 사용
- 약어 사용 최소화 (btn → button, idx → index)

## Comments
- 주석은 한글로 작성
- 복잡한 로직이나 의도가 명확하지 않은 코드에 설명 추가
- 주석 형식:
  ```javascript
  // 단일 행 주석: 간단한 설명
  
  /**
   * 여러 행 주석: 함수 설명
   * @param {string} userId - 사용자 ID
   * @returns {object} 사용자 정보 객체
   */
