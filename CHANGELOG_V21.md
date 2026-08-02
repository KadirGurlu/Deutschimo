# Deutschimo V21 — Kelime Setlerim

V21, önceki tekil kelime defterini Quizlet benzeri set tabanlı bir çalışma alanına dönüştürür.

## Yeni kelime merkezi

- `/vocabulary` sayfasının adı ve ana başlığı **Kelime Setlerim** olarak yenilendi.
- Öğrenci kendi setlerini oluşturabilir, geçmiş setlerini görüntüleyebilir ve tekrar açabilir.
- Eski V14 kelime kayıtları silinmez; **Önceki kelime defterim** adlı korumalı bir set olarak görünür.
- Akıllı tekrar sistemi `/vocabulary/review` adresinde çalışmaya devam eder.

## Kişisel set oluşturma

Öğrenci set adı, açıklama ve seviye girebilir. Her terim için:

- Artikel
- Almanca kelime
- Türkçe anlam
- Çoğul
- Almanca örnek cümle
- Türkçe cümle çevirisi

alanları desteklenir. Forma sınırsız yeni terim satırı eklenebilir.

## Hazır setler

- A1: 12 ünite seti
- A2: 16 ünite seti
- B1: 18 ünite seti
- B2: 20 ünite seti
- Toplam: 66 hazır set
- Toplam: 2.250 terim ve kalıp cümle
- Set başına: 33–35 kart

Hazır içerikler V16 müfredatındaki özgün Deutschimo kelimeleri, örnekleri, diyalogları, okuma ve dinleme metinleri kullanılarak oluşturuldu.

## Kart çalışma ekranı

- Karta dokunarak veya boşluk tuşuna basarak çevirme
- Almanca seslendirme
- Türkçe anlam
- Cümle içi kullanım ve Türkçe çeviri
- Önceki / sonraki kart
- Kartları karıştırma
- Seti liste görünümünde inceleme
- “Biliyorum” işaretleme
- Çalışma ilerleme çubuğu

## Veritabanı

Yeni `VocabularySet` tablosu eklendi. `VocabularyNotebookItem` kayıtları isteğe bağlı olarak bir sete bağlanır. Mevcut kullanıcılar, kelimeler, tekrar geçmişi ve ilerleme verileri korunur.
