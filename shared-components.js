// Shared components for all pages - 2004 Eilat website
// This file contains header and footer components that are shared across all pages

function createSharedHeader() {
    // Determine current page for highlighting
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    return `
        <!-- Logo Header -->
        <table width="100%" border="0" cellpadding="5" cellspacing="0">
            <tr>
                <td bgcolor="#FFFFFF">
                    <img src="Assets/logo.webp" alt="לוגו אילת 2004" style="max-height: 180px; max-width: 450px;">
                </td>
            </tr>
        </table>
        
        <!-- Navigation -->
        <table width="100%" border="0" cellpadding="5" cellspacing="0" bgcolor="#FFFFFF">
            <tr>
                <td align="center">
                    <font face="SHIMARG, Arial" size="4" color="#000000">
                        <a href="index.html" class="nav-link"${currentPage === 'index.html' ? ' style="font-weight: bold;"' : ''}>דף הבית</a> | 
                        <a href="gallery.html" class="nav-link"${currentPage === 'gallery.html' ? ' style="font-weight: bold;"' : ''}>גלריה</a> | 
                        <a href="contact.html" class="nav-link"${currentPage === 'contact.html' ? ' style="font-weight: bold;"' : ''}>צור קשר</a> | 
                        <a href="about.html" class="nav-link"${currentPage === 'about.html' ? ' style="font-weight: bold;"' : ''}>אודות</a>
                    </font>
                </td>
            </tr>
        </table>
    `;
}

function createSharedFooter() {
    return `
        <hr>
        <!-- Footer with Image and Text in Same Block -->
        <table width="100%" border="0" cellpadding="5" cellspacing="0" bgcolor="#FFFFFF">
            <tr>
                <td align="center">
                    <!-- Drink Image -->
                    <img src="Assets/drink1.jpg" alt="משקה אילת 2004" style="max-width: 50%; max-height: 100px; object-fit: contain; display: block; margin: 0 auto; margin-bottom: 5px;">
                    
                    <!-- Footer Text -->
                    <p align="center">
                        <font face="SHIMARG, Arial" size="2" color="#808080">
                             © אתר אילת 2004
                        </font>
                        <br>
                        <font face="SHIMARG, Arial" size="2" color="#808080">
                            מומלץ לצפייה ב-Internet Explorer 6.0 ומעלה
                        </font>
                        <br>
                        <font face="SHIMARG, Arial" size="2" color="#808080">
                            <a href="admin.html" class="nav-link">כניסת מנהל מערכת</a>
                        </font>
                    </p>
                </td>
            </tr>
        </table>
    `;
}

// Function to inject shared components into pages
function injectSharedComponents() {
    // Inject header
    const headerContainer = document.getElementById('shared-header');
    if (headerContainer) {
        headerContainer.innerHTML = createSharedHeader();
    }
    
    // Inject footer
    const footerContainer = document.getElementById('shared-footer');
    if (footerContainer) {
        footerContainer.innerHTML = createSharedFooter();
    }
    
    // Add navigation click handlers
    setupNavigationHandlers();
}

// Setup navigation handlers (all pages now exist)
function setupNavigationHandlers() {
    // All navigation links now point to real pages
    // No special handling needed
}

// Auto-inject components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    injectSharedComponents();
});
