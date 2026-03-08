import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

export interface CatStore {
  model: {
    mirror: boolean
    single: boolean
    mouseMirror: boolean
    autoReleaseDelay: number
  }
  window: {
    visible: boolean
    passThrough: boolean
    alwaysOnTop: boolean
    scale: number
    opacity: number
    radius: number
    hideOnHover: boolean
    position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  }
}

export const useCatStore = defineStore('cat', () => {
  /* ------------ 폐기된 필드 (추후 삭제) ------------ */

  /** @deprecated `model.mirror` 를 사용하세요 */
  const mirrorMode = ref(false)

  /** @deprecated `model.single` 를 사용하세요 */
  const singleMode = ref(false)

  /** @deprecated `model.mouseMirror` 를 사용하세요 */
  const mouseMirror = ref(false)

  /** @deprecated `window.passThrough` 를 사용하세요 */
  const penetrable = ref(false)

  /** @deprecated `window.alwaysOnTop` 를 사용하세요 */
  const alwaysOnTop = ref(true)

  /** @deprecated `window.scale` 를 사용하세요 */
  const scale = ref(100)

  /** @deprecated `window.opacity` 를 사용하세요 */
  const opacity = ref(100)

  /** @deprecated 데이터 마이그레이션 여부를 표시하며, 이후 버전에서 삭제됩니다 */
  const migrated = ref(false)

  const model = reactive<CatStore['model']>({
    mirror: false,
    single: false,
    mouseMirror: false,
    autoReleaseDelay: 3,
  })

  const window = reactive<CatStore['window']>({
    visible: true,
    passThrough: false,
    alwaysOnTop: false,
    scale: 100,
    opacity: 100,
    radius: 0,
    hideOnHover: false,
    position: 'bottomRight',
  })

  const init = () => {
    if (migrated.value) return

    model.mirror = mirrorMode.value
    model.single = singleMode.value
    model.mouseMirror = mouseMirror.value

    window.visible = true
    window.passThrough = penetrable.value
    window.alwaysOnTop = alwaysOnTop.value
    window.scale = scale.value
    window.opacity = opacity.value

    migrated.value = true
  }

  return {
    migrated,
    model,
    window,
    init,
  }
})
