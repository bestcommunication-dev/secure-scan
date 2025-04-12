// Script per gestire i pulsanti della landing page
document.addEventListener('DOMContentLoaded', function() {
  // Aggiungi event listener a tutti i pulsanti nella navbar
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      if (href === '#') {
        window.location.href = 'redirect.html?to=scanner';
      }
    });
  });

  // Aggiungi event listener al pulsante di scansione
  const scanForm = document.getElementById('scan-form');
  if (scanForm) {
    const originalSubmit = scanForm.onsubmit;
    scanForm.addEventListener('submit', function(e) {
      // Se l'utente ha inserito un URL, procedi con la scansione normale
      const url = document.getElementById('url').value;
      if (!url) {
        e.preventDefault();
        window.location.href = 'redirect.html?to=scanner';
      }
      // Altrimenti, lascia che la funzione originale gestisca la scansione
    });
  }

  // Gestione dei pulsanti nel footer
  const generateReportBtn = document.getElementById('generate-report');
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'redirect.html?to=scanner';
    });
  }

  const getAiAdviceBtn = document.getElementById('get-ai-advice');
  if (getAiAdviceBtn) {
    getAiAdviceBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'redirect.html?to=scanner';
    });
  }
});
