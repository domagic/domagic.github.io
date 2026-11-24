---
title: "Artificial intelligence (AI) assistant in online shopping: A randomized field experiment on a livestream selling platform"
slug: ai-assistant-in-online-shopping
type: academic
tags: [livestreaming|Livestreaming, ecommerce|E-commerce, ai-assistant|AI Assistant, field-experiment|Field Experiment, paper-notes|Paper Notes]
date: 2026-11-24T00:00:07.000Z
visibility: public
status: published
summary: "Personalized answers in livestream selling are constrained by the streamer's time and attention. Can an AI livestream assistant improve transaction outcomes without disrupting viewing? Combining a randomized field experiment on a platform with an online experiment, the study examines how opening the assistant affects clicks, cart additions, orders, spending and returns, and the mechanisms of information provision and interruption. Orders rose by about 3.00% while clicks and cart additions were unchanged; the return rate among purchasers fell by 12.55% in relative terms; and sequential mediation shows the positive information path outweighs the negative path through interruption and uncertainty."
authors: [Lingli Wang, Ni Huang, Yumei He, De Liu, Xunhua Guo, Yan Sun, Guoqing Cheng]
venue: Information Systems Research
year: 2025
---

**Table 1. Basic paper information**

| Item | Content |
|---|---|
| Original title | Artificial intelligence (AI) assistant in online shopping: A randomized field experiment on a livestream selling platform |
| Authors | Lingli Wang, Ni Huang, Yumei He, De Liu, Xunhua Guo, Yan Sun, and Guoqing Cheng |
| Publication | Information Systems Research, 36(4), 2358–2374 (2025) |
| Online publication | 10 March 2025 |
| DOI | [10.1287/isre.2023.0103](https://doi.org/10.1287/isre.2023.0103) |

![Figure 1. First page of the INFORMS published version](assets/2025-ISR-AI-assistant-in-online-shopping/figure-01.png)

**Figure 1. First page of the INFORMS published article (masthead, title and authors)**

## 1. Research background: Constraints on personalized service in livestream commerce

Livestream selling allows a streamer to present products synchronously to a large audience, but the ability to answer individual questions is constrained by time and attention. In a fashion livestream, for example, the streamer typically prioritizes common information about fabric, fit and promotions, while size matching and return conditions may vary by consumer. When answers in the stream are not timely, consumers must search across the comment section, product detail pages and after-sales policies to find and integrate information. The cost of obtaining information rises, and consumers may make purchase decisions before confirming whether a product suits them.

An AI Streaming Assistant provides personalized answers by integrating product, promotion and after-sales information. Its theoretical role is twofold: timely information can reduce decision uncertainty, while interface prompts and private chats may divert consumers' attention from the streamer's presentation. The paper therefore examines the information benefits and viewing disruption of personalized service, and their combined effect on actual transaction outcomes.

## 2. Research objectives and core conclusions

The paper first estimates the effect of the platform opening the AI assistant to consumers. The authors examine pre-purchase product clicks and cart additions, purchase-stage order counts and spending, and post-purchase return rates. This design lets the study identify which behavioural metrics change with assistant availability and whether order growth and lower returns occur together.

**The core conclusion is that opening the assistant increased orders by about 3.00%, while clicks and cart additions showed no statistically significant change.** Among purchasers, the average return rate fell from **4.015% to 3.511%**, an absolute drop of **0.504 percentage points** and a relative decline of **12.55%**. The main observed change is therefore more orders, accompanied by a lower proportion of purchased goods being returned.

A separate online experiment provides mechanism evidence for the field results. Participants exposed to an AI-service scenario reported more sufficient information and stronger perceived interruption, along with generally higher purchase intention and decision confidence. Sequential mediation showed that the positive path through information provision outweighed the negative path through interruption and uncertainty. For proactive and reactive interactions, the paper uses platform logs to assess their association with purchases and returns.

## 3. Scientific questions and theoretical derivation

**Table 2. Theoretical paths and hypotheses**

| Theoretical path | Decision mechanism | Research hypothesis |
|---|---|---|
| Intelligent Information Provision | Quickly provide information relevant to personal questions, reducing decision uncertainty about product quality or fit | H1a: Orders increase after the assistant is opened |
| Interruption | Prompts and private chats may disrupt the flow experience of focused viewing, causing viewers to miss key information from the streamer | H1b: Orders decrease after the assistant is opened |
| Improved pre-purchase judgement | Consumers can more easily check whether a product suits them before ordering, reducing post-purchase mismatch | H2: The return rate falls after the assistant is opened |

H1a and H1b are competing hypotheses about order counts, corresponding respectively to information provision and viewing disruption. The between-group difference in field orders reflects the net outcome when both forces coexist. H2 concerns post-purchase decisions, testing whether the proportion of purchased goods returned declines. Purchase intention in the online experiment and return behaviour recorded by the platform are different outcome variables, used respectively to explore psychological mechanisms and to evaluate post-purchase performance.

## 4. Research design

### 4.1 Correspondence between research questions and empirical design

**The randomized field experiment estimates the overall effect of opening the assistant.** Whether a consumer actually uses the assistant may be related to existing purchase intention and consultation needs. The authors randomized access before feature use and compared outcomes by original assignment. The treatment group includes consumers who never actually used the assistant, so this comparison answers the policy question of opening the feature on the platform.

**The online experiment tests the underlying decision mechanisms.** Field logs record behavioural outcomes, while the online experiment randomly assigns video conditions and measures information provision, interruption, uncertainty and purchase intention, adding consumer-level perceptual evidence. Sequential Mediation Analysis examines whether the relationships among these perceived variables match theoretical expectations.

**Grouping and log analysis examine contextual differences and interaction patterns.** Product history and streamer service load form two theoretical boundary conditions, proxied by product novelty and streamer popularity. Proactive prompts and user-initiated consultations are identified from actual usage logs, and their results describe statistical associations between interaction patterns and shopping behaviour.

### 4.2 Features and interaction modes of the AI livestream assistant

![Figure 2. User interface of the AI livestream assistant](assets/2025-ISR-AI-assistant-in-online-shopping/figure-02.png)

**Figure 2. User interface of the AI livestream assistant.**

Figure 2 shows the assistant entry point, common services and interaction interface. The livestream and comment section remain in the original interface, and consumers can enter a one-on-one conversation through the assistant icon. The system offers coupons, product recommendations and order queries, and accepts both text and voice input. The assistant integrates product details, return policies and livestream promotions through speech recognition and natural language processing.

The paper distinguishes two interaction modes by who initiates service. **Proactive Interaction** occurs when the assistant detects a service need in public comments and sends a prompt, after which the consumer may enter a conversation. **Reactive Interaction** occurs when the consumer opens the assistant and the system then provides service on demand. Both names take the AI's behaviour as the reference.

### 4.3 Assignment unit and sample composition of the field experiment

![Figure 3. Field randomized experiment design](assets/2025-ISR-AI-assistant-in-online-shopping/figure-03.png)

**Figure 3. Field randomized experiment design.**

The experiment randomizes at the **consumer** level. The partner platform assigned groups by the last two digits of the account ID: 00–49 to treatment and 50–99 to control. The treatment group could see the assistant, receive prompts and initiate conversations, while the control group could not access it during the experiment. A consumer retained the original group when viewing across different livestreams. The comparison window of the field experiment lies between the two dashed lines in Figure 3.

The field experiment ran from 19 to 24 February 2021, described in the paper as lasting five days. The platform reported more than 10 million participating consumers. Under data-sharing arrangements, the researchers analysed an approximately 1% random sample drawn by the platform, comprising **132,199 consumers**, with **65,902** in treatment and **66,297** in control. These users participated in at least one livestream during the experiment. The platform enabled the assistant by default for the treatment group; data from the few streamers who turned it off were excluded from analysis.

The authors ran balance checks at the consumer, streamer and session levels, comparing prior consumption behaviour, account characteristics, and the streamers and sessions the two groups encountered. The paper reports no statistically significant differences in the observable characteristics tested, supporting the comparability of the actual analysis sample.

### 4.4 Outcome measures and estimation samples

Each metric corresponds to product browsing, purchase consideration, order generation, spending scale and post-purchase returns. Order count reflects transaction frequency, spending reflects consumption scale, and the return rate reflects the share of purchased goods returned. Staged measurement distinguishes which outcomes the assistant mainly changes and brings purchase behaviour and post-purchase performance into one framework.

**Table 3. Measurement and analysis samples for the field outcomes**

| Outcome variable | Operational definition | Denominator or estimation sample |
|---|---|---|
| Clicks, cart additions and orders | Cumulative counts of clicks, cart additions and orders on livestream products per consumer during the experiment | 132,199 consumers, including those with no such behaviour |
| Spending | Each purchase's product price divided by the highest price of a livestream product during the experiment, then summed per consumer | 132,199 consumers, compared on a common normalized scale |
| Return rate | The share of goods purchased during the experiment that each consumer returned | 35,164 purchasers; a return denominator exists only after purchase |

Because clicks, cart additions and order counts contain many zeros, the authors use a zero-inflated Poisson model to estimate group differences. The denominator of the return rate is the number of purchased goods, so the return model includes only purchasers. Since purchasing itself may be affected by treatment, the authors check balance in observable characteristics among purchasers and use Coarsened Exact Matching (CEM) and a two-stage selection model to test robustness.

### 4.5 Treatment conditions and mechanism measures in the online experiment

To measure psychological processes that field behaviour logs cannot directly capture, the authors recruited participants from Chinese universities, asked them to recall their livestream shopping experiences over the past year, and placed them in a hypothetical shopping scenario based on a video. Participants were randomly shown either an ordinary livestream selling video or one containing AI assistant interaction and information service. Of 168 participants who completed the experiment, 18 failed attention checks, leaving an analysis sample of 150.

After viewing, participants rated **perceived information provision, perceived interruption, perceived uncertainty, purchase intention and decision confidence** on a seven-point scale. The authors first compared group means, then tested whether information provision and interruption relate to purchase intention through uncertainty. Randomization applies to the video condition, while mediators were measured after viewing. The mediation results therefore constitute supportive evidence for the theoretical mechanism, whereas the field transaction outcomes are estimated by the platform experiment.

### 4.6 Contextual heterogeneity and interaction-pattern analysis

The product-level heterogeneity analysis uses new products with no prior sales as a proxy for high uncertainty, testing whether information supplements are more valuable when existing product information is sparse. The streamer-level analysis splits popularity by pre-experiment follower count, testing whether the assistant has a stronger effect when individual answering demand is high. The two analyses report click, purchase, spending and return outcomes under the corresponding conditions.

Interaction patterns were coded from experiment logs. A consumer was recorded as having proactive interaction if a public comment triggered an AI prompt at least once, and as having reactive interaction if they opened the assistant at least once. Both indicators can equal 1 simultaneously; the model includes an interaction term and separately distinguishes those with access but no interaction. The control group is the regression reference. Because interaction choices occur after treatment assignment, the coefficients are interpreted mainly as descriptive of actual usage behaviour.

## 5. Research results

### 5.1 Main estimates from the field experiment

**Table 4. Main field results of access to the AI assistant**

| Outcome variable | Model and treatment coefficient | Estimate |
|---|---|---|
| Product clicks | Zero-inflated Poisson, 0.0081 | Between-group difference not significant |
| Cart additions | Zero-inflated Poisson, 0.0052 | Between-group difference not significant |
| Orders | Zero-inflated Poisson, 0.030, $p<0.05$ | Paper reports a relative increase of about 3.00% |
| Spending | OLS, 0.00023, $p<0.05$ per results table | Paper reports a relative increase of 10.95% on the normalized-spending baseline |
| Return rate | GLM on purchasers, −0.139, $p<0.05$ | Treatment mean 3.511%, control mean 4.015%, relative decline 12.55% |

The main analysis estimates each behaviour at the consumer level. Normalized spending is used to compare the two groups on a common scale. Orders increased significantly while clicks and cart additions did not, indicating that the result is concentrated in the order metric. Each indicator is modelled separately; the specific stage-by-stage conversion requires analysis of the same consumer's transitions through the shopping funnel.

The return analysis uses **35,164 purchasers** as the main sample. The treatment and control means differ by **0.504 percentage points**, a **12.55%** relative decline from the control group. Matching analysis and the two-stage selection model yield results consistent in direction.

### 5.2 Mechanism tests in the online experiment

![Figure 4. Sequential mediation of the AI assistant's effect on purchase intention](assets/2025-ISR-AI-assistant-in-online-shopping/figure-04.png)

**Figure 4. Sequential mediation of the AI assistant's effect on purchase intention.**

Figure 4 presents, from left to right, the video condition, the mediators and purchase intention. The upper path shows that the AI-service scenario raises perceived information provision, which is associated with lower uncertainty and higher purchase intention. The lower path shows that the scenario also raises perceived interruption, which is associated with higher uncertainty and lower purchase intention.

The authors estimated indirect effects with 5,000 bootstrap resamples. The sequential indirect effect through "information provision → uncertainty" is **0.188**, and the sequential indirect effect through "interruption → uncertainty" is **−0.088**. The indirect effect passing through information provision alone to purchase intention is **0.729**. The treatment mean for purchase intention is 5.270 and the control mean is 4.547. These estimates explain purchase intention in the online experiment; the specific composition of the field order increase requires separate identification.

### 5.3 Group results and behavioural associations of interaction patterns

The authors use new products with no prior sales as a proxy for high Product Uncertainty and split streamer popularity at the pre-experiment median follower count. The subsamples of new products and high-popularity streamers show more pronounced order and return results. This is consistent with the theoretical account of information supplements and service capacity. Determining whether differences between groups are significant requires directly testing the difference between coefficients.

In actual interaction records, the paper reports proactive interactions at 74.66% and reactive interactions at 25.34%. Both are positively associated with order counts. Their interaction term is positive in the order model and negative in the return model. Because triggering or initiating an interaction relates to the consumer's own behaviour, these estimates should be interpreted as correlations.

## 6. Advanced analysis

### 6.1 Access effects and their estimation

Let $T_i$ denote consumer $i$'s access to the assistant. The authors use the following basic equation to describe the comparison, where $Y_i$ is a behavioural outcome.

$$
Y_i=\beta_0+\beta_1T_i+\varepsilon_i.
\tag{1}
$$

In a linear specification, $\beta_1$ compares average outcomes between the access and no-access groups. For the counts of clicks, cart additions and orders, zeros are abundant, so the main results use a Zero-inflated Poisson Model. It allows some zeros to arise from a separate zero-generating process and the rest from a Poisson process that can produce positive counts. The order-model coefficient of 0.030 is on the log-count scale, and the paper reports an approximate 3% relative increase based on exponentiation. This result measures the effect of opening the full feature; consumers in the treatment group who never clicked the assistant remain in the treatment group.

### 6.2 Effect definition and conditional sample for the return rate

The paper converts group means into a relative decline. Using the control mean of 4.015% as the baseline:

$$
\frac{3.511\%-4.015\%}{4.015\%}\times100\%\approx-12.55\%.
\tag{2}
$$

The return rate is computed per consumer. Buying two items and returning one corresponds to a 50% return rate. A consumer who did not order has zero purchased items, so the ratio is undefined. The analysis sample is determined by purchase behaviour that occurs after treatment and may therefore involve Post-treatment Selection. Purchaser balance checks, Coarsened Exact Matching and a two-stage Heckman probit analysis examine the robustness of the result to this issue.

### 6.3 Interpreting the interaction term of proactive and reactive engagement

Let $P_i$ denote whether a consumer triggered at least one AI prompt, $R_i$ whether they opened the assistant at least once, and $N_i$ whether they had access but experienced neither form of interaction. The authors take the control group as the baseline and estimate the following relationship.

$$
Y_i=\gamma_0+\gamma_1P_i+\gamma_2R_i+\gamma_3(P_iR_i)+\gamma_4N_i+u_i.
\tag{3}
$$

When a consumer experiences both interactions, $P_iR_i=1$. The coefficient $\gamma_3$ measures the incremental association when both interactions coexist, relative to the sum of their separate associations; its interpretation depends on the scale of the model. Access is assigned by the experiment, while interaction patterns may be influenced by shopping enthusiasm and consultation needs. The estimate can inform subsequent hypothesis testing about prompt strategies.

## References

Wang, L., Huang, N., He, Y., Liu, D., Guo, X., Sun, Y., & Cheng, G. (2025). Artificial intelligence (AI) assistant in online shopping: A randomized field experiment on a livestream selling platform. *Information Systems Research, 36*(4), 2358–2374. [https://doi.org/10.1287/isre.2023.0103](https://doi.org/10.1287/isre.2023.0103)
