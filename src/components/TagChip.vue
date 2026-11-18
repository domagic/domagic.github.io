<script setup lang="ts">
defineProps<{ name: string; count?: number; active?: boolean }>()
defineEmits<{ select: [name: string] }>()
</script>

<template>
  <button
    type="button"
    class="chip"
    :class="{ 'chip--active': active }"
    :aria-pressed="active"
    @click="$emit('select', name)"
  >
    #{{ name }}<span v-if="count !== undefined" class="chip__count">{{ count }}</span>
  </button>
</template>

<style scoped>
.chip {
  border: 1px solid var(--line);
  background: none;
  border-radius: 999px;
  padding: 0.25rem 0.8rem;
  font-size: 0.82rem;
  color: var(--ink-soft);
  transition: all 0.2s var(--ease-out);
}

.chip:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar-deep);
}

.chip--active {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #f6f1e7;
}

.chip__count {
  margin-left: 0.35rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  opacity: 0.75;
}
</style>