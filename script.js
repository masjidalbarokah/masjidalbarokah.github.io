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
