# Icone per le Azioni delle Notifiche

Questo file contiene istruzioni per creare le icone necessarie per le azioni nelle notifiche push.

## Icone Necessarie

Crea le seguenti icone in formato PNG, dimensione consigliata 32x32 pixel:

1. `check.png` - Un'icona di spunta per l'azione "Completato"
2. `snooze.png` - Un'icona di sveglia per l'azione "Posticipa"
3. `good.png` - Un'emoji sorridente (😊) per il feedback positivo
4. `neutral.png` - Un'emoji neutra (😐) per il feedback neutro
5. `bad.png` - Un'emoji triste (😞) per il feedback negativo

## Come Creare le Icone

Puoi creare queste icone in diversi modi:

1. **Utilizzando Font Awesome o altri set di icone**:
   - Scarica le icone in formato SVG
   - Converti in PNG con dimensione 32x32
   - Salva nella cartella `action-icons`

2. **Utilizzando Emoji Unicode**:
   - Crea un canvas HTML di 32x32 pixel
   - Disegna l'emoji al centro
   - Esporta come PNG

3. **Utilizzando strumenti di design**:
   - Crea le icone in Figma, Adobe XD, o altri strumenti di design
   - Esporta come PNG 32x32

## Esempio HTML per Generare Icone da Emoji

```html
<!DOCTYPE html>
<html>
<head>
  <title>Genera Icone Emoji</title>
  <style>
    canvas {
      border: 1px solid #ccc;
      margin: 5px;
    }
  </style>
</head>
<body>
  <h1>Generatore Icone Emoji</h1>
  <div id="canvases"></div>
  <script>
    const emojis = [
      { name: 'good', emoji: '😊' },
      { name: 'neutral', emoji: '😐' },
      { name: 'bad', emoji: '😞' }
    ];
    
    const canvasesDiv = document.getElementById('canvases');
    
    emojis.forEach(item => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      canvas.title = item.name;
      canvasesDiv.appendChild(canvas);
      
      const ctx = canvas.getContext('2d');
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.emoji, 16, 16);
      
      // Aggiungi un link per il download
      const link = document.createElement('a');
      link.download = `${item.name}.png`;
      link.href = canvas.toDataURL('image/png');
      link.textContent = `Scarica ${item.name}.png`;
      canvasesDiv.appendChild(link);
      canvasesDiv.appendChild(document.createElement('br'));
    });
  </script>
</body>
</html>
```

Salva questo file come `generate-emoji-icons.html` e aprilo nel browser per generare le icone emoji.

## Importanza delle Icone nelle Notifiche

Le icone rendono le tue notifiche più intuitive e permettono agli utenti di interagire rapidamente con esse senza dover aprire l'app.