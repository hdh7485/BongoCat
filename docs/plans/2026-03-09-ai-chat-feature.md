# AI Chat Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** OpenAI API를 연동하여 고양이와 대화할 수 있는 말풍선 채팅 기능을 추가한다.

**Architecture:** Rust 백엔드에서 OpenAI API를 호출(API 키 보안)하고, 프론트엔드 Vue 컴포넌트가 말풍선 UI를 렌더링한다. 고양이 창 위쪽으로 말풍선 영역을 동적으로 확장하여 별도 창 없이 구현한다. Pinia 스토어로 상태 관리, tauri-plugin-pinia로 API 키와 설정 영속화한다.

**Tech Stack:** Rust (reqwest, tokio), Vue 3, Pinia, Tauri v2, tauri-plugin-global-shortcut, OpenAI Chat Completions API

---

## 전체 태스크 목록

1. Rust: reqwest 추가 및 openai 모듈 생성
2. Rust: 타이머 모듈 생성
3. Frontend: AI Pinia 스토어 생성
4. Frontend: SpeechBubble 컴포넌트 생성
5. Frontend: useAi 컴포저블 생성
6. Frontend: 메인 창에 말풍선 통합
7. Frontend: AI 환경설정 탭 추가
8. Frontend: 단축키 스토어 & UI에 채팅 토글 추가
9. Frontend: i18n 문자열 추가

---

### Task 1: Rust — reqwest 추가 및 openai 모듈 생성

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/core/openai.rs`
- Modify: `src-tauri/src/core/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Cargo.toml에 reqwest 추가**

`src-tauri/Cargo.toml`의 `[dependencies]` 섹션에 추가:

```toml
reqwest = { version = "0.12", features = ["json"] }
tokio = { version = "1", features = ["full"] }
```

**Step 2: openai.rs 생성**

`src-tauri/src/core/openai.rs` 신규 생성:

```rust
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<ChatMessage>,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: ChatMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[tauri::command]
pub async fn chat_with_openai(
    _app: AppHandle,
    api_key: String,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    let client = reqwest::Client::new();

    let request_body = OpenAIRequest {
        model: "gpt-4o-mini".to_string(),
        messages,
    };

    let response = client
        .post("https://api.openai.com/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("네트워크 오류: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        return Err(format!("OpenAI API 오류 {}: {}", status, text));
    }

    let openai_response: OpenAIResponse = response
        .json()
        .await
        .map_err(|e| format!("응답 파싱 오류: {}", e))?;

    openai_response
        .choices
        .into_iter()
        .next()
        .map(|c| c.message.content)
        .ok_or_else(|| "빈 응답".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_message_serialization() {
        let msg = ChatMessage {
            role: "user".to_string(),
            content: "안녕!".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("user"));
        assert!(json.contains("안녕!"));
    }
}
```

**Step 3: core/mod.rs에 openai 모듈 추가**

`src-tauri/src/core/mod.rs`를 확인 후, openai 모듈 선언 추가:

```rust
pub mod openai;
```

**Step 4: lib.rs에 커맨드 등록**

`src-tauri/src/lib.rs`에서:
```rust
use core::openai::chat_with_openai;
// ...
.invoke_handler(generate_handler![
    copy_dir,
    start_device_listening,
    start_gamepad_listing,
    stop_gamepad_listing,
    chat_with_openai,  // 추가
])
```

**Step 5: 빌드 확인**

```bash
cd src-tauri && cargo check
```
Expected: 오류 없음

**Step 6: 단위 테스트 실행**

```bash
cd src-tauri && cargo test
```
Expected: `test_chat_message_serialization ... ok`

**Step 7: 커밋**

```bash
git add src-tauri/Cargo.toml src-tauri/src/core/openai.rs src-tauri/src/core/mod.rs src-tauri/src/lib.rs
git commit -m "feat: OpenAI API 호출 Tauri 커맨드 추가"
```

---

### Task 2: Rust — 타이머 모듈 생성

**Files:**
- Create: `src-tauri/src/core/ai_timer.rs`
- Modify: `src-tauri/src/core/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: ai_timer.rs 생성**

```rust
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct AiTimerState {
    pub running: bool,
}

#[tauri::command]
pub async fn start_ai_timer(app: AppHandle, interval_minutes: u64) {
    let app_clone = app.clone();
    let interval = Duration::from_secs(interval_minutes * 60);

    std::thread::spawn(move || loop {
        std::thread::sleep(interval);
        let _ = app_clone.emit("ai-timer-tick", ());
    });
}

#[tauri::command]
pub fn stop_ai_timer() {
    // 타이머 정지는 프론트엔드에서 이벤트 언리스닝으로 처리
}
```

**Step 2: mod.rs에 ai_timer 추가**

```rust
pub mod ai_timer;
```

**Step 3: lib.rs에 커맨드 등록**

```rust
use core::ai_timer::{start_ai_timer, stop_ai_timer};
// ...
.invoke_handler(generate_handler![
    copy_dir,
    start_device_listening,
    start_gamepad_listing,
    stop_gamepad_listing,
    chat_with_openai,
    start_ai_timer,
    stop_ai_timer,
])
```

**Step 4: 빌드 확인**

```bash
cd src-tauri && cargo check
```

**Step 5: 커밋**

```bash
git add src-tauri/src/core/ai_timer.rs src-tauri/src/core/mod.rs src-tauri/src/lib.rs
git commit -m "feat: AI 타이머 Tauri 커맨드 추가"
```

---

### Task 3: Frontend — AI Pinia 스토어 생성

**Files:**
- Create: `src/stores/ai.ts`

**Step 1: ai.ts 생성**

```typescript
import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type PersonalityPreset = 'cute' | 'helpful' | 'playful'

export interface AiStore {
  apiKey: string
  personalityPresets: PersonalityPreset[]
  customPersonality: string
  proactiveEnabled: boolean
  proactiveIntervalMinutes: number
}

const PERSONALITY_PROMPTS: Record<PersonalityPreset, string> = {
  cute: '당신은 귀엽고 애교 있는 고양이입니다. 짧고 귀엽게 답하며 가끔 냥~ 같은 고양이 소리를 냅니다.',
  helpful: '당신은 친절하고 도움이 되는 고양이 친구입니다. 질문에 성실하게 답하되 친근한 말투를 사용합니다.',
  playful: '당신은 장난꾸러기 고양이입니다. 유머 있게 답하고 가끔 엉뚱한 말을 합니다.',
}

export const useAiStore = defineStore('ai', () => {
  const apiKey = ref('')
  const personalityPresets = ref<PersonalityPreset[]>(['cute'])
  const customPersonality = ref('')
  const proactiveEnabled = ref(true)
  const proactiveIntervalMinutes = ref(30)
  const chatVisible = ref(false)
  const messages = ref<ChatMessage[]>([])

  const systemPrompt = () => {
    const parts: string[] = personalityPresets.value.map(p => PERSONALITY_PROMPTS[p])
    if (customPersonality.value.trim()) {
      parts.push(customPersonality.value.trim())
    }
    return parts.join(' ') || PERSONALITY_PROMPTS.cute
  }

  const buildMessages = (userMessage?: string): ChatMessage[] => {
    const history = messages.value.slice(-10) // 최근 10개만 컨텍스트로 사용
    const result: ChatMessage[] = [
      { role: 'system', content: systemPrompt() },
      ...history,
    ]
    if (userMessage) {
      result.push({ role: 'user', content: userMessage })
    }
    return result
  }

  const addMessage = (msg: ChatMessage) => {
    messages.value.push(msg)
    if (messages.value.length > 20) {
      messages.value = messages.value.slice(-20)
    }
  }

  const clearMessages = () => {
    messages.value = []
  }

  return {
    apiKey,
    personalityPresets,
    customPersonality,
    proactiveEnabled,
    proactiveIntervalMinutes,
    chatVisible,
    messages,
    systemPrompt,
    buildMessages,
    addMessage,
    clearMessages,
  }
})
```

**Step 2: 커밋**

```bash
git add src/stores/ai.ts
git commit -m "feat: AI Pinia 스토어 추가"
```

---

### Task 4: Frontend — SpeechBubble 컴포넌트 생성

**Files:**
- Create: `src/components/speech-bubble/index.vue`

**Step 1: speech-bubble 컴포넌트 생성**

```vue
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  message: string
  showInput?: boolean
  autoDismissMs?: number
}>(), {
  showInput: false,
  autoDismissMs: 0,
})

const emit = defineEmits<{
  send: [text: string]
  dismiss: []
}>()

const displayed = ref('')
const inputText = ref('')
const inputRef = ref<HTMLInputElement>()
let typewriterTimer: ReturnType<typeof setTimeout> | null = null
let dismissTimer: ReturnType<typeof setTimeout> | null = null

function startTypewriter(text: string) {
  displayed.value = ''
  let i = 0
  const tick = () => {
    if (i < text.length) {
      displayed.value += text[i++]
      typewriterTimer = setTimeout(tick, 30)
    }
  }
  tick()
}

function clearTimers() {
  if (typewriterTimer) clearTimeout(typewriterTimer)
  if (dismissTimer) clearTimeout(dismissTimer)
}

watch(() => props.message, (val) => {
  clearTimers()
  startTypewriter(val)
  if (props.autoDismissMs > 0) {
    dismissTimer = setTimeout(() => emit('dismiss'), props.autoDismissMs)
  }
}, { immediate: true })

onMounted(() => {
  if (props.showInput) {
    inputRef.value?.focus()
  }
})

onUnmounted(clearTimers)

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return
  emit('send', text)
  inputText.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') handleSend()
  if (e.key === 'Escape') emit('dismiss')
}
</script>

<template>
  <div class="speech-bubble-wrapper">
    <div class="speech-bubble">
      <span class="message">{{ displayed }}</span>
      <span v-if="displayed.length < message.length" class="cursor">|</span>

      <div v-if="showInput" class="input-area">
        <input
          ref="inputRef"
          v-model="inputText"
          class="chat-input"
          placeholder="메시지를 입력하세요..."
          @keydown="handleKeydown"
        >
        <button class="send-btn" @click="handleSend">
          전송
        </button>
      </div>
    </div>
    <div class="bubble-tail" />
  </div>
</template>

<style scoped>
.speech-bubble-wrapper {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  z-index: 100;
  padding-bottom: 4px;
}

.speech-bubble {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 16px;
  padding: 10px 14px;
  max-width: 260px;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  word-break: break-word;
}

.cursor {
  animation: blink 0.7s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.input-area {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  border-top: 1px solid #eee;
  padding-top: 8px;
}

.chat-input {
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 12px;
  outline: none;
}

.chat-input:focus {
  border-color: #aaa;
}

.send-btn {
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.send-btn:hover {
  background: #357abd;
}

.bubble-tail {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #e0e0e0;
  position: relative;
}

.bubble-tail::after {
  content: '';
  position: absolute;
  top: -12px;
  left: -6px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid white;
}
</style>
```

**Step 2: 커밋**

```bash
git add src/components/speech-bubble/index.vue
git commit -m "feat: SpeechBubble 컴포넌트 추가"
```

---

### Task 5: Frontend — useAi 컴포저블 생성

**Files:**
- Create: `src/composables/useAi.ts`

**Step 1: useAi.ts 생성**

```typescript
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { onUnmounted, ref } from 'vue'

import { useAiStore } from '@/stores/ai'

export function useAi() {
  const aiStore = useAiStore()
  const isLoading = ref(false)
  const currentMessage = ref('')
  const showBubble = ref(false)
  const showInput = ref(false)
  let unlistenTimer: (() => void) | null = null

  async function sendMessage(userText: string) {
    if (!aiStore.apiKey) {
      currentMessage.value = 'API 키가 설정되지 않았어요. 환경설정 > AI 탭에서 설정해주세요!'
      showBubble.value = true
      showInput.value = false
      return
    }

    aiStore.addMessage({ role: 'user', content: userText })
    isLoading.value = true
    showInput.value = false
    currentMessage.value = '생각 중...'
    showBubble.value = true

    try {
      const messages = aiStore.buildMessages()
      const response = await invoke<string>('chat_with_openai', {
        apiKey: aiStore.apiKey,
        messages,
      })

      currentMessage.value = response
      aiStore.addMessage({ role: 'assistant', content: response })
    }
    catch (e) {
      currentMessage.value = `오류가 발생했어요: ${e}`
    }
    finally {
      isLoading.value = false
    }
  }

  async function sendProactiveMessage() {
    if (!aiStore.apiKey) return

    const hour = new Date().getHours()
    const timeContext = hour < 12 ? '오전' : hour < 18 ? '오후' : '저녁'
    const prompt = `지금은 ${timeContext}이에요. 사용자에게 먼저 짧게 말을 걸어보세요. 1-2문장으로 짧게.`

    isLoading.value = true
    showInput.value = false
    currentMessage.value = '...'
    showBubble.value = true

    try {
      const messages = aiStore.buildMessages(prompt)
      const response = await invoke<string>('chat_with_openai', {
        apiKey: aiStore.apiKey,
        messages,
      })
      currentMessage.value = response
    }
    catch {
      closeBubble()
    }
    finally {
      isLoading.value = false
    }
  }

  function openChat() {
    showBubble.value = true
    showInput.value = true
    currentMessage.value = currentMessage.value || '안녕! 뭐 도와줄까요? 냥~'
  }

  function closeBubble() {
    showBubble.value = false
    showInput.value = false
  }

  async function startTimer() {
    if (!aiStore.proactiveEnabled) return

    await invoke('start_ai_timer', {
      intervalMinutes: aiStore.proactiveIntervalMinutes,
    })

    unlistenTimer = await listen('ai-timer-tick', () => {
      sendProactiveMessage()
    })
  }

  function stopTimer() {
    unlistenTimer?.()
    unlistenTimer = null
    invoke('stop_ai_timer')
  }

  onUnmounted(stopTimer)

  return {
    isLoading,
    currentMessage,
    showBubble,
    showInput,
    sendMessage,
    openChat,
    closeBubble,
    startTimer,
    stopTimer,
    sendProactiveMessage,
  }
}
```

**Step 2: 커밋**

```bash
git add src/composables/useAi.ts
git commit -m "feat: useAi 컴포저블 추가"
```

---

### Task 6: Frontend — 메인 창에 말풍선 통합

**Files:**
- Modify: `src/pages/main/index.vue`

**Step 1: main/index.vue 수정**

`<script setup>` 상단 import에 추가:
```typescript
import SpeechBubble from '@/components/speech-bubble/index.vue'
import { useAi } from '@/composables/useAi'
```

`useAi` 초기화 (기존 변수 선언 아래):
```typescript
const { currentMessage, showBubble, showInput, openChat, closeBubble, sendMessage, startTimer } = useAi()
```

`onMounted`에 `startTimer()` 추가:
```typescript
onMounted(async () => {
  startListening()
  await startTimer()
})
```

기존 `handleMouseDown` 함수를 수정하여 클릭 시 채팅 열기:
```typescript
function handleMouseDown(event: MouseEvent) {
  // 우클릭이나 드래그가 아닌 단순 클릭이면 채팅 열기
  if (event.button === 0) {
    const startX = event.clientX
    const startY = event.clientY

    const handleMouseUp = (upEvent: MouseEvent) => {
      const dx = Math.abs(upEvent.clientX - startX)
      const dy = Math.abs(upEvent.clientY - startY)
      if (dx < 5 && dy < 5) {
        openChat()
      }
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mouseup', handleMouseUp)
    appWindow.startDragging()
  }
}
```

`<template>` 내 최상위 div에 SpeechBubble 추가:
```html
<div
  v-show="isMounted"
  class="relative size-screen overflow-hidden children:(absolute size-full)"
  ...
>
  <!-- 기존 내용 유지 -->

  <!-- 말풍선: 고양이 위에 표시 -->
  <div
    v-if="showBubble"
    class="absolute inset-x-0 top-0 flex justify-center"
    style="transform: translateY(-100%);"
  >
    <SpeechBubble
      :auto-dismiss-ms="showInput ? 0 : 10000"
      :message="currentMessage"
      :show-input="showInput"
      @dismiss="closeBubble"
      @send="sendMessage"
    />
  </div>
</div>
```

> **주의:** 말풍선이 창 밖으로 나가도록 하려면 `overflow-hidden` 클래스를 제거하거나, 부모 div에서 말풍선을 밖으로 꺼내야 할 수 있습니다. `overflow: visible`로 변경하거나, 말풍선을 `position: fixed`로 처리하세요.

실제로는 말풍선 위치가 고양이 창 바깥에 표시되어야 하므로, 아래와 같이 `position: fixed`를 사용하는 방법이 더 안정적입니다. `useAi` 컴포저블에서 창의 위치와 크기를 감지하여 말풍선 위치를 계산합니다.

`src/composables/useAi.ts`에 위치 계산 로직 추가:
```typescript
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

const bubbleStyle = ref({ bottom: '0px', left: '50%' })

async function updateBubblePosition() {
  const win = getCurrentWebviewWindow()
  const pos = await win.outerPosition()
  const size = await win.outerSize()
  bubbleStyle.value = {
    bottom: `${window.screen.height - pos.y}px`,
    left: `${pos.x + size.width / 2}px`,
  }
}
```

**Step 2: 수동 테스트**

```bash
pnpm tauri dev
```

- 고양이 클릭 → 말풍선 + 입력창이 나타나는지 확인
- 메시지 입력 후 Enter → API 응답이 말풍선에 표시되는지 확인
- Esc → 말풍선이 닫히는지 확인

**Step 3: 커밋**

```bash
git add src/pages/main/index.vue src/composables/useAi.ts
git commit -m "feat: 메인 창에 AI 말풍선 채팅 통합"
```

---

### Task 7: Frontend — AI 환경설정 탭 추가

**Files:**
- Create: `src/pages/preference/components/ai/index.vue`
- Modify: `src/pages/preference/index.vue`

**Step 1: AI 설정 컴포넌트 생성**

`src/pages/preference/components/ai/index.vue`:

```vue
<script setup lang="ts">
import { Checkbox, Input, InputNumber, Switch, Textarea } from 'ant-design-vue'
import { computed } from 'vue'

import ProList from '@/components/pro-list/index.vue'
import ProListItem from '@/components/pro-list-item/index.vue'
import { useAiStore } from '@/stores/ai'

const aiStore = useAiStore()

const PRESETS = [
  { value: 'cute', label: '귀엽고 짧게', description: '냥~ 같은 고양이 소리와 함께 귀엽게 답해요' },
  { value: 'helpful', label: '도움이 되는 친구', description: '질문에 성실하게 답하는 친근한 친구예요' },
  { value: 'playful', label: '장난꾸러기', description: '유머 있고 엉뚱한 답변을 해요' },
] as const

const hasCustom = computed(() => aiStore.personalityPresets.length === 0 || aiStore.customPersonality.trim())

function togglePreset(preset: 'cute' | 'helpful' | 'playful') {
  const idx = aiStore.personalityPresets.indexOf(preset)
  if (idx === -1) {
    aiStore.personalityPresets.push(preset)
  } else {
    aiStore.personalityPresets.splice(idx, 1)
  }
}
</script>

<template>
  <ProList title="AI 설정">
    <ProListItem
      description="OpenAI 플랫폼(platform.openai.com)에서 발급받은 API 키를 입력하세요."
      title="OpenAI API 키"
    >
      <Input.Password
        v-model:value="aiStore.apiKey"
        placeholder="sk-..."
        style="width: 200px"
      />
    </ProListItem>
  </ProList>

  <ProList title="고양이 성격">
    <ProListItem
      v-for="preset in PRESETS"
      :key="preset.value"
      :description="preset.description"
      :title="preset.label"
    >
      <Checkbox
        :checked="aiStore.personalityPresets.includes(preset.value)"
        @change="togglePreset(preset.value)"
      />
    </ProListItem>

    <ProListItem
      description="직접 시스템 프롬프트를 작성합니다. 위 프리셋과 함께 적용됩니다."
      title="직접 작성"
    >
      <template #default>
        <Textarea
          v-model:value="aiStore.customPersonality"
          :auto-size="{ minRows: 2, maxRows: 5 }"
          placeholder="예: 당신은 개발자를 응원하는 고양이입니다..."
          style="width: 100%; margin-top: 8px;"
        />
      </template>
    </ProListItem>
  </ProList>

  <ProList title="먼저 말 걸기">
    <ProListItem
      description="고양이가 주기적으로 먼저 말을 겁니다."
      title="활성화"
    >
      <Switch v-model:checked="aiStore.proactiveEnabled" />
    </ProListItem>

    <ProListItem
      v-if="aiStore.proactiveEnabled"
      description="고양이가 말을 거는 간격을 설정합니다."
      title="간격 (분)"
    >
      <InputNumber
        v-model:value="aiStore.proactiveIntervalMinutes"
        :max="120"
        :min="5"
        :step="5"
      />
    </ProListItem>
  </ProList>
</template>
```

**Step 2: preference/index.vue 메뉴에 AI 탭 추가**

`src/pages/preference/index.vue`의 `<script setup>`에 import 추가:
```typescript
import Ai from './components/ai/index.vue'
```

`menus` 배열에 항목 추가 (Shortcut 전에 삽입):
```typescript
{
  label: 'AI',
  icon: 'i-solar:star-shine-bold',
  component: Ai,
},
```

**Step 3: 수동 테스트**

```bash
pnpm tauri dev
```

- 환경설정 > AI 탭이 표시되는지 확인
- API 키 입력 후 저장 → 앱 재시작 후에도 유지되는지 확인
- 성격 프리셋 복수 선택 동작 확인

**Step 4: 커밋**

```bash
git add src/pages/preference/components/ai/index.vue src/pages/preference/index.vue
git commit -m "feat: AI 환경설정 탭 추가"
```

---

### Task 8: Frontend — 단축키에 채팅 토글 추가

**Files:**
- Modify: `src/stores/shortcut.ts`
- Modify: `src/pages/preference/components/shortcut/index.vue`

**Step 1: shortcut store에 toggleChat 추가**

`src/stores/shortcut.ts`:
```typescript
const toggleChat = ref('')

return {
  visibleCat,
  visiblePreference,
  mirrorMode,
  penetrable,
  alwaysOnTop,
  toggleChat,  // 추가
}
```

**Step 2: shortcut/index.vue에 채팅 단축키 등록**

```typescript
const { visibleCat, visiblePreference, mirrorMode, penetrable, alwaysOnTop, toggleChat } = storeToRefs(shortcutStore)
const { openChat, closeBubble, showBubble } = useAi()

useTauriShortcut(toggleChat, () => {
  showBubble.value ? closeBubble() : openChat()
})
```

template에 ProShortcut 항목 추가:
```html
<ProShortcut
  v-model="shortcutStore.toggleChat"
  description="AI 채팅 창을 열거나 닫습니다."
  title="AI 채팅 토글"
/>
```

**Step 3: 수동 테스트**

- 환경설정 > 단축키 > "AI 채팅 토글"에 단축키 설정
- 해당 단축키로 채팅창 토글 확인

**Step 4: 커밋**

```bash
git add src/stores/shortcut.ts src/pages/preference/components/shortcut/index.vue
git commit -m "feat: AI 채팅 토글 단축키 추가"
```

---

### Task 9: Frontend — i18n 문자열 추가

**Files:**
- Modify: `src/locales/zh-CN.json` (현재 한국어 번역본으로 사용 중)
- Modify: `src/locales/en-US.json`

**Step 1: zh-CN.json에 AI 관련 문자열 추가**

`"pages"` > `"preference"` 아래에 추가:
```json
"ai": {
  "title": "AI",
  "labels": {
    "apiKey": "OpenAI API 키",
    "personality": "고양이 성격",
    "customPersonality": "직접 작성",
    "proactive": "먼저 말 걸기",
    "proactiveInterval": "간격 (분)"
  },
  "hints": {
    "apiKey": "OpenAI 플랫폼에서 발급받은 API 키를 입력하세요.",
    "customPersonality": "직접 시스템 프롬프트를 작성합니다. 위 프리셋과 함께 적용됩니다.",
    "proactive": "고양이가 주기적으로 먼저 말을 겁니다.",
    "proactiveInterval": "고양이가 말을 거는 간격을 설정합니다."
  },
  "presets": {
    "cute": "귀엽고 짧게",
    "helpful": "도움이 되는 친구",
    "playful": "장난꾸러기"
  }
}
```

`"pages"` > `"shortcut"` > `"labels"`에 추가:
```json
"toggleChat": "AI 채팅 토글"
```

`"pages"` > `"shortcut"` > `"hints"`에 추가:
```json
"toggleChat": "AI 채팅 창을 열거나 닫습니다."
```

**Step 2: en-US.json에도 동일하게 영어로 추가**

`src/locales/en-US.json` 읽고 동일 구조에 영어 번역 추가.

**Step 3: 컴포넌트에서 $t() 사용으로 교체**

`src/pages/preference/components/ai/index.vue`에서 하드코딩된 한국어 문자열을 `$t('pages.preference.ai.labels.apiKey')` 등으로 교체.

**Step 4: 커밋**

```bash
git add src/locales/ src/pages/preference/components/ai/index.vue
git commit -m "feat: AI 기능 i18n 문자열 추가"
```

---

## 완료 후 확인 사항

- [ ] 고양이 클릭 → 말풍선 + 입력창 표시
- [ ] 메시지 입력 → OpenAI 응답 표시
- [ ] 타이머 → 설정 간격마다 고양이가 먼저 말 걸기
- [ ] 단축키로 채팅 토글
- [ ] 환경설정 > AI 탭에서 API 키 / 성격 / 타이머 설정 가능
- [ ] 앱 재시작 후에도 설정 유지 (Pinia persist)
- [ ] API 키 미설정 시 안내 메시지 표시
