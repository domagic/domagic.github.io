---
title: "Grounded product understanding in livestream videos"
slug: grounded-product-understanding
type: academic
tags: [livestreaming|Livestreaming, ecommerce|E-commerce, multimodal|Multimodal, benchmark|Benchmark, paper-notes|Paper Notes]
date: 2026-11-19T00:00:04.000Z
visibility: public
status: published
summary: "Product information in livestreams is scattered across visuals and speech and spread over multiple clips, so systems need to both identify the product and locate the corresponding evidence. This work builds the GPUB benchmark and the UniPro method to jointly model product identity and temporal localisation. UniPro achieves the best results in both full-catalogue retrieval and localisation experiments, and the joint metric can distinguish models with similar product recognition but different evidence localisation capabilities."
authors: [Xinyu Zhang, Junjie Chen, Jiawei Ge, Qianlong Li, Libin Ma, Baokun Pan, Yahui Luo]
venue: arXiv preprint
year: 2026
---

**Table 1. Basic paper information**

| Item | Content |
|---|---|
| Original title | Grounded product understanding in livestream videos |
| Authors | Xinyu Zhang, Junjie Chen, Jiawei Ge, Qianlong Li, Libin Ma, Baokun Pan, and Yahui Luo |
| Publication | arXiv preprint, arXiv:2609.20508v2 [cs.CV] |
| Version date | 28 September 2026 |
| Benchmark name | GPUB (Grounded Product Understanding Benchmark) |
| Method name | UniPro |

![Figure 1. Front page of the arXiv preprint](assets/2026-arx-Grounded-product-understanding/figure-01.png)

**Figure 1. Front page of the arXiv preprint (title, authors and affiliations)**

## 1. Research phenomenon: Why is information about the same product scattered across a livestream?

In livestream e-commerce, the host may first show the overall cut of a garment, try it on a little later, and only after answering several viewer comments move the camera in to show the fabric and buttons. Some information can be seen in the visuals, such as the silhouette and details; other information is conveyed mainly verbally by the host, such as the material and how it feels to wear. The two kinds of information do not necessarily appear at the same moment. The same livestream may also contain other products, promotional talk and casual chat.

If a platform wants to automatically generate product-centric livestream clips, the system needs to know **which item in the catalogue this product is** and also **which clips demonstrate this product's features**. If the output gives the correct identifier for one top but the clips come from a similar top, the clip is still unusable. This advances the problem of livestream understanding by one step: the system needs to establish a correspondence (Product–Moment Correspondence) between product identity and temporal evidence.

## 2. Research question: How can we tell whether the system has found the right product and the right evidence?

The study proposes grounded product understanding (GPrU). The input is a complete livestream evaluation window, timestamped automatic speech recognition (ASR) text, and 30 candidate products. Each evaluation instance is annotated around one real target product. The model needs to rank the candidate products and predict one or more supporting intervals for the candidate product.

![Figure 2. Scattered evidence in a livestream and the three evaluation tasks](assets/2026-arx-Grounded-product-understanding/figure-02.png)

**Figure 2. Grounded product understanding in e-commerce livestreams.**

The upper part of Figure 2 places visuals, speech and the timeline side by side. An earlier display and try-on and a later description of material and details can provide evidence for the same garment, while the promotional and interactive segments in between need not be cut into the evidence clips. The three lower panels show the conditional differences between the tasks: on the left, product evidence clips are already given and the model finds the product in the catalogue; on the right, a textual query is already given and the model finds a time interval in the video; in the middle, no query naming the target is given, so the model must decide simultaneously which product it is and which clips belong to it.

**Table 2. Inputs and outputs of the three GPUB tasks**

| Task | Given | Output |
|---|---|---|
| Product retrieval | Cropped evidence clips, corresponding ASR, full product catalogue | Ranking of catalogue products |
| Product moment localisation (PML) | Full evaluation window, ASR, product-related textual query | Time intervals supporting the query and their confidence scores |
| Grounded product understanding (GPrU) | Full evaluation window, ASR, a fixed set of 30 candidates including the target | Product ranking and time intervals labelled with product identity |

## 3. Scientific questions and design rationale

**Table 3. Scientific questions and corresponding designs**

| Scientific question | Design rationale | Corresponding mechanism |
|---|---|---|
| How to distinguish products that look very similar? | Align livestream visuals with product images and text, and expose the model to difficult similar candidates | Product-aligned representation, hard negatives |
| How to extract multiple scattered pieces of evidence from a continuous livestream? | Preserve the temporal positions of visuals and speech, allowing relevant evidence to be distributed across multiple intervals | Multi-interval annotation, temporally anchored cross-attention |
| How to ensure that the located clips support the predicted product? | Constrain clip decoding with candidate products and require both product identity and temporal overlap to be satisfied | Product-conditioned decoding, joint evaluation |

Product recognition focuses on subtle differences between garments, while clip localisation focuses on the position of information on the timeline. UniPro lets the two tasks share audiovisual cues, carries out recognition and localisation separately through different output representations, and then aggregates the results over product–clip pairs.

## 4. Method at a glance

### 4.1 How does GPUB establish the correspondence between products and temporal evidence?

![Figure 3. Video-side construction pipeline of GPUB](assets/2026-arx-Grounded-product-understanding/figure-03.png)

**Figure 3. Video-side construction pipeline.**

**Stage 1: Verify the products.** The product catalogue is first standardised in its identifiers, duplicate stock keeping units (SKUs) are merged, metadata are normalised, and one main image that passes quality screening is kept for each product. A supervised-fine-tuned Chinese-CLIP is then used to retrieve candidates from 15-second clips, after which Qwen3-VL-32B-Instruct re-checks them using the whole window, the ASR and the product information. Only instances whose match can be confirmed proceed to the subsequent stages.

**Stage 2: Label evidence intervals.** The model first proposes candidates from timestamped ASR, then filters out promotion and casual chat, confirms the content using visuals, speech and product information, and corrects the boundaries. The pipeline sends uncertain instances for full manual review and also samples the remaining instances for audit. If the display, try-on and detail explanation of the same product are separated, they are kept as distinct intervals.

**Stage 3: Generate localisation queries.** A coarse-grained query asks about broader aspects such as material, design or try-on. A fine-grained query points to a specific attribute or action, such as showing pearl buttons. Annotators check whether the query matches the clip and adjust the boundaries as needed. This part of the annotation is used for PML; the product identities and evidence intervals from the first two stages are used for GPrU.

### 4.2 How does UniPro recognise products and localise evidence at the same time?

![Figure 4. Shared encoding, retrieval and temporal localisation in UniPro](assets/2026-arx-Grounded-product-understanding/figure-04.png)

**Figure 4. Overview of UniPro.**

The upper part of Figure 4 shows the product-aligned multimodal representation. The three rows on the left are the livestream visuals with ASR, the product main image with its title, and the textual query for the localisation task. On the livestream side, a visual-conditioned utterance selector first keeps complete sentence segments relevant to the visuals, reducing irrelevant speech within a limited input budget. The shared encoder uses Qwen3-VL-Embedding-2B to encode the various inputs in a comparable space. The retrieval branch in the upper right summarises the video into a global vector and then compares it with product vectors using cosine similarity.

The lower part of Figure 4 shows temporal evidence grounding. The model places a series of temporal anchors along the video, each of which extracts information from nearby or related visual and speech tokens. The moment decoder then predicts the start and end positions and the confidence of an interval, conditioned on the question or the candidate product. PML conditions decoding on the query vector, while GPrU decodes separately for each candidate product. All candidates share the same temporal representation of the video, and the product condition determines which kind of evidence should be extracted from it.

## 5. Experimental results

### 5.1 Data scale and evaluation protocol

The evaluation catalogue contains 31,831 apparel items. For GPrU, 30 candidates are fixed in advance for each window: one is the target product and the remaining 29 are the most similar non-target products selected by an embedding model. The position of the target among the candidates is random. Full-catalogue product retrieval uses cropped evidence clips as input, differing from GPrU in both the candidate scope and the input conditions.

**Table 4. GPUB train, validation and test splits**

| Statistic | Train | Validation | Test |
|---|---:|---:|---:|
| Livestream windows | 6,145 | 500 | 3,000 |
| Original livestream sessions | 2,311 | 239 | 1,798 |
| Distinct target products | 2,693 | 214 | 1,641 |
| Product evidence intervals | 15,708 | 1,373 | 8,975 |
| PML queries | 5,393 | 433 | 2,497 |

When splitting, windows sharing the same original livestream session or target product were assigned to the same set. The paper reports that evaluation videos last about 4 to 5 minutes on average, that 69.48% of product evidence intervals are shorter than 30 seconds, and that 43.13% of task annotation units contain multiple ground-truth intervals. The localisation task must find both short clips and all the scattered evidence.

### 5.2 Overall performance: Ranking the product first and localising the evidence correctly are two different things

Product retrieval uses metrics such as recall and mean reciprocal rank (MRR). The localisation and joint tasks use temporal intersection over union (tIoU) to judge whether two intervals overlap sufficiently. All the values below are percentages reported in the paper.

**Table 5. Representative results for full-catalogue retrieval and product moment localisation (%)**

| Task | Model | Metric | Value |
|---|---|---|---:|
| Product retrieval | Qwen3-VL-Embedding-8B | R@1 | 15.05 |
| Product retrieval | UniPro | R@1 | **33.47** |
| Product moment localisation | Qwen3-VL-8B (SFT) | mAP@.3 | 46.28 |
| Product moment localisation | UniPro | mAP@.3 | **53.50** |

**Table 6. Joint performance with 30 fixed candidates (%)**

| Model | Product R@1 | Pair mAP@.3 | Pair mAP@.5 | Joint R@1@.3 |
|---|---:|---:|---:|---:|
| Qwen3-VL-8B | 39.10 | 10.13 | 5.03 | 18.03 |
| Qwen3-VL-8B (SFT) | 38.60 | 21.92 | 13.77 | 35.47 |
| UniPro | **39.40** | **24.58** | **14.33** | **38.81** |

Among the 30 candidates, Qwen3-VL-8B and UniPro rank the correct product first in 39.10% and 39.40% of cases respectively, a difference of 0.30 percentage points. Once the evidence requirement is added, their Joint R@1@.3 scores differ by 20.78 percentage points. This contrast demonstrates the value of the joint metric: it can distinguish models with similar product recognition ability but different evidence localisation ability. Compared with Qwen3-VL-8B trained with task-specific supervised fine-tuning (SFT), UniPro's Pair mAP@.3 is 2.66 percentage points higher.

### 5.3 Ablation study: What roles do the two representations and the speech transcript play?

**Table 7. Representative ablation results for representation design and ASR selection (%)**

| Setting | Product R@1 | Localisation mAP@.3 | Pair mAP@.3 |
|---|---:|---:|---:|
| Remove the separate retrieval representation and use the temporally structured representation for retrieval | 13.64 | 44.59 | 10.23 |
| Remove the temporally structured representation | 38.80 | 50.66 | 21.57 |
| No ASR | 37.97 | 48.70 | 19.94 |
| Unfiltered ASR | 38.20 | 56.12 | 23.76 |
| Full UniPro | **39.40** | **56.76** | **24.58** |

The separate retrieval representation is mainly responsible for distinguishing identity among similar products; removing it lowers product R@1 from 39.40% to 13.64%. The temporally structured representation is mainly responsible for localisation; removing it lowers localisation mAP@.3 by 6.10 percentage points. Removing ASR also degrades localisation and joint performance, indicating that speech provides evidence beyond the visuals. Filtered ASR achieves the highest Pair mAP@.3 in the table while controlling the input budget; when the localisation threshold is raised to 0.5, unfiltered ASR gives a localisation mAP of 33.52%, slightly higher than the 32.80% obtained with filtering.

## 6. Advanced analysis

### 6.1 How is a joint prediction represented?

Let the shared product catalogue be $G$, the evaluation window $V$, the timestamped transcript $A$, and the candidate set $C\subset G$. The ground-truth product is $p^*$ and its corresponding evidence set is $E^*$. Each evidence interval $e=[t_s,t_e]$ describes one piece of evidence for the same product. The model predicts, for candidate product $p_i$, the $j$-th interval $\hat m_{ij}=[\hat t_{ij,s},\hat t_{ij,e}]$. The object being scored is the pair $(p_i,\hat m_{ij})$, so the same time segment paired with a different product yields a different evaluation result.

### 6.2 How are temporal intersection over union, Pair mAP and Joint Recall computed?

Temporal intersection over union is the duration of overlap between a predicted interval and a ground-truth interval divided by the duration of their union.

$$
\operatorname{tIoU}(\hat m,e)=\frac{|\hat m\cap e|}{|\hat m\cup e|}.
\tag{1}
$$

If the prediction is seconds 20–40 and the ground-truth interval is seconds 30–50, the intersection is 10 seconds, the union is 30 seconds, and the tIoU is $1/3$. It therefore passes the 0.3 threshold but not 0.5. If that interval is assigned to another product, it does not count as a correct product–clip pair even if the times overlap.

Pair mean average precision (Pair mAP) sorts the predicted pairs within each window by confidence. For predictions with the correct product identity, a ground-truth clip that has not yet been occupied and that reaches the threshold is matched by the highest tIoU. Each piece of ground-truth evidence is matched only once. Unmatched predictions count as false positives, and missed ground-truth evidence still contributes to the denominator of average precision. Average precision (AP) is computed separately for each of the $N$ windows and then averaged.

$$
\operatorname{Pair\,mAP}@\tau=\frac1N\sum_{n=1}^{N}\operatorname{AP}_{n}^{\tau}.
\tag{2}
$$

Joint recall judges success at the level of the whole instance. Let the position of the ground-truth product in the ranking for the $n$-th window be $\operatorname{rank}_n(p_n^*)$, and let $\hat M_n(p_n^*)$ be the set of predicted intervals assigned to that product. Defining $\mathbf 1[\cdot]$ as the indicator function equal to 1 when the condition holds, we have

$$
\operatorname{Joint\,R}@K@\tau=\frac1N\sum_{n=1}^{N}
\mathbf{1}\!\left[\operatorname{rank}_n(p_n^*)\le K\ \land\ \exists\,\hat m\in\hat M_n(p_n^*),\ e\in E_n^*: \operatorname{tIoU}(\hat m,e)\ge\tau\right].
\tag{3}
$$

Equation (3) requires the correct product to be ranked in the top $K$ and at least one piece of its evidence to be found. If the target has three pieces of evidence and the system localises only one correctly, the instance still counts towards joint recall. Pair mAP further distinguishes whether the other two pieces are all found and whether false positives are ranked ahead of them.

### 6.3 How are product alignment and utterance selection trained?

The first stage fine-tunes the shared encoder with low-rank adaptation (LoRA). The same evidence clip and its target product serve as a positive pair, with the other products in the batch as negatives. Let $v_i$ be the vector of the $i$-th clip, $p_j$ the vector of the $j$-th product, $B$ the batch size and $\eta$ the temperature parameter; the in-batch contrastive loss is

$$
\mathcal L_{\mathrm{align}}=-\frac1B\sum_{i=1}^{B}\log
\frac{\exp(\operatorname{sim}(v_i,p_i)/\eta)}
{\sum_{j=1}^{B}\exp(\operatorname{sim}(v_i,p_j)/\eta)}.
\tag{4}
$$

The numerator measures the similarity of the matching product, while the denominator brings the similarities between the same clip and all products in the batch into the comparison. Reducing the loss raises the score of the matching item relative to the other products.

The second stage freezes the backbone and trains the utterance selector using the video–product matching objective. Let $u_i$ be the representation of the $i$-th sentence including its start time, end time and duration, and $v$ the global visual representation; the selection score is

$$
s_i^{\mathrm{sel}}=\mathrm{MLP}([u_i;v;u_i\odot v;|u_i-v|]).
\tag{5}
$$

The semicolon denotes concatenation, $\odot$ denotes element-wise multiplication, and the absolute value is also computed element-wise. The selector sees the representations of the text and the visuals, their dimension-wise interaction and their difference. High-scoring sentence segments are kept as complete units, retaining their original timestamps and order. The implementation selects sentence segments in 30-second blocks, with an overall ASR budget of 2,048 tokens. This step is supervised by the product matching results and requires no sentence-by-sentence relevance labels.

### 6.4 What is the difference between temporal anchors and moment queries?

The shared encoder outputs multimodal token states $H\in\mathbb R^{L\times d}$. Visual tokens carry frame times, and ASR tokens inherit the time interval of the corresponding sentence segment. Temporal anchors are spread evenly over a normalised timeline; for a video of duration $T$, the number of anchors is

$$
K(T)=\operatorname{clip}\!\left(\left\lceil\frac{T}{5\,\mathrm{s}}\right\rceil,16,128\right).
\tag{6}
$$

A 240-second window corresponds to 48 anchors. Cross-attention adds temporal encodings to both anchors and input tokens and a temporal distance bias to the attention scores, producing a time-ordered representation $Z$. The anchors organise the evidence across the whole video, and all candidate products share $Z$. A three-layer Transformer moment decoder then uses 10 learnable moment queries for each product or textual condition, outputting intervals and confidence scores.

### 6.5 How are clips matched to supervision and used in joint ranking?

When training localisation, Hungarian matching assigns predicted clips to ground-truth intervals one-to-one. The matching cost considers confidence, normalised boundary distance and temporal generalised intersection over union (tGIoU).

$$
C_{\mathrm{match}}=0.5C_{\mathrm{conf}}+5C_1+2C_{\mathrm{tGIoU}}.
\tag{7}
$$

The matching determines which predictions carry the supervision for which ground-truth intervals. The training objective also uses boundary error to refine interval positions, a ranking loss to give more accurate proposals higher confidence, and auxiliary supervision on foreground and boundaries to supplement temporal information.

At inference time, let $s_p^{\mathrm{ret}}$ be the retrieval similarity of product $p$ and $c_{p,j}$ the confidence logit of its $j$-th interval. Product–clip pairs are ranked as follows:

$$
s_{p,j}=\log\operatorname{softmax}_{p}\!\left(s_p^{\mathrm{ret}}/0.07\right)+\log\sigma(c_{p,j}).
\tag{8}
$$

The first term normalises across the candidate products, and the second term uses a sigmoid function to measure how strongly an interval supports that product. Adding the two terms in log space is equivalent to multiplying them on the original scale and then taking the logarithm. The model scores both the product itself and each piece of evidence for that product, so different intervals of the same product can occupy different positions in the final ranking.

## References

Zhang, X., Chen, J., Ge, J., Li, Q., Ma, L., Pan, B., & Luo, Y. (2026). Grounded product understanding in livestream videos. *arXiv preprint arXiv:2609.20508*. [https://arxiv.org/abs/2609.20508v2](https://arxiv.org/abs/2609.20508v2)
