                </div>
            ))}
            <button onClick={submitQuiz}>Submit</button>
        </div>
    );
}

export default App;

// Disable right-click
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    alert('Right-click is disabled on this page.');
});

// Block certain keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+I (F12)
    if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        alert('Developer tools are disabled.');
    }

    // Ctrl+U
    if (event.ctrlKey && event.key === 'u') {
        event.preventDefault();
        alert('Viewing source is disabled.');
    }

    // F12
    if (event.key === 'F12') {
        event.preventDefault();
        alert('Developer tools are disabled.');
    }
});
