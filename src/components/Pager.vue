<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{ page: number; pageSize: number; total: number }>()
const emit = defineEmits<{ change: [page: number] }>()

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
</script>

<template>
  <nav v-if="pages > 1" class="pager" aria-label="分页">
    <button type="button" class="pager__btn" :disabled="page <= 1" @click="emit('change', page - 1)">
      {{ t('common.prev') }}
    </button>
    <span class="pager__info mono">{{ page }} / {{ pages }} · {{ t('common.pageInfo', { n: total }) }}</span>
    <button type="button" class="pager__btn" :disabled="page >= pages" @click="emit('change', page + 1)">
      {{ t('common.next') }}
    </button>
  </nav>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.4rem 0.4rem;
}

.pager__btn {
  background: none;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 0.4rem 1rem;
  color: var(--ink);
  font-size: 0.88rem;
  transition: all 0.2s var(--ease-out);
}

.pager__btn:hover:not(:disabled) {
  border-color: var(--cinnabar);
  color: var(--cinnabar-deep);
}

.pager__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pager__info {
  color: var(--ink-faint);
}
</style>