// ================== CONFIG ==================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzeYyPiZ_Nvu1__b_NIOOFPNGu-BCid_plwiklYSATV6YAfj67BDEOI0JAYNSgqjidIig/exec";
let targetDonasi = 700_000_000; // 🎯 ubah sesuai target

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
  const jenis = e.target.jenis.value;
  const alamat = e.target.alamat?.value.trim() || "-";

  let nominal = 0;
  let payload = { action: "addDonation", nama, jenis, alamat };

  if (jenis === "Matrial") {
    const namaBarang = e.target.namaBarang.value.trim();
    const satuan = e.target.satuan.value.trim();
    const volume = e.target.volume.value.trim();
    const hargaSatuan = e.target.hargaSatuan.value.trim();
    nominal = Number(volume || 0) * Number(hargaSatuan || 0);

    if (!namaBarang || !satuan || !volume || !hargaSatuan) {
      alert("Mohon lengkapi semua data barang Matrial.");
      return;
    }
    Object.assign(payload, { nominal, namaBarang, satuan, volume, hargaSatuan });
  } else {
    nominal = e.target.nominal.value.trim();
    if (!nominal || Number(nominal) <= 0) {
      alert("Nominal wajib diisi.");
      return;
    }
    Object.assign(payload, { nominal });
  }

  if (jenis === "Cash" && !alamat) {
    alert("Alamat wajib diisi untuk donasi tunai (Cash).");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerText = "Mengirim...";

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload),
    });
    const text = await res.text();

    if (text.includes("Success")) {
      alert("✅ Donasi berhasil dilaporkan!");
      form.reset();
      modal.style.display = "none";
      await Promise.all([loadDonasiTable(), loadSummary(), loadPengeluaran()]);
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
});

// ================== TOGGLE FIELD BERDASARKAN JENIS ==================
(function handleJenisDonasi() {
  const jenisSel = document.getElementById("jenisInput");
  const uangFields = document.getElementById("uang-fields");
  const matrialFields = document.getElementById("matrial-fields");
  const alamatWrap = document.getElementById("alamat-wrapper");

  const vInput = document.getElementById("volumeInput");
  const hInput = document.getElementById("hargaSatuanInput");
  const tDisplay = document.getElementById("totalHargaDisplay");

  if (!jenisSel || !uangFields || !matrialFields) return;

  const toggleFields = () => {
    const jenis = jenisSel.value;
    const isMatrial = (jenis === "Matrial");
    const isCash = (jenis === "Cash");

    uangFields.style.display = isMatrial ? "none" : "block";
    matrialFields.style.display = isMatrial ? "block" : "none";
    alamatWrap.style.display = isCash ? "block" : "none";

    // Set required based on visibility
    form.nominal.required = !isMatrial;
    form.namaBarang.required = isMatrial;
    form.satuan.required = isMatrial;
    form.volume.required = isMatrial;
    form.hargaSatuan.required = isMatrial;
  };

  const calculateTotal = () => {
    const total = Number(vInput.value || 0) * Number(hInput.value || 0);
    tDisplay.value = total;
  };

  jenisSel.addEventListener("change", toggleFields);
  vInput.addEventListener("input", calculateTotal);
  hInput.addEventListener("input", calculateTotal);

  toggleFields();
})();


// ================== RIWAYAT DONASI + FILTER + PAGINATION ==================
let allDonations = [];
let selectedMonth = new Date().getMonth().toString();
let selectedYear = new Date().getFullYear().toString();
let selectedType = "uang"; // Default "uang" (Money)
let currentPage = 1;
let rowsPerPage = 10;

function initTimeFilters() {
  const monthButtons = document.querySelectorAll(".month-btn");
  const yearSelect = document.getElementById("filterYear");
  const typeButtons = document.querySelectorAll(".type-btn");

  // Tandai tipe yang aktif di awal
  typeButtons.forEach(btn => {
    if (btn.dataset.type === selectedType) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const updateMonthVisibility = (year) => {
    monthButtons.forEach((btn) => {
      const m = parseInt(btn.dataset.month);
      // Jika 2025, sembunyikan Jan-Sep (0-8), hanya muncul Okt-Des (9-11)
      if (year === "2025" && m < 9) {
        btn.style.display = "none";
      } else {
        btn.style.display = "inline-block";
      }
    });

    // Jika bulan yang sedang terpilih jadi tersembunyi, pindah ke Oktober
    if (year === "2025" && parseInt(selectedMonth) < 9) {
      selectedMonth = "9";
      monthButtons.forEach(b => b.classList.remove("active"));
      const octBtn = Array.from(monthButtons).find(b => b.dataset.month === "9");
      if (octBtn) octBtn.classList.add("active");
    }
  };

  // Set awal
  monthButtons.forEach(btn => {
    if (btn.dataset.month === selectedMonth) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  if (yearSelect) {
    yearSelect.value = selectedYear;
    updateMonthVisibility(selectedYear);

    yearSelect.addEventListener("change", (e) => {
      selectedYear = e.target.value;
      updateMonthVisibility(selectedYear);
      currentPage = 1;
      applyFilter();
    });
  }

  if (monthButtons.length) {
    monthButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        monthButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedMonth = btn.dataset.month;
        currentPage = 1;
        applyFilter();
      });
    });
  }

  if (typeButtons.length) {
    typeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        typeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedType = btn.dataset.type;
        currentPage = 1;
        applyFilter();
      });
    });
  }
}

function applyFilter() {
  let filtered = allDonations.filter((d) => {
    if (!d.tanggal) return false;
    const date = new Date(d.tanggal);
    const m = date.getMonth().toString();
    const y = date.getFullYear().toString();
    const jenis = (d.jenis || "").toLowerCase();

    const matchMonth = (selectedMonth === "all" || selectedMonth === m);
    const matchYear = (selectedYear === "all" || selectedYear === y);

    let matchType = false;
    if (selectedType === "uang") {
      matchType = (jenis === "transfer online" || jenis === "cash");
    } else if (selectedType === "matrial") {
      matchType = (jenis === "matrial");
    } else {
      matchType = true; // "all" if ever added
    }

    return matchMonth && matchYear && matchType;
  });

  renderTable(filtered, currentPage, rowsPerPage);
  renderPagination(filtered.length, rowsPerPage);

  // Update Dynamic Total Label (Lifetime per Category)
  const totalForType = allDonations
    .filter(d => {
      const j = (d.jenis || "").toLowerCase();
      if (selectedType === "uang") return (j === "transfer online" || j === "cash");
      return j === "matrial";
    })
    .reduce((sum, d) => sum + Number(d.nominal || 0), 0);

  const totalLabel = selectedType === "matrial" ? "Total Semua Donasi Matrial" : "Total Semua Donasi Uang";
  const donasiTotalEl = document.getElementById("donasiTotal");
  if (donasiTotalEl) {
    donasiTotalEl.innerText = `${totalLabel}: Rp ${totalForType.toLocaleString("id-ID")}`;
  }
}

function renderTable(data, page, rows) {
  const start = (page - 1) * rows;
  const end = start + rows;
  const items = data.slice(start, end);

  const tbody = document.querySelector("#donasiTable tbody");
  const thead = document.querySelector("#donasiTable thead");
  tbody.innerHTML = "";

  if (selectedType === "uang") {
    thead.innerHTML = `
      <tr>
        <th>Nama Donatur</th>
        <th>Nominal</th>
        <th>Alamat</th>
      </tr>
    `;

    items.forEach((d) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.nama || "-"}</td>
        <td>Rp ${Number(d.nominal || 0).toLocaleString("id-ID")}</td>
        <td>${d.alamat || "-"}</td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    thead.innerHTML = `
      <tr>
        <th>Nama Donatur</th>
        <th>Nama barang</th>
        <th>Satuan</th>
        <th>Volume</th>
        <th>Harga satuan</th>
        <th>Jumlah Harga</th>
      </tr>
    `;

    items.forEach((d) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${d.nama || "-"}</td>
        <td>${d.namaBarang || "-"}</td>
        <td>${d.satuan || "-"}</td>
        <td>${d.volume || "0"}</td>
        <td>Rp ${Number(d.hargaSatuan || 0).toLocaleString("id-ID")}</td>
        <td>Rp ${Number(d.nominal || 0).toLocaleString("id-ID")}</td>
      `;
      tbody.appendChild(tr);
    });
  }
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
    initTimeFilters();
    applyFilter();

    // Note: donasiTotal label is now handled by applyFilter() for dynamic type-based display
  } catch (err) {
    console.error("⚠️ Gagal load riwayat:", err);
  }
}

// ================== RIWAYAT PENGELUARAN + PAGINATION + SUMMARY ==================
let pengeluaranData = [];
let currentPagePengeluaran = 1;
const rowsPerPagePengeluaran = 10;

async function loadPengeluaran() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getExpenses");
    const { expenses } = await res.json();
    pengeluaranData = expenses || [];
    renderPengeluaranTable();
    renderPaginationPengeluaran();
  } catch (err) {
    console.error("Gagal memuat data pengeluaran:", err);
  }
}

function renderPengeluaranTable() {
  const tbody = document.querySelector("#pengeluaranTable tbody");
  const thead = document.querySelector("#pengeluaranTable thead");
  tbody.innerHTML = "";

  if (thead) {
    thead.innerHTML = `
      <tr>
        <th>Nama Barang</th>
        <th>Satuan</th>
        <th>Volume</th>
        <th>Harga Satuan</th>
        <th>Jumlah Harga</th>
      </tr>
    `;
  }

  const start = (currentPagePengeluaran - 1) * rowsPerPagePengeluaran;
  const end = start + rowsPerPagePengeluaran;
  const pageItems = pengeluaranData.slice(start, end);

  pageItems.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.namaBarang || "-"}</td>
      <td>${item.satuan || "-"}</td>
      <td>${item.volume || "0"}</td>
      <td>Rp ${Number(item.hargaSatuan || 0).toLocaleString("id-ID")}</td>
      <td>Rp ${Number(item.jumlahHarga || 0).toLocaleString("id-ID")}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPaginationPengeluaran() {
  const totalPages = Math.ceil(pengeluaranData.length / rowsPerPagePengeluaran);
  const container = document.getElementById("paginationPengeluaran");
  container.innerHTML = "";

  const makeBtn = (label, disabled, onClick) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.disabled = disabled;
    b.onclick = onClick;
    return b;
  };

  container.appendChild(makeBtn("Prev", currentPagePengeluaran === 1, () => {
    if (currentPagePengeluaran > 1) {
      currentPagePengeluaran--;
      renderPengeluaranTable();
      renderPaginationPengeluaran();
    }
  }));

  for (let i = 1; i <= totalPages; i++) {
    const btn = makeBtn(String(i), i === currentPagePengeluaran, () => {
      currentPagePengeluaran = i;
      renderPengeluaranTable();
      renderPaginationPengeluaran();
    });
    if (i === currentPagePengeluaran) btn.classList.add("active");
    container.appendChild(btn);
  }

  container.appendChild(makeBtn("Next", currentPagePengeluaran === totalPages, () => {
    if (currentPagePengeluaran < totalPages) {
      currentPagePengeluaran++;
      renderPengeluaranTable();
      renderPaginationPengeluaran();
    }
  }));
}

async function loadSummary() {
  try {
    const res = await fetch(SCRIPT_URL + "?action=getSummary");
    const data = await res.json();

    // Update Dashboard Stats
    const totalDonasi = Number(data.totalDonasi || 0);
    const totalUang = Number(data.totalUang || 0);
    const totalMatrial = Number(data.totalMatrial || 0);
    const totalKeluar = Number(data.totalKeluar || 0);
    const sisa = Number(data.sisa || 0);

    // Update Text Elements
    document.getElementById("donasi-terkumpul").innerHTML =
      `<strong>Terkumpul:</strong> Rp ${totalDonasi.toLocaleString("id-ID")}`;
    document.getElementById("donasi-target").innerHTML =
      `<strong>Target:</strong> Rp ${targetDonasi.toLocaleString("id-ID")}`;
    document.getElementById("total-uang").innerText = `Uang: Rp ${totalUang.toLocaleString("id-ID")}`;
    document.getElementById("total-matrial").innerText = `Matrial: Rp ${totalMatrial.toLocaleString("id-ID")}`;
    document.getElementById("totalPengeluaran").innerText = "Rp " + totalKeluar.toLocaleString("id-ID");
    document.getElementById("sisaDonasi").innerText = "Rp " + sisa.toLocaleString("id-ID");

    // Update Progress Bar
    const persen = Math.min((totalDonasi / targetDonasi) * 100, 100);
    const bar = document.getElementById("progress-bar");
    if (bar) {
      bar.style.width = persen + "%";
      bar.innerText = Math.floor(persen) + "%";
    }

    // Note: donasiTotal label is now handled by applyFilter() for dynamic type-based display

  } catch (err) {
    console.error("Gagal memuat ringkasan:", err);
  }
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  loadDonasiTable();
  loadPengeluaran();
  loadSummary();

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
