---
title: "KuaiLive-M3: A multi-modal, multi-domain, and multi-feedback dataset for live streaming recommendation"
slug: kuailive-m3
type: academic
tags: [live-streaming|Live streaming, dataset|Dataset, multi-modal|Multimodal, cross-domain|Cross-domain, recommender-system|Recommender systems, paper-notes|Paper notes]
date: 2026-11-19T00:00:02.000Z
visibility: public
status: published
summary: "Research on live streaming recommendation lacks a dataset that simultaneously covers multimodal content, cross-domain behaviours and explicit preferences. KuaiLive-M3 aligns timestamped multimodal representations of live streaming segments and short videos, and incorporates questionnaire-based explicit feedback, supporting three benchmarks: cross-domain recommendation, highlight prediction and questionnaire-enhanced recommendation. Its data scale and benchmark results provide a reusable experimental foundation for live streaming recommendation research."
authors: [Ke Guo, Changle Qu, Jiayaqi Cheng, Xiao Zhang, Shijun Wang, Xiaoyu Zhang, Xueliang Wang, Le Zhang, Lantao Hu, Jun Xu]
venue: arXiv preprint
year: 2026
---

**Table 1 Basic paper information**

| Item | Content |
|---|---|
| Original title | KuaiLive-M3: A multi-modal, multi-domain, and multi-feedback dataset for live streaming recommendation |
| Authors | Ke Guo, Changle Qu, Jiayaqi Cheng, Xiao Zhang, Shijun Wang, Xiaoyu Zhang, Xueliang Wang, Le Zhang, Lantao Hu, and Jun Xu |
| Publication | arXiv preprint, arXiv:2607.24862v1 [cs.IR] |
| Version date | 26 July 2026 |
| Keywords | Dataset, Live Streaming, Cross-Domain Recommendation |
| Project | [KuaiLive-M3](https://imgkkk574.github.io/KuaiLive-M3/) |
| Code | [KuaiLive-M3](https://github.com/imgkkk574/KuaiLive-M3) |

![Figure 1 First page of the arXiv preprint](assets/2026-arx-KuaiLive-M3/figure-01.png)

**Figure 1 First page of the arXiv preprint (title, authors and affiliations)**

## 1. Research phenomenon: Why are playback logs insufficient to describe live streaming recommendation?

The objects of live streaming (Live Streaming) recommendation change over time. The same live stream may first introduce a product and then move on to a live demonstration. Although two viewers may have clicked into the same live room, they may have entered at different times and seen completely different content. If the data only records 'someone watched a certain live stream', it is difficult for researchers to link viewer behaviour to the images, sounds or topics of the moment.

Interest in live streams can also arise from short videos (Short Video). For example, a viewer may first watch a creator's short videos and later enter their live room when they go on air, or may be attracted by similar content made by another creator. Historical behaviour in short videos, shared creator identities across the two domains and content similarity each provide cues that can be used for live streaming recommendation.

Watching, liking and commenting are implicit feedback (Implicit Feedback). They record actual behaviour but can only indirectly express whether the viewer wants to watch again next time. After the same viewing session, a viewer may want the streamer to be recommended every time they go on air, may only want to see them occasionally, or may even wish to stop receiving recommendations. Asking viewers directly about their wishes yields questionnaire-based explicit feedback (Questionnaire-based Explicit Feedback). Therefore, a dataset capable of supporting live streaming recommendation research needs to answer three questions at once: what the viewer **saw at the time**, what they had **watched previously in other content contexts**, and what preferences they **expressed themselves**.

## 2. Research question: How can a single dataset be used to examine three types of live streaming recommendation problem?

The paper constructs KuaiLive-M3, aligning real-time live streaming content, live streaming and short-video behaviours, and live streaming questionnaires. Three benchmark tasks (Benchmark Tasks) correspond to three different prediction targets.

1. **Cross-domain Recommendation (Cross-domain Recommendation)**. Given a viewer's live streaming and short-video histories, can short-video behaviour help recommend live streamers? The output is a ranking of streamers.
2. **Live Stream Highlight Prediction (Live Stream Highlight Prediction)**. Given the segments already observed, is the next segment likely to have high retention and engagement? The output is a continuous score for the next live segment.
3. **Questionnaire-enhanced Recommendation (Questionnaire-enhanced Recommendation)**. Can combining explicitly expressed preferences for recommendation frequency with playback history improve streamer ranking? The output is also a streamer ranking, but the new signal of interest here is the live streaming questionnaire.

The first two exploit cross-domain histories and the segment sequence within a single live stream respectively. The third examines whether explicit intentions can supplement implicit behaviour. Although all three share the same underlying data, they have distinct settings for data filtering, temporal splitting and evaluation targets.

## 3. Scientific questions and design principles

**Table 2 Real-world problems, data design and their benchmark uses**

| Scientific question | Data design | Supported test |
|---|---|---|
| How can changes in live content over time be represented? | Provide timestamped segment-level embeddings (Segment-level Embeddings) and room-level embeddings (Room-level Embeddings) for the whole session | Predict the engagement level of the next segment from observed segments |
| How can short-video consumption be linked to live streaming interest? | Connect viewers and creators across both domains with consistent anonymous identifiers, and retain playback records and content vectors for each domain | Compare recommendation methods using only live streaming history versus those also using short-video history |
| How can engagement behaviour be distinguished from viewers' explicitly expressed recommendation preferences? | Provide viewing and interaction logs, and preserve questionnaire options and open-ended answers in the live streaming context | Test the ranking gain from adding questionnaire options to playback history |

These three designs align time, entities and feedback respectively. Temporal alignment links behaviour to live segments, entity alignment links the same viewer or creator to both content domains, and feedback alignment links viewing history to users' explicit intentions towards streamers. The aligned data allows the appropriate signals to be selected for each research task.

## 4. Data and method overview

### 4.1 What do the three Ms correspond to?

![Figure 2 Overview of the KuaiLive-M3 dataset](assets/2026-arx-KuaiLive-M3/figure-02.png)

**Figure 2 Overview of the KuaiLive-M3 dataset.**

The author (Author) at the top centre of Figure 2 can publish short videos to the left or go on air to the right. The viewer at the bottom centre can watch and interact on both sides. These two shared identities allow researchers to connect logs that were originally separate. On the short-video side, video-level embeddings (Video-level Embeddings) are generated for each whole video. On the live streaming side, content is cut into chronologically ordered segments, with both segment-level and room-level representations provided, so that one can compare whole sessions as well as track content changes within a single session.

Below Figure 2 is the questionnaire specific to the live streaming domain. The first question asks viewers to choose among 'recommend every time they go on air', 'recommend occasionally' and 'do not recommend any more'. Subsequent open-ended questions ask, depending on the choice, about what they like, what could be improved, or why they no longer wish to watch. Plays, likes and gifts record behaviour, whereas the questionnaire records users' expressed recommendation intentions. The benchmarks below use only the options from the first question; open-ended answers are retained in the data as a textual signal that can be studied separately.

### 4.2 How is the data collected and organised?

The study extracts from Kuaishou (Kuaishou) active users who generated at least one playback log per week between 4 and 31 March 2026, and collects live streaming and short-video behaviours during the same period. Short-video interactions are randomly sampled. On the live streaming side, plays and seven auxiliary behaviours are recorded: exposure without entry, comments, likes, shares, gifts, follows and reports. On the short-video side, plays as well as comments, likes, shares and follows are recorded.

**Table 3 Data scale of the two content domains in KuaiLive-M3**

| Content domain | Number of items | Playback records | Multimodal embeddings (Multimodal Embeddings) | Questionnaire answers |
|---|---:|---:|---|---:|
| Live streaming | 6,564,013 live rooms | 35,806,596 | 6,502,107 room-level vectors, 88,223,794 segment-level vectors | 25,403 |
| Short video | 6,741,159 videos | 111,329,814 | 5,498,631 video-level vectors | — |

The data covers 21,938 viewers and 2,185,201 creators. Of these, 1,061,343 creators went on air during the observation period, and 186,895 of these streamers also published short videos during the same period, accounting for 17.6% of streaming creators. This is the cross-domain identity overlap ratio within the observation window and helps explain why, in addition to user histories, creators can also connect the two domains. The data is released under CC BY-NC-SA 4.0 for non-commercial research and education.

### 4.3 How do content and viewing change over time?

![Figure 3 Interaction patterns in the live streaming domain](assets/2026-arx-KuaiLive-M3/figure-03.png)

**Figure 3 Analysis of interaction patterns in the live streaming domain.**

Figure 3(a) groups sessions by total broadcast duration, with the 2-to-4-hour group having the highest share at 32.8%. Figure 3(b) switches to the viewer's perspective, counting how many different live rooms each person watched over four weeks, with a median of 415. Figure 3(c) switches again to the room's perspective, counting how many sampled viewers watched a session; 60.4% of rooms have viewing records from only one sampled viewer. A single person can watch many rooms, while many rooms have very few viewing records in the sample. Together, these two distributions explain why rich user histories and sparse per-room interactions can coexist.

Figure 3(d) maps the start and end of each live stream to 0% and 100% respectively, then compares the number of concurrent viewers at each relative time point. The average curve in the figure peaks at about 28% and then gradually declines. The vertical axis is the normalised concurrent viewing volume, and the curve describes the overall trend at different relative time points in the observed sample. This motivates temporal prediction, because the session-wide average viewing volume erases within-session variation.

## 5. Benchmark experimental results

### 5.1 Cross-domain recommendation: Rich short-video histories need appropriate transfer methods

After applying 5-core filtering (5-core Filtering) separately per domain, the live streaming domain contains 7,075,864 interactions, 21,762 viewers and 302,643 creators, while the short-video domain contains 49,881,858 interactions, 21,823 viewers and 2,686,313 videos. Valid plays are used as positive examples for live streaming, while short-video positives require a watch progress exceeding 10%. The data is split temporally in an 8:1:1 ratio; the recommendation targets are live streamers, and evaluation uses recall (Recall) and normalised discounted cumulative gain (Normalised Discounted Cumulative Gain, NDCG).

**Table 4 Representative results of single-domain and cross-domain recommendation methods**

| Method | Type | Recall@10 | NDCG@10 | Recall@20 | NDCG@20 | Recall@40 | NDCG@40 |
|---|---|---:|---:|---:|---:|---:|---:|
| BPRMF | Single-domain | 0.0376 | 0.0965 | 0.0606 | 0.0917 | 0.0934 | 0.0953 |
| LightGCN | Single-domain | 0.0556 | 0.1358 | 0.0873 | 0.1278 | 0.1313 | 0.1315 |
| BiTGCF | Cross-domain | 0.0379 | 0.0898 | 0.0592 | 0.0852 | 0.0895 | 0.0889 |
| MGCCDR | Cross-domain | **0.0817** | **0.1795** | **0.1164** | **0.1651** | **0.1579** | **0.1633** |

MGCCDR has the highest values on all metrics among the thirteen methods compared in the paper. Taking Recall@10 as an example, it exceeds the second-place LightGCN by 2.61 percentage points. LightGCN uses only single-domain signals but outperforms all cross-domain methods except MGCCDR. This comparison indicates that the usefulness of auxiliary data depends on whether the transfer model can exploit the heterogeneous relations (Heterogeneous Relations) among viewers, streamers and short videos.

### 5.2 Highlight prediction: Temporal context helps predict the next segment

The experiment selects, from the 10,000 live rooms with the most playback interactions, sessions containing at least five valid segments and five viewers. The model input is the 128-dimensional embeddings of observed segments, and playback, like and comment logs are used to compute supervision labels (Supervision Labels). Live rooms are sorted by start time and split 70%, 10% and 20% into training, validation and test sets. Kendall's rank correlation coefficient (Kendall's $\tau$) measures the consistency between predicted and true rankings within a room, while mean average precision (Mean Average Precision, mAP) evaluates binary highlight identification.

**Table 5 Next-segment highlight prediction results of different methods**

| Method | Kendall's τ (Δ=0) | Kendall's τ (Δ=0.2) | Kendall's τ (Δ=0.4) | mAP |
|---|---:|---:|---:|---:|
| MLP | 0.1474 | 0.1248 | 0.0872 | 0.5149 |
| GRU | **0.5068** | **0.3070** | 0.2777 | **0.7776** |
| AntPivot-style | 0.5000 | 0.3055 | **0.2917** | 0.7744 |
| KuaiHL-style | 0.4988 | 0.3042 | 0.2887 | 0.7747 |

The multilayer perceptron (Multilayer Perceptron, MLP), which uses only the current segment, is inferior to the three temporal models. The gated recurrent unit (Gated Recurrent Unit, GRU) achieves the highest mAP, while AntPivot-style, which uses hierarchical causal attention, ranks best under the stricter segment-score gap threshold $\Delta=0.4$. In this benchmark, the difference brought by preserving the order of observed segments is greater than the differences among the three temporal models.

### 5.3 Questionnaire-enhanced recommendation: A small number of explicit choices can supplement playback history

The benchmark uses live playback records as implicit feedback, treating 'recommend every time they go on air' and 'recommend occasionally' as positive questionnaire feedback and 'do not recommend any more' as negative feedback. After 5-core filtering over the whole period, chronological leave-one-out (Chronological Leave-one-out) is used. Each retained positive streamer is ranked together with 99 random streamers that have never interacted with the user. Metrics include hit ratio (Hit Ratio, HR), NDCG and mean reciprocal rank (Mean Reciprocal Rank, MRR).

**Table 6 Representative results of questionnaire-enhanced streamer recommendation**

| Method | NDCG@5 | NDCG@10 | HR@1 | HR@5 | HR@10 | MRR |
|---|---:|---:|---:|---:|---:|---:|
| GRU4Rec | 0.8942 | 0.9022 | 0.8326 | 0.9431 | 0.9673 | 0.8826 |
| GRU4Recₘ | 0.9063 | 0.9126 | 0.8511 | 0.9497 | 0.9689 | 0.8957 |
| SASRec | 0.9153 | 0.9211 | 0.8646 | 0.9554 | 0.9731 | 0.9054 |
| SASRecₘ | **0.9231** | **0.9281** | **0.8742** | 0.9613 | 0.9768 | **0.9133** |
| FMLP-Rec | 0.9190 | 0.9248 | 0.8694 | 0.9583 | 0.9758 | 0.9093 |
| FMLP-Recₘ | 0.9216 | 0.9269 | 0.8722 | 0.9602 | 0.9762 | 0.9119 |
| DFN | 0.9203 | 0.9255 | 0.8671 | **0.9618** | **0.9778** | 0.9095 |

The subscript m indicates that the questionnaire is used as an additional behaviour signal. All three questionnaire-augmented versions outperform their playback-only counterparts on all six metrics. The advantage of SASRecₘ is mainly reflected in top-1 hits and ranking quality, while DFN leads in hit rates at top-5 and top-10. The scores here are obtained under a protocol of 100 candidate streamers per case, which is suitable for interpreting comparisons within the same task.

## 6. Advanced analysis

### 6.1 From raw logs to alignable research units

The released data contains 18 tables or collections. Shared anonymous identifiers allow records corresponding to the same viewer, creator or content to be linked. When building a task, one should first determine the prediction unit, then choose the joining keys and the availability time of the information.

**Table 7 Representative data tables and alignment units**

| Data | Representative file or directory | Joining unit and temporal semantics |
|---|---|---|
| Author profile (Author Profile) | `author_profile.csv` | `author_id` links streaming, short videos and creator attributes |
| Live viewing and session information | `live_interaction.csv`, `live_room_meta.parquet` | `user_id` and `live_id` link viewing records to sessions. Viewing records have entry and exit times; sessions have start and end times |
| Exposure and timestamped feedback | `live_show.parquet`, `live_like.csv`, `live_comment.csv` | Exposure without entry can serve as a negative behaviour cue. Like and comment events can be assigned to segments by time |
| Live segment vectors | `live_emb_128_ts/` | `live_stream_id`, `segment_id` and the segment-end timestamp |
| Live questionnaire | `live_questionnaire.csv` | Viewer, streamer and session identifiers link questionnaire options to subsequent answers |
| Short-video playback and content | `photo_play.parquet`, `photo_emb_128.parquet` | `photo_id` links playback events to video vectors; the same viewer and video may correspond to multiple plays |

The multimodal large language model (Multimodal Large Language Model, MLLM) uses inputs such as audiovisual segments, automatic speech recognition (Automatic Speech Recognition, ASR) transcripts, titles, descriptions and creator profiles. Through principal component analysis (Principal Component Analysis, PCA), live segment vectors are reduced to 128 dimensions, and the retained segments are aggregated to the room level and further reduced to 64 dimensions. Short videos provide 128-dimensional video-level vectors. Only live segments with interactions are retained, and the embedding timestamp records the segment's end time. The highlight benchmark uses the end time of the previous retained segment as the start time of the current segment, with the first segment starting at the broadcast start time.

### 6.2 How are highlight scores composed from viewing and interaction?

Let $r$ denote a live room and $k$ a segment within that room. $N^{\mathrm{entered}}_{r,k}$ is the number of recorded viewers who had entered the room by the start of the segment, and $N^{\mathrm{stay}}_{r,k}$ is the number of these viewers who remained until the segment ended. The live viewer retention rate (Live Viewer Retention Rate, LVTR) is:

$$
\mathrm{LVTR}_{r,k}=\frac{N^{\mathrm{stay}}_{r,k}}{\max(N^{\mathrm{entered}}_{r,k},1)}.
\tag{1}
$$

Equation (1) uses the number of viewers who entered before the current segment began as the comparison base, with 1 ensuring a positive denominator. If 20 viewers had entered and 12 of them stayed until the end, the retention rate is 0.60. Viewers who join during the segment are not part of the starting population for this retention calculation.

Engagement density (Engagement Density, ED) measures active feedback. $N^{\mathrm{like}}_{r,k}$ and $N^{\mathrm{comment}}_{r,k}$ are the numbers of like events and comment events within this segment respectively.

$$
\mathrm{ED}_{r,k}=\frac{N^{\mathrm{like}}_{r,k}+2N^{\mathrm{comment}}_{r,k}}{\max(N^{\mathrm{entered}}_{r,k},1)}.
\tag{2}
$$

Equation (2) counts events and gives comments twice the weight. For example, with the same base of 20 viewers and 4 likes and 3 comments in a segment, the engagement density is $(4+2\times3)/20=0.50$. Since likes and comments are events, engagement density describes the number of weighted interactions per unit of viewer base.

Subsequently, the supervision uses the two components separately min–max normalised (Min–max Normalisation) within each room. Denoting the normalised results by $\widetilde{\mathrm{LVTR}}$ and $\widetilde{\mathrm{ED}}$, the segment label is:

$$
y_{r,k}=0.6\,\widetilde{\mathrm{LVTR}}_{r,k}+0.4\,\widetilde{\mathrm{ED}}_{r,k}.
\tag{3}
$$

Equation (3) unifies retention and active interaction onto a relative scale within each room. If the two normalised components are 0.8 and 0.5, the segment score is 0.68. Each room is normalised separately, so the same score indicates relative performance within its own session. For binary evaluation, the 70th percentile of scores within the room is used as the threshold, and segments at or above the threshold are labelled as highlights.

### 6.3 Temporal boundaries of next-segment prediction

Let $\mathbf x_{r,j}$ be the vector of the $j$-th segment in live room $r$. Writing the paper's prediction setup as an input–output relationship makes the temporal misalignment between labels and features intuitive.

$$
\hat y_{r,k+1}=F_\theta(\mathbf x_{r,1},\ldots,\mathbf x_{r,k}).
\tag{4}
$$

In Equation (4), the right-hand side uses at most $k$, while the left-hand side predicts $k+1$. The viewing, likes and comments of the next segment are used afterwards to generate the target $y_{r,k+1}$. MLP takes only $\mathbf x_{r,k}$, GRU sequentially aggregates preceding states, AntPivot-style first models local changes with a local window and then integrates longer history with global causal attention (Causal Attention). KuaiHL-style directly uses causal self-attention (Causal Self-attention) on the observed sequence. All four share the content features and supervision definition; the difference lies mainly in how past segments are used.

### 6.4 How is supervision constructed for the two streamer recommendation benchmarks?

The cross-domain task treats users' short-video plays as auxiliary behaviour, with the goal of ranking from the set of creators on the live streaming side. The shared `user_id` lets the model learn along the same viewer's two-domain histories, while `author_id` provides creator identities that can be aligned across domains. The rule that short-video watch progress must exceed 10% determines which auxiliary interactions become positives, while the live streaming side retains the valid-play rule.

The questionnaire task treats the three options of the first question according to the direction of intention. The first two options are both positive, and the last is negative. The m versions of the sequence models add a questionnaire behaviour channel, allowing one-to-one comparison with their original versions. SAQRec takes a different route: it first trains prediction of questionnaire response propensity and satisfaction, and then uses the trained satisfaction model to provide supervision for the recommender. The two approaches use the questionnaire as a direct behaviour feature or as an indirect training signal respectively.

## References

Guo, K., Qu, C., Cheng, J., Zhang, X., Wang, S., Zhang, X., Wang, X., Zhang, L., Hu, L., & Xu, J. (2026). KuaiLive-M3: A multi-modal, multi-domain, and multi-feedback dataset for live streaming recommendation. *arXiv preprint arXiv:2607.24862*. [https://arxiv.org/abs/2607.24862](https://arxiv.org/abs/2607.24862)
