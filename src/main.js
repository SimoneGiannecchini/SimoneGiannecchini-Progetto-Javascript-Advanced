import './styles.scss'; 

import { capitalize, shuffle } from 'lodash-es';
import axios from 'axios';
const firebaseConfig = {
  apiKey: "TAIzaSyBtdZN0A-BkjQ7ixEVfSRaqqUqa6I8mTDs",
  authDomain: "trovalibri-e26dc.firebaseapp.com",
  projectId: "trovalibri-e26dc",
  storageBucket: "trovalibri-e26dc.firebasestorage.app",
  messagingSenderId: "217261855254",
  appId: "1:217261855254:web:628470bda2e0208e1ddb37"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cercaBtn').addEventListener('click', cercaLibri);
  document.getElementById('mostraSalvatiBtn').addEventListener('click', caricaLibriSalvati);
});

async function cercaLibri() {
  const categoria = document.getElementById('categoriaInput').value.trim().toLowerCase();
  const categoriaFormattata = capitalize(categoria);
  console.log("Ricerca per categoria:", categoriaFormattata);

  if (!categoria) {
    alert('Inserisci una categoria valida.');
    return;
  }

  const url = `https://openlibrary.org/subjects/${categoria}.json?limit=10`;

  try {
    const res = await axios.get(url);
    const dati = res.data;
    mostraRisultati(dati.works);
  } catch (error) {
    alert('Errore durante la ricerca.');
    console.error(error);
  }
}

function mostraRisultati(books) {
  const lista = document.getElementById('risultati');
  lista.innerHTML = '';

  if (!books || books.length === 0) {
    lista.innerHTML = '<li>Nessun libro trovato per questa categoria.</li>';
    return;
  }

  books = shuffle(books);

  books.forEach(libro => {
    const li = document.createElement('li');
    li.textContent = `${libro.title} (Autori: ${libro.authors.map(a => a.name).join(', ')})`;
    li.addEventListener('click', () => mostraDescrizione(libro.key, li));
    lista.appendChild(li);
  });
}

async function mostraDescrizione(keyLibro, elementoCliccato) {
  document.querySelectorAll('.descrizione').forEach(el => el.remove());

  const url = `https://openlibrary.org${keyLibro}.json`;

  const descrizioneElemento = document.createElement('div');
  descrizioneElemento.classList.add('descrizione');
  descrizioneElemento.innerHTML = 'Caricamento descrizione...';
  elementoCliccato.after(descrizioneElemento);

  descrizioneElemento.style.fontSize = "20px";
  descrizioneElemento.style.lineHeight = "1.6";
  descrizioneElemento.style.borderTop = "1px solid #ccc";
  descrizioneElemento.style.marginTop = "10px";
  descrizioneElemento.style.paddingTop = "10px";

  try {
    const res = await axios.get(url);
    const dati = res.data;

    let descrizioneTesto = 'Descrizione non disponibile.';
    if (dati.description) {
      descrizioneTesto = typeof dati.description === 'string' ? dati.description : dati.description.value;
    }

    const coverId = dati.covers ? dati.covers[0] : null;

    descrizioneElemento.innerHTML = `
      <strong>Descrizione:</strong><br>${descrizioneTesto}<br>
      <button id="salvaLibroBtn">Salva libro</button>`;

    document.getElementById('salvaLibroBtn').onclick = () => {
      salvaLibroFirebase(dati.title, descrizioneTesto, keyLibro, coverId);
    };

  } catch (err) {
    descrizioneElemento.innerHTML = 'Errore caricamento descrizione libro.';
    console.error(err);
  }
}

function salvaLibroFirebase(titolo, descrizione, keyLibro, coverId) {
  db.collection('libriSalvati').add({
    titolo,
    descrizione,
    keyLibro,
    coverId: coverId || null,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
    .then((docRef) => {
      alert('Libro salvato correttamente con ID: ' + docRef.id);
    })
    .catch((error) => {
      alert('Errore salvataggio libro: ' + error.message);
      console.error(error);
    });
}

document.getElementById("categoriaInput").addEventListener("input", function () {
  this.value = this.value.toLowerCase();
});

function adattaBarraRicerca() {
  const input = document.getElementById("categoriaInput");
  const button = document.getElementById("cercaBtn");
  const container = document.querySelector(".container");

  if (window.innerWidth <= 768) {
    input.style.width = "95%";
    input.style.fontSize = "22px";
    input.style.padding = "18px";
  } else {
    input.style.width = "60%";
    input.style.fontSize = "18px";
    input.style.padding = "15px";
  }

  button.style.height = input.clientHeight + "px";
  button.style.fontSize = input.style.fontSize;
  button.style.padding = "0 24px";

  container.style.maxWidth = "700px";
  container.style.margin = "auto";
}

document.addEventListener("DOMContentLoaded", adattaBarraRicerca);
window.addEventListener("resize", adattaBarraRicerca);

function caricaLibriSalvati() {
  const listaSalvati = document.getElementById('listaSalvati');
  listaSalvati.innerHTML = '<div>Caricamento...</div>';

  db.collection('libriSalvati')
    .orderBy('timestamp', 'desc')
    .get()
    .then((querySnapshot) => {
      listaSalvati.innerHTML = '';

      if (querySnapshot.empty) {
        listaSalvati.innerHTML = '<div>Nessun libro salvato.</div>';
        return;
      }

      querySnapshot.forEach((doc) => {
        const libro = doc.data();

        const coverUrl = libro.coverId
          ? `https://covers.openlibrary.org/b/id/${libro.coverId}-M.jpg`
          : 'https://via.placeholder.com/80x120?text=Nessuna+copertina'; 

        const img = document.createElement('img');
        img.src = coverUrl;
        img.alt = `Copertina di ${libro.titolo}`;
        img.classList.add('book-cover');
        
        img.onerror = () => {
          img.src = 'https://via.placeholder.com/80x120?text=Nessuna+copertina';
        };

        const card = document.createElement('div');
        card.classList.add('book-card');
        card.innerHTML = `
          ${img.outerHTML}
          <div class="book-info">
            <h3>${libro.titolo}</h3>
            <p>${libro.descrizione}</p>
            <button class="eliminaBtn" style="margin-bottom:30px;">🗑️ Elimina</button>
          </div>
        `;

        card.querySelector('.eliminaBtn').addEventListener('click', () => {
          eliminaLibro(doc.id);
        });

        listaSalvati.appendChild(card);
      });
    })
    .catch((error) => {
      console.error('Errore nel recupero dei libri:', error);
      listaSalvati.innerHTML = '<div>Errore durante il caricamento.</div>';
    });
}

function eliminaLibro(id) {
  if (!confirm("Vuoi davvero eliminare questo libro salvato?")) return;

  db.collection('libriSalvati').doc(id).delete()
    .then(() => {
      alert('Libro eliminato.');
      caricaLibriSalvati();
    })
    .catch((error) => {
      console.error("Errore durante l'eliminazione:", error);
      alert('Errore durante l\'eliminazione del libro.');
    });
}

