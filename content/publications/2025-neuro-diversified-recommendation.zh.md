---
title: 基于加权超图嵌入的多样化推荐：音乐领域案例研究
lang: zh
slug: 2025-neuro-diversified-recommendation
authors: ["Luo, C. G.", "Wen, L. Y.", "Qin, Y.", "Yu, P. S.", "Yang, L. W.", "& Hu, Z. N."]
venue: Neurocomputing
year: 2025
kind: paper
attribution: team
date: 2025-01-01
status: published
visibility: public
doi: 10.1016/j.neucom.2024.128905
---

著录（据出版商正式版 PDF，Neurocomputing 616 (2025) 128905）：

Luo, C. G., Wen, L. Y., Qin, Y., Yu, P. S., Yang, L. W., & Hu, Z. N. (2025). Diversified recommendation with weighted hypergraph embedding: Case study in music. Neurocomputing, 616, 128905. https://doi.org/10.1016/j.neucom.2024.128905

摘要（译自原文）：

推荐系统对用户具有双重作用：筛除不合适或不匹配的信息，同时准确识别符合其偏好的项目。众多推荐算法依赖丰富的特征数据来提供个性化建议；然而在缺乏显式特征的场景下，如何平衡推荐的准确性与多样性成为迫切问题。为应对这一挑战，本文以音乐推荐为例，提出多样化加权超图推荐算法（DWHRec）。在 DWHRec 中，用户与项目之间的初始连接以加权超图建模，并将与用户、项目相关联的额外实体（如艺术家、专辑和标签）同时纳入超图结构；为捕捉用户的潜在偏好，对超图施加随机游走嵌入方法。准确性以用户与项目的匹配度衡量，多样性则以所推荐项目类型的丰富度衡量。在两个真实音乐数据集上的大量实验表明，DWHRec 在准确性与多样性方面均显著优于八种先进算法。除音乐推荐外，DWHRec 还是一个通用框架，可应用于具有相似数据结构的其他领域。算法代码已在 GitHub 开源。

关键词：准确性与多样性；多样化推荐；超图卷积
