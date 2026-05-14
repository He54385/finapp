const API_BASE = '/api';

// Navigation Logic
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');

        // Update active section
        const targetId = e.target.getAttribute('data-target');
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        
        // Refresh data when switching tabs
        if (targetId === 'dashboard') loadSummary();
        else if (targetId === 'transactions') loadTransactions();
        else if (targetId === 'budget') loadBudgets();
    });
});

// Modal Logic
function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// Formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// API Calls & DOM Updates
async function loadSummary() {
    try {
        const res = await fetch(`${API_BASE}/summary`);
        const data = await res.json();
        
        document.getElementById('totalIncome').innerText = formatCurrency(data.totalIncome || 0);
        document.getElementById('totalExpense').innerText = formatCurrency(data.totalExpense || 0);
        document.getElementById('totalSavings').innerText = formatCurrency(data.savings || 0);
        
        // Load recent transactions for dashboard
        const tRes = await fetch(`${API_BASE}/transactions`);
        const tData = await tRes.json();
        const recent = tData.slice(-5).reverse(); // Last 5 transactions
        
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
        const res = await fetch(`${API_BASE}/transactions`);
        const data = await res.json();
        
        const tbody = document.querySelector('#transactionsTable tbody');
        tbody.innerHTML = '';
        data.reverse().forEach(t => {
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
    } catch (e) {
        console.error("Failed to load transactions", e);
    }
}

async function loadBudgets() {
    try {
        const res = await fetch(`${API_BASE}/budgets`);
        const data = await res.json();
        
        const tbody = document.querySelector('#budgetsTable tbody');
        tbody.innerHTML = '';
        data.forEach(b => {
            tbody.innerHTML += `
                <tr>
                    <td>${b.monthYear}</td>
                    <td>${b.category}</td>
                    <td>${formatCurrency(b.amount)}</td>
                    <td><button class="delete-btn" onclick="deleteBudget(${b.id})">Delete</button></td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Failed to load budgets", e);
    }
}

// Form Submissions
document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        type: document.getElementById('t-type').value,
        amount: parseFloat(document.getElementById('t-amount').value),
        category: document.getElementById('t-category').value,
        date: document.getElementById('t-date').value,
        description: document.getElementById('t-description').value
    };
    
    await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    closeModal('transactionModal');
    e.target.reset();
    loadTransactions();
    loadSummary();
});

document.getElementById('budgetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        category: document.getElementById('b-category').value,
        amount: parseFloat(document.getElementById('b-amount').value),
        monthYear: document.getElementById('b-monthYear').value
    };
    
    await fetch(`${API_BASE}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    closeModal('budgetModal');
    e.target.reset();
    loadBudgets();
});

// Delete Actions
async function deleteTransaction(id) {
    if(confirm("Are you sure you want to delete this transaction?")) {
        await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        loadTransactions();
        loadSummary();
    }
}

async function deleteBudget(id) {
    if(confirm("Are you sure you want to delete this budget?")) {
        await fetch(`${API_BASE}/budgets/${id}`, { method: 'DELETE' });
        loadBudgets();
    }
}

// Initial Load
window.onload = () => {
    loadSummary();
};
