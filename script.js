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
