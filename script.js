// Modal control functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

const STORAGE_ORDERS_KEY = 'shopOrders';
const STORAGE_USERS_KEY = 'registeredUsers';
const STORAGE_PRODUCTS_KEY = 'shopProducts';

function loadOrdersFromStorage() {
    const stored = localStorage.getItem(STORAGE_ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveOrdersToStorage() {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(adminOrders));
}

function getStoredUsers() {
    const stored = localStorage.getItem(STORAGE_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveUserToStorage(user) {
    const users = getStoredUsers();
    users.push(user);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

function authenticateUser(email, password) {
    const users = getStoredUsers();
    return users.find((user) => user.email === email && user.password === password);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Get all modal elements
const loginModal = document.getElementById('loginModal');
const guestModal = document.getElementById('guestModal');
const registerModal = document.getElementById('registerModal');

// Get all button elements
const loginBtn = document.getElementById('loginBtn');
const guestBtn = document.getElementById('guestBtn');
const registerBtn = document.getElementById('registerBtn');
const adminLoginBtn = document.getElementById('adminLoginBtn');

// Get all close buttons
const closeLoginModal = document.getElementById('closeLoginModal');
const closeGuestModal = document.getElementById('closeGuestModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');

loginBtn.addEventListener('click', () => openModal('loginModal'));
registerBtn.addEventListener('click', () => openModal('registerModal'));
guestBtn.addEventListener('click', () => openModal('guestModal'));
adminLoginBtn.addEventListener('click', () => {
    window.location.href = 'admin.html';
});

closeLoginModal.addEventListener('click', () => closeModal('loginModal'));
closeGuestModal.addEventListener('click', () => closeModal('guestModal'));
closeRegisterModal.addEventListener('click', () => closeModal('registerModal'));

const cartMenu = document.getElementById('cartMenu');
const cartModal = document.getElementById('cartModal');
const closeCartModal = document.getElementById('closeCartModal');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const placeOrderBtn = document.getElementById('placeOrderBtn');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');
const customerNameInput = document.getElementById('customerName');
const customerEmailInput = document.getElementById('customerEmail');
const customerPhoneInput = document.getElementById('customerPhone');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const guestForm = document.getElementById('guestForm');

// Close modal when clicking outside the modal content
window.addEventListener('click', (event) => {
    if (event.target === loginModal) closeModal('loginModal');
    if (event.target === guestModal) closeModal('guestModal');
    if (event.target === registerModal) closeModal('registerModal');
    if (event.target === cartModal) closeModal('cartModal');
});

// Close modal when pressing Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal('loginModal');
        closeModal('guestModal');
        closeModal('registerModal');
        closeModal('cartModal');
    }
});

let cart = [];
let adminOrders = loadOrdersFromStorage();
let guestInfo = null;

function updateCartMenu() {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = itemCount;
    if (itemCount > 0) {
        cartMenu.classList.remove('hidden');
        document.getElementById('cartLabel').textContent = `View Cart (${itemCount})`;
    } else {
        cartMenu.classList.add('hidden');
    }
}

function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty. Add a product to continue.</p>';
        cartTotal.textContent = '$0.00';
        return;
    }

    let total = 0;
    cart.forEach((item) => {
        total += item.price * item.quantity;
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-qty">Quantity: ${item.quantity}</div>
                <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <button class="btn btn-secondary" data-id="${item.id}">Remove</button>
        `;
        cartItem.querySelector('button').addEventListener('click', () => {
            cart = cart.filter((product) => product.id !== item.id);
            renderCartItems();
            updateCartMenu();
        });
        cartItemsContainer.appendChild(cartItem);
    });
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function openCart() {
    renderCartItems();
    openModal('cartModal');
}

cartMenu.addEventListener('click', openCart);
closeCartModal.addEventListener('click', () => closeModal('cartModal'));
continueShoppingBtn.addEventListener('click', () => closeModal('cartModal'));

function loadProductsFromStorage() {
    const stored = localStorage.getItem(STORAGE_PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : [];
}

function renderProducts() {
    const gallery = document.getElementById('productGallery');
    if (!gallery) return;
    gallery.innerHTML = '';
    const products = loadProductsFromStorage();
    if (!products || products.length === 0) {
        gallery.innerHTML = '<p class="no-products">No products available. Admins can add products in the admin dashboard.</p>';
        return;
    }

    products.forEach((prod) => {
        const card = document.createElement('div');
        card.className = 'ad-card';
        card.setAttribute('data-id', prod.id);
        card.setAttribute('data-name', prod.name);
        card.setAttribute('data-price', prod.price);
        card.innerHTML = `
            <img src="${prod.image}" alt="${prod.name}">
            <h3>${prod.name}</h3>
            <p>${prod.description || ''}</p>
            <button class="btn btn-add-cart">Add to Cart</button>
        `;

        const addButton = card.querySelector('.btn-add-cart');
        addButton.addEventListener('click', () => {
            const id = prod.id;
            const name = prod.name;
            const price = parseFloat(prod.price);
            const existing = cart.find((product) => product.id === id);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }
            updateCartMenu();
            alert(`${name} has been added to your cart.`);
        });

        gallery.appendChild(card);
    });
}

placeOrderBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Your cart is empty. Add products before placing an order.');
        return;
    }

    const name = customerNameInput.value.trim();
    const email = customerEmailInput.value.trim();
    const phone = customerPhoneInput.value.trim();

    if (!name || !validateEmail(email) || !phone) {
        alert('Please enter a valid name, email, and phone number before placing the order.');
        return;
    }

    const order = {
        id: Date.now(),
        items: cart.map((item) => ({ ...item })),
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        date: new Date().toLocaleString(),
        name,
        email,
        phone,
        status: 'pending',
    };
    adminOrders.unshift(order);
    saveOrdersToStorage();
    cart = [];
    updateCartMenu();
    closeModal('cartModal');
    customerNameInput.value = '';
    customerEmailInput.value = '';
    customerPhoneInput.value = '';
    alert('Your order has been placed and will be available in the admin interface.');
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!validateEmail(email) || password.length === 0) {
        alert('Please enter a valid email and password.');
        return;
    }

    const user = authenticateUser(email, password);
    if (!user) {
        alert('Login failed. Please check your email and password or register first.');
        return;
    }

    alert(`Welcome back, ${user.name}!`);
    closeModal('loginModal');
    loginForm.reset();
});

guestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('guestName').value.trim();
    const email = document.getElementById('guestEmail').value.trim();

    if (!name || !validateEmail(email)) {
        alert('Please enter a valid name and email.');
        return;
    }

    customerNameInput.value = name;
    customerEmailInput.value = email;
    alert(`Welcome, ${name}! You are logged in as a guest.`);
    closeModal('guestModal');
    guestForm.reset();
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirm').value;

    if (!name || !validateEmail(email) || password.length < 6) {
        alert('Please enter a valid name, email, and password with at least 6 characters.');
        return;
    }
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const users = getStoredUsers();
    if (users.some((user) => user.email === email)) {
        alert('This email is already registered. Please log in or use a different email.');
        return;
    }

    saveUserToStorage({ name, email, password });
    alert(`Registration successful! Welcome, ${name}.`);
    closeModal('registerModal');
    registerForm.reset();
});

updateCartMenu();
renderProducts();
