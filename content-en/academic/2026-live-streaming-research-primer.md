---
title: "Live Streaming Research: Literature Landscape, Core Issues, and Methodological Pathways"
slug: live-streaming-research-primer
type: academic
tags: [live-streaming|Live Streaming, literature-review|Literature Review, research-primer|Research Primer, ecommerce|E-commerce Livestreaming, recommender-system|Recommender System, streamer|Streamer, audience|Audience, platform-governance|Platform Governance, research-methods|Research Methods]
date: 2026-11-19T17:13:36.000Z
visibility: public
status: published
summary: Aimed at learners entering the field of live streaming research, this primer systematically maps four literature traditions, core terminology, theoretical mechanisms, a map of research questions, empirical and computational methodological pathways, and offers a research agenda and reading route. The central judgement is that live streaming research is shifting from "whether it promotes purchasing" towards "when, why, for whom, and at what cost it promotes".
authors: [lcg_magic]
venue: Independently authored · Field primer
year: 2026
---

# Live Streaming Research: Literature Landscape, Core Issues, and Methodological Pathways

## 0. Quick Overview

1. **Live streaming is not "video + comment section"**, but rather a <span style="color:#C2410C">**real-time coupled system of content, interaction, and transaction**</span>: content is co-produced during viewing, and the unit of analysis shifts from a static "item" to a dynamic "event/room" (Guo et al., 2026a, 2026b).
2. **The literature can be grouped into four research traditions**: gaming and community, audience and consumer decision-making, platform and organisational governance, and systems and algorithms (Figure 1). These four traditions correspond to distinct ways of framing research problems and to different standards of evidence.
3. **There is a marked East–West divergence in research focus**: Europe and North America centre on gaming/esports and community engagement, while East Asia (especially China) centres on talent-show and e-commerce livestreaming; the two have not yet achieved sufficient mutual exchange in theory and method (Lu et al., 2018; Pagáč et al., 2025).
4. **Theory is highly fragmented yet highly concentrated**: Luo et al. (2025) identified 84 theories across 168 theory-driven studies, of which S-O-R (stimulus–organism–response) alone accounts for 48; social presence, uses and gratifications, parasocial interaction, and trust transfer follow closely (Figure 5).
5. <span style="color:#C2410C">**Questionnaires plus SEM dominate; experiments are the scarcest**</span>: 161 studies used SEM, while only 15 used experiments; causal evidence remains a weakness of the field (Luo et al., 2025; Figure 7).
6. **The core mechanism is not one-way persuasion but two-way feedback**: streamers' emotions affect viewers' tipping, and audience interaction in turn feeds back into streamers' emotions (Lin et al., 2021); <span style="color:#C2410C">**"excessive" persuasion raises product returns**</span> (Feng et al., 2024).
7. **The difficulty in systems and algorithms research lies not in "seeing the picture clearly" but in temporal alignment**: livestream content is a continuously evolving multimodal stream, and the recommendation target changes during viewing, so <span style="color:#C2410C">**static item embeddings and offline evaluation both break down**</span> (Figure 8).
8. **The difficulty in business and organisational research lies not in "promoting purchases" but in weighing the costs**: <span style="color:#C2410C">**social solicitation can increase social capital yet harm sales**</span> (Song et al., 2026); danmaku consistency suppresses purchasing (Zhang & Ruan, 2024).
9. **The most worthwhile gaps to pursue**: non-gaming contexts, cross-cultural comparisons, long-term effects, causal identification of multimodal cues, and publicly reproducible benchmarks (Figure 9).
10. **Reading order**: reviews → classic phenomena → causal evidence → computational research; the four-stage pathway is shown in Figure 10.

*Citation convention: the text uses the APA 7 author–date system, references at the end follow APA 7, and all specific figures are attributed to their sources.*

---

## 1. Definitions, Boundaries, and Typology: What Counts as "Live Streaming Research"

### 1.1 Three Layers of Definition

"Live streaming" refers to different objects across literature traditions. To avoid mismatches in retrieval and theoretical dialogue, a three-layer definition is recommended (English-language literature uses "live streaming" or "livestreaming"):

| Layer | Definition | Key Criterion | Typical Literature Tradition |
|---|---|---|---|
| **Technical layer** | Real-time transmission of audio and video over the network as a continuous stream (Pagáč et al., 2025 distinguish streaming from live-streaming) | Realtime-ness, continuity, low latency | Systems and transmission research |
| **Interaction layer** | **Synchronous two-way communication** exists between streamer and audience and among audience members: danmaku (bullet comments), virtual gifts, and co-streaming | Bidirectionality, simultaneity | Audience, interaction, and media research |
| **Institutional/commercial layer** | The platform organises traffic, incentives, and transactions at the level of the room, forming a sustainable production–distribution–monetisation structure | Platform intermediation, commercialisability | Platform, organisation, and consumption research |

<span style="color:#C2410C">**Recommended operational definition**</span>: if the object of study lacks "synchronous two-way interaction", it should be explicitly labelled "web television / event broadcast"; if it lacks "real-time generated content", it should be labelled "video on demand / short video". This distinction directly determines the choice of dependent variable: broadcast research examines viewing scale and experience, while interactive livestream research examines engagement, relationships, and conversion.

### 1.2 Boundaries with Adjacent Concepts

| Concept | Key Difference from Live Streaming | Research Consequence |
|---|---|---|
| Video on demand (VOD) | Content is produced before it is consumed; no simultaneous feedback | The recommendation target is a static item; traditional offline evaluation can be used |
| Short video | Short duration, fully edited, algorithm-driven distribution takes priority | Focus on content features and completion rate rather than in-room interaction |
| Television broadcast / event relay | One-way broadcasting, with weak or externalised interaction among viewers | Research on "collective viewing" rather than "co-creation" |
| Social commerce | Can be based on text/image or pre-recorded content; no real-time synchrony required | Trust mechanisms arise from interpersonal networks rather than copresent interaction |
| Live streaming commerce (LSC) | Completes the closed loop of explanation–Q&A–ordering within the livestream | Dependent variables extend to GMV, impulse buying, and product returns |
| Virtual streamer (VTuber) / digital human | The agent has a hybrid human–machine identity | Authenticity and trust mechanisms require re-theorisation |

Luo et al. (2025) further divide live streaming commerce into three channel types: livestreaming embedded in e-commerce platforms (e.g., Taobao, Amazon Live), livestreaming platforms that add commercial functions (e.g., Douyu, Live.me), and social media platforms that add livestream selling (e.g., Facebook, Instagram). The three channel types have different affordances and should not be conflated.

### 1.3 Agent Structure and Sources of Knowledge

![Figure 1 Agent structure and knowledge sources of live streaming research](assets/2026-live-streaming-research-primer/figure-01-field-map.png)

**Figure 1  Agent structure and knowledge sources of live streaming research.** With the "live room" as the hub, upstream lie the streamer and content production, downstream lie the audience and behavioural outcomes, and the platform and infrastructure constitute the constraining conditions. Around this structure, existing literature can be grouped into four research traditions: <span style="color:#1D4ED8">**gaming and community**</span>, <span style="color:#0F766E">**audience and consumer decision-making**</span>, <span style="color:#C2410C">**platform and organisational governance**</span>, and <span style="color:#6D28D9">**systems and algorithms**</span>.

One of the earliest systematic reviews comes from game livestreaming research: Li et al. (2020) organised the literature into four themes—**streamer needs, audience needs, interaction behaviours, and platform effects**—while Cabeza-Ramírez et al. (2021) used bibliometric methods to map the field's intellectual landscape. Pagáč et al. (2025) place spectatorship experience at the centre, summarising four types of actors (community, player, streamer, viewer) and six livestream genres (creative, education, esport, game, shopping, social). The differences among these three classifications indicate that the field has no unified ontology, which makes a tradition-by-tradition review appropriate.

### 1.4 Four Stages in the Research Trajectory

![Figure 2 Research trajectory: from technical feasibility to platform ecosystem](assets/2026-live-streaming-research-primer/figure-02-timeline.png)

**Figure 2  Research trajectory.** Before 2014, the focus was on "technical feasibility and community formation" (Kaytoue et al., 2012; Hamilton et al., 2014); between 2016 and 2018, Chinese talent-show and e-commerce livestreaming spawned a large body of phenomenon-driven research (Lu et al., 2018); after 2020, research became institutionalised and rapidly absorbed econometric and machine learning methods (Wang et al., 2022; Bharadwaj et al., 2022; Yu et al., 2024). After 2023, multimodal large models and generative AI have made "real-time understanding of the live room" a feasible task (KuaiLive-M3, 2026; Zhang et al., 2026).

### 1.5 Typology: Interaction Intensity × Transactional Purpose

![Figure 3 Typology: interaction intensity × transactional purpose](assets/2026-live-streaming-research-primer/figure-03-typology.png)

**Figure 3  A typology of live streaming.** A single dimension (such as "gaming vs e-commerce") cannot capture reality: game streamers sell products, and e-commerce streamers also provide companionship. Positioning phenomena along the two dimensions of **interaction intensity** and **transactional purpose** explains why some mechanisms work across contexts (such as the parasocial relationship) while others are prominent only in the lower-right quadrant (such as impulse buying). Lu et al. (2018) already noted that user scenarios in Chinese livestreaming are far broader than the "event broadcasts / sharing among acquaintances" studied in North America; this difference still shapes the distribution of the literature.

---

## 2. The Literature Landscape: Output, Theory, and Methods

### 2.1 Key Figures from Two Panoramic Reviews

| Dimension | Review of live streaming commerce (LSC) | Scoping review of spectatorship experience |
|---|---|---|
| Sample | 2018–October 2023, 201 journal articles (2,884 records in the initial search) | 348 peer-reviewed documents |
| Growth | 1 article in 2018 → 85 articles in 2023; over 6,990 cumulative citations | Steady growth, dominated by gaming/esports |
| Geography | China 76.12%, Taiwan region of China 11.44%, South Korea 9.95%; 85.07% of the sample came from mainland China | The China–US collaboration network is the most active |
| Research objects | Consumers 86.07%, streamers 4.48%, both 9.45% | Four types of actors: viewers, streamers, community, players |
| Platforms | 56.22% did not specify a platform | Dominated by gaming platforms such as Twitch |
| Emerging topics | Tourism, agriculture, apparel, food, luxury goods | E-commerce, mental health, teaching collaboration, tourism |
| Source | Luo et al. (2025) | Pagáč et al. (2025) |

> **Interpretation**: live streaming research shows three characteristics: "<span style="color:#C2410C">**highly concentrated settings, highly fragmented theory, and predominantly cross-sectional evidence**</span>". For Chinese scholars, this is both an opportunity (rich local phenomena) and a trap (questionable generalisability).

### 2.2 Distribution of Theoretical Use

Luo et al. (2025) found 84 theories across 168 theory-driven LSC papers, with 33 papers using no explicit theory. The five most frequently used are:

| Theory | Papers | Main Explanatory Target |
|---|---:|---|
| Stimulus–organism–response (S-O-R) | 48 | Platform/streamer/social cues → cognitive-affective states → behaviour |
| Social presence theory (SPT) | 15 | Immersion and trust arising from "the presence of others" |
| Uses and gratifications theory (UGT) | 11 | Why people watch and why they participate |
| Parasocial interaction theory (PSI) | 9 | Quasi-intimate relationships arising from one-way media personalities |
| Trust transfer theory (TTT) | 8 | How trust in the streamer transfers to the product/merchant |

Other theories include AIDMA, flow, arousal, psychological contract, psychological reactance, social exchange, social identity, regulatory focus, and social learning, among others. Wei et al. (2026) specifically review the conceptual debate between parasocial interaction and parasocial relationship in live streaming, noting that the boundary between the two still requires clarification in real-time interactive environments—<span style="color:#C2410C">**an unresolved conceptual problem**</span>.

### 2.3 Methodological Distribution and Strength of Evidence

| Methodological Stage | Distribution (Luo et al., 2025) | Implication |
|---|---|---|
| Data collection | Questionnaires/interviews 148 papers; field/scraped data 44; mixed 9 | Self-reported data overwhelmingly predominate |
| Data analysis | SEM 161 papers; regression 30; qualitative 12; mixed 13 | Correlation/covariance structures predominate |
| Experiments | 15 papers | <span style="color:#C2410C">**causal identification is seriously inadequate**</span> |
| Sample context | Mainland China 85.07% | Limited cross-cultural generalisability |

<span style="color:#C2410C">**For readers wishing to delve into platform data and causal identification**</span>, there is a clear window of opportunity: combining rich platform behavioural logs with natural or randomised experiments offers greater marginal contribution than producing yet another cross-sectional questionnaire. Good existing examples include Feng et al. (2024), who compared live sessions with replay sessions (differing only in the presence or absence of real-time social interaction) to identify the effect on returns, and Lin et al. (2021), who used minute-level panel vector autoregression (panel VAR) to characterise the two-way dynamics between streamer and audience.

### 2.4 Main Publication Venues

- **Interaction and technology conferences**: CHI, CSCW, WWW, SIGIR, KDD, ICWSM, EuroITV/ICMI.
- **Information systems journals**: MIS Quarterly, Information Systems Research, JMIS, Decision Support Systems, Information & Management, Internet Research, Journal of Computer Information Systems.
- **Marketing/consumer journals**: Journal of Marketing, Journal of Marketing Research, Journal of the Academy of Marketing Science, Journal of Retailing and Consumer Services, Production and Operations Management, Psychology & Marketing.
- **Communication/media journals**: Computers in Human Behavior, Entertainment Computing, New Media & Society, Information, Communication & Society.

Before submitting, first determine whether your contribution is a **mechanistic explanation** (management/marketing journals), a **system/algorithm** (technical conferences), or **human–interface interaction design** (HCI conferences). The three have different standards of argumentation.

---

## 3. Terminology and Construct Systems

![Figure 4 A five-layer system of core terminology](assets/2026-live-streaming-research-primer/figure-04-terminology.png)

**Figure 4  A five-layer system of core terminology.** It is useful to memorise terms in five layers: "agent–interaction–psychology–outcome–technology". When reading, first determine which layer the author is discussing, then the direction of the causal arrows; when writing, avoid placing variables from different layers in the same hypothesis (for example, treating "danmaku consistency" as a psychological construct).

### 3.1 Agents and Behaviours

| Term | English | Brief Definition |
|---|---|---|
| Streamer / host | streamer, broadcaster, anchor | Real-time content producer; in e-commerce livestreaming contexts "anchor" (influencer) is commonly used |
| Viewer / spectator | viewer, spectator, audience | May watch passively or interact in real time |
| Virtual streamer | VTuber, virtual streamer | A streamer presented through a virtual avatar, with identity authenticity as the central issue |
| Room / session | live room, session | The basic unit for recommendation and econometric analysis; consecutive sessions by the same streamer should be distinguished |
| Danmaku | danmaku, bullet comments, barrage | Real-time comments overlaid on the screen, serving both as social signals and informational cues |
| Virtual gift | virtual gift, tipping | Non-transactional feedback purchased by viewers with real money |
| Co-streaming | co-streaming, live co-hosting | A real-time audio/video connection between streamers or between a streamer and a viewer |
| Tipping | tipping, virtual gifting | A different flow of value from "purchasing": rewarding the streamer rather than obtaining a product |

### 3.2 Psychology and Mechanisms

| Term | English | Brief Definition |
|---|---|---|
| Social presence | social presence | The subjective feeling of "the presence of others", affecting trust and immersion |
| Parasocial interaction / relationship | parasocial interaction / relationship (PSI / PSR) | A single interaction experience vs. a quasi-intimate relationship accumulated over the long term; the conceptual boundary is still debated (Wei et al., 2026) |
| Flow | flow | A state of immersion, often treated as an antecedent of viewing retention |
| Arousal | arousal | The degree of physiological/psychological activation, often a mediator of emotional contagion |
| Perceived risk / trust | perceived risk / trust | Two pathways through which the live room reduces information asymmetry |
| Psychological reactance | psychological reactance | Resistance when freedom is perceived as threatened, explaining "over-persuasion" |
| Information richness | information richness | A medium's capacity to convey information, treated as a parallel mechanism in danmaku research |
| Emotional labour | emotional labour | Emotion regulation undertaken by streamers to sustain their performance; long-term costs include burnout |
| Information overload | information overload | Excessive cues causing processing difficulty, explaining the curvilinear effects of facial expressions/body movements (Yang et al., 2025) |
| Social exchange | social exchange | The logic of reciprocity, explaining tipping, following, and social solicitation (Song et al., 2026) |

### 3.3 Outcomes and Technology

| Term | English | Brief Definition |
|---|---|---|
| Engagement | engagement | A composite of watching, commenting, liking, following, etc.; needs to be measured in a disaggregated way |
| Conversion / GMV | conversion / gross merchandise volume | Conversion from viewing to ordering, and total transaction value |
| Impulse buying | impulse buying | Low-deliberation purchases in the high-pressure sales context of livestreaming |
| Product returns | product returns | An often-overlooked negative outcome; positively correlated with the intensity of real-time interaction (Feng et al., 2024) |
| Social capital | social capital | Follower scale and relational network resources; may conflict with sales goals (Song et al., 2026) |
| Affordance | affordance | The possibilities a technical feature offers to actors (e.g., "ability to send danmaku", "ability to tip") |
| Multimodal understanding | multimodal understanding | Joint representation and reasoning over video, audio, text, and danmaku |
| Live recommendation | live recommendation | The recommendation target continuously evolves, requiring temporal alignment and online updates |
| Retention | retention, continued watching | Continued watching and return visits, often used as an outcome variable of engagement |
| Instant order cancellation | instant order cancellation | Cancelling immediately after ordering, an outcome variable of group emotion (Wang et al., 2024) |
| Content moderation | content moderation | Real-time governance of danmaku and behaviour, interacting with group size (Zhao et al., 2025) |
| Temporal alignment | temporal alignment | Mapping behaviours onto livestream segments along the timeline (Guo et al., 2026a) |
| Explicit / implicit feedback | explicit / implicit feedback | Questionnaire-stated preferences vs. behavioural signals such as watching and liking (Guo et al., 2026a) |
| Cross-domain recommendation | cross-domain recommendation | Transfer of preferences between short videos and livestreams |
| Cold start | cold start | New rooms or new streamers lack interaction history |

---

## 4. Mechanistic Frameworks and Theoretical Perspectives

![Figure 5 Mechanistic framework: stimulus–organism–response](assets/2026-live-streaming-research-primer/figure-05-mechanism.png)

**Figure 5  Mechanistic framework.** S-O-R is currently the most general "skeleton", but it does not itself provide a specific mechanism; genuine theoretical contributions come from which psychological states are inserted at the O layer and which novel stimuli are identified at the S layer. The dashed feedback loop in the figure highlights what distinguishes livestreaming from traditional advertising: <span style="color:#C2410C">**outcomes feed back into antecedents**</span> (Lin et al., 2021).

### 4.1 S-O-R: A General Skeleton Rather Than a Theoretical Contribution

The value of S-O-R lies in organising variables: stimuli can come from the streamer (facial expressions, posture, verbal scripts), the content (information volume, display duration), the platform (danmaku, gifts, recommendations), and the crowd (consistency, size); the organism comprises presence, parasocial relationship, trust, arousal, and reactance; responses include retention, interaction, conversion, and returns. When using S-O-R, <span style="color:#C2410C">**a paper's novelty must lie in a new stimulus, mediator, or moderator**</span>, not in "validating the applicability of S-O-R".

### 4.2 Social Presence and Parasocial Relationship: Explaining "Why Strangers Can Be Trusted"

Social presence emphasises that the medium makes people feel "the presence of others", which in livestreaming is jointly constructed by real-time video, immediate responses, and danmaku. Parasocial relationship explains the emotional bond viewers develop towards the streamer that resembles a face-to-face relationship. The two are often used together, but conceptual overlap must be guarded against: Wei et al. (2026) argue that real-time interaction in livestreaming invalidates the traditional "one-way parasocial" definition and identify four theoretical positions; when writing, one should specify which position is adopted and explain how it differs from trust and identification.

### 4.3 Uses and Gratifications, Social Identity, and Flow: Explaining "Why People Watch and Why They Stay"

UGT answers questions of viewing motivation: information acquisition, entertainment, sociability, and identity expression. Social identity and "dual identification" explain viewers' belonging towards the streamer and the community. Flow explains prolonged stays. These theories are better suited as **antecedent-level theories** than as explanations at the outcome level.

### 4.4 Trust and Uncertainty Reduction: The Core Mechanism of E-commerce Livestreaming

Livestreaming reduces product uncertainty through real-time demonstration, immediate answers to questions, and third-party endorsement by the streamer. Wang et al. (2022) found that the **independent identity** of the streamer relative to the merchant is crucial: as an intermediary, the streamer raises consumers' purchase awareness and influences decisions. Liao et al. (2023) further explain sales improvements in B2B settings from the perspective of streamer competency.

### 4.5 Emotional Labour and Two-way Feedback: The "Processuality" of Livestreaming

- Lin et al. (2021), using minute-level panel VAR on 1,450 livestreams, show that happier streamers make viewers happier and attract more tips, while audience engagement in turn prompts streamers to return more smiles; these effects are significant only after a stream has been running for some time and when the streamer is relatively experienced/popular.
- Bharadwaj et al. (2022), analysing 99,451 sales pitches, found that the sales effects over time of six types of emotional display (including happiness) are all **negatively U-shaped**: resistance is strongest in the middle, and they derived an optimal allocation curve for facial presence and emotional display.
- Yang et al. (2025), examining 9,641 Douyin sales pitches, found a **curvilinear relationship** between streamers' body movements and sales, with information overload as the mechanism; Liu et al. (2025), based on 5.22 million video frames, found that the richness and intensity of posture positively affect purchases by micro and small enterprise resellers.

> <span style="color:#C2410C">**Methodological implication**</span>: emotional/movement effects are generally **nonlinear and time-dependent**. If one only makes a between-group comparison of "smiling vs not smiling", contradictory conclusions are likely.

### 4.6 Affordances and Sociotechnical Systems: Bringing Platform Design into Theory

Affordance theory treats danmaku, gifts, rooms, and recommendations as "possibilities for action" rather than mere features. Sjöblom et al. (2019) analysed the key affordances of game livestreaming; the bibliometric analysis by Luo et al. (2025) shows that the affordance perspective serves as a theoretical bridge between social commerce and live streaming commerce. <span style="color:#C2410C">**For platform designers**</span>, affordances imply that "changing a single button" can reshape the entire interaction ecology.

### 4.7 Dual Process, Psychological Reactance, and Social Exchange: Explaining "Good Intentions, Bad Outcomes"

- Zhang and Ruan (2024), through three experiments, found that <span style="color:#C2410C">**danmaku consistency reduces purchasing**</span>, with psychological reactance and information richness as mediating mechanisms (a dual process), moderated by "intrinsic motivation to post danmaku".
- Song et al. (2026), examining 1,128 Taobao livestreams, found that social solicitation (asking for follows, comments, and likes) increases social capital but has a **negative spillover** on sales; providing more product information alleviates this effect, while adding purchase solicitation strengthens it; if the requested social behaviour is consistent with viewers' purchase intentions, the negative effect disappears.
- Feng et al. (2024), comparing live and replay sessions, found that real-time social interaction significantly raises the return rate: for each one-standard-deviation increase in interaction intensity, the absolute return rate rises by about 8.59 percentage points (more than 20% of the average return rate).

Together these three point to an important proposition: <span style="color:#C2410C">**"engagement" and "sales" are not the same goal in livestreaming and may even conflict**</span>. Performance metrics must be designed in layers (see §8.1).

---

## 5. A Map of Research Questions: Agents × Stages

![Figure 6 Question map: agents × stages](assets/2026-live-streaming-research-primer/figure-06-question-map.png)

**Figure 6  Question map.** The horizontal axis denotes research agents and the vertical axis denotes antecedents–process–outcomes. When choosing a topic, one can locate "blank cells" on this map; when reviewing, it can be used to check whether a paper covers only a single cell and lacks a mechanistic chain.

### 5.1 The Streamer Side: From "What to Express" to "How to Keep Expressing"

| Research Question | Theoretical Lens | Available Methods | Representative Evidence |
|---|---|---|---|
| How do streamers' expressions/postures affect sales, and when is "too much of a good thing"? | Emotional contagion, information overload | Video deep learning + regression | Bharadwaj 2022; Yang 2025; Liu 2025 |
| How should product display time be allocated? | Attention economy, information processing | Platform logs + econometric models | Xie et al. 2025 (POM): longer duration for a single product ↑ raises that product's revenue, but a higher average duration ↑ lowers session revenue |
| How are explanatory and affective cues kept consistent in B2B livestreaming? | Communication consistency, signalling theory | Content coding + sales performance | Liu et al. 2026 (JBR); Liao et al. 2023 |
| How do streamers' emotional labour, burnout, and incentives evolve? | Emotional labour, labour process | Interviews + longitudinal logs | Pagáč et al. 2025 identify mental health as an emerging topic |

### 5.2 The Audience Side: Motivation, Crowds, and the Boundaries of the "Irrational"

| Research Question | Theoretical Lens | Available Methods | Representative Evidence |
|---|---|---|---|
| Why do people watch, interact, and tip? | UGT, identification, social exchange | Questionnaire + SEM; interviews | Lu et al. 2018; Wohn et al. 2018 |
| Do social cues enhance or impair attention? | S-O-R | Eye-tracking experiment | Fei et al. 2021 (DSS 142, 113466) |
| Why does danmaku consistency suppress purchasing? | Dual process, psychological reactance | Behavioural experiment | Zhang and Ruan (2024) |
| How does group emotion trigger instant order cancellation? | Group emotion, emotional contagion | Platform logs + econometrics | Wang et al. 2024 (DSS 179, 114147) |
| How do group size and content moderation shape engagement? | Deindividuation, governance | Online experiments/logs | Zhao et al. 2025 (ISR) |
| Are impulse buying and product returns two sides of the same coin? | Persuasion knowledge, regret | Natural experiment comparison | Feng et al. 2024 |

### 5.3 The Platform Side: Recommendation, Governance, and Ecosystem

| Research Question | Computational Task | Key Difficulty | Representative Evidence |
|---|---|---|---|
| Which live room will be entered next? | Dynamic graph / hypergraph recommendation | Different behaviours target different objects (watching points to a session, gifting points to a streamer) | Yu et al. (2024); Guo et al. (2026b) |
| How can cold-start rooms borrow from streamer history? | Representation initialisation, cross-domain transfer | No interactions yet in the current session | Guo et al. (2026b) |
| How do preferences transfer between short videos and livestreams? | Cross-domain recommendation | 99.44% of viewers consume both types of content | KuaiLive-M3 2026 |
| Which product is shown at which moments? | Multimodal temporal grounding | Evidence is scattered and non-contiguous | GPUB / UniPro 2026 |
| How can content moderation avoid "crowd defocus"? | Real-time governance, anomaly detection | Interaction between scale and moderation | Zhao et al. 2025 |

### 5.4 Cross-cutting Issues (Across Cells)

- **Causal identification**: watching and purchasing are highly endogenous; self-selection, reverse causality, and simultaneity are pervasive.
- **Measurement validity**: is "engagement" a construct or a set of behaviours? How should the weights of tipping, commenting, and retention be determined?
- **Generalisability**: can findings from Chinese settings transfer to Europe/North America, B2B, and non-gaming contexts?
- **Ethics**: inducement to tip, algorithmic amplification, streamers' labour rights, and protection of minors.

---

## 6. Research Methods: Design, Data, and Identification

![Figure 7 Method selection: question type → data → identification](assets/2026-live-streaming-research-primer/figure-07-methods.png)

**Figure 7  A decision tree for method selection.** First ask "what type of question do I want to answer", then choose a method; do not work backwards from "which methods I know" to the research question.

### 6.1 A Selection Matrix

| Question Type | Preferred Methods | Data | Main Threat | Example |
|---|---|---|---|---|
| Understanding mechanisms | Interviews, ethnography, grounded theory; questionnaire + SEM | Interview transcripts, questionnaires | Self-report bias, construct overlap | Lu 2018; Wang 2022 |
| Causal effects | Randomised experiments, A/B tests; natural experiments, difference-in-differences (DID), regression discontinuity (RDD); panel VAR | Platform logs + exogenous shocks | Endogeneity, selection bias | Feng 2024; Lin 2021; Song 2026 |
| Prediction/recommendation | Graphs/hypergraphs, dynamic graphs, multimodal sequence models | Behavioural logs + content representations | Data leakage, offline–online inconsistency | Yu et al. (2024); Guo et al. (2026b) |
| Description/landscaping | PRISMA systematic review; SPAR-4-SLR + TCCM; bibliometrics | Publication metadata | Search-string coverage, language bias | Luo 2025; Pagáč 2025 |

### 6.2 Operational Points for Four Methodological Paths

**(1) Questionnaire + SEM**: suited to measuring "psychological chains". Note that SEM is already overused in the existing literature; unless a new construct or boundary condition is proposed, the marginal contribution is limited. Pairing with behavioural logs is recommended in order to test for common method bias.

**(2) Experiments and quasi-experiments**: suited to identifying the direction of mechanisms. The three-experiment design of Zhang and Ruan (2024) is a good template: main effect → mediation → moderation. Quasi-experiments can exploit "live vs replay" (Feng et al., 2024), platform rule changes, or exogenous variation in streamers' schedules.

**(3) Log-based econometrics**: livestreaming logs are naturally a hybrid of an **event stream + panel + time series**. Available methods include fixed-effects panel models, panel VAR (Lin et al., 2021), regression discontinuity (at stream start/end times), and difference-in-differences (when a policy or feature is launched). The key is to specify what the "treatment" is and whether the control group is comparable.

**(4) Computational modelling**: here evaluation must handle "content changing within the workflow". Common offline metrics are NDCG@K, Recall@K, and MRR; these must be supplemented with a temporal extrapolation split (splitting by time rather than at random) and online A/B tests. KuaiLive-M3 (2026) specifically notes that existing benchmarks lack explicit feedback and therefore proposes a questionnaire-augmented recommendation task.

### 6.3 A Measurement Toolbox

- **Behaviour**: entry/exit, viewing intervals, danmaku, likes, gifts, follows, orders, returns, order cancellations.
- **Physiology and attention**: eye tracking (Fei et al., 2021), facial expressions, posture, vocal prosody, heart rate/skin conductance.
- **Content**: text sentiment and topics, ASR transcripts, video-frame features, multimodal embeddings, product alignment.
- **Review methods**: PRISMA/PRISMA-ScR (Pagáč et al., 2025), SPAR-4-SLR + TCCM (Luo et al., 2025), VOSviewer/CiteSpace knowledge graphs.

### 6.4 Ethics and Reproducibility

Platform logs typically involve identifiable behaviour and minors; anonymisation, minimal necessary collection, and informed consent (for experiments) are required. Scraped data should comply with platform terms. Computational studies should release data/code where possible or provide reproducible split protocols; <span style="color:#C2410C">**only a handful of works currently provide public benchmarks**</span> (KuaiLive-M3, GPUB, and the Mendeley dataset of Yang et al. 2025), which is itself a weakness of the field.

---

## 7. Platform Technology and Computational Research

![Figure 8 The platform technology stack and computational research topics](assets/2026-live-streaming-research-primer/figure-08-tech-stack.png)

**Figure 8  The platform technology stack.** From low-level transmission to high-level intelligent applications, every layer generates research questions. The most common mistake in computationally oriented research is to treat livestreaming as "video recommendation with comments": the recommendation target in livestreaming is a **continuously evolving room**, user interests change **within a single viewing session**, and behavioural signals span **two domains, short video and livestreaming**.

### 7.1 Systems and Real-time Constraints

Capture → encoding (H.264/AV1, low bitrate with high quality) → transmission (WebRTC/RTMP, adaptation to weak networks) → edge distribution → playback (first-frame latency, stalling, adaptive resolution). Zheng et al. (2017), on cloud transcoding and distribution for crowdsourced game livestreaming, is an early representative work at the infrastructure layer. Technical constraints translate into experience constraints: stalling and delay directly affect presence and conversion.

### 7.2 Livestream Recommendation: From Items to Events

| Method | Core Idea | Corresponding Paper |
|---|---|---|
| Hypergraph modelling of multiple behaviours | Using two hypergraphs to characterise viewer–channel and viewer–channel multi-party interactions respectively, overcoming the restriction to binary edges | VIBM-Hyper, Yu et al. 2024 (DSS) |
| Dynamic graph + room-level collaboration | Maintaining the states of viewers, rooms, and streamers with a continuous-time dynamic graph; measuring "same-session collaboration" by overlap of viewing intervals | DCGLive; Guo et al. (2026b) |
| Cross-domain transfer | Jointly modelling short-video and livestreaming behaviour; aligning time with segmented multimodal embeddings | KuaiLive-M3, 2026 |
| Explicit feedback augmentation | Using questionnaire feedback to bridge implicit behaviour and perceived quality | KuaiLive-M3, 2026 |

Evaluation note: DCGLive uses a time-ordered 80/10/10 split and full ranking (NDCG, Recall, MRR), reporting results on both KuaiLive and commercial data. This "two datasets + temporal split" practice is worth emulating.

### 7.3 Multimodal Content Understanding

GPUB (Zhang et al., 2026) defines **Grounded Product Understanding (GPrU)**: given a livestream video and a set of candidate products, jointly identify "which product is being shown" and "which moments provide the evidence". Product evidence is scattered across multiple non-contiguous segments, and visual and speech cues are complementary. <span style="color:#C2410C">**The strongest off-the-shelf baseline achieves only 10.13% Pair mAP@.3**</span>, while the dedicated model UniPro raises this to 24.58% (Joint R@1@.3 of 38.81%)—indicating that the task is far from solved. Related downstream tasks include product-centric clip cropping, automatic summarisation, real-time shopping guidance, and compliance moderation.

### 7.4 Governance and Safety

Content moderation is not an add-on module but part of the interaction ecology: Zhao et al. (2025) show that group size and content moderation jointly shape engagement, providing empirical evidence on whether "larger rooms require stronger governance". On the computational side, one can study real-time risk detection, danmaku anomaly detection, and identification of inducement solicitation (Song et al., 2026 use NLP to identify social appeals).

### 7.5 An Overview of Public Benchmarks

| Dataset | Scale | Signals | Suitable Tasks |
|---|---|---|---|
| KuaiLive-M3 (2026) | 21,938 users; 35 million livestream + 111 million short-video interactions; 88 million segmented multimodal embeddings; 25,403 questionnaires | Timestamps, cross-domain, explicit feedback | Cross-domain recommendation, livestream highlight prediction, questionnaire-augmented recommendation |
| GPUB (2026) | 3,000 e-commerce livestreams; 31,000+ fashion products | Human annotations at multiple moments | Product recognition, temporal grounding, joint GPrU |
| KuaiLive (Guo et al., 2026b, sampled) | 9,574 users, 2,951 rooms, 257,811 interactions | Watching + gifting | Next-room prediction |
| Mendeley posture dataset (Yang et al., 2025) | 9,641 product sales clips | Motion extraction + sales | Nonverbal behaviour and sales |

**Data access**: the KuaiLive project page (including Zenodo downloads) is https://imgkkk574.github.io/KuaiLive/ ; the KuaiLive-M3 project page and code are at https://imgkkk574.github.io/KuaiLive-M3/ and https://github.com/imgkkk574/KuaiLive-M3 ; the task definition for GPUB is in reference 30. The commercial data mentioned in the text are not public and are used only to illustrate the research design.

---

## 8. Business Performance, Organisational Behaviour, and Platform Governance

### 8.1 Performance Metrics Must Be Layered

| Level | Metrics | Why Consider Separately |
|---|---|---|
| Traffic layer | Impressions, entry rate, watch time, retention | Direct results of recommendation and content attractiveness |
| Interaction layer | Danmaku, likes, follows, gifts | Measure relationships and engagement, but may erode sales |
| Transaction layer | Conversion, GMV, average order value | Traditional business objectives |
| Relationship layer | Follower growth, social capital, return visits | Long-term assets, potentially in conflict with short-term sales |
| Quality layer | Return rate, order cancellation rate, complaints, streamer burnout | Negative externalities, most often overlooked |

Song et al. (2026) showing "social capital ↑ but sales ↓" and Feng et al. (2024) showing "interaction ↑ but returns ↑" demonstrate that <span style="color:#C2410C">**evaluating a live room by a single GMV or a single interaction rate produces systematic bias**</span>.

### 8.2 Streamer Incentives and the Labour Process

Tips and commission constitute streamers' direct incentives, while fan groups and rankings constitute indirect ones. Lu et al. (2018) note that reward mechanisms and fan-group chats are central to engagement; Lin et al. (2021) show that emotional investment has quantifiable economic returns. However, the long-term costs of emotional labour (burnout, performative alienation) have only begun to be discussed in Western research (Pagáč et al., 2025). In designing incentives, short-term returns and long-term sustainability must be considered together.

### 8.3 Platform Governance and Traffic Allocation

Recommendation algorithms determine who is seen and therefore affect the distribution of streamers' income and content diversity. Room-level dynamic recommendation (Guo et al., 2026b) and hypergraph-based multi-behaviour recommendation (Yu et al., 2024), while improving accuracy, may also amplify the Matthew effect. Governance research should treat moderation, cold-start support, and traffic allocation as a single mechanism-design problem.

### 8.4 Brand and Supply-Chain Perspectives

Livestreaming compresses the "awareness–purchase" funnel, but it also compresses consumers' deliberative decision time, thereby generating returns. Xie et al. (2025) find that display duration has a **positive effect at the product level but a negative effect at the session level**, with differences between official stores and third-party live rooms—such level effects are easily misread in practice. B2B settings (Liao et al., 2023; Liu et al., 2026) suggest that the value of livestreaming extends beyond closing sales to include enquiries and trust-building, requiring different attribution models.

---

## 9. Research Gaps and Agenda

![Figure 9 Research agenda: the four quadrants of TCCM](assets/2026-live-streaming-research-primer/figure-09-agenda.png)

**Figure 9  Research agenda (T = theory, C = context, C = characteristics, M = methods).** The framework follows the TCCM of Luo et al. (2025) and incorporates the call by Pagáč et al. (2025) for non-gaming contexts and interdisciplinary collaboration.

### 9.1 Ten Research Questions That Can Be Addressed Immediately

1. **Theoretical integration**: under what contexts do theories beyond S-O-R (interaction ritual chain, affordance, sociotechnical systems) have greater explanatory power? Can a map of theories' boundary conditions be established?
2. **Conceptual clarification**: can parasocial interaction and parasocial relationship be separated in real-time interactive environments? Do measurement scales need to be reconceptualised (Wei et al., 2026)?
3. **Cross-cultural**: why is e-commerce livestreaming more prevalent in East Asia than in Europe and North America? How much do institutions, payments, logistics, and culture each contribute?
4. **Context expansion**: are the mechanisms in education, tourism, agriculture, and B2B livestreaming transferable, or context-specific?
5. **Negative outcomes**: returns, order cancellations, regret after impulse buying, and streamer burnout—can a "costs of growth" model be built?
6. **Multimodal causality**: how can the joint effects of facial expressions, posture, speech, and danmaku be identified? Can exogenous shocks (e.g., equipment, network, scheduling) be used for causal inference?
7. **AI streamers**: how do the authenticity, trust, and consumer responses associated with digital humans/VTubers differ systematically from those of human streamers?
8. **Temporal scale**: how does the "lifecycle" of a live room moderate the emotion–performance relationship (Lin et al., 2021 provide preliminary evidence)?
9. **Methodological innovation**: can we build a multi-source triangulation dataset combining "logs + questionnaires + physiology + multimodal data", accompanied by public benchmarks?
10. **Evaluation protocols**: how can offline recommendation metrics be reconciled with online business metrics (including returns and retention)? Are new evaluation standards needed for livestream recommendation?

### 9.2 The Main Shift

The field is shifting from "**whether livestreaming promotes purchasing**" to "<span style="color:#C2410C">**when, why, for whom, and at what cost it promotes**</span>". This shift requires researchers to possess three kinds of training simultaneously: econometric training for causal identification, computational training for modelling real-time multimodal data, and theoretical training for grounding mechanisms in practice.

---

## 10. Reading Pathway and Resources

![Figure 10 Reading pathway: four stages](assets/2026-live-streaming-research-primer/figure-10-reading-path.png)

**Figure 10  Reading pathway.** From building a landscape map to reproducing computational research. It is recommended to record each paper in a six-column table: "research question–theory–data–identification–conclusion–limitations".

### 10.1 Core Bibliography by Topic

| Topic | Essential Reading |
|---|---|
| Field reviews | Luo et al. (2025); Pagáč et al. (2025); Li et al. (2020); Cabeza-Ramírez et al. (2021); Wei et al. (2026) |
| Phenomena and communities | Kaytoue et al. (2012); Hamilton et al. (2014); Lu et al. (2018); Taylor (2018) |
| Consumer decision-making | Wang et al. (2022); Fei et al. (2021); Zhang and Ruan (2024) |
| Emotion and performance | Lin et al. (2021); Bharadwaj et al. (2022); Yang et al. (2025); Liu et al. (2025); Xie et al. (2025) |
| Negative outcomes | Feng et al. (2024); Wang et al. (2024); Zhao et al. (2025); Song et al. (2026) |
| Computation and data | Yu et al. (2024); Guo et al. (2026a, 2026b); Zhang et al. (2026) |
| Systems infrastructure | Zheng et al. (2017, IEEE TCSVT) |

**Access to materials**: all works listed in this section can be located via the bibliography at the end, on publisher pages, through DOI / arXiv / SSRN, or in academic search systems; download and code entry points for public datasets are given in §7.5.

### 10.2 Three Practical Suggestions

1. <span style="color:#C2410C">**Replicate first, then innovate**</span>: starting from item 5 (KuaiLive-M3) or item 30 (GPUB) in the bibliography, run a model using the task definition and baseline settings published in the paper, and you will quickly understand the practical difficulties of "temporal alignment" and "explicit feedback".
2. **Treat the published literature as a methods sample library**: reorder the references in Section 11 by "identification strategy / modelling approach" rather than by "topic", comparing experiments versus observation, archival versus platform data, econometric identification, graph modelling, and multimodal learning; original texts can be retrieved via the bibliography (DOI / arXiv / publication information).
3. **Be explicit about levels when writing**: in the introduction, state clearly which layer of Figure 1 your contribution occupies, which causal link of Figure 5 it addresses, and which question type of Figure 7 it belongs to. What reviewers most frequently question is precisely "confusion of levels".

---

## 11. References

1. Bharadwaj, N., Ballings, M., Naik, P. A., Moore, M., & Arat, M. M. (2022). A new livestream retail analytics framework to assess the sales impact of emotional displays. *Journal of Marketing, 86*(1), 27–47. https://doi.org/10.1177/00222429211013042
2. Cabeza-Ramírez, L. J., Fuentes-García, F. J., & Muñoz-Fernandez, G. A. (2021). Exploring the emerging domain of research on video game live streaming in Web of Science: State of the art, changes and trends. *International Journal of Environmental Research and Public Health, 18*(6), Article 2917. https://doi.org/10.3390/ijerph18062917
3. Feng, X., Rong, Y., Tian, X., Wang, M., & Yao, Y. (2024). *When persuasion is too persuasive: An empirical analysis of product returns in livestream e-commerce*. SSRN. https://ssrn.com/abstract=4079214
4. Fei, M., Tan, H., Peng, X., Wang, Q., & Wang, L. (2021). Promoting or attenuating? An eye-tracking study on the role of social cues in e-commerce livestreaming. *Decision Support Systems, 142*, Article 113466. https://doi.org/10.1016/j.dss.2020.113466
5. Guo, K., Qu, C., Cheng, J., Zhang, X., Wang, S., Zhang, X., Wang, X., Zhang, L., Hu, L., & Xu, J. (2026a). *KuaiLive-M3: A multi-modal, multi-domain, and multi-feedback dataset for live streaming recommendation*. *arXiv*. https://doi.org/10.48550/arXiv.2607.24862
6. Guo, K., Qu, C., Zhang, X., Zhao, L., Wang, S., Niu, Y., & Xu, J. (2026b). Room matters: Dynamic room-level collaboration information modeling for live streaming recommendation. In *Proceedings of the ACM Web Conference 2026*. ACM. https://doi.org/10.1145/3774904.3792241
7. Hamilton, W. A., Garretson, O., & Kerne, A. (2014). Streaming on Twitch: Fostering participatory communities of play within live mixed media. In *CHI ’14: Proceedings of the SIGCHI Conference on Human Factors in Computing Systems* (pp. 1315–1324). ACM. https://doi.org/10.1145/2556288.2557048
8. Hilvert-Bruce, Z., Neill, J. T., Sjöblom, M., & Hamari, J. (2018). Social motivations of live-streaming viewer engagement on Twitch. *Computers in Human Behavior, 84*, 58–67. https://doi.org/10.1016/j.chb.2018.02.013
9. Hu, M., Zhang, M., & Wang, Y. (2017). Why do audiences choose to keep watching on live video streaming platforms? *Computers in Human Behavior, 75*, 594–606. https://doi.org/10.1016/j.chb.2017.06.006
10. Kaytoue, M., Silva, A., Cerf, L., Meira, W., Jr., & Raïssi, C. (2012). Watch me playing, I am a professional: A first study on video game live streaming. In *Companion proceedings of the 21st World Wide Web Conference* (pp. 1181–1188). ACM. https://doi.org/10.1145/2187980.2188259
11. Li, Y., Wang, C., & Liu, J. (2020). A systematic review of literature on user behavior in video game live streaming. *International Journal of Environmental Research and Public Health, 17*(9), Article 3328. https://doi.org/10.3390/ijerph17093328
12. Liao, M., Fang, J., Han, L., Wen, L., Zheng, Q., & Xia, G. (2023). Boosting eCommerce sales with livestreaming in B2B marketplace: A perspective on live streamers’ competencies. *Journal of Business Research, 167*, Article 114167. https://doi.org/10.1016/j.jbusres.2023.114167
13. Lin, Y., Yao, D., & Chen, X. (2021). Happiness begets money: Emotion and engagement in live streaming. *Journal of Marketing Research, 58*(3), 417–438. https://doi.org/10.1177/00222437211002477
14. Liu, L., Fang, J., & Ji, Z. (2025). Posture as information: Streamer postures and the purchase of micro and small enterprise resellers in livestreaming. *Journal of the Academy of Marketing Science*. Advance online publication. https://doi.org/10.1007/s11747-025-01117-1
15. Liu, L., Fang, J., Ji, Z., & Hossin, M. A. (2026). Communication consistency in B2B livestreaming: Effects of explanatory and affective cues on streamer’s sales performance. *Journal of Business Research, 205*, Article 115909. https://doi.org/10.1016/j.jbusres.2025.115909
16. Lu, Z., Xia, H., Heo, S., & Wigdor, D. (2018). You watch, you give, and you engage: A study of live streaming practices in China. In *CHI ’18: Proceedings of the 2018 CHI Conference on Human Factors in Computing Systems* (pp. 1–13). ACM. https://doi.org/10.1145/3173574.3174040
17. Luo, X., Lim, W. M., Cheah, J.-H., Lim, X.-J., & Dwivedi, Y. K. (2025). Live streaming commerce: A review and research agenda. *Journal of Computer Information Systems, 65*(3), 376–399. https://doi.org/10.1080/08874417.2023.2290574
18. Pagáč, T., Bernhaupt, R., & Kriglstein, S. (2025). A scoping literature review on influencing factors in live-streaming spectatorship experience. *Entertainment Computing, 52*, Article 100872. https://doi.org/10.1016/j.entcom.2024.100872
19. Sjöblom, M., Törhönen, M., Hamari, J., & Macey, J. (2019). The ingredients of Twitch streaming: Affordances of game streams. *Computers in Human Behavior, 92*, 20–28. https://doi.org/10.1016/j.chb.2018.10.012
20. Song, D., Chen, X., Guo, Z., & Jin, R. (2026). Effects of social solicitation on e-commerce livestreaming performance. *Journal of Management Information Systems, 43*(1), 307–330. https://doi.org/10.1080/07421222.2025.2602393
21. Taylor, T. L. (2018). *Watch me play: Twitch and the rise of game live streaming*. Princeton University Press.
22. Wang, Y., Lu, Z., Cao, P., Chu, J., Wang, H., & Wattenhofer, R. (2022). How live streaming changes shopping decisions in e-commerce: A study of live streaming commerce. *Computer Supported Cooperative Work, 31*, 701–729. https://doi.org/10.1007/s10606-022-09439-2
23. Wang, Z., Luo, C., Luo, X. R., & Xu, X. (2024). Understanding the effect of group emotions on consumer instant order cancellation behavior in livestreaming e-commerce: Empirical evidence from TikTok. *Decision Support Systems, 179*, Article 114147. https://doi.org/10.1016/j.dss.2023.114147
24. Wei, G. G. Z., Lee, Z. W. Y., Chan, T. K. H., Liu, W., & Su, W. T. (2026). Revisiting parasocial and trans-parasocial concepts in live streaming: A literature review and research agenda. *Internet Research*. Advance online publication. https://doi.org/10.1108/INTR-07-2024-1170
25. Wohn, D. Y., Freeman, G., & McLaughlin, C. (2018). Explaining viewers’ emotional, instrumental, and financial support provision for live streamers. In *CHI ’18: Proceedings of the 2018 CHI Conference on Human Factors in Computing Systems*. ACM. https://doi.org/10.1145/3173574.3174048
26. Xie, S., Sharma, S., & Mehra, A. (2025). Designing e-commerce livestreams: How product presentation duration affects sales? *Production and Operations Management, 34*(12), 1–18. https://doi.org/10.1177/10591478251314455
27. Yang, Y., Zhao, J., & Li, Y. (2025). More than enough is too much: Curvilinear relationship between anchor body movements and sales in live streaming e-commerce. *Journal of Retailing and Consumer Services, 84*, Article 104211. https://doi.org/10.1016/j.jretconser.2024.104211
28. Yu, L., Gong, W., & Zhang, D. (2024). Live streaming channel recommendation based on viewers’ interaction behavior: A hypergraph approach. *Decision Support Systems, 184*, Article 114272. https://doi.org/10.1016/j.dss.2024.114272
29. Zhang, N., & Ruan, C. (2024). Danmaku consistency reduces consumer purchases during live streaming: A dual-process model. *Psychology & Marketing*. Advance online publication. https://doi.org/10.1002/mar.22074
30. Zhang, X., Chen, J., Ge, J., Li, Q., Ma, L., Pan, B., & Luo, Y. (2026). Grounded product understanding in livestream videos. *arXiv*. https://doi.org/10.48550/arXiv.2609.20508
31. Zhao, K., Hong, Y., Ma, T., Lu, Y., & Hu, Y. (2025). Lost in the crowd: How group size and content moderation shape user engagement in live streaming. *Information Systems Research*. Advance online publication. https://doi.org/10.1287/isre.2022.0086
32. Zheng, Y., Wu, D., Ke, Y., Yang, C., Chen, M., & Zhang, G. (2017). Online cloud transcoding and distribution for crowdsourced live game video streaming. *IEEE Transactions on Circuits and Systems for Video Technology, 27*(8), 1777–1789. https://doi.org/10.1109/TCSVT.2016.2556584
