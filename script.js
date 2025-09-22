// Modal logic
const modal = document.getElementById("donasiModal");
const openModal = document.getElementById("openModal");
const closeModal = document.querySelector(".close");

openModal.onclick = () => modal.style.display = "flex";
closeModal.onclick = () => modal.style.display = "none";
window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

// URL Google Apps Script
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbypQVKsFBeDtbpHozDjE9RDYoApy4GLKk80bOaNS5dlDCgXYWG4-TMiF8ZFnLGp31_a/exec";

// Submit form donasi
document.getElementById("donasiForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const file = formData.get("bukti");
  if (file && file.size > 0) {
    const reader = new FileReader();
    reader.onload = async () => {
      await submitDonasi({
        nama: formData.get("nama"),
        nominal: formData.get("nominal"),
        bukti: reader.result
      });
    };
    reader.readAsDataURL(file);
  } else {
    await submitDonasi({
      nama: formData.get("nama"),
      nominal: formData.get("nominal"),
      bukti: ""
    });
  }
});

async function submitDonasi(data) {
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams(data)
    });

    const text = await res.text();
    if (text.includes("Success")) {
      alert("✅ Donasi berhasil dilaporkan!");
      document.getElementById("donasiForm").reset();
      modal.style.display = "none";
      loadTotalDonasi();
    } else {
      alert("⚠️ Gagal: " + text);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Gagal mengirim data.");
  }
}

// Ambil total donasi realtime dari Google Sheet
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
    console.error("Gagal ambil total donasi:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTotalDonasi);



// Simulasi data donasi (bisa diganti dari backend/PHP/DB)
let totalTerkumpul = 45000000; // Rp 45 juta
let targetDonasi   = 100000000; // Rp 100 juta

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
