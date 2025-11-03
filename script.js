// ================== Modal Logic ==================
const modal = document.getElementById("donasiModal");
const openModal = document.getElementById("openModal");
const closeModal = document.querySelector(".close");

openModal.onclick = () => (modal.style.display = "flex");
closeModal.onclick = () => (modal.style.display = "none");
window.onclick = (e) => {
  if (e.target == modal) modal.style.display = "none";
};

// ================== Config ==================
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwikahn2CdqMTAimkWxPj0fjbpl3-OxQvsNXrqgZ4BTS5ij_WlIDHKPJtHydTk1kukH/exec";

// ================== Submit Form Donasi ==================
document.getElementById("donasiForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector("button[type=submit]");
  submitBtn.disabled = true;             // matikan tombol biar gak dobel klik
  submitBtn.innerText = "Mengirim...";   // ubah teks biar user paham

  const nama = e.target.nama.value;
  const nominal = e.target.nominal.value;
  const file = e.target.bukti.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = async () => {
      console.log("📸 Base64 terbaca, panjang:", reader.result.length);
      await submitDonasi(nama, nominal, reader.result, submitBtn);
    };
    reader.readAsDataURL(file);
  } else {
    await submitDonasi(nama, nominal, "", submitBtn);
  }
});

async function submitDonasi(nama, nominal, bukti, submitBtn) {
  try {
    const payload = new URLSearchParams({ nama, nominal, bukti });

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
    });

    const text = await res.text();
    console.log("📤 Respon server:", text);

    if (text.includes("Success")) {
      alert("✅ Donasi berhasil dilaporkan!");
      document.getElementById("donasiForm").reset();
      modal.style.display = "none";
      loadTotalDonasi();
    } else {
      alert("⚠️ Gagal: " + text);
    }
  } catch (err) {
    console.error("❌ Error kirim data:", err);
    alert("❌ Gagal mengirim data.");
  } finally {
    // aktifkan kembali tombol setelah proses selesai
    submitBtn.disabled = false;
    submitBtn.innerText = "Laporkan";
  }
}

// ================== Ambil Total Donasi Realtime ==================
async function loadTotalDonasi() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getTotal");
    const data = await res.json();
    const total = data.total || 0;

    document.getElementById("donasi-terkumpul").innerHTML =
      `<strong>Terkumpul:</strong> Rp ${total.toLocaleString("id-ID")}`;

    const persen = Math.min((total / targetDonasi) * 100, 100);
    const bar = document.getElementById("progress-bar");
    bar.style.width = persen + "%";
    bar.innerText = Math.floor(persen) + "%";
  } catch (err) {
    console.error("⚠️ Gagal ambil total donasi:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTotalDonasi);

// RIWAYAT DONASI
let currentPage = 1;
const rowsPerPage = 5;

async function loadDonasiTable() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getDonations");
    const data = await res.json();
    const donations = data.donations.reverse(); // terbaru di atas

    renderTable(donations, currentPage, rowsPerPage);
    renderPagination(donations.length, rowsPerPage);
    
    // Hitung total semua nominal
    const total = donations.reduce((sum, d) => sum + Number(d.nominal || 0), 0);
    document.getElementById("donasiTotal").innerText =
      "Total Semua Donasi: Rp " + total.toLocaleString("id-ID");
  } catch (err) {
    console.error("⚠️ Gagal load riwayat:", err);
  }
}

function renderTable(data, page, rows) {
  const start = (page - 1) * rows;
  const end = start + rows;
  const paginatedItems = data.slice(start, end);

  const tbody = document.querySelector("#donasiTable tbody");
  tbody.innerHTML = "";

  paginatedItems.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(d.tanggal).toLocaleString("id-ID")}</td>
      <td>${d.nama}</td>
      <td>Rp ${Number(d.nominal).toLocaleString("id-ID")}</td>
      <td>${d.bukti ? `<a href="${d.bukti}" target="_blank">Lihat</a>` : "-"}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPagination(totalItems, rows) {
  const pageCount = Math.ceil(totalItems / rows);
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.disabled = (i === currentPage);
    btn.onclick = () => {
      currentPage = i;
      loadDonasiTable();
    };
    pagination.appendChild(btn);
  }
}

// Load riwayat saat halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
  loadTotalDonasi();
  loadDonasiTable();
});

// Simulasi data donasi (bisa diganti dari backend/PHP/DB)
let totalTerkumpul = 0; // Rp 45 juta
let targetDonasi   = 197818000; // Rp 100 juta

function updateDonasi() {
  const persen = Math.min((totalTerkumpul / targetDonasi) * 100, 100);

  document.getElementById("donasi-terkumpul").innerHTML =
    `<strong>Terkumpul:</strong> Rp ${totalTerkumpul.toLocaleString("id-ID")}`;

  document.getElementById("donasi-target").innerHTML =
    `<strong>Target:</strong> Rp ${targetDonasi.toLocaleString("id-ID")}`;

  const bar = document.getElementById("progress-bar");
  bar.style.width = persen + "%";
  bar.innerText = Math.floor(persen) + "%";
}

document.addEventListener("DOMContentLoaded", () => {
  updateDonasi();
});




document.addEventListener("DOMContentLoaded", () => {
  // Efek mengetik berulang
  new Typed("#typed-text", {
    strings: [
      "Pusat Ibadah, Dakwah, dan Ukhuwah Umat",
      "Tempat Silaturahmi Jamaah",
      "Membangun Generasi Qur'ani"
    ],
    typeSpeed: 60,
    backSpeed: 40,
    backDelay: 1500, // jeda sebelum menghapus
    loop: true,
    showCursor: true,
    cursorChar: "|"
  });

  // Swiper gallery init
  new Swiper(".myGallery", {
    slidesPerView: 1.2,
    spaceBetween: 20,
    loop: true,
    centeredSlides: true,
    pagination: { el: ".swiper-pagination", clickable: true },
    navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
    breakpoints: { 768: { slidesPerView: 1.5 }, 1024: { slidesPerView: 2.5 } }
  });
});

// Init Swiper untuk Galeri
document.addEventListener("DOMContentLoaded", () => {
  new Swiper(".myGallery", {
    slidesPerView: 1.2, // 70% slide + sisanya keliatan
    spaceBetween: 20,
    loop: true,
    centeredSlides: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    breakpoints: {
      768: { slidesPerView: 1.5 },   // tablet
      1024: { slidesPerView: 2.5 }   // desktop
    }
  });
});

function copyRekening() {
  const rekening = document.getElementById("rekening").innerText;
  navigator.clipboard.writeText(rekening).then(() => {
    alert("Nomor rekening berhasil dicopy: " + rekening);
  });
}

// Jadwal sholat auto-detect lokasi (yang udah gua kasih kemarin tetap ada)

// Toggle mobile menu
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const navMenu = document.querySelector("nav ul");

  toggle.addEventListener("click", () => {
    navMenu.classList.toggle("show");
  });
});

// ID kota dari API MyQuran, contoh: 1407 = Indramayu
const KOTA_ID = 1209;

async function loadJadwalSholat() {
  try {
    const today = new Date();
    const tahun = today.getFullYear();
    const bulan = String(today.getMonth() + 1).padStart(2, '0');
    const tanggal = String(today.getDate()).padStart(2, '0');

    const res = await fetch(`https://api.myquran.com/v2/sholat/jadwal/${KOTA_ID}/${tahun}/${bulan}/${tanggal}`);
    const data = await res.json();

    if (data.status && data.data) {
      const jadwal = data.data.jadwal;
      document.getElementById("tanggalSholat").innerText = `${jadwal.tanggal} (${data.data.lokasi})`;

      document.getElementById("subuh").innerText = jadwal.subuh;
      document.getElementById("dzuhur").innerText = jadwal.dzuhur;
      document.getElementById("ashar").innerText = jadwal.ashar;
      document.getElementById("maghrib").innerText = jadwal.maghrib;
      document.getElementById("isya").innerText = jadwal.isya;
    } else {
      console.log("Gagal ambil jadwal:", data);
    }
  } catch (error) {
    console.error("Error fetch jadwal sholat:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadJadwalSholat();

  // Animasi progress bar donasi
  const progress = document.querySelector(".progress-bar");
  progress.style.width = "60%"; // bisa ganti dari database
});
