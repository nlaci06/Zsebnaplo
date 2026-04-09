let transactions = JSON.parse(localStorage.getItem('walletData')) || [];
let expenseChart = null;
let balanceChart = null;

// Automatikus dátum beállítása a mai napra
function initDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('monthSelector').value = `${year}-${month}`;
}

initDate();

// Hozzáadás esemény
document.getElementById('addBtn').addEventListener('click', addItem);

function addItem() {
    const amountVal = document.getElementById('amount').value;
    const type = document.getElementById('type').value;
    const method = document.getElementById('method').value;
    const category = document.getElementById('category').value;
    const selectedMonth = document.getElementById('monthSelector').value;

    if (!amountVal || amountVal <= 0) {
        alert("Kérlek adj meg egy összeget!");
        return;
    }

    const now = new Date();
    const timestamp = now.toLocaleString('hu-HU', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit' 
    });

    const item = {
        id: Date.now(),
        amount: type === 'expense' ? -Math.abs(amountVal) : Math.abs(amountVal),
        method: method,
        category: type === 'income' ? '💰 Bevétel' : category,
        month: selectedMonth,
        fullTime: timestamp
    };

    transactions.push(item);
    saveAndRefresh();
    document.getElementById('amount').value = '';
}

function deleteItem(id) {
    if(confirm("Biztosan törlöd ezt a tételt?")) {
        transactions = transactions.filter(t => t.id !== id);
        saveAndRefresh();
    }
}

function saveAndRefresh() {
    localStorage.setItem('walletData', JSON.stringify(transactions));
    updateUI();
}

function updateUI() {
    const selectedMonth = document.getElementById('monthSelector').value;
    const list = document.getElementById('transactionList');
    
    // 1. EGYENLEG SZÁMÍTÁS (Mindenkori összes adat alapján)
    let cardBal = 0;
    let cashBal = 0;
    transactions.forEach(t => {
        if (t.method === 'kártya') cardBal += t.amount;
        else cashBal += t.amount;
    });

    document.getElementById('cardBalance').innerText = cardBal.toLocaleString() + " Ft";
    document.getElementById('cashBalance').innerText = cashBal.toLocaleString() + " Ft";

    // 2. LISTA FRISSÍTÉSE (Csak az adott hónap)
    const filtered = transactions.filter(t => t.month === selectedMonth);
    list.innerHTML = "";
    
    // Legújabb tétel legyen legfelül
    [...filtered].reverse().forEach(t => {
        const li = document.createElement('li');
        li.className = 't-item';
        li.innerHTML = `
            <div class="t-info">
                <strong>${t.category} <small>(${t.method})</small></strong>
                <small>${t.fullTime}</small>
            </div>
            <div class="t-right">
                <span class="t-amount" style="color: ${t.amount > 0 ? '#00b894' : '#ff7675'}">
                    ${t.amount.toLocaleString()} Ft
                </span>
                <button class="delete-btn" onclick="deleteItem(${t.id})">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });

    drawCharts(filtered, cardBal, cashBal);
}

function drawCharts(filteredData, cardTotal, cashTotal) {
    // Kiadási diagram (Jobb oldal)
    const expCtx = document.getElementById('expenseChart').getContext('2d');
    const expenses = filteredData.filter(t => t.amount < 0);
    const cats = [...new Set(expenses.map(t => t.category))];
    const totals = cats.map(c => Math.abs(expenses.filter(t => t.category === c).reduce((s, t) => s + t.amount, 0)));

    if (expenseChart) expenseChart.destroy();
    if (cats.length > 0) {
        expenseChart = new Chart(expCtx, {
            type: 'doughnut',
            data: { labels: cats, datasets: [{ data: totals, backgroundColor: ['#6c5ce7','#ff7675','#fdcb6e','#00cec9','#fd79a8','#55efc4','#74b9ff'] }] },
            options: { maintainAspectRatio: false }
        });
    }

    // Egyenleg diagram (Bal oldal)
    const balCtx = document.getElementById('balanceChart').getContext('2d');
    if (balanceChart) balanceChart.destroy();
    balanceChart = new Chart(balCtx, {
        type: 'pie',
        data: {
            labels: ['Kártya', 'KP'],
            datasets: [{
                data: [Math.max(0, cardTotal), Math.max(0, cashTotal)],
                backgroundColor: ['#3498db', '#f1c40f']
            }]
        },
        options: { plugins: { legend: { labels: { color: '#2d3436' } } } }
    });
}

// Indításkor első frissítés
updateUI();