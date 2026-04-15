const phoneNumber = '9647842272224';
let favorites = JSON.parse(localStorage.getItem('hira_favorites')) || [];

document.addEventListener('DOMContentLoaded', () => {
    initPage();
    setupMobileScrollHeader();
});

function initPage() {
    // hiraProducts is loaded from data.js
    const isProductPage = window.location.pathname.includes('product.html');

    if (isProductPage) {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        renderProductDetail(productId);
    } else {
        renderProducts(hiraProducts);
        setupSearch();
    }
}

// --- High-End Mobile UX: Smart Header Scroll ---
function setupMobileScrollHeader() {
    let lastScrollY = window.scrollY;
    const header = document.querySelector('header');

    if (!header) return;

    window.addEventListener('scroll', () => {
        // Only apply on mobile screens
        if (window.innerWidth <= 768) {
            const currentScrollY = window.scrollY;
            
            // If scrolling down aggressively, hide header
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.classList.add('hide-on-scroll');
            } 
            // If scrolling up, immediately reveal it
            else if (currentScrollY < lastScrollY) {
                header.classList.remove('hide-on-scroll');
            }
            lastScrollY = currentScrollY;
        } else {
            // Guarantee visible on desktop
            header.classList.remove('hide-on-scroll');
        }
    }, { passive: true });
}

// --- Home Page Functions ---

function renderProducts(productsToRender) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #777;">لم يتم العثور على منتجات</div>';
        return;
    }

    productsToRender.forEach(product => {
        const isFav = favorites.includes(product.id.toString());

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x600?text=لا+توجد+صورة'">
                <button class="favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${product.id}', this)">
                    <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                </button>
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">${product.price} د.ع</div>
                <div class="size-selector" data-product-id="${product.id}">
                    <button type="button" onclick="selectSize(event, this)">52</button>
                    <button type="button" onclick="selectSize(event, this)">54</button>
                    <button type="button" onclick="selectSize(event, this)">56</button>
                    <button type="button" onclick="selectSize(event, this)">58</button>
                    <button type="button" onclick="selectSize(event, this)">60</button>
                </div>
                <button class="btn-primary" onclick="proceedToCheckout(event, '${product.id}', '${product.name}', '${product.price}')">اطلب الآن</button>
                <a href="product.html?id=${product.id}" class="btn-secondary">التفاصيل</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = hiraProducts.filter(p => p.name.toLowerCase().includes(query));
        renderProducts(filtered);
    });
}

// --- Product Detail Page Functions ---

function renderProductDetail(productId) {
    const container = document.getElementById('product-detail');
    if (!container) return;

    const product = hiraProducts.find(p => p.id.toString() === productId);

    if (!product) {
        container.innerHTML = '<div class="error-msg">المنتج غير موجود.</div>';
        return;
    }

    container.innerHTML = `
        <div class="product-detail-image">
           <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/600x800?text=لا+توجد+صورة'">
        </div>
        <div class="product-detail-info">
            <h1>${product.name}</h1>
            <div class="price">${product.price} د.ع</div>
            <p class="description">${product.description.replace(/\n/g, '<br>')}</p>
            
            <span class="size-label">اختاري المقاس:</span>
            <div class="size-selector" id="detail-size-selector" data-product-id="${product.id}">
                <button type="button" onclick="selectSizeDetail(this)">52</button>
                <button type="button" onclick="selectSizeDetail(this)">54</button>
                <button type="button" onclick="selectSizeDetail(this)">56</button>
                <button type="button" onclick="selectSizeDetail(this)">58</button>
                <button type="button" onclick="selectSizeDetail(this)">60</button>
            </div>
            
            <button class="btn-whatsapp" onclick="checkoutDetail('${product.name}', '${product.price}')">
                <i class="fa-brands fa-whatsapp"></i>
                اطلب الآن عبر واتساب
            </button>
        </div>
    `;
}

let selectedDetailSize = null;
function selectSizeDetail(btnElement) {
    const siblings = btnElement.parentElement.children;
    for (let btn of siblings) {
        btn.classList.remove('selected');
    }
    btnElement.classList.add('selected');
    selectedDetailSize = btnElement.innerText;
}

function checkoutDetail(name, price) {
    if (!selectedDetailSize) {
        alert("الرجاء اختيار المقاس أولاً.");
        return;
    }
    sendWhatsApp(name, price, selectedDetailSize);
}

// --- Shared Functions ---

function selectSize(event, btnElement) {
    event.stopPropagation();
    const container = btnElement.parentElement;
    const siblings = container.children;
    for (let btn of siblings) {
        btn.classList.remove('selected');
    }
    btnElement.classList.add('selected');
}

function proceedToCheckout(event, id, name, price) {
    event.stopPropagation();

    const selectorContainer = event.target.parentElement.querySelector('.size-selector');
    const selectedBtn = selectorContainer.querySelector('.selected');

    if (!selectedBtn) {
        alert("الرجاء اختيار المقاس أولاً.");
        return;
    }
    const size = selectedBtn.innerText;
    sendWhatsApp(name, price, size);
}

function sendWhatsApp(name, price, size) {
    const message = `مرحباً، أود طلب المنتج التالي:\n\nالاسم: ${name}\nالسعر: ${price}\nالمقاس: ${size}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

function toggleFavorite(event, id, btnElement) {
    event.stopPropagation();
    event.preventDefault();

    const index = favorites.indexOf(id.toString());
    const icon = btnElement.querySelector('i');

    if (index > -1) {
        favorites.splice(index, 1);
        btnElement.classList.remove('active');
        icon.classList.remove('fa-solid');
        icon.classList.add('fa-regular');
    } else {
        favorites.push(id.toString());
        btnElement.classList.add('active');
        icon.classList.remove('fa-regular');
        icon.classList.add('fa-solid');
    }
    localStorage.setItem('hira_favorites', JSON.stringify(favorites));
}

