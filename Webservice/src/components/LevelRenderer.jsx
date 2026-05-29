import "../styles/LevelDesign.css"
import { InlineMath } from "react-katex";
import { StaticMatrix, EditableMatrix } from "./Matrix";
import React, { useState, useEffect, useRef } from "react";
import { ContinueBtn, LevelEndContent, NavigationArrows, Toolbar } from "./LevelTools";
import { CalcButtons } from "./CalcButtons";
import { Equations, SelectionButtons } from "./Exercise";
import SolutionManager from "./SolutionManager";
import { useKeyMap } from "@/hooks/useKeyboard";
import { useSolution } from "@/hooks/SolutionContext";
import { getFile } from "../utilities/getFile";
import { useParams } from "react-router-dom";

/**
 * React component that renders a level (tutorial or challenge).
 * It loads metadata and level data, manages progress state,
 * and displays the content along with navigation controls.
 *
 * @returns {JSX.Element} Rendered level view including toolbar, content, and navigation.
 *
 * @description
 * - Fetches metadata from `/data/{mode}/level_meta.json`.
 * - Loads level data via `getFileData`.
 * - Tracks progress across pages and parts of the level.
 * - Provides navigation functions (`next`, `back`, `nextLevel`).
 * - Renders different navigation controls depending on mode:
 *   - Tutorial: navigation arrows
 *   - Challenge: continue button
 * - At the end of a level, renders `LevelEndContent` with links to the next level.
 */
export function LevelRenderer(){
  const { mode, id } = useParams();

    const [levelData, setLevelData] = useState([]);
    const [error, setError] = useState(null);
    const [metaData, setMetaData] = useState([]);

    const [solutionState, setSolutionState] = useState(false);
    const [continueStage, setContinueStage] = useState(0);

     useEffect(() => {
        fetch(`/data/${mode}/level_meta.json`)
        .then(res => res.json())
        .then(data => setMetaData(data))
      }, [mode]);

    useEffect(() => {
        getFileData(mode, id)
        .then(setLevelData)
        .catch(err => setError(err.message));
    }, [mode, id]);
    
    const [page, setPage] = useState("1");
    const [currentPart, setCurrentPart] = useState(1);
    const [progressValue, setProgressValue] = useState(0);

    const partsOnLevel = Math.max(
        0,
        ...levelData.map((e) => Number(e.part))
    );

    // Reset view state when navigating to a different mode or level id
    useEffect(() => {
      setPage("1");
      setCurrentPart(1);
      setProgressValue(0);
      setSolutionState(false);
      setContinueStage(0);
    }, [mode, id]);

    function getMaxPart(page, data) {
      const partsOnPage = data
        .filter((row) => row.page === page)
        .map((row) => Number(row.part));
      return Math.max(...partsOnPage, 0);
    }
    
    function next() {
        // 3 ckeck, clickable -> (4/5) continue, clickable and correct/incorrect
        if(continueStage === 3){
          if(solutionState) setContinueStage(4);
          else setContinueStage(5);
          return;
        }

        const maxPart = getMaxPart(page, levelData);
        if (currentPart < maxPart) {
            setCurrentPart((prev) => prev + 1);
        } else {
            // next page
            setPage(String(Number(page) + 1));
            setCurrentPart((prev) => prev + 1);
        }
        if (partsOnLevel > 0) setProgressValue((prev) => prev + 100 / partsOnLevel);
        setSolutionState(false);
        setContinueStage(0);
    }

    function back() {
      const prevPage = String(Number(page) - 1);
      if (Number(prevPage) >= 1) {
        setPage(prevPage);
        setCurrentPart(getMaxPart(prevPage, levelData)); // View full page
      }
    }

    useKeyMap(next, back, mode);

    function nextLevelExists() {
      const exists = metaData.some((row) => Number(row.id) === Number(id) + 1);
      if (exists) return true;
      return false;
    }

    // If loading the level failed, show a clear not-found message.
    if (error !== null) {
      return (
          <div>Level not found</div>
      );
    }

    return (
        <div className="level-renderer-container">
          <Toolbar progressValue={progressValue} />
          {currentPart <= partsOnLevel ? (<>
              
            <SolutionManager
              Data={levelData} page={page} part={currentPart} continueStage={continueStage}
              setSolutionState={setSolutionState} setContinueStage={setContinueStage}
            >
              <div className='content'>
                <Content part={currentPart} continueStage={continueStage} />
              </div >

              {mode === 'tutorial' ? (<NavigationArrows disableBack={page < 2} onBack={back} onNext={next}/>)
                                  : (<ContinueBtn stage={continueStage} onContinue={next} />)
              }
            </SolutionManager>

            
          </>): (
              <LevelEndContent nextLevelExists={nextLevelExists()} />
            )}
        </div>
      );
}
/**
 * React component that renders the content of a level.
 * Dynamically displays text, formulas, matrices, and interactive elements
 * based on the provided data.
 *
 * This component consumes the `SolutionContext` and dynamically renders
 * UI elements based on the `data` structure provided by `SolutionManager`.
 *
 * @param {Number} part Current part within the page
 * 
 * @param {Number} continueStage Current continueStage to disable elements if the continueStage is 1,4 or 5 (part is completed)
 *
 * @returns {JSX.Element} A scrollable container with all content rows for the current part.
 *
 * @description
 * - Automatically scrolls down when a new part is loaded.
 * - Supports multiple content types:
 *   - "title": heading text
 *   - "text": paragraph text
 *   - "katex": mathematical formulas
 *   - "StaticMatrix": static matrix display (optional with CalcButtons)
 *   - "CalcButtons": calculation buttons for matrices
 *   - "EditableMatrix": editable matrix input
 *   - "Equations": equation display
 *   - "SelectionButtons": multiple-choice buttons
 */
function Content({ part, continueStage }) {
  const containerRef = useRef(null);

  const {
    options,
    setUserOption,
    userOption,
    solutionMatrix,
    userMatrix, 
    setUserMatrix, 
    data
  } = useSolution();

  // scroll down
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [part]);

  return (
    <div className="scrollable_content" ref={containerRef}>
      {data.map((row, i) => (
        <React.Fragment key={i}>
          {row.typ === "title" && <div className="titel">{row.content}</div>}
          {row.typ === "text" && <div className="text">{row.content}</div>}
          {row.typ === "katex" && (
            <InlineMath className="katex" math={row.content} />
          )}
          {row.typ === "StaticMatrix" &&
            (
              <div className="matrix-row">

                {toBool(row.calcbtns) ? (
                  <CalcButtons matrix={userMatrix} setMatrix={setUserMatrix} 
                                DisableZV={[1,4,5].includes(continueStage)} 
                                DisableZA={[1,4,5].includes(continueStage)} 
                                DisableZM={[1,4,5].includes(continueStage)}
                                history={toBool(row.history)} >
                      <StaticMatrix
                        data={row.data === "userMatrix" ? userMatrix 
                                : row.data === "solutionMatrix" ? solutionMatrix
                                : parseMatrix(row.data) }
                        resultCol={toBool(row.resultcol)}
                        det={toBool(row.determinant)}
                      />

                  </CalcButtons>
                ):
                <StaticMatrix
                  data={row.data === "userMatrix" ? userMatrix 
                          : row.data === "solutionMatrix" ? solutionMatrix
                          : parseMatrix(row.data) }
                  resultCol={toBool(row.resultcol)}
                  det={toBool(row.determinant)}
                />
                }
              </div>
            )}
          {row.typ === "CalcButtons" && Array.isArray(userMatrix) &&
            userMatrix.length > 0 && (
            <CalcButtons matrix={userMatrix} setMatrix={setUserMatrix} 
                        DisableZV={[1,4,5].includes(continueStage)} 
                        DisableZA={[1,4,5].includes(continueStage)} 
                        DisableZM={[1,4,5].includes(continueStage)} />
          )}
          {row.typ === "EditableMatrix" && (
            <EditableMatrix
              rows={Number(row.rows)}
              cols={Number(row.columns)}
              resultCol={toBool(row.resultcol)}
              det={toBool(row.determinant)}
              onChange={setUserMatrix}
              disabled={[1,4,5].includes(continueStage)}
            />
          )}
          {row.typ === "Equations" && (
            <Equations
              solMatrix={solutionMatrix}
            />
          )}
          {row.typ === "SelectionButtons" && (
            <SelectionButtons
              value={userOption}
              options={options}
              onSelect={setUserOption}
              disabled={[4,5].includes(continueStage)}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

async function getFileData(mode, level_id){
    const res = await getFile(mode, level_id);
    if (!res.ok) throw new Error("file not found");
    const data = await res.json();
    
    const fileRes = await fetch(data.filename);
    if (!fileRes.ok) throw new Error("Level data not found");
    return await fileRes.json();

}


function toBool(val) {
  return val === true || val === "True" || val === "true";
}
function parseMatrix(matrix){
  return matrix.map(row => row.map(cell => fraction(Number(cell))));
}