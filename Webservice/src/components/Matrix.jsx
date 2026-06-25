import React from "react";
import '../styles/Matrix.css'
import { InlineMath } from 'react-katex';
import { fraction } from "mathjs";
import { Button } from "primereact/button";
import { useState } from "react";
import { RowOperation } from "./CalcButtons";
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
 * @param {(number[][] |fraction[][] )} userMatrix - Optional initial matrix to prefill the inputs.
 * @param {boolean} initialMatrixValue - If true, the component prefill the inputs with the `userMatrix` once.
 * @param {fraction[][]} onChange - Callback, that returns the current matrix as Fractions
 * @param {boolean} [disabled=false] - disables all user inputs when true
 * @param {boolean} [fixedDimension=false] - shows the buttons to change the matrix dimension when false
 * @returns {JSX.Element} 
 */
export function EditableMatrix({ rows = 3, cols = 3, resultCol = false, det = false, userMatrix, initialMatrixValue=false, onChange, disabled=false, fixedDimension=false }) {
  const [rowState, setRowState] = React.useState(rows);
  const [colState, setColState] = React.useState(cols);

  const [matrix, setMatrix] = React.useState(Array.from({ length: rowState }, () => Array(colState).fill("")));
  const [fracMatrix, setFracMatrix] = React.useState(Array.from({ length: rowState }, () => Array(colState).fill(new fraction(0))));
  const [errors, setErrors] = React.useState(Array.from({ length: rowState }, () => Array(colState).fill(false)));

  const initialMatrixRef = React.useRef(initialMatrixValue);

  React.useEffect(() => {
    if (!initialMatrixRef.current) return;
    if (
      !userMatrix || 
      !Array.isArray(userMatrix) || 
      userMatrix.length === 0 || 
      !Array.isArray(userMatrix[0])
    ) return;

    initialMatrixRef.current = false;

    const r = userMatrix.length;
    const c = userMatrix[0].length;
    
    setMatrix(userMatrix.map(row => row.map(cell => cell.toString())));
    setFracMatrix(userMatrix.map(row => row.map(cell => fraction(cell))));
    setErrors(Array.from({ length: r }, () => Array(c).fill(false)));
    setRowState(r);
    setColState(c);

  }, [userMatrix]);
     
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

  function addRow() {
    setMatrix(prev => [...prev, Array(colState).fill("")]);
    setFracMatrix(prev => [...prev, Array(colState).fill(fraction(0))]);
    setErrors(prev => [...prev, Array(colState).fill(false)]);
    setRowState(r => r + 1);
  }

  function removeRow() {
    if (rowState <= 1) return;

    setMatrix(prev => prev.slice(0, -1));
    setFracMatrix(prev => prev.slice(0, -1));
    setErrors(prev => prev.slice(0, -1));
    setRowState(r => r - 1);
  }

  function addCol() {
    setMatrix(prev => prev.map(row => [...row, ""]));
    setFracMatrix(prev =>prev.map(row => [...row, fraction(0)]));
    setErrors(prev => prev.map(row => [...row, false]));
    setColState(c => c + 1);
  }

  function removeCol() {
    if (colState <= 1) return;

    setMatrix(prev => prev.map(row => row.slice(0, -1)));
    setFracMatrix(prev => prev.map(row => row.slice(0, -1)));
    setErrors(prev => prev.map(row => row.slice(0, -1)));
    setColState(c => c - 1);
  }

  const bracketLeft = det ? "|": "("
  const bracketRight = det ? "|": ")"
  
  const dummyRows = Array.from({ length: rowState }, () => "\\rule{0pt}{2em}").join(" \\\\ ");
  const latexLeftBracket = `\\left${bracketLeft}\\vphantom{\\begin{array}{c}${dummyRows}\\end{array}}\\right.`;
  const latexRightBracket = `\\left.\\vphantom{\\begin{array}{c}${dummyRows}\\end{array}}\\right${bracketRight}`;
  console.log(fixedDimension);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
    <div style={{
      display: 'flex', alignItems: 'center'
    }}>
      {!fixedDimension && ( 
      <div style={{display: 'flex', flexDirection: 'column' }}>
        <Button icon="pi pi-plus-circle" onClick={() => addCol()} disabled={disabled} />
        <Button icon="pi pi-minus-circle" onClick={() => removeCol()} disabled={disabled} />
      </div>)}
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
    {!fixedDimension && ( 
    <div style={{display: 'flex' }}>
        <Button icon="pi pi-plus-circle" onClick={() => addRow()} disabled={disabled} />
        <Button icon="pi pi-minus-circle" onClick={() => removeRow()} disabled={disabled} />
    </div>)}
      <style>{`
        .input-error {
          border: 2px solid red !important;
        }
      `}</style>
    </div>
  );
}

/**
 * Displays the history of matrices and row operations.
 * Allows undoing the last operation and toggling the history view.
 *
 * @param {boolean} history - Whether the history toggle button is shown.
 * @param {boolean} rowOperations - Whether row operations should be displayed.
 * @param {Array<Object>} userMatrixHistory - List of all previous matrices.
 * @param {function} setUserMatrixHistory - Setter to update matrix history.
 * @param {function} setUserMatrix - Setter to update the currently displayed matrix.
 * @param {Array<Object>} rowOperationHistory - List of performed row operations.
 * @param {function} setRowOperationHistory - Setter to update row operation history.
 *
 * @returns {JSX.Element}
 */

export function MatrixHistory({history = false, rowOperations, userMatrixHistory, setUserMatrixHistory, setUserMatrix, rowOperationHistory, setRowOperationHistory }){
  const [historyDisplay, setHistoryDisplay] = useState(false);

  function undoMatrix() {
    if (userMatrixHistory.length <= 1) return;

    const lastMatrix = userMatrixHistory.at(-2);   // matrix before last matrix
    const newHistory = userMatrixHistory.slice(0, -1); // without last matrix
    const newRowOperationHistory = rowOperationHistory.slice(0, -1); // without last matrix

    setUserMatrixHistory(newHistory);
    setRowOperationHistory(newRowOperationHistory);
    setUserMatrix(lastMatrix);
  }
  if (userMatrixHistory === undefined) return <></>
  if (userMatrixHistory.length === 0) return <></>

  return <div className="content-element">
    <div className={historyDisplay ? "history-btns outline-button-group row-group" 
                              : "history-btns-only outline-button-group row-group"}>
      {history && <Button icon="pi pi-history" label="History" onClick={() => setHistoryDisplay(prev => (!prev))}/>}
      <Button icon="pi pi-replay" label="Undo" disabled={userMatrixHistory.length <= 1} onClick={() => undoMatrix()}/>
      {/* <Button icon="pi pi-refresh"  disabled={true}/> */}
    </div>

    {historyDisplay && <div className='matrix-history wrap-group'>
      {userMatrixHistory.map((matrix, index) => (
          <div key={index} className="row-group wrap-group">
            <StaticMatrix data={matrix} />
            {rowOperations && rowOperationHistory[index] && <RowOperation mode={rowOperationHistory[index].mode} 
                                                          i={rowOperationHistory[index].i}
                                                          j={rowOperationHistory[index].j}
                                                          S={rowOperationHistory[index].S} />}
          </div>
      ))}
    </div>}
  
  </div>

}
