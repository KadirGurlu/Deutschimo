import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Progress({ value, label }) {
    const normalized = Math.min(100, Math.max(0, value));
    return _jsxs("div", { className: "progress-wrap", children: [_jsx("div", { className: "progress-track", role: "progressbar", "aria-label": label ?? "İlerleme", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": normalized, children: _jsx("span", { style: { width: `${normalized}%` } }) }), label ? _jsx("span", { className: "progress-label", children: label }) : null] });
}
