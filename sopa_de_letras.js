document.addEventListener('DOMContentLoaded', function () {
    const addSopaBtn = document.getElementById('addSopa');
    const generarSopasBtn = document.getElementById('generarSopas');
    const sopaInputsContainer = document.getElementById('sopaInputs');
    const previewContainer = document.getElementById('previewContainer');
    const resultadoMensaje = document.getElementById('resultadoMensaje');
    const downloadSection = document.getElementById('download-section');
    const descargarSeleccionadasBtn = document.getElementById('descargarSeleccionadas');
    const selectAllCheckbox = document.getElementById('selectAll');

    addSopaBtn.addEventListener('click', () => {
        const newInput = document.createElement('div');
        newInput.className = 'sopa-input';
        newInput.innerHTML = `
            <input type="text" placeholder="Título de la sopa de letras">
            <textarea placeholder="Ingrese palabras por coma o salto de línea"></textarea>
        `;
        sopaInputsContainer.appendChild(newInput);
    });
    generarSopasBtn.addEventListener('click', generarSopas);
    selectAllCheckbox.addEventListener('click', () => {
        document.querySelectorAll('.preview-item-checkbox').forEach(cb => cb.checked = selectAllCheckbox.checked);
    });
    descargarSeleccionadasBtn.addEventListener('click', descargarSopasSeleccionadas);

    // Event listener para los botones de "Ver Puzzle" y "Ver Solución"
    previewContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('toggle-btn')) {
            const parent = e.target.closest('.preview-item');
            const view = e.target.dataset.view; // 'puzzle' o 'solution'
            
            const puzzleImg = parent.querySelector('.puzzle-img');
            const solutionImg = parent.querySelector('.solution-img');

            if (view === 'puzzle') {
                puzzleImg.style.display = 'block';
                solutionImg.style.display = 'none';
            } else {
                puzzleImg.style.display = 'none';
                solutionImg.style.display = 'block';
            }
        }
    });

    function generarSopa(width, height, words, directions) {
        let grid = Array.from({ length: height }, () => Array(width).fill(null));
        const placedWords = [];
        const unplacedWords = [];
        words.sort((a, b) => b.length - a.length);
        words.forEach(word => {
            const cleanWord = word.toUpperCase().replace(/\s/g, '');
            if (cleanWord.length > width && cleanWord.length > height) {
                unplacedWords.push(word); return;
            }
            let placed = false;
            for (let i = 0; i < 100; i++) {
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const startX = Math.floor(Math.random() * width);
                const startY = Math.floor(Math.random() * height);
                if (canPlaceWord(grid, cleanWord, startX, startY, dir)) {
                    placeWord(grid, cleanWord, startX, startY, dir);
                    placedWords.push({ word: cleanWord, startX, startY, direction: dir });
                    placed = true; break;
                }
            }
            if (!placed) unplacedWords.push(word);
        });
        const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (grid[y][x] === null) grid[y][x] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
        }
        return { grid, placedWords, unplacedWords };
    }
    function canPlaceWord(grid, word, x, y, dir) {
        for (let i = 0; i < word.length; i++) {
            const newX = x + i * dir.x, newY = y + i * dir.y;
            if (newX < 0 || newX >= grid[0].length || newY < 0 || newY >= grid.length || (grid[newY][newX] !== null && grid[newY][newX] !== word[i])) return false;
        }
        return true;
    }
    function placeWord(grid, word, x, y, dir) {
        for (let i = 0; i < word.length; i++) grid[y + i * dir.y][x + i * dir.x] = word[i];
    }

  async function crearImagenSopaDeLetras(sopaData, showSolution = false) {
    const { title, words, gridData, width, height, sopaIndex } = sopaData;
    const { grid, placedWords } = gridData;
    const canvasWidth = 1240, canvasHeight = 1754, margin = 80;
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth; canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    const colors = { background: '#FFFFFF', text: '#000000', titleBox: '#F0F0F0', titleAccent: '#808080', solution: '#FF8C00' };
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // --- INICIO DEL CÓDIGO ACTUALIZADO ---
    const titleBoxHeight = 80, titleY = margin;
    const titleBoxWidth = canvasWidth - (margin * 2);
    const borderRadius = 20; // Radio para las esquinas redondeadas

    // Dibuja el contenedor del título con bordes redondeados
    ctx.fillStyle = colors.titleBox;
    ctx.beginPath();
    ctx.moveTo(margin + borderRadius, titleY);
    ctx.arcTo(margin + titleBoxWidth, titleY,   margin + titleBoxWidth, titleY + titleBoxHeight, borderRadius);
    ctx.arcTo(margin + titleBoxWidth, titleY + titleBoxHeight, margin, titleY + titleBoxHeight, borderRadius);
    ctx.arcTo(margin, titleY + titleBoxHeight, margin, titleY, borderRadius);
    ctx.arcTo(margin, titleY, margin + titleBoxWidth, titleY, borderRadius);
    ctx.closePath();
    ctx.fill();

    // Dibuja el título centrado
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 36px Roboto';
    ctx.textAlign = 'center'; // Alineación centrada
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvasWidth / 2, titleY + titleBoxHeight / 2); // Posición centrada
    // --- FIN DEL CÓDIGO ACTUALIZADO ---

    const wordsY = titleY + titleBoxHeight + 30;
    const wordsBoxWidth = canvasWidth - (margin * 2);
    const maxWordsPerColumn = 6;
    const numColumns = words.length > 0 ? Math.ceil(words.length / maxWordsPerColumn) : 1;
    const wordsPerColumn = Math.ceil(words.length / numColumns);
    const wordsBoxHeight = (wordsPerColumn * 35) + 40;
    const columnWidth = wordsBoxWidth / numColumns;
    ctx.strokeStyle = colors.titleAccent;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 10]);
    ctx.strokeRect(margin, wordsY, wordsBoxWidth, wordsBoxHeight);
    ctx.setLineDash([]);
    ctx.font = '28px Roboto';
    ctx.textAlign = 'left'; // Se restablece a la izquierda para la lista de palabras
    ctx.textBaseline = 'top';
    words.forEach((word, index) => {
        const col = Math.floor(index / wordsPerColumn);
        const yOffset = (index % wordsPerColumn) * 35;
        ctx.fillText(word.toUpperCase(), margin + 20 + col * columnWidth, wordsY + 20 + yOffset);
    });

    const gridY = wordsY + wordsBoxHeight + 30;
    const availableHeightForGrid = canvasHeight - gridY - margin - 80;
    const availableWidthForGrid = canvasWidth - (margin * 2);
    const cellSize = Math.min(availableWidthForGrid / width, availableHeightForGrid / height);
    const gridWidth = width * cellSize, gridHeight = height * cellSize;
    const gridX = (canvasWidth - gridWidth) / 2;

    ctx.font = `bold ${cellSize * 0.65}px "Roboto", sans serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    
    if (showSolution) {
        ctx.strokeStyle = colors.solution;
        ctx.lineWidth = cellSize * 0.7;
        ctx.lineCap = 'round';
        placedWords.forEach(({ word, startX, startY, direction }) => {
            const endX = startX + (word.length - 1) * direction.x, endY = startY + (word.length - 1) * direction.y;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.moveTo(gridX + (startX + 0.5) * cellSize, gridY + (startY + 0.5) * cellSize);
            ctx.lineTo(gridX + (endX + 0.5) * cellSize, gridY + (endY + 0.5) * cellSize);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        });
    }

    ctx.fillStyle = colors.text;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            ctx.fillText(grid[y][x], gridX + (x + 0.5) * cellSize, gridY + (y + 0.5) * cellSize);
        }
    }
    
    ctx.font = '22px Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    if (showSolution) {
         ctx.fillText(`Respuesta: ${title}`, canvasWidth / 2, canvasHeight - margin - 0);
    }
    ctx.fillText('Mira el libro en: amazon.com/author/missespanol', canvasWidth / 2, canvasHeight - margin - 25);
    ctx.fillText('Descarga más en limenaintrovertida.blogspot.com', canvasWidth / 2, canvasHeight - margin - 55);

    return canvas.toDataURL('image/png');
}

    function getSelectedDirections() {
        const directions = [];
        if (document.getElementById('horizontalNormal').checked) directions.push({ x: 1, y: 0 });
        if (document.getElementById('horizontalInversa').checked) directions.push({ x: -1, y: 0 });
        if (document.getElementById('verticalNormal').checked) directions.push({ x: 0, y: 1 });
        if (document.getElementById('verticalInversa').checked) directions.push({ x: 0, y: -1 });
        if (document.getElementById('diagonalNormal').checked) { directions.push({ x: 1, y: 1 }); directions.push({ x: 1, y: -1 }); }
        if (document.getElementById('diagonalInversa').checked) { directions.push({ x: -1, y: -1 }); directions.push({ x: -1, y: 1 }); }
        return directions.length > 0 ? directions : [{ x: 1, y: 0 }];
    }

    async function generarSopas() {
        previewContainer.innerHTML = '';
        resultadoMensaje.innerHTML = 'Generando...';
        const ancho = parseInt(document.getElementById('ancho').value), alto = parseInt(document.getElementById('alto').value);
        const directions = getSelectedDirections();
        const sopaInputs = sopaInputsContainer.querySelectorAll('.sopa-input');
        let unplacedWordsExist = false;

        let hasAnyInput = false;

        for (let i = 0; i < sopaInputs.length; i++) {
            const input = sopaInputs[i];
            const title = input.querySelector('input[type="text"]').value || `Sopa de Letras ${i + 1}`;
            const wordsRaw = input.querySelector('textarea').value;

            // --- INICIO DE CAMBIO: Aceptar palabras por coma o salto de línea ---
            const words = wordsRaw.split(/[\n,]+/).map(w => w.trim()).filter(w => w.length > 0);
            // --- FIN DE CAMBIO ---
            
            if (words.length === 0) continue;
            hasAnyInput = true;

            const gridData = generarSopa(ancho, alto, words, directions);
            if (gridData.unplacedWords.length > 0) {
                unplacedWordsExist = true; console.warn(`Palabras no colocadas en "${title}":`, gridData.unplacedWords);
            }

            const sopaData = { title, words, gridData, width: ancho, height: alto, sopaIndex: i + 1 };
            const puzzleImgSrc = await crearImagenSopaDeLetras(sopaData, false);
            const solutionImgSrc = await crearImagenSopaDeLetras(sopaData, true);
            
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <h4>${title}</h4>
                <div class="preview-images">
                    <img src="${puzzleImgSrc}" alt="Puzzle: ${title}" class="puzzle-img">
                    <img src="${solutionImgSrc}" alt="Solución: ${title}" class="solution-img" style="display:none;">
                </div>
                <div class="preview-toggle">
                    <button class="toggle-btn" data-view="puzzle">Ver Puzzle</button>
                    <button class="toggle-btn" data-view="solution">Ver Solución</button>
                </div>
                <div class="downloads">
                    <a href="${puzzleImgSrc}" download="${title.replace(/ /g, '_')}_Puzzle.png">Descargar Puzzle</a> |
                    <a href="${solutionImgSrc}" download="${title.replace(/ /g, '_')}_Solucion.png">Descargar Solución</a>
                </div>
                <label>
                    <input type="checkbox" class="preview-item-checkbox" data-title="${title}" data-puzzle-src="${puzzleImgSrc}" data-solution-src="${solutionImgSrc}"> Seleccionar para ZIP
                </label>`;
            previewContainer.appendChild(previewItem);
        }
        
        resultadoMensaje.textContent = unplacedWordsExist ? 'Generación completada. Algunas palabras no se pudieron colocar (revisa la consola).' : '¡Sopas generadas con éxito!';
        
        if (hasAnyInput) {
            downloadSection.style.display = 'block';
        } else {
            downloadSection.style.display = 'none';
            resultadoMensaje.textContent = 'Agrega palabras para generar una sopa de letras.';
        }
    }

    async function descargarSopasSeleccionadas() {
        const zip = new JSZip();
        const selectedCheckboxes = document.querySelectorAll('.preview-item-checkbox:checked');
        if (selectedCheckboxes.length === 0) {
            alert('Por favor, selecciona al menos una sopa de letras para descargar.'); return;
        }
        for (const cb of selectedCheckboxes) {
            const title = cb.dataset.title.replace(/ /g, '_');
            const puzzleBlob = await (await fetch(cb.dataset.puzzleSrc)).blob();
            const solutionBlob = await (await fetch(cb.dataset.solutionSrc)).blob();
            zip.file(`${title}_Puzzle.png`, puzzleBlob);
            zip.file(`${title}_Solucion.png`, solutionBlob);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'Sopas_de_Letras.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});