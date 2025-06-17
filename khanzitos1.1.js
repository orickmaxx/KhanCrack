(function() {
  if (document.getElementById("khz-panel")) return;

  const features = {
    questionSpoof: false,
    videoSpoof: false,
    revealAnswers: false,
    autoAnswer: false,
    darkMode: true,
    rgbLogo: false,
    oneko: false
  };

  const config = {
    autoAnswerDelay: 1.5
  };

  function sendToast(message, duration = 4000) {
    const toast = document.createElement("div");
    toast.className = "khz-toast";
    toast.innerHTML = `
      <div class="khz-toast-message">${message}</div>
      <div class="khz-toast-progress"></div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("hide");
      setTimeout(() => toast.remove(), 500);
    }, duration);
  }

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeOut { 0% { opacity: 1 } 100% { opacity: 0 } }
    .khz-splash { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000; display: flex; justify-content: center; align-items: center; z-index: 999999; color: #800080; font-size: 42px; font-family: sans-serif; font-weight: bold; transition: opacity 1s ease; }
    .khz-splash.fadeout { animation: fadeOut 1s ease forwards; }
    .khz-toggle { position: fixed; bottom: 20px; left: 20px; width: 40px; height: 40px; background: #111; border: 2px solid #800080; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 100000; color: #fff; font-size: 20px; font-weight: bold; box-shadow: 0 0 10px #800080; font-family: sans-serif; transition: 0.3s; }
    .khz-toggle:hover { background: #800080; }
    .khz-panel { position: fixed; top: 100px; left: 100px; width: 300px; background: rgba(0, 0, 0, 0.95); border-radius: 16px; padding: 20px; z-index: 99999; color: #fff; font-family: sans-serif; box-shadow: 0 0 20px rgba(128, 0, 128, 0.6); cursor: grab; display: none; }
    .khz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .khz-title { font-weight: bold; font-size: 20px; color: #800080; }
    .khz-button { display: block; width: 100%; margin: 10px 0; padding: 10px; background: #111; color: white; border: 2px solid #800080; border-radius: 8px; cursor: pointer; font-size: 14px; transition: 0.3s; }
    .khz-button:hover { background: #800080; border-color: #fff; }
    .khz-button.active{background:#800080;border-color:#800080;box-shadow:0 0 8px #800080;}
    .khz-input-group { display: flex; align-items: center; justify-content: space-between; margin-top: 5px; }
    .khz-input-group label { font-size: 12px; color: #ccc; }
    .khz-input-group input { width: 60px; background: #222; color: #fff; border: 1px solid #800080; border-radius: 4px; padding: 4px; text-align: center; }
    .khz-toast{position:fixed;bottom:20px;right:20px;background:#111;color:#fff;border:1px solid #800080;border-radius:8px;padding:12px 16px;margin-top:10px;box-shadow:0 0 10px #800080;font-size:14px;font-family:sans-serif;z-index:999999;animation:fadeIn 0.3s ease-out;overflow:hidden;width:fit-content;max-width:300px}.khz-toast.hide{animation:fadeOut 0.5s ease forwards}.khz-toast-progress{position:absolute;left:0;bottom:0;height:4px;background:#800080;animation:toastProgress linear forwards;animation-duration:4s;width:100%}.khz-toast-message{position:relative;z-index:1}@keyframes toastProgress{from{width:100%}to{width:0%}}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(10px)}}
    .khz-footer { margin-top: 15px; padding-top: 10px; border-top: 1px solid #4a4a4a; text-align: center; font-size: 12px; }
    .khz-footer a { color: #c4b5fd; text-decoration: none; transition: color 0.3s; }
    .khz-footer a:hover { color: #a78bfa; }
    
    @media (max-width: 768px) {
      .khz-panel {
        width: 90vw;
        max-width: 280px;
        padding: 15px;
        left: 50%;
        top: 20px;
        transform: translateX(-50%);
      }
      .khz-button { padding: 8px; font-size: 13px; }
      .khz-title { font-size: 18px; }
      .khz-toast {
        width: 85vw;
        max-width: 400px;
        left: 50%;
        bottom: 20px;
        right: auto;
        transform: translateX(-50%);
      }
    }
  `;
  document.head.appendChild(style);

  const originalParse = JSON.parse;
  JSON.parse = function(text, reviver) {
    let data = originalParse(text, reviver);
    if (features.revealAnswers && data && data.data) {
      try {
        const dataValues = Object.values(data.data);
        for (const val of dataValues) {
          if (val && val.item && val.item.itemData) {
            let itemData = JSON.parse(val.item.itemData);
            if (itemData.question && itemData.question.widgets) {
              for (const widget of Object.values(itemData.question.widgets)) {
                if (widget.options && widget.options.choices) {
                  widget.options.choices.forEach(choice => {
                    if (choice.correct) {
                      choice.content = "✅ " + choice.content;
                      sendToast("Questão exploitada.");
                    }
                  });
                }
              }
            }
            val.item.itemData = JSON.stringify(itemData);
          }
        }
      } catch (e) {}
    }
    return data;
  };

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    let [input, init] = args;

    if (features.videoSpoof) {
      let requestBody, modifiedBody;
      if (input instanceof Request) {
        requestBody = await input.clone().text().catch(() => null);
      } else if (init && init.body) {
        requestBody = init.body;
      }

      if (requestBody && requestBody.includes('"operationName":"updateUserVideoProgress"')) {
        try {
          let bodyObj = JSON.parse(requestBody);
          if (bodyObj.variables && bodyObj.variables.input) {
            const duration = bodyObj.variables.input.durationSeconds;
            bodyObj.variables.input.secondsWatched = duration;
            bodyObj.variables.input.lastSecondWatched = duration;
            modifiedBody = JSON.stringify(bodyObj);
          }
          if (modifiedBody) {
            if (input instanceof Request) {
              args[0] = new Request(input, {
                body: modifiedBody,
                ...init
              });
            } else {
              if (!args[1]) args[1] = {};
              args[1].body = modifiedBody;
            }
          }
        } catch (e) {}
      }
    }

    const originalResponse = await originalFetch.apply(this, args);

    if (features.questionSpoof && originalResponse.ok) {
      const clonedResponse = originalResponse.clone();
      try {
        let responseObj = await clonedResponse.json();
        if (responseObj && responseObj.data && responseObj.data.assessmentItem && responseObj.data.assessmentItem.item && responseObj.data.assessmentItem.item.itemData) {
          const phrases = [
            "Feito por [@biscurim](https://github.com/biscurimdev) e [@hackermoon](https://github.com/hackermoon1)!",
            "Créditos para [biscurim](https://github.com/biscurimdev) :)",
            "Acesse o GitHub do [hackermoon](https://github.com/hackermoon1)!",
            "✅",
            "Manda a próxima, na moral."
          ];
          let itemData = JSON.parse(responseObj.data.assessmentItem.item.itemData);

          itemData.question.content = phrases[Math.floor(Math.random() * phrases.length)] + `\n\n[[☃ radio 1]]`;
          itemData.question.widgets = {
            "radio 1": {
              type: "radio",
              options: {
                choices: [{
                  content: "✅",
                  correct: true
                }, {
                  content: "❌",
                  correct: false
                }]
              }
            }
          };
          responseObj.data.assessmentItem.item.itemData = JSON.stringify(itemData);

          sendToast("Questão exploitada.");
          return new Response(JSON.stringify(responseObj), {
            status: 200,
            statusText: "OK",
            headers: originalResponse.headers
          });
        }
      } catch (e) {}
    }

    return originalResponse;
  };

  (async function autoAnswerLoop() {
    while (true) {
      if (features.autoAnswer) {
        const click = (selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.click();
          }
        };
        click('[data-testid="choice-icon__library-choice-icon"]');
        await delay(100);
        click('[data-testid="exercise-check-answer"]');
        await delay(100);
        click('[data-testid="exercise-next-question"]');
        await delay(100);
        click('._1udzurba');
        click('._awve9b');

        const summaryButton = document.querySelector('._1udzurba[data-test-id="end-of-unit-test-next-button"]');
        if (summaryButton && summaryButton.innerText.toLowerCase().includes("resumo")) {
          sendToast("🎉 Exercício concluído!");
        }
      }
      await delay(config.autoAnswerDelay * 1000);
    }
  })();

  const splash = document.createElement("div");
  splash.className = "khz-splash";
  splash.textContent = "KHANZITOS";
  document.body.appendChild(splash);

  (async function initializeUI() {
    const toastifyScript = document.createElement('script');
    toastifyScript.src = 'https://cdn.jsdelivr.net/npm/toastify-js';
    document.head.appendChild(toastifyScript);

    const darkReaderScript = document.createElement('script');
    darkReaderScript.src = 'https://cdn.jsdelivr.net/npm/darkreader@4.9.92/darkreader.min.js';
    darkReaderScript.onload = () => {
      DarkReader.setFetchMethod(window.fetch);
      if (features.darkMode) {
        DarkReader.enable();
      }
      sendToast("KHANZITOS Ativado!");
    };
    document.head.appendChild(darkReaderScript);

    function loadScript(src, id) {
      return new Promise((resolve, reject) => {
        if (document.getElementById(id)) return resolve();
        const script = document.createElement('script');
        script.src = src;
        script.id = id;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    setTimeout(() => {
      splash.classList.add("fadeout");
      setTimeout(() => {
        splash.remove();

        const toggleBtn = document.createElement("div");
        toggleBtn.innerHTML = "≡";
        toggleBtn.className = "khz-toggle";
        toggleBtn.onclick = () => {
          const p = document.getElementById("khz-panel");
          if (p) {
            p.style.display = p.style.display === "none" ? "block" : "none";
          }
        };
        document.body.appendChild(toggleBtn);

        const panel = document.createElement("div");
        panel.id = "khz-panel";
        panel.className = "khz-panel";
        panel.innerHTML = `
          <div class="khz-header">
            <div class="khz-title">KHANZITOS</div>
            <div>V1.1</div>
          </div>
          <button id="khz-btn-question" class="khz-button">Question Spoof [OFF]</button>
          <button id="khz-btn-video" class="khz-button">Video Spoof [OFF]</button>
          <button id="khz-btn-reveal" class="khz-button">Reveal Answers [OFF]</button>
          <button id="khz-btn-auto" class="khz-button">Auto Answer [OFF]</button>
          <div class="khz-input-group">
            <label for="khz-input-speed">Velocidade (s):</label>
            <input type="number" id="khz-input-speed" value="${config.autoAnswerDelay}" step="0.1" min="0.2">
          </div>
          <button id="khz-btn-dark" class="khz-button active">Dark Mode [ON]</button>
          <button id="khz-btn-rgb" class="khz-button">RGB Logo [OFF]</button>
          <button id="khz-btn-oneko" class="khz-button">OnekoJS [OFF]</button>
          <div class="khz-footer">
            <a href="https://discord.gg/NSKMumh4Yu" target="_blank">MoonScripts 🌙</a>
          </div>
        `;
        document.body.appendChild(panel);

        const speedInput = document.getElementById('khz-input-speed');
        if (speedInput) {
          speedInput.addEventListener('input', () => {
            const newDelay = parseFloat(speedInput.value);
            if (newDelay >= 0.2) {
              config.autoAnswerDelay = newDelay;
            }
          });
        }

        const setupButton = (buttonId, featureName, buttonText) => {
          const button = document.getElementById(buttonId);
          if (button) {
            button.addEventListener('click', () => {
              if (featureName === 'darkMode') {
                if (features.darkMode) {
                  if (typeof DarkReader !== 'undefined') DarkReader.disable();
                  features.darkMode = false;
                } else {
                  if (typeof DarkReader !== 'undefined') DarkReader.enable();
                  features.darkMode = true;
                }
              } else {
                features[featureName] = !features[featureName];
              }

              const stateText = features[featureName] ? 'ON' : 'OFF';
              button.textContent = `${buttonText} [${stateText}]`;
              button.classList.toggle('active', features[featureName]);
            });
          }
        };

        setupButton('khz-btn-question', 'questionSpoof', 'Question Spoof');
        setupButton('khz-btn-video', 'videoSpoof', 'Video Spoof');
        setupButton('khz-btn-reveal', 'revealAnswers', 'Reveal Answers');
        setupButton('khz-btn-auto', 'autoAnswer', 'Auto Answer');
        setupButton('khz-btn-dark', 'darkMode', 'Dark Mode');
        const rgbBtn = document.getElementById("khz-btn-rgb");
        if (rgbBtn) {
            rgbBtn.addEventListener("click", toggleRgbLogo);
        }
        features.oneko = false;
        const onekoBtn = document.getElementById("khz-btn-oneko");
        if (onekoBtn) {
            onekoBtn.addEventListener("click", toggleOnekoJs);
        }

        function toggleRgbLogo() {
          const khanLogo = document.querySelector('path[fill="#14bf96"]');
          const existingStyle = document.querySelector('style.RGBLogo');

          if (!khanLogo) {
            sendToast("❌ Logo do Khan Academy não encontrado.");
            return;
          }

          if (features.rgbLogo) {
            if (existingStyle) existingStyle.remove();
            khanLogo.style.filter = '';
            features.rgbLogo = false;
            sendToast("🎨 RGB Logo desativado.");
          } else {
            const styleElement = document.createElement('style');
            styleElement.className = "RGBLogo";
            styleElement.textContent = `
              @keyframes hueShift {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
              }
              .force-rgb-logo {
                animation: hueShift 5s infinite linear !important;
              }
            `;
            document.head.appendChild(styleElement);

            khanLogo.classList.add("force-rgb-logo");
            features.rgbLogo = true;
            sendToast("🌈 RGB Logo ativado!");
          }

          const rgbButton = document.getElementById("khz-btn-rgb");
          if(rgbButton){
              const stateText = features.rgbLogo ? "ON" : "OFF";
              rgbButton.textContent = `RGB Logo [${stateText}]`;
              rgbButton.classList.toggle("active", features.rgbLogo);
          }
        }

        function toggleOnekoJs() {
          const onekoButton = document.getElementById("khz-btn-oneko");

          if (features.oneko) {
            const el = document.getElementById("oneko");
            if (el) el.remove();
            features.oneko = false;
            if(onekoButton){
                onekoButton.textContent = "OnekoJS [OFF]";
                onekoButton.classList.remove("active");
            }
            sendToast("🐾 Oneko desativado.");
          } else {
            loadScript('https://cdn.jsdelivr.net/gh/adryd325/oneko.js/oneko.js', 'onekoJs').then(() => {
              if (typeof oneko === "function") {
                oneko();
                setTimeout(() => {
                  const onekoEl = document.getElementById('oneko');
                  if (onekoEl) {
                    onekoEl.style.backgroundImage = "url('https://raw.githubusercontent.com/adryd325/oneko.js/main/oneko.gif')";
                    onekoEl.style.display = "block";
                    features.oneko = true;
                    if(onekoButton){
                        onekoButton.textContent = "OnekoJS [ON]";
                        onekoButton.classList.add("active");
                    }
                    sendToast("🐱 Oneko ativado!");
                  } else {
                    sendToast("⚠️ Oneko iniciou, mas não foi encontrado.");
                  }
                }, 500);
              } else {
                sendToast("❌ oneko() não está disponível.");
              }
            });
          }
        }

        let dragging = false,
          offsetX = 0,
          offsetY = 0;

        const startDrag = (e) => {
            if (e.target instanceof HTMLElement && (e.target.closest("button") || e.target.closest("input") || e.target.closest("a"))) return;
            dragging = true;
            const touch = e.touches ? e.touches[0] : null;
            const clientX = touch ? touch.clientX : e.clientX;
            const clientY = touch ? touch.clientY : e.clientY;
            offsetX = clientX - panel.offsetLeft;
            offsetY = clientY - panel.offsetTop;
            panel.style.cursor = "grabbing";
        };

        const onDrag = (e) => {
          if (dragging) {
            const touch = e.touches ? e.touches[0] : null;
            if(touch) e.preventDefault();
            const clientX = touch ? touch.clientX : e.clientX;
            const clientY = touch ? touch.clientY : e.clientY;
            panel.style.left = (clientX - offsetX) + "px";
            panel.style.top = (clientY - offsetY) + "px";
          }
        };

        const endDrag = () => {
          dragging = false;
          panel.style.cursor = "grab";
        };

        panel.addEventListener("mousedown", startDrag);
        document.addEventListener("mousemove", onDrag);
        document.addEventListener("mouseup", endDrag);

        panel.addEventListener("touchstart", startDrag, { passive: true });
        document.addEventListener("touchmove", onDrag, { passive: false });
        document.addEventListener("touchend", endDrag);

      }, 1000);
    }, 2000);
  })();

})();
