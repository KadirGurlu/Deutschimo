# Deutschimo V37 — Mastery Engine

V37 kurs tamamlama ilerlemesi ile gerçek öğrenme/ustalık değerini ayırır.

## Altı beceri
Kelime, Gramer, Okuma, Dinleme, Yazma, Konuşma.

## Temel ilkeler
- Eksik beceri kanıtı sıfır puan değildir; "Veri yok" olarak gösterilir.
- Genel ustalık yalnız ölçülen alanlardan hesaplanır ve ayrıca ölçüm kapsamı (coverage) verilir.
- Dört beceriden azı ölçülmüşse sonuç geçici/provisional kabul edilir.
- Her soru `masteryQuestionId`, `masterySkill` ve `masteryTags` taşır.
- Ünite, kurs ve konu etiketi snapshot'ları ayrı tutulur.
- Ham öğrenci cevabı Mastery tablolarında saklanmaz.
- Mevcut CompetencyRecord, AdaptiveReviewAttempt, AssessmentEvidence ve ilerleme kayıtları korunur.

## Veri modeli
Yeni ve yalnız ekleme yapan tablolar:
- MasteryAttempt
- MasterySkillSnapshot
- MasteryTopicSnapshot
- MasterySkillArea enum

## Arayüz
`/mastery` ve mevcut `/skills` (Beceri Laboratuvarı) içinde:
- kurs tamamlama %
- genel ustalık %
- coverage %
- altı beceri
- güçlü alan
- geliştirilecek alan
- zayıf topic/tag alanları

## Bitiş kriteri
Bir öğrencinin kurs ilerlemesi ile gerçek beceri/ustalık puanı birbirinden bağımsız hesaplanır.
