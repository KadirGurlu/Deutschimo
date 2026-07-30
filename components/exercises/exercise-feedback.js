import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { CheckCircle2, CircleX } from "lucide-react";
function formatAnswer(answer) {
    if (typeof answer === "boolean")
        return answer ? "Doğru" : "Yanlış";
    if (Array.isArray(answer))
        return answer.join(" · ");
    if (typeof answer === "object" && answer !== null)
        return Object.entries(answer).map(([key, value]) => `${key}: ${String(value)}`).join(" · ");
    return String(answer ?? "");
}
export function ExerciseFeedback({ correct, explanation, correctAnswer, relatedSlideHref, canRetry, }) {
    return _jsxs("div", { className: `exercise-step-feedback ${correct ? "success" : "error"}`, role: "status", children: [correct ? _jsx(CheckCircle2, { size: 23 }) : _jsx(CircleX, { size: 23 }), _jsxs("div", { children: [_jsx("strong", { children: correct ? "Doğru cevap" : canRetry ? "Cevabını tekrar kontrol et" : "Doğru cevap gösterildi" }), !correct && !canRetry && correctAnswer !== undefined ? _jsxs("p", { children: [_jsx("b", { children: "Do\u011Fru yan\u0131t:" }), " ", formatAnswer(correctAnswer)] }) : null, _jsxs("p", { children: [_jsx("b", { children: "Neden?" }), " ", explanation] }), !correct && relatedSlideHref ? _jsx(Link, { href: relatedSlideHref, children: "\u0130lgili ders slayd\u0131na d\u00F6n" }) : null] })] });
}
