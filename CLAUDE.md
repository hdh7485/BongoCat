# BongoCat - Claude 작업 가이드

## 브랜치 정보

- 기본 브랜치: `main` (master에서 변경됨)
- 원격: `git@github.com:hdh7485/BongoCat.git` (SSH 사용)

## 워크플로우 원칙

### 워크트리 사용
번역, 대규모 리팩토링, 여러 파일에 걸친 변경 등 **non-trivial한 작업은 항상 새 워크트리를 생성**하여 진행한다.

```bash
# 워크트리 생성 예시
git worktree add ../<branch-name> -b <branch-name>
```

작업 완료 후 PR 또는 main에 머지한다.
