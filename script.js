import { CreateMLCEngine } from "https://esm.run/@mlc-ai/web-llm";
import { marked } from "https://cdn.jsdelivr.net/npm/marked@4.0.18/lib/marked.esm.js";

class ClockCalendar {
    constructor() {
        this.clock = document.getElementById('clock');
        this.date = document.getElementById('date');
        this.calendarMonthYear = document.getElementById('calendarMonthYear');
        this.calendarGrid = document.getElementById('calendarGrid');
        this.prevMonth = document.getElementById('prevMonth');
        this.nextMonth = document.getElementById('nextMonth');
        
        this.currentDate = new Date();
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        
        this.initializeEvents();
        this.initializeClock();
        this.initializeCalendar();
    }

    initializeEvents() {
        this.prevMonth.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonth.addEventListener('click', () => this.changeMonth(1));
    }

    initializeClock() {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            this.clock.textContent = `${hours}:${minutes}:${seconds}`;
            
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            this.date.textContent = now.toLocaleDateString('fr-FR', options);
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    initializeCalendar() {
        this.renderCalendar();
    }

    renderCalendar() {
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDay = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const today = new Date();
        
        const options = { month: 'long', year: 'numeric' };
        this.calendarMonthYear.textContent = firstDay.toLocaleDateString('fr-FR', options);

        this.calendarGrid.innerHTML = '';

        const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        days.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.className = 'calendar-day-label';
            dayLabel.textContent = day;
            this.calendarGrid.appendChild(dayLabel);
        });

        for (let i = 0; i < (startDay === 0 ? 6 : startDay - 1); i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            this.calendarGrid.appendChild(emptyCell);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            dayCell.textContent = i;
            if (i === today.getDate() && 
                this.currentMonth === today.getMonth() && 
                this.currentYear === today.getFullYear()) {
                dayCell.classList.add('current-day');
            }
            this.calendarGrid.appendChild(dayCell);
        }
    }

    changeMonth(direction) {
        this.currentMonth += direction;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.renderCalendar();
    }
}

class ChatBot {
    constructor() {
        this.engine = null;
        this.isInitialized = false;
        this.isGenerating = false;
        this.typingIndicator = null;
        
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.status = document.getElementById('status');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.chatInputContainer = document.getElementById('chatInputContainer');
        this.connectButton = document.getElementById('connectButton');
        
        this.initializeEvents();
    }

    initializeEvents() {
        this.connectButton.addEventListener('click', () => this.initializeModel());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
        });
    }

    async initializeModel() {
        try {
            this.updateStatus('Chargement du modèle...', 'loading');
            this.connectButton.style.display = 'none';
            this.loadingIndicator.style.display = 'block';
            this.chatMessages.classList.remove('centered');

            this.engine = await CreateMLCEngine(
                "Qwen2.5-0.5B-Instruct-q4f32_1-MLC",
                {
                    initProgressCallback: (progress) => {
                        const percentage = Math.round(progress.progress * 100);
                        this.progressFill.style.width = percentage + '%';
                        this.progressText.textContent = percentage + '%';
                        
                        if (percentage < 100) {
                            this.progressFill.style.boxShadow = `0 0 20px rgba(107, 207, 127, 0.5)`;
                        }
                    }
                }
            );

            this.isInitialized = true;
            this.loadingIndicator.style.display = 'none';
            this.chatInputContainer.style.display = 'flex';
            this.updateStatus('En ligne', 'ready');
            this.chatInput.disabled = false;
            this.sendButton.disabled = false;
            this.chatInput.focus();
            
            setTimeout(() => {
                this.addMessage('assistant', '👋 Salut ! Je suis ton assistant IA personnel. Comment puis-je t\'aider aujourd\'hui ?');
            }, 500);
            
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            this.updateStatus('Erreur de connexion', 'error');
            this.loadingIndicator.style.display = 'none';
            this.connectButton.style.display = 'block';
            this.chatMessages.classList.add('centered');
            this.addMessage('assistant', '❌ Désolé, une erreur s\'est produite lors du chargement. Cliquez sur "Connecter" pour réessayer.');
        }
    }

    updateStatus(message, className) {
        const statusSpan = this.status.querySelector('span');
        statusSpan.textContent = message;
        this.status.className = `status ${className}`;
    }

    showTypingIndicator() {
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            this.typingIndicator.appendChild(dot);
        }
        
        this.chatMessages.appendChild(this.typingIndicator);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.remove();
            this.typingIndicator = null;
        }
    }

    async sendMessage() {
        if (!this.isInitialized || this.isGenerating) return;

        const message = this.chatInput.value.trim();
        if (!message) return;

        this.sendButton.style.transform = 'scale(0.9) rotate(45deg)';
        setTimeout(() => {
            this.sendButton.style.transform = '';
        }, 150);

        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
        this.addMessage('user', message);
        
        this.isGenerating = true;
        this.sendButton.disabled = true;
        this.chatInput.disabled = true;
        this.updateStatus('En train de réfléchir...', 'loading');
        
        this.showTypingIndicator();

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            const response = await this.engine.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: "Tu es un assistant IA serviable et amical. Réponds en français de manière naturelle, engageante et avec de l'empathie. Utilise des emojis quand c'est approprié pour rendre la conversation plus vivante. Si approprié, utilise le format Markdown pour structurer tes réponses (par exemple, listes, titres, gras, italique)." 
                    },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 1000,
            });

            this.hideTypingIndicator();
            
            const assistantMessage = response.choices[0].message.content;
            this.addMessageWithTypingEffect('assistant', assistantMessage);
            
        } catch (error) {
            console.error('Erreur de génération:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', '❌ Désolé, une erreur s\'est produite lors de la génération de la réponse. Pouvez-vous réessayer ?');
        }

        this.isGenerating = false;
        this.sendButton.disabled = false;
        this.chatInput.disabled = false;
        this.chatInput.focus();
        this.updateStatus('En ligne', 'ready');
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.5s ease-out';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);
        
        this.smoothScrollToBottom();
    }

    async addMessageWithTypingEffect(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content markdown-content';
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.5s ease-out';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 50);

        let processedContent = content;
        processedContent = processedContent.replace(/(\d+\.\s+[^\n]*)/g, (match) => {
            return `\n${match}\n`;
        });
        
        const htmlContent = marked.parse(processedContent, {
            breaks: true,
            gfm: true
        });
        
        let index = 0;
        const typeSpeed = 30;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent;
        
        const typeWriter = () => {
            if (index < textContent.length) {
                const currentText = textContent.slice(0, index + 1);
                messageContent.innerHTML = marked.parse(currentText, {
                    breaks: true,
                    gfm: true
                });
                index++;
                this.smoothScrollToBottom();
                setTimeout(typeWriter, typeSpeed);
            } else {
                messageContent.innerHTML = htmlContent;
                this.smoothScrollToBottom();
            }
        };
        
        setTimeout(typeWriter, 300);
    }

    smoothScrollToBottom() {
        this.chatMessages.scrollTo({
            top: this.chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }
}

function checkWebGPUSupport() {
    if (!navigator.gpu) {
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(20px);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
                font-family: 'Inter', sans-serif;
                z-index: 1000;
            ">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 24px;
                    padding: 48px;
                    max-width: 500px;
                ">
                    <div style="font-size: 64px; margin-bottom: 24px;">⚠️</div>
                    <h2 style="margin-bottom: 16px; font-size: 24px; font-weight: 600;">Navigateur non compatible</h2>
                    <p style="margin-bottom: 24px; opacity: 0.8; line-height: 1.6;">
                        Votre navigateur ne supporte pas WebGPU, nécessaire pour faire fonctionner l'IA.
                    </p>
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 12px;
                        padding: 16px;
                        font-size: 14px;
                        opacity: 0.7;
                    ">
                        Utilisez Chrome 113+, Edge 113+ ou Firefox 110+ pour la meilleure expérience.
                    </div>
                </div>
            </div>
        `;
        return false;
    }
    return true;
}

if (checkWebGPUSupport()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new ClockCalendar();
            new ChatBot();
        });
    } else {
        new ClockCalendar();
        new ChatBot();
    }
}