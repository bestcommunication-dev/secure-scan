const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Funzione API di base
exports.api = functions.https.onRequest((request, response) => {
  response.json({ message: 'API funzionante!' });
});

// Funzione per la scansione di un sito web
exports.scanWebsite = functions.https.onRequest(async (request, response) => {
  try {
    // Verifica che la richiesta sia POST
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Metodo non consentito' });
    }

    // Ottieni l'URL dal corpo della richiesta
    const { url } = request.body;
    if (!url) {
      return response.status(400).json({ error: 'URL mancante' });
    }

    // Simulazione di una scansione
    const scanResults = {
      url,
      score: Math.floor(Math.random() * 100),
      https: true,
      securityHeaders: {
        contentSecurityPolicy: false,
        xFrameOptions: true,
        xContentTypeOptions: true
      },
      vulnerabilities: [
        {
          type: 'info',
          title: 'Mancanza di Content-Security-Policy',
          description: 'Il sito non implementa una policy CSP che potrebbe prevenire attacchi XSS.'
        }
      ]
    };

    // Salva i risultati in Firestore (se l'utente è autenticato)
    let userId = null;
    try {
      if (request.headers.authorization) {
        const token = request.headers.authorization.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        userId = decodedToken.uid;

        // Salva i risultati in Firestore
        await admin.firestore().collection('scans').add({
          userId,
          url,
          score: scanResults.score,
          results: scanResults,
          scanDate: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Errore di autenticazione:', error);
    }

    // Restituisci i risultati
    response.json({
      success: true,
      data: scanResults,
      saved: userId !== null
    });
  } catch (error) {
    console.error('Errore durante la scansione:', error);
    response.status(500).json({ error: 'Errore interno del server' });
  }
});

// Funzione per ottenere consigli dall'IA
exports.getAiAdvice = functions.https.onRequest((request, response) => {
  try {
    // Verifica che la richiesta sia POST
    if (request.method !== 'POST') {
      return response.status(405).json({ error: 'Metodo non consentito' });
    }

    // Ottieni i dati dal corpo della richiesta
    const { score, vulnerabilities } = request.body;
    if (score === undefined || !vulnerabilities) {
      return response.status(400).json({ error: 'Dati mancanti' });
    }

    // Simulazione di consigli dell'IA
    const advice = `Il tuo sito ha ottenuto un punteggio di sicurezza di ${score}/100. 
    Ecco alcuni consigli per migliorare la sicurezza:
    
    1. Implementa una Content-Security-Policy per prevenire attacchi XSS
    2. Assicurati che tutti i cookie siano impostati con gli attributi Secure e HttpOnly
    3. Mantieni aggiornate tutte le librerie e i framework utilizzati
    4. Implementa l'autenticazione a due fattori per gli utenti
    5. Esegui regolarmente scansioni di sicurezza per identificare nuove vulnerabilità`;

    // Restituisci i consigli
    response.json({
      success: true,
      advice
    });
  } catch (error) {
    console.error('Errore durante la generazione dei consigli:', error);
    response.status(500).json({ error: 'Errore interno del server' });
  }
});
