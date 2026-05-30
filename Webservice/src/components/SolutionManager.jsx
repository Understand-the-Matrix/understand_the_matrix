import { MatrixCreator } from "../utilities/MatrixGeneration";
import { SolutionVerifier } from "../utilities/matrixCheck";
import { useState, useEffect } from "react";
import { SolutionContext } from "@/hooks/SolutionContext";
import { fraction } from "mathjs";

/**
 * Manages the user and solution states.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children Child components (Content) that consume the solution context.
 *
 * @param {Array<Object>} props.Data Full dataset for the current level
 *
 * @param {number} props.page current page
 *
 * @param {number} props.part urrent part (all parts ≤ this number are active)
 *
 * @param {Function} props.setSolutionState Callback to notify the parent whether the user has solved the task.
 *
 * @returns {JSX.Element} A context provider wrapping the child components.
 * 
 * @description
 * ### Workflow
 *
 * **1. Data Filtering**
 * Filters all rows belonging to the current page and all parts up to the current part.
 *
 * **2. Matrix Creation**
 * If a row contains `matrixCreator`, its parameters are parsed and passed to `MatrixCreator`.
 * The returned values (matrix, solMatrix, solution) are assigned to the appropriate state
 * depending on the `return` mapping.
 *
 * **3. Options Handling**
 * If the row defines multiple-choice options, they are stored and the correct option is set
 * unless marked as `"dynamic"`.
 *
 * **4. Acceptance Handling**
 * If a tolerance value is defined (only for matrix verification), it is stored for later verification.
 *
 * **5. Verification**
 * - If the user enters a matrix, it is compared to the solution matrix using `SolutionVerifier`.
 * - If the user selects an option, it is compared to the correct option.
 * - On success, `setSolutionState(true)` is triggered.
 *
 * **6. Matrix History**
 * - Every time the userMatrix changes, it is appended to `userMatrixHistory`.
 * - Used for undo functionality and visual history display.
 *
 * **7. Row Operation History**
 * - Stores all performed row operations (ZM, ZA, ZV).
 * - Used by MatrixHistory to display symbolic operations.
 * 
 * **8. Context Exposure**
 * All relevant state values and setters are exposed through `SolutionContext`.
 */
export default function SolutionManager({ children, Data, page, part, continueStage, setSolutionState, setContinueStage }) {
  const [options, setOptions] = useState(null);
  const [solutionOption, setSolutionOption] = useState(null);
  const [userOption, setUserOption] = useState(null);
  
  const [solutionMatrix, setSolutionMatrix] = useState(null);
  const [userMatrix, setUserMatrix] = useState(null);
  const [userMatrixHistory, setUserMatrixHistory] = useState([]);
  const [acceptance, setAcceptance] = useState(null);

  const [rowOperationHistory, setRowOperationHistory] = useState([]);

  const [data, setData] = useState([]);

  // all parts to the current part
  useEffect(() => {
    const curData = Data.filter(
          row => row.page === page && Number(row.part) <= part
    );
    setData(curData);
    // reset
    setUserMatrix(null);
    setUserMatrixHistory([]);
    setSolutionMatrix(null);
    setUserOption(null);
    setSolutionOption(null);
    setOptions(null);
    setSolutionState(false);
    setRowOperationHistory([]);

  }, [Data, page, part, setSolutionState]);

  // set solution, set user value, set acceptance
  useEffect(() => {
    async function run() {
      const rowWithSolution = data.find(row => row.solution !== undefined);
      if (!rowWithSolution) return;
    
      // ---------------------------
      // Matrix Creation
      // ---------------------------
      if (rowWithSolution.matrixCreator !== undefined) {
        const creatorRow = rowWithSolution.matrixCreator;

        // parameter setting
        const rawParams = creatorRow.params || {};
        const params = {};
        for (const key in rawParams) {
          const value = rawParams[key];
          switch (key) {
              case "resultcol":
                  params.resultCol = toBool(value);
                  break;
              case "zeroCols":
                  params.zeroCols = toBool(value);
                  break;
              case "solMatrix":
                  params.solMatrix = parseMatrix(value);
                  break;
              case "transformations":
                  params.transformations = parseArray(value);
                  break;
              case "denominator":
                  params.denominator = parseArray(value);
                  break;
              default:
                  params[key] = value;
          }
        }

        // call MatrixCreator
        const result = await MatrixCreator(params);

        // return map
        const returnMap = creatorRow.return || {};
        // setter map
        const setterMap = { 
          setUserMatrix, setSolutionMatrix, setSolutionOption 
        };
        // helper: always array
        const toArray = (val) => Array.isArray(val) ? val : [val];

        // change states
        // MATRIX 
        if (returnMap.matrix) { 
          for (const setterName of toArray(returnMap.matrix)) { 
            if (setterMap[setterName]) { 
              setterMap[setterName](result.matrix); 
            } 
          } 
        } 
        // SOLMATRIX 
        if (returnMap.solMatrix) { 
          for (const setterName of toArray(returnMap.solMatrix)) { 
            if (setterMap[setterName]) { 
              setterMap[setterName](result.solMatrix); 
            } 
          } 
        } 
        // SOLUTION 
        if (returnMap.solution) { 
          for (const setterName of toArray(returnMap.solution)) { 
            if (setterMap[setterName]) { 
              setterMap[setterName](result.solution); 
            } 
          } 
        }
      }
    
      // ---------------------------
      // options
      // ---------------------------
      if (rowWithSolution.options !== undefined) {
        setOptions(rowWithSolution.options.possibilities);
      
        if (rowWithSolution.options.solution !== "dynamic") {
          setSolutionOption(rowWithSolution.options.solution);
        }
      }
      // --------------------------
      // acceptance
      // --------------------------
      if (rowWithSolution.acceptance !== undefined) {
        setAcceptance(Number(rowWithSolution.acceptance));
      }
      // --------------------------
      // navigation (Continue_Btn)
      // -------------------------
      if (rowWithSolution.navigation === 'check'){
        setContinueStage(2);
      }
    
    }
  
    run();
  }, [data]);


  // compare user value with solution
  useEffect(() => {
    if (userMatrix === null) return;
    // (2) check, disabled -> (3) ckeck, clickable
    if(continueStage === 2) setContinueStage(3);

    const isCorrect = SolutionVerifier(acceptance, solutionMatrix, userMatrix);
    if (isCorrect) {
      setSolutionState(true);
      // (0) continue, disabled -> (1) continue, clickable
      if(continueStage === 0) setContinueStage(1);
    }

  }, [userMatrix, acceptance, solutionMatrix]);

  // add to userMatrixHistory 
  useEffect(() => {
    if (userMatrix === null) return;
    if (userMatrix === userMatrixHistory.at(-1)) return;

    setUserMatrixHistory(prev => [...prev, userMatrix]);
  }, [userMatrix]);


  useEffect(() => {
    if (userOption === null) return;
    // (2) check, disabled -> (3) ckeck, clickable
    if(continueStage === 2) setContinueStage(3);

    if (userOption === solutionOption){
      setSolutionState(true);
      // (0) continue, disabled -> (1) continue, clickable
      if(continueStage === 0) setContinueStage(1);
    }
    else setSolutionState(false);
  }, [userOption, solutionOption]);


  return (
    <SolutionContext.Provider
      value={{
        options,
        setUserOption,
        userOption,
        solutionOption,
        solutionMatrix,
        setSolutionMatrix,
        userMatrix,
        setUserMatrix,
        userMatrixHistory,
        setUserMatrixHistory,
        acceptance,
        rowOperationHistory,
        setRowOperationHistory,
        data
      }}
    >
      {children}
    </SolutionContext.Provider>
  );
}

function parseMatrix(matrix){
  return matrix.map(row => row.map(cell => fraction(Number(cell))));
}

function parseArray(array) {
  return array.map((cell) => Number(cell));
}
function toBool(val) {
  return val === true || val === "True" || val === "true";
}
