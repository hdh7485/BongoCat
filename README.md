# BongoCat

<div align="center">

  <div>
    <a href="https://github.com/hdh7485/BongoCat/releases"><img alt="Windows" src="https://img.shields.io/badge/-Windows-blue?style=flat-square&logo=windows&logoColor=white" /></a>
    <a href="https://github.com/hdh7485/BongoCat/releases"><img alt="MacOS" src="https://img.shields.io/badge/-MacOS-black?style=flat-square&logo=apple&logoColor=white" /></a>
    <a href="https://github.com/hdh7485/BongoCat/releases"><img alt="Linux" src="https://img.shields.io/badge/-Linux-yellow?style=flat-square&logo=linux&logoColor=white" /></a>
  </div>

  <p>
    <a href="./LICENSE"><img src="https://img.shields.io/github/license/hdh7485/BongoCat?style=flat-square" /></a>
    <a href="https://github.com/hdh7485/BongoCat/releases/latest"><img src="https://img.shields.io/github/package-json/v/hdh7485/BongoCat?style=flat-square" /></a>
    <a href="https://github.com/hdh7485/BongoCat/releases"><img src="https://img.shields.io/github/downloads/hdh7485/BongoCat/total?style=flat-square" /></a>
  </p>

</div>

키보드, 마우스, 게임패드 입력에 반응하는 귀여운 고양이 데스크탑 앱입니다. macOS, Windows, Linux(x11)를 지원합니다.

| macOS | Windows | Linux(x11) |
| ----- | ------- | ---------- |
| ![macOS](https://i0.hdslb.com/bfs/openplatform/dff276b96d49c5d6c431b74b531aab72191b3d87.png) | ![Windows](https://i0.hdslb.com/bfs/openplatform/a4149b753856ee7f401989da902cf3b5ad35b39e.png) | ![Linux](https://i0.hdslb.com/bfs/openplatform/3b49f961819d3ff63b2b80251c1cc13c27e986b0.png) |

## 주요 기능

- macOS, Windows, Linux(x11) 크로스 플랫폼 지원
- 키보드, 마우스, 게임패드 입력에 맞춰 고양이 동작 실시간 동기화
- 커스텀 Live2D 모델 가져오기 지원
- 완전한 오픈 소스 — 사용자 데이터 수집 없음
- 오프라인 실행 지원

## 다운로드

[GitHub Releases](https://github.com/hdh7485/BongoCat/releases)에서 운영체제에 맞는 파일을 다운로드하세요.

| 운영체제 | 파일 |
| -------- | ---- |
| macOS (Apple Silicon) | `BongoCat_aarch64.dmg` |
| macOS (Intel) | `BongoCat_x64.dmg` |
| Windows 64bit | `BongoCat_x64.exe` |
| Windows 32bit | `BongoCat_x86.exe` |
| Windows ARM64 | `BongoCat_arm64.exe` |
| Linux amd64 (deb) | `BongoCat_amd64.deb` |
| Linux amd64 (rpm) | `BongoCat_x86_64.rpm` |
| Linux amd64 (AppImage) | `BongoCat_amd64.AppImage` |

### 패키지 매니저

**macOS (Homebrew)**
```bash
brew tap hdh7485/BongoCat
brew install --no-quarantine bongo-cat
```

**Linux (AUR)**
```bash
yay -S bongo-cat
```

## 모델

### 커스텀 모델 가져오기

환경설정 > 모델 관리에서 커스텀 Live2D 모델을 가져올 수 있습니다.

### 더 많은 모델

📦 [Awesome-BongoCat](https://github.com/ayangweb/Awesome-BongoCat) 저장소에서 다양한 모델을 탐색하거나 자신의 모델을 공유할 수 있습니다.

### 모델 변환

Bongo-Cat-Mver 형식의 모델을 BongoCat 호환 형식으로 변환하려면:

🔗 [온라인 변환 도구](https://bongocat.vteamer.cc)

## 기술 스택

이 앱은 [Tauri](https://v2.tauri.app/)를 기반으로 만들어졌습니다.

Tauri는 **Rust**로 작성된 크로스 플랫폼 데스크탑 앱 프레임워크입니다. 웹 기술(HTML, CSS, JavaScript)로 UI를 만들고, 시스템 기능은 Rust로 처리합니다. Electron과 비슷한 개념이지만 Chromium을 번들링하지 않고 OS 내장 웹뷰를 사용하기 때문에 **앱 크기가 훨씬 작고 메모리 사용량도 낮습니다**.

## 기여

버그 리포트, 기능 제안, PR 모두 환영합니다. 자세한 내용은 [기여 가이드](.github/CONTRIBUTING.md)를 참고하세요.

## 라이센스

[MIT License](./LICENSE)
