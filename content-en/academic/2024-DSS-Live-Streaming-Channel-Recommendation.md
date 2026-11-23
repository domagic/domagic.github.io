---
title: "Live streaming channel recommendation based on viewers' interaction behaviour: A hypergraph approach"
slug: live-streaming-channel-recommendation
type: academic
tags: [live-streaming|Live streaming, recommender-system|Recommender systems, hypergraph|Hypergraph, paper-notes|Paper notes]
date: 2026-11-19T00:00:00.000Z
visibility: public
status: published
summary: "Live streaming recommendation struggles to accurately characterise viewers' interests from their rich interaction behaviours. We propose the hypergraph recommendation model VIBM-Hyper, which uniformly models multiple interaction types — watching, danmaku, virtual gifting, subscription and purchasing — as a hypergraph, separately capturing associations among viewers and among channels, and substantially improving the personalised recommendation of live streaming channels."
authors: [Li Yu, Wei Gong, Dongsong Zhang]
venue: Decision Support Systems
year: 2024
---

**Table 1 Basic paper information**

| Item | Content |
|---|---|
| Original title | Live streaming channel recommendation based on viewers' interaction behaviour: A hypergraph approach |
| Authors | Li Yu, Wei Gong, Dongsong Zhang |
| Publication | Decision Support Systems, 184 (2024), 114272 |
| Online publication | 1 July 2024 |
| DOI | [10.1016/j.dss.2024.114272](https://doi.org/10.1016/j.dss.2024.114272) |
| Method name | Viewers' Interaction Behaviour Modelled by Hypergraphs (VIBM-Hyper) |
| Keywords | Interaction behaviour; Live streaming; Recommender systems; Hypergraph; Graph neural networks |

![Figure 1 First page of the Elsevier-published paper (masthead, title and authors)](assets/2024-DSS-Live-Streaming-Channel-Recommendation/figure-01.png)

**Figure 1 First page of the Elsevier-published paper (masthead, title and authors)**

## 1. Research phenomenon: How do live streaming interactions reflect viewers' interests?

### 1.1 Starting point in practice: With channels ever increasing, how do viewers find live streams that interest them?

Live streaming platforms simultaneously offer content spanning gaming, music, everyday sharing and product sales. For viewers, the difficulty of choosing arises not only from the sheer number of channels but also from the differences between them: even within gaming live streams, different streamers vary in their narration style, interaction style and audience atmosphere. Platforms therefore need to provide personalised recommendation (Personalised Recommendation) on this basis, helping different viewers find channels that match their own interests.

Viewers' preferences (Preference) for channels are rarely expressed directly through a complete rating table; instead, they are scattered across actual behaviours. Watching live content (Watching Live Content), sending danmaku (Danmaku), giving virtual gifts (Virtual Gifts), subscribing to a channel (Subscribing to a Channel) and purchasing an item (Purchasing an Item) can all provide interest cues from different angles. The immediate question facing the platform is therefore: **how can we infer a viewer's interest in channels they have not yet selected from the interactions they have already performed?**

### 1.2 From single interactions to group associations

Consider a concrete scenario: viewer X has sent gifts in channels A and B, and viewer Y has also sent gifts in both of these channels; meanwhile, the two mainly send danmaku in other channels. This scenario contains two kinds of associations that recommendation can exploit.

The first is **associations between viewers**. X and Y interacting in similar ways in the same channels suggests that they may share interests in streamer style, content type or mode of participation. The second is **associations between channels**. A and B being engaged with in the same way by the same viewer suggests that the two may jointly satisfy some need of that viewer.

These associations have a set-like nature: a channel can connect to many viewers, a viewer can connect to many channels, and the same individual can belong to multiple behaviour sets at once. Consequently, a record such as 'viewer X sent a gift in channel A' is both an individual interaction and a component of a broader network of preference associations.

### 1.3 Going beyond whether a behaviour occurs to consider behaviour type and intensity

Different interaction modes provide different preference cues. For example, the same viewer may post frequently in one type of channel while giving gifts in another. Even for the same behaviour type, the intensity can differ: sending a single danmaku versus sending several in succession, or giving gifts of different values, reflects different degrees of engagement.

This yields three progressive levels of observation: **interaction records provide basic associations, behaviour types reveal different facets of preference, and behaviour intensity further refines these facets.** A recommendation model needs to convert this information into computable and comparable preference representations.

## 2. Research question: How can we recommend channels using multi-behaviour group relationships?

### 2.1 Research objective at the application level

The task addressed in this study is as follows: given a viewer's historical interaction behaviours (Historical Interaction Behaviours) together with viewer profile (Viewer Profile) and channel profile (Channel Profile) information, predict the viewer's degree of interest in candidate channels and generate a top-K recommendation (Top-K Recommendation).

Let $U$ denote the set of viewers, $C$ the set of channels and $B$ the set of behaviours. A historical record can be written as $(u,c,b)$, indicating that viewer $u$ performed behaviour $b$ in channel $c$. The model outputs a score $\hat y(u,c)$; the higher the score, the more preferentially the channel is recommended to that viewer.

The key to this task is not merely accumulating more behaviour records, but organising the relationships within them: who shares similar preferences with whom, which channels have common appeal, and how different interaction modes should jointly contribute to the judgement.

### 2.2 Two interconnected research questions

**Research question 1: How can viewer–channel associations at the group level be represented?**

It is necessary to express both 'the set of viewers connected to a given channel' and 'the set of channels connected to a given viewer', while preserving the discriminative information provided by behaviour type and intensity. This addresses the question of how historical interactions are organised.

**Research question 2: How can preferences be learned from these associations and used for recommendation?**

Once the relational structure is established, representation learning (Representation Learning) is needed to convert its information into vectors, then fuse the contributions of different behaviours, and finally compute the degree of match between a viewer and a channel. This addresses the question of how a relational structure is transformed into recommendation capability.

The two questions form a continuous path: **first organise the relationships, then learn representations, and finally perform ranking.**

## 3. Scientific questions and design principles: From business relationships to learnable mechanisms

### 3.1 Abstracting scientific questions from application problems

Moving from interaction records to recommendation results requires addressing three scientific questions in sequence: relationship representation, information propagation and preference integration.

**Table 2 Scientific questions on relationship representation, information propagation and preference integration**

| Level | Scientific question | Mechanism to be established |
|---|---|---|
| Relationship representation | How can multi-entity associations in heterogeneous interactions be represented as a unified structure? | A structural representation preserving member sets, behaviour categories and association directions |
| Information propagation | How can individuals obtain preference information from other members through shared sets? | Information aggregation and propagation along group relationships |
| Preference integration | How can different behaviours and different matching perspectives be integrated into a single ranking criterion? | Behaviour-weighted fusion and complementary scoring |

Higher-order relations (Higher-Order Relations) here refer to an association involving multiple entities at once, for example a channel together with a set of viewers who send danmaku in it. Their research significance lies in the fact that individual preferences can be supplemented through shared behaviour sets, rather than relying solely on each individual's limited direct records.

### 3.2 Design principle 1: Preserving group relationships with hyperedges

A hypergraph (Hypergraph) consists of vertices (Vertex) and hyperedges (Hyperedge). A hyperedge can connect multiple vertices simultaneously, making it suitable for expressing the structure of 'an association containing a group of members'.

Once viewers who jointly participate in a given channel with a given behaviour are organised into a set, the model can aggregate information around that set; once the multiple channels a given viewer has participated in are organised into a set, the model can learn associations between channels from the other side. The two perspectives derive from the same batch of interaction records but emphasise different shared relationships.

### 3.3 Design principle 2: Complementing viewer and channel representations through dual-view propagation

The channel view connects multiple viewers, allowing viewer representations to absorb information from members of the same group; the viewer view connects multiple channels, allowing channel representations to absorb information from channels in the same group.

On this basis, hypergraph convolution (Hypergraph Convolution) performs information propagation of the form 'vertex → hyperedge → vertex': it first forms a set-level summary and then transmits the summary back to the members. Multi-layer propagation allows information to spread progressively through overlapping sets.

### 3.4 Design principle 3: Weighting by behaviour, then combining two matching perspectives

After representations are learned separately for each behaviour, behaviour-aware attention (Behaviour-Aware Attention) determines their relative weights in the fusion. In this way, the final representation contains multiple interaction signals simultaneously and allows different entities to have different behaviour weights.

At the scoring stage, one path examines the degree of match between the viewer's overall representation and the candidate channel, while another path examines the degree of association between the candidate channel and the channels with which the viewer has interacted historically. The two perspectives jointly constitute the basis for recommendation.

The overall design logic can therefore be written as:

> **Multi-behaviour interaction phenomenon → dual-view group relationships → hypergraph structure → group information propagation → behaviour-weighted representation → dual-path scoring → personalised ranking.**

## 4. Method overview: How is the overall design structured, and what problem does each module solve?

### 4.1 Overall idea: From interaction records to channel ranking

The design of VIBM-Hyper revolves around one objective: **using both 'which viewers share common interests' and 'which channels share common appeal' to determine what channels a viewer is likely to like.**

The model first organises historical interactions into two types of behaviour group, then learns viewer and channel features through the group relationships; it subsequently fuses different behaviours and profile information, scores from both the overall-preference and historical-channel perspectives, and finally generates a recommendation list.

![Figure 2 The VIBM-hyper framework.](assets/2024-DSS-Live-Streaming-Channel-Recommendation/figure-02.png)

**Figure 2 The VIBM-hyper framework.**

Figure 2 can be understood in three parts. The left side answers 'how historical interactions are organised': the same batch of records is grouped by channel and by viewer respectively. The middle answers 'how to learn from the relationships': group information is propagated via hypergraph convolution (Hypergraph Convolution), and different behaviours are fused using behaviour-aware attention (Behaviour-Aware Attention). The right side answers 'how a recommendation is formed': viewer profiles (Viewer Profile) and channel profiles (Channel Profile) are combined to obtain a matching score.

In the figure, viewer representations gradually form along the upper branch and channel representations along the lower branch; stacked layers denote multiple rounds of information propagation, small bars denote learned feature vectors, and the plus sign denotes the fusion of profile and behaviour features. The two information flows ultimately contribute jointly to channel scoring.

### 4.2 Dual-view graph construction: Organising the same interactions from two directions

**Channel-Oriented Behaviour Hypergraph (CBH)** first fixes a channel and then gathers the viewers who performed the same type of behaviour in that channel. For example, when multiple viewers give virtual gifts (Virtual Gifts) in a channel, a behaviour set is formed. This design provides viewers with shared-interest cues: one individual's preferences can be supplemented by the interactions of other viewers in the same group.

**Viewer-Oriented Behaviour Hypergraph (VBH)** first fixes a viewer and then gathers the channels in which that viewer performed the same type of behaviour. For example, when the same viewer gives gifts in three channels, these three channels form a behaviour set. This design provides channels with association cues: multiple channels may be linked because they satisfy some aspect of the same viewer's interests.

The two perspectives focus on viewer similarity and channel association respectively. The same viewer or channel can belong to multiple sets, allowing the model to exploit overlaps between sets to connect otherwise scattered interactions. Behaviour intensity can further subdivide these sets, for example by distinguishing different gift values or numbers of danmaku sent.

### 4.3 Convolution and attention: Learning preferences from group relationships

Once the graphs are constructed, the model needs to convert the relationships into vectors that can be computed and compared. Hypergraph convolution first aggregates the features of members within a behaviour set and then transmits the aggregated information back to the members. After multiple rounds of propagation, viewers can absorb preference information provided by co-participants, and channels can absorb feature information provided by related channels.

Different interaction modes form their respective representations. For example, a channel's features under the danmaku perspective can differ from its features under the gifting perspective. Behaviour-aware attention then assigns weights to these representations, forming a comprehensive behaviour representation through weighted combination. It addresses the question of **how multiple behaviours jointly contribute to the judgement**, enabling the model to coordinate the contributions of different signals.

### 4.4 Profile fusion and dual-path scoring: Considering both overall preference and historical choices

Profile information provides basic features, while behaviour information provides preference features learned from historical interactions. For example, a channel's type and description indicate its content positioning, whereas a viewer's participation in it provides actual interest cues. The model combines the two kinds of features to form the final viewer and channel representations.

The recommendation score consists of two complementary paths:

- **Overall matching path**: compares the final representations of the viewer and the candidate channel to determine whether the channel fits the viewer's overall preferences.
- **Historical association path**: compares the candidate channel with the channels the viewer has interacted with in the past to determine whether it shares features with those historical choices.

After the two scores are combined with weights, the model ranks the candidate channels. Training uses Bayesian personalised ranking (Bayesian Personalised Ranking, BPR), which encourages channels with observed interactions to be ranked ahead of sampled non-interacted channels, so that all modules learn towards the same ranking objective.

### 4.5 Module–design intent correspondence table

**Table 3 Design intent and output of each VIBM-Hyper module**

| Module | Problem addressed | Design approach | Resulting output |
|---|---|---|---|
| Dual-view hypergraph construction | How can behavioural associations among multiple viewers and channels be organised? | Gather viewers by channel and channels by viewer, distinguishing behaviours | Two complementary group relationship structures |
| Hypergraph convolution | How can group relationships supplement individual information? | Propagate features between members and sets over multiple rounds | Viewer and channel representations under different behaviours |
| Behaviour-aware attention | How do multiple interaction signals jointly contribute to the judgement? | Compute and fuse weights for different behaviour representations | Comprehensive behaviour representation |
| Profile fusion | How can both basic entity features and interaction preferences be considered? | Add profile representations to behaviour representations | Final viewer and channel representations |
| Dual-path scoring | How can overall interest and historical choices be combined? | Fuse viewer–channel matching and candidate–historical channel association | Personalised recommendation score |
| Ranking optimisation | How can the entire model serve the recommendation objective? | Increase scores of observed interacted channels relative to sampled non-interacted channels | Model parameters learned for channel ranking |

## 5. Experimental results: What do multi-behaviour and hypergraph structures contribute?

### 5.1 Data and comparison setup

The study uses datasets (Dataset) from two different application scenarios: one from virtual streamer (VTuber) live streaming and the other from live streaming e-commerce (Live Streaming E-Commerce).

**Table 4 Overview of the Bilibili-VTuber and MOGU datasets**

| Dataset | Scenario | Viewers | Channels | Interaction records |
|---|---|---:|---:|---:|
| Bilibili-VTuber | Live streams of gaming, singing and everyday sharing | 21,040 | 1,040 | 163,200 |
| MOGU | Live streaming e-commerce of apparel, beauty and jewellery | 186,539 | 2,620 | 7,165,582 |

The data is randomly split in an 8:1:1 ratio into a training set (Training Set), validation set (Validation Set) and test set (Test Set), and training uses random negative sampling. The comparison includes single-behaviour models (Single-Behaviour Models) and multi-behaviour models (Multi-Behaviour Models), among which are graph-learning or hypergraph-learning methods such as LightGCN, MBGCN, DHCN and DualHGCN.

Evaluation uses recall (Recall@K) and normalised discounted cumulative gain (Normalised Discounted Cumulative Gain, NDCG@K). Recall focuses on how many relevant channels appear in the top K; normalised discounted cumulative gain also considers the positions of hits, with higher rankings of relevant channels yielding better scores. The experiments set $K=20,40,80$.

### 5.2 Overall recommendation results

Table 5 presents side by side the results of the full model and the main baselines on both datasets.

**Table 5 Recommendation performance comparison of VIBM-Hyper and main baselines**

| Dataset / method | Recall@20 | NDCG@20 | Recall@40 | NDCG@40 | Recall@80 | NDCG@80 |
|---|---:|---:|---:|---:|---:|---:|
| Bilibili / MBGCN | 0.069 | 0.023 | 0.092 | 0.035 | 0.114 | 0.041 |
| Bilibili / MC-BPR | 0.065 | 0.018 | 0.079 | 0.037 | 0.108 | 0.040 |
| Bilibili / VIBM-Hyper | **0.082** | **0.031** | **0.103** | **0.040** | **0.121** | **0.046** |
| MOGU / MBGCN | 0.058 | 0.025 | 0.083 | 0.031 | 0.121 | 0.037 |
| MOGU / VIBM-Hyper | **0.061** | **0.027** | **0.090** | **0.032** | **0.123** | **0.043** |

The full model achieves the highest values on all reported metrics on both datasets. This indicates that organising multi-behaviour information into group relationships and using it for representation learning can improve channel recommendation quality under the evaluation settings adopted.

### 5.3 The role of multiple behaviours

Table 6 summarises the multi-behaviour ablation study (Ablation Study). On Bilibili-VTuber, CS, GP and DF correspond to watching, gifting and danmaku respectively. On MOGU, the three correspond to adding to cart, purchasing and favouriting respectively.

**Table 6 Recommendation performance comparison of the full model and single-behaviour versions**

| Method | Bilibili Recall@20 | Bilibili NDCG@20 | MOGU Recall@20 | MOGU NDCG@20 |
|---|---:|---:|---:|---:|
| Full model | **0.082** | **0.031** | **0.061** | **0.027** |
| CS only | 0.075 | 0.019 | 0.040 | 0.012 |
| GP only | 0.077 | 0.026 | 0.050 | 0.021 |
| DF only | 0.072 | 0.021 | 0.044 | 0.017 |

On both datasets, integrating multiple behaviours outperforms using any single behaviour alone. This means that different interaction modes provide preference cues that can be exploited jointly; after fusing these cues, the model can obtain more complete viewer and channel representations.

### 5.4 The role of hypergraph structure and propagation depth

**Table 7 Recommendation performance comparison of hypergraph and traditional graph structures**

| Structure | Bilibili Recall@20 | Bilibili NDCG@20 | MOGU Recall@20 | MOGU NDCG@20 |
|---|---:|---:|---:|---:|
| Full hypergraph model | **0.082** | **0.031** | **0.061** | **0.027** |
| Replaced with traditional graph structure | 0.064 | 0.020 | 0.052 | 0.019 |

In Table 7, the version using the hypergraph structure achieves higher values on both Recall@20 and NDCG@20 across the two datasets, echoing the design of supplementing preference information through group associations.

In terms of propagation depth, performance improves as the number of convolutional layers increases from one to three, and declines when increased further to five; three layers perform best among the settings examined. This result indicates that appropriately increasing the number of propagation layers allows the model to obtain more sufficient association information.

## 6. Advanced analysis: Relationship structure, mathematical notation and formula derivation

### 6.1 Overall framework

Figure 2 contains two parallel information flows. Viewer representations gradually form along the upper branch and channel representations along the lower branch. Both flows pass through graph construction, convolution and attention fusion, and finally converge on the right to compute the viewer's preference score for a channel.

**Step 1: Organise interaction records into two types of relationship.** At the far left, $u$ denotes a viewer and $c$ a channel. A viewer connected to multiple channels indicates that they have interacted with those channels; different icons and lines help distinguish interaction targets and behaviours. Upon entering the hypergraph construction module, the same batch of records is reorganised into two views: the upper view fixes a channel and places the relevant viewers into the same set, while the lower view fixes a viewer and places the relevant channels into the same set. Elliptical regions denote these sets, and overlapping regions indicate that different sets share members.

**Step 2: Let members exchange information through shared relationships.** The stacked layers marked $\ell=1,2,\ldots$ in the middle represent successive hypergraph convolutions. Each layer updates the features of members rather than adding a new batch of viewers or channels. For example, when a viewer participates in the same behaviour set as others, the updated vector incorporates information provided by those members; the next layer then continues propagation with the updated vectors.

**Step 3: Fuse the different behaviour perspectives.** The small bars to the left of the attention module denote embeddings (Embedding), that is, a set of learnable values that summarise entity features. $E^B_{ub_1},E^B_{ub_2},\ldots$ in the upper part correspond to the viewer's representations under different behaviours; $E^B_{cb_1},E^B_{cb_2},\ldots$ in the lower part correspond to the channel's representations under different behaviours. Attention computes weights along the behaviour dimension, fusing multiple vectors into the viewer behaviour representation $E_u^B$ and the channel behaviour representation $E_c^B$.

**Step 4: Combine profile information with behaviour information.** The viewer profile embedding (Viewer Profile Embedding) $E_u^p$ and channel profile embedding (Channel Profile Embedding) $E_c^p$ at the far right extract features from the entities' own descriptive text. The plus sign in the figure indicates element-wise addition with the behaviour representations, yielding the final vectors $E_u$ and $E_c$; the scoring component connecting the two at the far right outputs the matching result accordingly.

Thus, the key correspondences in this figure are: **ellipses describe to whom a relationship belongs, stacked layers describe how information propagates, small bars describe what has been learned, attention describes how fusion is performed, and the plus sign describes how profile information is supplemented.**

### 6.2 Dual-view behaviour hypergraphs: How to read nodes, anchors and regions?

![Figure 3 Channel-oriented and viewer-oriented behaviour hypergraphs](assets/2024-DSS-Live-Streaming-Channel-Recommendation/figure-03.png)

**Figure 3 The Channel-oriented Behaviour Hypergraph (CBH) and Viewer-oriented Behaviour Hypergraph (VBH).**

The two panels of Figure 3 show two ways of organising the same type of interaction data. $u_1,u_2,\ldots$ next to person icons denote viewers, $c_1,c_2,\ldots$ next to play or video icons denote channels; gift, dialogue and similar icons indicate behaviour types. The enclosed regions labelled A, B and C denote hyperedges, each bringing a group of related entities into one relationship. The letters merely distinguish the regions; their behavioural meaning must be understood in conjunction with the interactions inside each region.

**Left panel: Channel-Oriented Behaviour Hypergraph (CBH).**

The organisation in the left panel is as follows: first select a channel and a behaviour, then find the viewers who performed that behaviour. The channel is the basis of grouping, and the viewers are the members being connected.

- Region A connects viewers $u_1,u_2,u_3$ around channel $c_1$, representing the association formed by three viewers watching live content in that channel.
- Region B connects viewers $u_4,u_5,u_6$ around channel $c_2$; the gift icons in the figure correspond to the association formed by their gift-giving in that channel.
- Region C connects viewers $u_6,u_7$ around channel $c_3$, presenting another set of channel interaction relationships.

Here, $u_6$ lies in both B and C, indicating that the same viewer can participate in behaviour sets for different channels. Other members in B can first influence $u_6$'s representation through their shared relationship, and the updated information can then continue to propagate via another relationship in which $u_6$ participates. Such overlap turns independent interaction sets into an interconnected network.

The channels in the figure are located within their corresponding regions, indicating around which channel each group of interactions occurs. As far as viewer preference learning is concerned, the key point is that **viewers who jointly participate in the same channel with the same behaviour can share information through that set**. Even if a viewer has few records of their own, they can obtain supplementary cues from the histories of other viewers in the same group.

**Right panel: Viewer-Oriented Behaviour Hypergraph (VBH).**

The right panel reverses the basis of grouping: first select a viewer and a behaviour, then find the channels in which that viewer performed the behaviour. The viewer is the centre of organisation, and the channels are the members being connected.

- Region A centres on viewer $u_1$, connecting channels $c_1,c_2,c_3$, presenting the interaction relationships between one viewer and multiple channels.
- Region B centres on viewer $u_2$, connecting channels $c_4,c_5,c_6$, representing the association formed by this viewer giving gifts in three channels.
- Region C centres on viewer $u_3$, connecting channels $c_6,c_7$, forming another set of channel relationships.

Channel $c_6$ belongs to both B and C: it is associated both with a set of historical interactions by $u_2$ and with historical interactions by $u_3$. Consequently, $c_6$'s representation can pool channel information from different viewers' behaviour sets, and other channels can obtain indirect associations along these overlapping relationships.

This organisation transforms 'why the same person chooses multiple channels' into learnable channel associations. For example, when $c_4,c_5,c_6$ all attract gift-giving from $u_2$, the model jointly learns their representations under the gift-giving behaviour perspective.

**Table 8 Grouping basis and member relationships of the two behaviour hypergraphs**

| View | Object fixed first | Members collected | Example of set overlap | Main information learned |
|---|---|---|---|---|
| Channel-oriented behaviour hypergraph | Channel and behaviour type | Viewers performing that behaviour in the channel | Viewer $u_6$ belongs to both B and C | Shared preferences among viewers |
| Viewer-oriented behaviour hypergraph | Viewer and behaviour type | Channels in which the viewer performs that behaviour | Channel $c_6$ belongs to both B and C | Behavioural associations among channels |

The two hypergraphs are complementary: the former understands viewers through 'people who jointly choose a channel', while the latter understands channels through 'channels chosen by the same person'; the representations from both sides are then used for recommendation.

The two groupings can be expressed as a viewer set and a channel set respectively:

$$
\mathcal U_{c,b}=\{u\in U:\text{viewer }u\text{ performed behaviour }b\text{ in channel }c\},
\tag{1}
$$
$$
\mathcal C_{u,b}=\{c\in C:\text{viewer }u\text{ performed behaviour }b\text{ in channel }c\}.
\tag{2}
$$

The former is the viewer set under the channel view, and the latter is the channel set under the viewer view. They summarise the grouping basis: **fix the channel to look at viewers, fix the viewer to look at channels.**

Behaviour subcategories (Behaviour Subcategories) further subdivide the sets by intensity. For example, gift-giving can be divided by value ranges and danmaku by the number of messages sent, allowing relationships with different degrees of participation under the same behaviour to be expressed.

### 6.3 Initial representations: How do viewer and channel profiles enter the model?

The model uses the word vector model (Word2Vec) to encode the profile texts of viewers and channels. On the viewer side, personal bios are used; on the channel side, information such as channel type, title and description is used, yielding the viewer profile representation $E_u^p$ and the channel profile representation $E_c^p$ respectively.

Profile representations provide the basic features of viewers and channels: personal bios describe viewers' interests and identity characteristics, while channel type, title and description describe content positioning. Hypergraph propagation further supplements the behavioural features revealed by historical interactions. The two kinds of representation carry content information and collaborative relationships respectively, and are fused before the final scoring.

### 6.4 Hypergraph convolution: How does a single formula accomplish group information propagation?

The model adopts the following update rule:

$$
X^{(\ell+1)}=
\sigma\!\left(
D_v^{-1/2}HWD_e^{-1}H^TD_v^{-1/2}
X^{(\ell)}\Theta^{(\ell)}
\right).
\tag{3}
$$

Let $n$ be the number of vertices and $m$ the number of hyperedges; the meanings of the symbols are as follows.

**Table 9 Notation for hypergraph convolution and its computational role**

| Symbol | Meaning | Role in computation |
|---|---|---|
| $X^{(\ell)}$ | Node representation matrix at layer $\ell$ | Stores the current feature vector of each vertex |
| $H\in\mathbb R^{n\times m}$ | Incidence matrix (Incidence Matrix) | $H_{ve}$ indicates whether vertex $v$ belongs to hyperedge $e$ |
| $W$ | Hyperedge weight matrix (Hyperedge Weight Matrix) | Adjusts the propagation contribution of different relationship sets |
| $D_v$ | Vertex degree matrix (Vertex Degree Matrix) | Records the total degree to which a vertex participates in associations |
| $D_e$ | Hyperedge degree matrix (Hyperedge Degree Matrix) | Records the number of members contained in each hyperedge |
| $\Theta^{(\ell)}$ | Trainable feature transformation matrix | Learns which features to retain and combine in the next layer |
| $\sigma$ | Nonlinear activation function (Nonlinear Activation Function) | Applies a nonlinear transformation to the propagated features |

Under the common binary incidence matrix definition, the hyperedge degree is $\delta(e)=\sum_vH_{ve}$ and the weighted vertex degree is $d(v)=\sum_ew_eH_{ve}$; these form the diagonal elements of $D_e$ and $D_v$ respectively.

**Step 1: Scale the vertex inputs.** Let $\widetilde X=D_v^{-1/2}X^{(\ell)}$. The inputs of vertices participating in multiple relationship sets are first scaled by their degree, so as to coordinate the contributions of vertices with different activity levels during propagation.

**Step 2: Aggregate vertices into hyperedges.** Compute $Z=D_e^{-1}H^T\widetilde X$. Here $H^T$ collects member vectors by hyperedge, and $D_e^{-1}$ then performs normalisation (Normalisation) by the number of members. For a hyperedge with three members, this step amounts to summing the features of the three members and averaging them.

**Step 3: Transmit hyperedges back to vertices.** Compute $Y=D_v^{-1/2}HWZ$. $W$ first adjusts the contribution of each hyperedge, and $H$ then sends the hyperedge vector to its members. If a vertex belongs to multiple hyperedges, it receives information from multiple relationship sets.

**Step 4: Learn feature combinations.** Compute $X^{(\ell+1)}=\sigma(Y\Theta^{(\ell)})$, mapping the collected information into the next layer's representation space.

Expanding the matrix expression to a single vertex makes the propagation path more intuitive:

$$
x_v^{(\ell+1)}=
\sigma\!\left[
\sum_{e:v\in e}\sum_{v'\in e}
\frac{w_e}{\sqrt{d(v)}\,\delta(e)\,\sqrt{d(v')}}
x_{v'}^{(\ell)}\Theta^{(\ell)}
\right].
\tag{4}
$$

This expanded expression shows that vertex $v$ receives information from vertices $v'$ that share a hyperedge with it, with the magnitude of the contribution determined jointly by the hyperedge weight, the set size and the degrees of the two vertices. If two viewers jointly participate in multiple behaviour sets, their information can be transmitted along multiple paths.

After stacking multiple layers, a vertex not only absorbs information from members of directly shared sets, but also obtains more distant associations along overlapping sets. This ultimately yields the viewer representation $E^B_{ub}$ and channel representation $E^B_{cb}$ under behaviour $b$.

### 6.5 Behaviour-aware attention: How do different interactions form a unified representation?

Hypergraph convolution provides vectors from multiple behaviour perspectives. To fuse them, the model first computes the channel's average representation across behaviours:

$$
\bar E_c^B=\frac1{|B|}\sum_{b\in B}E_{cb}^B.
\tag{5}
$$

Here, $|B|$ denotes the number of behaviour categories, $E_{cb}^B$ denotes the vector of channel $c$ under behaviour $b$, and $\bar E_c^B$ is a reference vector formed jointly by all behaviours. It is used to compare the degree of association between each behaviour category and the overall behavioural characteristics.

Next, an inner product (Inner Product) is used to compute the association score:

$$
s(b,c)=(E_{cb}^B)^T\bar E_c^B.
\tag{6}
$$

If a behaviour vector is more consistent with the reference vector in direction and magnitude, its inner product is generally larger. Subsequently, the normalised exponential function (Softmax Function) converts these scores into weights that sum to one:

$$
w(b,c)=\frac{\exp[s(b,c)]}{\sum_{b'\in B}\exp[s(b',c)]}.
\tag{7}
$$

The denominator runs over all behaviour categories, making the weights positive and summing to 1. The final behaviour representation is:

$$
E_c^B=\sum_{b\in B}w(b,c)E_{cb}^B.
\tag{8}
$$

For example, suppose the scores of three behaviours are $0,\ln 2,0$; after exponentiation these become $1,2,1$, giving weights of $0.25,0.50,0.25$. The second behaviour thus contributes with a larger proportion to the final representation.

The viewer side adopts the corresponding behaviour fusion approach, yielding $E_u^B$. In this way, the model both preserves multi-behaviour information and can adjust the contributions of different signals according to the learned representations.

### 6.6 Profile and behaviour fusion: How is the final entity vector obtained?

The final representation takes the following form:

$$
E_u=E_u^p+E_u^B,\qquad E_c=E_c^p+E_c^B.
\tag{9}
$$

$E_u^p,E_c^p$ express profile features, while $E_u^B,E_c^B$ express behavioural features extracted from interaction relationships. Addition fuses the two kinds of information into the same representation space, forming the viewer and channel vectors used for subsequent matching.

### 6.7 First scoring path: Do the viewer and channel match overall?

The first path uses cosine similarity (Cosine Similarity):

$$
\hat y_1(u,c)=\frac{E_u\cdot E_c}{\|E_u\|\|E_c\|}.
\tag{10}
$$

The numerator computes the inner product of the two vectors, and the denominator normalises by their lengths, so this score mainly describes the degree of directional agreement between them. If the viewer and channel are close in direction in the learned interest space, the score is high.

This path reframes the question as: **after combining profile and behaviour information, does this channel fit the viewer's overall preferences?**

### 6.8 Second scoring path: Is the candidate channel related to historical channels?

The second path directly compares the candidate channel with the channels the viewer has interacted with historically:

$$
\hat y_2(u,c)=
\sum_{b\in B}\sum_{c_j\in N_b(u)}
(E_{cb}^B)^TM_bE_{c_jb}^B.
\tag{11}
$$

**Table 10 Notation and meaning for historical channel matching scores**

| Symbol | Meaning |
|---|---|
| $c$ | The candidate channel currently being scored |
| $N_b(u)$ | The set of channels in which viewer $u$ has performed behaviour $b$ |
| $c_j$ | A channel in that historical set |
| $E_{cb}^B,E_{c_jb}^B$ | Representations of the candidate and historical channels under the same behaviour perspective |
| $M_b$ | A behaviour-specific trainable relationship matrix |

Consider first the innermost term $(E_{cb}^B)^TM_bE_{c_jb}^B$. This is a bilinear matching (Bilinear Matching): $M_b$ learns how to combine the dimensions of the two channel vectors and then outputs their degree of association under behaviour $b$.

Then, summing over all historical channels under the same behaviour yields the historical support from that behaviour perspective; summing over different behaviours then aggregates multiple perspectives. For example, if a viewer has given gifts in two gaming channels and the candidate channel is associated with both of them in the gift-giving behaviour representation, it can obtain a high score from that historical set.

This path answers the question: **does the candidate channel have anything in common with the channels this viewer has actually interacted with in the past?**

### 6.9 How are the two paths combined into a recommendation score?

The final score is a linear combination (Linear Combination):

$$
\hat y(u,c)=\lambda\hat y_1(u,c)+(1-\lambda)\hat y_2(u,c).
\tag{12}
$$

$\lambda\in[0,1]$ controls the coefficients of the two scores in the final function. The model adopts $\lambda=0.5$, incorporating both overall preference matching and historical channel association into the decision. Subsequently, candidate channels for the same viewer are sorted in descending order of $\hat y(u,c)$, and the top K are selected.

### 6.10 Model training: How are interesting channels ranked higher?

The model uses the Bayesian personalised ranking (Bayesian Personalised Ranking, BPR) loss:

$$
\mathcal L=
\sum_{(u,c,c')\in O}
-\log\sigma\!\left(\hat y(u,c)-\hat y(u,c')\right)
+\beta\|\Theta\|_2^2.
\tag{13}
$$

$O$ is the set of training triples. Each triple contains a viewer $u$, a channel $c$ with an observed interaction, and a non-interacted channel $c'$ selected by negative sampling (Negative Sampling). Here $\sigma$ is the logistic function (Sigmoid Function), $\Theta$ denotes the trainable parameters, and $\beta$ is the regularisation (Regularization) coefficient.

Let the score difference be $\Delta=\hat y(u,c)-\hat y(u,c')$. The ranking loss for a single triple is equivalent to:

$$
\ell(\Delta)=-\log\sigma(\Delta)=\log(1+e^{-\Delta}).
\tag{14}
$$

When $\Delta=0$, the two are indistinguishable and the loss is about $0.693$; when $\Delta=2$, the interacted channel scores higher and the loss drops to about $0.127$; when $\Delta=-2$, the ranking direction is reversed and the loss is about $2.127$. Optimisation therefore drives interacted channels to obtain higher relative scores.

Its derivative with respect to the score difference is:

$$
\frac{\partial\ell}{\partial\Delta}=\sigma(\Delta)-1.
\tag{15}
$$

When the ranking direction is wrong or the gap is small, the update push is stronger; when the positive sample already leads clearly, the push gradually weakens. Parameters are updated by backpropagation (Backpropagation) through this loss, and are learned together with the hypergraph feature transformations and scoring matrices. The regularisation term constrains the parameter magnitude, so that representation learning balances ranking fit and parameter control.

## References

Yu, L., Gong, W., & Zhang, D. (2024). Live streaming channel recommendation based on viewers' interaction behaviour: A hypergraph approach. *Decision Support Systems, 184*, 114272. [https://doi.org/10.1016/j.dss.2024.114272](https://doi.org/10.1016/j.dss.2024.114272)
