document.addEventListener('DOMContentLoaded', function() {
  function removeDiacritics(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function vCardFromPersoana(p) {
    const nume = removeDiacritics((p["Nume"] || '').replace(/"/g, '').trim());
    const pozitie = removeDiacritics((p["Poziție "] || '').replace(/"/g, '').trim());
    const tel = removeDiacritics((p["Telefon Mobil"] || '').replace(/"/g, '').trim());
    const email = removeDiacritics((p["Email"] || '').replace(/"/g, '').trim());
    const adresa = removeDiacritics((p["Adresă Institutie"] || '').replace(/"/g, '').trim());
    const site = removeDiacritics((p["Site"] || '').replace(/"/g, '').trim());
    return `BEGIN:VCARD\nVERSION:3.0\nN:${nume}\nFN:${nume}\nTITLE:${pozitie}\nTEL;TYPE=cell:${tel}\nEMAIL:${email}\nADR;TYPE=work:${adresa}\nURL:${site}\nEND:VCARD`;
}

function carteVizitaHTML(p, idx) {
    console.log('Date carte:', idx, p);
    return `
      <div class="carte-vizita-container" id="cv-${idx}">
        <div class="carte-vizita fata">
          <div class="qr-corner">
            <div class="qr-padding"><div id="qr-${idx}"></div></div>
          </div>
          <div class="info-nume">
            <div class="nume-mare">
              <span class="prenume">${(p["Nume"]||'').split(' ')[0]}</span><br>
              <span class="nume">${(p["Nume"]||'').split(' ').slice(1).join(' ')}</span><br>
              <span class="pozitie">${p["Poziție "] ? p["Poziție "] : ''}</span>
            </div>
          </div>
          <div class="adresa-web">
            <p>${p["Site"]||''}</p>
          </div>
          <div class="contact-adresa">
            <p class="contact-inline">
              <span class="eticheta">T:&nbsp;</span>${p["Telefon Mobil"]||''}
              <span class="eticheta eticheta-i" style="margin: 0 4px; font-weight: 700; font-size: 11px;">I</span>
              <span class="eticheta">E:&nbsp;</span>${p["Email"]||''}
            </p>
            <p class="adresa-flex">
              <span class="eticheta">A:&nbsp;</span>
              <span>${p["Adresă Institutie"]||''}</span>
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

function getEchipaApiPath() {
    return 'http://localhost:3000/api/echipa';
}

if (document.getElementById('carte-unica')) {
    fetch(getEchipaApiPath())
      .then(response => response.json())
      .then(async echipa => {
        const idx = parseInt(getIdFromUrl(), 10);
        if (isNaN(idx) || !echipa[idx]) {
          document.getElementById('carte-unica').innerHTML = '<p style="color:red;font-size:22px;">Angajat inexistent!</p>';
          return;
        }
        document.getElementById('carte-unica').innerHTML = carteVizitaHTML(echipa[idx], idx);
        const vcard = vCardFromPersoana(echipa[idx]);
        // Generează QR doar dacă există elementul
        const qrElem = document.getElementById(`qr-${idx}`);
        if (qrElem) {
          try {
            new QRCode(qrElem, {
              text: vcard,
              width: 200,
              height: 200,
              colorDark: "#000000",
              colorLight: getComputedStyle(document.documentElement).getPropertyValue('--galben').trim() || "#F4C134",
              correctLevel: QRCode.CorrectLevel.L
            });
          } catch (e) {
            qrElem.innerHTML = '<span style="color:red;font-size:10px;">VCard prea mare pentru QR</span>';
          }
        }
        console.log('Verific dacă pot porni generarea PDF-ului...');
        console.log('window.jspdf:', !!window.jspdf);
        console.log('window.html2canvas:', !!window.html2canvas);
        console.log('pdf-frame:', !!document.getElementById('pdf-frame'));
        if (window.jspdf && window.html2canvas && document.getElementById('pdf-frame')) {
          setTimeout(async () => {
            console.log('Pornesc generarea PDF-ului...');
            const fata = document.querySelector('.carte-vizita.fata');
            const verso = document.querySelector('.carte-vizita.verso');
            console.log('fata:', !!fata, 'verso:', !!verso);
            if (!fata && !verso) {
              console.log('Nu există nici fața, nici verso-ul pentru PDF!');
              return;
            }
            let siteTextDiv = null;
            let adresaWeb = null;
            if (fata) {
              adresaWeb = fata.querySelector('.adresa-web');
              if (adresaWeb) {
                const siteText = adresaWeb.textContent.trim();
                // Ascunde site-ul vertical
                adresaWeb.style.visibility = 'hidden';
                // Adaugă site orizontal
                siteTextDiv = document.createElement('div');
                siteTextDiv.textContent = siteText;
                siteTextDiv.style.position = 'absolute';
                siteTextDiv.style.right = '20px';
                siteTextDiv.style.bottom = '80px';
                siteTextDiv.style.left = 'auto';
                siteTextDiv.style.width = 'auto';
                siteTextDiv.style.textAlign = 'right';
                siteTextDiv.style.fontSize = '10px';
                siteTextDiv.style.fontWeight = '900';
                siteTextDiv.style.fontFamily = "'Source Sans 3', Arial, sans-serif";
                siteTextDiv.style.letterSpacing = '0.01em';
                siteTextDiv.style.color = 'var(--bleumarin)';
                siteTextDiv.style.background = 'none';
                siteTextDiv.className = 'site-pentru-pdf';
                siteTextDiv.style.transform = 'rotate(-90deg)';
                siteTextDiv.style.transformOrigin = 'right bottom';
                fata.appendChild(siteTextDiv);
              }
            }
            let svgSite = null;
            if (fata) {
              const adresaWeb = fata.querySelector('.adresa-web');
              if (adresaWeb) {
                const siteText = adresaWeb.textContent.trim();
                if (siteText) {
                  svgSite = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  svgSite.setAttribute('width', '20');
                  svgSite.setAttribute('height', '120');
                  svgSite.style.position = 'absolute';
                  svgSite.style.right = '10px';
                  svgSite.style.top = '60px';
                  svgSite.style.zIndex = '100';
                  svgSite.innerHTML = `<text x="10" y="10" font-size="12" font-family="'Source Sans 3', Arial, sans-serif" fill="#1B1E2A" transform="rotate(90 10 60)" text-anchor="middle">${siteText}</text>`;
                  adresaWeb.appendChild(svgSite);
                }
              }
            }
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
              orientation: 'landscape',
              unit: 'mm',
              format: [90, 50]
            });
            let pagini = 0;
            // === Adaugă padding-right direct ca stil inline la T: doar pentru PDF ===
            let tEticheta = null;
            let tEtichetaOldPadding = null;
            let fataCanvas = null;
            if (fata) {
              const contactInline = fata.querySelector('.contact-inline');
              if (contactInline) {
                const etichete = contactInline.querySelectorAll('.eticheta');
                if (etichete.length > 0) {
                  tEticheta = etichete[0];
                  tEtichetaOldPadding = tEticheta.style.paddingRight;
                  tEticheta.style.paddingRight = '16px';
                  console.log('Am aplicat padding-right:16px pe T: pentru PDF');
                } else {
                  console.log('Nu există eticheta T: în contact-inline!');
                }
              } else {
                console.log('Nu există contact-inline!');
              }
              try {
                fataCanvas = await window.html2canvas(fata, { scale: 4, useCORS: true });
                console.log('Captură față realizată cu succes!');
              } catch (e) {
                console.error('Eroare la capturarea feței:', e);
              }
              if (tEticheta) {
                tEticheta.style.paddingRight = tEtichetaOldPadding || '';
                console.log('Am revenit la padding-right inițial pe T:');
              }
            } else {
              console.log('Nu există fața pentru PDF!');
            }
            // === END ===
            if (fata && fataCanvas) {
              const fataImg = fataCanvas.toDataURL('image/jpeg', 1.0);
              pdf.addImage(fataImg, 'JPEG', 0, 0, 90, 50);
              pagini++;
              console.log('Am adăugat fața în PDF');
            } else {
              console.log('Nu am putut adăuga fața în PDF!');
            }
            if (verso) {
              let versoOk = false;
              if (pagini > 0) pdf.addPage([90, 50], 'landscape');
              try {
                console.log('Încerc să adaug direct imaginea logo pe verso în PDF...');
                const img = new window.Image();
                img.src = '../resurse/sigla/logo-ploiesti.png';
                await new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                });
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.naturalWidth;
                tempCanvas.height = img.naturalHeight;
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const logoDataUrl = tempCanvas.toDataURL('image/png');
                // Dimensiuni pentru zoom 20%
                const logoWidth = 90 * 1.2; // 108mm
                const logoHeight = 50 * 1.2; // 60mm
                const offsetX = (90 - logoWidth) / 2; // centrare pe pagină
                const offsetY = (50 - logoHeight) / 2;
                pdf.addImage(logoDataUrl, 'PNG', offsetX, offsetY, logoWidth, logoHeight);
                pagini++;
                versoOk = true;
                console.log('Am adăugat logo-ul pe verso direct în PDF');
              } catch (e) {
                console.warn('Nu am putut adăuga imaginea direct, revin la html2canvas:', e);
              }
              if (!versoOk) {
                // Fallback la html2canvas dacă nu merge direct imaginea
                const logoImg = document.createElement('img');
                logoImg.src = '../resurse/sigla/logo-ploiesti.png';
                logoImg.style.display = 'block';
                logoImg.style.margin = '0 auto';
                logoImg.style.width = '108%';
                logoImg.style.height = '120%';
                logoImg.style.transform = 'translate(-4%, -10%)';
                logoImg.style.objectFit = 'contain';
                logoImg.style.position = 'relative';
                logoImg.style.zIndex = '1';
                verso.appendChild(logoImg);
                const versoCanvas = await window.html2canvas(verso, { scale: 8, useCORS: true });
                const versoImg = versoCanvas.toDataURL('image/jpeg', 1.0);
                pdf.addImage(versoImg, 'JPEG', 0, 0, 90, 50);
                pagini++;
                verso.removeChild(logoImg);
                console.log('Am adăugat verso-ul în PDF cu html2canvas fallback');
              }
            }
            // Elimin SVG-ul după captură
            if (svgSite && svgSite.parentNode) svgSite.parentNode.removeChild(svgSite);
            // Elimin textul orizontal după captură
            // Eliminat la cererea utilizatorului
            // Elimin site-ul orizontal și arăt la loc site-ul vertical după captură
            if (siteTextDiv && siteTextDiv.parentNode) siteTextDiv.parentNode.removeChild(siteTextDiv);
            if (adresaWeb) adresaWeb.style.visibility = '';
            // === Adaugă clasa .eticheta-pdf la T: doar pentru PDF ===
            // Eliminat la cererea utilizatorului
            // Elimin padding-right după captură
            if (tEticheta) tEticheta.style.paddingRight = tEtichetaOldPadding || '';

            // === Setează padding-right 7px pentru toate .eticheta din .contact-inline și .adresa-flex doar pentru PDF ===
            const etichetePaddingRestore = [];
            if (fata) {
              const etichete = fata.querySelectorAll('.contact-inline .eticheta, .adresa-flex .eticheta');
              etichete.forEach(et => {
                etichetePaddingRestore.push({el: et, val: et.style.paddingRight});
                et.style.paddingRight = '7px';
              });
            }
            // === END ===

            // === Înfășor valorile după etichetă în <span> cu margin-left: 7px doar pentru PDF ===
            const spanWraps = [];
            if (fata) {
              const etichete = fata.querySelectorAll('.contact-inline .eticheta, .adresa-flex .eticheta');
              etichete.forEach(et => {
                let next = et.nextSibling;
                while (next && next.nodeType === 3 && !next.textContent.trim()) next = next.nextSibling;
                if (next && next.nodeType === 3 && next.textContent.trim()) {
                  const span = document.createElement('span');
                  span.textContent = next.textContent;
                  span.style.marginLeft = '7px';
                  et.parentNode.insertBefore(span, next);
                  et.parentNode.removeChild(next);
                  spanWraps.push({span, et, text: span.textContent});
                }
              });
              // Forțez margin-left: 15px pe al doilea span din .contact-inline (E:)
              const contactInline = fata.querySelector('.contact-inline');
              if (contactInline) {
                const spans = contactInline.querySelectorAll('span');
                if (spans.length > 1) {
                  spans[1].style.marginLeft = '15px';
                }
              }
            }
            // === END ===

            // === Setez margin-right: 7px pe .eticheta-i doar pentru PDF ===
            let etichetaI = null;
            let etichetaIMarginRight = null;
            if (fata) {
              etichetaI = fata.querySelector('.eticheta-i');
              if (etichetaI) {
                etichetaIMarginRight = etichetaI.style.marginRight;
                etichetaI.style.marginRight = '7px';
              }
            }
            // === END ===

            // === Afișare robustă PDF în iframe ===
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const iframe = document.getElementById('pdf-frame');
            if (iframe) {
              iframe.removeAttribute('src'); // reset pentru siguranță
              setTimeout(() => {
                iframe.src = pdfUrl;
                iframe.style.display = 'block';
                setTimeout(() => {
                  try {
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (!doc || !doc.body || doc.body.childNodes.length === 0) {
                      window.open(pdfUrl, '_blank');
                    }
                  } catch (e) {
                    window.open(pdfUrl, '_blank');
                  }
                }, 1200);
              }, 100);
            } else {
              window.open(pdfUrl, '_blank');
            }
            // Revenim la padding inițial după generare
            etichetePaddingRestore.forEach(obj => { obj.el.style.paddingRight = obj.val || ''; });
            // Elimin <span>-urile adăugate după generare și revin la textul original
            spanWraps.forEach(obj => {
              if (obj.span && obj.et && obj.text !== undefined) {
                obj.et.parentNode.insertBefore(document.createTextNode(obj.text), obj.span);
                obj.et.parentNode.removeChild(obj.span);
              }
            });
            // Revenim la margin-right inițial după generare
            if (etichetaI) etichetaI.style.marginRight = etichetaIMarginRight || '';
          }, 400);
        }
      });
    return;
  }

  fetch(getEchipaApiPath())
    .then(response => response.json())
    .then(echipa => {
      document.getElementById('cuprins').innerHTML = echipa.map((p, idx) =>
        `<a href="#" class="nume-link" data-idx="${idx}">${p["Nume"]}</a>`
      ).join('');
      document.querySelectorAll('.nume-link').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const idx = this.getAttribute('data-idx');
          window.location.href = `pagini/carte.html?id=${idx}`;
        });
      });
    });
  // Scroll la cuprins pe index.html
  if (document.getElementById('btn-top')) {
    document.getElementById('btn-top').addEventListener('click', function() {
      document.getElementById('cuprins').scrollIntoView({ behavior: 'smooth' });
    });
  }
}); 