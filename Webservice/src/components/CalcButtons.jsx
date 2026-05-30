import '../styles/CalcButtons.css'
import {useState} from "react";
import { fraction } from "mathjs";
import { Button } from "primereact/button";
import { InlineMath } from "react-katex";
import { SwitchRows, MultiplyRow, AddRows } from "../utilities/CalcFunctions";
import { Dropdown } from 'primereact/dropdown';

/** 
 * Component that displays Calculation function buttons in challenges
 * 
 * @param {Boolean} DisableZV - Disables the Switch Button if true
 * @param {Boolean} DisableZA - Disables the Addition Button if true
 * @param {Boolean} DisableZM - Disables the Multiplication Button if true
 * @param {number[][]} matrix - Matrix given from the Challenge
 * @param {function} setMatrix - Callback that displays the new matrix
 * @returns {JSX.Element}
 */
export function CalcButtons({DisableZV = false, DisableZA = false, DisableZM = false, matrix, setMatrix, rowOperationHistory, setRowOperationHistory}) {
  // mode = "mult" | "add" | "switch" | null
  const [mode, setMode] = useState(null); 

  if (!Array.isArray(matrix)) return <></>;
  if(matrix.length === 0) return <></>;

  return (
    <>
      {mode === null ? (
        <div className="calc_btns">
          <Button
            disabled={DisableZM}
            onClick={() => { setMode("mult") }}>
            <InlineMath math="\xrightarrow{\rm{ZM}_{i} (S)}" />
          </Button>
          <Button
            disabled={DisableZA}
            onClick={() => {setMode("add")}}>
            <InlineMath math="\xrightarrow{\rm{ZA}_{ij} (S)}" />
          </Button>
          <Button
            disabled={DisableZV}
            onClick={() => {setMode('switch')}}>
            <InlineMath math="\xrightarrow{\rm{ZV}_{ij}}" />
          </Button>
        </div>
      ):(
      <>
        {mode === "mult" && ( 
          <MultInline matrix={matrix} setMatrix={setMatrix} onClose={() => setMode(null)} setRowOperationHistory={setRowOperationHistory} /> 
        )} 
        {mode === "add" && ( 
          <AddInline matrix={matrix} setMatrix={setMatrix} onClose={() => setMode(null)} setRowOperationHistory={setRowOperationHistory} /> 
        )} 
        {mode === "switch" && ( 
          <SwitchInline matrix={matrix} setMatrix={setMatrix} onClose={() => setMode(null)} setRowOperationHistory={setRowOperationHistory} /> 
        )}
      </>
      )}
    </>
  );
}

export function RowOperation({mode, i, j, S}) {
    if (mode === undefined || i === undefined) return <></>
    if (mode != "switch" && S === undefined) return <></>
    if (mode != "mult" && j === undefined) return <></>

    if (mode === "mult"){
      return <InlineMath math={`\\xrightarrow{\\rm{ZM}_{${i+1}}(${S})}`} />
    }
    if (mode === "add"){
      return <InlineMath math={`\\xrightarrow{\\rm{ZA}_{${i+1}${j+1}}(${S})}`} />
    }
    else {
      return <InlineMath math={`\\xrightarrow{\\rm{ZV}_{${i+1}${j+1}}}`} />
    }
}

function MultInline({ matrix, setMatrix, onClose, setRowOperationHistory }){

  const dimension = matrix.length;
  const items = Array.from({ length: dimension }, (_, i) => ({
        label: `${i+1}`, value: i }
  ));

    const [rowValue, setRowValue] = useState(items[0].value);
    const [scalarInput, setScalarInput] = useState("1");
    const [scalarFeedback, setScalarFeedback] = useState('1');
    const [scalar, setScalar] = useState(1)

    function onConfirm(){
      const newMatrix = MultiplyRow(matrix, rowValue, scalar);
      setMatrix(newMatrix);
      setRowOperationHistory(prev => [...prev, {"mode": "mult", "i": rowValue, "S": scalar}]);
      onClose();
    }
    function handleInput(input){
      setScalarInput(input);
      try {
        let frac;
        if(input.includes('/')) {
          // fraction
          const [num, den] = input.split('/').map(Number);
          if(!isNaN(num) && !isNaN(den) && num !== 0 && den !== 0) {
            frac = fraction(num, den);
            setScalarFeedback(num+'/'+den);
          } else {setScalarFeedback('invalid')}
        } else {
          // integer
          const num = Number(input);
          if (!isNaN(num) && num !== 0) {
            frac = fraction(num, 1);
            setScalarFeedback(num);
          } else {setScalarFeedback('invalid')}
        }
        if (frac) setScalar(frac);
      }
      catch { setScalarFeedback('invalid')}
    }

    return(
      <>
  <div className="arrow-wrapper">
    <div className="arrow-expression">
      ZM
      <sub>

        <Dropdown value={rowValue} 
                  onChange={(e) => setRowValue(e.value)} 
                  options={items}
                  placeholder="Row" className="expr-input" />

      </sub>
      (
      <input className="scalar_input" 
              type='text' 
              value={scalarInput}
              onChange={(e) => { handleInput(e.target.value)}}
              style={{border: scalarFeedback === 'invalid' ? '3px solid red' : '3px solid var(--color5)'}}
              />
      )

    </div>

    {/* arrow */}
    <div className="arrow-svg">
    <svg className="arrow-svg-inner" viewBox="0 0 100 20" preserveAspectRatio="none">
      <line x1="0" y1="10" x2="95" y2="10" className="arrow-line" />
      <polygon points="95,5 100,10 95,15" className="arrow-head" />
    </svg>
  </div>

  </div>

  <div className='column-group outline-button-group'>
      <Button label="Cancel" icon="pi pi-times" onClick={() => onClose()}/>
      <Button label="Apply" icon="pi pi-check" onClick={onConfirm} disabled={scalarFeedback === 'invalid'}/>
  </div>


</>
);

}

function AddInline({ matrix, setMatrix, onClose, setRowOperationHistory }) {
  const dimension = matrix.length;
    const items = Array.from({ length: dimension }, (_, i) => ({
      label: `${i+1}`, value: i }
    ));

    const [sourceValue, setSourceValue] = useState(items[0].value);
    const [targetValue, setTargetValue] = useState(items[0].value);
    const [scalarInput, setScalarInput] = useState("1");
    const [scalarFeedback, setScalarFeedback] = useState('1');
    const [scalar, setScalar] = useState(1);

    function onConfirm() {
      const newMatrix = AddRows(matrix, sourceValue, targetValue, scalar);
      setMatrix(newMatrix);
      setRowOperationHistory(prev => [...prev, {"mode": "add", "i": targetValue, "j": sourceValue, "S": scalar}]);
      onClose();
    }

    function handleInput(input){
      setScalarInput(input);
      try {
        let frac;
        if(input.includes('/')) {
          // fraction
          const [num, den] = input.split('/').map(Number);
          if(!isNaN(num) && !isNaN(den) && num !== 0 && den !== 0) {
            frac = fraction(num, den);
            setScalarFeedback(num+'/'+den);
          } else {setScalarFeedback('invalid')}
        } else {
          // integer
          const num = Number(input);
          if (!isNaN(num) && num !== 0) {
            frac = fraction(num, 1);
            setScalarFeedback(num);
          } else {setScalarFeedback('invalid')}
        }
        if (frac) setScalar(frac);
      }
      catch { setScalarFeedback('invalid')}
    }

    return(
      <>
  <div className="arrow-wrapper">
    <div className="arrow-expression">
      ZA
      <sub>

        <Dropdown value={targetValue} 
                  onChange={(e) => setTargetValue(e.value)} 
                  options={items}
                  placeholder="Target" className="expr-input" />

        <Dropdown value={sourceValue} 
                  onChange={(e) => setSourceValue(e.value)} 
                  options={items}
                  placeholder="Source" className="expr-input" />

      </sub>
      (
      <input className="scalar_input" 
              type='text' 
              value={scalarInput}
              onChange={(e) => { handleInput(e.target.value)}}
              style={{border: scalarFeedback === 'invalid' ? '3px solid red' : '3px solid var(--color5)'}}
              />
      )

    </div>

    {/* arrow */}
    <div className="arrow-svg">
    <svg className="arrow-svg-inner" viewBox="0 0 100 20" preserveAspectRatio="none">
      <line x1="0" y1="10" x2="95" y2="10" className="arrow-line" />
      <polygon points="95,5 100,10 95,15" className="arrow-head" />
    </svg>
  </div>

  </div>

  <div className='column-group outline-button-group'>
      <Button label="Cancel" icon="pi pi-times" onClick={() => onClose()}/>
      <Button label="Apply" icon="pi pi-check" onClick={onConfirm} disabled={scalarFeedback === 'invalid'}/>
  </div>


</>
);
}

function SwitchInline({ matrix, setMatrix, onClose, setRowOperationHistory }) {
  const dimension = matrix.length;
  const items = Array.from({ length: dimension }, (_, i) => ({
    label: `${i+1}`, value: i }
  ));

   const [sourceValue, setSourceValue] = useState(items[0].value)
   const [targetValue, setTargetValue] = useState(items[0].value);

   function onConfirm() {
    const newMatrix = SwitchRows(matrix, sourceValue, targetValue);
    setMatrix(newMatrix);
    setRowOperationHistory(prev => [...prev, {"mode": "switch", "i": targetValue, "j": sourceValue}]);
    onClose();
   }

    return(
      <>
  <div className="arrow-wrapper">
    <div className="arrow-expression">
      ZV
      <sub>
        <Dropdown value={targetValue} 
                  onChange={(e) => setTargetValue(e.value)} 
                  options={items}
                  placeholder="Row" className="expr-input" />

        <Dropdown value={sourceValue} 
                  onChange={(e) => setSourceValue(e.value)} 
                  options={items}
                  placeholder="Row" className="expr-input" />
      </sub>

    </div>

    {/* arrow */}
    <div className="arrow-svg">
    <svg className="arrow-svg-inner" viewBox="0 0 100 20" preserveAspectRatio="none">
      <line x1="0" y1="10" x2="95" y2="10" className="arrow-line" />
      <polygon points="95,5 100,10 95,15" className="arrow-head" />
    </svg>
  </div>

  </div>

  <div className='column-group outline-button-group'>
      <Button label="Cancel" icon="pi pi-times" onClick={() => onClose()}/>
      <Button label="Apply" icon="pi pi-check" onClick={onConfirm} />
  </div>


</>
);
}
