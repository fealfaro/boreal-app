import { useState, useEffect, useRef } from "react";
import { parseMiles, fmtMiles } from "./utils.js";

/**
 * Number input with Chilean thousand separators (dots), no up/down arrows.
 * Shows formatted value when not focused, raw editing when focused.
 */
export default function MilesInput({ value, onChange, placeholder="0", style={}, disabled=false, prefix="" }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef();

  const numVal = Number(value) || 0;

  const handleFocus = () => {
    setFocused(true);
    setRaw(numVal > 0 ? String(numVal) : "");
  };

  const handleChange = (e) => {
    const v = e.target.value.replace(/[^0-9]/g, "");
    setRaw(v);
    onChange(v === "" ? 0 : parseInt(v));
  };

  const handleBlur = () => {
    setFocused(false);
    setRaw("");
  };

  const baseStyle = {
    width: "100%",
    padding: "8px 11px",
    borderRadius: 7,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    boxSizing: "border-box",
    outline: "none",
    background: disabled ? "#f8fafc" : "#fff",
    color: disabled ? "#94a3b8" : "#1a1a2e",
    MozAppearance: "textfield",
    WebkitAppearance: "none",
    appearance: "none",
    ...style,
  };

  return (
    <div style={{ position: "relative" }}>
      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}`}</style>
      {prefix && (
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13, pointerEvents: "none" }}>
          {prefix}
        </span>
      )}
      <input
        ref={inputRef}
        type={focused ? "number" : "text"}
        value={focused ? raw : (numVal > 0 ? fmtMiles(numVal) : "")}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...baseStyle, paddingLeft: prefix ? 22 : baseStyle.padding.split(" ")[1] }}
      />
    </div>
  );
}
