"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, Flag } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { QuizResult } from "@/components/exercises/quiz-result";
import { useLearningProgress } from "@/hooks/use-learning-progress";
import { useContentStore } from "@/hooks/use-content-store";
import { normalizeAnswer } from "@/lib/learning/answer-normalizer";
import { saveQuizAttempt } from "@/lib/storage/learning-storage";
export function UnitQuiz({ course, unit, nextUnitId }) {
    const progress = useLearningProgress(course);
    const content = useContentStore();
    const managedUnit = content.getUnit(unit.id) ?? unit;
    const slides = content.getSlides(unit.id);
    const exercises = content.getExercises(unit.id);
    const quiz = content.getQuiz(unit.id);
    const draftKey = `deutschimo-quiz-draft-${quiz.id}`;
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [result, setResult] = useState();
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(draftKey);
            if (saved)
                setAnswers(JSON.parse(saved));
        }
        catch { /* Bozuk taslak sessizce atlanır. */ }
    }, [draftKey]);
    useEffect(() => {
        if (!submitted)
            window.localStorage.setItem(draftKey, JSON.stringify(answers));
    }, [answers, draftKey, submitted]);
    const question = quiz.questions[index];
    const unanswered = quiz.questions.filter((item) => answers[item.id] === undefined || String(answers[item.id]).trim() === "").length;
    const exerciseComplete = progress.unitProgressMap[unit.id]?.exerciseProgress === 100;
    const currentAnswer = question ? answers[question.id] : undefined;
    const scoreResult = useMemo(() => {
        const correct = quiz.questions.filter((item) => normalizeAnswer(answers[item.id]) === normalizeAnswer(item.correctAnswer)).length;
        const blank = quiz.questions.filter((item) => answers[item.id] === undefined || String(answers[item.id]).trim() === "").length;
        const wrong = quiz.questions.length - correct - blank;
        const score = Math.round((correct / quiz.questions.length) * 100);
        return { correct, wrong, blank, score, passed: score >= quiz.minimumScore };
    }, [answers, quiz.minimumScore, quiz.questions]);
    if (managedUnit.status !== "PUBLISHED")
        return _jsxs("section", { className: "empty-state", children: [_jsx("h1", { children: "\u0130\u00E7erik yay\u0131nda de\u011Fil" }), _jsx("p", { children: "Admin panelinden yay\u0131nland\u0131ktan sonra eri\u015Filebilir." })] });
    if (!exerciseComplete)
        return _jsxs("section", { className: "locked-content-state", children: [_jsx(AlertTriangle, { size: 38 }), _jsx("h1", { children: "\u00DCnite testi hen\u00FCz kilitli" }), _jsx("p", { children: "\u00DCnite sonu de\u011Ferlendirmesine ge\u00E7mek i\u00E7in zorunlu al\u0131\u015Ft\u0131rmalar\u0131 tamamla." }), _jsx(Link, { className: "button button-primary", href: `/learn/${course.id}/${unit.id}/exercises`, children: "Al\u0131\u015Ft\u0131rmalara D\u00F6n" })] });
    if (submitted && result)
        return _jsx("div", { className: "quiz-page-wrap", children: _jsx(QuizResult, { ...result, courseId: course.id, unitId: unit.id, nextUnitId: nextUnitId, questions: quiz.questions, answers: answers, onRetry: () => { setSubmitted(false); setResult(undefined); setConfirming(false); setIndex(0); setAnswers({}); } }) });
    if (!question)
        return _jsx("section", { className: "empty-state", children: _jsx("h1", { children: "Quiz bulunamad\u0131" }) });
    const submitQuiz = () => {
        saveQuizAttempt(course.id, unit, slides, exercises, quiz, answers, scoreResult.score);
        setResult(scoreResult);
        setSubmitted(true);
        setConfirming(false);
        window.localStorage.removeItem(draftKey);
    };
    return _jsxs("main", { className: "quiz-page-wrap", children: [_jsxs("header", { className: "quiz-page-header", children: [_jsxs("div", { children: [_jsxs("span", { className: "eyebrow", children: [course.level, " \u00B7 \u00DCN\u0130TE ", unit.order] }), _jsx("h1", { children: quiz.title }), _jsx("p", { children: "Cevaplar test bitene kadar g\u00F6sterilmez. Yan\u0131tlar\u0131n otomatik kaydedilir." })] }), _jsx(Link, { className: "button button-secondary", href: `/courses/${course.slug}`, children: "\u00C7\u0131k ve Daha Sonra Devam Et" })] }), _jsxs("div", { className: "quiz-question-progress", children: [_jsxs("span", { children: ["Soru ", index + 1, " / ", quiz.questions.length] }), _jsx(Progress, { value: Math.round(((index + 1) / quiz.questions.length) * 100), label: `${unanswered} cevapsız soru` })] }), _jsxs("article", { className: "quiz-question-card", children: [_jsx("span", { className: "level-badge", children: question.topic }), _jsx("h2", { children: question.prompt }), question.type === "MULTIPLE_CHOICE" ? _jsxs("fieldset", { className: "choice-grid", children: [_jsx("legend", { className: "sr-only", children: "Cevap se\u00E7" }), _jsx("p", { className: "selection-hint", children: "Bir se\u00E7enek i\u015Faretle." }), question.options?.map((option, optionIndex) => { const selected = currentAnswer === option.value; return _jsxs("button", { type: "button", className: `choice-option-button ${selected ? "selected" : ""}`, "aria-pressed": selected, onClick: () => setAnswers((current) => ({ ...current, [question.id]: option.value })), children: [_jsx("span", { className: "choice-option-marker", "aria-hidden": "true", children: String.fromCharCode(65 + optionIndex) }), _jsx("span", { className: "choice-option-text", children: option.label })] }, option.id); })] }) : question.type === "TRUE_FALSE" ? _jsxs("div", { className: "true-false-grid", children: [_jsx("button", { type: "button", className: currentAnswer === true ? "selected" : "", onClick: () => setAnswers((current) => ({ ...current, [question.id]: true })), children: "Do\u011Fru" }), _jsx("button", { type: "button", className: currentAnswer === false ? "selected" : "", onClick: () => setAnswers((current) => ({ ...current, [question.id]: false })), children: "Yanl\u0131\u015F" })] }) : _jsxs("label", { className: "exercise-text-field", children: [_jsx("span", { children: "Cevab\u0131n" }), _jsx("input", { value: String(currentAnswer ?? ""), onChange: (event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value })) })] }), _jsxs("div", { className: "quiz-navigation", children: [_jsxs("button", { className: "button button-secondary", disabled: index === 0, onClick: () => setIndex(index - 1), children: [_jsx(ArrowLeft, { size: 17 }), " \u00D6nceki"] }), index < quiz.questions.length - 1 ? _jsxs("button", { className: "button button-primary", onClick: () => setIndex(index + 1), children: ["Sonraki ", _jsx(ArrowRight, { size: 17 })] }) : _jsxs("button", { className: "button button-primary", onClick: () => setConfirming(true), children: [_jsx(Flag, { size: 17 }), " Testi Bitir"] })] })] }), _jsx("nav", { className: "quiz-question-nav", "aria-label": "Quiz sorular\u0131", children: quiz.questions.map((item, itemIndex) => _jsx("button", { className: `${itemIndex === index ? "active" : ""} ${answers[item.id] !== undefined ? "answered" : ""}`, onClick: () => setIndex(itemIndex), children: itemIndex + 1 }, item.id)) }), confirming ? _jsx("div", { className: "modal-backdrop", children: _jsxs("section", { className: "confirm-modal", role: "dialog", "aria-modal": "true", children: [_jsx(AlertTriangle, { size: 28 }), _jsx("h2", { children: "Testi bitirmek istedi\u011Fine emin misin?" }), _jsxs("p", { children: [unanswered ? `${unanswered} soruyu boş bıraktın.` : "Bütün soruları cevapladın.", " G\u00F6nderimden sonra sonu\u00E7 hesaplanacakt\u0131r."] }), _jsxs("div", { children: [_jsx("button", { className: "button button-secondary", onClick: () => setConfirming(false), children: "Teste D\u00F6n" }), _jsx("button", { className: "button button-primary", onClick: submitQuiz, children: "Testi G\u00F6nder" })] })] }) }) : null] });
}
