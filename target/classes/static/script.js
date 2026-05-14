const API_BASE = '/api';
let currentUserId = localStorage.getItem('finmanage_userId');
let currentUsername = localStorage.getItem('finmanage_username');
let allTransactions = []; // for filtering
let mainChartInstance = null;
let categoryChartInstance = null;

// ================= Authentication =================
function checkAuth() {
    if (!currentUserId) {
        document.getElementById('authOverlay').classList.add('active');
        document.getElementById('appContainer').style.display = 'none';
    } else {
        document.getElementById('authOverlay').classList.remove('active');
        document.getElementById('appContainer').style.display = 'flex';
        document.getElementById('greeting').innerText = `Welcome Back, ${currentUsername}!`;
        initApp();
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`${tab}Form`).classList.add('active');
    document.getElementById('authError').innerText = '';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { username: document.getElementById('l-username').value, password: document.getElementById('l-password').value };
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('finmanage_userId', data.id);
            localStorage.setItem('finmanage_username', data.username);
            currentUserId = data.id;
            currentUsername = data.username;
            checkAuth();
        } else {
            document.getElementById('authError').innerText = await res.text();
        }
    } catch (err) {
        console.error(err);
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = { username: document.getElementById('r-username').value, password: document.getElementById('r-password').value };
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('finmanage_userId', data.id);
            localStorage.setItem('finmanage_username', data.username);
            currentUserId = data.id;
            currentUsername = data.username;
            checkAuth();
        } else {
            document.getElementById('authError').innerText = await res.text();
        }
    } catch (err) {
        console.error(err);
    }
});

function logout() {
    localStorage.removeItem('finmanage_userId');
    localStorage.removeItem('finmanage_username');
    currentUserId = null;
    window.location.reload();
}

// ================= Core Logic =================
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'User-Id': currentUserId
    };
}

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    if(btn.innerText === 'Logout') return;
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        const targetId = e.target.getAttribute('data-target');
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        
        if (targetId === 'reports') renderCharts();
    });
});

// Modals
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// Formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Initialization
async function initApp() {
    await loadTransactions();
    await loadSummary();
    await loadBudgets();
    await loadSavings();
}

// ================= APIs & DOM =================
function addAlert(message, type="danger") {
    const container = document.getElementById('alertsContainer');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;
    alert.innerHTML = `<span>${message}</span> <span class="alert-close" onclick="this.parentElement.remove()">&times;</span>`;
    container.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

async function loadSummary() {
    try {
        const res = await fetch(`${API_BASE}/summary`, { headers: getHeaders() });
        const data = await res.json();
        
        document.getElementById('totalIncome').innerText = formatCurrency(data.totalIncome || 0);
        document.getElementById('totalExpense').innerText = formatCurrency(data.totalExpense || 0);
        document.getElementById('totalSavings').innerText = formatCurrency(data.savings || 0);
        
        const recent = [...allTransactions].reverse().slice(0, 5);
        const tbody = document.querySelector('#recentTransactionsTable tbody');
        tbody.innerHTML = '';
        recent.forEach(t => {
            const badgeClass = t.type === 'INCOME' ? 'income' : 'expense';
            tbody.innerHTML += `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.description || '-'}</td>
                    <td>${t.category}</td>
                    <td><span class="type-badge ${badgeClass}">${t.type}</span></td>
                    <td class="${badgeClass === 'income' ? 'text-success' : 'text-danger'}">
                        ${t.type === 'INCOME' ? '+' : '-'}${formatCurrency(t.amount)}
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Failed to load summary", e);
    }
}

async function loadTransactions() {
    try {
        const res = await fetch(`${API_BASE}/transactions`, { headers: getHeaders() });
        allTransactions = await res.json();
        filterTransactions();
    } catch (e) {
        console.error("Failed to load transactions", e);
    }
}

function filterTransactions() {
    const searchTerm = document.getElementById('searchTx').value.toLowerCase();
    const filterType = document.getElementById('filterType').value;
    
    let filtered = allTransactions.filter(t => {
        const matchesSearch = t.description?.toLowerCase().includes(searchTerm) || t.category?.toLowerCase().includes(searchTerm);
        const matchesType = filterType === 'ALL' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    const tbody = document.querySelector('#transactionsTable tbody');
    tbody.innerHTML = '';
    filtered.reverse().forEach(t => {
        const badgeClass = t.type === 'INCOME' ? 'income' : 'expense';
        tbody.innerHTML += `
            <tr>
                <td>${t.date}</td>
                <td>${t.description || '-'}</td>
                <td>${t.category}</td>
                <td><span class="type-badge ${badgeClass}">${t.type}</span></td>
                <td>${formatCurrency(t.amount)}</td>
                <td><button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button></td>
            </tr>
        `;
    });
}

async function loadBudgets() {
    try {
        const res = await fetch(`${API_BASE}/budgets`, { headers: getHeaders() });
        const budgets = await res.json();
        
        document.getElementById('alertsContainer').innerHTML = ''; // clear old alerts
        
        const tbody = document.querySelector('#budgetsTable tbody');
        tbody.innerHTML = '';
        budgets.forEach(b => {
            // Calculate spent amount for this category and month
            const [year, month] = b.monthYear.split('-');
            const spent = allTransactions.filter(t => {
                if(t.type !== 'EXPENSE') return false;
                if(t.category.toLowerCase() !== b.category.toLowerCase()) return false;
                const tDate = new Date(t.date);
                return tDate.getFullYear() == year && (tDate.getMonth() + 1) == month;
            }).reduce((sum, t) => sum + t.amount, 0);
            
            let statusClass = 'status-ok';
            let statusText = 'Under Budget';
            
            if (spent > b.amount) {
                statusClass = 'status-danger';
                statusText = 'Exceeded!';
                addAlert(`Budget exceeded for ${b.category} (${b.monthYear})!`, 'danger');
            } else if (spent > b.amount * 0.8) {
                statusClass = 'status-warn';
                statusText = 'Near Limit';
                addAlert(`Warning: You have used 80% of your budget for ${b.category}.`, 'warning');
            }
            
            tbody.innerHTML += `
                <tr>
                    <td>${b.monthYear}</td>
                    <td>${b.category}</td>
                    <td>${formatCurrency(b.amount)}</td>
                    <td>${formatCurrency(spent)}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="delete-btn" onclick="deleteBudget(${b.id})">Delete</button></td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Failed to load budgets", e);
    }
}

async function loadSavings() {
    try {
        const res = await fetch(`${API_BASE}/savings`, { headers: getHeaders() });
        const goals = await res.json();
        
        const container = document.getElementById('goalsContainer');
        container.innerHTML = '';
        goals.forEach(g => {
            const saved = g.savedAmount || 0;
            const percent = Math.min(100, Math.round((saved / g.targetAmount) * 100));
            
            container.innerHTML += `
                <div class="goal-card">
                    <h3>${g.name}</h3>
                    <p>Target: ${formatCurrency(g.targetAmount)} by ${g.targetDate}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%"></div>
                    </div>
                    <p>${percent}% Saved (${formatCurrency(saved)})</p>
                    <div class="goal-actions">
                        <input type="number" id="addfunds-${g.id}" class="add-funds-input" placeholder="Amount">
                        <button class="primary-btn" onclick="addFundsToGoal(${g.id})">Add</button>
                        <button class="delete-btn" onclick="deleteSavingsGoal(${g.id})">Del</button>
                    </div>
                </div>
            `;
        });
    } catch (e) { console.error(e); }
}

// ================= Forms =================
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        type: document.getElementById('t-type').value,
        amount: parseFloat(document.getElementById('t-amount').value),
        category: document.getElementById('t-category').value,
        date: document.getElementById('t-date').value,
        description: document.getElementById('t-description').value
    };
    await fetch(`${API_BASE}/transactions`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    closeModal('transactionModal');
    e.target.reset();
    initApp();
});

document.getElementById('budgetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        category: document.getElementById('b-category').value,
        amount: parseFloat(document.getElementById('b-amount').value),
        monthYear: document.getElementById('b-monthYear').value
    };
    await fetch(`${API_BASE}/budgets`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    closeModal('budgetModal');
    e.target.reset();
    loadBudgets();
});

document.getElementById('savingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        name: document.getElementById('s-name').value,
        targetAmount: parseFloat(document.getElementById('s-target').value),
        targetDate: document.getElementById('s-date').value,
        savedAmount: 0
    };
    await fetch(`${API_BASE}/savings`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
    closeModal('savingsModal');
    e.target.reset();
    loadSavings();
});

async function addFundsToGoal(id) {
    const input = document.getElementById(`addfunds-${id}`);
    const amt = parseFloat(input.value);
    if (!amt) return;
    await fetch(`${API_BASE}/savings/${id}/add`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({amount: amt}) });
    loadSavings();
}

async function deleteTransaction(id) {
    if(confirm("Delete this transaction?")) {
        await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE', headers: getHeaders() });
        initApp();
    }
}
async function deleteBudget(id) {
    if(confirm("Delete this budget?")) {
        await fetch(`${API_BASE}/budgets/${id}`, { method: 'DELETE', headers: getHeaders() });
        loadBudgets();
    }
}
async function deleteSavingsGoal(id) {
    if(confirm("Delete this goal?")) {
        await fetch(`${API_BASE}/savings/${id}`, { method: 'DELETE', headers: getHeaders() });
        loadSavings();
    }
}

// ================= Charts =================
function renderCharts() {
    const income = allTransactions.filter(t => t.type === 'INCOME').reduce((s,t) => s+t.amount, 0);
    const expense = allTransactions.filter(t => t.type === 'EXPENSE').reduce((s,t) => s+t.amount, 0);
    
    if (mainChartInstance) mainChartInstance.destroy();
    mainChartInstance = new Chart(document.getElementById('mainChart'), {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{ data: [income, expense], backgroundColor: ['#10b981', '#ef4444'] }]
        },
        options: { plugins: { legend: { labels: { color: '#fff' } } } }
    });

    const expTx = allTransactions.filter(t => t.type === 'EXPENSE');
    const catMap = {};
    expTx.forEach(t => catMap[t.category] = (catMap[t.category]||0) + t.amount);
    
    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(document.getElementById('categoryChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(catMap),
            datasets: [{ label: 'Expenses', data: Object.values(catMap), backgroundColor: '#3b82f6' }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } } }
    });
}

// Start
checkAuth();
