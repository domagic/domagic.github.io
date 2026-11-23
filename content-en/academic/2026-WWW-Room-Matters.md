---
title: "Room Matters: Dynamic Room-level Collaboration Information Modeling for Live Streaming Recommendation"
slug: room-matters
type: academic
tags: [live-streaming|Live Streaming, dynamic-graph|Dynamic Graph, collaboration|Collaboration, recommender-system|Recommender System, paper-notes|Paper Notes]
date: 2026-11-19T00:00:01.000Z
visibility: public
status: published
summary: In live streaming recommendation, viewers' interests within the same live room shift across time segments, making static collaborative signals inadequate. We propose DCGLive, a dynamic room-level collaboration information model that jointly characterises co-viewing time overlap within a session and gifting behaviour, effectively improving the prediction of the next live room a viewer will enter.
authors: [Ke Guo, Changle Qu, Xiao Zhang, Liqin Zhao, Shijun Wang, Yanan Niu, Jun Xu]
venue: Proceedings of the ACM Web Conference 2026 (WWW '26)
year: 2026
---

**Table 1  Basic paper information**

| Item | Content |
|---|---|
| Original title | Room matters: Dynamic room-level collaboration information modeling for live streaming recommendation |
| Authors | Ke Guo, Changle Qu, Xiao Zhang, Liqin Zhao, Shijun Wang, Yanan Niu, and Jun Xu |
| Publication | Proceedings of the ACM Web Conference 2026 (WWW ’26) |
| Conference | April 13–17, 2026, Dubai, United Arab Emirates |
| Method name | DCGLive (Dynamic Collaboration-aware Graph learning approach for Live streaming recommendation) |
| Keywords | Live Streaming Recommendation, Dynamic Graph, Intra-room Collaboration |
| DOI | [10.1145/3774904.3792241](https://doi.org/10.1145/3774904.3792241) |
| Code | [DCGLive](https://github.com/imgkkk574/DCGLive) |

![Figure 1 First page of the ACM-published paper (title, authors, and affiliations)](assets/2026-WWW-Room-matters/figure-01.png)

**Figure 1  First page of the ACM-published paper (title, authors, and affiliations)**

## 1. Research Phenomenon: Viewers' Interests in the Streamer, the Session, and the Current Content Are Not Identical

The content of a livestream is generated continuously during viewing. A streamer might introduce city scenery in the morning and share pets in the afternoon. Of two viewers following the same streamer, one may want to watch only the scenery while the other wants only the pets. If the recommender records merely that both viewers watched this streamer, the two interests are merged onto the same object.

Even within the same live room, the content a viewer encounters depends on when they enter and leave. Some exit after the street-view segment, while others enter only when the food segment begins. Both have a watching record for the same live room, yet these two records mean different things for real-time interest. Viewers whose viewing intervals overlap substantially are more likely to have encountered the same content. In parallel, sending virtual gifts records a viewer's support for the streamer and can supply another type of preference cue.

![Figure 2 The relationships among streamers, live rooms, and viewers, and differences in co-viewing time segments](assets/2026-WWW-Room-matters/figure-02.png)

**Figure 2  The dynamics of room-level collaboration information.**

Figure 2 illustrates this phenomenon at three levels. **Figure 2(a)** places stream start, watching, and interaction with the streamer in the same scene, highlighting the role of the live room in connecting streamer and audience. **Figure 2(b)** holds the streamer fixed and shows how the topics of different sessions attract different viewers. **Figure 2(c)** holds the session fixed and compares the viewing intervals of three viewers along a single timeline. Viewers 1 and 2 overlap considerably, whereas Viewer 1 and Viewer 3 appear in the earlier and later stages respectively. This refines "having watched the same room" into "how much of the same time segment was watched". The likes and follows in the figure are illustrative; DCGLive actually constructs its graphs from watching and gifting behaviours.

## 2. Research Question: How Can We Predict the Live Room a Viewer Will Enter Next?

The research task is next-room prediction. The model processes watching and gifting events in chronological order, maintains the current states of viewers, sessions, and streamers, and then predicts the live room with which a given viewer will interact next. The unit of analysis is a distinguishable broadcast session. Rooms opened successively by the same streamer each have their own state.

**Research Question 1: How can we simultaneously preserve a viewer's preference for the streamer and their real-time interest in a specific session?** The two behaviour types have different targets: watching occurs in a specific session, while gifting points to the streamer. The model must retain each relationship separately while allowing both to jointly inform the judgement about the same viewer.

**Research Question 2: How can co-viewing timing and historical relationships participate in real-time updating?** Once the current viewer enters a room, the model can draw on the other viewers in that room and on the viewer's own history. The magnitude of the update should reflect how strongly this historical evidence relates to the current session, including how recent it is, which rooms were co-watched, and how long the actual overlap is in this session.

Cold start for new rooms is the starting problem for the above task. At the moment a room opens, it has no rich watching records; the model can first borrow information from the streamer's past sessions and recent state, then gradually form this session's own representation as new interactions arrive.

## 3. Scientific Questions and Design Principles

**Table 2  Scientific questions, design principles, and corresponding mechanisms**

| Scientific Question | Design Principle | Corresponding Mechanism |
|---|---|---|
| How can tripartite interactions evolving with events be represented? | Preserve each behaviour's target object and link the two relations through a shared viewer state | Viewer–room graph and viewer–streamer graph |
| How should node states be updated as events arrive? | Inherit one's own history, absorb the current interaction target, then introduce historical neighbours | Zero-order inheritance, first-order propagation, second-order aggregation |
| How can the strength of intra-room collaboration information brought by an interaction be assessed? | Combine historical recency, the set of co-interactions, and overlapping watch time within the room | LiveCI's user indicator and room indicator |
| How can an initial state be formed when the current session has no interactions? | Combine cross-session historical features of the same streamer with the most recent pre-stream state of that streamer | Room representation initialisation |

The four designs in Table 2 correspond to different time scales. Historical sessions provide cross-session context, the recent streamer state supplements pre-stream information, and new interactions update viewer and room representations one at a time. At prediction time, the current viewer state is also projected to the target moment, so that the recommendation adjusts to the time interval between two interactions.

## 4. Method at a Glance

![Figure 3 The overall framework of DCGLive](assets/2026-WWW-Room-matters/figure-03.png)

**Figure 3  Overall framework of DCGLive.**

### 4.1 Left Side: Giving a New Live Room a Starting Point

In Figure 3(a), pink nodes denote live rooms and green nodes denote streamers. The model first aggregates the end-state representations of the streamer's past rooms, then combines them with the most recent streamer representation before the stream starts to form the initial vector of the new room. The former provides the commonality across the streamer's historical sessions, while the latter provides the streamer's recent state.

### 4.2 Middle: How Do Watching and Gifting Jointly Affect Viewer State?

In the upper part of Figure 3(b), the User–Room Graph (U-R) records watching, with edges carrying watch duration. The lower User–Streamer Graph (U-S) records gifting events when they occur, with edges carrying gift counts. Both graphs are Continuous-Time Dynamic Graphs (CTDG). When a new event arrives, the model updates the corresponding graph and node representations in chronological order.

The blue vectors in the figure denote viewers. The downward dashed line in the middle denotes the shared user embedding. Each watching event first updates the viewer and the room. If the viewing is accompanied by gifting, the U-S graph then updates the same viewer vector and the streamer vector. The two updaters use separate parameters.

Every node update draws on three kinds of information: the node's previous state, the counterpart in this actual interaction, and historical neighbours connected through that counterpart or through the node itself. For example, after a viewer enters a room, the room can both absorb that viewer's features and refer to other rooms the viewer has watched in the past.

### 4.3 Right Side: How Do Co-presence Relations Modulate Updates?

Figure 3(c) shows the Live Collaboration-aware Indicators (LiveCI). The upper room indicator (LiveCI for Room, LR) starts from the current room's historical viewers and assesses how much collaborative information an incoming viewer brings to the room state. The comparison considers both whether historical interests are similar and whether their watch times in this room overlap. The lower user indicator (LiveCI for User, LU) starts from the viewer's historically watched rooms and assesses how much collaborative information the current room brings to the viewer state.

Both indicators give priority to recent neighbours. They respectively modulate the weight of neighbour information when updating rooms and viewers in the U-R graph; the yellow arrows in the figure point precisely to the upper update path.

### 4.4 Output: Ranking Candidate Rooms with the Prediction Vector

The model first projects the viewer state according to the time interval (projection), then predicts the vector of the next room. At evaluation time, the prediction vector is compared with each room's representation; a smaller distance means a higher rank. Training brings the prediction vector close to the vector of the actually interacted room and constrains viewer and room states to change smoothly between adjacent events. The gifting branch also learns to predict the streamer, supplementing the shared user representation with streamer-side signals.

## 5. Experimental Results

### 5.1 Data and Evaluation

The commercial data come from three consecutive weeks of logs from a livestreaming platform between December 2024 and January 2025. The public data use a sampled and filtered subset of Kuaishou's KuaiLive dataset.

**Table 3  Overview of experimental datasets**

| Dataset | Viewers | Rooms | Streamers | Interactions | U-R Density | U-S Density |
|---|---:|---:|---:|---:|---:|---:|
| KuaiLive | 9,574 | 2,951 | 749 | 257,811 | 0.9125% | 0.0051% |
| Commercial | 9,667 | 2,441 | 850 | 493,212 | 2.0901% | 0.0036% |

Training, validation, and test sets are split chronologically in an 80%/10%/10% ratio. Evaluation uses interaction-based all-ranking, determining the rank of the true room by the L2 distance from the prediction vector to each room representation. Metrics include Normalized Discounted Cumulative Gain (NDCG), Recall, and Mean Reciprocal Rank (MRR). With only one true room per prediction, Recall@K asks whether the true room enters the top K, NDCG@K assigns higher scores to higher positions within the top K, and MRR averages the reciprocal of the true rank.

### 5.2 Overall Performance

The paper compares four general recommendation methods with five dynamic recommendation methods. Table 4 lists the results of three representative methods on NDCG@10, Recall@10, and MRR.

**Table 4  Recommendation performance of DCGLive and representative baselines**

| Dataset | Method | NDCG@10 | Recall@10 | MRR |
|---|---|---:|---:|---:|
| KuaiLive | JODIE | 0.1074 | 0.2028 | 0.0974 |
| KuaiLive | DGCF | 0.1118 | 0.2210 | 0.1081 |
| KuaiLive | DCGLive | **0.1336** | **0.2614** | **0.1170** |
| Commercial | JODIE | 0.1973 | 0.3493 | 0.1683 |
| Commercial | DGCF | 0.2412 | 0.3985 | 0.2091 |
| Commercial | DCGLive | **0.2593** | **0.4463** | **0.2149** |

DCGLive achieves the highest values on all five metrics across both datasets. Taking Recall@10 as an example, it exceeds DGCF by 4.04 percentage points on KuaiLive and 4.78 points on Commercial. In the paper's tables, the MRR on KuaiLive is not marked as significant at the 0.05 level, while the other nine comparisons carry the corresponding marker.

### 5.3 Ablation and New-room Performance

The ablation study removes the gifting graph, room initialisation, and LiveCI in turn. Table 5 lists Recall@10 and MRR for each setting.

**Table 5  Ablation results for DCGLive modules**

| Setting | KuaiLive Recall@10 | KuaiLive MRR | Commercial Recall@10 | Commercial MRR |
|---|---:|---:|---:|---:|
| Remove U-S graph | 0.2282 | 0.1051 | 0.3903 | 0.2041 |
| Remove room initialisation | 0.2468 | 0.1103 | 0.4161 | 0.1980 |
| Remove LiveCI | 0.2550 | 0.1158 | 0.4321 | 0.2122 |
| Full model | **0.2614** | **0.1170** | **0.4463** | **0.2149** |

All three components bring gains in the settings shown. Measured by Recall@10, the largest drop occurs when the U-S graph is removed. Further component comparisons show that removing only the watch-time overlap weight yields performance between the full model and removing LiveCI entirely. In the initialisation comparisons, removing the recent streamer representation causes a larger decline than removing the historical session features.

The cold-start evaluation tracks rooms that appear for the first time in the test phase and the subsequent predictions made for them. On the KuaiLive subset, Recall@10 rises from 0.2432 when initialisation is removed to 0.2854 for the full model; on the commercial data it rises from 0.4307 to 0.4569. These results correspond specifically to the set of newly appearing rooms.

## 6. Advanced Analysis

### 6.1 Events, Graph Edges, and Shared State

An interaction with timestamp $t$ is written as a six-tuple. $u_t$ is the viewer, $r_t$ the live room, $s_t$ the streamer of that session, $w_t$ the watch duration, and $g_t$ the gift count. Let $t^-$ denote the moment before updating and $t^+$ the subsequent prediction moment.

$$
I_t=(u_t,r_t,s_t,w_t,g_t,t).
\tag{1}
$$

Each event adds a watching edge in $\mathcal G_t^{UR}$. A gifting edge is added to $\mathcal G_t^{US}$ only when $g_t\ne0$. The two updaters are connected through the viewer vector. If there is no gift, the U-R output is the viewer's final state; if there is a gift, the U-R output enters the U-S update process and the latter's output becomes the final state.

### 6.2 Initialisation of a New Room

Let $t_{r,0}$ be the start time of room $r$, $\mathcal H_{s,t_{r,0}}$ the set of rooms of streamer $s$ before that time, and $\bar{\mathbf e}_{r_j}$ the end-state embedding of historical room $r_j$. The historical room representations are first averaged, then averaged again with the streamer's most recent pre-stream representation.

$$
\mathbf e^H_{s,t_{r,0}}=\frac{1}{|\mathcal H_{s,t_{r,0}}|}\sum_{r_j\in\mathcal H_{s,t_{r,0}}}\bar{\mathbf e}_{r_j},\qquad
\mathbf e_{r,t_{r,0}}=\frac{\mathbf e^H_{s,t_{r,0}}+\mathbf e_{s,t_{r,0}^{-}}}{2}.
\tag{2}
$$

The left-hand average summarises the content and interaction features of the streamer's past sessions. The right-hand side combines this cross-session summary with the streamer's recent state. Initialisation only provides a starting point for the new room; each subsequent viewing event updates that room's own vector through the dynamic graph.

### 6.3 How Does LiveCI Compute Co-presence Collaboration Strength?

Let $\mathcal H_{u,t}$ be the set of rooms historically watched by viewer $u$, and $\mathcal H_{r,t}$ the set of historical viewers of room $r$. Write $\mathcal A_{v,t}=\mathcal H_{v,t}\cup\{v\}$ for the neighbourhood set that also includes the central node. Let $z$ denote a historical room and $x$ a historical viewer. $f$ uses Jaccard similarity, dividing the size of the intersection by the size of the union.

$$
f(A,B)=\frac{|A\cap B|}{|A\cup B|},\qquad
\kappa(v,\mathcal H)=\frac{\exp[-(t-t(v))]}{\sum_{v'\in\mathcal H}\exp[-(t-t(v'))]}.
\tag{3}
$$

$t(v)$ is the time of interaction with a historical neighbour. For the same set of neighbours, the more recent the interaction, the larger $\kappa$. The denominator makes the weights sum to 1, so what is compared is the relative contribution of each piece of historical evidence in this update.

$$
\begin{aligned}
\mathrm{LU}_{u,t}(r)&=\sum_{z\in\mathcal H_{u,t}}\kappa(z,\mathcal H_{u,t})\,f(\mathcal A_{z,t},\mathcal A_{r,t}),\\
\mathrm{LR}_{r,t}(u)&=\sum_{x\in\mathcal H_{r,t}}\kappa(x,\mathcal H_{r,t})\,f(\mathcal A_{x,t},\mathcal A_{u,t})\,[1+\mathrm{owt}_r(x,u)].
\end{aligned}
\tag{4}
$$

- **LU aggregates evidence from historical rooms.** For each $z$, compare its viewer neighbourhood with that of the current room $r$. If recently watched rooms share more viewers with the current room, the current room provides a stronger collaborative signal for that viewer.
- **LR aggregates evidence from historical viewers.** For each $x$, compare whether the rooms they watched overlap with those of the current viewer $u$. The Normalized Overlapping Watch Duration $\mathrm{owt}_r(x,u)$ further modulates the weight of this evidence, so that viewers whose watch segments are closer in the current session contribute more.

For example, if a historical viewer shares many historical rooms with the current viewer but enters much later in the current session, set similarity still provides collaborative evidence while the overlap factor contributes a smaller additional gain. In this way, LR uses both cross-session interest relations and within-session temporal information. LiveCI is computed directly from these statistics and is a non-parametric indicator.

### 6.4 What Do Zero-, First-, and Second-Order Updates Read?

Let $i$ denote the current interaction target: $i=r$ in the U-R graph and $i=s$ in the U-S graph. The following takes the viewer side as an example; the target side uses the corresponding update. $\mathbf e$ denotes a dynamic vector, $\mathbf f$ an input feature, $W$ and $\mathbf w_0$ learnable parameters, and $\phi_u$ an activation function.

$$
\begin{aligned}
\mathbf e_{u,t}^{(0)} &= \phi_u(W_0^u\mathbf e_{u,t^-}+\mathbf w_0\Delta t_u+W_0^f\mathbf f_u),\\
\mathbf e_{u,t}^{(1)} &= \phi_u(W_1^u\mathbf e_{i,t^-}+W_1^f\mathbf f_i),\\
\mathbf e_{u,t}^{(2)} &= \sum_{u_k\in\mathcal H_{i,t}}a_{u_k}\,\mathbf e_{u_k,t^-}.
\end{aligned}
\tag{5}
$$

**Zero-order inheritance** preserves the node's own state and adds the time since the last interaction $\Delta t_u$ and its own input features. **First-order propagation** reads the state and features of the current interaction target. **Second-order aggregation** reads the historical states of other viewers along $u\to i\to u_k$. For a live room, the symmetric path is $r\to u\to r_j$, linking the current viewer to rooms they watched in the past.

The second-order weights $a_{u_k}$ are produced by graph attention. The model concatenates the pre-update vectors of the target and each candidate neighbour, computes a score through a LeakyReLU (leaky rectified linear unit), and converts it into a weight via Softmax. This attention distributes weights among second-order neighbours. LiveCI, by contrast, modulates the overall strength of the first- and second-order contributions at the fusion stage.

### 6.5 Where Is LiveCI Added to the Update Equation?

Let $v$ denote the viewer or room to be updated, $C_v$ the corresponding LU or LR indicator, and $F_v$ the fusion function. The two fusion equations of the U-R graph can be written as a single unified expression.

$$
\mathbf e_{v,t}=F_v\!\left(
 W_v^{(0)}\mathbf e_{v,t}^{(0)}+
 [\alpha+(1-\alpha)C_v]\left(W_v^{(1)}\mathbf e_{v,t}^{(1)}+W_v^{(2)}\mathbf e_{v,t}^{(2)}\right)
\right).
\tag{6}
$$

The coefficient multiplies only the neighbour-related first- and second-order terms. The zero-order term continues to preserve the node's own history. $\alpha$ controls the base weight and $1-\alpha$ the influence of indicator variation. When $\alpha=1$, the coefficient on the neighbour terms is fixed at 1; the paper uses $\alpha=0.9$ on both datasets. The U-S graph likewise fuses three orders of representation, merging the terms directly with its own parameters.

### 6.6 From Temporal Projection to the Training Objective

Let $\Delta t=t^+-t$. The model uses a learnable vector $\mathbf w_t$ to turn the time interval into dimension-wise scaling coefficients. The symbol $\odot$ denotes the element-wise product, and $\mathrm{MLP}$ denotes a multi-layer perceptron.

$$
\hat{\mathbf e}_{u,t^+}=\mathrm{MLP}_u\bigl(\mathbf e_{u,t}\odot(\mathbf 1+\mathbf w_t\Delta t)\bigr),\qquad
\hat{\mathbf e}_{r,t^+}=\mathrm{MLP}_r\bigl(W_2\hat{\mathbf e}_{u,t^+}+W_3\mathbf f_u+W_4\mathbf f_r\bigr).
\tag{7}
$$

The first equation projects the current viewer representation to the prediction moment. For the same time interval the scaling factor is the same, yet the concrete projection still depends on the viewer's current state in each dimension. The second equation combines the projection with viewer and room features, outputting a room prediction vector that can be used for distance-based ranking.

Following the paper's time indexing, the U-R loss aligns the predicted room vector with the room representation $\mathbf e_{r,t}$ of the corresponding real interaction, while constraining the magnitude of change between adjacent states.

$$
\mathcal L_{UR}=\sum_{I_t}\left[
\|\hat{\mathbf e}_{r,t^+}-\mathbf e_{r,t}\|_2^2+
\lambda_u\|\mathbf e_{u,t}-\mathbf e_{u,t^-}\|_2^2+
\mu_r\|\mathbf e_{r,t}-\mathbf e_{r,t^-}\|_2^2
\right].
\tag{8}
$$

The first term is the prediction error; the latter two are temporal smoothness regularisation terms. $\lambda_u$ and $\mu_r$ control the permitted magnitude of change in viewer and room states respectively. U-S uses an analogous objective to predict the true streamer representation, computing the corresponding loss only on events with gifting.

### 6.7 How Does Temporal Batch Processing Support Parallel Training?

Temporal batch processing (T-Batch) scans events in order and assigns consecutive events of the same viewer or the same streamer to different batches. Let $\operatorname{last}_U[u_t]$ and $\operatorname{last}_S[s_t]$ be the most recently assigned batch indices for the two; then the batch index of a new event is

$$
k_t=1+\max\{\operatorname{last}_U[u_t],\operatorname{last}_S[s_t]\}.
\tag{9}
$$

After assignment, both records are updated with $k_t$. In this way, subsequent events of the same viewer or streamer wait until earlier events have been processed before using their state, while events in the same batch that share none of these nodes can be computed in parallel. During training, the parameters of the two graphs are updated separately by the Adam optimiser.

## References

Guo, K., Qu, C., Zhang, X., Zhao, L., Wang, S., Niu, Y., & Xu, J. (2026). Room matters: Dynamic room-level collaboration information modeling for live streaming recommendation. In *Proceedings of the ACM Web Conference 2026 (WWW ’26)* (pp. 6045–6056). Association for Computing Machinery. [https://doi.org/10.1145/3774904.3792241](https://doi.org/10.1145/3774904.3792241)
