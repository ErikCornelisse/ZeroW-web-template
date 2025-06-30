// Example: Mustache.js Migration Strategy
// Pre-process data for Mustache templates

// Add Mustache.js via CDN
// <script src="https://cdn.jsdelivr.net/npm/mustache@4.2.0/mustache.min.js"></script>

// Mustache templates
const templates = {
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
        {{#sourceDisplay}}
        {{{sourceHtml}}}
        {{/sourceDisplay}}
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
    `
};

// Data preparation functions
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
    const sourceDisplay = prepareSourceDisplay(activity.source);
    
    return {
        title: capitalizedTitle,
        description: description,
        hasDescription: !!description,
        hasHeaderIcon: hasHeaderIcon,
        headerIconSrc: headerIconSrc,
        tags: tags,
        hasTags: tags.length > 0,
        sourceDisplay: sourceDisplay.hasSource,
        sourceHtml: sourceDisplay.html
    };
}

function prepareSourceDisplay(source) {
    if (!source) {
        return {
            hasSource: true,
            html: Mustache.render(templates.sourceText, { text: 'N/A' })
        };
    }
    
    if (source.startsWith('http') || source.startsWith('www')) {
        const displayUrl = source.length > 100 ? source.substring(0, 97) + '...' : source;
        return {
            hasSource: true,
            html: Mustache.render(templates.sourceLink, { 
                url: source, 
                displayText: displayUrl 
            })
        };
    } else {
        return {
            hasSource: true,
            html: Mustache.render(templates.sourceText, { text: source })
        };
    }
}

// Usage example
function createActivityCardWithMustache(activity) {
    if (Object.keys(activity).length === 0) return null;

    // Prepare data for Mustache template
    const templateData = prepareActivityCardData(activity);
    
    // Render with Mustache
    const cardContent = Mustache.render(templates.activityCard, templateData);
    
    // Create and return DOM element
    const card = document.createElement('div');
    const className = (appConfig.templates && appConfig.templates.activityCard && appConfig.templates.activityCard.className) ||
        'bg-white rounded-lg shadow-card mb-4 p-4';
    
    card.className = className;
    card.innerHTML = cardContent;
    
    return card;
}

// Category card preparation
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

function createCategoryCardWithMustache(categoryName, activities) {
    const templateData = prepareCategoryCardData(categoryName, activities);
    const cardContent = Mustache.render(templates.categoryCard, templateData);
    
    const card = document.createElement('div');
    const className = (appConfig.templates && appConfig.templates.categoryCard && appConfig.templates.categoryCard.className) ||
        'bg-gray-card border border-gray-border border-l-4 border-l-accent-red rounded-lg p-6 sm:p-4 shadow-light cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-hover';
    
    card.className = className;
    card.innerHTML = cardContent;
    card.addEventListener('click', () => showActivityView(categoryName, activities));
    
    return card;
}
