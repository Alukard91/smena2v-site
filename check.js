
        // ============================================================
        // ПАРОЛЬ АДМИНКИ: 2517
        // ============================================================
        const ADMIN_PASSWORD = '2517';
        let isAdmin = false;

        // Правила перерывов
        const breakRules = {
            7: [
                { name: "📢 Планерка", h: 7, m: 0 },
                { name: "☕ Перерыв", h: 8, m: 45 },
                { name: "🍔 Обед (Гр. Снеговой)", h: 11, m: 0 },
                { name: "🍔 Обед (Гр. Рябцев, Докукин)", h: 11, m: 30 },
                { name: "☕ Перерыв", h: 13, m: 0 },
                { name: "☕ Перерыв", h: 14, m: 45 },
                { name: "☕ Перерыв", h: 17, m: 0 },
                { name: "☕ Перерыв", h: 18, m: 0 },
                { name: "🛑 Конец смены", h: 19, m: 0 }
            ],
            8: [
                { name: "📢 Планерка", h: 8, m: 0 },
                { name: "☕ Перерыв", h: 9, m: 45 },
                { name: "🍔 Обед (Гр. Снеговой)", h: 11, m: 30 },
                { name: "🍔 Обед (Гр. Рябцев)", h: 12, m: 0 },
                { name: "🍔 Обед (Гр. Докукин)", h: 12, m: 30 },
                { name: "☕ Перерыв", h: 14, m: 0 },
                { name: "☕ Перерыв", h: 15, m: 45 },
                { name: "☕ Перерыв", h: 18, m: 0 },
                { name: "☕ Перерыв", h: 19, m: 0 },
                { name: "🛑 Конец смены", h: 20, m: 0 }
            ],
            9: [
                { name: "📢 Планерка", h: 9, m: 0 },
                { name: "☕ Перерыв", h: 10, m: 45 },
                { name: "🍔 Обед (Гр. Снеговой)", h: 12, m: 30 },
                { name: "🍔 Обед (Гр. Рябцев, Докукин)", h: 13, m: 0 },
                { name: "☕ Перерыв", h: 15, m: 0 },
                { name: "☕ Перерыв", h: 16, m: 45 },
                { name: "☕ Перерыв", h: 19, m: 0 },
                { name: "☕ Перерыв", h: 20, m: 0 },
                { name: "🛑 Конец смены", h: 21, m: 0 }
            ]
        };

        let activeIntervals = [];
        let currentMessages = [];

        // --- КАЛЕНДАРЬ ---
        let calYear, calMonth;

        function getTodayKey(d) {
            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        }

        function isWorkDay(d) {
            const day = new Date(d);
            day.setHours(0, 0, 0, 0);
            const anchor = new Date(2026, 7, 12); // 12.08.2026 — рабочий день (якорь графика 2/2)
            anchor.setHours(0, 0, 0, 0);
            const diff = Math.round((day - anchor) / 86400000);
            const phase = ((diff % 4) + 4) % 4;
            return phase === 0 || phase === 1;
        }

        function calMove(step) {
            calMonth += step;
            if (calMonth < 0) { calMonth = 11; calYear--; }
            if (calMonth > 11) { calMonth = 0; calYear++; }
            renderCalendar();
        }

        function renderCalendar() {
            const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
            document.getElementById('cal-title').innerText = `${monthNames[calMonth]} ${calYear}`;

            const first = new Date(calYear, calMonth, 1);
            let offset = (first.getDay() + 6) % 7;
            const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
            const today = new Date();
            const todayKey = getTodayKey(today);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowKey = getTodayKey(tomorrow);

            const cells = [];
            for (let i = 0; i < offset; i++) cells.push('<td></td>');

            for (let d = 1; d <= daysInMonth; d++) {
                const date = new Date(calYear, calMonth, d);
                const key = getTodayKey(date);
                const work = isWorkDay(date);
                let cls = work ? 'cal-day cal-work' : 'cal-day cal-rest';
                let label = '';
                if (key === todayKey) { cls += ' cal-today'; label = '· Сегодня'; }
                else if (key === tomorrowKey) { cls += ' cal-tomorrow'; label = '· Завтра'; }
                const extra = label ? `<small style="display:block; font-size:0.68rem;">${label}</small>` : '';
                cells.push(`<td><span class="${cls}">${d}${extra}</span></td>`);
            }
            while (cells.length % 7 !== 0) cells.push('<td></td>');

            let html = '';
            for (let i = 0; i < cells.length; i += 7) {
                html += `<tr>${cells.slice(i, i + 7).join('')}</tr>`;
            }
            document.getElementById('cal-body').innerHTML = html;
        }

        // --- КАЛЬКУЛЯТОР ЗВЁЗД ---
        const STAR_PROJECTS = [
            { name: 'Вирусы любые (ТРИ услуги)', w: 45 },
            { name: 'ТВ', w: 30 },
            { name: 'Книги', w: 50 },
            { name: 'МГ', w: 17 },
            { name: 'Одно оборудование', w: 25 },
            { name: 'Два оборудования', w: 30 }
        ];
        const STAR_GOALS = [1650, 2200];
        const STAR_KEY = 'stars_calc_state';

        function starLoad() {
            try {
                const raw = localStorage.getItem(STAR_KEY);
                if (raw) {
                    const s = JSON.parse(raw);
                    if (s && typeof s === 'object') return s;
                }
            } catch (e) {}
            return {};
        }

        let starData = starLoad();

        function renderStarsCalc() {
            const counts = starData;
            const list = document.getElementById('stars-list');
            list.innerHTML = '';
            STAR_PROJECTS.forEach((p, i) => {
                const row = document.createElement('div');
                row.className = 'star-row';
                row.innerHTML = `
                    <span class="star-name">${p.name}</span>
                    <span class="star-weight">вес ${p.w}</span>
                    <div class="star-controls">
                        <button onclick="starStep(${i}, -1)">−</button>
                        <input type="number" min="0" value="${counts[p.name] || 0}" onchange="starInput(${i}, this.value)">
                        <button onclick="starStep(${i}, 1)">+</button>
                    </div>`;
                list.appendChild(row);
            });
            updateStarsResult(counts);
        }

        function starCounts() {
            return starData;
        }

        function starSave(c) {
            starData = c;
            localStorage.setItem(STAR_KEY, JSON.stringify(c));
        }

        function starReset() {
            if (!confirm('Сбросить все данные калькулятора?')) return;
            starData = {};
            localStorage.removeItem(STAR_KEY);
            renderStarsCalc();
        }

        function starStep(i, d) {
            const c = starCounts();
            const p = STAR_PROJECTS[i];
            c[p.name] = Math.max(0, (c[p.name] || 0) + d);
            starSave(c);
            const input = document.querySelectorAll('#stars-list input')[i];
            if (input) input.value = c[p.name];
            updateStarsResult(c);
        }

        function starInput(i, val) {
            const c = starCounts();
            const p = STAR_PROJECTS[i];
            c[p.name] = Math.max(0, parseInt(val) || 0);
            starSave(c);
            updateStarsResult(c);
        }

        function updateStarsResult(counts) {
            let total = 0;
            STAR_PROJECTS.forEach(p => {
                total += (counts[p.name] || 0) * p.w;
            });
            const res = document.getElementById('stars-result');
            let html = `<div class="res-line"><span>Всего заявок:</span><b>${total} баллов</b></div>`;
            STAR_GOALS.forEach((g, gi) => {
                const rem = Math.max(0, g - total);
                const pct = Math.min(100, Math.round(total / g * 100));
                const star = '⭐'.repeat(gi + 1);
                html += `<div class="res-line"><span>До ${star} (${g}):</span><b class="rem">${rem === 0 ? '✅ Достигнуто!' : 'осталось ' + rem}</b></div>`;
                html += `<div class="star-bar"><div class="fill" style="width:${pct}%"></div></div>`;
            });
            res.innerHTML = html;
        }

        // --- НОВОСТИ ---
        function renderNews() {
            const container = document.getElementById('newsContent');
            
            fetch('news_editor.php?action=get')
                .then(response => response.text())
                .then(html => {
                    if (html && html.trim() !== '') {
                        container.innerHTML = html;
                    } else {
                        container.innerHTML = '<div class="empty-news">Новостей пока нет</div>';
                        loadFunFact(container);
                    }
                })
                .catch(() => {
                    container.innerHTML = '<div class="empty-news">Ошибка загрузки новостей</div>';
                    loadFunFact(container);
                });
        }

        // Смешной факт о мире, когда новостей от руководителя нет
        const FUN_FACTS = [
            { i: '🐙', t: 'Осьминоги имеют три сердца и голубую кровь.' },
            { i: '😴', t: 'За день человек моргает в среднем около 25 000 раз.' },
            { i: '🍯', t: 'Мёд никогда не портится — археологи находили съедобный мёд тысячелетней давности.' },
            { i: '🐌', t: 'У улиток около 25 000 зубов, но они ими не жуют.' },
            { i: '🐧', t: 'В Антарктиде есть реки, но они текут только летом.' },
            { i: '🦋', t: 'Бабочки ощущают вкус лапками.' },
            { i: '🐘', t: 'Слон — единственное животное, которое не умеет прыгать.' },
            { i: '☁️', t: 'Среднее облако весит около 500 тонн.' },
            { i: '🐱', t: 'Кошки проводят около 70% жизни во сне.' },
            { i: '🚀', t: 'В космосе никто не слышит, как ты кричишь — там вакуум.' },
            { i: '🐊', t: 'Крокодилы не могут высунуть язык.' },
            { i: '🧠', t: 'Человеческий мозг на 75% состоит из воды.' },
            { i: '☀️', t: 'Свет от Солнца добирается до Земли за 8 минут 20 секунд.' },
            { i: '🦒', t: 'У жирафа и человека одинаковое количество шейных позвонков — 7.' },
            { i: '😄', t: 'Одна минута смеха продлевает жизнь на 10 минут. (По мнению юмористов.)' },
            { i: '🐜', t: 'Муравьи никогда не спят — они просто периодически замирают.' },
            { i: '🦓', t: 'Зебра на самом деле белая с чёрными полосами, а не наоборот.' },
            { i: '🕷️', t: 'Паук не насекомое — у него 8 ног, а у насекомых 6.' },
            { i: '🍫', t: 'Шоколад был деньгами у древних ацтеков.' },
            { i: '🐧', t: 'Пингвины предлагают камушек своей «второй половинке» вместо цветов.' },
            { i: '🐫', t: 'Верблюды могут не пить до двух недель.' },
            { i: '⛈️', t: 'Гром и молния происходят одновременно — просто свет быстрее звука.' },
            { i: '😴', t: 'Среднестатистический человек проводит около 25 лет жизни во сне.' },
            { i: '🍌', t: 'Банан — это ягода, а клубника — нет.' },
            { i: '🌳', t: 'Деревья общаются между собой через корни и грибы.' },
            { i: '👅', t: 'У всех людей уникальный отпечаток языка.' },
            { i: '💅', t: 'Ногти на руках растут в 4 раза быстрее, чем на ногах.' },
            { i: '🧸', t: 'Игрушечного мишку назвали в честь президента Теодора Рузвельта.' },
            { i: '❤️', t: 'Человеческое сердце бьётся около 100 000 раз в день.' }
        ];

        function loadFunFact(container) {
            const f = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
            if (f) container.innerHTML = '<div class="fun-fact"><div class="fun-fact-icon">' + f.i + '</div><div class="fun-fact-text">' + f.t + '</div></div>';
        }

        // --- ЗАГРУЗКА КАРТИНКИ ---
        function setupImageUpload() {
            const uploadZone = document.getElementById('uploadZone');
            const fileInput = document.getElementById('imageUpload');
            const editor = document.getElementById('newsEditor');

            uploadZone.addEventListener('click', function() {
                fileInput.click();
            });

            uploadZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.borderColor = '#facc15';
                this.style.background = '#fef9c3';
            });

            uploadZone.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.style.borderColor = '';
                this.style.background = '';
            });

            uploadZone.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.borderColor = '';
                this.style.background = '';
                if (e.dataTransfer.files.length > 0) {
                    uploadImage(e.dataTransfer.files[0]);
                }
            });

            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    uploadImage(this.files[0]);
                }
                this.value = '';
            });

            function uploadImage(file) {
                if (!file.type.startsWith('image/')) {
                    alert('Пожалуйста, выберите изображение');
                    return;
                }

                const formData = new FormData();
                formData.append('action', 'upload');
                formData.append('image', file);
                formData.append('pass', ADMIN_PASSWORD);

                fetch('news_editor.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.text())
                .then(text => {
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        alert('Ошибка сервера при загрузке картинки: ' + text.slice(0, 200));
                        return;
                    }
                    if (data.status === 'ok') {
                        const imgTag = `<img src="${data.url}" alt="Изображение">`;
                        const start = editor.selectionStart;
                        const end = editor.selectionEnd;
                        const text = editor.value;
                        editor.value = text.substring(0, start) + imgTag + text.substring(end);
                        editor.selectionStart = editor.selectionEnd = start + imgTag.length;
                        editor.focus();
                    } else {
                        alert('Ошибка загрузки: ' + (data.message || 'неизвестная'));
                    }
                })
                .catch(() => {
                    alert('Не удалось загрузить изображение');
                });
            }
        }

        // --- КОНТРОЛЬ ИМЕНИ В ЧАТЕ ---
        function checkName() {
            const nameInput = document.getElementById('chat-name');
            const sendBtn = document.getElementById('sendBtn');
            const errorEl = document.getElementById('chatNameError');
            const name = nameInput.value.trim();
            
            if (name !== '') {
                localStorage.setItem('chat_name', name);
            }
            
            if (name === '') {
                sendBtn.disabled = true;
                errorEl.classList.add('show');
            } else {
                sendBtn.disabled = false;
                errorEl.classList.remove('show');
            }
        }

        // --- СМАЙЛИКИ В ЧАТЕ ---
        const CHAT_SMILES = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😉','😎','🤩','🥳','😜','🤗','🤔','😐','😴','🤯','😱','😭','😤','🥺','😇','🙃','😅','😆','🤪','🧐','😏','😬','😷','🤒','🤑','🤠','👍','👎','👌','✌️','🤞','👏','🙏','💪','👀','🙌','🤝','💯','🔥','✅','❌','❤️','💖','💙','💚','🧡','💜','💛','⭐','🌟','⚡','🎉','🎊','😺','🙈','🐱','🦖','📞','💻','📱','🎮','🏆','☕','🍕','🚀','🌞','🌧️','❄️','⚽','🏀']

        function toggleSmiles() {
            const panel = document.getElementById('chatSmiles');
            if (!panel) return;
            if (panel.style.display === 'none') {
                if (!panel.innerHTML) buildSmilesPanel(panel);
                panel.style.display = 'grid';
            } else {
                panel.style.display = 'none';
            }
        }

        function buildSmilesPanel(panel) {
            panel.innerHTML = CHAT_SMILES.map(s => `<button type="button" onclick="addSmile('${s}')">${s}</button>`).join('');
        }

        function addSmile(s) {
            const input = document.getElementById('chat-text');
            if (!input) return;
            input.value += s;
            input.focus();
            document.getElementById('chatSmiles').style.display = 'none';
        }

        // --- ОБЩИЙ РЕНДЕР ---
        window.onload = function () {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('sw.js').catch(function () {});
            }

            if (!localStorage.getItem('init_done')) {
                localStorage.setItem('init_done', 'true');
                localStorage.setItem('projects', JSON.stringify({ wink: true, vizhu: true, start: false, edinaya: true, kasper: false }));
                localStorage.setItem('shift_time', "");
            }

            const now = new Date();
            calYear = now.getFullYear();
            calMonth = now.getMonth();

            document.getElementById('chat-name').addEventListener('input', checkName);
            document.getElementById('chat-name').addEventListener('blur', checkName);
            const savedName = localStorage.getItem('chat_name') || '';
            if (savedName) document.getElementById('chat-name').value = savedName;
            checkName();

            renderAllData();
            renderCalendar();
            renderStarsCalc();
            renderNews();
            loadMessages();
            setupImageUpload();
            loadProjectsFromServer();
            
            setInterval(updateShiftCountdown, 1000);
            updateShiftCountdown();
            initShiftSync();

            setInterval(loadMessages, 3000);
        };

        function renderAllData(serverProjs) {
            // Источник правды — сервер (data.php); localStorage — офлайн-fallback
            let projs = serverProjs;
            if (!projs) {
                projs = JSON.parse(localStorage.getItem('projects')) || {};
            }
            const projList = [
                { id: 'wink', name: 'Винк' },
                { id: 'vizhu', name: 'Вижу' },
                { id: 'start', name: 'Старт' },
                { id: 'edinaya', name: 'Единая' },
                { id: 'kasper', name: 'Каспер' }
            ];
            const projContainer = document.getElementById('projects-container');
            projContainer.innerHTML = "";
            projList.forEach(p => {
                if (!projs[p.id]) return;
                projContainer.innerHTML += `<div class="project-row"><span class="project-name">${p.name}</span><span class="project-status status-active">👍 Рекомендуем</span></div>`;
            });
            if (!projContainer.innerHTML) {
                projContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem; text-align:center;">Рекомендаций пока нет — включи проекты в админке</p>`;
            }
        }

        function loadProjectsFromServer() {
            fetch('data.php?t=' + Date.now(), { cache: 'no-store' })
                .then(r => {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(data => {
                    if (data && data.projects) {
                        // Сначала показываем с сервера
                        renderAllData(data.projects);
                        // Локально сохраняем только hide_factory (личная настройка) — остальное с сервера
                        const local = JSON.parse(localStorage.getItem('projects')) || {};
                        localStorage.setItem('projects', JSON.stringify({
                            wink: !!data.projects.wink,
                            vizhu: !!data.projects.vizhu,
                            start: !!data.projects.start,
                            edinaya: !!data.projects.edinaya,
                            kasper: !!data.projects.kasper,
                            hide_factory: local.hide_factory
                        }));
                    }
                })
                .catch(() => {
                    // сервер недоступен — используем локальные значения
                });
        }

        // --- СИНХРОНИЗАЦИЯ ВРЕМЕНИ ВЫХОДА (бегет — основной источник) ---
        function initShiftSync() {
            pollShiftTime();
            setInterval(pollShiftTime, 30000);
            setInterval(() => {
                const btn = document.getElementById('ask-time-btn');
                if (btn && btn.style.display !== 'none') refreshAskBtn();
            }, 30000);
        }

        function pollShiftTime() {
            fetch('shift_time.php?action=get&t=' + Date.now(), { cache: 'no-store' })
                .then(r => r.text())
                .then(txt => {
                    let serverTime = '';
                    let serverDate = '';
                    try {
                        const obj = JSON.parse((txt || '').trim());
                        serverTime = (obj.time || '').trim();
                        serverDate = (obj.date || '').trim();
                    } catch (e) {
                        serverTime = (txt || '').trim();
                    }
                    const cur = localStorage.getItem('shift_time') || "";
                    if (serverTime !== cur || serverDate !== (localStorage.getItem('shift_date') || "")) {
                        localStorage.setItem('shift_time', serverTime);
                        localStorage.setItem('shift_date', serverDate);
                        updateShiftCountdown();
                    }
                })
                .catch(() => {});
        }

        function updateShiftCountdown() {
            const t = localStorage.getItem('shift_time') || "";
            const d = localStorage.getItem('shift_date') || "";
            const infoEl = document.getElementById('shift-info');
            const valEl = document.getElementById('shift-countdown');
            const askBtn = document.getElementById('ask-time-btn');
            // Кнопка запроса времени видна ВСЕГДА (запрос на завтра)
            if (askBtn) {
                askBtn.style.display = '';
                refreshAskBtn();
            }
            if (!t) {
                infoEl.innerText = "⏳ Время не назначено — ждите информацию";
                valEl.innerText = "--:--:--";
                valEl.classList.remove('good', 'bad');
                return;
            }

            // Верная дата смены (из сервера) или сегодня
            let dateStr = '';
            if (d) {
                const dd = new Date(d + 'T00:00:00');
                if (!isNaN(dd)) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const diff = Math.round((dd - today) / 86400000);
                    const base = dd.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
                    dateStr = diff === 0 ? 'сегодня, ' + base : (diff === 1 ? 'завтра, ' + base : base);
                } else {
                    dateStr = d;
                }
            } else {
                dateStr = new Date().toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' });
            }

            infoEl.innerHTML = `<span style="color:#16a34a; font-weight:800;">🟢 Работаем с ${t}</span>`;
            valEl.innerText = dateStr;
            valEl.classList.remove('bad');
        }

        // Запрос времени через webapp GAS (без перехода в ТГ)
        const GAS_EXEC_URL = 'https://script.google.com/macros/s/AKfycbywp5QEgxmuVoDlQE2IjEIS4LgjrddnF2TjCEYubd_DSeSAQEwWWPtCBGbzot9QiJp4/exec';

        function askLabel() {
            const d = new Date(Date.now() + 86400000);
            return `⏰ Запросить время на ${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}`;
        }

        // Спросить у GAS статус: можно ли запрашивать или кто-то уже отправил
        function refreshAskBtn() {
            const btn = document.getElementById('ask-time-btn');
            if (!btn || btn.style.display === 'none') return;
            fetch(GAS_EXEC_URL + '?action=status', { cache: 'no-store' })
                .then(r => r.text())
                .then(txt => {
                    const rem = parseInt(txt, 10) || 0;
                    if (rem > 0) {
                        btn.disabled = true;
                        btn.innerText = '✅ Запрос отправлен руководителям, ждите';
                    } else {
                        btn.disabled = false;
                        btn.innerText = askLabel();
                    }
                })
                .catch(() => {});
        }

        function askTimeViaGAS() {
            const btn = document.getElementById('ask-time-btn');
            if (btn && btn.disabled) return;
            if (btn) { btn.disabled = true; btn.innerText = '📨 Отправляем...'; }
            fetch(GAS_EXEC_URL + '?action=ask', { cache: 'no-store' })
                .then(r => r.text())
                .then(txt => {
                    if (btn) {
                        btn.disabled = true;
                        btn.innerText = '✅ Запрос отправлен руководителям, ждите';
                    }
                })
                .catch(() => {
                    if (btn) { btn.disabled = false; btn.innerText = '❌ Ошибка, попробуйте позже'; }
                    setTimeout(refreshAskBtn, 3000);
                });
        }

        function resetAskCooldown() {
            fetch(GAS_EXEC_URL + '?action=reset', { cache: 'no-store' })
                .then(r => r.text())
                .then(txt => {
                    alert('✅ Кулдаун сброшен — кнопка снова активна');
                    refreshAskBtn();
                })
                .catch(() => alert('❌ Ошибка сброса'));
        }

        function startShiftTimers(startHour, btn) {
            activeIntervals.forEach(id => clearInterval(id));
            activeIntervals = [];

            document.querySelectorAll('.shift-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const container = document.getElementById('timers-list');
            container.innerHTML = "";

            const events = breakRules[startHour];
            events.forEach((ev, index) => {
                const boxId = `ev-timer-${index}`;
                const box = document.createElement('div');
                box.className = 'timer-box';
                box.innerHTML = `<span>${ev.name} (${ev.h.toString().padStart(2, '0')}:${ev.m.toString().padStart(2, '0')}):</span><span id="${boxId}" class="timer-val">--:--:--</span>`;
                container.appendChild(box);

                function tick() {
                    const now = new Date();
                    const target = new Date();
                    target.setHours(ev.h, ev.m, 0, 0);
                    const diff = target - now;

                    if (diff <= 0) {
                        box.style.display = 'none';
                        return;
                    }

                    const hrs = Math.floor(diff / 1000 / 60 / 60);
                    const mins = Math.floor((diff / 1000 / 60) % 60);
                    const secs = Math.floor((diff / 1000) % 60);
                    document.getElementById(boxId).innerText =
                        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }

                tick();
                activeIntervals.push(setInterval(tick, 1000));
            });
        }

        // --- PHP ЧАТ ---
        function loadMessages() {
            const chatBox = document.getElementById('chat-box');
            const statusEl = document.getElementById('chatStatus');
            
            fetch('chat.php?action=get')
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'ok') {
                        currentMessages = data.messages || [];
                        renderChatMessages(currentMessages);
                        statusEl.textContent = '🟢 Онлайн';
                        statusEl.className = 'chat-status-text online';
                    } else {
                        chatBox.innerHTML = '<div class="chat-msg system">❌ Ошибка загрузки чата</div>';
                        statusEl.textContent = '🔴 Офлайн';
                        statusEl.className = 'chat-status-text offline';
                    }
                })
                .catch(() => {
                    chatBox.innerHTML = '<div class="chat-msg system">❌ Не удалось подключиться к серверу</div>';
                    statusEl.textContent = '🔴 Офлайн';
                    statusEl.className = 'chat-status-text offline';
                });
        }

        function renderChatMessages(messages) {
            const chatBox = document.getElementById('chat-box');
            
            if (!messages || messages.length === 0) {
                chatBox.innerHTML = '<div class="chat-msg system">💬 В чате пока пусто. Напишите первое сообщение!</div>';
                return;
            }
            
            chatBox.innerHTML = "";
            messages.forEach((msg, index) => {
                if (!msg || !msg.name || !msg.text) return;
                const msgDiv = document.createElement('div');
                msgDiv.className = 'chat-msg';
                
                const textSpan = document.createElement('span');
                textSpan.className = 'msg-text';
                textSpan.innerHTML = `<span class="msg-author">${escapeHtml(msg.name)}</span> <span>${escapeHtml(msg.text)}</span><span class="msg-time">${escapeHtml(msg.time || '')}</span>`;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'msg-delete-btn';
                if (!isAdmin) {
                    deleteBtn.classList.add('hidden');
                }
                deleteBtn.textContent = '✕';
                deleteBtn.title = 'Удалить сообщение (только для админа)';
                deleteBtn.onclick = function(e) {
                    e.stopPropagation();
                    if (!isAdmin) {
                        alert('❌ Только администратор может удалять сообщения!');
                        return;
                    }
                    if (confirm('Удалить это сообщение?')) {
                        deleteMessage(index);
                    }
                };
                
                msgDiv.appendChild(textSpan);
                msgDiv.appendChild(deleteBtn);
                chatBox.appendChild(msgDiv);
            });
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function deleteMessage(index) {
            if (!isAdmin) {
                alert('❌ Только администратор может удалять сообщения!');
                return;
            }
            if (!currentMessages || index >= currentMessages.length) return;
            
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('index', index);
            formData.append('pass', ADMIN_PASSWORD);
            
            fetch('chat.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    loadMessages();
                } else {
                    alert('❌ Ошибка удаления: ' + (data.message || 'неизвестная'));
                }
            })
            .catch(() => {
                alert('❌ Не удалось удалить сообщение');
            });
        }

        function clearAllChat() {
            if (!isAdmin) {
                alert('❌ Только администратор может очищать чат!');
                return;
            }
            if (!confirm('⚠️ Вы уверены, что хотите удалить ВСЕ сообщения в чате?')) return;
            
            const formData = new FormData();
            formData.append('action', 'clear_all');
            formData.append('pass', ADMIN_PASSWORD);
            
            fetch('chat.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    alert('✅ Чат очищен!');
                    loadMessages();
                } else {
                    alert('❌ Ошибка: ' + (data.message || 'неизвестная'));
                }
            })
            .catch(() => {
                alert('❌ Не удалось очистить чат');
            });
        }

        function clearLeaderboard() {
            if (!isAdmin) {
                alert('❌ Только администратор может очищать таблицу лидеров!');
                return;
            }
            if (!confirm('⚠️ Вы уверены, что хотите удалить ВСЕ рекорды игр?')) return;

            const formData = new FormData();
            formData.append('action', 'clear');
            formData.append('pass', ADMIN_PASSWORD);

            fetch('leaderboard.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    alert('✅ Таблица лидеров очищена!');
                    loadLeaderboard('runner');
                    loadLeaderboard('doom');
                    loadLeaderboard('factory');
                    loadLeaderboard('clicker');
                } else {
                    alert('❌ Ошибка: ' + (data.message || 'неизвестная'));
                }
            })
            .catch(() => {
                alert('❌ Не удалось очистить таблицу лидеров');
            });
        }

        function sendMessage() {
            const nameInput = document.getElementById('chat-name');
            const textInput = document.getElementById('chat-text');
            const name = nameInput.value.trim();
            const text = textInput.value.trim();
            
            if (!name) {
                document.getElementById('chatNameError').classList.add('show');
                nameInput.focus();
                return;
            }
            
            if (!text) {
                textInput.focus();
                return;
            }

            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const formData = new FormData();
            formData.append('action', 'send');
            formData.append('name', name);
            formData.append('text', text);
            formData.append('time', timeStr);

            fetch('chat.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    textInput.value = "";
                    textInput.focus();
                    loadMessages();
                    document.getElementById('chatStatus').textContent = '✅ Отправлено!';
                    setTimeout(() => {
                        document.getElementById('chatStatus').textContent = '🟢 Онлайн';
                        document.getElementById('chatStatus').className = 'chat-status-text online';
                    }, 2000);
                } else {
                    alert('❌ Ошибка отправки: ' + (data.message || 'неизвестная'));
                }
            })
            .catch(() => {
                alert('❌ Не удалось отправить сообщение');
            });
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // ============================================================
        // АДМИНКА
        // ============================================================

        function checkAdminPassword() {
            const pass = prompt("Введите пароль администратора:");
            
            if (pass === ADMIN_PASSWORD) {
                isAdmin = true;
                openAdminPanel();
                loadMessages();
            } else if (pass !== null) {
                alert("❌ Неверный пароль!");
                isAdmin = false;
            }
        }

        function openAdminPanel() {
            const projs = JSON.parse(localStorage.getItem('projects')) || {};
            document.getElementById('p-wink').checked = !!projs.wink;
            document.getElementById('p-vizhu').checked = !!projs.vizhu;
            document.getElementById('p-start').checked = !!projs.start;
            document.getElementById('p-edinaya').checked = !!projs.edinaya;
            document.getElementById('p-kasper').checked = !!projs.kasper;
            document.getElementById('p-hide-factory').checked = !!projs.hide_factory;

            const shiftTime = localStorage.getItem('shift_time') || "";
            const select = document.getElementById('admin-shift-time');
            select.value = ["", "07:00", "08:00", "09:00"].includes(shiftTime) ? shiftTime : "";

            // Загружаем новости в редактор
            fetch('news_editor.php?action=get')
                .then(response => response.text())
                .then(html => {
                    document.getElementById('newsEditor').value = html;
                })
                .catch(() => {
                    document.getElementById('newsEditor').value = '';
                });

            document.getElementById('adminModal').style.display = 'flex';
        }

        // Очистить новости: очищает поле и сразу сохраняет пустоту
        function clearNews() {
            if (!confirm('Удалить все новости?')) return;
            const editor = document.getElementById('newsEditor');
            editor.value = '';
            const formData = new FormData();
            formData.append('action', 'save');
            formData.append('content', '');
            formData.append('pass', ADMIN_PASSWORD);
            fetch('news_editor.php', { method: 'POST', body: formData })
                .then(response => response.json())
                .then(data => {
                    alert(data.status === 'ok' ? '✅ Новости очищены' : '⚠️ Ошибка: ' + (data.message || 'неизвестная'));
                    renderNews();
                })
                .catch(() => alert('❌ Ошибка при очистке новостей'));
        }

        function saveAdminParams() {
            // Сначала сохраняем локальные настройки — они не должны зависеть от новостей
            const projs = {
                wink: document.getElementById('p-wink').checked,
                vizhu: document.getElementById('p-vizhu').checked,
                start: document.getElementById('p-start').checked,
                edinaya: document.getElementById('p-edinaya').checked,
                kasper: document.getElementById('p-kasper').checked,
                hide_factory: document.getElementById('p-hide-factory').checked
            };
            localStorage.setItem('projects', JSON.stringify(projs));
            localStorage.setItem('shift_time', document.getElementById('admin-shift-time').value);

            // Сохраняем проекты на сервер, чтобы их видели все устройства
            fetch('data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projects: projs })
            })
            .then(() => loadProjectsFromServer())
            .catch(() => {});

            // Отправляем время выхода на сервер (видно всем и ТГ-боту)
            const shiftForm = new FormData();
            shiftForm.append('action', 'set');
            shiftForm.append('time', document.getElementById('admin-shift-time').value);
            const nowD = new Date();
            shiftForm.append('date', `${nowD.getFullYear()}-${(nowD.getMonth()+1).toString().padStart(2,'0')}-${nowD.getDate().toString().padStart(2,'0')}`);
            fetch('shift_time.php', { method: 'POST', body: shiftForm }).catch(() => {});

            // Затем сохраняем новости
            const content = document.getElementById('newsEditor').value;
            const formData = new FormData();
            formData.append('action', 'save');
            formData.append('content', content);
            formData.append('pass', ADMIN_PASSWORD);

            fetch('news_editor.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok') {
                    alert("✅ Все параметры сохранены!");
                    closeAdminPanel();
                    renderAllData();
                    renderNews();
                    updateShiftCountdown();
                } else {
                    alert('⚠️ Настройки сохранены, но не сохранились новости: ' + (data.message || 'неизвестная'));
                }
            })
            .catch(() => {
                alert('⚠️ Настройки сохранены, но не удалось сохранить новости (проверьте подключение)');
            });
        }

        function closeAdminPanel() {
            document.getElementById('adminModal').style.display = 'none';
            isAdmin = false;
            loadMessages();
        }

        // Выход из админки
        window.resetAdmin = function() {
            isAdmin = false;
            loadMessages();
            alert('🔒 Режим администратора отключён');
        };

        // ============================================================
        // ИГРА «Т-РЕКС: ОБЗВОН» (клон Chrome Dino, форк wayou, тема колл-центра)
        // ============================================================
        const gameCanvas = document.getElementById('gameCanvas');
        const gctx = gameCanvas.getContext('2d');
        let gameRunning = false;
        let gameOver = false;
        let gameScore = 0;
        let gameSpeed = 4;
        let gameGravity = 0.5;
        let gameJumpV = -9;
        let player = {};
        let obstacles = [];
        let bonuses = [];
        let gameRAF = null;
        let shieldActive = false;
        let slowActive = false;
        let shieldTimer = 0;
        let slowTimer = 0;
        let nightMode = false;
        let nightTimer = 0;
        let gameDistance = 0;
        let rexSpawnTimer = 0;
        let flashTimer = 0;

        const GAME_KEY = 'game_best_score';

        const BONUS_TYPES = [
            { icon: '⭐', label: '+5', effect: 'points', value: 5 },
            { icon: '💎', label: '+10', effect: 'points', value: 10 },
            { icon: '🛡️', label: 'Щит', effect: 'shield' },
            { icon: '🐢', label: 'Замедл.', effect: 'slow' }
        ];

        const OBJ_TEXTS = ['Дорого', 'Подумаю', 'Не надо', 'Занят', 'Перезвоните', 'Не интересно', 'Уже есть', 'Только спросил', 'Возражение'];

        function getGameBest() {
            return Number(localStorage.getItem(GAME_KEY) || 0);
        }

        function startGameLoop() {
            gameOver = false;
            gameScore = 0;
            gameDistance = 0;
            gameSpeed = 4;
            nightMode = false;
            nightTimer = 0;
            rexSpawnTimer = 30;
            flashTimer = 0;
            player = { x: 60, y: 210 - 52, w: 34, h: 52, vy: 0, onGround: true, jumps: 0 };
            obstacles = [];
            bonuses = [];
            shieldActive = false;
            slowActive = false;
            shieldTimer = 0;
            slowTimer = 0;
            document.getElementById('game-score').textContent = '0';
            document.getElementById('game-result').style.display = 'none';
            gameRunning = true;
            gameRAF = requestAnimationFrame(gameTick);
            fetchLBToken('runner');
        }

        function gameJump() {
            if (!gameRunning) { if (gameOver) startGameLoop(); return; }
            if (gameOver) return;
            if (player.onGround) {
                player.vy = gameJumpV;
                player.onGround = false;
                player.jumps = 1;
            } else if (player.jumps < 2) {
                // Двойной прыжок: повторный тап в воздухе
                player.vy = gameJumpV * 0.85;
                player.jumps = 2;
            }
            player.h = 52;
        }

        function gameTick() {
            if (!gameRunning) return;

            const groundY = 210;
            const W = 600, H = 260;

            // Дистанция и скорость (растёт как в динозаврике)
            gameDistance++;
            gameSpeed = Math.min(13, 4 + Math.floor(gameDistance / 180));
            gameScore = Math.floor(gameDistance / 8);
            document.getElementById('game-score').textContent = gameScore;

            // Цикл день/ночь
            nightTimer++;
            if (nightTimer > 1500) { nightTimer = 0; nightMode = !nightMode; }

            // Физика игрока
            player.vy += gameGravity;
            player.y += player.vy;
            if (player.y >= groundY - player.h) {
                player.y = groundY - player.h;
                player.vy = 0;
                player.onGround = true;
                player.jumps = 0;
            } else {
                player.onGround = false;
            }
            if (player.y < 0) {
                player.y = 0;
                player.vy = 0;
            }

            // Спавн препятствий
            rexSpawnTimer--;
            const minGap = 110;
            const lastObs = obstacles[obstacles.length - 1];
            if (rexSpawnTimer <= 0 && (!lastObs || W + 20 - lastObs.x >= minGap)) {
                const h = 28 + Math.random() * 42;
                const w = 34 + Math.random() * 10;
                obstacles.push({ x: W + 20, y: groundY - h, w: w, h: h, passed: false, txt: OBJ_TEXTS[Math.floor(Math.random() * OBJ_TEXTS.length)], fly: false });
                rexSpawnTimer = Math.max(14, Math.round(40 - gameSpeed));
            }

            // Спавн бонусов
            if (Math.random() < 0.006) {
                const btype = BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)];
                bonuses.push({ x: W + 20, y: groundY - 70 - Math.random() * 60, r: 14, type: btype });
            }

            // Движение препятствий
            const spd = slowActive ? gameSpeed * 0.55 : gameSpeed;
            obstacles.forEach(o => {
                o.x -= spd;
                if (!o.passed && o.x + o.w < player.x) {
                    o.passed = true;
                    gameScore += 2;
                    document.getElementById('game-score').textContent = gameScore;
                }
            });
            obstacles = obstacles.filter(o => o.x > -30);

            bonuses.forEach(b => { b.x -= spd; });
            bonuses = bonuses.filter(b => b.x > -30);

            // Подбор бонусов
            bonuses.forEach(b => {
                const dx = (player.x + player.w / 2) - b.x;
                const dy = (player.y + player.h / 2) - b.y;
                if (dx * dx + dy * dy < (player.w / 2 + b.r) * (player.w / 2 + b.r)) {
                    b.collected = true;
                    if (b.type.effect === 'points') {
                        gameScore += b.type.value;
                        document.getElementById('game-score').textContent = gameScore;
                    } else if (b.type.effect === 'shield') {
                        shieldActive = true;
                        shieldTimer = 500;
                    } else if (b.type.effect === 'slow') {
                        slowActive = true;
                        slowTimer = 400;
                    }
                }
            });
            bonuses = bonuses.filter(b => !b.collected);

            if (shieldActive) { shieldTimer--; if (shieldTimer <= 0) shieldActive = false; }
            if (slowActive) { slowTimer--; if (slowTimer <= 0) slowActive = false; }

            // Коллизия
            let hit = false;
            obstacles.forEach(o => {
                let hx = o.x, hw = o.w, hy = o.y, hh = o.h;
                if (o.fly) {
                    // летящая: приседание снижает корпус — под низом можно проскочить
                    hx = o.x + 6; hw = o.w - 12;
                } else {
                    // корпус трубки: только нижние ~20px, центр ±12
                    hh = Math.min(o.h, 20);
                    hy = o.y + o.h - hh;
                    hx = o.x + o.w / 2 - 12;
                    hw = 24;
                }
                if (player.x < hx + hw && player.x + player.w > hx &&
                    player.y < hy + hh && player.y + player.h > hy) {
                    hit = true;
                }
            });

            if (hit && shieldActive) {
                hit = false;
                shieldActive = false;
            }

            if (hit) {
                gameOver = true;
                gameRunning = false;
                cancelAnimationFrame(gameRAF);
                flashTimer = 6;
                finishGame();
                return;
            }

            drawGame();
            gameRAF = requestAnimationFrame(gameTick);
        }

        function drawGame() {
            const W = 600, H = 260, groundY = 210;
            gctx.clearRect(0, 0, W, H);

            // Небо (день/ночь)
            if (nightMode) {
                gctx.fillStyle = '#0f172a';
                gctx.fillRect(0, 0, W, groundY);
                gctx.fillStyle = '#e2e8f0';
                gctx.beginPath();
                gctx.arc(540, 34, 18, 0, Math.PI * 2);
                gctx.fill();
                gctx.fillStyle = '#475569';
                for (let i = 0; i < 16; i++) {
                    const sx = (i * 83 + 41) % W;
                    const sy = (i * 47 + 7) % 70;
                    gctx.fillRect(sx, sy, 2, 2);
                }
            } else {
                const sky = gctx.createLinearGradient(0, 0, 0, groundY);
                sky.addColorStop(0, '#38bdf8');
                sky.addColorStop(1, '#e0f2fe');
                gctx.fillStyle = sky;
                gctx.fillRect(0, 0, W, groundY);
                gctx.fillStyle = '#fde047';
                gctx.beginPath();
                gctx.arc(540, 34, 18, 0, Math.PI * 2);
                gctx.fill();
            }

            // Облака
            const cloudOffset = (Date.now() / 40) % (W + 160);
            gctx.fillStyle = nightMode ? '#1e293b' : '#ffffff';
            gctx.beginPath();
            gctx.arc(cloudOffset - 100, 44, 12, 0, Math.PI * 2);
            gctx.arc(cloudOffset - 84, 36, 15, 0, Math.PI * 2);
            gctx.arc(cloudOffset - 64, 44, 11, 0, Math.PI * 2);
            gctx.fill();

            // Пол (в офис — плитка-графика: дорожка с ковролином)
            gctx.fillStyle = nightMode ? '#1e293b' : '#4ade80';
            gctx.fillRect(0, groundY, W, H - groundY);
            gctx.strokeStyle = nightMode ? '#334155' : '#16a34a';
            gctx.lineWidth = 3;
            gctx.beginPath();
            gctx.moveTo(0, groundY);
            gctx.lineTo(W, groundY);
            gctx.stroke();
            // Бегущая линия «ленты конвейера звонков»
            gctx.strokeStyle = nightMode ? '#475569' : '#86efac';
            gctx.lineWidth = 2;
            gctx.beginPath();
            const lineOff = (Date.now() / 10) % 60;
            for (let x = -lineOff; x < W + 60; x += 60) {
                gctx.moveTo(x, groundY + 18);
                gctx.lineTo(x + 30, groundY + 18);
            }
            gctx.stroke();

            // Препятствия
            obstacles.forEach(o => {
                if (o.fly) drawFlyingObjection(o);
                else drawHandsetObstacle(o);
            });

            // Бонусы
            bonuses.forEach(b => {
                const bob = Math.sin(Date.now() / 200 + b.x) * 4;
                const bx = b.x, by = b.y + bob;
                gctx.save();
                gctx.shadowColor = '#fde047';
                gctx.shadowBlur = 12;
                gctx.fillStyle = '#ffffff';
                gctx.beginPath();
                gctx.arc(bx, by, b.r, 0, Math.PI * 2);
                gctx.fill();
                gctx.restore();
                gctx.font = '18px sans-serif';
                gctx.textAlign = 'center';
                gctx.textBaseline = 'middle';
                gctx.fillText(b.type.icon, bx, by);
                gctx.textBaseline = 'alphabetic';
            });

            if (shieldActive) {
                gctx.strokeStyle = '#22d3ee';
                gctx.lineWidth = 3;
                gctx.beginPath();
                gctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2);
                gctx.stroke();
            }

            if (slowActive) {
                gctx.font = 'bold 10px sans-serif';
                gctx.textAlign = 'center';
                gctx.fillStyle = nightMode ? '#e2e8f0' : '#0f172a';
                gctx.fillText('🐢 замедление', player.x + player.w / 2, player.y - 8);
            }

            drawPlayer();
        }

        function drawHandsetObstacle(o) {
            const cx = o.x + o.w / 2;
            const bottom = o.y + o.h;

            gctx.save();
            gctx.translate(cx, bottom);
            gctx.rotate(-0.6);

            gctx.strokeStyle = '#374151';
            gctx.lineWidth = 2;
            gctx.beginPath();
            gctx.moveTo(0, 2);
            gctx.quadraticCurveTo(6, 12, -2, 14);
            gctx.stroke();

            gctx.strokeStyle = '#dc2626';
            gctx.lineWidth = 12;
            gctx.lineCap = 'round';
            gctx.beginPath();
            gctx.moveTo(-14, 0);
            gctx.quadraticCurveTo(0, -16, 14, 0);
            gctx.stroke();
            gctx.lineCap = 'butt';

            gctx.fillStyle = '#7f1d1d';
            gctx.beginPath();
            gctx.arc(-13, -4, 6, 0, Math.PI * 2);
            gctx.fill();
            gctx.beginPath();
            gctx.arc(13, 2, 6, 0, Math.PI * 2);
            gctx.fill();
            gctx.fillStyle = '#ef4444';
            gctx.beginPath();
            gctx.arc(-6, -9, 3, 0, Math.PI * 2);
            gctx.fill();
            gctx.restore();

            const bw = 36 + Math.max(0, o.txt.length) * 3.4;
            const bx = cx;
            const by = o.y - 16;
            gctx.fillStyle = '#ffffff';
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 2;
            gctx.beginPath();
            gctx.moveTo(bx - bw / 2 + 6, by);
            gctx.lineTo(bx + bw / 2 - 6, by);
            gctx.quadraticCurveTo(bx + bw / 2, by, bx + bw / 2, by + 6);
            gctx.lineTo(bx + bw / 2, by + 8);
            gctx.quadraticCurveTo(bx + bw / 2, by + 14, bx + bw / 2 - 6, by + 14);
            gctx.lineTo(bx - bw / 2 + 6, by + 14);
            gctx.quadraticCurveTo(bx - bw / 2, by + 14, bx - bw / 2, by + 8);
            gctx.lineTo(bx - bw / 2, by + 6);
            gctx.quadraticCurveTo(bx - bw / 2, by, bx - bw / 2 + 6, by);
            gctx.closePath();
            gctx.fill();
            gctx.stroke();
            gctx.beginPath();
            gctx.moveTo(cx - 4, by + 14);
            gctx.lineTo(cx, by + 21);
            gctx.lineTo(cx + 5, by + 14);
            gctx.fillStyle = '#ffffff';
            gctx.fill();
            gctx.stroke();
            gctx.font = 'bold 9px sans-serif';
            gctx.textAlign = 'center';
            gctx.textBaseline = 'middle';
            gctx.lineJoin = 'round';
            gctx.strokeStyle = '#ffffff';
            gctx.lineWidth = 3;
            gctx.strokeText(o.txt, bx, by + 8);
            gctx.fillStyle = '#111827';
            gctx.fillText(o.txt, bx, by + 8);
            gctx.textBaseline = 'alphabetic';
        }

        function drawFlyingObjection(o) {
            const cx = o.x + o.w / 2;
            const cy = o.y + o.h / 2;
            const flap = Math.sin(Date.now() / 120 + o.x) * 5;

            // Крылья (машут)
            gctx.fillStyle = nightMode ? '#94a3b8' : '#cbd5e1';
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1.5;
            gctx.beginPath();
            gctx.moveTo(cx - 10, cy);
            gctx.lineTo(cx - 30, cy - 6 - flap);
            gctx.lineTo(cx - 10, cy + 4);
            gctx.fill();
            gctx.stroke();
            gctx.beginPath();
            gctx.moveTo(cx + 10, cy);
            gctx.lineTo(cx + 30, cy - 6 + flap);
            gctx.lineTo(cx + 10, cy + 4);
            gctx.fill();
            gctx.stroke();

            // Тело-облачко с возражением
            const bw = 46;
            gctx.fillStyle = '#ffffff';
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 2;
            gctx.beginPath();
            gctx.arc(cx, cy, 16, 0, Math.PI * 2);
            gctx.fill();
            gctx.stroke();
            gctx.font = 'bold 9px sans-serif';
            gctx.textAlign = 'center';
            gctx.textBaseline = 'middle';
            gctx.lineJoin = 'round';
            gctx.strokeStyle = '#ffffff';
            gctx.lineWidth = 3;
            gctx.strokeText(o.txt.length > 9 ? o.txt.slice(0, 8) : o.txt, cx, cy);
            gctx.fillStyle = '#111827';
            gctx.fillText(o.txt.length > 9 ? o.txt.slice(0, 8) : o.txt, cx, cy);
            gctx.textBaseline = 'alphabetic';
        }

        function drawPlayer() {
            const px = player.x, py = player.y, w = player.w, h = player.h;
            const runPhase = (Date.now() / 90) % 2;

            // Ноги
            gctx.fillStyle = '#1e3a8a';
            if (runPhase < 1) {
                gctx.fillRect(px + 4, py + h - 12, 10, 12);
                gctx.fillRect(px + w - 12, py + h - 10, 10, 10);
            } else {
                gctx.fillRect(px + 4, py + h - 10, 10, 10);
                gctx.fillRect(px + w - 12, py + h - 12, 10, 12);
            }
            gctx.fillStyle = '#ffffff';
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1;
            gctx.fillRect(px + 2, py + h - 4, 13, 4);
            gctx.fillRect(px + w - 13, py + h - 4, 13, 4);

            // Тело — жёлто-чёрная футболка
            const torsoTop = py + 14;
            const torsoH = h - 26;
            gctx.fillStyle = '#facc15';
            gctx.fillRect(px + 3, torsoTop, w - 6, torsoH);
            gctx.fillStyle = '#111827';
            gctx.fillRect(px + 3, torsoTop + torsoH / 2 - 3, w - 6, 6);
            gctx.fillRect(px + 1, torsoTop, w - 2, 5);
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1.5;
            gctx.strokeRect(px + 3, torsoTop, w - 6, torsoH);

            // Руки
            gctx.fillStyle = '#fdba74';
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1;
            if (runPhase < 1) {
                gctx.fillRect(px - 1, py + 16, 6, 14);
                gctx.fillRect(px + w - 5, py + 18, 6, 12);
            } else {
                gctx.fillRect(px - 1, py + 18, 6, 12);
                gctx.fillRect(px + w - 5, py + 16, 6, 14);
            }

            // Шея
            gctx.fillStyle = '#fdba74';
            gctx.strokeStyle = '#111827';
            gctx.fillRect(px + w / 2 - 3, py + 8, 6, 7);
            gctx.strokeRect(px + w / 2 - 3, py + 8, 6, 7);

            // Голова
            const headCy = py + 6;
            gctx.fillStyle = '#fcd34d';
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1.5;
            gctx.beginPath();
            gctx.arc(px + w / 2, headCy, 10, 0, Math.PI * 2);
            gctx.fill();
            gctx.stroke();

            gctx.fillStyle = '#111827';
            gctx.beginPath();
            gctx.arc(px + w / 2, headCy - 2, 10, Math.PI, 0);
            gctx.fill();

            gctx.fillStyle = '#ffffff';
            gctx.beginPath();
            gctx.arc(px + w / 2 - 4, headCy, 2.6, 0, Math.PI * 2);
            gctx.arc(px + w / 2 + 4, headCy, 2.6, 0, Math.PI * 2);
            gctx.fill();
            gctx.fillStyle = '#111827';
            gctx.beginPath();
            gctx.arc(px + w / 2 - 4, headCy, 1.4, 0, Math.PI * 2);
            gctx.arc(px + w / 2 + 4, headCy, 1.4, 0, Math.PI * 2);
            gctx.fill();

            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1.5;
            gctx.beginPath();
            gctx.arc(px + w / 2, headCy + 3, 4, 0.15 * Math.PI, 0.85 * Math.PI);
            gctx.stroke();

            // Наушники
            gctx.strokeStyle = '#7c3aed';
            gctx.lineWidth = 4;
            gctx.beginPath();
            gctx.arc(px + w / 2, headCy, 14, Math.PI, 0);
            gctx.stroke();
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1;
            gctx.beginPath();
            gctx.arc(px + w / 2, headCy, 14, Math.PI, 0);
            gctx.stroke();

            gctx.fillStyle = '#7c3aed';
            gctx.strokeStyle = '#111827';
            gctx.lineWidth = 1;
            gctx.fillRect(px + w / 2 - 18, headCy - 4, 7, 9);
            gctx.strokeRect(px + w / 2 - 18, headCy - 4, 7, 9);
            gctx.fillRect(px + w / 2 + 11, headCy - 4, 7, 9);
            gctx.strokeRect(px + w / 2 + 11, headCy - 4, 7, 9);
            gctx.fillStyle = '#a78bfa';
            gctx.fillRect(px + w / 2 - 18, headCy - 4, 3, 9);
            gctx.fillRect(px + w / 2 + 14, headCy - 4, 3, 9);

            gctx.fillStyle = '#7c3aed';
            gctx.font = 'bold 11px sans-serif';
            gctx.textAlign = 'center';
            gctx.fillText('🎵', px + w / 2 + 16, headCy - 2);
        }

        function finishGame() {
            const score = gameScore;
            document.getElementById('game-final-score').textContent = score;
            document.getElementById('game-result').style.display = 'block';
            const best = getGameBest();
            if (score > best) {
                localStorage.setItem(GAME_KEY, String(score));
                document.getElementById('game-record').textContent = score;
            }
            autoSaveScore(score, 'runner');
        }

        // Управление: тап — прыжок, повторный тап в воздухе — двойной прыжок
        gameCanvas.addEventListener('pointerdown', function(e) {
            e.preventDefault();
            if (gameOver) startGameLoop();
            else gameJump();
        });
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space' || e.key === ' ') {
                const modal = document.getElementById('gameModal');
                if (!modal || modal.style.display === 'none') return;
                const t = document.activeElement;
                if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
                if (currentGame === 'runner') { e.preventDefault(); gameJump(); }
            }
        });

        // ============================================================
        // ЛАУНЧЕР ИГР
        // ============================================================
        let currentGame = 'runner';

        function launchGame(game) {
            currentGame = game;
            stopAllGames();
            ['runner', 'doom', 'darkroom', 'factory', 'clicker'].forEach(g => {
                const el = document.getElementById('panel-' + g);
                if (el) el.style.display = (g === game) ? '' : 'none';
            });
            if (game === 'runner') {
                document.getElementById('lb-title').textContent = '🏆 Таблица лидеров (Обзвон-забег)';
                document.getElementById('game-record').textContent = getGameBest();
                loadLeaderboard('runner');
                startGameLoop();
            } else if (game === 'doom') {
                document.getElementById('lb-title').textContent = '🏆 Таблица лидеров (Отбить возражения)';
                loadLeaderboard('doom');
                startDoom();
            } else if (game === 'darkroom' || game === 'factory') {
                document.getElementById('lb-title').textContent = '🏆 Таблица лидеров (Фабрика обзвона)';
                loadLeaderboard('factory');
                initFactory();
            } else if (game === 'clicker') {
                document.getElementById('lb-title').textContent = '🏆 Таблица лидеров (Кликер)';
                loadLeaderboard('clicker');
                initClicker();
            }
        }

        function openGame() {
            const projs = JSON.parse(localStorage.getItem('projects')) || {};
            const btn = document.getElementById('launcher-factory');
            if (btn) btn.style.display = projs.hide_factory ? 'none' : '';
            if (projs.hide_factory && currentGame === 'factory') currentGame = 'runner';
            document.getElementById('gameModal').style.display = 'flex';
            launchGame(currentGame);
        }

        function closeGame() {
            const content = document.getElementById('gameModalContent');
            if (content) content.classList.remove('game-fs');
            document.body.classList.remove('game-fs-on');
            document.getElementById('gameModal').style.display = 'none';
            stopAllGames();
            drStop();
        }

        function toggleGameFullscreen() {
            const content = document.getElementById('gameModalContent');
            const btn = document.getElementById('gameFsBtn');
            const on = content.classList.toggle('game-fs');
            document.body.classList.toggle('game-fs-on', on);
            if (btn) btn.textContent = on ? '🗕 Свернуть' : '⛶ Развернуть';
        }

        function stopAllGames() {
            gameRunning = false;
            if (gameRAF) cancelAnimationFrame(gameRAF);
            doomRunning = false;
            if (doomRAF) cancelAnimationFrame(doomRAF);
            dMouse.down = false;
            dTouchFire = false;
            dMoveTouch = { x: 0, y: 0 };
            dKeys = {};
        }

        // ============================================================
        // ИГРА «DOOM: ВОЗРАЖЕНИЯ» (вид сверху, 2D, как Doom 1993)
        // ============================================================
        const doomCanvas = document.getElementById('doomCanvas');
        const dctx = doomCanvas.getContext('2d');
        const DOOM_KEY = 'doom_best_score';
        let doomRunning = false;
        let doomRAF = null;
        let doomScore = 0;
        let doomWave = 1;
        let doomHp = 100;
        let doomAmmo = 40;
        let dPlayer = { x: 80, y: 80, vx: 0, vy: 0, facing: 0 };
        let dBullets = [];
        let dDemons = [];
        let dPickups = [];
        let dKeys = {};
        let dMouse = { x: 0, y: 0, down: false };
        let dSpawnTimer = 0;
        let dFireCd = 0;
        let dAmmoSpawnTimer = 400;
        let dMoveTouch = { x: 0, y: 0 };
        let dTouchFire = false;

        // Карта: 0 — пол, 1 — стена. Офисный «лабиринт» с кабинками.
        const DOOM_MAP = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1],
            [1,0,1,1,0,0,1,0,1,1,1,0,1,0,1,1,1,0,0,1],
            [1,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1],
            [1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,0,1],
            [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1],
            [1,0,1,0,1,0,1,1,0,1,1,1,0,1,1,0,1,0,0,1],
            [1,0,1,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1],
            [1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        const DOOM_CELL = 30;
        const DOOM_W = DOOM_MAP[0].length * DOOM_CELL;
        const DOOM_H = DOOM_MAP.length * DOOM_CELL;

        function getDoomBest() {
            return Number(localStorage.getItem(DOOM_KEY) || 0);
        }

        function dWall(x, y) {
            const cx = Math.floor(x / DOOM_CELL);
            const cy = Math.floor(y / DOOM_CELL);
            if (cx < 0 || cy < 0 || cx >= DOOM_MAP[0].length || cy >= DOOM_MAP.length) return true;
            return DOOM_MAP[cy][cx] === 1;
        }

        function dFreeSpot() {
            for (let tries = 0; tries < 300; tries++) {
                const x = 40 + Math.random() * (DOOM_W - 80);
                const y = 40 + Math.random() * (DOOM_H - 80);
                if (!dWall(x, y)) return { x: x, y: y };
            }
            return { x: 75, y: 75 };
        }

        function startDoom() {
            doomRunning = true;
            doomScore = 0;
            doomWave = 1;
            doomHp = 100;
            doomAmmo = 40;
dPlayer = { x: 45, y: 45, vx: 0, vy: 0, facing: 0 };
            dBullets = [];
            dDemons = [];
            dPickups = [];
            dSpawnTimer = 40;
            dFireCd = 0;
            dAmmoSpawnTimer = 400;
            document.getElementById('doom-hp').textContent = '100';
            document.getElementById('doom-ammo').textContent = '40';
            document.getElementById('doom-score').textContent = '0';
            document.getElementById('doom-wave').textContent = '1';
            document.getElementById('doom-result').style.display = 'none';
            doomRAF = requestAnimationFrame(doomTick);
            fetchLBToken('doom');
        }

        const DEMON_TYPES = [
            { icon: '💸', name: 'Дорого', hp: 30, dmg: 8, speed: 0.8, r: 12 },
            { icon: '🤔', name: 'Подумаю', hp: 40, dmg: 10, speed: 0.7, r: 12 },
            { icon: '⏰', name: 'Занят', hp: 50, dmg: 12, speed: 0.9, r: 13 },
            { icon: '📵', name: 'Перезвоните', hp: 60, dmg: 14, speed: 0.8, r: 13 },
            { icon: '🚫', name: 'Не интересно', hp: 75, dmg: 16, speed: 0.7, r: 14 },
            { icon: '✅', name: 'Уже есть', hp: 90, dmg: 20, speed: 0.6, r: 14 }
        ];

        function doomTick() {
            if (!doomRunning) return;

            // Управление
            let mx = 0, my = 0;
            if (dKeys['KeyW'] || dKeys['ArrowUp']) my -= 1;
            if (dKeys['KeyS'] || dKeys['ArrowDown']) my += 1;
            if (dKeys['KeyA'] || dKeys['ArrowLeft']) mx -= 1;
            if (dKeys['KeyD'] || dKeys['ArrowRight']) mx += 1;
            if (dMoveTouch.x || dMoveTouch.y) { mx = dMoveTouch.x; my = dMoveTouch.y; }
            const mlen = Math.hypot(mx, my);
            if (mlen > 1) { mx /= mlen; my /= mlen; }
            const speed = 3;
            const nx = dPlayer.x + mx * speed;
            const ny = dPlayer.y + my * speed;
            if (!dWall(nx, dPlayer.y)) dPlayer.x = nx;
            if (!dWall(dPlayer.x, ny)) dPlayer.y = ny;
            dPlayer.x = Math.max(16, Math.min(DOOM_W - 16, dPlayer.x));
            dPlayer.y = Math.max(16, Math.min(DOOM_H - 16, dPlayer.y));

            // Прицел: на телефоне — автоприцел на ближайшего демона, на ПК — по мыши
            let aimTx = _aimX, aimTy = _aimY;
            if (dTouchFire) {
                let nearest = null, nd = Infinity;
                dDemons.forEach(dm => {
                    if (dm.hp <= 0) return;
                    const ddx = dm.x - dPlayer.x, ddy = dm.y - dPlayer.y;
                    const dd = ddx * ddx + ddy * ddy;
                    if (dd < nd) { nd = dd; nearest = dm; }
                });
                if (nearest) { aimTx = nearest.x; aimTy = nearest.y; }
            }
            const tx0 = aimTx || dPlayer.x, ty0 = aimTy || dPlayer.y;
            dPlayer.facing = Math.atan2(ty0 - dPlayer.y, tx0 - dPlayer.x);

            // Стрельба
            dFireCd--;
            if (dMouse.down && dFireCd <= 0 && doomAmmo > 0) {
                dBullets.push({
                    x: dPlayer.x + Math.cos(dPlayer.facing) * 14,
                    y: dPlayer.y + Math.sin(dPlayer.facing) * 14,
                    vx: Math.cos(dPlayer.facing) * 10,
                    vy: Math.sin(dPlayer.facing) * 10
                });
                doomAmmo--;
                dFireCd = 7;
                document.getElementById('doom-ammo').textContent = doomAmmo;
            }
            if (dMouse.down && doomAmmo <= 0 && dFireCd <= 0) {
                dFireCd = 20;
            }

            // Пули
            dBullets.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;
                if (dWall(b.x, b.y)) b.dead = true;
            });
            dBullets = dBullets.filter(b => !b.dead && b.x > 0 && b.x < DOOM_W && b.y > 0 && b.y < DOOM_H);

            // Пули по демонам
            dBullets.forEach(b => {
                dDemons.forEach(dm => {
                    if (dm.hp <= 0) return;
                    const dx = dm.x - b.x, dy = dm.y - b.y;
                    if (dx * dx + dy * dy < (dm.r + 4) * (dm.r + 4)) {
                        dm.hp -= 25;
                        b.dead = true;
                        dm.flash = 4;
                    }
                });
            });
            dBullets = dBullets.filter(b => !b.dead);

            // Спавн демонов: при пустой волне — сразу новая пачка, таймер — только подкрепление
            const aliveCount = dDemons.filter(d => d.hp > 0).length;
            const maxDemons = Math.min(3 + doomWave, 12);
            if (dDemons.length === 0 && doomRunning) {
                for (let k = 0; k < maxDemons; k++) {
                    const maxType = Math.min(doomWave - 1, DEMON_TYPES.length - 1);
                    const t = DEMON_TYPES[Math.floor(Math.random() * (maxType + 1))];
                    const spot = dFreeSpot();
                    dDemons.push({
                        x: spot.x, y: spot.y, hp: t.hp, maxhp: t.hp, dmg: t.dmg, speed: t.speed,
                        r: t.r, icon: t.icon, name: t.name, flash: 0, atkCd: 0
                    });
                }
                dSpawnTimer = 40;
            }
            dSpawnTimer--;
            if (dSpawnTimer <= 0 && aliveCount > 0 && aliveCount < maxDemons) {
                const maxType = Math.min(doomWave - 1, DEMON_TYPES.length - 1);
                const t = DEMON_TYPES[Math.floor(Math.random() * (maxType + 1))];
                const spot = dFreeSpot();
                dDemons.push({
                    x: spot.x, y: spot.y, hp: t.hp, maxhp: t.hp, dmg: t.dmg, speed: t.speed,
                    r: t.r, icon: t.icon, name: t.name, flash: 0, atkCd: 0
                });
                dSpawnTimer = Math.max(40, 90 - doomWave * 4);
            }

            // Демоны двигаются к игроку
            dDemons.forEach(dm => {
                if (dm.hp <= 0) return;
                if (dm.flash > 0) dm.flash--;
                const dx = dPlayer.x - dm.x;
                const dy = dPlayer.y - dm.y;
                const dist = Math.hypot(dx, dy);
                if (dist > dm.r + 10) {
                    const nx2 = dm.x + (dx / dist) * dm.speed;
                    const ny2 = dm.y + (dy / dist) * dm.speed;
                    if (!dWall(nx2, dm.y)) dm.x = nx2;
                    if (!dWall(dm.x, ny2)) dm.y = ny2;
                }
                // Атака
                dm.atkCd--;
                if (dist < dm.r + 14 && dm.atkCd <= 0) {
                    doomHp -= dm.dmg;
                    dm.atkCd = 30;
                    document.getElementById('doom-hp').textContent = Math.max(0, doomHp);
                }
            });

            // Убитые демоны → очки + дроп
            dDemons.forEach(dm => {
                if (dm.hp <= 0 && !dm.counted) {
                    dm.counted = true;
                    doomScore += 10;
                    document.getElementById('doom-score').textContent = doomScore;
                    if (Math.random() < 0.4) {
                        const roll = Math.random();
                        dPickups.push({ x: dm.x, y: dm.y, type: roll < 0.5 ? 'ammo' : 'med', taken: false });
                    }
                }
            });
            dDemons = dDemons.filter(dm => dm.hp > 0);

            // Подбор аптечек/патронов
            dPickups.forEach(p => {
                const dx = p.x - dPlayer.x, dy = p.y - dPlayer.y;
                if (!p.taken && dx * dx + dy * dy < 26 * 26) {
                    p.taken = true;
                    if (p.type === 'med') { doomHp = Math.min(100, doomHp + 30); document.getElementById('doom-hp').textContent = doomHp; }
                    else { doomAmmo += 10; document.getElementById('doom-ammo').textContent = doomAmmo; }
                }
            });
            dPickups = dPickups.filter(p => !p.taken);

            // Периодические ящики с патронами (дроп из демонов может не повезти)
            dAmmoSpawnTimer--;
            if (dAmmoSpawnTimer <= 0) {
                const ammoBoxes = dPickups.filter(p => p.type === 'ammo').length;
                if (ammoBoxes < 3) {
                    const spot = dFreeSpot();
                    dPickups.push({ x: spot.x, y: spot.y, type: 'ammo', taken: false });
                }
                dAmmoSpawnTimer = 400;
            }

            // Следующая волна
            if (dDemons.length === 0 && doomRunning && doomWave < 99) {
                doomWave++;
                document.getElementById('doom-wave').textContent = doomWave;
                if (Math.random() < 0.3) dPickups.push({ x: dPlayer.x + 60, y: dPlayer.y, type: 'med', taken: false });
                if (Math.random() < 0.5) dPickups.push({ x: dPlayer.x - 60, y: dPlayer.y, type: 'ammo', taken: false });
            }

            // Смерть
            if (doomHp <= 0) {
                doomRunning = false;
                cancelAnimationFrame(doomRAF);
                document.getElementById('doom-final').textContent = doomScore;
                document.getElementById('doom-result').style.display = 'block';
                const best = getDoomBest();
                if (doomScore > best) {
                    localStorage.setItem(DOOM_KEY, String(doomScore));
                }
                autoSaveScore(doomScore, 'doom');
                return;
            }

            drawDoom();
            doomRAF = requestAnimationFrame(doomTick);
        }

        function drawDoom() {
            dctx.clearRect(0, 0, DOOM_W, DOOM_H);

            // Пол (плитка офиса)
            dctx.fillStyle = '#1a1a1a';
            dctx.fillRect(0, 0, DOOM_W, DOOM_H);
            dctx.fillStyle = 'rgba(255,255,255,0.03)';
            for (let cx = 0; cx < DOOM_MAP[0].length; cx++) {
                for (let cy = 0; cy < DOOM_MAP.length; cy++) {
                    dctx.fillRect(cx * DOOM_CELL, cy * DOOM_CELL, DOOM_CELL, DOOM_CELL);
                }
            }

            // Стены (кирпич с «кровью» возражений)
            for (let cx = 0; cx < DOOM_MAP[0].length; cx++) {
                for (let cy = 0; cy < DOOM_MAP.length; cy++) {
                    if (DOOM_MAP[cy][cx] === 1) {
                        dctx.fillStyle = '#7f1d1d';
                        dctx.fillRect(cx * DOOM_CELL, cy * DOOM_CELL, DOOM_CELL, DOOM_CELL);
                        dctx.strokeStyle = '#450a0a';
                        dctx.strokeRect(cx * DOOM_CELL, cy * DOOM_CELL, DOOM_CELL, DOOM_CELL);
                        dctx.fillStyle = '#991b1b';
                        for (let ry = 0; ry < 2; ry++) {
                            for (let rx = 0; rx < 3; rx++) {
                                dctx.fillRect(cx * DOOM_CELL + 4 + rx * 10 + (ry % 2) * 5, cy * DOOM_CELL + 5 + ry * 14, 7, 5);
                            }
                        }
                    }
                }
            }

            // Аптечки/патроны
            dPickups.forEach(p => {
                dctx.font = '16px sans-serif';
                dctx.textAlign = 'center';
                dctx.fillText(p.type === 'med' ? '❤️' : '🔫', p.x, p.y);
            });

            // Демоны
            dDemons.forEach(dm => {
                if (dm.hp <= 0) return;
                dctx.fillStyle = dm.flash > 0 ? '#ffffff' : '#7f1d1d';
                dctx.strokeStyle = '#000000';
                dctx.lineWidth = 2;
                dctx.beginPath();
                dctx.arc(dm.x, dm.y, dm.r, 0, Math.PI * 2);
                dctx.fill();
                dctx.stroke();
                dctx.font = dm.r + 2 + 'px sans-serif';
                dctx.textAlign = 'center';
                dctx.fillText(dm.icon, dm.x, dm.y + 5);
                if (dm.hp < dm.maxhp) {
                    const w = dm.r * 2;
                    dctx.fillStyle = '#000000';
                    dctx.fillRect(dm.x - dm.r, dm.y - dm.r - 7, w, 4);
                    dctx.fillStyle = '#22c55e';
                    dctx.fillRect(dm.x - dm.r, dm.y - dm.r - 7, w * (dm.hp / dm.maxhp), 4);
                }
            });

            // Пули
            dBullets.forEach(b => {
                dctx.fillStyle = '#facc15';
                dctx.beginPath();
                dctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
                dctx.fill();
                dctx.strokeStyle = '#ffffff';
                dctx.beginPath();
                dctx.moveTo(b.x - b.vx, b.y - b.vy);
                dctx.lineTo(b.x, b.y);
                dctx.stroke();
            });

            // Игрок — оператор (круг с наушниками)
            dctx.save();
            dctx.translate(dPlayer.x, dPlayer.y);
            dctx.rotate(dPlayer.facing);
            dctx.fillStyle = '#facc15';
            dctx.strokeStyle = '#111827';
            dctx.lineWidth = 2;
            dctx.beginPath();
            dctx.arc(0, 0, 12, 0, Math.PI * 2);
            dctx.fill();
            dctx.stroke();
            // ствол
            dctx.strokeStyle = '#111827';
            dctx.lineWidth = 4;
            dctx.beginPath();
            dctx.moveTo(4, 0);
            dctx.lineTo(18, 0);
            dctx.stroke();
            dctx.fillStyle = '#7c3aed';
            dctx.beginPath();
            dctx.arc(0, 0, 6, Math.PI, 0);
            dctx.fill();
            dctx.restore();

            // Прицел
            if (dMouse.down) {
                const tx = _aimX, ty = _aimY;
                dctx.strokeStyle = '#f87171';
                dctx.lineWidth = 2;
                dctx.beginPath();
                dctx.arc(tx, ty, 8, 0, Math.PI * 2);
                dctx.stroke();
                dctx.beginPath();
                dctx.moveTo(tx - 12, ty);
                dctx.lineTo(tx + 12, ty);
                dctx.moveTo(tx, ty - 12);
                dctx.lineTo(tx, ty + 12);
                dctx.stroke();
            }
        }

        let _aimX = 300, _aimY = 165;

        // Управление DOOM
        doomCanvas.addEventListener('mousemove', function(e) {
            const rect = doomCanvas.getBoundingClientRect();
            _aimX = (e.clientX - rect.left) * (DOOM_W / rect.width);
            _aimY = (e.clientY - rect.top) * (DOOM_H / rect.height);
            dMouse.x = e.clientX;
            dMouse.y = e.clientY;
        });
        doomCanvas.addEventListener('mousedown', function(e) {
            e.preventDefault();
            dMouse.down = true;
        });
        window.addEventListener('mouseup', function() {
            dMouse.down = false;
        });
        // Джойстик для телефона: левая половина — движение, тап справа — стрельба
        let joyTouchId = null;
        let joyStart = null;
        doomCanvas.addEventListener('touchstart', function(e) {
            e.preventDefault();
            const rect = doomCanvas.getBoundingClientRect();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const x = t.clientX - rect.left;
                if (x < rect.width / 2 && !joyTouchId) {
                    joyTouchId = t.identifier;
                    joyStart = { x: t.clientX, y: t.clientY };
                } else {
                    dMouse.down = true;
                    dTouchFire = true;
                    const cx = (t.clientX - rect.left) * (DOOM_W / rect.width);
                    const cy = (t.clientY - rect.top) * (DOOM_H / rect.height);
                    _aimX = cx;
                    _aimY = cy;
                }
            }
        }, { passive: false });
        doomCanvas.addEventListener('touchmove', function(e) {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === joyTouchId && joyStart) {
                    let dx = (t.clientX - joyStart.x);
                    let dy = (t.clientY - joyStart.y);
                    const len = Math.hypot(dx, dy) || 1;
                    const max = 40;
                    if (len > max) {
                        dMoveTouch.x = (dx / len);
                        dMoveTouch.y = (dy / len);
                    } else {
                        dMoveTouch.x = (dx / max);
                        dMoveTouch.y = (dy / max);
                    }
                } else {
                    const rect = doomCanvas.getBoundingClientRect();
                    const cx = (t.clientX - rect.left) * (DOOM_W / rect.width);
                    const cy = (t.clientY - rect.top) * (DOOM_H / rect.height);
                    _aimX = cx;
                    _aimY = cy;
                    dMouse.down = true;
                    dTouchFire = true;
                }
            }
        }, { passive: false });
        doomCanvas.addEventListener('touchend', function(e) {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === joyTouchId) {
                    joyTouchId = null;
                    joyStart = null;
                    dMoveTouch = { x: 0, y: 0 };
                } else {
                    dMouse.down = false;
                    dTouchFire = false;
                }
            }
        }, { passive: false });
        document.addEventListener('keydown', function(e) {
            if (!doomRunning) return;
            const modal = document.getElementById('gameModal');
            if (!modal || modal.style.display === 'none') return;
            if (e.code === 'Space') { e.preventDefault(); dMouse.down = true; }
            else dKeys[e.code] = true;
        });
        document.addEventListener('keyup', function(e) {
            dKeys[e.code] = false;
            if (e.code === 'Space') dMouse.down = false;
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const content = document.getElementById('gameModalContent');
                if (content && content.classList.contains('game-fs')) {
                    content.classList.remove('game-fs');
                    document.body.classList.remove('game-fs-on');
                    const btn = document.getElementById('gameFsBtn');
                    if (btn) btn.textContent = '⛶ Развернуть';
                }
            }
        });

        // ============================================================
        // ИГРА «ФАБРИКА ОБЗВОНА» (графическая стратегия на канвасе)
        // ============================================================
        const FA_KEY = 'factory_state';
        const FA_COLS = 12, FA_ROWS = 6, FA_CELL = 50;
        const faCanvas = document.getElementById('faCanvas');
        const factx = faCanvas.getContext('2d');

        const FA_BUILDINGS = [
            { id: 'desk', icon: '🪑', name: 'Место', cost: 10, prod: 1, color: '#84cc16', desc: '+1 заявка/сек' },
            { id: 'oper', icon: '🙋', name: 'Оператор', cost: 40, prod: 4, color: '#22c55e', desc: '+4 заявки/сек' },
            { id: 'script', icon: '📄', name: 'Скрипт', cost: 120, prod: 8, color: '#f59e0b', desc: '+8 заявок/сек' },
            { id: 'sup', icon: '💼', name: 'Супервайзер', cost: 250, prod: 0, buff: 0.25, color: '#f472b6', desc: '+25% к соседям' },
            { id: 'crm', icon: '💾', name: 'CRM', cost: 800, prod: 40, color: '#0ea5e9', desc: '+40 заявок/сек' }
        ];

        const fa = {
            money: 50, calls: 0, grid: null, selected: 'desk', won: false
        };
        let faTimer = null;

        function getFABest() {
            return Number(localStorage.getItem('factory_best_score') || 0);
        }

        function faSave() {
            localStorage.setItem(FA_KEY, JSON.stringify(fa));
        }

        function faLoad() {
            try {
                const raw = localStorage.getItem(FA_KEY);
                if (raw) {
                    const s = JSON.parse(raw);
                    Object.assign(fa, s);
                    if (!fa.grid || fa.grid.length !== FA_ROWS) {
                        fa.grid = Array.from({ length: FA_ROWS }, () => Array(FA_COLS).fill(null));
                    }
                }
            } catch (e) {}
        }

        function initFactory() {
            if (!fa.grid) {
                fa.grid = Array.from({ length: FA_ROWS }, () => Array(FA_COLS).fill(null));
            }
            renderFAToolbar();
            renderFA();
            if (!faTimer) {
                faTimer = setInterval(faTick, 1000);
            }
        }

        function faStop() {
            if (faTimer) { clearInterval(faTimer); faTimer = null; }
        }

        function faProd(b) {
            if (b === null) return 0;
            const t = FA_BUILDINGS.find(x => x.id === b);
            return t ? t.prod : 0;
        }

        function faCallsPerSec() {
            if (!fa.grid) return 0;
            let total = 0;
            for (let r = 0; r < FA_ROWS; r++) {
                for (let c = 0; c < FA_COLS; c++) {
                    const b = fa.grid[r][c];
                    if (!b) continue;
                    let p = faProd(b);
                    if (b === 'sup') {
                        // супервайзер бафает соседей, сам 0
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                const rr = r + dr, cc = c + dc;
                                if (rr < 0 || cc < 0 || rr >= FA_ROWS || cc >= FA_COLS) continue;
                                if (fa.grid[rr][cc] && fa.grid[rr][cc] !== 'sup') {
                                    p += faProd(fa.grid[rr][cc]) * 0.25;
                                }
                            }
                        }
                        continue;
                    }
                    // соседние супервайзеры
                    let buff = 1;
                    // рабочее место: оператор/скрипт/CRM работают на полную, только если рядом есть стул
                    if (b !== 'desk') {
                        let hasChair = false;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                const rr = r + dr, cc = c + dc;
                                if (rr < 0 || cc < 0 || rr >= FA_ROWS || cc >= FA_COLS) continue;
                                if (fa.grid[rr][cc] === 'desk') hasChair = true;
                            }
                        }
                        if (!hasChair) buff = 0.5;
                    }
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const rr = r + dr, cc = c + dc;
                            if (rr < 0 || cc < 0 || rr >= FA_ROWS || cc >= FA_COLS) continue;
                            if (fa.grid[rr][cc] === 'sup') buff += 0.25;
                        }
                    }
                    total += p * buff;
                }
            }
            return total;
        }

        function faFull() {
            if (!fa.grid) return false;
            for (let r = 0; r < FA_ROWS; r++) {
                for (let c = 0; c < FA_COLS; c++) {
                    if (!fa.grid[r][c]) return false;
                }
            }
            return true;
        }

        function faTick() {
            if (currentGame !== 'factory' && currentGame !== 'darkroom') return;
            const inc = faCallsPerSec();
            if (inc > 0) {
                fa.calls += inc;
                fa.money += inc * 0.2;
            } else {
                fa.money += 0.5;
            }
            if (faFull() && !fa.won) {
                fa.won = true;
                const score = Math.floor(fa.calls);
                const best = getFABest();
                if (score > best) localStorage.setItem('factory_best_score', String(score));
                autoSaveScore(score, 'factory');
                document.getElementById('fa-final').textContent = score;
                document.getElementById('fa-result').style.display = 'block';
                faStop();
            }
            faSave();
            renderFA();
        }

        function faBuy(bid) {
            const t = FA_BUILDINGS.find(x => x.id === bid);
            if (!t) return;
            if (fa.money < t.cost) { alert('❗ Не хватает денег: ' + t.name + ' стоит ' + t.cost + '₽'); return; }
            fa.selected = bid;
            renderFAToolbar();
            renderFA();
        }

        function faPlace(col, row) {
            const t = FA_BUILDINGS.find(x => x.id === fa.selected);
            if (!t) return;
            if (fa.grid[row][col]) { alert('❗ Клетка занята'); return; }
            if (fa.money < t.cost) { alert('❗ Не хватает денег'); return; }
            fa.money -= t.cost;
            fa.grid[row][col] = fa.selected;
            faSave();
            renderFA();
        }

        function faReset() {
            localStorage.removeItem(FA_KEY);
            fa.money = 50; fa.calls = 0; fa.won = false;
            fa.grid = Array.from({ length: FA_ROWS }, () => Array(FA_COLS).fill(null));
            fa.selected = 'desk';
            document.getElementById('fa-result').style.display = 'none';
            initFactory();
        }

        function renderFAToolbar() {
            const t = FA_BUILDINGS.map(b => {
                const sel = fa.selected === b.id ? 'selected' : '';
                const can = fa.money >= b.cost;
                return `<button class="fa-btn ${sel}" style="opacity:${can ? 1 : 0.6}" onclick="faBuy('${b.id}')">
                    <span class="fa-bicon">${b.icon}</span> ${b.name}
                    <span class="fa-bcost">${b.cost}₽ · ${b.desc}</span>
                </button>`;
            }).join('');
            document.getElementById('fa-toolbar').innerHTML = t;
        }

        function drawFA() {
            factx.clearRect(0, 0, faCanvas.width, faCanvas.height);
            // фон
            factx.fillStyle = '#d6d3d1';
            factx.fillRect(0, 0, faCanvas.width, faCanvas.height);
            // сетка
            for (let r = 0; r < FA_ROWS; r++) {
                for (let c = 0; c < FA_COLS; c++) {
                    const x = c * FA_CELL, y = r * FA_CELL;
                    factx.strokeStyle = '#a8a29e';
                    factx.lineWidth = 1;
                    factx.strokeRect(x, y, FA_CELL, FA_CELL);
                    const b = fa.grid[r][c];
                    if (b) {
                        const t = FA_BUILDINGS.find(z => z.id === b);
                        if (t) {
                            factx.fillStyle = t.color;
                            factx.fillRect(x + 2, y + 2, FA_CELL - 4, FA_CELL - 4);
                            factx.strokeStyle = '#111827';
                            factx.lineWidth = 2;
                            factx.strokeRect(x + 2, y + 2, FA_CELL - 4, FA_CELL - 4);
                            factx.font = '22px sans-serif';
                            factx.textAlign = 'center';
                            factx.textBaseline = 'middle';
                            factx.fillText(t.icon, x + FA_CELL / 2, y + FA_CELL / 2);
                        }
                    }
                }
            }
            // подсветка пустых клеток цветом выбранного здания
            const sel = FA_BUILDINGS.find(z => z.id === fa.selected);
            if (sel) {
                for (let r = 0; r < FA_ROWS; r++) {
                    for (let c = 0; c < FA_COLS; c++) {
                        if (!fa.grid[r][c]) {
                            factx.fillStyle = sel.color;
                            factx.globalAlpha = 0.18;
                            factx.fillRect(c * FA_CELL + 2, r * FA_CELL + 2, FA_CELL - 4, FA_CELL - 4);
                            factx.globalAlpha = 1;
                        }
                    }
                }
                // индикатор выбранного в панели тулбара
                factx.fillStyle = sel.color;
                factx.globalAlpha = 0.3;
                factx.fillRect(0, 0, FA_CELL, FA_CELL);
                factx.globalAlpha = 1;
            }
        }

        function renderFA() {
            document.getElementById('fa-money').textContent = Math.floor(fa.money) + '₽';
            document.getElementById('fa-calls').textContent = Math.floor(fa.calls) + ' 📞';
            document.getElementById('fa-rate').textContent = faCallsPerSec().toFixed(1);
            let n = 0;
            for (let r = 0; r < FA_ROWS; r++) for (let c = 0; c < FA_COLS; c++) if (fa.grid[r][c]) n++;
            document.getElementById('fa-build').textContent = n + ' / ' + (FA_ROWS * FA_COLS);
            drawFA();
        }

        faCanvas.addEventListener('click', function(e) {
            const rect = faCanvas.getBoundingClientRect();
            const c = Math.floor((e.clientX - rect.left) * (FA_COLS / rect.width));
            const r = Math.floor((e.clientY - rect.top) * (FA_ROWS / rect.height));
            if (c >= 0 && c < FA_COLS && r >= 0 && r < FA_ROWS) {
                faPlace(c, r);
            }
        });

        // Совместимость со старыми вызовами (dr-префикс остался в некоторых местах)
        function drStop() { faStop(); }

        // ============================================================
        // ИГРА «КЛИКЕР ПЛАНА»
        // ============================================================
        const CLICK_KEY = 'clicker_state';
        const CLICK_ROUND_SEC = 60;
        const CLICK_PLAN = 1650;
        let clickerCount = 0;
        let clickerPerClick = 1;
        let clickerPerSec = 0;
        let clickerTimeLeft = CLICK_ROUND_SEC;
        let clickerRunning = false;
        let clickerIter = 0;
        let clickerItems = [
            { id: 'c1', name: 'Звонок', desc: '+1 за клик', cost: 50, type: 'click', val: 1 },
            { id: 'c2', name: 'Скрипт', desc: '+1/сек', cost: 120, type: 'auto', val: 1 },
            { id: 'c3', name: 'Руководитель', desc: '+5 за клик', cost: 400, type: 'click', val: 5 },
            { id: 'c4', name: 'CRM', desc: '+5/сек', cost: 900, type: 'auto', val: 5 },
            { id: 'c5', name: 'Бот-обзвон', desc: '+20/сек', cost: 3000, type: 'auto', val: 20 }
        ];

        function initClicker() {
            const st = localStorage.getItem(CLICK_KEY);
            if (st) {
                try {
                    const s = JSON.parse(st);
                    clickerPerClick = s.perClick || 1;
                    clickerPerSec = s.perSec || 0;
                    const savedCosts = s.costs || {};
                    clickerItems.forEach(it => {
                        if (savedCosts[it.id]) it.cost = savedCosts[it.id];
                    });
                } catch (e) {}
            } else {
                clickerPerClick = 1;
                clickerPerSec = 0;
            }
            startClickerRound();
        }

        function startClickerRound() {
            clickerCount = 0;
            clickerTimeLeft = CLICK_ROUND_SEC;
            clickerRunning = true;
            document.getElementById('clicker-result').style.display = 'none';
            renderClicker();
        }

        function clickerTap() {
            if (!clickerRunning) return;
            clickerCount += clickerPerClick;
            renderClicker();
        }

        function clickerBuy(id) {
            const it = clickerItems.find(x => x.id === id);
            if (!it || !clickerRunning || clickerCount < it.cost) return;
            clickerCount -= it.cost;
            if (it.type === 'click') clickerPerClick += it.val;
            else clickerPerSec += it.val;
            it.cost = Math.round(it.cost * 1.6);
            saveClicker();
            renderClicker();
        }

        function saveClicker() {
            const costs = {};
            clickerItems.forEach(it => { costs[it.id] = it.cost; });
            localStorage.setItem(CLICK_KEY, JSON.stringify({ perClick: clickerPerClick, perSec: clickerPerSec, costs: costs }));
        }

        function renderClicker() {
            document.getElementById('clicker-count').textContent = Math.floor(clickerCount);
            document.getElementById('clicker-time').textContent = Math.max(0, Math.ceil(clickerTimeLeft));
            const bestEl = document.getElementById('clicker-best');
            if (bestEl) bestEl.textContent = Number(localStorage.getItem('clicker_best_score') || 0);
            document.getElementById('clicker-shop').innerHTML = clickerItems.map(it =>
                `<div class="clicker-item"><div><b>${it.name}</b></div><div style="font-size:0.75rem;color:var(--text-muted);">${it.desc}</div>
                 <button class="btn-save" style="font-size:0.8rem;padding:4px 10px;" onclick="clickerBuy('${it.id}')">${it.cost}</button></div>`
            ).join('');
            const phone = document.getElementById('clicker-phone');
            if (phone) phone.style.animation = clickerRunning ? '' : 'none';
        }

        function clickerEnd() {
            clickerRunning = false;
            const score = Math.floor(clickerCount);
            const best = Number(localStorage.getItem('clicker_best_score') || 0);
            let isRecord = false;
            if (score > best) {
                localStorage.setItem('clicker_best_score', String(score));
                isRecord = true;
            }
            if (score > 0) autoSaveScore(score, 'clicker');
            document.getElementById('clicker-final').textContent = score;
            const note = document.getElementById('clicker-record-note');
            if (note) note.textContent = isRecord ? '🏆 НОВЫЙ РЕКОРД!' : '';
            document.getElementById('clicker-result').style.display = 'block';
            loadLeaderboard('clicker');
            renderClicker();
        }

        setInterval(() => {
            if (currentGame !== 'clicker') return;
            if (document.getElementById('gameModal').style.display !== 'flex') return;
            if (!clickerRunning) return;
            clickerIter++;
            // автодоход 2 раза в секунду для отзывчивости, но подсчёт времени 1 раз в секунду
            if (clickerPerSec > 0) {
                clickerCount += clickerPerSec * 0.5;
                renderClicker();
            }
            if (clickerIter % 2 === 0) {
                clickerTimeLeft -= 1;
                renderClicker();
                if (clickerTimeLeft <= 0 || clickerCount >= CLICK_PLAN) {
                    clickerEnd();
                }
            }
        }, 500);

        // ============================================================
        // ЛИДЕРБОРД (общий, с фильтром по игре)
        // ============================================================
        let lbToken = '';
        function fetchLBToken(game) {
            game = game || 'runner';
            fetch('leaderboard.php?action=start&game=' + game + '&t=' + Date.now(), { cache: 'no-store' })
                .then(r => r.json())
                .then(d => {
                    if (d && d.token) lbToken = d.token;
                })
                .catch(() => {});
        }
        function autoSaveScore(score, game) {
            const name = (localStorage.getItem('chat_name') || '').trim();
            if (!name) return;
            game = game || 'runner';
            // Всегда получаем свежий одноразовый токен прямо перед сохранением
            fetch('leaderboard.php?action=start&game=' + game + '&t=' + Date.now(), { cache: 'no-store' })
                .then(r => r.json())
                .then(d => {
                    const token = (d && d.token) ? d.token : '';
                    const fd = new FormData();
                    fd.append('action', 'save');
                    fd.append('name', name);
                    fd.append('score', score);
                    fd.append('game', game);
                    fd.append('token', token);
                    return fetch('leaderboard.php', { method: 'POST', body: fd });
                })
                .then(r => r.json())
                .then(() => { loadLeaderboard(game); })
                .catch(() => {});
        }

        function loadLeaderboard(game) {
            const g = game || 'runner';
            fetch('leaderboard.php?action=get&game=' + g + '&t=' + Date.now(), { cache: 'no-store' })
                .then(r => r.text())
                .then(txt => {
                    const data = JSON.parse(txt);
                    const list = document.getElementById('lb-list');
                    if (!data || !data.length) {
                        list.innerHTML = '<div class="lb-row"><span>Пока пусто — стань первым!</span></div>';
                        return;
                    }
                    list.innerHTML = data.slice(0, 10).map((row, i) =>
                        `<div class="lb-row"><span class="lb-place">${i + 1}.</span><span>${row.name}</span><span>${row.score}</span></div>`
                    ).join('');
                })
                .catch(() => {
                    document.getElementById('lb-list').innerHTML = '<div class="lb-row"><span>Не удалось загрузить</span></div>';
                });
        }
    