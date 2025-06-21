import * as AuthModule from "../db.js";

const {
  app,
  db,
  auth,
  collection,
  doc,
  getDocs,
  getDoc,
  signInWithEmailAndPassword
} = AuthModule;

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

        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;

        try {
          await signInWithEmailAndPassword(auth, email, password);
          const docId = email.replace(/[^a-zA-Z0-9]/g, '_');

          loginPopup.style.display = "none";

          alert("Login berhasil!");

          await getUserDataWithPayments(docId);
        } catch (err) {
          console.error("Login gagal:", err);
          loginError.textContent = "Email atau password salah.";
          loginError.style.display = "block";
        }
      }, { once: true });
    }

  } catch (error) {
    console.error("Gagal memuat login.html:", error);
  }
}

async function getUserDataWithPayments(docId) {
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
  }
}
