---
title: "Effects of social solicitation on e-commerce livestreaming performance"
slug: effects-of-social-solicitation
type: academic
tags: [livestreaming|Livestreaming, ecommerce|E-commerce, social-commerce|Social Commerce, paper-notes|Paper Notes]
date: 2026-11-19T00:00:03.000Z
visibility: public
status: published
summary: "Can a host's requests for viewers to follow and like simultaneously affect sales in e-commerce livestreaming? This paper proposes the spillover effect of social solicitation and uses session fixed effects and instrumental variables to estimate its impact on follower growth and sales. The results show that social solicitation increases follows but suppresses contemporaneous sales, that the negative relationship weakens when product explanations are thorough, and that comment requests do not significantly harm sales because they serve pre-purchase judgement."
authors: [Danyang Song, Xi Chen, Zhiling Guo, Ruijin Jin]
venue: Journal of Management Information Systems
year: 2026
---

**Table 1. Basic paper information**

| Item | Content |
|---|---|
| Original title | Effects of social solicitation on e-commerce livestreaming performance |
| Authors | Danyang Song, Xi Chen, Zhiling Guo, and Ruijin Jin |
| Publication | Journal of Management Information Systems, 43(1), 307–330 (2026) |
| Online publication | 28 February 2026 |
| Keywords | Social commerce, ecommerce livestreaming, social engagement, social solicitation, social exchange, spillover effect |
| DOI | [10.1080/07421222.2025.2602393](https://doi.org/10.1080/07421222.2025.2602393) |

![Figure 1. Cover of the Taylor & Francis published version](assets/2026-JMIS-Effects-of-social-solicitation/figure-01.png)

**Figure 1. Cover of the Taylor & Francis published version (journal title, article title and authors)**

## 1. Research phenomenon: Why might a host's request for viewers to follow affect immediate sales?

In e-commerce livestreaming, hosts pursue two outcomes at the same time. One is to sell products on the spot; the other is to convert current viewers into followers who can be reached repeatedly in the future. While explaining the material, size or fit of a garment, hosts often intersperse requests such as 'follow us', 'give us a like' and 'put your questions in the comments'. The paper calls the act of a host actively asking viewers to follow, like, comment or share **social solicitation**.

Social solicitation and product explanation share the same viewing time and the same audience. A viewer may be willing to follow because they find the explanation helpful, while also feeling that frequent requests for interaction interrupt the shopping process. As a result, an action intended to serve follower growth may also change whether a viewer places an order. The study calls this effect on another goal the **spillover effect**.

![Figure 2. Interface of a Taobao e-commerce livestream](assets/2026-JMIS-Effects-of-social-solicitation/figure-02.png)

**Figure 2. A snapshot of an ongoing ecommerce livestream session.**

On the left of Figure 2 are the product list and purchase entry points; on the right are the host's display, real-time comments, the comment input field, and the share and like buttons. Viewers can view products, ask questions, interact and place orders all on the same page. Shopping and socialising can therefore happen at the same time. The comments or likes in the figure are also **actions viewers have already taken**, whereas the paper's key explanatory variable comes from **whether the host has actually asked for these actions**. Distinguishing requests from responses is what allows us to judge whether the study analyses the host's choices or the viewers' reactions.

## 2. Research question: Is the relationship of the same social solicitation consistent for follower growth and sales?

The paper splits livestreaming performance into social capital growth and sales performance. The former is measured by new followers and the latter by the number of items sold. Under these two outcomes, the authors pose three interconnected questions.

1. **What is the relationship with the direct goal?** More social solicitation followed by more followers, or fewer followers because viewers push back?
2. **What is the relationship with the other goal?** Do requests aimed at follows, likes, comments or shares affect the number of products subsequently sold?
3. **Which contexts change this relationship?** Are the sales associations different when hosts provide more product feature information, make more purchase requests, or replace social solicitation with comment requests that are closer to the shopping process?

The study focuses on changes between adjacent time segments within the same livestream. It divides each livestream into three-minute windows and uses the host's speech and interaction features in the previous window to explain the new followers and sales appearing in the next window.

## 3. Scientific questions and theoretical derivation

### 3.1 Why might the same request trigger both reciprocity and reactance at once?

Social exchange theory emphasises reciprocity. When hosts provide explanations, try-on demonstrations or answers to questions, viewers can reciprocate by following, liking or commenting. Naming the desired form of reciprocation explicitly may make it easier for viewers to take the corresponding action.

Psychological reactance theory emphasises autonomy. Viewers may originally want to compare styles, sizes or prices; if the host asks them to perform an action with little relevance to judging the product, they may feel that their viewing pace or choices are being interfered with. The resulting reactance may appear as a refusal to follow, or it may spill over into the purchase decision.

Both mechanisms can hold at the same time. Following is a form of reciprocation to an explicit request from the host, whereas purchasing involves a separate transactional judgement. Even if reciprocity dominates for follower growth, the extra demands felt during shopping may still correspond to lower sales.

**Table 2. Theoretical mechanisms and testable predictions**

| Hypothesis or analysis | Theoretical logic | Expected relationship |
|---|---|---|
| H1a | Social solicitation makes the form of reciprocation explicit, so reciprocity dominates | Social solicitation is positively related to new followers |
| H1b | Social solicitation makes viewers feel pressured to act, so reactance dominates | Social solicitation is negatively related to new followers |
| H2 | Social solicitation may divert attention from the shopping goal, and reactance spills over into the purchase decision | Social solicitation is negatively related to sales |
| Product feature explanation | Product information supports pre-purchase judgement and gives viewers value they can reciprocate | Strengthens the positive follower relationship and weakens the negative sales relationship |
| Purchase solicitation and request type | Stacked requests may increase the burden. Comments can also serve shopping needs such as asking about size or material | The sales interaction between social and purchase solicitation is negative. The sales relationship of comment requests may differ from other types |

H1a and H1b are competing hypotheses about the same net outcome. The model estimates the combined relationship in the follower-growth equation, and the subsequent interaction and request-type analyses examine which contexts are consistent with the theoretical accounts.

## 4. Research design at a glance

### 4.1 Obtaining a three-minute panel from complete livestreams

The main sample comes from women's apparel livestreams broadcast on Taobao between 7 p.m. and 10 p.m. from 15 to 28 March 2021. The authors sampled at the session level, kept complete livestreams, and screened sessions at both ends of the duration distribution. This yielded 1,128 livestreams and 80,225 three-minute windows. Because livestreams differ in duration, the number of windows per session varies, forming an unbalanced panel.

### 4.2 Identifying requests from the host's speech

The authors first used Alibaba Cloud automatic speech recognition (ASR) to transcribe the host's speech, then applied AliNLP tokenisation tailored to e-commerce text. Two experts coded typical requests from randomly sampled windows and expanded the list of synonymous expressions. The lexicon keeps explicit phrases such as 'don't forget to follow' and action combinations such as 'like and follow'. The word 'share' on its own may also refer to the host sharing their own experience, so this word alone cannot establish that the host was asking viewers to repost.

**Table 3. Meaning and measurement of the core variables**

| Variable | Meaning | Measurement within the window |
|---|---|---|
| `SocialSolicitation` | Social solicitation | Number of lexicon hits for the host's requests to follow, like, comment and share |
| `FollowerGrowth` | Social capital growth | Natural log of the number of new followers plus one |
| `Sales` | Sales performance | Natural log of the number of items sold plus one |
| `PurchaseSolicitation` | Purchase solicitation | Number of times the host uses purchase calls to action such as 'order now' |
| `SocialConversation` | Social conversation | Share of social words in the host's total words in the window, reflecting greetings, forms of address and similar exchanges |
| `ProductFeature` | Product feature explanation | Extent to which the host provides product feature information, used for controls and interaction analysis |

The host's social solicitation, the host's general social conversation and viewers' actual interaction are measured separately in the model. This makes it possible to distinguish a greeting such as 'good evening, everyone', a request such as 'follow us', and the follows or comments that subsequently appear.

### 4.3 From within-session comparisons to two supplementary tests

The main model uses livestream fixed effects to estimate relationships from differences between time segments within the same session. It also controls for viewer interaction, purchase requests, product information, promotions, the host's expressions and comment content in the previous window, and accounts for the in-session phase and the actual clock time. The two outcomes are estimated separately, each also controlling for the other outcome in the previous window.

At the same time, hosts may change their script temporarily in response to recent sales or interaction. The paper therefore uses the average social solicitation of other hosts in the same category and time slot as an instrumental variable (IV) and checks the direction of the estimates with two-stage least squares (2SLS). Interaction models and type-specific analyses further address whether product information, purchase requests and different kinds of social solicitation correspond to different outcomes.

## 5. Empirical results

### 5.1 Main results: Follower growth and sales move in opposite directions

**Table 4. Estimates of social solicitation on new followers and sales**

| Model | Social solicitation in previous window → new followers | Social solicitation in previous window → sales | Observations |
|---|---:|---:|---:|
| Session fixed effects | 0.0023\*\* | −0.0045\*\*\* | 78,794 |
| Instrumental variable 2SLS | 0.1259\*\* | −0.1447\*\* | 77,485 |

Stars follow the original results tables. `***` denotes $p<0.01$, `**` denotes $p<0.05$, and `*` denotes $p<0.1$. Standard errors are clustered by livestream session (clustered standard errors).

The fixed-effects results support H1a and H2. Using the approximate percentage interpretation adopted in the paper, each additional social solicitation in the previous three-minute window is associated with a roughly 0.23% higher follower-growth measure and a roughly 0.45% lower sales measure in the next window. Two-stage least squares gives estimates with the same direction. In the main regression, purchase solicitation is positively related to sales (0.0138***), while its coefficient for new followers is 0.0005 and not statistically significant. Thus, socially oriented requests and purchase-oriented requests show different cross-goal relationships.

### 5.2 How do product explanation and purchase solicitation change the sales relationship?

**Table 5. Interaction terms for product feature explanation and purchase solicitation**

| Interaction term | New followers | Sales |
|---|---:|---:|
| Social solicitation × product feature explanation | 1.0242\*\* | 0.9063\*\* |
| Social solicitation × purchase solicitation | 0.0033 | −0.0057\*\* |

These two rows come from separately estimated interaction models, each using 77,485 windows. The more thorough the product feature explanation, the more positive the relationship between social solicitation and new followers, and the more attenuated the negative relationship on the sales side. The negative sales interaction between social and purchase solicitation means that when the two kinds of requests are stacked, the marginal sales association of adding one kind weakens as the other kind increases. Interaction coefficients describe changes in slope and cannot be read directly as percentage changes in sales.

### 5.3 The four kinds of social solicitation can be understood separately

**Table 6. Corresponding behaviours and sales outcomes for different types of social solicitation**

| Host request | Corresponding outcome | Coefficient for corresponding outcome | Coefficient for sales |
|---|---|---:|---:|
| Follow solicitation | New followers | 0.0028\* | −0.0028\*\* |
| Comment solicitation | Comments | 0.0319\*\*\* | −0.0008 |
| Like solicitation | Likes | 0.1828\*\*\* | −0.0166\*\*\* |
| Share solicitation | Shares | 0.0530\*\*\* | −0.0199\*\* |

All four kinds of request are positively related to their respective target behaviours, and the 'corresponding outcome' column measures different response variables. The sales coefficients for follow, like and share requests are significantly negative, while that for comment requests is not significant. The authors relate this difference to goal congruence. Comments can be used to ask about size, fabric or how to use a product, and therefore serve both social interaction and pre-purchase judgement. Follows, likes and shares typically serve social goals more directly.

### 5.4 Robustness checks

The paper instead measures sales by sales revenue or the number of purchasers, measures social solicitation in logarithmic form, and varies the treatment of zero-comment windows, date controls and time windows. A control function analysis includes the first-stage residuals in the outcome model and estimates standard errors with 1,000 bootstrap replications. All checks yield main results in the same direction. In a second sample of 648 multi-category livestreams, the coefficients for new followers and sales are 0.0044** and −0.0130***, consistent in direction with the main women's apparel sample.

## 6. Advanced analysis

### 6.1 How do the outcome variables and the time unit correspond?

Let $i$ denote a livestream session and $t$ the $t$-th three-minute window within a session. Let $Q_{it}$ be the number of items sold in that window and $F_{it}$ the number of new followers; the outcome variables are

$$
\mathrm{Sales}_{it}=\ln(1+Q_{it}),\qquad
\mathrm{FollowerGrowth}_{it}=\ln(1+F_{it}).
\tag{1}
$$

Adding one allows windows with zero sales and zero follows to be coded as 0. The explanatory variable $S_{i,t-1}$ is the lexicon-counted number of social solicitations in the previous window. For example, the number of requests from 20:03 to 20:06 corresponds to the outcome from 20:06 to 20:09. Adjacent windows are paired within the same session, and the opening segment has no preceding record.

### 6.2 What does the fixed-effects model compare?

After combining the paper's expanded controls into a vector, the main model can be written as

$$
Y_{it}=\beta S_{i,t-1}+\gamma Y^{\mathrm{other}}_{i,t-1}
+X_{i,t-1}^{\mathsf T}\delta+\theta\,\mathrm{Phase}_{it}+\kappa\,\mathrm{Time}_{it}
+f_i+\varepsilon_{it}.
\tag{2}
$$

$Y_{it}$ takes each of the two outcomes in equation (1) in turn. When estimating sales, $Y^{\mathrm{other}}_{i,t-1}$ is the follower-growth measure in the previous window; when estimating new followers, it is the sales measure in the previous window. $X_{i,t-1}$ collects the lagged viewer interaction, purchase solicitation, social conversation, product features, price incentives, scarcity cues, product or link switches, the host's mood and linguistic features, and comment content and sentiment. $\mathrm{Phase}_{it}$ denotes the in-session phase of the window, and $\mathrm{Time}_{it}$ the actual clock time. $f_i$ absorbs time-invariant features within a session, and $\varepsilon_{it}$ represents the remaining variation.

To interpret $\beta$, one compares windows with more and fewer requests within the same livestream, holding the other variables in the model constant. Host traits and baseline levels that are fixed across sessions are absorbed by $f_i$. The paper's Wooldridge test detects first-order serial correlation in the window errors, so inference uses robust standard errors clustered by session.

### 6.3 How is a percentage interpretation obtained from the coefficients?

In a model with a log outcome, one additional social solicitation changes the estimate of $\ln(1+Y^{\mathrm{count}})$ by $\beta$. On the original scale, the corresponding change in $1+Y^{\mathrm{count}}$ is

$$
100\bigl(e^{\beta}-1\bigr)\%.
\tag{3}
$$

When $\beta$ is small, $e^{\beta}-1\approx\beta$. For example, the sales coefficient −0.0045 corresponds to about −0.449%. This interpretation applies to the item count after adding one, so it should not be read directly as a 0.45% decrease in items sold per window, especially when the original count is close to zero.

### 6.4 How does the instrumental variable enter the two-stage model?

The authors construct $Z_{i,t-1}$ from the average social solicitation of other hosts in the same category and time slot. Using $W_{it}$ to collect the controls common to both stages, the calculation can be written as

$$
\begin{aligned}
S_{i,t-1}&=a+\pi Z_{i,t-1}+W_{it}^{\mathsf T}\rho+f_i+\nu_{it},\\
Y_{it}&=b+\beta_{\mathrm{IV}}\widehat S_{i,t-1}+W_{it}^{\mathsf T}\xi+g_i+u_{it}.
\end{aligned}
\tag{4}
$$

The first stage estimates the relationship between other hosts' requests and the current host's requests, producing the predicted value $\widehat S_{i,t-1}$. The second stage uses this predicted value to explain new followers or sales. The relevance condition requires $Z$ to predict $S$. The exclusion restriction requires that, after controlling for the relevant variables, $Z$ affects the current livestream outcome only through the current host's requests. The authors justify relevance by the similarity of communication styles among hosts in the same category, and argue the exclusion restriction from viewers' viewing choices and following habits. The first-stage coefficient is positive, and the Kleibergen–Paap rk Wald $F$ statistic is 26.42, used to assess instrument strength.

### 6.5 How do interaction terms correspond to the marginal relationship of requests?

Let $M$ be the product feature explanation or purchase solicitation in the previous window. Omitting the other terms, the interaction model and its marginal relationship with respect to social solicitation can be written as

$$
Y=\beta S+\eta M+\phi(S\times M)+\cdots,\qquad
\frac{\partial Y}{\partial S}=\beta+\phi M.
\tag{5}
$$

Because $S$ is a count, for this linear specification the slope in equation (5) also equals the predicted difference from one additional request at a fixed $M$. In the product explanation model, the sales equation has $\phi=0.9063$, meaning that the sales slope of a request shifts upward as the level of explanation increases. In the purchase solicitation model, the sales equation has $\phi=-0.0057$, meaning that the more purchase requests there are, the more negative the sales association of adding a social solicitation becomes. Conversely, the same interaction coefficient can be read as how the sales slope of purchase solicitation changes as social solicitation increases. In this way, the theoretical ideas of 'providing information' and 'stacking requests' are turned into slope changes that can be directly compared.

## References

Song, D., Chen, X., Guo, Z., & Jin, R. (2026). Effects of social solicitation on e-commerce livestreaming performance. *Journal of Management Information Systems, 43*(1), 307–330. [https://doi.org/10.1080/07421222.2025.2602393](https://doi.org/10.1080/07421222.2025.2602393)
