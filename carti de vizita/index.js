function removeDiacritics(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function vCardFromPersoana(p) {
  const functie = removeDiacritics(p['Poziție '] || p['functie'] || '');
  return `BEGIN:VCARD\nVERSION:3.0\nN:${removeDiacritics(p.Nume)}\nFN:${removeDiacritics(p.Nume)}\nTITLE:${functie}\nTEL;TYPE=cell:${(p['Telefon Mobil'] || '').trim()}\nEMAIL:${(p.Email || '').trim()}\nADR;TYPE=work:${removeDiacritics(p['Adresă Institutie'] || '')}\nURL:${(p.Site || '').trim()}\nEND:VCARD`;
}

function carteVizitaHTML(p, idx) {
  return `
    <div class="carte-vizita-container" id="cv-${idx}">
      <div class="carte-vizita fata">
        <div class="qr-corner">
          <div id="qr-${idx}"></div>
        </div>
        <div class="info-nume">
          <div class="nume-mare">
            <span class="prenume">${p.Nume.split(' ')[0]}</span><br>
            <span class="nume">${p.Nume.split(' ').slice(1).join(' ')}</span><br>
            <span class="pozitie">${p['Poziție '] ? p['Poziție '].trim() : ''}</span>
          </div>
        </div>
        <div class="adresa-web">
          <p>${p.Site}</p>
        </div>
        <div class="contact-adresa">
          <p class="contact-inline">
            <span class="eticheta">T:&nbsp;</span>${p['Telefon Mobil']}
            <span class="eticheta" style="margin: 0 4px; font-weight: 700; font-size: 11px;">I</span>
            <span class="eticheta">E:&nbsp;</span>${p.Email}
          </p>
          <p class="adresa-flex">
            <span class="eticheta">A:&nbsp;</span>
            <span>${p['Adresă Institutie']}</span>
          </p>
        </div>
      </div>
      <div class="carte-vizita verso"></div>
    </div>
  `;
}

function getIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

if (document.getElementById('carte-unica')) {
  fetch('https://sheetdb.io/api/v1/3fvnik555at2l')
    .then(response => response.json())
    .then(data => {
      const echipa = Array.isArray(data) ? data : data.data;
      const idx = parseInt(getIdFromUrl(), 10);
      if (isNaN(idx) || !echipa[idx]) {
        document.getElementById('carte-unica').innerHTML = '<p style="color:red;font-size:22px;">Angajat inexistent!</p>';
        return;
      }
      document.getElementById('carte-unica').innerHTML = carteVizitaHTML(echipa[idx], idx);
      const vcard = vCardFromPersoana(echipa[idx]);
      try {
        new QRCode(document.getElementById(`qr-${idx}`), {
          text: vcard,
          width: 115,
          height: 115,
          colorDark: "#000000",
          colorLight: getComputedStyle(document.documentElement).getPropertyValue('--galben').trim() || "#F4C134",
          correctLevel: QRCode.CorrectLevel.L
        });
      } catch (e) {
        document.getElementById(`qr-${idx}`).innerHTML = '<span style="color:red;font-size:10px;">VCard prea mare pentru QR</span>';
      }
      setTimeout(() => {
        const carte = document.querySelector('.carte-vizita-container');
        const imgs = carte ? carte.querySelectorAll('img') : [];
        let loaded = 0;
        if (imgs.length === 0) {
          genereazaSiAfiseazaPDF();
        } else {
          imgs.forEach(img => {
            if (img.complete) loaded++;
            else img.onload = img.onerror = () => {
              loaded++;
              if (loaded === imgs.length) genereazaSiAfiseazaPDF();
            };
          });
          if (loaded === imgs.length) genereazaSiAfiseazaPDF();
        }
      }, 500);
    });
}

fetch('https://sheetdb.io/api/v1/3fvnik555at2l')
  .then(response => response.json())
  .then(data => {
    const echipa = Array.isArray(data) ? data : data.data;
    document.getElementById('cuprins').innerHTML = echipa.map((p, idx) =>
      `<a href='pagini/carte.html?id=${idx}'>${p.Nume}</a>`
    ).join('');
  });

if (document.getElementById('btn-top')) {
  document.getElementById('btn-top').addEventListener('click', function() {
    document.getElementById('cuprins').scrollIntoView({ behavior: 'smooth' });
  });
}

function ascundeCarteVizita() {
  var carte = document.getElementById('carte-unica');
  if (carte) carte.style.display = 'none';
}
window.ascundeCarteVizita = ascundeCarteVizita;

function genereazaSiAfiseazaPDF() {
  var carte = document.querySelector('.carte-vizita-container');
  if (!carte) return;
  var opt = {
    margin:       [0, 0, 0, 0],
    filename:     'carte-de-vizita.pdf',
    image:        { type: 'jpeg', quality: 1 },
    html2canvas:  { scale: 5, useCORS: true },
    jsPDF:        { unit: 'cm', format: [9, 5], orientation: 'landscape' }
  };
  html2pdf().set(opt).from(carte).outputPdf('blob').then(function(pdfBlob) {
    var url = URL.createObjectURL(pdfBlob);
    var container = document.getElementById('pdf-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'pdf-container';
      container.style.width = '100%';
      container.style.maxWidth = '900px';
      container.style.margin = '0 auto 24px auto';
      carte.parentNode.insertBefore(container, carte.nextSibling);
    }
    container.innerHTML = '';
    var iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.width = '100%';
    iframe.height = '600px';
    iframe.style.border = '1px solid #ccc';
    container.appendChild(iframe);
    if (window.ascundeCarteVizita) window.ascundeCarteVizita();
  }).catch(function(e){
    console.error('Eroare la generarea PDF:', e);
  });
} 