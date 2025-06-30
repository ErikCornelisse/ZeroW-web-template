document.addEventListener('DOMContentLoaded', () => {
    const categoryView = document.getElementById('category-view');
    const activityView = document.getElementById('activity-view');
    const categoryCardsContainer = document.getElementById('category-cards-container');
    const activityCardsContainer = document.getElementById('activity-cards-container');
    const activityViewTitle = document.getElementById('activity-view-title');
    const infoCardsSection = document.getElementById('info-cards-section'); // Added this line

    // Generic function to clear container and handle empty states
    function clearContainer(container, emptyMessage) {
        container.innerHTML = '';
        return {
            showEmpty: () => {
                container.innerHTML = `<p>${emptyMessage}</p>`;
            }
        };
    }

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

    // Generic function to update modal content dynamically using Mustache templates
    function updateModal(modalName, modalConfig, modalElementId) {
        const modal = document.getElementById(modalElementId);
        if (!modal) {
            console.warn(`Modal element with ID '${modalElementId}' not found for modal '${modalName}'`);
            return;
        }

        // Prepare data for Mustache template
        const templateData = prepareModalData(modalConfig);
        
        // Render modal content with Mustache
        const modalContent = Mustache.render(MustacheTemplates.modal, templateData);
        
        // Replace the modal content
        modal.innerHTML = modalContent;
    }

    // Initialize app configuration
    loadAppConfig().then(() => {
        // Fetch data after config is loaded
        fetchData();
        // Generate info cards if configured
        generateInfoCards();
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

    // --- Mustache.js Template System ---
    
    // Mustache templates (logic-less templates)
    const MustacheTemplates = {
        categoryCard: `
            <h3 class="mt-0 flex items-center text-xl font-semibold">
                <span class="material-icons-outlined mr-2 text-2xl">{{icon}}</span> 
                {{title}}
            </h3>
            <p class="text-sm text-primary-teal-light mb-2">{{count}} activities</p>
            <p class="text-base text-primary-teal leading-relaxed">{{description}}</p>
        `,
        
        activityCard: `
            <div class="flex items-center mb-3">
                {{#hasHeaderIcon}}
                <img src="{{headerIconSrc}}" alt="Favicon" class="w-5 h-5 mr-2 object-contain">
                {{/hasHeaderIcon}}
                <h4 class="text-lg font-medium text-gray-text-dark m-0">{{title}}</h4>
            </div>
            {{#hasDescription}}
            <p class="text-sm text-gray-text-medium leading-relaxed mb-3">{{description}}</p>
            {{/hasDescription}}
            {{#hasTags}}
            <div class="flex flex-wrap gap-2 mb-3">
                {{#tags}}
                <span class="inline-block bg-tag text-tag px-3 py-1 rounded-full text-xs">{{.}}</span>
                {{/tags}}
            </div>
            {{/hasTags}}
            {{{sourceHtml}}}
        `,
        
        sourceLink: `
            <div>
                <a href="{{url}}" target="_blank" 
                   class="text-xs text-primary-teal break-all no-underline font-normal hover:underline hover:text-primary-teal-dark">
                   {{displayText}}
                </a>
            </div>
        `,
        
        sourceText: `
            <p class="text-xs text-primary-teal break-all">{{text}}</p>
        `,
        
        infoCard: `
            <h4 class="mt-0 mb-2 text-xl font-semibold text-primary-teal">{{header}}</h4>
            <p class="mb-0 text-base text-primary-teal">{{content}}</p>
            {{#hasFooter}}
            <p class="text-sm text-primary-teal-light mt-2">{{footer}}</p>
            {{/hasFooter}}
        `,
        
        modal: `
            <div class="bg-off-white my-[10%] mx-auto p-6 border border-gray-medium w-4/5 max-w-2xl rounded-lg shadow-modal text-primary-teal relative">
                <img src="{{iconSrc}}" alt="{{iconAlt}}" class="absolute top-6 left-6 w-10 h-10 object-contain">
                <h2 class="text-primary-teal mt-0 pl-14 mb-4 leading-10">{{title}}</h2>
                <p class="leading-relaxed mb-4 text-base text-black">{{content}}</p>
                <a href="{{linkUrl}}" target="_blank" class="text-primary-teal no-underline font-normal text-base hover:underline">{{linkText}}</a>
            </div>
        `
    };

    // --- Data Preparation Functions for Mustache Templates ---
    
    // Prepare data for category card template
    function prepareCategoryCardData(categoryName, activities) {
        const iconName = categoryIcons[categoryName.toLowerCase()] || categoryIcons["whole supply chain"];
        const capitalizedCategoryName = capitalizeFirstWord(categoryName);
        const description = getCategoryDescription(categoryName);
        
        return {
            icon: iconName,
            title: capitalizedCategoryName,
            count: activities.length,
            description: description
        };
    }

    // Prepare data for activity card template
    function prepareActivityCardData(activity) {
        const title = activity.action || 'N/A';
        const capitalizedTitle = capitalizeFirstWord(title);
        const goals = activity['goals/objectives'] || 'No description available.';
        
        // Avoid duplication: if goals/objectives is the same as action, use empty description
        const description = (goals && goals.toLowerCase() !== title.toLowerCase()) ? goals : '';
        
        // Prepare header icon data
        const hasHeaderIcon = !!(activity.favicon && activity.favicon.startsWith('images/logos/'));
        const headerIconSrc = hasHeaderIcon ? activity.favicon : '';
        
        // Prepare tags array
        const tags = [];
        if (activity.duration) tags.push(activity.duration);
        if (activity.country) tags.push(activity.country);
        if (activity['role of the action']) tags.push(activity['role of the action']);
        
        // Prepare source display
        const sourceHtml = prepareSourceDisplay(activity.source);
        
        return {
            title: capitalizedTitle,
            description: description,
            hasDescription: !!description,
            hasHeaderIcon: hasHeaderIcon,
            headerIconSrc: headerIconSrc,
            tags: tags,
            hasTags: tags.length > 0,
            sourceHtml: sourceHtml
        };
    }

    // Prepare source display HTML
    function prepareSourceDisplay(source) {
        if (!source) {
            return Mustache.render(MustacheTemplates.sourceText, { text: 'N/A' });
        }
        
        if (source.startsWith('http') || source.startsWith('www')) {
            const displayUrl = source.length > 100 ? source.substring(0, 97) + '...' : source;
            return Mustache.render(MustacheTemplates.sourceLink, { 
                url: source, 
                displayText: displayUrl 
            });
        } else {
            return Mustache.render(MustacheTemplates.sourceText, { text: source });
        }
    }

    // Prepare data for info card template  
    function prepareInfoCardData(cardConfig) {
        return {
            header: cardConfig.header,
            content: cardConfig.content,
            footer: cardConfig.footer || '',
            hasFooter: !!cardConfig.footer
        };
    }

    // Prepare data for modal template
    function prepareModalData(modalConfig) {
        // Handle footer content - extract URL and text from HTML if present
        let linkUrl = '#';
        let linkText = 'Learn more';
        
        if (modalConfig.footer) {
            if (modalConfig.footer.includes('<a')) {
                // Parse HTML footer to extract href and text
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = modalConfig.footer;
                const linkElement = tempDiv.querySelector('a');
                if (linkElement) {
                    linkUrl = linkElement.href;
                    linkText = linkElement.textContent;
                }
            } else {
                linkText = modalConfig.footer;
            }
        }
        
        return {
            iconSrc: modalConfig.icon || '',
            iconAlt: `${modalConfig.title || modalConfig.header || 'Modal'} Logo`,
            title: modalConfig.title || modalConfig.header || '',
            content: modalConfig.content || '',
            linkUrl: linkUrl,
            linkText: linkText
        };
    }

    // --- Reusable Card Creation Functions ---
    
    // Generic function to create a card element with common styling
    function createCard(className, content) {
        const card = document.createElement('div');
        card.className = className;
        if (typeof content === 'string') {
            card.innerHTML = content;
        }
        return card;
    }

    // Create source link or text display using Mustache templates
    function createSourceDisplay(source) {
        return prepareSourceDisplay(source);
    }

    // Generic function to create category cards using Mustache templates
    function createCategoryCard(categoryName, activities) {
        // Prepare data for template
        const templateData = prepareCategoryCardData(categoryName, activities);
        
        // Render with Mustache
        const cardContent = Mustache.render(MustacheTemplates.categoryCard, templateData);
        
        // Use className from config if available, otherwise fallback to default
        const className = (appConfig.templates && appConfig.templates.categoryCard && appConfig.templates.categoryCard.className) ||
            'bg-gray-card border border-gray-border border-l-4 border-l-accent-red rounded-lg p-6 sm:p-4 shadow-light cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-hover';
        
        const card = createCard(className, cardContent);
        card.addEventListener('click', () => showActivityView(categoryName, activities));
        return card;
    }

    // Generic function to create activity cards using Mustache templates
    function createActivityCard(activity) {
        if (Object.keys(activity).length === 0) return null;

        // Prepare data for template
        const templateData = prepareActivityCardData(activity);
        
        // Render with Mustache
        const cardContent = Mustache.render(MustacheTemplates.activityCard, templateData);
        
        // Use className from config if available, otherwise fallback to default
        const className = (appConfig.templates && appConfig.templates.activityCard && appConfig.templates.activityCard.className) ||
            'bg-white rounded-lg shadow-card mb-4 p-4';
        
        return createCard(className, cardContent);
    }

    // Generate info cards dynamically from configuration
    function generateInfoCards() {
        if (!appConfig.pages || !appConfig.pages.home || !appConfig.pages.home.content || !appConfig.pages.home.content.info) {
            return;
        }
        
        const infoCardsConfig = appConfig.pages.home.content.info.cards;
        if (!infoCardsConfig) return;
        
        // Find the info cards container in the existing HTML
        const infoCardsGrid = document.querySelector('#info-cards-section .grid');
        if (!infoCardsGrid) return;
        
        // Clear existing static cards (optional - could be kept for fallback)
        // infoCardsGrid.innerHTML = '';
        
        // Generate cards from configuration
        Object.keys(infoCardsConfig).forEach(cardKey => {
            const cardConfig = infoCardsConfig[cardKey];
            
            // Handle image cards differently
            if (cardConfig.content && cardConfig.content.startsWith('images/')) {
                // This is an image card - create and add it
                const imageCard = document.createElement('div');
                imageCard.className = 'bg-white rounded-lg shadow-sm p-0 max-[1011px]:hidden';
                imageCard.innerHTML = `<img src="${cardConfig.content}" alt="${cardConfig.footer || cardConfig.header}" class="w-full h-full object-cover rounded-lg">`;
                infoCardsGrid.appendChild(imageCard);
                return;
            }
            
            // Prepare data for template
            const templateData = prepareInfoCardData(cardConfig);
            
            // Render with Mustache
            const cardContent = Mustache.render(MustacheTemplates.infoCard, templateData);
            const className = (appConfig.templates && appConfig.templates.infoCard && appConfig.templates.infoCard.className) ||
                'bg-white rounded-lg shadow-sm p-6 flex flex-col justify-start items-start text-left';
            
            const card = createCard(className, cardContent);
            infoCardsGrid.appendChild(card);
        });
    }

    // --- Modal Logic ---
    // Show splash modal on page load
    splashModal.classList.remove('hidden');
    
    // Hide splash modal when continue button is clicked
    splashContinueButton.addEventListener('click', () => {
        splashModal.classList.add('hidden');
    });

    logo.addEventListener('click', () => {
        chorizoModal.classList.remove('hidden');
        setFabState('modal');
    });
    appTitle.addEventListener('click', () => {
        chorizoModal.classList.remove('hidden');
        setFabState('modal');
    });
    // zerowDataSpaceButton.addEventListener('click', () => {
    //     zerowModal.classList.remove('hidden');
    //     setFabState('modal');
    // });

    // closeChorizoModal.addEventListener('click', () => {
    //     chorizoModal.classList.add('hidden');
    //     if (fabState === 'info') {
    //         setFabState('home');
    //     }
    // });
    // closeZerowModal.addEventListener('click', () => {
    //     zerowModal.classList.add('hidden');
    //     if (fabState === 'info') {
    //         setFabState('home');
    //     }
    // });

    window.addEventListener('click', (event) => {
        let modalWasClosed = false;
        if (event.target === chorizoModal) {
            chorizoModal.classList.add('hidden');
            modalWasClosed = true;
        }
        if (event.target === zerowModal) {
            zerowModal.classList.add('hidden');
            modalWasClosed = true;
        }
        if (event.target === homeModal) {
            homeModal.classList.add('hidden');
            modalWasClosed = true;
        }
        if (event.target === splashModal) {
            splashModal.classList.add('hidden');
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
            const containerHelper = clearContainer(categoryCardsContainer, '');
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
        const containerHelper = clearContainer(categoryCardsContainer, 'No categories found.');
        if (!categories) {
            containerHelper.showEmpty();
            return;
        }
        
        for (const categoryName in categories) {
            const activities = categories[categoryName];
            const card = createCategoryCard(categoryName, activities);
            categoryCardsContainer.appendChild(card);
        }
    }

    function renderActivityCards(activities) {
        const containerHelper = clearContainer(activityCardsContainer, 'No activities found for this category.');
        if (!activities || activities.length === 0) {
            containerHelper.showEmpty();
            return;
        }
        
        activities.forEach(activity => {
            const card = createActivityCard(activity);
            if (card) { // Only append if card was created (not null for empty activities)
                activityCardsContainer.appendChild(card);
            }
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
            homeModal.classList.remove('hidden');
            setFabState('modal');
        } else if (fabState === 'category') {
            showCategoryView(); // This will also set FAB state to home via its own call to setFabState
        } else if (fabState === 'modal') { // Changed from 'info'
            chorizoModal.classList.add('hidden');
            zerowModal.classList.add('hidden');
            homeModal.classList.add('hidden');
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

    // Back to categories button
    const backToCategoriesButton = document.getElementById('back-to-categories-button');
    backToCategoriesButton.addEventListener('click', () => {
        showCategoryView();
    });

    // zerowDataSpaceButton.addEventListener('click', () => {
    //     zerowModal.classList.remove('hidden');
    //     setFabState('modal');
    // });
});
