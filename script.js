// ================== CONFIG ==================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwhNrg_Oh3md_Mqp5jgBWPm-trieHs9D4zeHP9Lslqmpt5WOM0FI4GBIvEnF6iXudi3/exec";
let targetDonasi = 197_818_000; // 🎯 ubah sesuai target

// ================== ELEMENTS ==================
const modal = document.getElementById("donasiModal");
const openModal = document.getElementById("openModal");
const closeModal = document.querySelector(".close");
const form = document.getElementById("donasiForm");

// ================== MODAL LOGIC ==================
openModal.onclick = () => (modal.style.display = "flex");
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

// ================== SUBMIT FORM DONASI ==================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector("button[type=submit]");
  const nama = e.target.nama.value.trim();
  const nominalEl = e.target.nominal;
  const nominal = nominalEl.value.trim();
  const keterangan = e.target.keterangan.value.trim();
  const jenis = e.target.jenis.value;
  const alamat = e.target.alamat?.value.trim() || "";
  const file = e.target.bukti.files[0];

  // Validasi nominal
  if (!nominal || Number(nominal) <= 0) {
    alert("Nominal wajib diisi dan harus lebih dari 0.");
    return;
  }

  // Validasi alamat untuk donasi Cash
  if (jenis === "Cash" && !alamat) {
    alert("Alamat wajib diisi untuk donasi tunai (Cash).");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Mengirim...";

  const send = async (b64) => {
    try {
      // ✅ kirim semua data termasuk alamat
      const payload = new URLSearchParams({ nama, nominal, keterangan, jenis, alamat, bukti: b64 || "" });
      const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload,
      });
      const text = await res.text();

      if (text.includes("Success")) {
        alert("✅ Donasi berhasil dilaporkan!");
        form.reset();
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

// ================== TOGGLE FIELD BERDASARKAN JENIS ==================
(function handleJenisDonasi() {
  const jenisSel = form?.jenis;
  const nominalEl = form?.nominal;
  const alamatWrap = document.getElementById("alamat-wrapper");
  if (!jenisSel || !nominalEl || !alamatWrap) return;

  const toggleFields = () => {
    const jenis = jenisSel.value;

    // Nominal selalu aktif & wajib
    nominalEl.disabled = false;
    nominalEl.required = true;
    nominalEl.placeholder =
      jenis === "Matrial"
        ? "Masukkan estimasi nilai material (Rp)"
        : "Contoh: 100000";

    // 🔥 Tampilkan alamat hanya kalau jenis = Cash
    const alamatInput = alamatWrap.querySelector("input");
    if (jenis === "Cash") {
      alamatWrap.style.display = "block";
      alamatInput.required = true;
      alamatInput.placeholder = "Masukkan alamat donatur";
    } else {
      alamatWrap.style.display = "none";
      alamatInput.required = false;
      alamatInput.value = "";
    }
  };

  jenisSel.addEventListener("change", toggleFields);
  toggleFields();
})();

// ================== TOTAL DONASI & PROGRESS ==================
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

// ================== RIWAYAT DONASI + FILTER + PAGINATION ==================
let allDonations = [];
let activeFilter = "all";
let currentPage = 1;
let rowsPerPage = 10;

function initFilterTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      currentPage = 1;
      applyFilter();
    });
  });
}

function applyFilter() {
  let filtered = allDonations;
  if (activeFilter !== "all") {
    filtered = allDonations.filter(
      (d) => (d.jenis || "").toLowerCase() === activeFilter.toLowerCase()
    );
  }

  renderTable(filtered, currentPage, rowsPerPage, activeFilter);
  renderPagination(filtered.length, rowsPerPage);
}

function renderTable(data, page, rows, filter) {
  const start = (page - 1) * rows;
  const end = start + rows;
  const items = data.slice(start, end);

  const tbody = document.querySelector("#donasiTable tbody");
  const thead = document.querySelector("#donasiTable thead");
  tbody.innerHTML = "";

  // 🔍 tampilkan kolom alamat kalau tab aktif Cash
  const tampilAlamat = (filter === "cash");

  // 🔁 update header tabel
  thead.innerHTML = `
    <tr>
      <th>Nama</th>
      <th>Nominal</th>
      <th>Keterangan</th>
      <th>Jenis</th>
      ${tampilAlamat ? "<th>Alamat</th>" : ""}
      <th>Bukti</th>
      <th>Tanggal</th>
    </tr>
  `;

  // 🔁 isi tabel
  items.forEach((d) => {
    const isCash = (d.jenis || "").toLowerCase() === "cash";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.nama || "-"}</td>
      <td>Rp ${Number(d.nominal || 0).toLocaleString("id-ID")}</td>
      <td>${d.keterangan || "-"}</td>
      <td>${d.jenis || "-"}</td>
      ${tampilAlamat ? `<td>${isCash ? (d.alamat || "-") : "-"}</td>` : ""}
      <td>${d.bukti ? `<a href="${d.bukti}" target="_blank" rel="noopener">Lihat</a>` : "-"}</td>
      <td>${d.tanggal ? new Date(d.tanggal).toLocaleString("id-ID") : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPagination(totalItems, rows) {
  const pageCount = Math.max(1, Math.ceil(totalItems / rows));
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  const makeBtn = (label, disabled, onClick) => {
    const b = document.createElement("button");
    b.innerText = label;
    b.disabled = disabled;
    b.onclick = onClick;
    return b;
  };

  pagination.appendChild(
    makeBtn("Prev", currentPage === 1, () => {
      if (currentPage > 1) currentPage--;
      applyFilter();
    })
  );

  for (let i = 1; i <= pageCount; i++) {
    const btn = makeBtn(String(i), i === currentPage, () => {
      currentPage = i;
      applyFilter();
    });
    pagination.appendChild(btn);
  }

  pagination.appendChild(
    makeBtn("Next", currentPage === pageCount, () => {
      if (currentPage < pageCount) currentPage++;
      applyFilter();
    })
  );
}

async function loadDonasiTable() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getDonations");
    const data = await res.json();
    allDonations = (data.donations || []).reverse();
    initFilterTabs();
    applyFilter();

    const total = allDonations.reduce((sum, d) => sum + Number(d.nominal || 0), 0);
    document.getElementById("donasiTotal").innerText =
      "Total Semua Donasi: Rp " + total.toLocaleString("id-ID");
  } catch (err) {
    console.error("⚠️ Gagal load riwayat:", err);
  }
}

// ================== INIT ==================
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
      typeSpeed: 60,
      backSpeed: 40,
      backDelay: 1500,
      loop: true,
      showCursor: true,
      cursorChar: "|",
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
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: { 768: { slidesPerView: 1.5 }, 1024: { slidesPerView: 2.5 } },
    });
  }

  // Copy rekening
  window.copyRekening = function () {
    const rekening = document.getElementById("rekening")?.innerText || "";
    if (!rekening) return;
    navigator.clipboard
      .writeText(rekening)
      .then(() => alert("Nomor rekening berhasil dicopy: " + rekening));
  };

  // Toggle mobile menu
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("nav ul");
  toggle?.addEventListener("click", () => nav?.classList.toggle("show"));

  // Jadwal Sholat
  const KOTA_ID = 1209;
  (async () => {
    try {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const d = String(today.getDate()).padStart(2, "0");
      const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${KOTA_ID}/${y}/${m}/${d}`);
      const data = await res.json();
      if (data?.status && data?.data?.jadwal) {
        const j = data.data.jadwal;
        document.getElementById("tanggalSholat").innerText = `${j.tanggal} (${data.data.lokasi})`;
        document.getElementById("subuh").innerText = j.subuh;
        document.getElementById("dzuhur").innerText = j.dzuhur;
        document.getElementById("ashar").innerText = j.ashar;
        document.getElementById("maghrib").innerText = j.maghrib;
        document.getElementById("isya").innerText = j.isya;
      }
    } catch (e) {
      console.error("Error fetch jadwal sholat:", e);
    }
  })();
});
