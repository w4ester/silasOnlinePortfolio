document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Auto-update letter content when form fields change
    const writerNameInput = document.getElementById('writerName');
    const writerTitleInput = document.getElementById('writerTitle');
    const organizationInput = document.getElementById('organization');
    const letterContentTextarea = document.getElementById('letterContent');

    function updateLetterContent() {
        let content = letterContentTextarea.value;
        
        // Replace placeholders with actual values
        if (writerNameInput.value) {
            content = content.replace(/\[Your Name\]/g, writerNameInput.value);
        }
        if (writerTitleInput.value) {
            content = content.replace(/\[Your Title\]/g, writerTitleInput.value);
        }
        if (organizationInput.value) {
            content = content.replace(/\[Organization\]/g, organizationInput.value);
        }
        
        // Add current date
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        content = content.replace(/\[Date\]/g, today);
        
        letterContentTextarea.value = content;
    }

    // Add event listeners for real-time updates
    [writerNameInput, writerTitleInput, organizationInput].forEach(input => {
        input.addEventListener('input', updateLetterContent);
    });

    // Form submission handler
    const form = document.getElementById('recommendationForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            writerName: writerNameInput.value,
            writerTitle: writerTitleInput.value,
            writerEmail: document.getElementById('writerEmail').value,
            organization: organizationInput.value,
            letterContent: letterContentTextarea.value
        };

        // Validate required fields
        if (!formData.writerName || !formData.writerEmail || !formData.letterContent) {
            alert('Please fill in your name, email, and the letter content.');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.writerEmail)) {
            alert('Please enter a valid email address.');
            return;
        }

        // For now, we'll simulate sending the email with mailto
        // In a real implementation, you'd send this to a backend service
        sendRecommendation(formData);
    });

    function sendRecommendation(data) {
        // Create email content
        const subject = encodeURIComponent(`Recommendation Letter for Silas Forrester from ${data.writerName}`);
        const body = encodeURIComponent(`Dear Silas,

I have written a recommendation letter for you. Here are the details:

From: ${data.writerName}
Title: ${data.writerTitle}
Organization: ${data.organization}
Email: ${data.writerEmail}

Letter Content:
${data.letterContent}

Best regards,
${data.writerName}`);

        // Create mailto links
        const silasEmail = '1william.forrester@gmail.com';
        const writerEmail = data.writerEmail;
        
        // Send to Silas
        const silasMailto = `mailto:${silasEmail}?subject=${subject}&body=${body}`;
        
        // Send copy to writer
        const writerSubject = encodeURIComponent(`Copy of Your Recommendation Letter for Silas Forrester`);
        const writerBody = encodeURIComponent(`This is a copy of the recommendation letter you wrote for Silas Forrester:

${data.letterContent}

A copy has also been sent to Silas at ${silasEmail}.

Thank you for supporting Silas!`);
        const writerMailto = `mailto:${writerEmail}?subject=${writerSubject}&body=${writerBody}`;

        // Show success message
        showSuccessMessage();

        // Open email clients (note: this will open multiple windows)
        setTimeout(() => {
            window.open(silasMailto);
            setTimeout(() => {
                window.open(writerMailto);
            }, 1000);
        }, 2000);
    }

    function showSuccessMessage() {
        // Create success overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                <div class="text-green-500 text-6xl mb-4">✅</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Thank You!</h3>
                <p class="text-gray-600 mb-6">Your recommendation letter is being processed. Email clients will open shortly to send copies to both you and Silas.</p>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-ocean-blue text-white px-6 py-2 rounded-lg hover:bg-deep-blue transition-colors">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 10000);
    }

    // Add some interactive animations
    const skillCards = document.querySelectorAll('.bg-ocean-blue\\/10');
    skillCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.classList.add('transform', 'scale-105', 'transition-transform');
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('transform', 'scale-105', 'transition-transform');
        });
    });

    // Initialize letter content with current date
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    letterContentTextarea.value = letterContentTextarea.value.replace(/\[Date\]/g, today);
});