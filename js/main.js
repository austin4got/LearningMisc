// DOM Element References
// Purpose: To store references to frequently accessed DOM elements for better performance and cleaner code.
const navigation = document.getElementById('navigation');
const contentDisplay = document.getElementById('content-display');
const introductionSection = document.getElementById('introduction');
const sidebar = document.getElementById('sidebar');
const mobileMenuButton = document.getElementById('mobile-menu-button');

// State Variables
// Purpose: To keep track of the application's state.
let activeLink = null; // Stores the currently active navigation link.
let contentManifest = []; // Will be populated by fetching manifest.json from the 'data' folder.

/**
 * Displays the content of a specific guide point.
 * Fetches the content from a JSON file based on the pointId.
 * @param {string} pointId - The ID of the guide point to display.
 */
async function displayContent(pointId) {
    // Hide the introduction section and scroll content display to top
    introductionSection.style.display = 'none';
    contentDisplay.scrollTop = 0;  

    // Find the item in the loaded manifest to access its metadata (e.g., title_en, type)
    const manifestItem = contentManifest.find(item => item.id === pointId);
    if (!manifestItem) {
         contentDisplay.innerHTML = '<p class="text-center p-8">項目未找到。Item not found in manifest.</p>';
         introductionSection.style.display = 'block'; // Show introduction if item not found
         return;
    }
    
    // Construct the file path for the specific content JSON
    const filePath = `data/${pointId}.json`;

    try {
        // Fetch the content JSON file
        const response = await fetch(filePath);
        if (!response.ok) {
            // If fetching fails, throw an error
            throw new Error(`HTTP error! status: ${response.status}, File: ${filePath}`);
        }
        const point = await response.json(); // Parse the JSON response

        // Generate HTML for improved sentences
        let improvedSentencesHtml = point.improvedSentences.map(s => `<li>${s}</li>`).join('');
        // Generate HTML for further examples, filtering out empty ones
        let furtherExamplesHtml = point.furtherExamples.filter(ex => ex && ex.trim() !== "").map(ex => `<li>${ex}</li>`).join('');

        // Generate HTML for the reason section based on content type
        let reasonSectionHtml = '';
        if (point.type === "improvement" && point.reasonEn && point.reasonZh) {
            reasonSectionHtml = `
            <section class="mb-6 bilingual-reason">
                <h3>改進原因 Reason for Improvement:</h3>
                <div class="english-reason">
                    <strong class="lang-label-en">EN</strong>
                    <p>${point.reasonEn}</p>
                </div>
                <div class="chinese-reason">
                    <strong class="lang-label-zh">ZH</strong>
                    <p>${point.reasonZh}</p>
                </div>
            </section>`;
        } else if (point.type === "translation" && point.reasonEn) {
            // For translations, show a simpler note section
            reasonSectionHtml = `
            <section class="mb-6">
                <h3>說明 Note:</h3>
                <p class="translation-placeholder">${point.reasonEn}</p>
            </section>`;
        }
        
        // Generate HTML for the further examples section if examples exist
        let furtherExamplesSectionHtml = '';
        if (furtherExamplesHtml) {
            furtherExamplesSectionHtml = `
            <section>
                <h3>更多範例 Further Examples:</h3>
                <ul class="list-disc list-inside pl-2 space-y-1 text-stone-700">
                    ${furtherExamplesHtml}
                </ul>
            </section>`;
        }

        // Populate the content display area with the generated HTML
        contentDisplay.innerHTML = `
            <h2 class="text-2xl font-bold text-sky-700 mb-1">${point.title}</h2>
            <p class="text-sm text-stone-500 mb-6">${point.title_en}</p>
            <section class="mb-6">
                <h3>${point.type === "translation" ? "中文表述 Chinese Expression" : "原文 Original Sentence"}:</h3>
                <p class="italic bg-stone-50 p-3 rounded-md text-stone-700">${point.originalSentence}</p>
            </section>
            <section class="mb-6">
                <h3>${point.type === "translation" ? "英文翻譯 English Translation" : "改進後的句子 Improved Sentence(s)"}:</h3>
                <ul class="list-disc list-inside pl-2 space-y-1 ${point.type === "translation" ? "text-blue-700" : "text-green-700"}">
                    ${improvedSentencesHtml}
                </ul>
            </section>
            ${reasonSectionHtml}
            ${furtherExamplesSectionHtml}
        `;
        
        // If on a small screen, close the sidebar after content is loaded
        if (window.innerWidth < 768) {  
            sidebar.classList.remove('open');
        }

    } catch (error) {
        // Log error and display an error message to the user
        console.error("Could not load content for " + pointId + ":", error);
        contentDisplay.innerHTML = `<p class="text-center p-8">無法載入內容： ${pointId}.json。<br>Error loading content: ${pointId}.json.</p>`;
        introductionSection.style.display = 'block'; // Show introduction section as fallback
    }
}

/**
 * Populates the navigation menu with links from the manifest.
 * @param {Array} manifestItems - An array of objects, each representing a navigation item.
 */
function populateNavigation(manifestItems) {
    navigation.innerHTML = ''; // Clear any existing navigation links
    manifestItems.forEach(item => {
        const link = document.createElement('a');
        link.href = `#${item.id}`;
        link.textContent = item.title; 
        link.className = 'block px-4 py-2 text-stone-700 rounded-md hover:bg-sky-100 hover:text-sky-700 transition-colors duration-150';
        
        // Event listener for navigation link clicks
        link.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default anchor behavior
            // Update active link styling
            if (activeLink) {
                activeLink.classList.remove('bg-sky-100', 'text-sky-700', 'font-semibold');
            }
            link.classList.add('bg-sky-100', 'text-sky-700', 'font-semibold');
            activeLink = link;
            
            displayContent(item.id); // Load and display the content for the clicked item
            
            // Update browser history
            try {
                history.pushState(null, '', `#${item.id}`);
            } catch (error) {
                console.warn("Could not push state to history:", error);
            }
        });
        navigation.appendChild(link);
    });
}

// Event listener for the mobile menu button to toggle sidebar visibility
mobileMenuButton.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Event listener to close the sidebar when clicking outside of it on mobile
document.addEventListener('click', function(event) {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnMenuButton = mobileMenuButton.contains(event.target);
    // If the click is outside the sidebar and not on the menu button, and the sidebar is open
    if (!isClickInsideSidebar && !isClickOnMenuButton && sidebar.classList.contains('open')) {
        if (window.innerWidth < 768) { // Only on small screens
            sidebar.classList.remove('open');
        }
    }
});

/**
 * Handles changes to the URL hash.
 * Loads content corresponding to the new hash.
 */
function handleHashChange() {
    const hash = window.location.hash.substring(1); // Get the hash value without the '#'
    // Check if the hash corresponds to a valid content item
    if (hash && contentManifest.some(p => p.id === hash)) {
        // Activate the corresponding link in the navigation
        const linkToActivate = Array.from(navigation.children).find(child => child.getAttribute('href') === `#${hash}`);
        if (linkToActivate) {
            if (activeLink) {
                activeLink.classList.remove('bg-sky-100', 'text-sky-700', 'font-semibold');
            }
            linkToActivate.classList.add('bg-sky-100', 'text-sky-700', 'font-semibold');
            activeLink = linkToActivate;
        }
        displayContent(hash); // Display the content for the hash
    } else {
        // If no valid hash, show the introduction
        introductionSection.style.display = 'block';
        contentDisplay.innerHTML = '<p class="text-center p-8">請從左側選單選擇一個項目開始學習。Please select an item from the menu on the left to start learning.</p>';
        // Deactivate any active link
        if (activeLink) {
            activeLink.classList.remove('bg-sky-100', 'text-sky-700', 'font-semibold');
            activeLink = null;
        }
        // Update browser history to remove invalid hash
        try {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (error) {
            console.warn("Could not replace state in history:", error);
        }
    }
}

/**
 * Initializes the application.
 * Fetches the manifest.json, populates navigation, and handles initial content display.
 */
async function initializeApp() {
    try {
        // Fetch the content manifest
        const response = await fetch('data/manifest.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, Failed to load manifest.json`);
        }
        contentManifest = await response.json(); // Store the loaded manifest
        
        populateNavigation(contentManifest); // Create navigation links
        handleHashChange(); // Process any initial hash in the URL (e.g., from a bookmark)

        // If there's no hash and manifest is loaded, show introduction
        if (!window.location.hash && contentManifest.length > 0) {
            introductionSection.style.display = 'block';
            contentDisplay.innerHTML = '<p class="text-center p-8">請從左側選單選擇一個項目開始學習。Please select an item from the menu on the left to start learning.</p>';
        } else if (contentManifest.length === 0) {
            // If manifest is empty, show an error
            introductionSection.style.display = 'block';
            contentDisplay.innerHTML = '<p class="text-center p-8">無法載入學習清單。Could not load the learning manifest.</p>';
        }

    } catch (error) {
        // Log and display error if initialization fails
        console.error("Failed to initialize app:", error);
        introductionSection.style.display = 'block';
        contentDisplay.innerHTML = '<p class="text-center p-8">應用程式初始化失敗，請檢查 manifest.json 是否存在且格式正確。App initialization failed. Please check if manifest.json exists and is correctly formatted.</p>';
        navigation.innerHTML = '<p class="text-red-500 p-4">無法載入選單</p>';
    }
}

// Event listener for hash changes in the URL
window.addEventListener('hashchange', handleHashChange);
// Event listener to initialize the app when the window loads
window.addEventListener('load', initializeApp);
