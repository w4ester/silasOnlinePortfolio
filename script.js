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
        // Get the original template content first
        let content = letterContentTextarea.defaultValue || letterContentTextarea.getAttribute('data-original') || letterContentTextarea.value;
        
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
        
        // Update the textarea value
        letterContentTextarea.value = content;
        
        // Force a re-render to ensure proper display
        letterContentTextarea.style.height = 'auto';
        letterContentTextarea.style.height = letterContentTextarea.scrollHeight + 'px';
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
        // Create email content for Silas
        const subject = `Recommendation Letter for Silas Forrester from ${data.writerName}`;
        const emailBody = `Dear Silas,

I have written a recommendation letter for you. Here are the details:

From: ${data.writerName}
Title: ${data.writerTitle}
Organization: ${data.organization}
Email: ${data.writerEmail}

Letter Content:
${data.letterContent}

Best regards,
${data.writerName}`;

        // Show success message with copy options
        showSuccessMessage(subject, emailBody, data.writerEmail);
    }

    function showSuccessMessage(subject, emailBody, writerEmail) {
        // Create success overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-lg p-8 max-w-2xl mx-4 text-center max-h-screen overflow-y-auto">
                <div class="text-green-500 text-6xl mb-4">✅</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">Thank You!</h3>
                <p class="text-gray-600 mb-6">Your recommendation letter is ready to send. Click the button below to copy the email, then paste it into your preferred email app (Gmail, Outlook, etc.).</p>
                
                <div class="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                    <div class="mb-3">
                        <strong>To:</strong> 1william.forrester@gmail.com
                    </div>
                    <div class="mb-3">
                        <strong>Subject:</strong> ${subject}
                    </div>
                    <div class="mb-3">
                        <strong>Message:</strong>
                        <div class="bg-white p-3 rounded border mt-2 text-sm max-h-48 overflow-y-auto">${emailBody.replace(/\n/g, '<br>')}</div>
                    </div>
                </div>
                
                <div class="flex gap-3 justify-center mb-4">
                    <button onclick="copyEmailContent('${subject.replace(/'/g, "\\'")}', \`${emailBody.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)" class="bg-ocean-blue text-white px-6 py-2 rounded-lg hover:bg-deep-blue transition-colors">
                        📋 Copy Email Content
                    </button>
                    <button onclick="openGmail('${subject.replace(/'/g, "\\'")}', \`${emailBody.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)" class="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors">
                        📧 Open Gmail
                    </button>
                </div>
                
                <p class="text-sm text-gray-500 mb-4">After copying, open your email app and paste the content into a new message.</p>
                
                <button onclick="this.parentElement.parentElement.remove()" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (overlay.parentElement) {
                overlay.remove();
            }
        }, 30000);
    }

    // Copy email content to clipboard
    window.copyEmailContent = function(subject, body) {
        const emailContent = `To: 1william.forrester@gmail.com
Subject: ${subject}

${body}`;

        navigator.clipboard.writeText(emailContent).then(() => {
            // Show brief success message
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '✅ Copied!';
            button.classList.add('bg-green-500');
            button.classList.remove('bg-ocean-blue');
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('bg-green-500');
                button.classList.add('bg-ocean-blue');
            }, 2000);
        }).catch(() => {
            alert('Unable to copy automatically. Please manually copy the email content above.');
        });
    };

    // Open Gmail compose
    window.openGmail = function(subject, body) {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=1william.forrester@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(gmailUrl, '_blank');
    };


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

    // Store original content and initialize with current date
    const originalContent = letterContentTextarea.value;
    letterContentTextarea.setAttribute('data-original', originalContent);
    
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    letterContentTextarea.value = letterContentTextarea.value.replace(/\[Date\]/g, today);
});