import { updateStats, closeModal, showToast, getCategoryColor } from './home.js'

export let habits = [];

async function fetchHabits() {
    try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/habits', {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error("failed to fetch habits")
        habits = await res.json();
        renderHabits();
    } catch (err) {
        console.log("failed to fetch habits", err);
    }
}

function renderHabits() {
    const habitsGrid = document.getElementById('habitsGrid');
    habitsGrid.innerHTML = '';

    habits.forEach(habit => {
        const habitCard = document.createElement('div');
        habitCard.className = `cursor-pointer transition-all duration-200 hover:shadow-lg rounded-lg border p-6 ${habit.completed_today
            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-600'
            : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
            }`;
        let duration = ""
        if (habit.frequency == "daily") duration = "days";
        else if (habit.frequency == "weekly") duration = "weeks";
        else duration = "months"
        habitCard.innerHTML = `
                    <div class="flex  items-start justify-between mb-4">
                        <div class="flex-1">
                            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${habit.title}</h4>
                            <div class="flex items-center space-x-2">
                                <span class="px-2 py-1 text-xs font-medium rounded ${getCategoryColor(habit.category)}">${habit.category}</span>
                                <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded border border-gray-200 dark:border-gray-600">${habit.frequency}</span>
                            </div>
                        </div>
                        <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" onclick="toggleHabit('${habit._id}')">
                            <i class="fas ${habit.completed_today ? 'fa-check-circle text-green-600' : 'fa-circle text-gray-400'} text-xl"></i>
                        </button>
                         <button class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" onclick="deletehabit('${habit._id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-300">Current Streak</span>
                        <span class="font-semibold text-gray-900 dark:text-white">${habit.streak} ${duration}🔥</span>
                    </div>
                `;

        habitsGrid.appendChild(habitCard);
    });
}

async function toggleHabit(habitId) {
    const habit = habits.find(h => String(h._id) === (habitId));
    if (habit) {
        habit.completed_today = !habit.completed_today;
        if (habit.completed_today == true) {
            habit.streak++;
        } else {
            habit.streak--;
        }
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/habits/${habitId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    "completed_today": habit.completed_today,
                    "streak": habit.streak
                })
            });
            if (!response.ok) {
                throw new Error('failed to update habit')
            }
        } catch (error) {
            showToast("error! please try again", "something went wrong");
        }
        fetchHabits();
        updateStats();
        showToast(
            habit.completed_today ? "Great job! 🎉" : "Habit unmarked!",
            habit.completed_today ? "You're building positive momentum!" : "Keep working towards your goals."
        );
    }
}

async function handleAddHabit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const newHabit = {
        title: formData.get('habitTitle'),
        category: formData.get('habitCategory'),
        frequency: formData.get('habitFrequency'),
    };
    // Add to habits array
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/add_habit', {
            method: 'POST',
            headers: {
                "Content-Type": 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newHabit)
        });
        if (!response.ok) {
            throw new Error("failed to add habit");
        }
    } catch (error) {
        console.log("Error", error);
        showToast("error happended", "please try again")
    }
    e.target.reset();
    // Close modal 
    closeModal();
    // Re-render habits
    fetchHabits();
    updateStats();

    //show success message

    showToast("Habit Added! 🎉", `"${newHabit.title}" has been added to your habits.`);
}

async function deletehabit(habitid) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`api/deletehabit/${habitid}`, {
            method: "DELETE",
            headers: {
                "Content-Type": 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
    }
    catch (error) {
        console.log("Error", error);
    }
    fetchHabits()
    updateStats()
}

// Make functions available globally for HTML onclick handlers
window.toggleHabit = toggleHabit;
window.deletehabit = deletehabit;

export { fetchHabits, handleAddHabit };
