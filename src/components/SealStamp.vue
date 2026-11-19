<script setup lang="ts">
withDefaults(defineProps<{ char?: string; size?: 'sm' | 'lg'; animated?: boolean }>(), {
  char: '魔',
  size: 'lg',
  animated: false,
})
</script>

<template>
  <span class="seal" :class="[`seal--${size}`, { 'seal--animated': animated }]" aria-hidden="true">
    <span class="seal__char">{{ char }}</span>
  </span>
</template>

<style scoped>
.seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--seal, var(--cinnabar)), var(--seal-deep, var(--cinnabar-deep)));
  color: #f6f1e7;
  border-radius: 6px;
  transform: rotate(-3deg);
  box-shadow: var(--shadow-soft);
  user-select: none;
}

.seal--lg {
  width: clamp(4.5rem, 9vw, 6.5rem);
  height: clamp(4.5rem, 9vw, 6.5rem);
}

.seal--sm {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 4px;
}

.seal__char {
  font-family: var(--font-serif-sc);
  font-weight: 900;
  line-height: 1;
}

.seal--lg .seal__char {
  font-size: clamp(2.4rem, 5vw, 3.6rem);
}

.seal--sm .seal__char {
  font-size: 1.15rem;
}

.seal--animated {
  /* T7-③：合成器层动画，避免逐帧主线程任务抬高 TBT 并推迟 LCP。 */
  will-change: transform, opacity;
  animation: stamp 0.9s var(--ease-out) 0.5s both;
}

@keyframes stamp {
  0% {
    opacity: 0;
    transform: rotate(-3deg) scale(1.6);
  }
  60% {
    opacity: 1;
    transform: rotate(-3deg) scale(0.94);
  }
  100% {
    opacity: 1;
    transform: rotate(-3deg) scale(1);
  }
}
</style>