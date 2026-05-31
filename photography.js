(function () {
  var GAP = 6;
  var TARGET_HEIGHT = 300;
  var LAST_ROW_SCALE = 0.72;

  var source = document.getElementById('photo-source');
  var gallery = document.getElementById('photo-gallery');
  var loadingEl = document.getElementById('gallery-loading');
  var lightbox = document.getElementById('photo-lightbox');
  var lightboxImg = document.getElementById('photo-lightbox-img');
  var lightboxCount = document.getElementById('lightbox-count');
  var btnClose = document.getElementById('lightbox-close');
  var btnPrev = document.getElementById('lightbox-prev');
  var btnNext = document.getElementById('lightbox-next');

  if (!source || !gallery) return;

  var photos = [];
  var lightboxIndex = 0;

  function collectPhotos() {
    return Array.prototype.map.call(source.querySelectorAll('a'), function (link, index) {
      var img = link.querySelector('img');
      return {
        index: index,
        href: link.href,
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || 'Photography'
      };
    });
  }

  function loadDimensions(photo) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        photo.w = img.naturalWidth;
        photo.h = img.naturalHeight;
        photo.ratio = photo.w / photo.h;
        resolve(photo);
      };
      img.onerror = function () {
        photo.w = 4;
        photo.h = 3;
        photo.ratio = 4 / 3;
        resolve(photo);
      };
      img.src = photo.src;
    });
  }

  function buildRows(items, containerWidth) {
    var rows = [];
    var row = [];
    var aspectSum = 0;
    var i;

    for (i = 0; i < items.length; i++) {
      row.push(items[i]);
      aspectSum += items[i].ratio;

      var gaps = GAP * (row.length - 1);
      var rowWidth = aspectSum * TARGET_HEIGHT + gaps;

      if (rowWidth >= containerWidth) {
        var height = (containerWidth - gaps) / aspectSum;
        rows.push({ items: row.slice(), height: height });
        row = [];
        aspectSum = 0;
      }
    }

    if (row.length) {
      rows.push({ items: row, height: TARGET_HEIGHT * LAST_ROW_SCALE });
    }

    return rows;
  }

  function renderGallery() {
    var width = gallery.clientWidth || Math.min(window.innerWidth - 24, 1480);
    var rows = buildRows(photos, width);
    var fragment = document.createDocumentFragment();
    var r, rowEl, c, cell, img;

    for (r = 0; r < rows.length; r++) {
      rowEl = document.createElement('div');
      rowEl.className = 'gallery-row';

      for (c = 0; c < rows[r].items.length; c++) {
        var photo = rows[r].items[c];
        var cellWidth = photo.ratio * rows[r].height;

        cell = document.createElement('a');
        cell.className = 'gallery-cell';
        cell.href = photo.href;
        cell.style.width = cellWidth + 'px';
        cell.style.height = rows[r].height + 'px';
        cell.setAttribute('data-index', photo.index);

        img = document.createElement('img');
        img.src = photo.src;
        img.alt = photo.alt;
        img.loading = 'lazy';
        cell.appendChild(img);
        rowEl.appendChild(cell);
      }

      fragment.appendChild(rowEl);
    }

    gallery.innerHTML = '';
    gallery.appendChild(fragment);
    gallery.classList.add('is-ready');
    if (loadingEl) loadingEl.hidden = true;
  }

  function openLightbox(index) {
    lightboxIndex = index;
    updateLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function updateLightbox() {
    var photo = photos[lightboxIndex];
    lightboxImg.src = photo.href;
    lightboxImg.alt = photo.alt;
    lightboxCount.textContent = (lightboxIndex + 1) + ' / ' + photos.length;
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    document.body.style.overflow = '';
  }

  function stepLightbox(delta) {
    lightboxIndex = (lightboxIndex + delta + photos.length) % photos.length;
    updateLightbox();
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderGallery, 120);
  }

  gallery.addEventListener('click', function (event) {
    var cell = event.target.closest('.gallery-cell');
    if (!cell) return;
    event.preventDefault();
    openLightbox(parseInt(cell.getAttribute('data-index'), 10));
  });

  btnClose.addEventListener('click', closeLightbox);
  btnPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    stepLightbox(-1);
  });
  btnNext.addEventListener('click', function (e) {
    e.stopPropagation();
    stepLightbox(1);
  });
  lightbox.querySelector('.lightbox-stage').addEventListener('click', function (e) {
    if (e.target === lightboxImg) return;
    closeLightbox();
  });

  document.addEventListener('keydown', function (event) {
    if (!lightbox.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'ArrowLeft') stepLightbox(-1);
    if (event.key === 'ArrowRight') stepLightbox(1);
  });

  window.addEventListener('resize', onResize);

  photos = collectPhotos();
  Promise.all(photos.map(loadDimensions)).then(function () {
    renderGallery();
  });
})();
