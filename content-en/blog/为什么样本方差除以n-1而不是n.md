---
title: "A Puzzle Born from a Denominator: Why Do We Divide the Sample Variance by n-1?"
slug: sample-variance-n-minus-one
type: blog
tags: [statistics|Statistics, mathematical-statistics|Mathematical statistics, estimator|Estimator, degrees-of-freedom|Degrees of freedom]
date: 2026-11-19T00:00:05.000Z
visibility: public
status: published
summary: "You work out the variance of 100 resistors, hand in the report, and your supervisor says: that's wrong. The numbers are right; what's wrong is that you never thought clearly about whether you wanted to describe these 100 resistors or infer something about the whole batch. Starting from a report that was marked wrong, this article explains where dividing the sample variance by n-1 comes from."
---
# A Puzzle Born from a Denominator: Why Do We Divide the Sample Variance by $n-1$?

Suppose you measure the resistance of 100 resistors. You work out the mean, then the variance, write the results into a report, and hand it to your supervisor.

Your supervisor glances at it and says: your variance is wrong.

You are stunned. The calculator did the addition, subtraction, multiplication and division, and you did not mistype a single number. Where could it be wrong?

Your supervisor says: the arithmetic is right, but you asked the wrong question — do you want to report how much these 100 resistors themselves vary, or do you want to use them to guess the variation of all the resistors in the factory? If it is the latter, your denominator should not be 100 but 99.

Behind this conclusion lies one of the most easily overlooked ideas in statistical inference.

## 1. Sample and population

The 100 resistors you actually measured are called the **sample**. All the resistors in the factory — including those you did not measure and never will — are called the **population**.

These two things are not the same. The sample is a ladle of water you scooped up; the population is the whole sea. It is easy to work out how salty that ladle of water is, but you are probably not writing your report to satisfy the ladle — you want to infer something about the whole sea.

The variation of the population is written $\sigma^2$. It exists objectively and is fixed and unchanging, you just do not know it. Your job is to build an estimator from the 100 numbers in your hand to guess it.

Suppose the population mean $\mu$ were known. Then there would be no suspense:

$$
\frac{1}{n}\sum_{i=1}^{n}(X_i-\mu)^2
$$

Each resistor is compared once with the true centre $\mu$, squared, added up, and divided by $n$. Its expectation is exactly $\sigma^2$ — neither more nor less. Dividing by $n$ seems only natural.

The trouble is that in reality $\mu$ is almost never known. The only thing you can get your hands on is the mean $\bar X$ calculated from the sample itself.

So you replace $\mu$ with $\bar X$ and leave the denominator as $n$:

$$
\frac{1}{n}\sum_{i=1}^{n}(X_i-\bar X)^2
$$

This looks perfectly reasonable, and yet the problem lies precisely in the step where $\mu$ is replaced by $\bar X$.

## 2. The sample mean $\bar X$

$\mu$ is an outsider. It is the objective true centre; where it sits has nothing to do with your sample, and it will not bend to accommodate anyone.

$\bar X$ is different. It is calculated from your 100 numbers and naturally sits right in the middle of that pile of data. The very definition of $\bar X$ is the position that "minimises the sum of squared distances from all the points" — by that definition, it is closer, on average, to the data than any other number.

And there is the trouble.

![Comparison of deviations around the sample mean and the population mean](assets/sample-variance-n-minus-one/figure-01.png)

**Figure 1  The sample mean is determined by the data themselves, so the deviations around it are systematically smaller than the deviations around the population mean**

If you take a ruler to measure the spread of the data, and the zero point of that ruler is chosen by the data themselves, then of course the data will look "less spread out". Measure with a centre that revolves around the data, and the deviations you get will be systematically too small.

Here is an analogy: if you let students grade themselves and then work out the variation in the class's scores, it will certainly be smaller than the variation you get when an examiner grades everyone uniformly. When people grade themselves, they all lean in a favourable direction without needing to agree to do so.

$\bar X$ is that "self-grading" centre. Using it as your centre lets the data get away with something — the deviations are compressed. Dividing by $n-1$ is how you charge that advantage back.

## 3. An extreme case: $n=1$

An extreme case makes this clear.

Suppose you measured just one resistor, so $n=1$. Its sample mean is itself:

$$
\bar X=X_1
$$

Its deviation from itself is:

$$
X_1-\bar X=0
$$

If you insist on dividing by $n$ — that is, by 1 — you would have to announce, with a straight face, that the variance of this batch of resistors is 0, that they do not vary at all.

Measure one resistor and declare that the whole world has no variation. Absurd.

And dividing by $n-1$? The denominator is 0, so the variance is undefined.

"Undefined" sounds like a flaw, but it is actually honesty: with only one number, you simply cannot draw a conclusion. It candidly admits its own inability instead of inventing a "0" to fool you.

An estimator that dares to say "I don't know" is far more trustworthy than one that talks out of its hat.

## 4. The expectation of the sum of squared deviations

So much for intuition; now let us settle the accounts properly.

What we want to know is this: what is the expectation of the sum of squared deviations around $\bar X$? The answer is $(n-1)\sigma^2$ — that missing 1 is right here.

The derivation takes just one step: split $X_i-\bar X$ into two parts, one tied to the true mean $\mu$ and one tied to $\bar X$:

$$
X_i-\bar X=(X_i-\mu)-(\bar X-\mu)
$$

Squaring this out produces a cross term $-2(\bar X-\mu)\sum(X_i-\mu)$. The cross term can be simplified: since $\sum X_i=n\bar X$, we have $\sum(X_i-\mu)=n(\bar X-\mu)$. Substituting back, the cross term becomes $-2n(\bar X-\mu)^2$, and adding the final $+n(\bar X-\mu)^2$ gives exactly $-n(\bar X-\mu)^2$.

This gives a clean identity:

$$
\sum_{i=1}^{n}(X_i-\bar X)^2=\sum_{i=1}^{n}(X_i-\mu)^2-n(\bar X-\mu)^2
$$

It says that the sum of deviations around the sample mean is exactly $n(\bar X-\mu)^2$ less than the sum of deviations around the population mean. That missing piece is the price paid for "substituting $\bar X$ for $\mu$", the advantage $\bar X$ took — the intuition of the previous section becomes precise algebra here.

Now take expectations on both sides.

The first term is easy: each $X_i$ contributes a $\sigma^2$, adding up to $n\sigma^2$.

The second term is the key. It equals $nE[(\bar X-\mu)^2]$. Since the average of $\bar X$ is $\mu$, the expectation of $(\bar X-\mu)^2$ is precisely the variance of $\bar X$:

$$
\operatorname{Var}(\bar X)=\frac{\sigma^2}{n}
$$

So the second term is $n\cdot\dfrac{\sigma^2}{n}=\sigma^2$.

Subtract the two terms:

$$
E\left[\sum_{i=1}^{n}(X_i-\bar X)^2\right]=n\sigma^2-\sigma^2=(n-1)\sigma^2
$$

So the sum of squared deviations around the sample mean, on average, amounts to only $(n-1)$ copies of $\sigma^2$, not $n$.

Therefore divide by $n-1$:

$$
E\left[\frac{1}{n-1}\sum_{i=1}^{n}(X_i-\bar X)^2\right]=\frac{1}{n-1}\cdot(n-1)\sigma^2=\sigma^2
$$

This lands exactly on the population variance, with no bias.

Dividing by $n$, by contrast, gives $\dfrac{n-1}{n}\sigma^2$, which is systematically too small. The smaller the sample, the bigger the shortfall — that is what your supervisor really meant by "wrong".

## 5. Degrees of freedom

With the mathematics done, let us look at a more intuitive way of understanding this. It is called degrees of freedom.

The deviations of the $n$ observations around $\bar X$ are subject to one unavoidable constraint:

$$
\sum_{i=1}^{n}(X_i-\bar X)=0
$$

They must add up to zero. You can freely choose only the first $n-1$ deviations; the last one is forced — it has to pull the total back to zero.

![An intuitive picture of n−1 degrees of freedom](assets/sample-variance-n-minus-one/figure-02.png)

**Figure 2  The $n$ deviations are constrained to sum to zero, leaving only $n-1$ free to vary**

For example, with three deviations, if $d_1=2$ and $d_2=-5$ are known, then $d_3$ has no choice: it must be 3.

Of the $n$ numbers, only $n-1$ can move freely. One degree of freedom is consumed at the moment you compute $\bar X$ — because $\bar X$ itself is calculated from those $n$ numbers and must obey the rule that "the total is zero".

So what "divide by $n-1$" really means is this: you spent one degree of freedom estimating the mean, leaving only $n-1$ independent quantities for estimating the variance. Dividing by $n-1$ is the honest average.

## 6. A worked example

Let us verify this once more with a small example we can work through to the end.

Suppose the population has only two numbers, 0 and 2, each with probability one half. The true mean is $\mu=1$ and the true variance is $\sigma^2=1$.

Draw two at a time ($n=2$), giving four equally likely combinations:

| Sample | Sum of squared deviations | Divided by $n=2$ | Divided by $n-1=1$ |
| --- | ---: | ---: | ---: |
| 0, 0 | 0 | 0 | 0 |
| 0, 2 | 2 | 1 | 2 |
| 2, 0 | 2 | 1 | 2 |
| 2, 2 | 0 | 0 | 0 |

Average when dividing by $n$: $(0+1+1+0)/4=0.5$.

Average when dividing by $n-1$: $(0+2+2+0)/4=1$.

And the true variance is exactly 1. The one that divides by $n-1$ is spot on.

## 7. Summary and discussion

We can now answer the scenario at the beginning.

"Divide by 100 or divide by 99?" — this was never a pure mathematics question; it is a question about **purpose**.

If what you want to report is simply the dispersion of the 100 resistors in your hand — if these 100 are your whole world and you do not intend to extrapolate — then dividing by 100 is correct; that is the definition of the descriptive variance. Your supervisor would not call you wrong.

But if you want to use these 100 resistors to guess the temperament of the whole batch in the factory, then you must divide by 99. Because you substituted the sample mean for the population mean and took an advantage, dividing by $n-1$ is the tax that pays that advantage back.

By the same token, the maximum-likelihood estimate of the normal variance divides by $n$; machine learning often divides by $n$ too, because in those settings people care about the optimisation objective and predictive performance, not about whether the estimator is unbiased. None of them is wrong; they are simply answering different questions.

So dividing by $n-1$ is not a rule to be memorised by rote, but an honest choice you make:

> You admit that you do not know the centre of the population and can only estimate it from the data — and every such estimate costs you one degree of freedom.

Your supervisor's "wrong" was saying this: first work out clearly what question you are answering, then decide on the denominator. Once that is clear, the denominator follows naturally.
