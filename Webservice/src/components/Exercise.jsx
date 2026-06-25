import React, { useState, useEffect} from "react";
import { BlockMath} from "react-katex";
import { SelectButton } from "primereact/selectbutton";
import { equal, smaller, randomInt, unaryMinus } from "mathjs";

/**
 * React component that renders equations from a matrix.
 *
 * @param {number[][] | fraction[][]} solMatrix - The solution matrix.
 *
 * @returns {JSX.Element} A rendered list of equations displayed with KaTeX via `BlockMath`.
 *
 * - Skips trivial identities `0 = 0`.
 * - Randomly moves some terms to the right-hand side (with sign inversion).
 * 
 * @note Used in matrix-based tutorials and challenges (levels 1-2).
 * For scalar exercises like Dot Product (level 3), use ScalarInput instead.
 */
export function Equations({ solMatrix }){
  const [equations, setEquations] = useState(['']);
  useEffect(() => {
    if (!solMatrix || solMatrix.length === 0) return;
    
    const eq = solMatrix.map((row) => {
      const rhs = row[row.length - 1];
      const coeffs = row.slice(0, -1);
    
      // Collect terms (without sign formatting)
      const terms = [];
      coeffs.forEach((coef, i) => {
        if (!equal(coef,0)) {
          terms.push({ coef, index: i });
        }
      });
    
      // all coeffs = 0
      if (terms.length === 0) {
        if (equal(rhs, 0)) return null;     // skip 0 = 0
        return `0x_1 = ${rhs.toString()}`;
      }
    
      // randomly decide which terms move to the right
      let moveFlags = terms.map(() => Math.random() < 0.4); // 40% chance
    
      // at least one term on the left
      if (moveFlags.every(flag => flag === true)) {
        const keepIndex = randomInt(terms.length);
        moveFlags[keepIndex] = false;
      }
    
      const leftTerms = [];
      const rightExtraTerms = [];
    
      terms.forEach((term, idx) => {
        if (moveFlags[idx]) {
          // moves to the right –> with the opposite sign
          rightExtraTerms.push({
            coef: unaryMinus(term.coef),
            index: term.index,
          });
        } else {
          leftTerms.push(term);
        }
      });
    
      // string for left side
      const leftStr = leftTerms
        .map((term, i) => {
          const negative = smaller(term.coef,0);
          const absStr = Math.abs(term.coef).toString();
        
          const sign =
            i === 0
              ? (negative ? "-" : "")          // first term: no '+'
              : (negative ? "-" : "+");
        
          return `${sign} ${absStr}x_${term.index + 1}`;
        })
        .join(" ")
        .replace(/^\s*\+\s*/, "");
      
      // string for right side: constant and extra terms
      let rhsParts = [rhs.toString()];

      rightExtraTerms.forEach((term) => {
        const negative = smaller(term.coef,0);
        const absStr = Math.abs(term.coef).toString();
        const sign = negative ? "-" : "+";
        rhsParts.push(`${sign} ${absStr}x_${term.index + 1}`);
      });

      // Remove unnecessary constant 0
      const rhsFiltered = rhsParts.filter((part, idx) => {
        const trimmed = part.trim();
        if (idx === 0 && trimmed === "0" && rhsParts.length > 1) {
          return false; // 0 entfernen, wenn andere Terme existieren
        }
        return true;
      });

      // If everything has been removed -> right side = 0
      if (rhsFiltered.length === 0) {
        rhsFiltered.push("0");
      }

      const rhsStr = rhsFiltered.join(" ");

      return `${leftStr} = ${rhsStr}`;
    }).filter(Boolean); // remove null, undefined, ""
  
    setEquations(eq);
  }, [solMatrix]);
  

  return <>
      { equations.map((eq, i) => (
      <BlockMath key={i} className="katex" math={eq} />
    ))}
  </>
    
}

/**
 * Renders a group of selectable buttons based on the provided options.
 *
 * @param {string} value - the currently selected value
 * @param {string[]} options - a list of option labels to display as buttons
 * @param {function(string): void} onSelect - Callback fired when a new option is selected
 * @param {boolean} [disabled=false] - disables all buttons when true
 */
export function SelectionButtons({ value , options, onSelect, disabled=false }) {

  const opts = Array.isArray(options) ? options : [];

  return (
    <div style={{
      padding: '10px',
    }}>
    <SelectButton
      className="select_btn"
      value={value}
      options={opts.map(o => ({ label: o, value: o }))}
      onChange={(e) => onSelect(e.value)}
      disabled={disabled}
    />
    </div>
  );
}

/**
 * Simple scalar input component for entering a single number.
 * No size controls like EditableMatrix - just a clean input field.
 *
 * @param {string|number} value - Current input value
 * @param {function} onChange - Callback when value changes
 * @param {boolean} [disabled=false] - Disables input when true
 * @param {string} [placeholder="Enter value"] - Placeholder text
 * 
 * @note Introduced for scalar exercises like Dot Product Challenge (Challenge Level 3).
 * Converts numerical input to 1x1 matrix format for unified verification logic.
 */
export function ScalarInput({ value = "", onChange, disabled = false, placeholder = "Enter value" }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div style={{ padding: '10px', textAlign: 'center' }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          padding: '8px 12px',
          fontSize: '16px',
          borderRadius: '6px',
          border: '2px solid var(--color5)',
          backgroundColor: 'var(--color1)',
          color: 'var(--color5)',
          textAlign: 'center',
          minWidth: '120px'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color4)';
          e.target.style.outline = 'none';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color5)';
        }}
      />
    </div>
  );
}

