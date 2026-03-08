# 기여 가이드

BongoCat에 관심을 가져주셔서 감사합니다! 기여하기 전에 아래 내용을 먼저 읽어주세요.

## 개발 환경 설정

### 필수 도구

- [Rust](https://v2.tauri.app/start/prerequisites/) — Tauri 빌드에 필요
- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

### 설치 및 실행

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm tauri dev

# 앱 빌드
pnpm tauri build

# 디버그 빌드
pnpm tauri build --debug
```

## 기여 방법

1. 작업할 이슈를 [GitHub Issues](https://github.com/hdh7485/BongoCat/issues)에서 확인하거나 새로 생성합니다.
2. 이슈를 본인에게 할당하여 중복 작업을 방지합니다.
3. 브랜치를 생성하여 작업합니다.
4. PR을 제출합니다.

## 커밋 메시지 규칙

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) 형식을 따릅니다.

| 타입 | 설명 |
| ---- | ---- |
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 수정 |
| `style` | 코드 스타일 변경 (기능 변경 없음) |
| `refactor` | 기능 변경 없는 코드 리팩토링 |
| `perf` | 성능 개선 |
| `chore` | 빌드, 설정 등 기타 변경 |

**예시**
```
feat: 게임패드 진동 피드백 지원 추가
fix: Windows에서 키 해제 이벤트 누락 문제 수정
docs: 설치 가이드 업데이트
```
