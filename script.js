document.addEventListener('DOMContentLoaded', () => {
    const categoryView = document.getElementById('category-view');
    const activityView = document.getElementById('activity-view');
    const categoryCardsContainer = document.getElementById('category-cards-container');
    const activityCardsContainer = document.getElementById('activity-cards-container');
    const activityViewTitle = document.getElementById('activity-view-title');
    const infoCardsSection = document.getElementById('info-cards-section'); // Added this line

    const chorizoModal = document.getElementById('chorizo-modal');
    const zerowModal = document.getElementById('zerow-modal');
    const homeFabModal = document.getElementById('home-fab-modal');
    const splashModal = document.getElementById('splash-modal');
    const splashContinueButton = document.getElementById('splash-continue');
    const logo = document.getElementById('logo');
    const appTitle = document.getElementById('app-title');
    // const zerowDataSpaceButton = document.getElementById('zerow-data-space-button');
    // const closeChorizoModal = document.getElementById('close-chorizo-modal');
    // const closeZerowModal = document.getElementById('close-zerow-modal');

    let allData = {};

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
        if (event.target === homeFabModal) {
            homeFabModal.style.display = 'none';
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
            const response = await fetch('chorizo_activities.json');
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
            card.className = 'category-card';

            const iconName = categoryIcons[categoryName.toLowerCase()] || categoryIcons["whole supply chain"];
            const capitalizedCategoryName = capitalizeFirstWord(categoryName);
            
            card.innerHTML = `
                <h3><span class="material-icons-outlined category-icon">${iconName}</span> ${capitalizedCategoryName}</h3>
                <p class="activity-count">${activities.length} activities</p>
                <p class="category-description">${getCategoryDescription(categoryName)}</p>
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
            card.className = 'activity-card';

            let headerIcon = '';
            if (activity.favicon) {
                // Basic check to prevent broken images if path is just a placeholder or invalid
                if (activity.favicon.startsWith('images/logos/')) {
                     headerIcon = `<img src="${activity.favicon}" alt="Favicon">`;
                } else {
                    // Fallback or skip if favicon path seems incorrect
                    // console.warn('Invalid favicon path:', activity.favicon);
                }
            }

            const title = activity.action || 'N/A';
            const capitalizedTitle = capitalizeFirstWord(title);
            const goals = activity['goals/objectives'] || 'No description available.';
            
            let tagsHTML = '<div class="activity-tags">';
            if (activity.duration) {
                tagsHTML += `<span class="tag">${activity.duration}</span>`;
            }
            if (activity.country) {
                tagsHTML += `<span class="tag">${activity.country}</span>`;
            }
            if (activity['role of the action']) {
                tagsHTML += `<span class="tag">${activity['role of the action']}</span>`;
            }
            tagsHTML += '</div>';

            let sourceHTML = '';
            if (activity.source) {
                // Check if the source is a URL
                if (activity.source.startsWith('http') || activity.source.startsWith('www')) {
                    const displayUrl = activity.source.length > 100 ? activity.source.substring(0, 97) + '...' : activity.source;
                    sourceHTML = `<div class="source-link"><a href="${activity.source}" target="_blank">${displayUrl}</a></div>`;
                } else {
                     sourceHTML = `<p class="source">${activity.source}</p>`; // Display as text if not a clear URL
                }
            } else {
                sourceHTML = '<p class="source">N/A</p>';
            }

            card.innerHTML = `
                <div class="activity-card-header">
                    ${headerIcon}
                    <h4>${capitalizedTitle}</h4>
                </div>
                <p class="goals">${goals}</p>
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
        'modal': 'close' // Renamed from 'info', removed original 'close'
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
            homeFabModal.style.display = 'block';
            setFabState('modal');
        } else if (fabState === 'category') {
            showCategoryView(); // This will also set FAB state to home via its own call to setFabState
        } else if (fabState === 'modal') { // Changed from 'info'
            chorizoModal.style.display = 'none';
            zerowModal.style.display = 'none';
            homeFabModal.style.display = 'none';
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

    // Initial data fetch
    fetchData();

    // --- Info Card Animation Logic ---
    // Note: Animation logic removed since info cards are hidden on small screens
    // where only one card would be visible (<=687px)
});
