export async function loadLoader() {
  let container = document.getElementById("loader-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "loader-container";
    document.body.appendChild(container);
  }

  try {
    const response = await fetch("assets/component/loader.html");
    const html = await response.text();
    container.innerHTML = html;
  } catch (error) {
    console.error("Gagal memuat loader.html:", error);
  }
}

export function showLoader() {
  const loader = document.getElementById("loaderOverlay");
  if (loader) {
    loader.classList.add("visible");
    loader.classList.remove("hidden");
  }
}

export function hideLoader() {
  const loader = document.getElementById("loaderOverlay");
  if (loader) {
    loader.classList.remove("visible");
    loader.classList.add("hidden");
  }
}
