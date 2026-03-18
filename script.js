// ====== 変数の準備 ======
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let currentDateDisplay = new Date();
let chartInstance = null; // グラフを書き換えるための変数

// HTML要素
const currentMonthDisplay = document.getElementById('current-month-display');
const monthIncomeEl = document.getElementById('month-income');
const monthExpenseEl = document.getElementById('month-expense');
const monthBalanceEl = document.getElementById('month-balance');
const categorySummaryEl = document.getElementById('category-summary');
const monthHistoryEl = document.getElementById('month-history');

// 入力モーダル関連
const fabBtn = document.getElementById('fab-add');
const modalOverlay = document.getElementById('input-modal');
const closeBtn = document.getElementById('close-modal');
const form = document.getElementById('kakeibo-form');
const typeInput = document.getElementById('type');
const categoryRow = document.getElementById('category-row');
const categoryInput = document.getElementById('category');

// ====== 初期化 ======
function init() {
    renderDashboard();
}

// ====== モーダル（入力画面）の操作 ======
fabBtn.addEventListener('click', () => {
    setDefaultDate();
    modalOverlay.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    modalOverlay.classList.remove('active');
});

// モーダルの外側をクリックしたら閉じる
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.classList.remove('active');
    }
});

// 今日の日付をセット
function setDefaultDate() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    document.getElementById('date').value = `${yyyy}-${mm}-${dd}`;
}

// 収入が選ばれたらカテゴリ欄を消す（収入は給料などでカテゴリ分けしない簡易設定）
typeInput.addEventListener('change', () => {
    if (typeInput.value === 'income') {
        categoryRow.style.display = 'none';
        categoryInput.removeAttribute('required');
    } else {
        categoryRow.style.display = 'block';
        categoryInput.setAttribute('required', 'required');
    }
});

// ====== データの追加 ======
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const transaction = {
        id: Math.floor(Math.random() * 100000000),
        date: document.getElementById('date').value,
        amount: parseInt(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('type').value === 'income' ? '収入' : document.getElementById('category').value,
        memo: document.getElementById('memo').value || ''
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    form.reset();
    modalOverlay.classList.remove('active');
    
    // 表示の更新
    renderDashboard();
});

// データの削除
function deleteTransaction(id) {
    if(confirm("この記録を破棄しますか？")) {
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderDashboard();
    }
}

// ====== 月の切り替え ======
document.getElementById('prev-month').addEventListener('click', () => {
    currentDateDisplay.setMonth(currentDateDisplay.getMonth() - 1);
    renderDashboard();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDateDisplay.setMonth(currentDateDisplay.getMonth() + 1);
    renderDashboard();
});

// ====== ダッシュボード全体の描画 ======
function renderDashboard() {
    const targetYear = currentDateDisplay.getFullYear();
    const targetMonth = currentDateDisplay.getMonth() + 1;
    currentMonthDisplay.innerText = `${targetYear}年${targetMonth}月`;

    const targetPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const monthlyData = transactions.filter(t => t.date.startsWith(targetPrefix));

    let income = 0;
    let expense = 0;
    const categoryTotals = {};

    monthlyData.forEach(t => {
        if (t.type === 'income') {
            income += t.amount;
        } else {
            expense += t.amount;
            if (categoryTotals[t.category]) {
                categoryTotals[t.category] += t.amount;
            } else {
                categoryTotals[t.category] = t.amount;
            }
        }
    });

    // 収支の更新
    monthIncomeEl.innerText = income.toLocaleString() + '円';
    monthExpenseEl.innerText = expense.toLocaleString() + '円';
    monthBalanceEl.innerText = (income - expense).toLocaleString() + '円';

    // 円グラフの描画
    renderChart(income, expense);

    // カテゴリ別支出の描画
    renderCategorySummary(categoryTotals);

    // 履歴の描画
    renderHistoryList(monthlyData);
}

// ====== 円グラフの描画（Chart.js） ======
function renderChart(income, expense) {
    const ctx = document.getElementById('balanceChart').getContext('2d');
    
    // すでにグラフがあれば消してから書き直す
    if (chartInstance) {
        chartInstance.destroy();
    }

    const total = income + expense;
    // データがない場合はグレーの空グラフを表示
    if (total === 0) {
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['記録なし'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['#E2DDD5'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                cutout: '60%',
                plugins: { legend: { display: false } }
            }
        });
        return;
    }

    // 両方のパーセントを計算
    const incomePercent = Math.round((income / total) * 100);
    const expensePercent = Math.round((expense / total) * 100);

    chartInstance = new Chart(ctx, {
        type: 'doughnut', // 真ん中に穴が空いた円グラフ
        data: {
            // グラフのラベル（%と円を両方表示）
            labels: [
                `収入 ${incomePercent}% (${income.toLocaleString()}円)`, 
                `支出 ${expensePercent}% (${expense.toLocaleString()}円)`
            ],
            datasets: [{
                data: [income, expense],
                // 大正モダンに合わせた色（緑と赤）
                backgroundColor: ['#2E5041', '#8B2626'],
                borderColor: '#F4EEDD',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            cutout: '60%', // ドーナツの穴の大きさ
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: "'Shippori Mincho', serif", size: 14 },
                        color: '#3E2F26'
                    }
                }
            }
        }
    });
}

// ====== カテゴリ別支出の表示 ======
function renderCategorySummary(totals) {
    categorySummaryEl.innerHTML = '';
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

    if (sorted.length === 0) {
        categorySummaryEl.innerHTML = '<li style="color:#999; border:none;">支出記録がありません</li>';
        return;
    }

    sorted.forEach(([cat, amount]) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="item-name">${cat}</span>
            <span class="item-value val-expense">${amount.toLocaleString()}円</span>
        `;
        categorySummaryEl.appendChild(li);
    });
}

// ====== 履歴一覧の表示 ======
function renderHistoryList(data) {
    monthHistoryEl.innerHTML = '';
    
    if (data.length === 0) {
        monthHistoryEl.innerHTML = '<li style="color:#999; border:none;">記帳がありません</li>';
        return;
    }

    const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(t => {
        const li = document.createElement('li');
        const isIncome = t.type === 'income';
        const valClass = isIncome ? 'val-income' : 'val-expense';
        const sign = isIncome ? '+' : '-';
        
        const d = new Date(t.date);
        const dateStr = `${d.getMonth()+1}/${d.getDate()}`;

        // メモがあれば括弧をつけて表示
        const memoStr = t.memo ? `<span style="font-size:12px; color:#666; display:block;">${t.memo}</span>` : '';

        li.innerHTML = `
            <div style="flex: 1;">
                <div>
                    <span class="item-date">${dateStr}</span>
                    <span class="item-name">${t.category}</span>
                </div>
                ${memoStr}
            </div>
            <div style="text-align: right;">
                <div class="item-value ${valClass}">${sign}${t.amount.toLocaleString()}円</div>
                <button class="del-btn" onclick="deleteTransaction(${t.id})">消しゴム</button>
            </div>
        `;
        monthHistoryEl.appendChild(li);
    });
}

// 起動
init();
