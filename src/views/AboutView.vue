<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api, type Profile } from '@/api'
import { ABOUT_VISIBILITY, SEAL_VISIBLE } from '@/config/site'
import { useSeo } from '@/composables/useSeo'
import SectionHead from '@/components/SectionHead.vue'
import SealStamp from '@/components/SealStamp.vue'
import MarkdownView from '@/components/MarkdownView.vue'
import { useI18n } from '@/i18n'

const { t, isEn } = useI18n()

useSeo({ title: '关于', description: '关于 Magic：研究方向、经历与联系方式。' })

const profile = ref<Profile | null>(null)

onMounted(async () => {
  profile.value = await api.getProfile()
})
</script>

<template>
  <div class="page about" v-if="profile">
    <header class="about__header">
      <div>
        <h1 class="about__name">{{ profile.name }}</h1>
        <p class="about__title">{{ profile.title }}</p>
      </div>
      <SealStamp v-if="SEAL_VISIBLE" :char="profile.sealChar" />
    </header>

    <section v-if="ABOUT_VISIBILITY.showBio" class="about__section">
      <SectionHead :title="t('about.intro')" />
      <div class="about__bio">
        <MarkdownView :source="profile.bio" />
      </div>
    </section>

    <section v-if="ABOUT_VISIBILITY.showResearch" class="about__section">
      <SectionHead :title="t('about.research')" />
      <ul class="about__research">
        <li v-for="area in profile.research" :key="area">{{ isEn ? t('about.research.' + area) : area }}</li>
      </ul>
    </section>

    <section v-if="ABOUT_VISIBILITY.showTimeline" class="about__section">
      <SectionHead :title="t('about.timeline')" />
      <ol class="timeline">
        <li v-for="entry in profile.timeline" :key="entry.period" class="timeline__item">
          <span class="timeline__period mono">{{ entry.period }}</span>
          <div class="timeline__body">
            <h3>{{ entry.role }} · {{ entry.org }}</h3>
            <p v-if="entry.note">{{ entry.note }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="about__section">
      <SectionHead :title="t('about.contact')" />
      <ul class="about__links">
        <li v-if="profile.email">
          <a :href="`mailto:${profile.email}`">{{ profile.email }}</a>
        </li>
        <li v-for="link in profile.links" :key="link.url">
          <a :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }} ↗</a>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.about {
  padding-top: 3rem;
}

.about__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.about__kicker {
  color: var(--cinnabar-deep);
}

.about__name {
  font-size: clamp(2rem, 5vw, 3rem);
  font-family: var(--font-display);
  margin-top: 0.6rem;
}

.about__title {
  margin-top: 0.6rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.about__affil {
  color: var(--ink-soft);
  margin-top: 0.3rem;
}

.about__section {
  margin-top: 2.6rem;
}

.about__bio {
  max-width: 40rem;
  font-size: 1.02rem;
}

.about__research {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.about__research li {
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  padding: 0.35rem 1.1rem;
  font-size: 0.92rem;
}

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.timeline__item {
  display: grid;
  grid-template-columns: 9rem 1fr;
  gap: 1.4rem;
  padding: 1.1rem 0;
  border-bottom: 1px dashed var(--line);
}

.timeline__period {
  color: var(--ink-faint);
  padding-top: 0.25rem;
}

.timeline__body h3 {
  font-size: 1.05rem;
  font-weight: 700;
}

.timeline__body p {
  color: var(--ink-soft);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.about__links {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.6rem;
}

.about__demo {
  margin-top: 1.6rem;
  color: var(--ink-faint);
  font-size: 0.72rem;
}

@media (max-width: 640px) {
  .timeline__item {
    grid-template-columns: 1fr;
    gap: 0.3rem;
  }
}
</style>