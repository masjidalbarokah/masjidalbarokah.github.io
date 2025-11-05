
// ================== Config ==================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwCFDZSie7VCytbfN8TpYWNb9X8E8wuobhujmBtLQJqg1UGvhwJ72f0lZ284czfG1zs/exec";
let targetDonasi = 197_818_000; // ubah sesuai target

// ================== Elements ==================
const modal       = document.getElementById("donasiModal");
const openModal   = document.getElementById("openModal");
const closeModal  = document.querySelector(".close");
const form        = document.getElementById("donasiForm");

// ================== Modal Logic ==================
openModal.onclick  = () => (modal.style.display = "flex");
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// ================== Submit Form Donasi ==================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn  = e.target.querySelector("button[type=submit]");
  const nama       = e.target.nama.value.trim();
  const nominalEl  = e.target.nominal;
  const nominal    = nominalEl.value.trim();
  const keterangan = e.target.keterangan.value.trim();
  const jenis      = e.target.jenis.value;
  const file       = e.target.bukti.files[0];

  // Validasi ringan: jika jenis uang (Transfer/Cash) nominal wajib > 0
  if ((jenis === "Transfer Online" || jenis === "Cash") && (!nominal || Number(nominal) <= 0)) {
    alert("Nominal wajib diisi untuk donasi uang.");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Mengirim...";

  // Kirim data (bukti -> base64 jika ada)
  const send = async (b64) => {
    try {
      const payload = new URLSearchParams({ nama, nominal, keterangan, jenis, bukti: b64 || "" });
      const res  = await fetch(SCRIPT_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: payload });
      const text = await res.text();

      if (text.includes("Success")) {
        alert("✅ Donasi berhasil dilaporkan!");
        form.reset();
        // balikkan input nominal jika sebelumnya nonaktif
        nominalEl.disabled = (e.target.jenis.value === "Matrial") ? true : false;
        modal.style.display = "none";
        await Promise.all([loadTotalDonasi(), loadDonasiTable()]);
      } else {
        alert("⚠️ Gagal: " + text);
      }
    } catch (err) {
      console.error("❌ Error kirim data:", err);
      alert("❌ Gagal mengirim data.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Laporkan";
    }
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = () => send(reader.result);
    reader.readAsDataURL(file);
  } else {
    send("");
  }
});

// ================== Toggle Nominal berdasarkan Jenis ==================
(function addJenisListener() {
  const jenisSel   = form?.jenis;
  const nominalEl  = form?.nominal;
  if (!jenisSel || !nominalEl) return;

  const toggleNominal = () => {
    const isMatrial = (jenisSel.value === "Matrial");
    nominalEl.disabled   = isMatrial;
    nominalEl.required   = !isMatrial;
    nominalEl.placeholder = isMatrial ? "Nominal tidak wajib untuk material" : "Contoh: 100000";
    if (isMatrial) nominalEl.value = "";
  };

  jenisSel.addEventListener("change", toggleNominal);
  toggleNominal(); // set kondisi awal
})();

// ================== Total Donasi & Progress ==================
async function loadTotalDonasi() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getTotal");
    const data = await res.json();
    const total = Number(data.total || 0);

    document.getElementById("donasi-terkumpul").innerHTML =
      `<strong>Terkumpul:</strong> Rp ${total.toLocaleString("id-ID")}`;
    document.getElementById("donasi-target").innerHTML =
      `<strong>Target:</strong> Rp ${targetDonasi.toLocaleString("id-ID")}`;

    const persen = Math.min((total / targetDonasi) * 100, 100);
    const bar = document.getElementById("progress-bar");
    bar.style.width = persen + "%";
    bar.innerText = Math.floor(persen) + "%";
  } catch (err) {
    console.error("⚠️ Gagal ambil total donasi:", err);
  }
}

// ================== Riwayat Donasi (tabel + pagination) ==================
let currentPage = 1;
let rowsPerPage = 10;

async function loadDonasiTable() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getDonations");
    const data = await res.json();
    const donations = (data.donations || []).reverse(); // terbaru di atas

    renderTable(donations, currentPage, rowsPerPage);
    renderPagination(donations.length, rowsPerPage);

    const total = donations.reduce((sum, d) => sum + Number(d.nominal || 0), 0);
    document.getElementById("donasiTotal").innerText =
      "Total Semua Donasi: Rp " + total.toLocaleString("id-ID");
  } catch (err) {
    console.error("⚠️ Gagal load riwayat:", err);
  }
}

function renderTable(data, page, rows) {
  const start = (page - 1) * rows;
  const end   = start + rows;
  const items = data.slice(start, end);

  const tbody = document.querySelector("#donasiTable tbody");
  tbody.innerHTML = "";

  items.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nama || "-"}</td>
      <td>Rp ${Number(d.nominal || 0).toLocaleString("id-ID")}</td>
      <td>${d.keterangan || "-"}</td>
      <td>${d.jenis || "-"}</td>
      <td>${d.bukti ? `<a href="${d.bukti}" target="_blank" rel="noopener">Lihat</a>` : "-"}</td>
      <td>${d.tanggal ? new Date(d.tanggal).toLocaleString("id-ID") : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPagination(totalItems, rows) {
  const pageCount  = Math.max(1, Math.ceil(totalItems / rows));
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const makeBtn = (label, disabled, onClick) => {
    const b = document.createElement("button");
    b.innerText = label;
    b.disabled = disabled;
    b.onclick = onClick;
    return b;
  };

  // Prev
  pagination.appendChild(makeBtn("Prev", currentPage === 1, () => { currentPage--; loadDonasiTable(); }));

  for (let i = 1; i <= pageCount; i++) {
    const btn = makeBtn(String(i), i === currentPage, () => { currentPage = i; loadDonasiTable(); });
    pagination.appendChild(btn);
  }

  // Next
  pagination.appendChild(makeBtn("Next", currentPage === pageCount, () => { currentPage++; loadDonasiTable(); }));
}

// ================== Filter Tabs ==================
let allDonations = []; // simpan semua data donasi agar bisa difilter ulang
let activeFilter = "all";

function initFilterTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      applyFilter();
    });
  });
}

function applyFilter() {
  let filtered = allDonations;
  if (activeFilter !== "all") {
    filtered = allDonations.filter(d => (d.jenis || "").toLowerCase() === activeFilter.toLowerCase());
  }
  renderTable(filtered, currentPage, rowsPerPage);
  renderPagination(filtered.length, rowsPerPage);
}

// Modifikasi loadDonasiTable biar simpan semua data
async function loadDonasiTable() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getDonations");
    const data = await res.json();
    allDonations = (data.donations || []).reverse(); // simpan semua data

    applyFilter(); // render sesuai filter aktif
    initFilterTabs();

    const total = allDonations.reduce((sum, d) => sum + Number(d.nominal || 0), 0);
    document.getElementById("donasiTotal").innerText =
      "Total Semua Donasi: Rp " + total.toLocaleString("id-ID");
  } catch (err) {
    console.error("⚠️ Gagal load riwayat:", err);
  }
}

// ================== Typed Text, Swiper, Copy Rekening, Jadwal Sholat ==================
document.addEventListener("DOMContentLoaded", () => {
  loadTotalDonasi();
  loadDonasiTable();

  // Typed
  if (window.Typed) {
    new Typed("#typed-text", {
      strings: [
        "Pusat Ibadah, Dakwah, dan Ukhuwah Umat",
        "Tempat Silaturahmi Jamaah",
        "Membangun Generasi Qur'ani",
      ],
      typeSpeed: 60, backSpeed: 40, backDelay: 1500, loop: true, showCursor: true, cursorChar: "|",
    });
  }

  // Swiper
  if (window.Swiper) {
    new Swiper(".myGallery", {
      slidesPerView: 1.2,
      spaceBetween: 20,
      loop: true,
      centeredSlides: true,
      pagination: { el: ".swiper-pagination", clickable: true },
      navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
      breakpoints: { 768: { slidesPerView: 1.5 }, 1024: { slidesPerView: 2.5 } }
    });
  }

  // Copy rekening
  window.copyRekening = function () {
    const rekening = document.getElementById("rekening")?.innerText || "";
    if (!rekening) return;
    navigator.clipboard.writeText(rekening).then(() => alert("Nomor rekening berhasil dicopy: " + rekening));
  };

  // Toggle mobile menu
  const toggle = document.querySelector(".menu-toggle");
  const nav    = document.querySelector("nav ul");
  toggle?.addEventListener("click", () => nav?.classList.toggle("show"));

  // Jadwal Sholat
  const KOTA_ID = 1209;
  (async () => {
    try {
      const today   = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${KOTA_ID}/${y}/${m}/${d}`);
      const data = await res.json();
      if (data?.status && data?.data?.jadwal) {
        const j = data.data.jadwal;
        document.getElementById("tanggalSholat").innerText = `${j.tanggal} (${data.data.lokasi})`;
        document.getElementById("subuh").innerText   = j.subuh;
        document.getElementById("dzuhur").innerText  = j.dzuhur;
        document.getElementById("ashar").innerText   = j.ashar;
        document.getElementById("maghrib").innerText = j.maghrib;
        document.getElementById("isya").innerText    = j.isya;
      }
    } catch (e) { console.error("Error fetch jadwal sholat:", e); }
  })();
});

