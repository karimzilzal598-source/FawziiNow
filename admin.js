const ADMIN_STORAGE_KEY = 'adminAccounts';
const STORAGE_ORDERS_KEY = 'shopOrders';
const STORAGE_PRODUCTS_KEY = 'shopProducts';

const backHomeBtn = document.getElementById('backHomeBtn');
const ordersTabBtn = document.getElementById('ordersTabBtn');
const analyticsTabBtn = document.getElementById('analyticsTabBtn');
const adminsTabBtn = document.getElementById('adminsTabBtn');
const addProductTabBtn = document.getElementById('addProductTabBtn');
const adminRegisterPanel = document.getElementById('adminRegisterPanel');
const adminLoginPanel = document.getElementById('adminLoginPanel');
const adminDashboardPanel = document.getElementById('adminDashboardPanel');
const adminOrderList = document.getElementById('adminOrderList');
const adminRegisterForm = document.getElementById('adminRegisterForm');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminAddProductForm = document.getElementById('adminAddProductForm');
const adminAddProductPanel = document.getElementById('adminAddProductPanel');
const adminAccountsPanel = document.getElementById('adminAccountsPanel');
const adminList = document.getElementById('adminList');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const currentAdminNameEl = document.getElementById('currentAdminName');
const adminAddAdminForm = document.getElementById('adminAddAdminForm');

let adminAccount = null;
let adminAccounts = [];
let adminOrders = [];
let isLoggedIn = false;

function loadAdminAccounts() {
    const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveAdminAccounts(accounts) {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(accounts));
}

function loadOrders() {
    const stored = localStorage.getItem(STORAGE_ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveOrders() {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(adminOrders));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Toast helper
function showToast(message, type = 'info', timeout = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    container.appendChild(t);
    // force reflow
    void t.offsetWidth;
    t.classList.add('show');
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => container.removeChild(t), 300);
    }, timeout);
}

function showPanel(panel) {
    adminRegisterPanel.classList.add('hidden');
    adminLoginPanel.classList.add('hidden');
    adminDashboardPanel.classList.add('hidden');
    adminAddProductPanel.classList.add('hidden');
    const analyticsPanelEl = document.getElementById('analyticsPanel');
    if (analyticsPanelEl) analyticsPanelEl.classList.add('hidden');
    if (adminAccountsPanel) adminAccountsPanel.classList.add('hidden');

    if (panel === 'register') {
        adminRegisterPanel.classList.remove('hidden');
    } else if (panel === 'login') {
        adminLoginPanel.classList.remove('hidden');
    } else if (panel === 'dashboard') {
        adminDashboardPanel.classList.remove('hidden');
    } else if (panel === 'analytics') {
        if (analyticsPanelEl) analyticsPanelEl.classList.remove('hidden');
    } else if (panel === 'admins') {
        if (adminAccountsPanel) adminAccountsPanel.classList.remove('hidden');
    }
}

function setActiveSidebarButton(button) {
    ordersTabBtn.classList.remove('active');
    analyticsTabBtn.classList.remove('active');
    if (typeof adminsTabBtn !== 'undefined' && adminsTabBtn) adminsTabBtn.classList.remove('active');
    addProductTabBtn.classList.remove('active');
    button.classList.add('active');
}

function renderOrders() {
    adminOrderList.innerHTML = '';
    if (adminOrders.length === 0) {
        adminOrderList.innerHTML = '<p>No orders have been placed yet.</p>';
        return;
    }

    adminOrders.forEach((order) => {
        const orderItem = document.createElement('div');
        orderItem.className = 'admin-order-item';
        orderItem.innerHTML = `
            <div class="order-preview">
                <div>
                    <h3>Order #${order.id}</h3>
                    <p><strong>Email:</strong> ${order.email}</p>
                    <p><strong>Phone:</strong> ${order.phone}</p>
                    <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status}</span></p>
                </div>
                <button class="btn btn-secondary order-view-btn">View</button>
            </div>
            <div class="order-details hidden">
                <p><strong>Placed:</strong> ${order.date}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Items:</strong></p>
                <ul>
                    ${order.items.map((item) => `<li>${item.quantity} x ${item.name} ($${item.price.toFixed(2)})</li>`).join('')}
                </ul>
                <div class="order-actions">
                    <button class="btn btn-primary" data-action="accept" data-id="${order.id}">Accept</button>
                    <button class="btn btn-secondary" data-action="reject" data-id="${order.id}">Reject</button>
                </div>
            </div>
        `;

        const viewButton = orderItem.querySelector('.order-view-btn');
        const detailsPanel = orderItem.querySelector('.order-details');
        viewButton.addEventListener('click', () => {
            detailsPanel.classList.toggle('hidden');
        });

        orderItem.querySelector('[data-action="accept"]').addEventListener('click', () => {
            handleOrderAction(order.id, 'accept');
        });
        orderItem.querySelector('[data-action="reject"]').addEventListener('click', () => {
            handleOrderAction(order.id, 'reject');
        });

        adminOrderList.appendChild(orderItem);
    });
}

function updateCurrentAdminDisplay() {
    if (currentAdminNameEl) currentAdminNameEl.textContent = adminAccount ? `Signed in as: ${adminAccount.name}` : '';
}

function editAdmin(id) {
    const accounts = loadAdminAccounts();
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    const newName = prompt('Enter new name for admin:', acc.name);
    if (newName === null) return; // cancelled
    const newEmail = prompt('Enter new email for admin:', acc.email);
    if (newEmail === null) return;
    const newPassword = prompt('Enter new password for admin (leave blank to keep current):', '');
    if (!validateEmail(newEmail)) { alert('Invalid email format'); return; }
    acc.name = newName.trim() || acc.name;
    acc.email = newEmail.trim() || acc.email;
    if (newPassword) acc.password = newPassword;
    saveAdminAccounts(accounts);
    if (adminAccount && adminAccount.id === acc.id) adminAccount = acc;
    updateCurrentAdminDisplay();
    renderAdminList();
}

function handleOrderAction(orderId, action) {
    const order = adminOrders.find((item) => item.id === orderId);
    if (!order || order.status !== 'pending') return;

    if (action === 'accept') {
        order.status = 'accepted';
        sendEmail(order.email, 'Order Accepted', `Your order #${order.id} is being processed. We will contact you soon.`);
        showToast(`Order #${order.id} accepted. Confirmation sent to ${order.email}.`, 'success');
    } else {
        order.status = 'rejected';
        sendEmail(order.email, 'Order Rejected', `Your order #${order.id} was rejected due to product unavailability.`);
        showToast(`Order #${order.id} rejected. Notification sent to ${order.email}.`, 'warning');
    }
    saveOrders();
    renderOrders();
}

function sendEmail(to, subject, message) {
    // POST to local email relay server. Falls back to toast on error.
    try {
        fetch('http://localhost:3000/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to, subject, text: message })
        }).then(async (res) => {
            if (res.ok) {
                showToast(`Email queued to ${to}: ${subject}`, 'info');
            } else {
                const body = await res.json().catch(() => ({}));
                console.error('Email relay error', body);
                showToast('Failed to send email (relay error)', 'error');
            }
        }).catch((err) => {
            console.error('Email relay fetch failed', err);
            showToast('Failed to contact email relay', 'error');
        });
    } catch (err) {
        console.error(err);
        showToast('Unexpected error sending email', 'error');
    }
}

function showLoginOrRegister() {
    adminAccounts = loadAdminAccounts();
    if (!adminAccounts || adminAccounts.length === 0) {
        showPanel('register');
        setActiveSidebarButton(ordersTabBtn);
    } else {
        showPanel('login');
        setActiveSidebarButton(ordersTabBtn);
    }
}

backHomeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

ordersTabBtn.addEventListener('click', () => {
    setActiveSidebarButton(ordersTabBtn);
    showPanel('dashboard');
    renderOrders();
});

analyticsTabBtn.addEventListener('click', () => {
    setActiveSidebarButton(analyticsTabBtn);
    showPanel('analytics');
    renderAnalytics();
});

addProductTabBtn.addEventListener('click', () => {
    setActiveSidebarButton(addProductTabBtn);
    showPanel('dashboard');
    adminAddProductPanel.classList.remove('hidden');
});

adminsTabBtn.addEventListener('click', () => {
    setActiveSidebarButton(adminsTabBtn);
    showPanel('dashboard');
    if (adminAccountsPanel) {
        showPanel('admins');
        renderAdminList();
    }
});

function renderAdminList() {
    const accounts = loadAdminAccounts();
    if (!adminList) return;
    adminList.innerHTML = '';
    if (!accounts || accounts.length === 0) {
        adminList.innerHTML = '<li>No admin accounts found.</li>';
        return;
    }
    accounts.forEach(acc => {
        const li = document.createElement('li');
        li.className = 'admin-list-item';
        li.innerHTML = `
            <span>${acc.name} — ${acc.email}</span>
            <div class="admin-actions-inline">
                <button class="btn btn-secondary btn-edit-admin" data-id="${acc.id}">Edit</button>
                <button class="btn btn-secondary btn-remove-admin" data-id="${acc.id}">Remove</button>
            </div>`;
        const removeBtn = li.querySelector('.btn-remove-admin');
        removeBtn.addEventListener('click', () => { removeAdmin(acc.id); });
        const editBtn = li.querySelector('.btn-edit-admin');
        editBtn.addEventListener('click', () => { editAdmin(acc.id); });
        adminList.appendChild(li);
    });
}

function removeAdmin(id) {
    let accounts = loadAdminAccounts();
    if (accounts.length <= 1) {
        showToast('Cannot remove the last admin account.', 'error');
        return;
    }
    accounts = accounts.filter(a => a.id !== id);
    saveAdminAccounts(accounts);
    // If current admin removed themselves, log out
    if (adminAccount && adminAccount.id === id) {
        adminAccount = null;
        isLoggedIn = false;
        showToast('You removed your own admin access and have been logged out.', 'warning');
        showPanel('login');
    }
    renderAdminList();
}

adminRegisterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('adminRegisterName').value.trim();
    const email = document.getElementById('adminRegisterEmail').value.trim();
    const password = document.getElementById('adminRegisterPassword').value;
    const confirmPassword = document.getElementById('adminRegisterConfirm').value;

    if (!name || !validateEmail(email) || password.length < 6) {
        alert('Please enter a valid name, email, and password with at least 6 characters.');
        return;
    }
    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    adminAccounts = loadAdminAccounts();
    if (adminAccounts.some(a => a.email === email)) {
        alert('An admin with that email already exists. Choose a different email.');
        return;
    }
    adminAccount = { id: Date.now().toString(), name, email, password };
    adminAccounts.push(adminAccount);
    saveAdminAccounts(adminAccounts);
    isLoggedIn = true;
    adminOrders = loadOrders();
    showPanel('dashboard');
    renderOrders();
    showToast('Admin registration complete. Welcome!', 'success');
    updateCurrentAdminDisplay();
});

adminLoginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('adminLoginEmail').value.trim();
    const password = document.getElementById('adminLoginPassword').value;

    adminAccounts = loadAdminAccounts();
    const match = adminAccounts.find(a => a.email === email && a.password === password);
    if (!match) {
        alert('Invalid admin credentials. Please try again.');
        return;
    }
    adminAccount = match;
    isLoggedIn = true;
    adminOrders = loadOrders();
    showPanel('dashboard');
    renderOrders();
    showToast(`Welcome back, ${adminAccount.name}.`, 'success');
    updateCurrentAdminDisplay();
});

adminAddProductForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('newProductName').value.trim();
    const price = parseFloat(document.getElementById('newProductPrice').value);
    const image = document.getElementById('newProductImage').value.trim();
    const description = document.getElementById('newProductDescription').value.trim();

    if (!name || !price || !image || !description) {
        alert('Please fill in all product fields.');
        return;
    }

    const products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS_KEY) || '[]');
    products.push({ id: Date.now().toString(), name, price, image, description });
    localStorage.setItem(STORAGE_PRODUCTS_KEY, JSON.stringify(products));

    adminAddProductForm.reset();
    showToast(`${name} has been added to the product catalog.`, 'success');
});

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
        adminAccount = null;
        isLoggedIn = false;
        updateCurrentAdminDisplay();
        alert('You have been logged out.');
        showPanel('login');
    });
}

if (adminAddAdminForm) {
    adminAddAdminForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newAdminName').value.trim();
        const email = document.getElementById('newAdminEmail').value.trim();
        const password = document.getElementById('newAdminPassword').value;
        const confirm = document.getElementById('newAdminConfirm').value;
        if (!name || !validateEmail(email) || password.length < 6) {
            alert('Provide valid name, email, and password (min 6 chars).');
            return;
        }
        if (password !== confirm) { alert('Passwords do not match'); return; }
        const accounts = loadAdminAccounts();
        if (accounts.some(a => a.email === email)) { alert('Admin with that email exists'); return; }
        const newAcc = { id: Date.now().toString(), name, email, password };
        accounts.push(newAcc);
        saveAdminAccounts(accounts);
        adminAddAdminForm.reset();
        renderAdminList();
        alert('New admin added.');
    });
}

showLoginOrRegister();

function renderAnalytics() {
    const orders = adminOrders.slice();
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const acceptedRevenue = orders.filter(o => o.status === 'accepted').reduce((s, o) => s + (o.total || 0), 0);
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('acceptedRevenue').textContent = `$${acceptedRevenue.toFixed(2)}`;
    document.getElementById('ordersCount').textContent = orders.length;

    // Best-selling products
    const productCounts = {};
    orders.forEach(o => {
        (o.items || []).forEach(it => {
            const key = it.id + '|' + it.name;
            productCounts[key] = (productCounts[key] || 0) + (it.quantity || 0);
        });
    });
    const best = Object.entries(productCounts).sort((a,b)=> b[1]-a[1]).slice(0,10);
    const bestList = document.getElementById('bestSellingList');
    bestList.innerHTML = best.length ? best.map(([k,c])=>`<li>${k.split('|')[1]} — ${c} sold</li>`).join('') : '<li>No sales yet</li>';

    // Top visitors
    const visitorCounts = {};
    orders.forEach(o=>{ visitorCounts[o.email] = (visitorCounts[o.email]||0)+1; });
    const topVisitors = Object.entries(visitorCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const topVisitorsList = document.getElementById('topVisitorsList');
    topVisitorsList.innerHTML = topVisitors.length ? topVisitors.map(([email,c])=>`<li>${email} — ${c} orders</li>`).join('') : '<li>No visitors yet</li>';

    // Orders timeline by date (day)
    const timeline = {};
    orders.forEach(o=>{
        const day = (new Date(o.date)).toLocaleDateString();
        timeline[day] = (timeline[day]||0)+1;
    });
    const timelineList = document.getElementById('ordersTimelineList');
    timelineList.innerHTML = Object.keys(timeline).length ? Object.entries(timeline).sort().map(([day,c])=>`<li>${day} — ${c} orders</li>`).join('') : '<li>No orders yet</li>';
}
