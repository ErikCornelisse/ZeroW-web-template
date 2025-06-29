document.addEventListener('DOMContentLoaded', () => {
    const categoryView = document.getElementById('category-view');
    const activityView = document.getElementById('activity-view');
    const categoryCardsContainer = document.getElementById('category-cards-container');
    const activityCardsContainer = document.getElementById('activity-cards-container');
    const activityViewTitle = document.getElementById('activity-view-title');
    const infoCardsSection = document.getElementById('info-cards-section'); // Added this line

    const chorizoModal = document.getElementById('about-modal');
    const zerowModal = document.getElementById('zerow-modal');
    const homeModal = document.getElementById('home-modal');
    const splashModal = document.getElementById('splash-modal');
    const splashContinueButton = document.getElementById('splash-continue');
    const logo = document.getElementById('logo');
    const appTitle = document.getElementById('app-title');
    // const zerowDataSpaceButton = document.getElementById('zerow-data-space-button');
    // const closeChorizoModal = document.getElementById('close-about-modal');
    // const closeZerowModal = document.getElementById('close-zerow-modal');

    let allData = {};
    let appConfig = {};

    // Load app configuration
    async function loadAppConfig() {
        try {
            const response = await fetch('app.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            appConfig = await response.json();
            
            // Apply configuration to the page
            if (appConfig.pages && appConfig.pages.home && appConfig.pages.home.header) {
                const headerConfig = appConfig.pages.home.header;
                
                // Update title if specified
                if (headerConfig.title && appTitle) {
                    appTitle.textContent = headerConfig.title;
                }
                
                // Update icon if specified
                if (headerConfig.icon && logo) {
                    logo.src = headerConfig.icon;
                }
            }

            // Apply modal configurations dynamically
            if (appConfig.modals) {
                // Apply configuration for each modal using consistent naming pattern
                Object.keys(appConfig.modals).forEach(modalName => {
                    // Convert modal name to element ID using consistent pattern: modalName + '-modal'
                    const modalElementId = `${modalName}-modal`;
                    updateModal(modalName, appConfig.modals[modalName], modalElementId);
                });
            }
        } catch (error) {
            console.error("Could not fetch or parse app config:", error);
            // Continue with default values if config fails to load
        }
    }

    // Generic function to update modal content dynamically
    function updateModal(modalName, modalConfig, modalElementId) {
        const modal = document.getElementById(modalElementId);
        if (!modal) {
            console.warn(`Modal element with ID '${modalElementId}' not found for modal '${modalName}'`);
            return;
        }

        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) {
            console.warn(`Modal content not found in modal '${modalName}'`);
            return;
        }

        // Update modal logo/icon if specified
        const modalLogo = modalContent.querySelector('.modal-logo');
        if (modalLogo && modalConfig.icon) {
            // Check if icon is a URL/path (contains '/' or '.') or Material Icon name
            if (modalConfig.icon.includes('/') || modalConfig.icon.includes('.')) {
                // It's an image path
                modalLogo.src = modalConfig.icon;
                modalLogo.alt = getModalTitle(modalConfig) || `${modalName} Logo`;
            } else {
                // It's a Material Icon name - could be handled differently if needed
                // For now, we'll keep the existing image but update alt text
                modalLogo.alt = getModalTitle(modalConfig) || `${modalName} Icon`;
            }
        }

        // Update modal title (flexible field handling)
        const modalTitle = modalContent.querySelector('h2');
        if (modalTitle) {
            const titleText = getModalTitle(modalConfig);
            if (titleText) {
                modalTitle.textContent = titleText;
            }
        }

        // Update modal content
        const modalText = modalContent.querySelector('p');
        if (modalText && modalConfig.content) {
            modalText.textContent = modalConfig.content;
        }

        // Update modal footer link
        const modalLink = modalContent.querySelector('a');
        if (modalLink && modalConfig.footer) {
            updateModalFooter(modalLink, modalConfig.footer);
        }
    }

    // Helper function to get modal title from various possible fields
    function getModalTitle(modalConfig) {
        return modalConfig.title || modalConfig.header || null;
    }

    // Helper function to update modal footer (handles both HTML and plain text)
    function updateModalFooter(modalLink, footerContent) {
        if (footerContent.includes('<a')) {
            // Parse HTML content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = footerContent;
            const linkElement = tempDiv.querySelector('a');
            if (linkElement) {
                modalLink.href = linkElement.href;
                modalLink.textContent = linkElement.textContent;
                modalLink.target = linkElement.target || '_blank';
                // Copy CSS classes if specified
                if (linkElement.className) {
                    modalLink.className = linkElement.className;
                }
            }
        } else {
            // Plain text footer
            modalLink.textContent = footerContent;
        }
    }

    // Initialize app configuration
    loadAppConfig().then(() => {
        // Fetch data after config is loaded
        fetchData();
    });

    const categoryIcons = {
        "primary production": "eco",
        "processing and manufacturing (including valorisation)": "factory",
        "transportation": "local_shipping",
        "retail": "shopping_basket",
        "redistribution": "volunteer_activism",
        "food services": "restaurant",
        "households": "home",
        "general awareness-raising": "school",
        "whole supply chain": "link" // Fallback icon
    };

    // Helper function to capitalize the first word of a string
    function capitalizeFirstWord(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // --- Modal Logic ---
    // Show splash modal on page load
    splashModal.style.display = 'block';
    
    // Hide splash modal when continue button is clicked
    splashContinueButton.addEventListener('click', () => {
        splashModal.style.display = 'none';
    });

    logo.addEventListener('click', () => {
        chorizoModal.style.display = 'block';
        setFabState('modal');
    });
    appTitle.addEventListener('click', () => {
        chorizoModal.style.display = 'block';
        setFabState('modal');
    });
    // zerowDataSpaceButton.addEventListener('click', () => {
    //     zerowModal.style.display = 'block';
    //     setFabState('modal');
    // });

    // closeChorizoModal.addEventListener('click', () => {
    //     chorizoModal.style.display = 'none';
    //     if (fabState === 'info') {
    //         setFabState('home');
    //     }
    // });
    // closeZerowModal.addEventListener('click', () => {
    //     zerowModal.style.display = 'none';
    //     if (fabState === 'info') {
    //         setFabState('home');
    //     }
    // });

    window.addEventListener('click', (event) => {
        let modalWasClosed = false;
        if (event.target === chorizoModal) {
            chorizoModal.style.display = 'none';
            modalWasClosed = true;
        }
        if (event.target === zerowModal) {
            zerowModal.style.display = 'none';
            modalWasClosed = true;
        }
        if (event.target === homeModal) {
            homeModal.style.display = 'none';
            modalWasClosed = true;
        }
        if (event.target === splashModal) {
            splashModal.style.display = 'none';
            modalWasClosed = true;
        }
        if (modalWasClosed && fabState === 'modal') {
            setFabState(fabPreviousState);
        }
    });

    // --- Data Fetching and Rendering ---
    async function fetchData() {
        try {
            // Use data file from app config, fallback to data.json
            const dataFile = appConfig.app && appConfig.app.data ? appConfig.app.data : 'data.json';
            const response = await fetch(dataFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allData = await response.json();
            renderCategoryCards(allData.categories);
        } catch (error) {
            console.error("Could not fetch or parse data:", error);
            categoryCardsContainer.innerHTML = '<p style="color: red; text-align: center;">Error loading data. Please try again later.</p>';
        }
    }

    function getCategoryDescription(categoryName) {
        // Attempt to find a description from the meta section
        if (allData.meta && allData.meta.description) {
            // This is a simplified approach. You might need a more robust way
            // to link category names to their descriptions if they exist in meta.
            // For now, we'll use a generic placeholder or try a direct match if possible.
        }
        // Placeholder descriptions - replace with actual logic if descriptions are available
        const descriptions = {
            "primary production": "Activities related to the initial stage of food production, including farming, fishing, and harvesting.",
            "processing and manufacturing (including valorisation)": "Actions involving the transformation of raw agricultural products into food items, and valorisation of by-products.",
            "transportation": "Initiatives focused on the movement of food products through the supply chain.",
            "retail": "Measures taken by supermarkets, grocery stores, and other retailers to manage and reduce food waste.",
            "redistribution": "Efforts to redirect surplus food to those in need, often through food banks and charities.",
            "food services": "Actions by restaurants, canteens, and other food service providers to minimize waste.",
            "households": "Strategies and tips for consumers to reduce food waste at home.",
            "general awareness-raising": "Campaigns and educational programs aimed at increasing public knowledge about food waste.",
            "whole supply chain": "Initiatives that address food loss and waste across multiple stages of the food supply chain."
        };
        return descriptions[categoryName.toLowerCase()] || "A collection of activities related to this category.";
    }

    function renderCategoryCards(categories) {
        categoryCardsContainer.innerHTML = ''; // Clear previous cards
        if (!categories) {
            categoryCardsContainer.innerHTML = '<p>No categories found.</p>';
            return;
        }
        for (const categoryName in categories) {
            const activities = categories[categoryName];
            const card = document.createElement('div');
            card.className = 'bg-gray-card border border-gray-border border-l-4 border-l-accent-red rounded-lg p-6 sm:p-4 shadow-light cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-hover';

            const iconName = categoryIcons[categoryName.toLowerCase()] || categoryIcons["whole supply chain"];
            const capitalizedCategoryName = capitalizeFirstWord(categoryName);
            
            card.innerHTML = `
                <h3 class="mt-0 flex items-center text-xl font-semibold"><span class="material-icons-outlined mr-2 text-2xl">${iconName}</span> ${capitalizedCategoryName}</h3>
                <p class="text-sm text-primary-teal-light mb-2">${activities.length} activities</p>
                <p class="text-base text-primary-teal leading-relaxed">${getCategoryDescription(categoryName)}</p>
            `;
            card.addEventListener('click', () => showActivityView(categoryName, activities));
            categoryCardsContainer.appendChild(card);
        }
    }

    function renderActivityCards(activities) {
        activityCardsContainer.innerHTML = ''; // Clear previous cards
        if (!activities || activities.length === 0) {
            activityCardsContainer.innerHTML = '<p>No activities found for this category.</p>';
            return;
        }
        activities.forEach(activity => {
            if (Object.keys(activity).length === 0) return; // Skip empty activity objects

            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-card mb-4 p-4';

            let headerIcon = '';
            if (activity.favicon) {
                // Basic check to prevent broken images if path is just a placeholder or invalid
                if (activity.favicon.startsWith('images/logos/')) {
                     headerIcon = `<img src="${activity.favicon}" alt="Favicon" class="w-5 h-5 mr-2 object-contain">`;
                } else {
                    // Fallback or skip if favicon path seems incorrect
                    // console.warn('Invalid favicon path:', activity.favicon);
                }
            }

            const title = activity.action || 'N/A';
            const capitalizedTitle = capitalizeFirstWord(title);
            const goals = activity['goals/objectives'] || 'No description available.';
            
            let tagsHTML = '<div class="flex flex-wrap gap-2 mb-3">';
            if (activity.duration) {
                tagsHTML += `<span class="inline-block bg-tag text-tag px-3 py-1 rounded-full text-xs">${activity.duration}</span>`;
            }
            if (activity.country) {
                tagsHTML += `<span class="inline-block bg-tag text-tag px-3 py-1 rounded-full text-xs">${activity.country}</span>`;
            }
            if (activity['role of the action']) {
                tagsHTML += `<span class="inline-block bg-tag text-tag px-3 py-1 rounded-full text-xs">${activity['role of the action']}</span>`;
            }
            tagsHTML += '</div>';

            let sourceHTML = '';
            if (activity.source) {
                // Check if the source is a URL
                if (activity.source.startsWith('http') || activity.source.startsWith('www')) {
                    const displayUrl = activity.source.length > 100 ? activity.source.substring(0, 97) + '...' : activity.source;
                    sourceHTML = `<div><a href="${activity.source}" target="_blank" class="text-xs text-primary-teal break-all no-underline font-normal hover:underline hover:text-primary-teal-dark">${displayUrl}</a></div>`;
                } else {
                     sourceHTML = `<p class="text-xs text-primary-teal break-all">${activity.source}</p>`; // Display as text if not a clear URL
                }
            } else {
                sourceHTML = '<p class="text-xs text-primary-teal break-all">N/A</p>';
            }

            card.innerHTML = `
                <div class="flex items-center mb-3">
                    ${headerIcon}
                    <h4 class="text-lg font-medium text-gray-text-dark m-0">${capitalizedTitle}</h4>
                </div>
                <p class="text-sm text-gray-text-medium leading-relaxed mb-3">${goals}</p>
                ${tagsHTML}
                ${sourceHTML}
            `;
            activityCardsContainer.appendChild(card);
        });
    }

    function showActivityView(categoryName, activities) {
        const capitalizedCategoryName = capitalizeFirstWord(categoryName);
        activityViewTitle.textContent = `${capitalizedCategoryName} - Activities`;
        renderActivityCards(activities);
        categoryView.classList.add('hidden');
        activityView.classList.remove('hidden');
        if (infoCardsSection) { // Added this block
            infoCardsSection.classList.add('hidden');
        }
        window.scrollTo(0, 0); // Scroll to top
        setFabState('category'); // Set FAB state to category
    }

    function showCategoryView() {
        activityView.classList.add('hidden');
        categoryView.classList.remove('hidden');
        if (infoCardsSection) { // Added this block
            infoCardsSection.classList.remove('hidden');
        }
        window.scrollTo(0, 0); // Scroll to top
        setFabState('home'); // Set FAB state to home
    }

    // --- FAB Logic ---
    const fab = document.getElementById('fab');
    let fabState = 'home'; // Initial state
    let fabPreviousState = 'home'; // Previous state before a modal was opened

    const fabIcons = {
        'home': 'home',
        'category': 'chevron_left',
        'modal': 'close'
    };

    const fabActions = { // Actions are mostly for debugging, core logic is in event listeners
        'home': () => { console.log('FAB: Home action'); },
        'category': () => { console.log('FAB: Category action'); },
        'modal': () => { console.log('FAB: Modal action, closing modal'); } // Renamed from 'info'
    };

    function updateFab() {
        fab.textContent = fabIcons[fabState];
        // In a real scenario, you might also update aria-labels or titles
    }

    fab.addEventListener('click', () => {
        if (fabState === 'home') {
            homeModal.style.display = 'block';
            setFabState('modal');
        } else if (fabState === 'category') {
            showCategoryView(); // This will also set FAB state to home via its own call to setFabState
        } else if (fabState === 'modal') { // Changed from 'info'
            chorizoModal.style.display = 'none';
            zerowModal.style.display = 'none';
            homeModal.style.display = 'none';
            setFabState(fabPreviousState); // Revert to previous state
        } else {
            // Fallback for other states, if any are defined with actions
            if (fabActions[fabState]) {
                fabActions[fabState]();
            }
        }
    });

    // Function to allow other parts of the app to change FAB state
    function setFabState(newState) {
        if (fabIcons[newState]) {
            // If transitioning TO modal state, and not already in modal state,
            // save the state we are coming FROM.
            if (newState === 'modal' && fabState !== 'modal') {
                fabPreviousState = fabState;
            }
            fabState = newState;
            updateFab();
        }
    }

    // Initial FAB setup
    updateFab(); 

    // --- Info Card Animation Logic ---
    // Note: Animation logic removed since info cards are hidden on small screens
    // where only one card would be visible (<=687px)
});
