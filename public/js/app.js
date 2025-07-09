// Client-side JavaScript for Health Tracker

// Form validation
document.addEventListener('DOMContentLoaded', function() {
    // Add any global event listeners here
    
    // Form submission handlers
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
                
                // Re-enable button after 3 seconds in case of errors
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.dataset.originalText || 'Submit';
                }, 3000);
            }
        });
    });
    
    // Store original button text
    const submitBtns = document.querySelectorAll('button[type="submit"]');
    submitBtns.forEach(btn => {
        btn.dataset.originalText = btn.textContent;
    });
});

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
}

// Chart utilities
function createLineChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            ...options
        }
    });
}

// Food item management
function addFoodItemRow() {
    const container = document.getElementById('foodItemsContainer');
    if (!container) return;
    
    const rows = container.querySelectorAll('.food-item-row');
    const newIndex = rows.length;
    
    const newRow = document.createElement('div');
    newRow.className = 'food-item-row';
    newRow.innerHTML = `
        <select name="foodItems[${newIndex}][foodId]" class="food-select" required>
            <option value="">Select food item</option>
        </select>
        <input type="number" name="foodItems[${newIndex}][quantity]" placeholder="Quantity (g)" step="0.1" required>
        <button type="button" onclick="removeFoodItemRow(this)">Remove</button>
    `;
    
    container.appendChild(newRow);
    
    // Copy options from first select
    const firstSelect = container.querySelector('.food-select');
    const newSelect = newRow.querySelector('.food-select');
    
    if (firstSelect) {
        Array.from(firstSelect.options).forEach((option, index) => {
            if (index > 0) { // Skip the first empty option
                newSelect.appendChild(option.cloneNode(true));
            }
        });
    }
}

function removeFoodItemRow(button) {
    const row = button.closest('.food-item-row');
    if (row) {
        row.remove();
    }
}

// Confirmation dialogs
function confirmDelete(message = 'Are you sure you want to delete this item?') {
    return confirm(message);
}

// Toast notifications (simple implementation)
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    switch (type) {
        case 'success':
            toast.style.backgroundColor = '#28a745';
            break;
        case 'error':
            toast.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            toast.style.backgroundColor = '#ffc107';
            toast.style.color = '#212529';
            break;
        default:
            toast.style.backgroundColor = '#17a2b8';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add CSS animation for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Error handling for fetch requests
function handleFetchError(response) {
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
}

// Local storage utilities
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function loadFromLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return null;
    }
}