import type { Theme } from '@tauri-apps/api/window'

import { defineStore } from 'pinia'
import { getLocale } from 'tauri-plugin-locale-api'
import { reactive, ref } from 'vue'

import { LANGUAGE } from '@/constants'

export type Language = typeof LANGUAGE[keyof typeof LANGUAGE]

export interface GeneralStore {
  app: {
    autostart: boolean
    taskbarVisible: boolean
  }
  appearance: {
    theme: 'auto' | Theme
    isDark: boolean
    language?: Language
  }
  update: {
    autoCheck: boolean
  }
}

export const useGeneralStore = defineStore('general', () => {
  /* ------------ 폐기된 필드 (추후 삭제) ------------ */

  /** @deprecated `update.autoCheck` 를 사용하세요 */
  const autoCheckUpdate = ref(false)

  /** @deprecated `app.autostart` 를 사용하세요 */
  const autostart = ref(false)

  /** @deprecated `app.taskbarVisible` 를 사용하세요 */
  const taskbarVisibility = ref(false)

  /** @deprecated `appearance.theme` 를 사용하세요 */
  const theme = ref<'auto' | Theme>('auto')

  /** @deprecated `appearance.isDark` 를 사용하세요 */
  const isDark = ref(false)

  /** @deprecated 데이터 마이그레이션 여부를 표시하며, 이후 버전에서 삭제됩니다 */
  const migrated = ref(false)

  const app = reactive<GeneralStore['app']>({
    autostart: false,
    taskbarVisible: false,
  })

  const appearance = reactive<GeneralStore['appearance']>({
    theme: 'auto',
    isDark: false,
  })

  const update = reactive<GeneralStore['update']>({
    autoCheck: false,
  })

  const getLanguage = async () => {
    const locale = await getLocale<Language>()

    if (Object.values(LANGUAGE).includes(locale)) {
      return locale
    }

    return LANGUAGE.EN_US
  }

  const init = async () => {
    appearance.language ??= await getLanguage()

    if (migrated.value) return

    app.autostart = autostart.value
    app.taskbarVisible = taskbarVisibility.value

    appearance.theme = theme.value
    appearance.isDark = isDark.value

    update.autoCheck = autoCheckUpdate.value

    migrated.value = true
  }

  return {
    migrated,
    app,
    appearance,
    update,
    init,
  }
})
