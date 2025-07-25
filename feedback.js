document.addEventListener('DOMContentLoaded', function() {
    // Load existing feedback cards
    loadFeedbackCards();
    
    // Handle form submission
    const form = document.getElementById('feedbackForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitFeedback();
    });
});

function submitFeedback() {
    // Get form data
    const feedbackType = document.getElementById('feedbackType').value;
    const priority = document.querySelector('input[name="priority"]:checked').value;
    const pageSection = document.getElementById('pageSection').value;
    const feedbackText = document.getElementById('feedbackText').value;
    const expectedResult = document.getElementById('expectedResult').value;

    // Validate required fields
    if (!pageSection || !feedbackText) {
        alert('Please fill in the page/section and feedback description.');
        return;
    }

    // Create feedback object
    const feedback = {
        id: Date.now(),
        type: feedbackType,
        priority: priority,
        pageSection: pageSection,
        text: feedbackText,
        expectedResult: expectedResult,
        timestamp: new Date().toLocaleString(),
        status: 'submitted'
    };

    // Save to localStorage (temporary storage)
    saveFeedback(feedback);
    
    // Submit to local server
    submitToLocalServer(feedback);
    
    // Add to display
    addFeedbackCard(feedback);
    
    // Reset form
    document.getElementById('feedbackForm').reset();
    document.querySelector('input[name="priority"][value="medium"]').checked = true;
    
    // Show success message
    showSuccessMessage();
}

function saveFeedback(feedback) {
    let feedbacks = JSON.parse(localStorage.getItem('siteFeedbacks') || '[]');
    feedbacks.unshift(feedback);
    localStorage.setItem('siteFeedbacks', JSON.stringify(feedbacks));
}

function loadFeedbackCards() {
    const feedbacks = JSON.parse(localStorage.getItem('siteFeedbacks') || '[]');
    feedbacks.forEach(feedback => addFeedbackCard(feedback));
}

function addFeedbackCard(feedback) {
    const container = document.getElementById('feedbackCards');
    
    const typeColors = {
        'update': 'bg-blue-100 border-blue-500',
        'create': 'bg-green-100 border-green-500',
        'delete': 'bg-red-100 border-red-500',
        'fix': 'bg-orange-100 border-orange-500',
        'design': 'bg-purple-100 border-purple-500'
    };
    
    const priorityColors = {
        'high': 'text-red-600',
        'medium': 'text-yellow-600',
        'low': 'text-green-600'
    };
    
    const priorityIcons = {
        'high': '🔴',
        'medium': '🟡',
        'low': '🟢'
    };
    
    const typeIcons = {
        'update': '🔄',
        'create': '➕',
        'delete': '🗑️',
        'fix': '🔧',
        'design': '🎨'
    };

    const card = document.createElement('div');
    card.className = `sticky-note p-6 rounded-lg border-l-4 ${typeColors[feedback.type]} transition-all duration-200`;
    card.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2">
                <span class="text-2xl">${typeIcons[feedback.type]}</span>
                <span class="font-bold text-gray-800 capitalize">${feedback.type}</span>
            </div>
            <div class="flex items-center gap-2">
                <span class="${priorityColors[feedback.priority]} font-medium">
                    ${priorityIcons[feedback.priority]} ${feedback.priority.toUpperCase()}
                </span>
                <span class="text-xs text-gray-500">${feedback.timestamp}</span>
            </div>
        </div>
        
        <div class="space-y-3">
            <div>
                <span class="font-medium text-gray-700">Page/Section:</span>
                <span class="text-gray-800">${feedback.pageSection}</span>
            </div>
            
            <div>
                <span class="font-medium text-gray-700">Request:</span>
                <p class="text-gray-800 mt-1">${feedback.text}</p>
            </div>
            
            ${feedback.expectedResult ? `
                <div>
                    <span class="font-medium text-gray-700">Expected Result:</span>
                    <p class="text-gray-800 mt-1">${feedback.expectedResult}</p>
                </div>
            ` : ''}
            
            <div class="flex justify-between items-center pt-3 border-t border-gray-200">
                <span class="text-sm font-medium text-gray-600">Status: 
                    <span class="text-blue-600 capitalize">${feedback.status}</span>
                </span>
                <div class="flex gap-2">
                    <button onclick="editFeedback('${feedback.id}')" class="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded">
                        ✏️ Edit
                    </button>
                    <button onclick="deleteFeedback('${feedback.id}')" class="text-xs bg-red-200 hover:bg-red-300 px-3 py-1 rounded">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(card);
}

async function submitToLocalServer(feedback) {
    try {
        console.log('📤 Submitting to local feedback server:', feedback);
        
        // Send to local webhook server
        const response = await fetch('http://localhost:3001/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Local server response:', result);

        // Update status to show it was sent locally
        updateFeedbackStatus(feedback.id, 'sent-to-developer');
        
        // Show notification that it was sent to developer
        showLocalSubmissionNotification(feedback.id);

    } catch (error) {
        console.error('Failed to submit to local server:', error);
        
        // Check if server is running
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
            updateFeedbackStatus(feedback.id, 'server-offline');
            showServerOfflineNotification();
        } else {
            updateFeedbackStatus(feedback.id, 'submission-error');
        }
    }
}

function getTypeEmoji(type) {
    const emojis = {
        'update': '🔄',
        'create': '➕',
        'delete': '🗑️',
        'fix': '🔧',
        'design': '🎨'
    };
    return emojis[type] || '📝';
}

function showLocalSubmissionNotification(feedbackId) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="text-xl">🎯</span>
            <div>
                <div class="font-bold mb-1">Sent to Developer!</div>
                <div class="text-sm opacity-90 mb-2">Your feedback has been delivered and a notification was sent locally.</div>
                <div class="text-xs opacity-80">The developer will review and implement your request.</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 6 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            document.body.removeChild(notification);
        }
    }, 6000);
}

function showServerOfflineNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-orange-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm';
    notification.innerHTML = `
        <div class="flex items-start gap-3">
            <span class="text-xl">⚠️</span>
            <div>
                <div class="font-bold mb-1">Developer Server Offline</div>
                <div class="text-sm opacity-90 mb-2">Your feedback was saved locally but couldn't reach the developer.</div>
                <div class="text-xs opacity-80">It will be sent when the server comes back online.</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 8 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            document.body.removeChild(notification);
        }
    }, 8000);
}

function updateFeedbackStatus(feedbackId, newStatus) {
    let feedbacks = JSON.parse(localStorage.getItem('siteFeedbacks') || '[]');
    const feedbackIndex = feedbacks.findIndex(f => f.id == feedbackId);
    if (feedbackIndex !== -1) {
        feedbacks[feedbackIndex].status = newStatus;
        localStorage.setItem('siteFeedbacks', JSON.stringify(feedbacks));
        
        // Reload the display
        document.getElementById('feedbackCards').innerHTML = '';
        loadFeedbackCards();
    }
}

function editFeedback(feedbackId) {
    let feedbacks = JSON.parse(localStorage.getItem('siteFeedbacks') || '[]');
    const feedback = feedbacks.find(f => f.id == feedbackId);
    if (feedback) {
        // Populate form with existing data
        document.getElementById('feedbackType').value = feedback.type;
        document.querySelector(`input[name="priority"][value="${feedback.priority}"]`).checked = true;
        document.getElementById('pageSection').value = feedback.pageSection;
        document.getElementById('feedbackText').value = feedback.text;
        document.getElementById('expectedResult').value = feedback.expectedResult || '';
        
        // Remove the old feedback
        deleteFeedback(feedbackId);
        
        // Scroll to form
        document.getElementById('feedbackForm').scrollIntoView({ behavior: 'smooth' });
    }
}

function deleteFeedback(feedbackId) {
    let feedbacks = JSON.parse(localStorage.getItem('siteFeedbacks') || '[]');
    feedbacks = feedbacks.filter(f => f.id != feedbackId);
    localStorage.setItem('siteFeedbacks', JSON.stringify(feedbacks));
    
    // Reload the display
    document.getElementById('feedbackCards').innerHTML = '';
    loadFeedbackCards();
}

function showSuccessMessage() {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="text-xl">✅</span>
            <span>Feedback submitted successfully!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}