import * as AuthModule from "../db.js";

const {
    app,
    db,
    auth,
    collection,
    doc,
    setDoc,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    getAuth,
    createUserWithEmailAndPassword,
    deleteUser
} = AuthModule;

console.log(app);
console.log(auth);
console.log(db);


// Logika pemilihan paket untuk form harga dan berlangganan
document.addEventListener('DOMContentLoaded', function () {
    const pricingGrid = document.getElementById('pricing-grid');
    const pricingCards = document.querySelectorAll('.pricing-card');
    const selectPlanButtons = document.querySelectorAll('.select-plan-btn');
    const subscriptionForm = document.getElementById('subscription-form');
    const selectedPlanLabel = document.getElementById('selected-plan-label');

    // Elemen form
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const termsCheckbox = document.getElementById('terms');
    const termsRow = termsCheckbox.closest('.terms-row');
    const termsError = document.getElementById('terms-error');
    const checkPaymentBtn = document.getElementById('check-payment-btn');
    const formErrors = document.getElementById('form-errors');
    const errorList = document.getElementById('error-list');

    // Elemen VA
    const paymentVaSection = document.getElementById('payment-va-section');
    const freePlanMessage = document.getElementById('free-plan-message');
    const presubmitMessage = document.getElementById('presubmit-message');
    const paymentSuccess = document.getElementById('payment-success');
    const paymentBank = document.getElementById('payment-bank');
    const paymentVaNumber = document.getElementById('payment-va-number');
    const paymentTotal = document.getElementById('payment-total');
    const copyVaBtn = document.getElementById('copy-va-btn');
    const paymentTimer = document.getElementById('payment-timer');

    // Data paket yang dipilih
    let selectedPlanData = {
        name: 'Pro',
        price: '$29',
        period: '/month'
    };

    // Variabel timer
    let timerInterval;
    const timerDuration = 30; // 30 detik

    // Daftar bank untuk pemilihan acak
    const banks = ['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB Niaga'];

    // Fungsi untuk menghasilkan nomor VA acak
    function generateRandomVA() {
        const prefix = Math.floor(Math.random() * 9000) + 1000; // prefix 4 digit
        const account = Math.floor(Math.random() * 90000000000) + 10000000000; // nomor akun 11 digit
        return `${prefix}${account}`;
    }

    // Fungsi untuk memformat harga
    function formatPrice(price) {
        if (price === 'Free') return '0.00';
        return parseFloat(price.replace('$', '')).toFixed(2);
    }

    // Fungsi untuk memulai timer pembayaran
    function startPaymentTimer() {
        // Hapus timer yang ada
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        // Atur waktu awal (24 jam)
        let timeLeft = timerDuration;

        // Format dan tampilkan waktu awal
        updateTimerDisplay(timeLeft);

        // Mulai interval
        timerInterval = setInterval(() => {
            timeLeft--;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timeLeft = 0;
            }

            updateTimerDisplay(timeLeft);
        }, 1000);
    }

    // Fungsi untuk memperbarui tampilan timer
    function updateTimerDisplay(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        const formattedTime =
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        if (paymentTimer) {
            paymentTimer.textContent = formattedTime;
        }
    }

    // Fungsi untuk menampilkan pesan error inline
    function setFieldError(field, message) {
        field.classList.add('error');

        // Untuk checkbox, tangani error secara berbeda
        if (field === termsCheckbox) {
            termsRow.classList.add('error');
            if (termsError) {
                termsError.textContent = message;
            }
        }

        return message; // Kembalikan pesan untuk daftar error
    }

    // Fungsi untuk menghapus error form
    function clearFormErrors() {
        // Sembunyikan container error
        formErrors.style.display = 'none';
        errorList.innerHTML = '';

        // Hapus error field
        fullNameInput.classList.remove('error');
        emailInput.classList.remove('error');
        termsRow.classList.remove('error');

        if (termsError) {
            termsError.textContent = '';
        }
    }

    // Fungsi untuk memvalidasi form
    async function validateForm() {
        let isValid = true;
        let errors = [];

        // Hapus error sebelumnya
        clearFormErrors();

        // Periksa apakah nama diisi
        if (!fullNameInput.value.trim()) {
            const errorMsg = setFieldError(fullNameInput, 'Mohon masukkan nama lengkap Anda');
            errors.push(errorMsg);
            isValid = false;
        }

        // Periksa apakah email diisi
        if (!emailInput.value.trim()) {
            const errorMsg = setFieldError(emailInput, 'Mohon masukkan alamat email Anda');
            errors.push(errorMsg);
            isValid = false;
        } else {
            // Validasi email sederhana
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailInput.value.trim())) {
                const errorMsg = setFieldError(emailInput, 'Mohon masukkan alamat email yang valid');
                errors.push(errorMsg);
                isValid = false;
            }
        }

        // Periksa password
        if (!passwordInput.value.trim()) {
            const errorMsg = setFieldError(passwordInput, 'Mohon masukkan kata sandi Anda');
            errors.push(errorMsg);
            isValid = false;
        } else if (/\s/.test(passwordInput.value)) {
            const errorMsg = setFieldError(passwordInput, 'Kata sandi tidak boleh mengandung spasi');
            errors.push(errorMsg);
            isValid = false;
        } else if (passwordInput.value.trim().length < 6) {
            const errorMsg = setFieldError(passwordInput, 'Kata sandi harus terdiri dari minimal 6 karakter');
            errors.push(errorMsg);
            isValid = false;
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_])/.test(passwordInput.value)) {
            const errorMsg = setFieldError(passwordInput, 'Kata sandi harus mengandung huruf, angka, dan simbol');
            errors.push(errorMsg);
            isValid = false;
        }

        const isSubscribed = await checkSubscriptionByIdAndEmail(emailInput.value.trim());
        if (isSubscribed) {
            const errorMsg = setFieldError(emailInput, 'Email sudah digunakan dengan langgannan masih aktif');
            errors.push(errorMsg);
            isValid = false;
        }

        // Periksa persetujuan syarat
        if (!termsCheckbox.checked) {
            const errorMsg = setFieldError(termsCheckbox, 'Anda harus menyetujui Syarat Layanan dan Kebijakan Privasi');
            errors.push(errorMsg);
            isValid = false;
        }

        // Jika ada error, tampilkan
        if (!isValid) {
            // Isi daftar error
            errors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = error;
                errorList.appendChild(li);
            });

            // Tampilkan container error
            formErrors.style.display = 'block';

            // Scroll ke error pertama atau container error
            if (errors.length > 0) {
                const firstErrorField = document.querySelector('.error');
                if (firstErrorField) {
                    firstErrorField.focus();
                }
            }
        }

        return isValid;
    }

    //Save data ke Firebase
    async function saveData() {
        console.log("saveData function called");
        console.log("Current form values:", {
            fullName: fullNameInput.value,
            email: emailInput.value.trim(),
            plan: selectedPlanData.name
        });

        const email = emailInput.value.trim();
        const docId = email.replace(/[^a-zA-Z0-9]/g, '_');
        const password = passwordInput.value;

        const planDuration = 1; // 1 bulan
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + planDuration * 30 * 24 * 60 * 60 * 1000);

        let user = null;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            
            console.log("User registered with UID:", user.uid);

            await setDoc(doc(db, "users", docId), {
                id: user.uid,
                fullName: fullNameInput.value,
                email: emailInput.value.trim(),
                plan: selectedPlanData.name,
                planEnd: endDate,
                status: true
            });
            
            await addDoc(collection(db, "users", docId, "payment"), {
                plan: selectedPlanData.name,
                price: selectedPlanData.price,
                duration: `${planDuration} Month`,
                bank: paymentBank.textContent,
                virtualAccount: paymentVaNumber.textContent,
                paidAt: startDate,
                status: "Paid"
            });            

            alert("✅ Saved to Firebase!");
            window.location.href = "../";
        } catch (err) {
            console.error("❌ Error saat createUser atau setDoc:", err);

            // Cek kalau user sudah ter-assign baru hapus
            if (user) {
                try {
                    await deleteUser(user);
                    console.log("User deleted due to Firestore error");
                } catch (deleteErr) {
                    console.error("❌ Gagal menghapus user setelah error:", deleteErr);
                }
            }

            alert("Gagal registrasi: " + err.message);
            location.reload();
        }
    }

     //Cek apakah email sudah digunakan dan masa masih aktif
    async function checkSubscriptionByIdAndEmail(emailToCheck) {
        try {
            const acc = collection(db, "account");
            // Query untuk email and active status
            const q = query(acc, 
                            where("email", "==", emailToCheck), 
                            where("status", "==", "Active"));

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                console.log("Found active subscription for:", emailToCheck);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error checking subscription:", error);
            return false;
        }
    }

    // Fungsi untuk menangani tampilan detail pembayaran
    async function showPaymentDetails() {
        if (!(await validateForm())) {
            return;
        }

        // Sembunyikan container error jika validasi berhasil
        formErrors.style.display = 'none';

        // Jika paket gratis, tampilkan pesan selesai
        if (selectedPlanData.price === 'Free') {
            freePlanMessage.style.display = 'block';
            presubmitMessage.style.display = 'none';
            paymentSuccess.style.display = 'block';
            checkPaymentBtn.textContent = 'Registrasi Selesai!';
            checkPaymentBtn.disabled = false;

        } else {
            // Untuk paket berbayar, tampilkan informasi VA
            paymentVaSection.style.display = 'block';
            presubmitMessage.style.display = 'none';
            paymentSuccess.style.display = 'block';

            // Generate dan atur informasi VA
            const randomBank = banks[Math.floor(Math.random() * banks.length)];
            const randomVA = generateRandomVA();

            paymentBank.textContent = randomBank;
            paymentVaNumber.textContent = randomVA;
            paymentTotal.textContent = `$${formatPrice(selectedPlanData.price)}`;

            // Mulai timer pembayaran
            startPaymentTimer();

            // Perbarui teks tombol
            checkPaymentBtn.textContent = 'Memproses Pembayaran...';
            checkPaymentBtn.disabled = true;
            
            //Apabila copy VA tidak diklik selama 5 detik maka payment failed
            let copyTimeout = setTimeout(() => {
                alert("❌ Pembayaran gagal karena tidak menyalin nomor VA.");
                location.reload();
            }, timerDuration*1000);

            // Mmbatalkan timeout jika tombol copy ditekan
            if (copyVaBtn) {
                copyVaBtn.addEventListener('click', function () {
                    clearTimeout(copyTimeout);
                }, { once: true });
            }
        }
    }

    // Fungsi untuk memilih paket
    function selectPlan(planCard) {
        // Hapus kelas selected dari semua kartu
        pricingCards.forEach(card => {
            card.classList.remove('selected');
            const btn = card.querySelector('.select-plan-btn');
            btn.textContent = 'Pilih Paket';
        });

        // Tambah kelas selected ke kartu yang diklik
        planCard.classList.add('selected');
        const button = planCard.querySelector('.select-plan-btn');
        button.textContent = 'Terpilih';

        // Ambil detail paket
        const planName = planCard.getAttribute('data-plan');
        const planPrice = planCard.getAttribute('data-price');
        const planPeriod = planCard.getAttribute('data-period');

        // Simpan data paket yang dipilih
        selectedPlanData = {
            name: planName,
            price: planPrice,
            period: planPeriod
        };

        // Perbarui paket yang dipilih di form
        selectedPlanLabel.textContent = `${planName} - ${planPrice}${planPeriod}`;

        // Reset elemen UI
        paymentVaSection.style.display = 'none';
        paymentSuccess.style.display = 'none';
        formErrors.style.display = 'none';
        checkPaymentBtn.disabled = false;
        checkPaymentBtn.textContent = 'Periksa Detail Pembayaran';

        // Tangani tampilan berdasarkan paket
        if (planPrice === 'Free') {
            // Tampilkan pesan paket gratis dan sembunyikan pesan pra-submit
            freePlanMessage.style.display = 'block';
            presubmitMessage.style.display = 'none';
        } else {
            // Sembunyikan pesan paket gratis dan tampilkan pesan pra-submit
            freePlanMessage.style.display = 'none';
            presubmitMessage.style.display = 'block';
        }

        // Hapus validasi form sebelumnya
        clearFormErrors();

        // Scroll ke form
        subscriptionForm.scrollIntoView({ behavior: 'smooth' });
    }

    // Tambah event listener klik ke seluruh kartu
    pricingCards.forEach(card => {
        card.addEventListener('click', function (e) {
            // Hanya trigger jika klik pada kartu itu sendiri, bukan pada tombol
            if (e.target.tagName !== 'BUTTON') {
                selectPlan(this);
            }
        });
    });

    // Tambah event listener klik ke tombol
    selectPlanButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation(); // Cegah klik kartu juga terpicu
            const card = this.closest('.pricing-card');
            selectPlan(card);
        });
    });

    if (checkPaymentBtn) {
        checkPaymentBtn.addEventListener('click', async function () {
            const btnText = checkPaymentBtn.textContent.trim();

            if (btnText === "Periksa Detail Pembayaran") {
                await showPaymentDetails();
            } else if (btnText === "Registrasi Selesai!") {
                await saveData();
                checkPaymentBtn.textContent = "Periksa Detail Pembayaran"; 
            }
        });
    }

    // Fungsi copy nomor VA untuk simulasi pembayaran
    if (copyVaBtn) {
        copyVaBtn.addEventListener('click', async function () {
            const vaNumber = paymentVaNumber.textContent;

            // Buat elemen textarea sementara untuk copy
            const textarea = document.createElement('textarea');
            textarea.value = vaNumber;
            textarea.style.position = 'fixed'; // Hindari scroll ke bawah
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            try {
                // Jalankan perintah copy
                const successful = document.execCommand('copy');

                // Berikan feedback + simpan data
                const originalText = this.textContent;
                this.textContent = 'Tersalin!';
                this.textContent = originalText;

                // For paid plans
                await saveData(); // This is async but not awaited
            } catch (err) {
                console.error('Gagal menyalin: ', err);
            }

            // Hapus elemen sementara
            document.body.removeChild(textarea);
        });
    }

    // Set paket Pro sebagai paket default yang dipilih saat halaman dimuat
    window.addEventListener('load', function () {
        // Cari kartu paket Pro dan pilih
        const proCard = document.querySelector('.pricing-card[data-plan="Pro"]');
        if (proCard) {
            selectPlan(proCard);
        }
    });

    // Tambah event listener input untuk menghapus error saat user mengetik
    fullNameInput.addEventListener('input', function () {
        this.classList.remove('error');
    });

    emailInput.addEventListener('input', function () {
        this.classList.remove('error');
    });

    termsCheckbox.addEventListener('change', function () {
        if (this.checked) {
            termsRow.classList.remove('error');
            termsError.textContent = '';
        }
    });
});





