import "../styles/LevelTools.css"
import { useState, useEffect, useMemo } from "react";
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { ButtonGroup } from 'primereact/buttongroup';
import { useParams, useNavigate } from "react-router-dom";
import { useSolution } from "@/hooks/SolutionContext";
import { Badge } from "primereact/badge";
import { InlineMath } from "react-katex";

/**
 * Component that Renders a dynamic progress bar
 * 
 * @param {String} mode - 'tutorial' or 'challenge'
 * @param {function} progressValue - progress bar value (0 - 100) 
 * @param {function} heartCount - only challenge: number of hearts (5 - 0) (is not yet in use)
 * @returns {JSX.Element}
 */
export function Toolbar({ progressValue, heartCount=5 }){
  const { mode } = useParams();
  const navigate = useNavigate();
  const disableProgressTransition = progressValue === 0;
  return(
      <div className={disableProgressTransition ? 'no-progress-transition' : ''}>
        <div className="toolbar" style={{
          display: 'flex',
          width: '100%',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
            
          <Button 
            onClick={() => navigate(`/${mode}`)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--color3)',
              padding: 0, margin: 0,
            }}
          ><i className="pi pi-times" style={{ fontSize: '2.5rem' }}></i></Button>
          
          <ProgressBar value={progressValue}  showValue={false} style={{
            background: 'var(--color3)',
            borderRadius: '12px',
            flex: '1',
          }}/>

          {/* hearts (is not yet in use)*/}
          {mode == 'challenge' && false ? (<div>

              {/* small screen */}
              <div className="hearts-small">
                <i className='pi pi-heart-fill' style={{ fontSize: '2.5rem', color: 'var(--color3)' }}></i>
                <span style={{
                  position: 'absolute', top: '50%', left: '50%', 
                  transform: 'translate(-50%, -50%)',
                  color: 'var(--color1)', fontSize: '1.4rem',
                  }}>{heartCount}</span>
              </div>
              
              
              {/* big screen */}
              <div className="hearts-big">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i key={i} className={i+1 > heartCount ? "pi pi-heart": "pi pi-heart-fill"} style={{
                    fontSize: '2.5rem', padding: '5px',
                    color: 'var(--color3)'}}
                  />
                ))}
              </div>
            
          </div>): (<></>)}

        </div>
        
        <style>{`
          /* inside */
          .p-progressbar .p-progressbar-value {
            background-color: var(--color4); 
            border-radius: 12px;      
          }
          /* when progress is zero (e.g. after navigation reset) make update instant */
          .no-progress-transition .p-progressbar .p-progressbar-value {
            transition: none !important;
          }
        `}</style>
      </div>
    )
}

/**
 * Component that Renders a Forward and a Backward Arrow
 * 
 * @param {boolean} props.disableBack - if true: backward button disabled
 * @param {function} props.onBack - Callback-function for the backward button
 * @param {function} props.onNext - Callback-function for the forward button
 * @returns {JSX.Element}
 */
export function NavigationArrows({disableBack, onBack, onNext}){
  return (
    <div className='navigator_btn' style={{
          alignItems: 'center', justifyContent: 'center',
          display: 'flex', gap: '20px',
          width: '100%', margin: '5px', marginBottom: '25px'
          }}>
      <button onClick={onBack}>
        <i className="pi pi-arrow-left" style={{ 
          fontSize: '2.5rem',
          opacity: disableBack ? 0.3 : 1,
          cursor: disableBack ? 'auto' : "pointer",
          }}></i>
      </button>
      <button onClick={onNext}>
        <i className="pi pi-arrow-right" style={{ fontSize: '2.5rem', cursor: 'pointer' }}></i>
      </button>
    </div>
  )
}
/**
 * Component that Renders a Continue/Check button, disabled/clickable with correct/inccorecct feedback
 * 
 * proceed 1 ('continue'):  
 * continue, disabled (0) -> continue, clickable and correct (1)
 * 
 * proceed 2 ('check'):  
 * check, disabled (2) -> check, clickable (3) -> continue, clickable and (in)correct (4/5)
 *
 * @param {Number} stage -
 * - 0 continue, disabled
 * - 1 continue, clickable and correct
 * - 2 check,    disabled
 * - 3 ckeck,    clickable
 * - 4 continue, clickable and correct
 * - 5 continue, clickable and incorrect
 * @param {function} onContinue - Callback-function to continue
 * 
 * @param {String} solution - solution for incorrect input (stage 5)
 * 
 * @returns {JSX.Element}
 */
export function ContinueBtn({stage=0, onContinue}){
  const { solutionOption, optionTyp } = useSolution();
  
  const label = [2, 3].includes(stage) ? 'check' : 'continue';
  return (
    <div id='continue_container'>
      {(stage >= 4 || stage === 1) && (
        <div className="feedback" style={{color: stage === 5 ? '#E53935' : '#66BB6A',}}>
          <div className="feedback_row">
            <Badge
              value={<i className={stage === 5 ? "pi pi-times" : "pi pi-check"} style={{ fontSize: "0.8rem", color: 'var(--color1)', fontWeight: 'bold' }} />}
              style={{
                background: stage === 5 ? '#E53935' : '#66BB6A',
                borderRadius: '50%',
                display: "flex", alignItems: "center", justifyContent: "center", 
                padding: 0
              }}
            />
            <strong>{stage == 5 ? 'incorrect' : 'correct'}</strong>
          </div>

          {stage === 5 && (
            <div className="feedback_row">
              <div>solution:</div>
              <div>{optionTyp == "katex" 
                      ? <InlineMath math={solutionOption} />
                      : solutionOption
              }</div>
          </div>)}
        </div>
      )}
      <Button
          onClick={onContinue} 
          label={label} 
          id={`continue_btn_${stage}`} 
          disabled={[0, 2].includes(stage)}
          style={{margin: 0}}
      />
      
    </div>
  )
}

/**
 * Component that renders a congratulation, a repeat level button and a next level buttons
 * 
 * @param {boolean} nextLevelExists - if there is a next level
 * @returns {JSX.Element}
 */
export function LevelEndContent({nextLevelExists = false}){
  const { mode, id } = useParams();
  const navigate = useNavigate();

  const congratsList = useMemo(() => [
    "Finished!",'Exercise complete!',
    "Completed!",'Lesson complete!',
    "Well done!","Level Done!",
    "You did it!","Level complete!"
  ], []);

  const [congrats, setCongrats] = useState([]);

  const linkMode = mode === 'tutorial' ? 'challenge' : 'tutorial';

  useEffect(() =>{
    setCongrats(congratsList[Math.floor(Math.random() * congratsList.length)]);
  },[congratsList]);

  const handleMode = () => {
    navigate(`/${linkMode}/${id}`);
  }
  const handleNextLevel = () => {
    const nextLevel = Number(id) + 1;
    navigate(`/${mode}/${nextLevel}`);
  }

  if(congrats) return(
    <div>
    <div style={{height: '70vh'}}>
      <div className='end_content'>
        <h1>{congrats}</h1>

      <ButtonGroup>
        <Button icon='pi pi-arrow-left' label='repeat level' onClick={() => window.location.reload()}></Button>
        <Button onClick={handleMode} label={`${linkMode}`} icon={linkMode === 'challenge' ? ('pi pi-graduation-cap'): ('pi pi-info-circle')} iconPos='right'></Button>
        {nextLevelExists && 
          <Button onClick={handleNextLevel} label='next level' icon='pi pi-arrow-right' iconPos='right'></Button>
        }

      </ButtonGroup>
      </div>
    </div>
    <style>{`
      .end_content {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%); /* feste Zentrierung */
        text-align: center;
        animation: popIn 0.3s ease-in;
      }
      .end_content h1 {
        font-size: 50px;
        color: var(--color3);
      }
      @keyframes popIn {
        from { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        to   { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
      }
      Button {
        color: var(--color3);
        border: 1.8px solid var(--color3);
        padding: 4px 7px;
        margin: 10px;
      }

    `}</style>
    
    </div>
  )
}