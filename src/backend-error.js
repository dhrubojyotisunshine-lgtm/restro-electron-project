window.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron');
    
    ipcRenderer.on('backend-error', (event, message) => {
      const errorDiv = document.createElement('div');
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '0';
      errorDiv.style.left = '0';
      errorDiv.style.right = '0';
      errorDiv.style.backgroundColor = 'red';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '10px';
      errorDiv.style.zIndex = '9999';
      errorDiv.textContent = `Backend Error: ${message}`;
      
      document.body.prepend(errorDiv);
    });
  });