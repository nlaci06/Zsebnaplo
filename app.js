let transactions = JSON.parse(localStorage.getItem('walletData')) || [];
let expenseChart = null;
let balanceChart = null;

// Kezdő hónap beállítása
document.getElementById('monthSelector').value = new Date().toISOString().slice(0, 7);

document.getElementById('addBtn').addEventListener('click', addItem);

function addItem() {
    const amt = document.getElementById('amount').value;
    const type = document.getElementById('type').value;
    const method = document.getElementById('method').value;
    const cat = document.getElementById('category').value;
    const month = document.getElementById('monthSelector').value;

    if (!amt || amt <= 0) return;

    transactions.push({
        id: Date.now(),
        amount: type === 'expense' ? -Math.abs(amt) : Math.abs(amt),
        method, 
        category: type === 'income' ? '💰 Bevétel' : cat,
        month, 
        fullTime: new Date().toLocaleString('hu-HU', {hour:'2-digit', minute:'2-digit', month:'2-digit', day:'2-digit'})
    });

    save();
    document.getElementById('amount').value = '';
}

function deleteItem(id) {
    if(confirm("Biztosan törlöd?")) {
        transactions = transactions.filter(t => t.id !== id);
        save();
    }
}

function resetEverything() {
    if(confirm("Törölsz minden adatot a memóriából?")) {
        localStorage.clear();
        transactions = [];
        location.reload();
    }
}

function save() {
    localStorage.setItem('walletData', JSON.stringify(transactions));
    updateUI();
}

function updateUI() {
    const month = document.getElementById('monthSelector').value;
    const list = document.getElementById('transactionList');
    
    let card = 0, cash = 0;
    transactions.forEach(t => t.method === 'kártya' ? card += t.amount : cash += t.amount);
    
    document.getElementById('cardBalance').innerText = card.toLocaleString() + " Ft";
    document.getElementById('cashBalance').innerText = cash.toLocaleString() + " Ft";

    const filtered = transactions.filter(t => t.month === month);
    list.innerHTML = "";
    [...filtered].reverse().forEach(t => {
        const li = document.createElement('li');
        li.className = 't-item';
        li.innerHTML = `
            <div><strong>${t.category}</strong><br><small>${t.fullTime} (${t.method})</small></div>
            <div>
                <span style="font-weight:bold; color:${t.amount > 0 ? '#00b894' : '#ff7675'}">${t.amount.toLocaleString()} Ft</span>
                <button class="delete-btn" onclick="deleteItem(${t.id})">🗑️</button>
            </div>`;
        list.appendChild(li);
    });

    drawCharts(filtered, card, cash);
}

function drawCharts(data, card, cash) {
    const expCtx = document.getElementById('expenseChart').getContext('2d');
    const expenses = data.filter(t => t.amount < 0);
    const cats = [...new Set(expenses.map(t => t.category))];
    const totals = cats.map(c => Math.abs(expenses.filter(t => t.category === c).reduce((s, t) => s + t.amount, 0)));

    if (expenseChart) expenseChart.destroy();
    if (cats.length > 0) {
        expenseChart = new Chart(expCtx, {
            type: 'doughnut',
            data: { labels: cats, datasets: [{ data: totals, backgroundColor: ['#6c5ce7','#ff7675','#fdcb6e','#00cec9','#fd79a8','#fab1a0','#55efc4'] }] },
            options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    }

    const balCtx = document.getElementById('balanceChart').getContext('2d');
    if (balanceChart) balanceChart.destroy();
    balanceChart = new Chart(balCtx, {
        type: 'pie',
        data: { labels: ['Kártya', 'KP'], datasets: [{ data: [Math.max(0,card), Math.max(0,cash)], backgroundColor: ['#3498db', '#f1c40f'] }] },
        options: { plugins: { legend: { position: 'bottom' } } }
    });
}

updateUI();
