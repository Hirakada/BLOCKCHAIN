import * as AuthModule from "../db.js";
import { showLoader, hideLoader } from "../assets/component/loader.js";
import { trace } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-performance.js";

const {
  db,
  auth,
  perf,
  collection,
  doc,
  getDocs,
  getDoc,
  signInWithEmailAndPassword
} = AuthModule;

//Menampilkan login popup
export async function loadLoginPopup(triggerButtonId = "login-btn") {
  let container = document.getElementById("login-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "login-container";
    document.body.appendChild(container);
  }

  try {
    const response = await fetch("profile/login.html");
    const html = await response.text();
    container.innerHTML = html;

    const loginPopup = document.getElementById("login-popup");
    const closeLogin = document.getElementById("close-login");
    const loginBtn = document.getElementById(triggerButtonId);

    loginBtn?.addEventListener("click", () => {
      loginPopup.style.display = "flex";
    });

    closeLogin?.addEventListener("click", () => {
      loginPopup.style.display = "none";
    });

    window.addEventListener("click", (e) => {
      if (e.target === loginPopup) {
        loginPopup.style.display = "none";
      }
    });

    const loginForm = document.getElementById("login-form");
    const loginError = document.getElementById("login-error");

    if (loginForm) {
      loginForm.addEventListener("submit", async function handleSubmit(event) {
        event.preventDefault();
        loginError.style.display = "none";

        const signInTrace = trace(perf, "signInTime");
        showLoader();
        signInTrace.start();

        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;

        try {
          await signInWithEmailAndPassword(auth, email, password);
          signInTrace.stop();

          const docId = email.replace(/[^a-zA-Z0-9]/g, '_');

          loginPopup.style.display = "none";

          await getUserDataWithPayments(docId);
          hideLoader();
          setTimeout(() => {
            alert("Login berhasil!");
          }, 100);
        } catch (err) {
          hideLoader();
          console.error("Login gagal:", err);
          loginError.textContent = "Email atau password salah.";
          loginError.style.display = "block";
        }
      });
    }

  } catch (error) {
    console.error("Gagal memuat login.html:", error);
  }
}

//Simulasi delay untuk cek loading
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//Memanggil data user dari Firebase
async function getUserDataWithPayments(docId) {
  const fetchTrace = trace(perf, "fetchUserDataTime");
  fetchTrace.start();

  try {
    const userDocRef = doc(db, "users", docId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.log("User data not found!");
      return;
    }

    const userData = userDocSnap.data();
    console.log("User Data:", userData);

    const paymentColRef = collection(db, "users", docId, "payment");
    const paymentSnapshot = await getDocs(paymentColRef);

    if (paymentSnapshot.empty) {
      console.log("No payment data");
      return { userData, payments: [] };
    }

    const payments = [];
    paymentSnapshot.forEach(doc => {
      payments.push({ id: doc.id, ...doc.data() });
    });

    console.log("Payments:", payments);
    return { userData, payments };
  } catch (error) {
    console.error("Error getting user data and payments:", error);
  } finally {
    fetchTrace.stop();
  }
}