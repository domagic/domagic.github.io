<script setup lang="ts">
defineProps<{ kicker?: string; title: string; note?: string }>()
</script>

<template>
  <header class="section-head">
    <span v-if="kicker" class="section-head__kicker mono">{{ kicker }}</span>
    <div class="section-head__row">
      <h2 class="section-head__title">{{ title }}</h2>
      <span class="section-head__rule" aria-hidden="true"></span>
      <slot name="action" />
    </div>
    <p v-if="note" class="section-head__note">{{ note }}</p>
  </header>
</template>

<style scoped>
.section-head {
  margin-bottom: 2rem;
}

.section-head__kicker {
  color: var(--cinnabar-deep);
  display: block;
  margin-bottom: 0.5rem;
}

.section-head__row {
  display: flex;
  align-items: baseline;
  gap: 1.25rem;
}

.section-head__title {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  white-space: nowrap;
}

.section-head__rule {
  flex: 1;
  border-top: 1px solid var(--line-strong);
  transform: translateY(-0.35rem);
}

.section-head__note {
  margin-top: 0.6rem;
  color: var(--ink-soft);
  font-size: 0.92rem;
}
</style>