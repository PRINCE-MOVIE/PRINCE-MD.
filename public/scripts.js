document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const phoneInput = document.getElementById("phone");
  const requestPairingBtn = document.getElementById("requestPairing");
  const statusEl = document.getElementById("status");
  const channelModal = document.getElementById("channelModal");
  const modalClose = document.getElementById("modalClose");
  const confirmFollowBtn = document.getElementById("confirmFollow");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const nav = document.getElementById("nav");

  const btnLabel = requestPairingBtn.innerHTML;
  let channelsFollowed = localStorage.getItem("channelsFollowed") === "true";

  // ---------- Channel modal ----------
  if (!channelsFollowed) {
    setTimeout(() => channelModal.classList.add("active"), 1000);
  }
  const openModal = () => channelModal.classList.add("active");
  const closeModal = () => channelModal.classList.remove("active");

  modalClose.addEventListener("click", closeModal);
  channelModal.addEventListener("click", (e) => {
    if (e.target === channelModal) closeModal();
  });
  confirmFollowBtn.addEventListener("click", () => {
    channelsFollowed = true;
    localStorage.setItem("channelsFollowed", "true");
    closeModal();
    showStatus(`
      <div style="text-align:center;color:var(--success);">
        <i class="fas fa-check-circle" style="font-size:2rem;margin-bottom:10px;"></i>
        <p>Thank you for following our channel! You can now connect your WhatsApp.</p>
      </div>`, "success");
  });

  // ---------- Mobile nav ----------
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
      navToggle.innerHTML = navLinks.classList.contains("active")
        ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });
    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        navToggle.innerHTML = '<i class="fas fa-bars"></i>';
      });
    });
  }
  if (nav) {
    window.addEventListener("scroll", () => {
      nav.classList.toggle("nav-scrolled", window.scrollY > 50);
    });
  }

  // ---------- Stats (serveur Prince : GET /code/active) ----------
  async function refreshStats() {
    try {
      const res = await fetch("/code/active");
      const data = await res.json();
      document.getElementById("activeSockets").textContent = data.count ?? 0;
      document.getElementById("botStatus").textContent = "Online";
    } catch {
      document.getElementById("botStatus").textContent = "Offline";
    }
  }
  refreshStats();
  setInterval(refreshStats, 15000);

  // ---------- Status helper ----------
  function showStatus(message, type = "") {
    statusEl.innerHTML = message;
    statusEl.className = "";
    if (type) statusEl.classList.add(type);
    statusEl.classList.add("fade-in");
  }

  // ---------- Pairing (serveur Prince : GET /code?number=...) ----------
  async function requestPairing() {
    if (!channelsFollowed) {
      showStatus(`
        <div style="text-align:center;color:var(--warning);">
          <i class="fas fa-exclamation-triangle" style="font-size:2rem;margin-bottom:10px;"></i>
          <p>Please follow our channel first to use PRINCE-MD.</p>
          <button class="btn" style="margin-top:10px;" id="showChannels">
            <i class="fas fa-bell"></i> Show Channels
          </button>
        </div>`, "warning");
      document.getElementById("showChannels").addEventListener("click", openModal);
      return;
    }

    const number = phoneInput.value.replace(/\D/g, "");
    if (number.length < 8 || number.length > 15) {
      showStatus("❌ Please enter a valid phone number (digits only, 8-15 characters, with country code).", "error");
      return;
    }

    showStatus("<span class='spinner'></span> Requesting pairing code...", "loading");
    requestPairingBtn.disabled = true;
    requestPairingBtn.innerHTML = '<span class="spinner"></span> Requesting...';

    try {
      const res = await fetch("/code?number=" + encodeURIComponent(number));
      const data = await res.json().catch(() => ({}));

      if (data.status === "already_connected") {
        showStatus(`
          <div style="text-align:center;color:var(--success);">
            <i class="fas fa-check-circle" style="font-size:2.5rem;margin-bottom:14px;"></i>
            <p>This number is already connected to PRINCE-MD.</p>
          </div>`, "success");
        return;
      }

      if (!res.ok || !data.code) {
        const msg = data.message || data.error || "Failed to request pairing code. Try again in a few minutes.";
        showStatus("❌ " + msg, "error");
        return;
      }

      const code = String(data.code).trim();
      showStatus(`
        <div style="text-align:center;">
          <p style="margin-bottom:20px;font-size:1.1rem;">✅ Pairing code for <strong>${number}</strong>:</p>
          <div class="pairing-code" id="pairingCode">${code.split("").join(" ")}</div>
          <p style="margin-top:16px;opacity:0.8;"><small>Click the code to copy it, then enter it in WhatsApp → Linked Devices → Link with phone number.</small></p>
        </div>`, "success");

      const pairingEl = document.getElementById("pairingCode");
      pairingEl.addEventListener("click", () => {
        navigator.clipboard.writeText(code).then(() => {
          const original = pairingEl.textContent;
          pairingEl.textContent = "Copied!";
          setTimeout(() => (pairingEl.textContent = original), 2000);
        }).catch(() => {
          showStatus("❌ Failed to copy. Please copy the code manually.", "error");
        });
      });
      refreshStats();
    } catch (err) {
      console.error("Pairing request failed", err);
      showStatus("❌ Network or server error. Please try again.", "error");
    } finally {
      requestPairingBtn.disabled = false;
      requestPairingBtn.innerHTML = btnLabel;
    }
  }

  requestPairingBtn.addEventListener("click", requestPairing);
  phoneInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") requestPairing();
  });
  phoneInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "");
  });

  // ---------- Footer year ----------
  document.getElementById("year").textContent = new Date().getFullYear();

  // ---------- Particles ----------
  const particlesContainer = document.getElementById("particles");
  const particleCount = window.innerWidth < 768 ? 20 : 40;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement("div");
    p.classList.add("particle");
    const size = Math.random() * 3 + 1;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 20}s`;
    p.style.animationDuration = `${Math.random() * 15 + 20}s`;
    particlesContainer.appendChild(p);
  }

  // ---------- Smooth scroll ----------
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  // ---------- Scroll animations ----------
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

  document.querySelectorAll(".card").forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(card);
  });
});
