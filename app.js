// INISIALISASI PETA
const map = L.map('map').setView([-7.025, 110.38], 12);

// SOLUSI BASEMAP: Esri World Imagery (Sangat direkomendasikan untuk Portofolio PT SMART Tbk.)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

// OPSI BASEMAP CADANGAN: OpenStreetMap (Hapus tanda komentar /* */ di bawah jika ingin menggunakan peta jalan yang bersih)
/*
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
*/

// MANAJEMEN Z-INDEX LAYER (Mencegah Layer RTRW menutupi Layer Mismatch)
map.createPane('rtrwPane');
map.getPane('rtrwPane').style.zIndex = 400;

map.createPane('mismatchPane');
map.getPane('mismatchPane').style.zIndex = 500; // Z-Index lebih tinggi agar selalu di atas

// DATA STATISTIK
const stats = {
    '2019': {mismatch_ha: 1047, persen: 2.7, hotspot: 'Kec. Mijen'}, 
    '2021': {mismatch_ha: 608, persen: 1.5, hotspot: 'Kec. Ngaliyan'},
    '2023': {mismatch_ha: 1216, persen: 3.1, hotspot: 'Kec. Mijen'}
};

let mismatchLayer = null;
let rtrwLayer = null;

// FUNGSI MEMUAT LAYER MISMATCH
function loadMismatch(year) {
    if (mismatchLayer) map.removeLayer(mismatchLayer);
    
    fetch('data/mismatch_' + year + '.geojson')
        .then(r => r.json())
        .then(data => {
            mismatchLayer = L.geoJSON(data, {
                pane: 'mismatchPane', // Memasukkan layer ke pane khusus
                style: {fillColor:'#F44336', color:'#B71C1C', weight:1.5, fillOpacity:0.8},
                onEachFeature: function(f, l) {
                    const p = f.properties;
                    let zona = p.ZONA_NAMA || p.zona_nama || p.NAMOBJ || p.POLA_RUANG || p.KELAS_1 || 'Kawasan Non-Terbangun';
                    if (zona === 'Poligon Utama' || !zona) zona = 'Kawasan Lindung/Hijau';

                    l.bindPopup(
                        '<div style="font-size: 13px; line-height: 1.6;">' +
                        '<b style="color:#B71C1C; font-size: 14px;">⚠ TIDAK SESUAI (' + year + ')</b><hr style="margin: 5px 0;">' +
                        '<b>Kelas Aktual:</b> Kawasan Terbangun<br>' +
                        '<b>Zona RTRW:</b> ' + zona +
                        '</div>'
                    );
                }
            });
            
            // Tampilkan layer jika checkbox sedang aktif
            if(document.getElementById('cb-mismatch').checked) {
                mismatchLayer.addTo(map);
            }
            updateStats(year);
        })
        .catch(err => console.error("Gagal memuat data Mismatch:", err));
}

// FUNGSI UPDATE TEKS STATISTIK
function updateStats(year) {
    const d = stats[year];
    document.getElementById('stat-content').innerHTML =
        '<b>Periode:</b> '+year+'<br>' +
        '<b>Luas Mismatch:</b> '+d.mismatch_ha+' ha<br>' +
        '<b>Persentase:</b> '+d.persen+'%<br>' + 
        '<b>Hotspot:</b> '+d.hotspot;
}

// MEMUAT LAYER RTRW (Hanya dipanggil sekali di awal)
fetch('data/rtrw.geojson')
    .then(r => r.json())
    .then(data => {
        rtrwLayer = L.geoJSON(data, {
            pane: 'rtrwPane', // Memasukkan layer ke pane dasar
            style: f => ({
                fillColor: (f.properties.KELAS==='TERBANGUN' || f.properties.KELAS_1==='TERBANGUN') ? '#FFE082' : '#A5D6A7',
                color: '#999', weight: 0.2, fillOpacity: 0.4
            }),
            onEachFeature: function(f, l) {
                l.bindPopup('<div style="font-size: 13px;"><b>Zonasi RTRW</b><br><b>Kelas:</b> ' + (f.properties.KELAS || f.properties.KELAS_1 || '-Layout') + '</div>');
            }
        });
        
        // Tampilkan layer jika checkbox sedang aktif
        if(document.getElementById('cb-rtrw').checked) {
            rtrwLayer.addTo(map);
        }
    })
    .catch(err => console.error("Gagal memuat data RTRW:", err));

// KONTROL EVENT LISTENER (TOMBOL TAHUN)
document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('click', function() {
        document.querySelectorAll('.btn').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
        loadMismatch(this.dataset.year);
    });
});

// KONTROL EVENT LISTENER (CHECKBOX MISMATCH)
document.getElementById('cb-mismatch').addEventListener('change', function() {
    if(mismatchLayer) {
        if (this.checked) map.addLayer(mismatchLayer);
        else map.removeLayer(mismatchLayer);
    }
});

// KONTROL EVENT LISTENER (CHECKBOX RTRW)
document.getElementById('cb-rtrw').addEventListener('change', function() {
    if(rtrwLayer) {
        if (this.checked) map.addLayer(rtrwLayer);
        else map.removeLayer(rtrwLayer);
    }
});

// MEMUAT DATA TAHUN 2023 SAAT WEB PERTAMA KALI DIBUKA
loadMismatch('2023');