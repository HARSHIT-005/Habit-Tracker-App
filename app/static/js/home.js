import { fetchHabits, handleAddHabit, habits } from './habits.js';

let goals = [];

const motivationalQuotes = [
    "Opportunities don't happen. You create them. – Chris Grosser",
    "The harder you work for something, the greater you'll feel when you achieve it.",
    "Push yourself, because no one else is going to do it for you."
];

// Initialize page
document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem("token")
    if (!token) window.location.href = '/login'
    const response = await fetch("/api/home", {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    if (!response.ok) {
        return window.location.href = '/login'
    }
    document.getElementById('username').innerText = data.username;
    document.getElementById('consistencyScore').innerText = data.consistency_score;
    initializePage();
    setupEventListeners();
});

async function initializePage() {
    // Set random motivational quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    document.getElementById('motivationalQuote').textContent = randomQuote;

    // Update consistency icon color
    updateConsistencyIcon("0");

    await fetchHabits();
    await fetch_goals();
    await updateStats();
}

function setupEventListeners() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
    }

    // Modal event listeners
    const addHabitBtn = document.getElementById('addHabitBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const addHabitForm = document.getElementById('addHabitForm');
    const modal = document.getElementById('addHabitModal');

    addHabitBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    addHabitForm.addEventListener('submit', handleAddHabit);

    // Close modal when clicking backdrop
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
}

function updateConsistencyIcon(score) {
    const icon = document.getElementById('consistencyIcon');
    if (score >= 80) {
        icon.className = 'w-16 h-16 rounded-full bg-green-500 flex items-center justify-center';
    } else if (score >= 60) {
        icon.className = 'w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center';
    } else {
        icon.className = 'w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center';
    }
}

function getCategoryColor(category) {
    const colors = {
        Health: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        Learning: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        Fitness: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        Wellness: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
        Productivity: 'bg-yellow-100 text-blue-800 dark:bg-pink-900 dark:text-pink-200',
        Social: 'bg-brown-100 text-white-800 dark:bg-pink-900 dark:text-pink-200',
        Creative: 'bg-azure-100 text-black-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
}

async function fetch_goals() {
    try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/goals', {
            method: "GET",
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("failed to fetch goals")
        goals = await res.json();
        renderGoals();
    } catch (error) {
        console.log("failed to fetch goals", error)
    }
}

function renderGoals() {
    const goalsContainer = document.getElementById('goalsContainer');
    goalsContainer.innerHTML = '';

    goals.forEach(goal => {
        const goalCard = document.createElement('div');
        goalCard.className = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6';

        goalCard.innerHTML = `
                    <div class="flex justify-between">
                    <h4 class="text-base font-semibold text-gray-900 dark:text-white mb-4">${goal.title}</h4>
                    <button class=" p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" onclick="delete_goal('${goal._id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                    </div>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600 dark:text-gray-300">Progress</span>
                            <span class="font-semibold text-gray-900 dark:text-white">${goal.completion_percentage}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${goal.completion_percentage}%"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-600 dark:text-gray-300">Current Streak</p>
                                <p class="font-semibold text-gray-900 dark:text-white">${goal.current_streak} days</p>
                            </div>
                            <div>
                                <p class="text-gray-600 dark:text-gray-300">Target</p>
                                <p class="font-semibold text-gray-900 dark:text-white">${goal.target_days} days</p>
                            </div>
                            
                        </div>
                    </div>
                `;

        goalsContainer.appendChild(goalCard);
    });
}


async function updateStats() {
    if (!habits) return;
    const completedToday = habits.filter(h => h.completed_today).length;
    const totalHabits = habits.length;
    const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

    document.getElementById('completedHabits').textContent = `${completedToday}/${totalHabits}`;
    document.getElementById('activeGoals').textContent = goals.length;
    document.getElementById('bestStreak').textContent = `${bestStreak} days 🏆`;
}

function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = title;
    toast.classList.remove('translate-x-full');

    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3000);
}

function openModal() {
    document.getElementById('addHabitModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeModal() {
    document.getElementById('addHabitModal').classList.add('hidden');
    document.body.style.overflow = 'auto'; // Restore scrolling
    document.getElementById('addHabitForm').reset();
}

document.getElementById('logoutform').addEventListener('submit', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    window.location.href = '/'
})

export { closeModal, openModal, showToast, updateStats, getCategoryColor };