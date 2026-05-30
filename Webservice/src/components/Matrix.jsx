import React from "react";
import '../styles/Matrix.css'
import { InlineMath } from 'react-katex';
import { fraction } from "mathjs";
import { Button } from "primereact/button";
import { useState } from "react";
/**
 * Component that renders a given matrix
 * 
 * @param {number[][] | fraction[][]} data - 2-dim array with the matrix values (each inner list is a row)
 * @param {boolean} resultCol - is the last column a results column
 * @param {boolean} det - is the matrix a determinant
 * @returns {JSX.Element}
 */
export function StaticMatrix({data = [[1,2,3],[4,5,6],[7,8,9]], resultCol = false, det = false}){
  if (!Array.isArray(data)) return (<></>);
  if (data.length <= 0) return (<></>);
  const cols = data[0].length;
  const colFormat = resultCol ? 'c'.repeat(cols - 1) + '|c': 'c'.repeat(cols);

  function formatCell(cell) {
    const frac = fraction(cell);
      if(frac.d !== 1n){ return `${frac.s == -1n ? '-': ''}${frac.n}/${frac.d}`;}
      else { return `${frac}`}
  }

  const rows = data.map(row => {
    if (resultCol) {return row.slice(0, -1).map(formatCell).join(' & ') + ' & ' + formatCell(row[row.length - 1]);} 
    else {return row.map(formatCell).join(' & ');}
  }).join(' \\\\ ');

  const bracketLeft = det ? "|": "("
  const bracketRight = det ? "|": ")"

  const latexMatrix = `\\left${bracketLeft}\\begin{array}{${colFormat}}${rows}\\end{array}\\right${bracketRight}`;
  
  return (
    <div className='matrix-container'>
        <InlineMath math={latexMatrix} />      
    </div>
  );
}
/**
 * Component that renders an empty matrix with room for user inputs
 * 
 * @param {number} rows - number of rows 
 * @param {number} cols - number of columns (including result column if `resultCol` is true)
 * @param {boolean} resultCol - is the last column a results column
 * @param {boolean} det - is the matrix a determinant
 * @param {fraction[][]} onChange - Callback, that returns the current matrix as Fractions
 * @param {boolean} [disabled=false] - disables all user inputs when true
 * @returns {JSX.Element} 
 */
export function EditableMatrix({ rows = 3, cols = 3, resultCol = false, det = false, onChange, disabled=false }) {
  const [rowState, setRowState] = React.useState(rows);
  const [colState, setColState] = React.useState(cols);

  const [matrix, setMatrix] = React.useState(Array.from({ length: rowState }, () => Array(colState).fill("")));
  const [fracMatrix, setFracMatrix] = React.useState(Array.from({ length: rowState }, () => Array(colState).fill(new fraction(0))));
  const [errors, setErrors] = React.useState(Array.from({ length: rowState }, () => Array(colState).fill(false)));
  React.useEffect(() => {
    setMatrix(Array.from({ length: rowState }, () => Array(colState).fill("")));
    setFracMatrix(Array.from({ length: rowState }, () => Array(colState).fill(new fraction(0))));
    setErrors(Array.from({ length: rowState }, () => Array(colState).fill(false)));
  }, [rowState, colState]);
     
  const handleChange = (i, j, value) => {
    
    const newMatrix = matrix.map((row, ri) =>
      row.map((cell, ci) => (ri === i && ci === j ? value : cell))
    );
    setMatrix(newMatrix);

    let frac = null;
    try {
      if(value.includes('/')) {
        // fraction
        const [num, den] = value.split('/').map(Number);
        if(!isNaN(num) && !isNaN(den) && num !== 0 && den !== 0) {
          frac = fraction(num, den);
        }
      } else {
        // number or decimal
        const num = Number(value);
        if (!isNaN(num)) {
          frac = fraction(num);
        }
      }
    }
    catch (e) {console.log(e)}

    // errors
    if (!frac) {
      const newErrors = errors.map((row, ri) =>
        row.map((cell, ci) => (ri === i && ci === j ? true : cell))
      );
      setErrors(newErrors);
      return;
    } else {
      const newErrors = errors.map((row, ri) =>
        row.map((cell, ci) => (ri === i && ci === j ? false : cell))
      );
      setErrors(newErrors);
    }

    const newFracMatrix = fracMatrix.map((row, ri) =>
      row.map((cell, ci) => (ri === i && ci === j ? frac : cell))
    );
    setFracMatrix(newFracMatrix);    
    if (onChange) {
      onChange(newFracMatrix); // current matrix for the parent
    }
  };


  const bracketLeft = det ? "|": "("
  const bracketRight = det ? "|": ")"
  
  const dummyRows = Array.from({ length: rowState }, () => "\\rule{0pt}{2em}").join(" \\\\ ");
  const latexLeftBracket = `\\left${bracketLeft}\\vphantom{\\begin{array}{c}${dummyRows}\\end{array}}\\right.`;
  const latexRightBracket = `\\left.\\vphantom{\\begin{array}{c}${dummyRows}\\end{array}}\\right${bracketRight}`;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
    <div style={{
      display: 'flex', alignItems: 'center'
    }}>
      <div style={{display: 'flex', flexDirection: 'column' }}>
        <Button icon="pi pi-plus-circle" onClick={() => setColState(p => (p+1))} disabled={disabled} />
        <Button icon="pi pi-minus-circle" onClick={() => setColState(p => Math.max(1, p-1))} disabled={disabled} />
      </div>
    <div className="matrix-container">
      <InlineMath math={latexLeftBracket} />
      <table className="matrix-inputs"><tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={
                  resultCol && j === colState - 1 ? "result-col" :
                  resultCol && j === colState - 2 ? "before-result-col" : ""}>
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => handleChange(i, j, e.target.value)}
                    autoFocus={i === 0 && j === 0}
                    className={errors[i][j] ? "input-error" : ""}
                    disabled={disabled}
                  />
                </td>
              ))}
            </tr>
          ))}
      </tbody></table>
      <InlineMath math={latexRightBracket} />
    </div>
    </div>
    <div style={{display: 'flex' }}>
        <Button icon="pi pi-plus-circle" onClick={() => setRowState(p => (p+1))} disabled={disabled} />
        <Button icon="pi pi-minus-circle" onClick={() => setRowState(p => Math.max(1, p-1))} disabled={disabled} />
    </div>
      <style>{`
        .input-error {
          border: 2px solid red !important;
        }
      `}</style>
    </div>
  );
}

export function MatrixHistory({history = false, userMatrixHistory, setUserMatrixHistory, setMatrix}){
  const [historyDisplay, setHistoryDisplay] = useState(false);

  function undoMatrix() {
    if (userMatrixHistory.length <= 1) return;

    const lastMatrix = userMatrixHistory.at(-2);   // matrix before last matrix
    const newHistory = userMatrixHistory.slice(0, -1); // without last matrix
    setUserMatrixHistory(newHistory);
    setMatrix(lastMatrix);
  }
  if (userMatrixHistory === undefined) return <></>
  if (userMatrixHistory.length === 0) return <></>

  return <div className="content-element">
    <div className={historyDisplay ? "history-btns outline-button-group row-group" 
                              : "history-btns-only outline-button-group row-group"}>
      {history && <Button icon="pi pi-history" label="History" onClick={() => setHistoryDisplay(prev => (!prev))}/>}
      <Button icon="pi pi-replay" disabled={userMatrixHistory.length <= 1} onClick={() => undoMatrix()}/>
      {/* <Button icon="pi pi-refresh"  disabled={true}/> */}
    </div>

    {historyDisplay && <div className='matrix-history'>
      {userMatrixHistory.map((matrix, index) => (
          <StaticMatrix key={index} data={matrix} />
      ))}
    </div>}
  
  </div>

}