export function Footer(){
    return (
        <div style={{
            width: '100%', height: '40px',
            background: 'var(--color3)',
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px', fontSize: '18px',
            position: 'fixed',
            left: 0,
            bottom: 0,
            zIndex: 100
        }}>
           <a href="https://github.com/Understand-the-Matrix/understand_the_matrix" target="_blank" rel="noopener noreferrer"><i className="pi pi-github"/></a>
        </div>
    )
}
