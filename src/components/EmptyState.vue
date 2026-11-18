<script setup lang="ts">
defineProps<{ title?: string; note?: string }>()
</script>

<template>
  <div class="empty" role="status">
    <span class="empty__mark" aria-hidden="true">空</span>
    <p class="empty__title">{{ title ?? '这里还什么都没有' }}</p>
    <p v-if="note" class="empty__note">{{ note }}</p>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 3.5rem 1rem;
  color: var(--ink-soft);
}

.empty__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border: 1px dashed var(--line-strong);
  border-radius: 50%;
  font-family: var(--font-serif-sc);
  color: var(--ink-faint);
  margin-bottom: 0.9rem;
}

.empty__title {
  font-weight: 500;
}

.empty__note {
  font-size: 0.88rem;
  color: var(--ink-faint);
  margin-top: 0.3rem;
}
</style>